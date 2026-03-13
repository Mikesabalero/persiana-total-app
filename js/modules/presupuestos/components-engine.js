// ============================================================
// components-engine.js — Motor de auto-carga de componentes
// ============================================================
// FASE 5: PROD_COMP_MAP eliminado. La relación Producto → Componente
// se consulta dinámicamente desde DATA.prod_comp (tabla Producto_Componentes
// cargada en ensureData('presupuestos') via router.js).
// ============================================================

import { DATA, _loadingEdit } from '../../core/state.js';
import { INSTALACION_PCT, PESO_M2, CAT_SEGURIDAD, CAT_EXTERIOR, CAT_INTERIOR } from '../../core/config.js';
import { fmt, cleanLabel } from '../../core/ui.js';

// --- Categorización de producto ---
export function getCategoria(prodId) {
    let pid = parseInt(prodId);
    if (CAT_SEGURIDAD.includes(pid)) return 'Seguridad';
    if (CAT_EXTERIOR.includes(pid)) return 'Exterior';
    if (CAT_INTERIOR.includes(pid)) return 'Interior';
    return null;
}

// --- Selección automática de motor ---
export function selectMotor(cat, peso, ancho, m2) {
    if (cat === 'Seguridad') {
        if (ancho < 6) {
            if (m2 <= 12) return 55;   // Tubular 140
            if (peso <= 340) return 50; // Paralelo 600
            if (peso <= 400) return 51; // Paralelo 700
        } else {
            // Ancho >= 6m: siempre motores grandes
            if (peso <= 440) return 52; // Paralelo 800
            if (peso <= 550) return 53; // Paralelo 1000
            return 54;                  // Paralelo 1500 (hasta 800kg)
        }
    } else if (cat === 'Exterior') {
        if (peso <= 115) return 56; // Tubular 60
        if (peso <= 200) return 55; // Tubular 140
        if (peso <= 330) return 50; // Paralelo 600
        if (peso <= 370) return 51; // Paralelo 700
        if (peso <= 450) return 52; // Paralelo 800
        if (peso <= 600) return 53; // Paralelo 1000
        return 54; // Paralelo 1500
    } else if (cat === 'Interior') {
        if (peso <= 35) return 144;
        if (peso <= 47) return 145;
        if (peso <= 70) return 146;
    }
    return null;
}

// --- Resolver material principal dinámicamente ---
// Reemplaza PROD_COMP_MAP consultando DATA.prod_comp
// DATA.prod_comp se carga en router.js → ensureData('presupuestos')
function getMaterialCompId(prodId) {
    let pid = parseInt(prodId);
    if (!pid || !DATA.prod_comp || DATA.prod_comp.length === 0) return null;
    let mapping = DATA.prod_comp.find(pc =>
        parseInt(pc.Producto_id || pc.Productos_id) === pid
    );
    if (mapping) return parseInt(mapping.Componente_id || mapping.Componentes_id);
    return null;
}

// --- Auto-carga de componentes para una unidad ---
export function autoLoadComponents(n) {
    if (_loadingEdit) return;
    console.log(`>>> autoLoadComponents(${n}) START`);
    let prodSelect = document.getElementById('u-' + n + '-prod');
    if (!prodSelect) { console.log("Missing prodSelect"); return; }
    let prodId = prodSelect.value;
    let tbody = document.getElementById('comps-u-' + n);
    let ancho = parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || 0;
    let alto = parseFloat(document.getElementById('u-' + n + '-alto')?.value) || 0;
    let tipoTrabajo = document.getElementById('u-' + n + '-tipo')?.value;

    console.log(`Params: tipo=${tipoTrabajo}, prodId=${prodId}, dim=${ancho}x${alto}`);

    let pid = parseInt(prodId);
    let cat = getCategoria(pid);

    // UI visibility management
    let isRep = (tipoTrabajo === 'Reparacion' || tipoTrabajo === 'Service');
    let isMotor = (tipoTrabajo === 'Motorizacion');
    let isPano = (tipoTrabajo === 'Cambio_pano');
    let isGuias = (tipoTrabajo === 'Cambio_guias');

    let divTipoRep = document.getElementById('div-u-' + n + '-tiporep');
    if (divTipoRep) divTipoRep.style.display = isRep ? 'block' : 'none';

    let accSelect = document.getElementById('u-' + n + '-accion');
    if (accSelect) {
        let accDiv = accSelect.closest('.form-group');
        // Hidden for: Reparacion, Motorizacion, Cambio_pano, Cambio_guias, and ALWAYS for Seguridad
        if (isRep || isMotor || isPano || isGuias || cat === 'Seguridad') {
            accDiv.style.display = 'none';
            if (isMotor || cat === 'Seguridad') accSelect.value = 'motor';
        } else {
            accDiv.style.display = 'block';
        }
    }
    if (prodSelect) {
        prodSelect.closest('.form-group').style.display = (isRep || isGuias) ? 'none' : 'block';
    }

    if (!isRep && !isGuias && !prodId) {
        console.log("Early return: No prodId and not Rep/Guias");
        tbody.innerHTML = ''; window.recalcUnidad(n); return;
    }
    if (isGuias && (!ancho || !alto)) {
        console.log("Early return: Guias without measurements");
        tbody.innerHTML = ''; window.recalcUnidad(n); return;
    }

    let accion = accSelect ? accSelect.value : 'motor';
    if (cat === 'Seguridad') accion = 'motor';

    let m2 = ancho * alto;
    let pesoM2 = PESO_M2[pid] || 5;
    let peso = m2 * pesoM2;

    // Set pct si no fue manual
    if (!window._manualInstPct[n]) {
        let pctInput = document.getElementById('inst-pct-u-' + n);
        if (pctInput) {
            pctInput.value = INSTALACION_PCT[tipoTrabajo] ?? 8;
        }
    }

    tbody.innerHTML = '';

    const addCustomLabor = (label, price) => {
        let moRow = document.createElement('tr');
        moRow.innerHTML = `
            <td><input list="none" value="${label}" disabled class="filter-input"></td>
            <td><input type="number" value="1" step="0.01" style="width:60px" oninput="recalcUnidad(${n})"></td>
            <td class="c-costo hide-margin">${price.toFixed(2)}</td>
            <td class="c-moneda hide-margin">ARS</td>
            <td class="hide-margin"><input type="number" value="0" style="width:60px" oninput="recalcUnidad(${n})"></td>
            <td class="c-precio">${fmt(price)}</td>
            <td class="c-subtotal">${fmt(price)}</td>
            <td class="c-iva">21%</td>
            <td><button class="btn-remove" onclick="this.closest('tr').remove();recalcUnidad(${n})">✕</button></td>
        `;
        tbody.appendChild(moRow);
    };

    let materialPriceTotal = 0;
    const addCompWithPrice = (id, qty) => {
        let comp = DATA.componentes.find(c => c.Id == id);
        if (comp) {
            window.addCompRowWithData(n, comp, qty);
            let tc = DATA.tc.Dolar_oficial || 1150;
            let costoArs = (comp.Moneda_costo === 'USD' ? comp.Costo_unitario * tc : comp.Costo_unitario) || 0;
            let pctArmado = comp.Porcentaje_Armado || comp.Pct_armado || 0;
            let costoBase = costoArs * (1 + pctArmado / 100);
            let precioUnit = costoBase * (1 + (comp.Margen_default || 40) / 100);
            materialPriceTotal += precioUnit * qty;
            return precioUnit * qty;
        }
        return 0;
    };

    if (isRep) {
        let tipoRep = document.getElementById('u-' + n + '-tiporep')?.value;
        if (!tipoRep) { window.recalcUnidad(n); return; }
        if (tipoRep === 'cambio_eje') {
            addCompWithPrice(150, parseFloat(ancho.toFixed(2)));
            addCompWithPrice(154, 1);
            addCompWithPrice(153, 2);
            addCompWithPrice(m2 <= 1.5 ? 151 : 152, 1);
        } else if (tipoRep === 'cambio_cinta') {
            addCompWithPrice(155, parseFloat((alto + 0.5).toFixed(2)));
        } else if (tipoRep === 'cambio_laterales') {
            addCompWithPrice(159, parseFloat(m2.toFixed(2)));
            addCompWithPrice(160, 1);
        } else if (tipoRep === 'cambio_resortes') {
            addCompWithPrice(158, 1);
        } else if (tipoRep === 'cambio_polea_tacos') {
            addCompWithPrice(m2 <= 1.5 ? 151 : 152, 1);
            addCompWithPrice(153, 2);
            addCompWithPrice(154, 1);
        } else if (tipoRep === 'bobinado_motor') {
            addCompWithPrice(115, 1);
        }
        addCustomLabor("Mano de obra reparación", Math.max(materialPriceTotal * 0.5, 40000));
        // Viáticos ya no se agregan como componentes. Se manejan globalmente en el bloque de Traslado.
    } else if (isMotor) {
        let motorId = selectMotor(cat, peso, ancho, m2);
        if (motorId) {
            window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
            let ejeId;
            let mId = Number(motorId);
            if (mId === 55) {
                ejeId = 147; // Eje 4"
            } else if ([50, 51].includes(mId)) {
                ejeId = 148; // Eje 5"
            } else {
                ejeId = 149; // Eje 7.5" Exagonal (motores 800, 1000, 1500)
            }
            if (cat === 'Seguridad') {
                addCompWithPrice(ejeId, parseFloat(ancho.toFixed(2)));
            } else {
                addCompWithPrice(ejeId, parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
            }
        }
        addCompWithPrice(58, 1);
    } else if (isPano) {
        let matCompId = getMaterialCompId(pid);
        if (matCompId) {
            addCompWithPrice(matCompId, m2);
            if (cat === 'Exterior') {
                addCompWithPrice(155, parseFloat((alto + 0.5).toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
            }
        }
        addCustomLabor("Mano de obra cambio paño", Math.max(materialPriceTotal * 0.5, 40000));
    } else if (isGuias) {
        let effectiveCat = cat || 'Exterior';
        if (effectiveCat === 'Seguridad') {
            let guiaId = (ancho <= 5) ? 60 : 61; // 60x50 hasta 5m, 100x60 mayor a 5m
            let cantGuia = Math.max(parseFloat(alto.toFixed(2)), 3); // mínimo 3ml
            window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == guiaId), cantGuia);
        } else {
            addCompWithPrice(63, parseFloat(alto.toFixed(2)));
        }
        addCustomLabor("Mano de obra cambio guías", Math.max(materialPriceTotal * 0.5, 40000));
    } else {
        let matCompId = getMaterialCompId(pid);
        if (matCompId) window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == matCompId), m2 > 0 ? parseFloat(m2.toFixed(2)) : 1);
        if (cat === 'Seguridad') {
            let motorId = selectMotor(cat, peso, ancho, m2);
            if (motorId) {
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
                let ejeId;
                let mId = Number(motorId);
                if (mId === 55) {
                    ejeId = 147; // Eje 4"
                } else if ([50, 51].includes(mId)) {
                    ejeId = 148; // Eje 5"
                } else {
                    ejeId = 149; // Eje 7.5" Exagonal (motores 800, 1000, 1500)
                }
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == ejeId), parseFloat(ancho.toFixed(2)));
            }
            let guiaId = (ancho <= 5) ? 60 : 61; // 60x50 hasta 5m, 100x60 mayor a 5m
            let cantGuia = Math.max(parseFloat(alto.toFixed(2)), 3); // mínimo 3ml
            window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == guiaId), cantGuia);
            addCompWithPrice(58, 1);
        } else if (cat === 'Exterior') {
            if (accion === 'motor') {
                let motorId = selectMotor(cat, peso, ancho, m2);
                if (motorId) {
                    window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
                    let ejeId;
                    let mId = Number(motorId);
                    if (mId === 55) {
                        ejeId = 147; // Eje 4"
                    } else if ([50, 51].includes(mId)) {
                        ejeId = 148; // Eje 5"
                    } else {
                        ejeId = 149; // Eje 7.5" Exagonal (motores 800, 1000, 1500)
                    }
                    window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == ejeId), parseFloat(ancho.toFixed(2)));
                } else {
                    window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                }
                if (pid === 27 || pid === 29) window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 161), Math.ceil(ancho / 0.4));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat(alto.toFixed(2)));
                addCompWithPrice(58, 1);
            } else if (accion === 'manual_cinta') {
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 151 : 152)), 1);
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 153), 2);
                addCompWithPrice(154, 1); addCompWithPrice(155, parseFloat((alto + 0.5).toFixed(2)));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 129), 2);
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat(alto.toFixed(2)));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == (alto <= 1.4 ? 120 : (alto <= 2.3 ? 121 : 122))), 1);
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == (alto <= 1.4 ? 126 : (alto <= 2.3 ? 127 : 157))), 1);
            } else if (accion === 'manual_antognetti') {
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 151 : 152)), 1);
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 153), 2);
                addCompWithPrice(154, 1); addCompWithPrice(156, parseFloat((alto + 0.5).toFixed(2)));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 129), 2);
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat(alto.toFixed(2)));
                window.addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 136 : 137)), 1);
            }
        }
    }
    window.recalcUnidad(n);
}
