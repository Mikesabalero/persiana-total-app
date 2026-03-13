// ============================================================
// formas-pago.js — CRUD de formas de pago
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiPost, apiPatch, apiDelete } from '../../core/api.js';
import { cleanLabel } from '../../core/ui.js';

export function openModalPago(pago = null) {
    document.getElementById('mpg-id').value = pago ? pago.Id || pago.id : '';
    document.getElementById('mpg-nombre').value = pago ? pago.Nombre || '' : '';
    document.getElementById('mpg-recargo').value = pago ? pago.Recargo_pct || 0 : '';
    document.getElementById('mpg-descuento').value = pago ? pago.Descuento_pct || 0 : '';
    document.getElementById('mpg-plazo').value = pago ? pago.Plazo_dias || 0 : '';
    document.getElementById('mpg-descripcion').value = pago ? pago.Descripcion || '' : '';
    document.getElementById('mpg-notas').value = pago ? pago.Notas || '' : '';
    document.getElementById('mpg-activo').checked = pago ? (pago.Activo !== false && pago.Activo !== 'false' && pago.Activo !== 0) : true;
    document.getElementById('mpg-title').textContent = pago ? 'Editar Forma de Pago' : 'Nueva Forma de Pago';
    document.getElementById('modal-pago').classList.add('show');
}

export function closeModalPago() {
    document.getElementById('modal-pago').classList.remove('show');
}

export async function savePago() {
    let id = document.getElementById('mpg-id').value;
    let data = {
        Nombre: document.getElementById('mpg-nombre').value,
        Recargo_pct: parseFloat(document.getElementById('mpg-recargo').value) || 0,
        Descuento_pct: parseFloat(document.getElementById('mpg-descuento').value) || 0,
        Plazo_dias: parseInt(document.getElementById('mpg-plazo').value) || 0,
        Descripcion: document.getElementById('mpg-descripcion').value,
        Notas: document.getElementById('mpg-notas').value,
        Activo: document.getElementById('mpg-activo').checked
    };
    try {
        if (id) {
            data.Id = parseInt(id);
            await apiPatch(TBL.formas_pago, data);
            let idx = DATA.formas_pago.findIndex(p => (p.Id || p.id) == id);
            if (idx >= 0) Object.assign(DATA.formas_pago[idx], data);
        } else {
            let res = await apiPost(TBL.formas_pago, [data]);
            data.Id = res[0].Id;
            DATA.formas_pago.push(data);
        }
        closeModalPago();
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}

export async function deletePago(id, nombre) {
    if (!confirm('¿Seguro que querés eliminar la forma de pago: ' + nombre + '?')) return;
    try {
        await apiDelete(TBL.formas_pago, id);
        DATA.formas_pago = DATA.formas_pago.filter(p => (p.Id || p.id) != id);
        if (window.loadConfig) window.loadConfig();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
}
