// ============================================================
// ui.js — Utilidades compartidas de UI
// ============================================================

import { PAGE_SIZE } from './config.js';
import { CLIENT_MAP } from './state.js';

// --- Formato moneda ---
export function fmt(n) {
    if (n == null) return '$0';
    return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// --- Limpieza de labels (acentos) ---
export function cleanLabel(text) {
    if (!text || typeof text !== 'string') return text || '';
    let s = text.replace(/_/g, ' ');
    const acentos = {
        'Instalacion nueva': 'Instalación nueva',
        'Cambio pano': 'Cambio paño',
        'Motorizacion': 'Motorización',
        'Cambio guias': 'Cambio guías',
        'Reparacion': 'Reparación',
    };
    return acentos[s] || s;
}

// --- Badge de estado ---
export function badgeHtml(estado) {
    let c = { 'Borrador': 'borrador', 'Enviado': 'enviado', 'Aprobado': 'aprobado', 'Rechazado': 'rechazado', 'Vencido': 'vencido', 'Facturado': 'facturado' };
    return '<span class="badge badge-' + (c[estado] || 'borrador') + '">' + cleanLabel(estado) + '</span>';
}

// --- Resolución de links NocoDB ---
export function resolveLink(row, field) {
    let v = row[field];
    if (!v) return null;
    if (typeof v === 'object' && Array.isArray(v) && v.length > 0) return v[0];
    if (typeof v === 'object' && (v.Id || v.id)) return v;
    return null;
}

export function resolveName(row, field, list, idField) {
    let link = resolveLink(row, field);
    if (!link) return '-';
    let id = link.Id || link.id || link;
    if (field === 'Clientes' && CLIENT_MAP[id]) return CLIENT_MAP[id].Nombre || '-';
    let found = list.find(i => (i.Id == id || i.id == id));
    if (found) return found.Nombre || found.Title || '-';
    return (link.Nombre || link.Title || '-');
}

// --- Paginación ---
export function renderPagination(containerId, pagingState, pageKey) {
    let container = document.getElementById(containerId);
    if (!container) return;
    let totalPages = Math.ceil(pagingState.total / PAGE_SIZE) || 1;
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:16px; color:var(--text)">
            <button class="btn btn-secondary btn-sm" onclick="prevPage('${pageKey}')" ${pagingState.page <= 1 ? 'disabled' : ''}>« Anterior</button>
            <span>Página ${pagingState.page} de ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" onclick="nextPage('${pageKey}')" ${pagingState.page >= totalPages ? 'disabled' : ''}>Siguiente »</button>
        </div>
    `;
}

// --- Spinner de carga ---
export function _showPageSpinner(pageId, show) {
    let page = document.getElementById('page-' + pageId);
    if (!page) return;
    if (show && getComputedStyle(page).position === 'static') {
        page.style.position = 'relative';
    }
    let existing = page.querySelector('.lazy-spinner');
    if (show && !existing) {
        let d = document.createElement('div');
        d.className = 'lazy-spinner';
        d.style.cssText = 'position:absolute;top:50px;left:50%;transform:translateX(-50%);z-index:99;background:var(--surface);padding:10px 20px;border-radius:20px;box-shadow:0 4px 6px rgba(0,0,0,0.1);display:flex;align-items:center;color:var(--text);font-size:1em;gap:10px;';
        d.innerHTML = '<div style="width:20px;height:20px;border:3px solid var(--border);border-top-color:var(--grad1);border-radius:50%;animation:spin .7s linear infinite"></div> Cargando datos...';
        page.prepend(d);
    } else if (!show && existing) {
        existing.remove();
    }
}

// --- Modales genéricos ---
export function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
export function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
export function closeVerPres() { document.getElementById('modal-ver-pres').classList.remove('show'); }
export function closeVerCliente() { document.getElementById('modal-ver-cliente').classList.remove('show'); }
export function closeModalCliente() { document.getElementById('modal-cliente').classList.remove('show'); }
export function closeModalEditComp() { document.getElementById('modal-edit-comp').classList.remove('show'); }

// --- Tab de configuración ---
export function showConfigTab(id, btn) {
    document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none');
    document.getElementById('config-' + id).style.display = 'block';
    document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
}
