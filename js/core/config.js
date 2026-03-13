// ============================================================
// config.js — Constantes, IDs de tablas y reglas de negocio
// ============================================================

// --- API NocoDB ---
export const API = 'https://nocodb.srv1323649.hstgr.cloud';
export const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
export const BASE = 'pru2fsphj43juyr';
export const H = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };

// --- IDs de tablas NocoDB ---
export const TBL = {
    clientes: 'mwby85581fhjy27',
    propiedades: 'm0dwlr7ccoim1kf',
    historial: 'mimh9lp8bkew4t0',
    categorias: 'mulo5ve82d9ex7q',
    productos: 'mdr6mo695g0qz6d',
    componentes: 'mgh9e1zivvhpg26',
    prod_comp: 'mmjzqw7v4que9q3',
    tc: 'mhj9fovlmv9036x',
    zonas: 'mottig5nmj5e3kx',
    presupuestos: 'mn1yyjyovvoyxme',
    lineas: 'mv1e9trh23j0q3o',
    servicios: 'mz8qrki3hz4y7iv',
    formas_pago: 'm2t4fnjie88gfo0',
    unidades: 'mix059xkpsz15um',
    anchos: 'mayai71j546g3as',
    historial_aumentos: 'myumlbp9hemi3cu'
};

// --- Paginación ---
export const PAGE_SIZE = 20;

// --- Firebase ---
export const firebaseConfig = {
    apiKey: "AIzaSyDbhin3nW4qySZbWsX3EZs-GAsTK5qfhYE",
    authDomain: "persiana-total.firebaseapp.com",
    projectId: "persiana-total",
    storageBucket: "persiana-total.firebasestorage.app",
    messagingSenderId: "572769200027",
    appId: "1:572769200027:web:60b41b57ce4632d674633e"
};

// --- Roles de usuario (UID → rol) ---
export const USER_ROLES = {
    'E6922Is70Db54pv2mioWpszvKru2': 'admin',
    'A5IKpIzEmbXN1SVQvwFKj4zIgbn1': 'admin'
};

// --- Reglas de negocio: Porcentaje de instalación por tipo de trabajo ---
export const INSTALACION_PCT = {
    'Instalacion_nueva': 8,
    'Cambio_pano': 8,
    'Cambio_guias': 8,
    'Motorizacion': 8,
    'Reparacion': 0,
    'Service': 0,
    'Otro': 0
};

// --- Peso por m² según producto ---
export const PESO_M2 = {
    16: 11, 17: 13, 18: 10, 19: 12, 20: 14,
    21: 4, 22: 7, 24: 3,
    25: 10, 26: 5, 27: 10, 28: 5, 29: 10
};

// NOTA: PROD_COMP_MAP fue eliminado intencionalmente.
// La relación Producto → Componentes se consulta dinámicamente
// desde la tabla prod_comp de NocoDB (ver components-engine.js).

// --- Categorías de productos ---
export const CAT_SEGURIDAD = [16, 17, 18, 19, 20];
export const CAT_EXTERIOR = [21, 22, 23, 24, 25, 26, 27, 28, 29];
export const CAT_INTERIOR = [31, 32];

// --- Etiquetas de reparación ---
export const REPAIR_LABELS = {
    'cambio_eje': 'Cambio de eje completo',
    'cambio_cinta': 'Cambio de cinta',
    'cambio_laterales': 'Cambio de laterales y flejes',
    'cambio_resortes': 'Cambio de resortes',
    'cambio_polea_tacos': 'Cambio polea, tacos y punteras',
    'bobinado_motor': 'Bobinado de motor'
};
