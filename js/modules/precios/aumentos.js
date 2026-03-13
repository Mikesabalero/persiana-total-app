// ============================================================
// aumentos.js — Aumentos masivos de precios e historial
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet, apiPost, apiPatch } from '../../core/api.js';
import { cleanLabel } from '../../core/ui.js';

export async function aplicarAumento() {
    let pctVal = document.getElementById('aumento-pct').value;
    let mode = document.querySelector('input[name="aumento-modo"]:checked').value;
    let selEl = document.getElementById('aumento-filtro');
    let selVal = selEl ? selEl.value : '';

    if (!pctVal) { alert('Ingresá un porcentaje'); return; }
    let pct = parseFloat(pctVal);
    if (pct === 0) return;
    if (!selVal) { alert('Seleccioná un valor de filtro válido'); return; }

    if (!confirm(`¿Aplicar aumento del ${pct}% a componentes (filtro: ${selVal})? Esta acción no se puede deshacer.`)) return;

    let toUpdate = DATA.componentes.filter(c => {
        if (mode === 'proveedor') return (c.Proveedor || '').trim() === selVal;
        if (mode === 'categoria') return c.Tipo_componente === selVal;
        return false;
    });

    if (toUpdate.length === 0) { alert('No hay componentes para actualizar con ese filtro'); return; }

    let patchData = [];
    let todayIso = new Date().toISOString().split('T')[0];
    toUpdate.forEach(c => {
        let costo = parseFloat(c.Costo_unitario || 0);
        let newCosto = costo * (1 + pct / 100);
        patchData.push({
            Id: c.Id || c.id,
            Costo_unitario: newCosto,
            Fecha_ult_actualizacion: todayIso
        });
        c.Costo_unitario = newCosto;
        c.Fecha_ult_actualizacion = todayIso;
    });

    try {
        await apiPatch(TBL.componentes, patchData);
        await apiPost(TBL.historial_aumentos, [{
            Fecha: todayIso,
            Tipo: mode,
            Detalle: selVal,
            Porcentaje: pct,
            Componentes_afectados: patchData.length
        }]);

        alert(`Se actualizaron ${patchData.length} componentes correctamente.`);
        DATA.componentes = await apiGet(TBL.componentes);
        if (window.loadPrecios) window.loadPrecios();
        document.getElementById('aumento-pct').value = '';
    } catch (e) {
        console.error(e);
        alert('Error al actualizar precios: ' + e.message);
    }
}

export function toggleAumentoModo() {
    let modeEl = document.querySelector('input[name="aumento-modo"]:checked');
    if (!modeEl) return;
    let mode = modeEl.value;
    let label = document.getElementById('label-aumento-filtro');
    let select = document.getElementById('aumento-filtro');
    if (!label || !select) return;

    select.innerHTML = '';

    if (mode === 'proveedor') {
        label.textContent = 'Proveedor';
        let provs = [...new Set(DATA.componentes.filter(c => c.Proveedor).map(c => c.Proveedor.trim()))].sort();
        if (provs.length === 0) {
            select.innerHTML = '<option value="">No hay proveedores definidos</option>';
        } else {
            provs.forEach(p => { select.innerHTML += `<option value="${p}">${p}</option>`; });
        }
    } else if (mode === 'categoria') {
        label.textContent = 'Tipo de Componente';
        let cats = ['Material', 'Motor', 'Accesorio', 'Mano_obra', 'Viatico', 'Reparacion'];
        cats.forEach(c => { select.innerHTML += `<option value="${c}">${c}</option>`; });
    }
}

export async function loadHistorialPrecios() {
    let body = document.getElementById('historial-precios-table');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando historial...</td></tr>';
    try {
        let history = await apiGet(TBL.historial_aumentos, '&sort=-Id');
        body.innerHTML = '';
        if (history.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros</td></tr>';
        } else {
            history.forEach(h => {
                let pDateStr = '-';
                if (h.Fecha) {
                    let pDate = new Date(h.Fecha);
                    let pDateLocal = new Date(pDate.getTime() + pDate.getTimezoneOffset() * 60000);
                    pDateStr = pDateLocal.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                }
                body.innerHTML += `<tr>
                    <td>${pDateStr}</td>
                    <td style="text-transform: capitalize;">${cleanLabel(h.Tipo || '-')}</td>
                    <td>${cleanLabel(h.Detalle || '-')}</td>
                    <td>${h.Porcentaje || 0}%</td>
                    <td>${h.Componentes_afectados || 0}</td>
                </tr>`;
            });
        }
    } catch (e) {
        console.error(e);
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al cargar historial</td></tr>';
    }
}
