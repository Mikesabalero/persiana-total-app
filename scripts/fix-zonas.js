#!/usr/bin/env node
'use strict';

const BASE = 'http://127.0.0.1:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const HEADERS = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };

const TBL_ZONAS = 'mottig5nmj5e3kx';
const TBL_PROPS = 'm0dwlr7ccoim1kf';

async function get(table, limit = 200) {
  const r = await fetch(`${BASE}/api/v2/tables/${table}/records?limit=${limit}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`GET ${table} failed: ${r.status} ${await r.text()}`);
  const d = await r.json();
  return d.list || [];
}

async function patch(table, body) {
  const r = await fetch(`${BASE}/api/v2/tables/${table}/records`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`PATCH ${table} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  console.log('=== fix-zonas.js ===\n');

  // ── TAREA 1: Renombrar zonas ──
  console.log('--- TAREA 1: Renombrar zonas ---');
  let zonas = await get(TBL_ZONAS, 100);
  console.log(`Zonas encontradas: ${zonas.length}`);
  zonas.forEach(z => console.log(`  [${z.Id}] ${z.Nombre}`));

  const renames = [
    { from: 'Zona Centro', to: 'Santa Fe' },
    { from: 'Zona Norte Santa Fe', to: 'Zona Norte' },
  ];

  let zonasRenamed = 0;
  for (const r of renames) {
    const zona = zonas.find(z => z.Nombre === r.from);
    if (!zona) {
      console.log(`  SKIP: No se encontró zona "${r.from}"`);
      continue;
    }
    console.log(`  Renombrando [${zona.Id}] "${r.from}" → "${r.to}"...`);
    await patch(TBL_ZONAS, { Id: zona.Id, Nombre: r.to });
    zona.Nombre = r.to; // actualizar en memoria para tarea 2
    zonasRenamed++;
    console.log(`  OK`);
  }

  // Refrescar zonas después de rename
  zonas = await get(TBL_ZONAS, 100);
  console.log(`\nZonas actualizadas:`);
  zonas.forEach(z => console.log(`  [${z.Id}] ${z.Nombre}`));

  // ── TAREA 2: Asignar Zona_id a propiedades sin zona ──
  console.log('\n--- TAREA 2: Asignar Zona_id a propiedades ---');
  const props = await get(TBL_PROPS, 500);
  console.log(`Propiedades encontradas: ${props.length}`);

  let updated = 0;
  const sinZona = [];

  for (const p of props) {
    const zonaId = p.Zona_id || (p.Zonas ? (Array.isArray(p.Zonas) ? p.Zonas[0]?.Id : p.Zonas) : null);
    if (zonaId) {
      console.log(`  [${p.Id}] "${p.Direccion || p.Nombre}" ya tiene Zona_id=${zonaId}`);
      continue;
    }

    const localidad = p.Localidad;
    if (!localidad) {
      sinZona.push({ Id: p.Id, Direccion: p.Direccion || p.Nombre, Localidad: '(vacía)' });
      console.log(`  SIN ZONA: [${p.Id}] "${p.Direccion || p.Nombre}" - Localidad: (vacía)`);
      continue;
    }

    const zonaMatch = zonas.find(z => z.Nombre === localidad);
    if (!zonaMatch) {
      sinZona.push({ Id: p.Id, Direccion: p.Direccion || p.Nombre, Localidad: localidad });
      console.log(`  SIN ZONA: [${p.Id}] "${p.Direccion || p.Nombre}" - Localidad: "${localidad}"`);
      continue;
    }

    console.log(`  Asignando [${p.Id}] "${p.Direccion || p.Nombre}" → Zona "${zonaMatch.Nombre}" (Id=${zonaMatch.Id})...`);
    await patch(TBL_PROPS, { Id: p.Id, Zona_id: zonaMatch.Id });
    updated++;
    console.log(`  OK`);
  }

  // ── RESUMEN ──
  console.log('\n=== RESUMEN ===');
  console.log(`Zonas renombradas: ${zonasRenamed}`);
  console.log(`Propiedades actualizadas: ${updated}`);
  console.log(`Sin zona asignada: ${sinZona.length}`);
  if (sinZona.length > 0) {
    sinZona.forEach(s => console.log(`  - [${s.Id}] "${s.Direccion}" (Localidad: "${s.Localidad}")`));
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
