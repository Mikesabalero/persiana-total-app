// ============================================================
// anchos.js — CRUD de anchos PVC
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiPost, apiPatch, apiDelete } from '../../core/api.js';

export function openModalAncho(ancho = null) {
    document.getElementById('ma-id').value = ancho ? ancho.Id || ancho.id : '';
    document.getElementById('ma-solicitado').value = ancho ? ancho.Ancho_solicitado_hasta || '' : '';
    document.getElementById('ma-real').value = ancho ? ancho.Ancho_real_pano || '' : '';
    document.getElementById('ma-notas').value = ancho ? ancho.Notas || '' : '';
    document.getElementById('ma-title').textContent = ancho ? 'Editar Ancho PVC' : 'Nuevo Ancho PVC';
    document.getElementById('modal-ancho').classList.add('show');
}

export function closeModalAncho() {
    document.getElementById('modal-ancho').classList.remove('show');
}

export async function saveAncho() {
    let id = document.getElementById('ma-id').value;
    let data = {
        Ancho_solicitado_hasta: parseFloat(document.getElementById('ma-solicitado').value) || 0,
        Ancho_real_pano: parseFloat(document.getElementById('ma-real').value) || 0,
        Notas: document.getElementById('ma-notas').value
    };
    try {
        if (id) {
            data.Id = parseInt(id);
            await apiPatch(TBL.anchos, data);
            let idx = DATA.anchos.findIndex(a => (a.Id || a.id) == id);
            if (idx >= 0) Object.assign(DATA.anchos[idx], data);
        } else {
            let res = await apiPost(TBL.anchos, [data]);
            data.Id = res[0].Id;
            DATA.anchos.push(data);
        }
        closeModalAncho();
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}

export async function deleteAncho(id, anchoSol) {
    if (!confirm('¿Seguro que querés eliminar el ancho hasta: ' + anchoSol + ' ?')) return;
    try {
        await apiDelete(TBL.anchos, id);
        DATA.anchos = DATA.anchos.filter(a => (a.Id || a.id) != id);
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
}
