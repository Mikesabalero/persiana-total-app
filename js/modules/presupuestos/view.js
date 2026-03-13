import { DATA } from '../../core/state.js';
import { TBL, REPAIR_LABELS } from '../../core/config.js';
import { apiGet, apiGetAll, apiGetLinks } from '../../core/api.js';
import { fmt, cleanLabel, badgeHtml, closeVerPres, resolveLink, resolveName } from '../../core/ui.js';

export async function fetchBudgetDeepData(presId) {
    let client = {}, zona = {}, pago = '-';
    let clLinks = await apiGetLinks(TBL.presupuestos, 'canpten8owymbde', presId);
    if (clLinks.length > 0) client = clLinks[0];
    let zoneLinks = await apiGetLinks(TBL.presupuestos, 'cr3s0ox51qopwl4', presId);
    if (zoneLinks.length > 0) zona = zoneLinks[0];
    let payLinks = await apiGetLinks(TBL.presupuestos, 'cr9l2n9wiubrcra', presId);
    if (payLinks.length > 0) pago = payLinks[0].Nombre || payLinks[0].Title || 'A convenir';
    if (!pago || pago === '-') pago = 'A convenir';
    let propLink = await apiGetLinks(TBL.presupuestos, 'cpf764utp1w7yj0', presId);
    let propDir = '-';
    if (propLink.length > 0) {
        let propFull = DATA.propiedades.find(pr => pr.Id == propLink[0].Id);
        propDir = propFull ? (propFull.Direccion || '-') + ' - ' + (propFull.Localidad || '-') : propLink[0].Nombre || '-';
    }
    DATA.unidades = await apiGet(TBL.unidades);
    DATA.lineas = await apiGet(TBL.lineas);
    let presUnidades = [];
    for (let u of DATA.unidades) {
        let pLink = resolveLink(u, 'Presupuestos');
        if (pLink && (pLink.Id == presId || pLink.id == presId)) {
            let prodLinks = await apiGetLinks(TBL.unidades, 'co1b5kwpl8d2rya', u.Id);
            if (prodLinks.length > 0) {
                u._productoId = prodLinks[0].Id;
                u._productoNombre = prodLinks[0].Nombre || prodLinks[0].Title || '';
            } else {
                let prodLink = resolveLink(u, 'Producto_base');
                if (prodLink) { u._productoId = prodLink.Id || prodLink.id; u._productoNombre = prodLink.Nombre || prodLink.Title || ''; }
                else if (u.Producto_base && typeof u.Producto_base === 'number') {
                    let prod = DATA.productos.find(p => p.Id == u.Producto_base);
                    if (prod) { u._productoId = prod.Id; u._productoNombre = prod.Nombre || ''; }
                }
            }
            presUnidades.push(u);
        }
    }
    presUnidades.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
    let presLineas = [];
    for (let l of DATA.lineas) {
        let pLink = resolveLink(l, 'Presupuestos');
        let matchesPres = pLink && (pLink.Id == presId || pLink.id == presId);
        let uLink = resolveLink(l, 'Presupuesto_Unidades');
        let uId = uLink ? (uLink.Id || uLink.id) : null;
        let matchesUnit = uId && presUnidades.some(u => u.Id == uId);
        if (matchesPres || matchesUnit) {
            l._unidadId = uId;
            let cLink = resolveLink(l, 'Componentes');
            if (cLink) l._componenteId = cLink.Id || cLink.id;
            presLineas.push(l);
        }
    }
    return { client, zona, pago, propDir, unidades: presUnidades, lineas: presLineas };
}

export async function viewPresupuesto(presId) {
    let pres = DATA.presupuestos.find(p => p.Id == presId);
    if (!pres) return;
    document.getElementById('vp-contenido').innerHTML = '<p style="text-align:center;padding:20px">Cargando detalles...</p>';
    document.getElementById('modal-ver-pres').classList.add('show');
    let res = await fetchBudgetDeepData(presId);
    let client = res.client;
    let zona = res.zona;
    let pago = res.pago;
    let propAddr = pres._propiedadDir || res.propDir || '-';

    document.getElementById('vp-titulo').textContent = 'Presupuesto #' + pres.Numero;
    document.getElementById('vp-fecha').textContent = new Date(pres.Fecha).toLocaleDateString();
    document.getElementById('vp-cliente').textContent = cleanLabel(client.Nombre) || '-';
    document.getElementById('vp-propiedad').textContent = cleanLabel(propAddr) || '-';
    document.getElementById('vp-zona').textContent = cleanLabel(zona.Nombre) || '-';
    document.getElementById('vp-estado').innerHTML = badgeHtml(pres.Estado);
    document.getElementById('vp-pago').textContent = cleanLabel(pago);

    let html = '';
    res.unidades.forEach(u => {
        let prodName = u._productoNombre || '';
        if (!prodName && u._productoId) {
            let prod = DATA.productos.find(p => p.Id == u._productoId);
            if (prod) prodName = prod.Nombre;
        }
        let uLines = res.lineas.filter(l => l._unidadId == u.Id);
        uLines.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
        let unitTotal = uLines.reduce((acc, l) => acc + (parseFloat(l.Subtotal_con_IVA) || 0), 0);
        let measures = u.Ancho_m && u.Alto_m ? ` (${u.Ancho_m}m × ${u.Alto_m}m)` : '';
        let isRepair = u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service';
        let prodLine = `<strong>Producto:</strong> ${cleanLabel(prodName) || '-'} `;
        if (isRepair) {
            let repName = REPAIR_LABELS[u.Tipo_reparacion] || 'Reparación / Service';
            prodLine = `<strong>Reparación:</strong> ${repName} `;
        }
        html += `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px">
                <h4 style="margin:0;color:var(--grad1)">${cleanLabel(u.Nombre)} - ${cleanLabel(u.Ubicacion) || ''}${measures}</h4>
                <span style="font-size:0.9em; color:#6b7280; font-weight:bold">${cleanLabel(u.Tipo_trabajo) || ''}</span>
            </div>
            <div style="font-size:0.9em;color:#6b7280;margin-bottom:8px">${prodLine}</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: #374151; list-style-type: disc;">`;
        if (isRepair) html += `<li style="margin-bottom:2px">Incluye mano de obra</li>`;
        uLines.forEach(l => {
            html += `<li style="margin-bottom:2px">${cleanLabel(l.Descripcion_pdf)} (${l.Cantidad}) — ${fmt(l.Subtotal_ARS)}</li>`;
        });

        if (!isRepair && u.Pct_instalacion > 0) {
            html += `<li style="margin-bottom:2px">Instalación (${u.Pct_instalacion}%): ${fmt(u.Monto_instalacion || 0)}</li>`;
            unitTotal += parseFloat(u.Monto_instalacion) || 0;
        }

        html += `</ul><div style="text-align:right; margin-top:10px; font-size:1.1em;"><strong>Precio unidad: ${fmt(unitTotal)}</strong></div></div>`;
    });
    document.getElementById('vp-contenido').innerHTML = html;

    let billingMode = pres.Facturacion;
    if (!billingMode) {
        let allRepair = res.unidades.every(u => u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service');
        billingMode = allRepair ? 'sin_iva' : 'con_iva';
    }

    document.getElementById('vp-subtotal').textContent = fmt(pres.Subtotal_neto);

    let boxTraslado = document.getElementById('vp-line-traslado');
    if (pres.Costo_traslado > 0) {
        boxTraslado.style.display = 'flex';
        document.getElementById('vp-traslado').textContent = fmt(pres.Costo_traslado);
    } else {
        boxTraslado.style.display = 'none';
    }

    document.getElementById('vp-iva').textContent = fmt((pres.IVA_21 || 0) + (pres.IVA_105 || 0));
    document.getElementById('vp-total').textContent = fmt(pres.Total_con_IVA);

    // Summary View Fix: Only show discount/net-total if con_iva
    let summaryBox = document.querySelector('#modal-ver-pres .resumen-box');
    if (summaryBox) {
        // En index.html no hay IDs para estas líneas específicas, pero viewPresupuesto (línea 1228+)
        // solo actualiza subtotal, iva y total. Si quisiéramos mostrar el descuento en la vista
        // de presupuesto como en el PDF, tendríamos que inyectar HTML extra aquí.
        // Dado que el requerimiento se enfoca en el PDF y el default, mantengo la coherencia.
    }

    let btnEdit = document.getElementById('vp-btn-editar');
    btnEdit.onclick = function () {
        closeVerPres(); pres._clienteData = client; pres._zonaData = zona; pres._pagoNombre = pago; pres._unidades = res.unidades; pres._lineas = res.lineas;
        window.openNewPres(pres);
    };
    document.getElementById('vp-btn-pdf').onclick = function () { window.generarPDF(presId); };
}
