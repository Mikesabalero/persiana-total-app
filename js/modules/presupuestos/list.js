// ============================================================
// js/modules/presupuestos/list.js
// Listado, filtrado y operaciones CRUD de presupuestos
// ============================================================

import { DATA, PAGING } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet, apiGetPaged, apiPost, apiPatch, apiDelete, apiLink } from '../../core/api.js';
import { fmt, cleanLabel, badgeHtml, resolveLink, resolveName, renderPagination, _showPageSpinner } from '../../core/ui.js';
import { _resolvePresupuestoLinks, reloadAllData, ensureData, showPage } from '../../core/router.js';

async function loadPresupuestos() {
    _showPageSpinner('presupuestos', true);

    let search = document.getElementById('pres-search')?.value || '';
    let estado = document.getElementById('pres-filter-estado')?.value || '';

    let parts = [];
    if(search) parts.push(`(Numero,like,%${search}%)~or(Numero,eq,${search})`); // Assuming searching by numero mainly
    if(estado) parts.push(`(Estado,eq,${estado})`);

    let extra = '&sort=-Fecha';
    if (parts.length > 0) {
        extra += `&where=(${parts.join('~and')})`;
    }

    let res = await apiGetPaged(TBL.presupuestos, PAGING.presupuestos.page, extra);
    DATA.presupuestos = res.list;
    PAGING.presupuestos.total = res.total;

    await _resolvePresupuestoLinks();

    let tb = document.getElementById('pres-table');
    if (!tb) return;
    tb.innerHTML = '';
    DATA.presupuestos.forEach(p => {
        let cliName = p._clienteNombre;
        if (!cliName || cliName === '-') cliName = resolveName(p, 'Clientes', DATA.clientes);

        let propDir = p._propiedadDir;
        if (!propDir || propDir === '-') {
            let pr = resolveLink(p, 'Propiedades');
            if (pr) {
                let pfull = DATA.propiedades.find(x => x.Id == (pr.Id || pr.id));
                if (pfull) propDir = (pfull.Direccion || '-') + ' - ' + (pfull.Localidad || '-');
            }
        }

        let zonaName = p._zonaNombre;
        if (!zonaName || zonaName === '-') zonaName = resolveName(p, 'Zonas', DATA.zonas);

        cliName = cleanLabel(cliName) || '-';
        propDir = cleanLabel(propDir) || '-';
        zonaName = cleanLabel(zonaName) || '-';

        let iva = (p.IVA_21 || 0) + (p.IVA_105 || 0);
        let id = p.Id || p.id;

        let actions = '<div style="display:flex; gap:5px; align-items:center;">';
        actions += '<button class="btn btn-sm btn-secondary" onclick="viewPresupuesto(' + id + ')">Ver</button>';
        actions += '<button class="btn btn-sm btn-secondary" onclick="duplicatePresupuesto(' + id + ')" title="Duplicar">📑</button>';
        actions += '<button class="btn btn-sm btn-danger" onclick="deletePresupuesto(' + id + ')" title="Eliminar">🗑</button>';
        actions += '<select onchange="changeStatus(' + id + ', this.value)" style="padding:2px;font-size:12px">' +
            '<option value="Borrador" ' + (p.Estado == 'Borrador' ? 'selected' : '') + '>Borrador</option>' +
            '<option value="Enviado" ' + (p.Estado == 'Enviado' ? 'selected' : '') + '>Enviado</option>' +
            '<option value="Aprobado" ' + (p.Estado == 'Aprobado' ? 'selected' : '') + '>Aprobado</option>' +
            '<option value="Rechazado" ' + (p.Estado == 'Rechazado' ? 'selected' : '') + '>Rechazado</option>' +
            '<option value="Facturado" ' + (p.Estado == 'Facturado' ? 'selected' : '') + '>Facturado</option>' +
            '<option value="Vencido" ' + (p.Estado == 'Vencido' ? 'selected' : '') + '>Vencido</option>' +
            '</select></div>';

        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + propDir + '</td><td>' + zonaName + '</td><td>' + fmt(p.Subtotal_neto || p.Subtotal_items) + '</td><td>' + fmt(iva) + '</td><td><strong>' + fmt(p.Total_con_IVA || p.Total) + '</strong></td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td><td>' + actions + '</td></tr>';
    });

    renderPagination('pag-presupuestos', PAGING.presupuestos, 'presupuestos');
    _showPageSpinner('presupuestos', false);
}

function filterPresupuestos() {
    PAGING.presupuestos.page = 1;
    loadPresupuestos();
}

async function changeStatus(presId, newStatus) {
    if (!confirm('¿Cambiar estado a ' + newStatus + '?')) { loadPresupuestos(); return; }
    await apiPatch(TBL.presupuestos, { Id: presId, Estado: newStatus });
    let p = DATA.presupuestos.find(x => x.Id == presId);
    if (p) p.Estado = newStatus;
    loadPresupuestos();
}

async function duplicatePresupuesto(presId) {
    if (!confirm('¿Duplicar este presupuesto?')) return;
    let oldP = DATA.presupuestos.find(p => p.Id == presId);
    if (!oldP) return;
    let res = await window.fetchBudgetDeepData(presId);
    let year = new Date().getFullYear();
    let num = year + '-' + (String(DATA.presupuestos.length + 1).padStart(4, '0'));
    let tc = DATA.tc.Dolar_oficial || 1150;
    let presData = { Numero: num, Fecha: new Date().toISOString().split('T')[0], Estado: 'Borrador', TC_usado: tc, Canal: oldP.Canal, Quiere_factura: oldP.Quiere_factura, Incluye_instalacion: true };
    let newPres = await apiPost(TBL.presupuestos, presData);
    let newId = newPres.Id || newPres.id;
    if (res.client.Id) await apiLink(TBL.presupuestos, 'canpten8owymbde', newId, [{ Id: res.client.Id }]);
    if (res.zona.Id) await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', newId, [{ Id: res.zona.Id }]);
    let pagoObj = DATA.formas_pago.find(f => f.Nombre === res.pago);
    if (pagoObj) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', newId, [{ Id: pagoObj.Id }]);

    for (let u of res.unidades) {
        let uData = { Nombre: u.Nombre, Ubicacion: u.Ubicacion, Tipo_trabajo: u.Tipo_trabajo, Ancho_m: u.Ancho_m, Alto_m: u.Alto_m, M2_calculados: u.M2_calculados, Orden: u.Orden };
        let newU = await apiPost(TBL.unidades, uData);
        let newUId = newU.Id || newU.id;
        await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', newUId, [{ Id: newId }]);
        let lines = res.lineas.filter(l => l._unidadId == u.Id);
        for (let l of lines) {
            let lineaData = { Descripcion_pdf: l.Descripcion_pdf, Ancho_m: l.Ancho_m, Alto_m: l.Alto_m, Cantidad: l.Cantidad, M2_calculados: l.M2_calculados, Moneda_costo_orig: l.Moneda_costo_orig, Costo_unit_orig: l.Costo_unit_orig, TC_aplicado: l.TC_aplicado, Costo_unit_ARS: l.Costo_unit_ARS, Margen_pct: l.Margen_pct, Precio_unit_ARS: l.Precio_unit_ARS, Subtotal_ARS: l.Subtotal_ARS, Alicuota_IVA: l.Alicuota_IVA, Monto_IVA: l.Monto_IVA, Subtotal_con_IVA: l.Subtotal_con_IVA, Orden: l.Orden, Visible_pdf: true };
            let newLine = await apiPost(TBL.lineas, lineaData);
            let nLId = newLine.Id || newLine.id;
            await apiLink(TBL.lineas, 'c4hnodnss6zlr32', nLId, [{ Id: newId }]);
            await apiLink(TBL.lineas, 'cn9406tc3q1jmw0', nLId, [{ Id: newUId }]);
        }
    }
    await apiPatch(TBL.presupuestos, { Id: newId, Subtotal_neto: oldP.Subtotal_neto, Subtotal_items: oldP.Subtotal_items, IVA_21: oldP.IVA_21, IVA_105: oldP.IVA_105, Total_con_IVA: oldP.Total_con_IVA, Total: oldP.Total });
    alert('Presupuesto duplicado exitosamente.');
    await reloadAllData();
    await ensureData('presupuestos');
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);
}

async function deletePresupuesto(presId) {
    let p = DATA.presupuestos.find(x => x.Id == presId);
    if (!p) return;
    if (!confirm('¿Estás seguro de eliminar el presupuesto #' + (p.Numero || presId) + '?')) return;

    try {
        // Encontrar unidades y sus líneas asociadas
        let units = DATA.unidades.filter(u => {
            let link = resolveLink(u, 'Presupuestos');
            return link && (link.Id == presId || link.id == presId);
        });

        for (let u of units) {
            let lines = DATA.lineas.filter(l => {
                let link = resolveLink(l, 'Presupuesto_Unidades');
                return link && (link.Id == u.Id || link.id == u.Id);
            });
            for (let l of lines) await apiDelete(TBL.lineas, l.Id || l.id);
            await apiDelete(TBL.unidades, u.Id || u.id);
        }

        await apiDelete(TBL.presupuestos, presId);
        alert('Presupuesto eliminado correctamente');
        reloadAllData().then(() => ensureData('presupuestos')).then(() => showPage('presupuestos', document.querySelectorAll('.nav-item')[1]));
    } catch (e) {
        console.error(e);
        alert('Error al eliminar presupuesto: ' + e.message);
    }
}

export { loadPresupuestos, filterPresupuestos, changeStatus, duplicatePresupuesto, deletePresupuesto };
