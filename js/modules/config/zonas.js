// ============================================================
// zonas.js — CRUD de zonas de reparto
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiPost, apiPatch, apiDelete } from '../../core/api.js';

export function openModalZona(zona = null) {
    document.getElementById('mz-id').value = zona ? zona.Id || zona.id : '';
    document.getElementById('mz-nombre').value = zona ? zona.Nombre || '' : '';
    document.getElementById('mz-viatico').value = zona ? zona.Costo_viatico || 0 : '';
    document.getElementById('mz-transporte').value = zona ? zona.Costo_transporte || 0 : '';
    document.getElementById('mz-traslado').value = zona ? zona.Costo_traslado_service || 0 : '';
    document.getElementById('mz-tiempo').value = zona ? zona.Tiempo_viaje_hs || 0 : '';
    document.getElementById('mz-lat').value = zona ? zona.Lat_centro || '' : '';
    document.getElementById('mz-lon').value = zona ? zona.Lon_centro || '' : '';
    document.getElementById('mz-radio').value = zona ? zona.Radio_km || '' : '';
    document.getElementById('mz-notas').value = zona ? zona.Notas || '' : '';
    document.getElementById('mz-activo').checked = zona ? (zona.Activo !== false && zona.Activo !== 'false' && zona.Activo !== 0) : true;
    document.getElementById('mz-title').textContent = zona ? 'Editar Zona' : 'Nueva Zona';
    document.getElementById('modal-zona').classList.add('show');
}

export function closeModalZona() {
    document.getElementById('modal-zona').classList.remove('show');
}

export async function saveZona() {
    let id = document.getElementById('mz-id').value;
    let data = {
        Nombre: document.getElementById('mz-nombre').value,
        Costo_viatico: parseFloat(document.getElementById('mz-viatico').value) || 0,
        Costo_transporte: parseFloat(document.getElementById('mz-transporte').value) || 0,
        Costo_traslado_service: parseFloat(document.getElementById('mz-traslado').value) || 0,
        Tiempo_viaje_hs: parseFloat(document.getElementById('mz-tiempo').value) || 0,
        Lat_centro: parseFloat(document.getElementById('mz-lat').value) || null,
        Lon_centro: parseFloat(document.getElementById('mz-lon').value) || null,
        Radio_km: parseFloat(document.getElementById('mz-radio').value) || null,
        Notas: document.getElementById('mz-notas').value,
        Activo: document.getElementById('mz-activo').checked
    };
    try {
        if (id) {
            data.Id = parseInt(id);
            await apiPatch(TBL.zonas, data);
            let idx = DATA.zonas.findIndex(z => (z.Id || z.id) == id);
            if (idx >= 0) Object.assign(DATA.zonas[idx], data);
        } else {
            let res = await apiPost(TBL.zonas, [data]);
            data.Id = res[0].Id;
            DATA.zonas.push(data);
        }
        closeModalZona();
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}

export async function deleteZona(id, nombre) {
    if (!confirm('¿Seguro que querés eliminar la zona: ' + nombre + '?')) return;
    try {
        await apiDelete(TBL.zonas, id);
        DATA.zonas = DATA.zonas.filter(z => (z.Id || z.id) != id);
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
}
