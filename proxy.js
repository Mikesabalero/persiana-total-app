#!/usr/bin/env node
'use strict';

/**
 * Proxy seguro entre el frontend y NocoDB.
 * - Verifica el token Firebase de cada request
 * - Solo permite UIDs de la lista ALLOWED_UIDS
 * - Agrega el xc-token real al forward hacia NocoDB
 * - Escucha solo en 127.0.0.1 (no accesible desde internet)
 */

const http = require('http');

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────
const PORT = 3001;
const NOCODB_HOST = '127.0.0.1';
const NOCODB_PORT = 32770;

const NOCODB_TOKEN = process.env.NOCODB_TOKEN;
if (!NOCODB_TOKEN) {
    console.error('[proxy] ERROR: Variable de entorno NOCODB_TOKEN no definida.');
    console.error('[proxy] Crea un archivo .env con NOCODB_TOKEN=<tu-token> y arranca con:');
    console.error('[proxy]   NOCODB_TOKEN=xxx node proxy.js');
    process.exit(1);
}

const FIREBASE_PROJECT_ID = 'persiana-total';

// UIDs autorizados (los mismos que USER_ROLES en app.js)
const ALLOWED_UIDS = new Set([
    'E6922Is70Db54pv2mioWpszvKru2',
    'A5IKpIzEmbXN1SVQvwFKj4zIgbn1'
]);

// ──────────────────────────────────────────────
// Firebase token verification (sin firebase-admin,
// usando la clave pública de Google directamente)
// ──────────────────────────────────────────────
const https = require('https');
const crypto = require('crypto');

let _publicKeys = null;
let _keysExpiry = 0;

function fetchFirebasePublicKeys() {
    return new Promise((resolve, reject) => {
        const url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Calcular expiración desde el header Cache-Control
                    const cc = res.headers['cache-control'] || '';
                    const maxAgeMatch = cc.match(/max-age=(\d+)/);
                    const ttl = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3600000;
                    _keysExpiry = Date.now() + ttl;
                    _publicKeys = JSON.parse(data);
                    resolve(_publicKeys);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function getPublicKeys() {
    if (_publicKeys && Date.now() < _keysExpiry) return _publicKeys;
    return fetchFirebasePublicKeys();
}

function base64urlDecode(str) {
    // Convertir base64url a base64 estándar
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

async function verifyFirebaseToken(idToken) {
    const parts = idToken.split('.');
    if (parts.length !== 3) throw new Error('JWT malformado');

    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64urlDecode(headerB64).toString('utf8'));
    const payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8'));

    // Validar claims básicos
    const now = Math.floor(Date.now() / 1000);
    if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error('audience inválido');
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('issuer inválido');
    if (payload.exp < now) throw new Error('token expirado');
    if (payload.iat > now + 300) throw new Error('token del futuro');
    if (!payload.sub) throw new Error('sin subject');

    // Verificar firma con la clave pública de Google
    const keys = await getPublicKeys();
    const cert = keys[header.kid];
    if (!cert) throw new Error('kid desconocido');

    const signedData = `${headerB64}.${payloadB64}`;
    const signature = base64urlDecode(signatureB64);

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signedData);
    if (!verify.verify(cert, signature)) throw new Error('firma inválida');

    return payload; // { uid: payload.sub, email: payload.email, ... }
}

// ──────────────────────────────────────────────
// Servidor HTTP
// ──────────────────────────────────────────────
const server = http.createServer(async (req, res) => {

    // Headers CORS (el frontend está en el mismo origen via nginx, pero por las dudas)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ── 1. Verificar token Firebase ──
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No autorizado: falta token' }));
        return;
    }

    let uid;
    try {
        const payload = await verifyFirebaseToken(authHeader.slice(7));
        uid = payload.sub;
    } catch (e) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token inválido: ' + e.message }));
        return;
    }

    // ── 2. Verificar UID autorizado ──
    if (!ALLOWED_UIDS.has(uid)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Acceso denegado' }));
        return;
    }

    // ── 3. Leer body del request ──
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    await new Promise(resolve => req.on('end', resolve));
    const body = Buffer.concat(chunks);

    // ── 4. Hacer forward a NocoDB ──
    const options = {
        hostname: NOCODB_HOST,
        port: NOCODB_PORT,
        path: req.url,
        method: req.method,
        headers: {
            'xc-token': NOCODB_TOKEN,
            'content-type': req.headers['content-type'] || 'application/json',
        }
    };
    if (body.length > 0) {
        options.headers['content-length'] = body.length;
    }

    const proxyReq = http.request(options, (proxyRes) => {
        const contentType = proxyRes.headers['content-type'] || 'application/json';
        res.writeHead(proxyRes.statusCode, { 'content-type': contentType });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error('[proxy] Error al conectar con NocoDB:', e.message);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Error de conexión con la base de datos' }));
        }
    });

    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[proxy] Escuchando en 127.0.0.1:${PORT}`);
    console.log(`[proxy] Reenviando a NocoDB en ${NOCODB_HOST}:${NOCODB_PORT}`);
});
