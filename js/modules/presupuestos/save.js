// ============================================================
// save.js — Guardar presupuesto (crear/editar)
// ============================================================

import { DATA, editPresId } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet, apiPost, apiPatch, apiDelete, apiLink } from '../../core/api.js';
import { fmt, cleanLabel, closeModal } from '../../core/ui.js';
import { reloadAllData, ensureData, showPage } from '../../core/router.js';

export async function savePres() {
    // En modo edición, los selects de cliente/propiedad/zona están disabled.
    // Leer primero de data-attributes originales (guardados por form.js), con fallback al .value del select.
    let modalEl = document.querySelector('#modal-pres .modal');
    let clienteId = document.getElementById('np-cliente').value
        || (modalEl ? modalEl.getAttribute('data-original-cliente') : '');
    let zonaId = document.getElementById('np-zona').value
        || (modalEl ? modalEl.getAttribute('data-original-zona') : '');
    if (!clienteId || !zonaId) { alert('Completar Cliente y Zona'); return; }
    let tc = DATA.tc.Dolar_oficial || 1150;

    let presId = editPresId;
    let num = '';

    if (editPresId) {
        let oldP = DATA.presupuestos.find(p => p.Id == editPresId);
        num = oldP.Numero;
        await apiPatch(TBL.presupuestos, {
            Id: editPresId,
            Canal: document.getElementById('np-canal').value,
            Facturacion: document.getElementById('np-factura').value
        });
        // En edición, cliente/propiedad/zona no cambian pero re-linkear para consistencia
        await apiLink(TBL.presupuestos, 'canpten8owymbde', editPresId, [{ Id: parseInt(clienteId) }]);
        await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', editPresId, [{ Id: parseInt(zonaId) }]);
        let pagoId = document.getElementById('np-pago').value;
        if (pagoId) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', editPresId, [{ Id: parseInt(pagoId) }]);
        let propId = document.getElementById('np-propiedad').value
            || (modalEl ? modalEl.getAttribute('data-original-propiedad') : '');
        if (propId) await apiLink(TBL.presupuestos, 'cpf764utp1w7yj0', editPresId, [{ Id: parseInt(propId) }]);
    } else {
        let year = new Date().getFullYear();
        num = year + '-' + (String(DATA.presupuestos.length + 1).padStart(4, '0'));
        let client = document.getElementById('np-cliente').value;
        let prop = document.getElementById('np-propiedad').value;
        let zona = document.getElementById('np-zona').value;
        let pago = document.getElementById('np-pago').value;
        let canal = document.getElementById('np-canal').value;
        let facturacion = document.getElementById('np-factura').value;

        let presData = {
            Numero: num,
            TC_usado: tc,
            Clientes: client ? [{ Id: parseInt(client) }] : null,
            Propiedades: prop ? [{ Id: parseInt(prop) }] : null,
            Zonas: zona ? [{ Id: parseInt(zona) }] : null,
            Formas_pago: pago ? [{ Id: parseInt(pago) }] : null,
            Canal: canal,
            Facturacion: facturacion,
            Estado: 'Borrador',
            Fecha: new Date().toISOString().split('T')[0],
            Incluye_instalacion: true,
            Costo_traslado: parseFloat(document.getElementById('traslado-visitas')?.dataset.val) || 0,
            Visitas_traslado: parseInt(document.getElementById('traslado-visitas')?.value) || 0
        };
        let pres = await apiPost(TBL.presupuestos, presData);
        presId = pres.Id || pres.id;
        if (!presId) { alert('Error creando presupuesto'); return; }

        // Asegurar links mediante apiLink después del POST
        if (client) await apiLink(TBL.presupuestos, 'canpten8owymbde', presId, [{ Id: parseInt(client) }]);
        if (prop) await apiLink(TBL.presupuestos, 'cpf764utp1w7yj0', presId, [{ Id: parseInt(prop) }]);
        if (zona) await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', presId, [{ Id: parseInt(zona) }]);
        if (pago) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', presId, [{ Id: parseInt(pago) }]);
    }

    let subtotalNeto = 0, totalIva21 = 0, totalIva105 = 0;
    let unidadCards = document.querySelectorAll('[id^="unidad-"]');
    let processedUnitIds = [];

    // --- Cargar datos reales de las relaciones para evitar conteos ---
    let originalUnitsData = [];
    let originalLinesData = [];
    if (editPresId) {
        let deepData = await window.fetchBudgetDeepData(editPresId);
        originalUnitsData = deepData.unidades || [];
        originalLinesData = deepData.lineas || [];
    }

    for (let card of unidadCards) {
        let n = card.id.split('-')[1];
        let cardDbId = card.getAttribute('data-db-id');
        let uData = {
            Nombre: document.getElementById('u-' + n + '-nombre')?.value || 'Unidad ' + n,
            Ubicacion: document.getElementById('u-' + n + '-ubic')?.value || '',
            Tipo_trabajo: document.getElementById('u-' + n + '-tipo')?.value || 'Otro',
            Tipo_reparacion: document.getElementById('u-' + n + '-tiporep')?.value || null,
            Ancho_m: parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || null,
            Alto_m: parseFloat(document.getElementById('u-' + n + '-alto')?.value) || null,
            Accionamiento: document.getElementById('u-' + n + '-accion')?.value || 'motor',
            Pct_instalacion: parseFloat(document.getElementById('inst-pct-u-' + n)?.value) || 0,
            Monto_instalacion: parseFloat(document.getElementById('inst-monto-u-' + n)?.textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0,
            Orden: parseInt(n)
        };
        let ancho = uData.Ancho_m || 0;
        let alto = uData.Alto_m || 0;
        if (ancho && alto) uData.M2_calculados = ancho * alto;

        let uId = null;
        if (cardDbId) {
            await apiPatch(TBL.unidades, { Id: cardDbId, ...uData });
            uId = cardDbId;
            processedUnitIds.push(uId);
            let prodSelValEdit = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelValEdit) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelValEdit) }]);
        } else {
            let unidad = await apiPost(TBL.unidades, uData);
            uId = unidad.Id || unidad.id;
            processedUnitIds.push(uId);
            await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', uId, [{ Id: presId }]);
            let prodSelVal = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelVal) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelVal) }]);
        }

        // --- BORRAR LÍNEAS VIEJAS DE LA UNIDAD ANTES DE CREAR LAS NUEVAS ---
        if (cardDbId) {
            let originalLinesForUnit = originalLinesData.filter(l => {
                let link = l._unidadId || (l.Unidad?.Id) || l.Unidad;
                return (link == cardDbId);
            });
            for (let ol of originalLinesForUnit) {
                let imid = ol.Id || ol.id;
                await apiDelete(TBL.lineas, imid);
            }
        }

        let rows = document.querySelectorAll('#comps-u-' + n + ' tr');
        let orden = 0;

        for (let r of rows) {
            orden++;
            // Se ignora el data-db-id de la fila para forzar la creación como nueva línea
            let input = r.querySelector('input.filter-input');
            let compName = input ? input.value : '';
            let compId = DATA.componentes.find(c => cleanLabel(c.Nombre) === compName)?.Id || null;
            let costo = parseFloat(r.querySelector('.c-costo')?.textContent) || 0;
            let moneda = r.querySelector('.c-moneda')?.textContent || 'ARS';
            let iva = (r.querySelector('.c-iva')?.textContent || '21').replace(/%/g, '').trim();
            let inputs = r.querySelectorAll('input[type="number"]');
            let qty = parseFloat(inputs[0]?.value) || 1;
            let margen = parseFloat(inputs[1]?.value) || 0;
            let costoArs = moneda === 'USD' ? costo * tc : costo;
            let precioUnit = costoArs * (1 + margen / 100);
            let sub = precioUnit * qty;
            let montoIva = iva === '10.5' ? sub * 0.105 : sub * 0.21;

            let lineaData = {
                Descripcion_pdf: compName || 'Item',
                Ancho_m: parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || null,
                Alto_m: parseFloat(document.getElementById('u-' + n + '-alto')?.value) || null,
                Cantidad: qty,
                M2_calculados: uData.M2_calculados || null,
                Moneda_costo_orig: moneda,
                Costo_unit_orig: costo,
                TC_aplicado: moneda === 'USD' ? tc : null,
                Costo_unit_ARS: costoArs,
                Margen_pct: margen,
                Precio_unit_ARS: precioUnit,
                Subtotal_ARS: sub,
                Alicuota_IVA: iva.replace(/%/g, '').trim(),
                Monto_IVA: montoIva,
                Subtotal_con_IVA: sub + montoIva,
                Orden: orden,
                Visible_pdf: true
            };

            let linea = await apiPost(TBL.lineas, lineaData);
            let lineaId = linea.Id || linea.id;
            if (lineaId) {
                await apiLink(TBL.lineas, 'c4hnodnss6zlr32', lineaId, [{ Id: presId }]);
                if (compId) await apiLink(TBL.lineas, 'czka6po5myr5wu6', lineaId, [{ Id: parseInt(compId) }]);
                if (uId) await apiLink(TBL.lineas, 'cn9406tc3q1jmw0', lineaId, [{ Id: uId }]);
            }

            subtotalNeto += sub;
            if (iva === '10.5') totalIva105 += montoIva;
            else totalIva21 += montoIva;
        }
    }

    if (editPresId) {
        let originalUnits = originalUnitsData;
        for (let ou of originalUnits) {
            let ouId = ou.Id || ou.id;
            if (!processedUnitIds.includes(String(ouId)) && !processedUnitIds.includes(Number(ouId))) {
                let uLines = originalLinesData.filter(l => {
                    let link = l._unidadId || (l.Unidad?.Id) || l.Unidad;
                    return (link == ouId);
                });
                for (let l of uLines) await apiDelete(TBL.lineas, l.Id || l.id);
                await apiDelete(TBL.unidades, ouId);
            }
        }
    }

    let costoTraslado = parseFloat(document.getElementById('traslado-visitas')?.dataset.val) || 0;
    let visitasTraslado = parseInt(document.getElementById('traslado-visitas')?.value) || 0;

    let totalConIva = subtotalNeto + totalIva21 + totalIva105 + costoTraslado;
    let sinFact = totalConIva * 0.9;
    await apiPatch(TBL.presupuestos, {
        Id: presId,
        Subtotal_neto: subtotalNeto,
        Subtotal_items: subtotalNeto,
        Costo_traslado: costoTraslado,
        Visitas_traslado: visitasTraslado,
        IVA_21: totalIva21,
        IVA_105: totalIva105,
        Total_con_IVA: totalConIva,
        Total: totalConIva,
        Descuento_sin_factura_pct: 10,
        Total_sin_factura: sinFact
    });

    await reloadAllData();
    await ensureData('presupuestos');
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);
    closeModal();
    if (confirm('Presupuesto ' + num + ' guardado. ¿Ver ahora?')) window.viewPresupuesto(presId);
}
