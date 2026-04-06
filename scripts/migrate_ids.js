#!/usr/bin/env node
/**
 * migrate_ids.js — Migración única de presupuestos
 *
 * Recorre todos los presupuestos existentes, consulta apiGetLinks para
 * Cliente, Zona y Propiedad, y guarda los IDs en campos Number simples:
 *   Cliente_id, Zona_id, Propiedad_id
 *
 * Ejecutar UNA sola vez en el servidor antes del deploy:
 *   node scripts/migrate_ids.js
 *
 * Prerequisito: los campos Cliente_id, Zona_id, Propiedad_id ya deben
 * existir en la tabla Presupuestos de NocoDB (tipo Number).
 */

const API = 'http://127.0.0.1:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const H = { 'Content-Type': 'application/json', 'xc-token': TOKEN };

const TBL = {
  presupuestos: 'mn1yyjyovvoyxme',
};

// Column IDs de los links LTAR existentes
const COL_CLIENTE   = 'canpten8owymbde';  // Presupuestos ↔ Clientes
const COL_ZONA      = 'cr3s0ox51qopwl4';  // Presupuestos ↔ Zonas
const COL_PROPIEDAD = 'cpf764utp1w7yj0';  // Presupuestos ↔ Propiedades

async function apiGetAll(tid) {
  let all = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const url = `${API}/api/v2/tables/${tid}/records?limit=${limit}&offset=${offset}`;
    const r = await fetch(url, { headers: H });
    if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
    const d = await r.json();
    const list = d.list || [];
    all = all.concat(list);
    if (list.length < limit) break;
    offset += limit;
  }
  return all;
}

async function apiGetLinks(tid, colId, rowId) {
  const url = `${API}/api/v2/tables/${tid}/links/${colId}/records/${rowId}?limit=100`;
  const r = await fetch(url, { headers: H });
  if (!r.ok) return [];
  const d = await r.json();
  return d.list || [];
}

async function apiPatch(tid, body) {
  const url = `${API}/api/v2/tables/${tid}/records`;
  const r = await fetch(url, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`PATCH ${url} → ${r.status}`);
  return r.json();
}

async function main() {
  console.log('=== Migración de IDs de presupuestos ===');
  console.log('Obteniendo todos los presupuestos...');

  const presupuestos = await apiGetAll(TBL.presupuestos);
  console.log(`Total presupuestos: ${presupuestos.length}`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of presupuestos) {
    const id = p.Id;
    // Si ya tiene los 3 campos poblados, skip
    if (p.Cliente_id && p.Zona_id && p.Propiedad_id) {
      console.log(`  [SKIP] Presupuesto ${p.Numero || id} — ya tiene _id fields`);
      skipped++;
      continue;
    }

    try {
      const [clLinks, zLinks, pLinks] = await Promise.all([
        apiGetLinks(TBL.presupuestos, COL_CLIENTE, id),
        apiGetLinks(TBL.presupuestos, COL_ZONA, id),
        apiGetLinks(TBL.presupuestos, COL_PROPIEDAD, id),
      ]);

      const patch = { Id: id };
      let changed = false;

      if (!p.Cliente_id && clLinks.length > 0) {
        patch.Cliente_id = clLinks[0].Id;
        changed = true;
      }
      if (!p.Zona_id && zLinks.length > 0) {
        patch.Zona_id = zLinks[0].Id;
        changed = true;
      }
      if (!p.Propiedad_id && pLinks.length > 0) {
        patch.Propiedad_id = pLinks[0].Id;
        changed = true;
      }

      if (changed) {
        await apiPatch(TBL.presupuestos, patch);
        console.log(`  [OK] Presupuesto ${p.Numero || id} → Cliente_id=${patch.Cliente_id || '-'}, Zona_id=${patch.Zona_id || '-'}, Propiedad_id=${patch.Propiedad_id || '-'}`);
        migrated++;
      } else {
        console.log(`  [NOOP] Presupuesto ${p.Numero || id} — links vacíos, sin datos para migrar`);
        skipped++;
      }
    } catch (e) {
      console.error(`  [ERROR] Presupuesto ${p.Numero || id}: ${e.message}`);
      errors++;
    }
  }

  console.log('\n=== Resultado ===');
  console.log(`  Migrados: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errores:  ${errors}`);
  console.log(`  Total:    ${presupuestos.length}`);
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});
