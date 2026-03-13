// ============================================================
// api.js — Wrappers para NocoDB REST API
// ============================================================
// Límite subido de 200 → 1000 para cargar catálogos completos

import { API, H, TBL } from './config.js';
import { PAGE_SIZE } from './config.js';
import { CLIENT_MAP, resetClientMap } from './state.js';

// --- Funciones API core ---

export async function apiGet(tid, params = '') {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=1000' + params, { headers: H });
    if (!r.ok) return [];
    let d = await r.json();
    return d.list || [];
}

export async function apiGetAll(tid, params = '') {
    let all = [];
    let offset = 0;
    let limit = 1000;
    while (true) {
        let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=' + limit + '&offset=' + offset + params, { headers: H });
        if (!r.ok) break;
        let d = await r.json();
        let list = d.list || [];
        all = all.concat(list);
        if (list.length < limit) break;
        offset += limit;
    }
    return all;
}

export async function apiGetPaged(tid, page, extraParams = '') {
    let offset = (page - 1) * PAGE_SIZE;
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=' + PAGE_SIZE + '&offset=' + offset + extraParams, { headers: H });
    if (!r.ok) return { list: [], total: 0 };
    let d = await r.json();
    return { list: d.list || [], total: d.pageInfo?.totalRows || 0 };
}

export async function apiGetLinks(tid, colId, rowId) {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId + '?limit=10', { headers: H });
    if (!r.ok) return [];
    let d = await r.json();
    return d.list || [];
}

export async function apiPost(tid, body) {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'POST', headers: H, body: JSON.stringify(body) });
    return r.json();
}

export async function apiPatch(tid, body) {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'PATCH', headers: H, body: JSON.stringify(body) });
    return r.json();
}

export async function apiDelete(tid, id) {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'DELETE', headers: H, body: JSON.stringify({ Id: id }) });
    return r.json();
}

export async function apiLink(tid, colId, rowId, linked) {
    let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId, { method: 'POST', headers: H, body: JSON.stringify(linked) });
    return r.json();
}

// --- Carga de CLIENT_MAP (limit=1000) ---

export async function loadClientMap() {
    resetClientMap();
    let offset = 0;
    let limit = 1000;
    let hasMore = true;
    while (hasMore) {
        let url = API + '/api/v2/tables/' + TBL.clientes + '/records?fields=Id,Nombre,Telefono&limit=' + limit + '&offset=' + offset;
        let r = await fetch(url, { headers: H });
        if (!r.ok) break;
        let data = await r.json();
        let list = data.list || [];
        list.forEach(c => {
            let id = c.Id || c.id;
            if (id) CLIENT_MAP[id] = { Nombre: c.Nombre || '', Telefono: c.Telefono || '' };
        });
        if (list.length < limit) hasMore = false;
        offset += limit;
    }
    console.log('CLIENT_MAP cargado:', Object.keys(CLIENT_MAP).length, 'clientes');
}
