// ============================================================
// form.js — Formulario presupuesto, unidades, filas componentes
// ============================================================

import { DATA, _loadingEdit,
         editPresId, unidadCount,
         setEditPresId, setUnidadCount, setLoadingEdit } from '../../core/state.js';
import { TBL, INSTALACION_PCT } from '../../core/config.js';
import { apiGet } from '../../core/api.js';
import { fmt, cleanLabel, resolveLink, resolveName } from '../../core/ui.js';
import { ensureData } from '../../core/router.js';
import { getCategoria } from './components-engine.js';

// --- Helpers de selects de propiedad/zona ---
export async function updatePropiedadesSelect() {
    await loadPropiedadesSelect();
}

export async function loadPropiedadesSelect(presData) {
    let ps = document.getElementById('np-propiedad');
    if (!ps) return;
    let cliId = document.getElementById('np-cliente').value;
    ps.innerHTML = '<option value="">Seleccionar propiedad...</option>';
    if (!cliId) return;

    let props = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return (link && (link.Id == cliId || link.id == cliId)) || (p.Clientes_id == cliId);
    });

    if (props.length === 0) {
        try {
            let fetched = await apiGet(TBL.propiedades, `&where=(Clientes_id,eq,${cliId})`);
            if (fetched && fetched.length > 0) {
                fetched.forEach(f => {
                    if (!DATA.propiedades.find(x => x.Id == f.Id)) DATA.propiedades.push(f);
                });
                props = fetched;
            }
        } catch(e) { console.warn("Could not fetch properties", e); }
    }

    let selectedPropId = null;
    if (presData && presData.Id) {
        let pLink = resolveLink(presData, 'Propiedades');
        if (pLink) selectedPropId = pLink.Id || pLink.id;
    }

    props.forEach(p => {
        let sel = (selectedPropId && (p.Id == selectedPropId)) ? 'selected' : (props.length === 1 ? 'selected' : '');
        ps.innerHTML += '<option value="' + p.Id + '" ' + sel + '>' + cleanLabel(p.Direccion) + ' - ' + cleanLabel(p.Localidad) + '</option>';
    });
    if (props.length === 1 || selectedPropId) {
        let pId = selectedPropId || props[0].Id;
        updateZonaFromProp(pId);
    }
}

export function updateZonaFromProp(propId) {
    let zonaSelect = document.getElementById('np-zona');
    if (!propId) {
        if (zonaSelect) { zonaSelect.value = ''; zonaSelect.disabled = false; }
        recalcTraslado();
        return;
    }
    let prop = DATA.propiedades.find(p => String(p.Id) === String(propId));
    if (!prop) {
        if (zonaSelect) { zonaSelect.value = ''; zonaSelect.disabled = false; }
        recalcTraslado();
        return;
    }
    // Read Zona_id from property
    if (prop.Zona_id && zonaSelect) {
        zonaSelect.value = prop.Zona_id;
        zonaSelect.disabled = true;
        recalcTraslado();
        return;
    }
    // Fallback: try exact name match on Localidad
    let zone = DATA.zonas.find(z => z.Nombre === prop.Localidad);
    if (zone && zonaSelect) {
        zonaSelect.value = zone.Id;
        zonaSelect.disabled = true;
        recalcTraslado();
    } else if (zonaSelect) {
        zonaSelect.disabled = false;
    }
}

// --- Abrir formulario de presupuesto ---
export async function openNewPres(presData = null) { window._manualVisitas = false;
    // Asegurar datos de presupuestos cargados para editar
    await ensureData('presupuestos');
    // Cargar clientes si no están (lazy loading puede dejarlos vacíos)
    if (!DATA.clientes || DATA.clientes.length === 0) {
        DATA.clientes = await apiGet(TBL.clientes);
        DATA._loaded.clientes = true;
    }
    // Cargar componentes si no están (necesarios para addCompRowWithData)
    if (!DATA.componentes || DATA.componentes.length === 0) {
        DATA.componentes = await apiGet(TBL.componentes);
        DATA._loaded.precios = true;
    }
    // Actualizar datalist de clientes
    window.renderClientDatalist();
    setEditPresId(presData ? (presData.Id || presData.id) : null);

    // Reset Modal
    document.getElementById('modal-title').textContent = presData ? ('Editar Presupuesto ' + presData.Numero) : 'Nuevo Presupuesto';
    let modalEl = document.querySelector('#modal-pres .modal');
    if (modalEl) modalEl.setAttribute('data-db-id', presData ? presData.Id : '');

    // Populate Selects
    let cs = document.getElementById('np-cliente');
    cs.innerHTML = '<option value="">Seleccionar cliente...</option>';
    let editClienteId = null;
    DATA.clientes.forEach(c => {
        let sel = (presData && presData._clienteData && (presData._clienteData.Id == c.Id)) ? 'selected' : '';
        if (sel) editClienteId = c.Id;
        cs.innerHTML += '<option value="' + c.Id + '" ' + sel + '>' + cleanLabel(c.Nombre) + ' - ' + (c.Telefono || '') + '</option>';
    });
    // Forzar el valor explícitamente para evitar que se pierda
    if (editClienteId) cs.value = editClienteId;

    // Sincronizar buscador de clientes
    let searchInput = document.getElementById('np-pres-cliente-search');
    if (searchInput) {
        searchInput.value = (presData && presData._clienteData) ? cleanLabel(presData._clienteData.Nombre) : (presData ? resolveName(presData, 'Clientes', DATA.clientes) : '');
    }

    let zs = document.getElementById('np-zona');
    zs.disabled = false;
    zs.innerHTML = '<option value="">Seleccionar zona...</option>';
    DATA.zonas.forEach(z => {
        let sel = (presData && presData._zonaData && (presData._zonaData.Id == z.Id)) ? 'selected' : '';
        zs.innerHTML += '<option value="' + z.Id + '" ' + sel + '>' + cleanLabel(z.Nombre) + '</option>';
    });

    let ps = document.getElementById('np-pago');
    ps.innerHTML = '<option value="">Seleccionar...</option>';
    let pagoNombre = presData ? presData._pagoNombre : null;
    DATA.formas_pago.forEach(f => {
        let sel = (pagoNombre && f.Nombre == pagoNombre) ? 'selected' : '';
        ps.innerHTML += '<option value="' + f.Id + '" ' + sel + '>' + cleanLabel(f.Nombre) + '</option>';
    });

    // IMPORTANTE: await para que las propiedades se carguen ANTES de bloquear campos
    await loadPropiedadesSelect(presData);

    if (presData) {
        // MODO EDICIÓN: No inicializar setupClientSearch — el cliente NO se puede cambiar.
        // Forzar valores originales y bloquear campos.
        if (editClienteId) cs.value = editClienteId;
        if (searchInput) searchInput.value = cleanLabel(presData._clienteData?.Nombre || '');

        document.getElementById('np-pago').value = resolveLink(presData, 'Formas_pago')?.Id || '';
        document.getElementById('np-canal').value = presData.Canal || 'Manual';
        document.getElementById('np-factura').value = presData.Facturacion || 'con_iva';

        // Bloquear Cliente y Propiedad — no se puede cambiar en edición
        cs.disabled = true;
        if (searchInput) {
            searchInput.disabled = true;
            searchInput.style.pointerEvents = 'none';
        }
        document.getElementById('np-propiedad').disabled = true;
        document.getElementById('np-zona').disabled = true;
        // Ocultar el botón ▼ del buscador si existe (creado por setupClientSearch anterior)
        let oldDropdownBtn = searchInput?.parentElement?.querySelector('button');
        if (oldDropdownBtn) oldDropdownBtn.style.display = 'none';
        let oldDropdown = document.getElementById('np-pres-cliente-search-dropdown');
        if (oldDropdown) oldDropdown.style.display = 'none';

        // Guardar IDs originales como data-attributes para que save.js los lea de forma segura
        let modalEl2 = document.querySelector('#modal-pres .modal');
        if (modalEl2) {
            modalEl2.setAttribute('data-original-cliente', editClienteId || '');
            let propSel = document.getElementById('np-propiedad');
            modalEl2.setAttribute('data-original-propiedad', propSel ? propSel.value : '');
            modalEl2.setAttribute('data-original-zona', zs.value || '');
        }
    } else {
        // MODO NUEVO: inicializar búsqueda de clientes
        window.setupClientSearch("np-pres-cliente-search", "np-cliente");
        document.getElementById('np-pago').value = '';
        document.getElementById('np-canal').value = 'Manual';
        document.getElementById('np-factura').value = 'con_iva';
        cs.disabled = false;
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.style.pointerEvents = '';
        }
        document.getElementById('np-propiedad').disabled = false;
        document.getElementById('np-zona').disabled = false;
    }

    document.getElementById('np-unidades').innerHTML = '';
    recalcTraslado();

    // Si era edicion, restauramos manuales que recalcTraslado piso (si los hubiese):
    if (presData && presData.Costo_traslado) {
        document.getElementById('traslado-visitas').value = presData.Visitas_traslado || 1;
        document.getElementById('traslado-visitas').dataset.val = presData.Costo_traslado;
        document.getElementById('traslado-total').textContent = fmt(presData.Costo_traslado || 0);
    }

    document.getElementById('np-resumen').style.display = 'none';
    setUnidadCount(0);

    setLoadingEdit(true); window._manualVisitas = false;

    if (presData && presData._unidades && presData._unidades.length > 0) {
        // Load existing units
        for (let u of presData._unidades) {
            setUnidadCount(unidadCount + 1);
            let n = unidadCount;
            addUnidadUI(n, u);

            let lines = [];
            if (presData._lineas) {
                lines = presData._lineas.filter(l => l._unidadId == u.Id);
            }
            lines.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
            lines.forEach(l => {
                let compId = l._componenteId;
                let comp = null;
                if (compId) comp = DATA.componentes.find(c => c.Id == compId);
                else comp = DATA.componentes.find(c => c.Nombre === l.Descripcion_pdf);

                if (comp) addCompRowWithData(n, comp, l.Cantidad, l.Id);
                else {
                    let mockComp = {
                        Id: null,
                        Nombre: l.Descripcion_pdf,
                        Costo_unitario: l.Costo_unit_orig,
                        Moneda_costo: l.Moneda_costo_orig,
                        Margen_default: l.Margen_pct,
                        Alicuota_IVA_venta: l.Alicuota_IVA || '21'
                    };
                    addCompRowWithData(n, mockComp, l.Cantidad, l.Id);
                }
            });
            recalcUnidad(n);
        }
    } else {
        addUnidad();
    }

    recalcTotal();
    setLoadingEdit(false);
    document.getElementById('modal-pres').classList.add('show');
}

// --- Agregar unidad ---
export function addUnidad() {
    setUnidadCount(unidadCount + 1);
    addUnidadUI(unidadCount, null);
}

export function addUnidadUI(n, uData) {
    let uId = uData ? uData.Id : '';
    let selectedProd = uData ? uData._productoId : '';

    let prodOpts = '<option value="">Seleccionar producto...</option>';
    DATA.productos.forEach(p => {
        let sel = (selectedProd && String(p.Id) == String(selectedProd)) ? 'selected' : '';
        prodOpts += `<option value="${p.Id}" ${sel}>${cleanLabel(p.Nombre)}</option>`;
    });

    let nombre = uData ? uData.Nombre : '';
    let ubic = uData ? uData.Ubicacion || '' : '';
    let tipo = uData ? uData.Tipo_trabajo || 'Instalacion_nueva' : 'Instalacion_nueva';
    let ancho = uData ? (uData.Ancho_m || '') : '';
    let alto = uData ? (uData.Alto_m || '') : '';

    let accion = uData ? (uData.Accionamiento || 'motor') : 'motor';
    let cat = getCategoria(selectedProd);
    let hideAccion = (cat === 'Seguridad') ? 'display:none' : '';

    let tipoRep = uData ? (uData.Tipo_reparacion || '') : '';
    let showRep = (tipo == 'Reparacion' || tipo == 'Service') ? 'display:block' : 'display:none';

    let instPct = uData && uData.Pct_instalacion !== undefined ? parseFloat(uData.Pct_instalacion) : (INSTALACION_PCT[tipo] ?? 8);

    let html = '<div class="unidad-card" id="unidad-' + n + '" data-db-id="' + uId + '"><div class="unidad-header"><h3>Unidad ' + n + '</h3><div style="display:flex;gap:8px;align-items:center"><span class="unidad-subtotal" id="sub-u-' + n + '">$0</span><button class="btn-remove" onclick="duplicateUnidad(' + n + ')" title="Duplicar unidad">📋</button><button class="btn-remove" onclick="removeUnidad(' + n + ')" title="Eliminar">🗑</button></div></div>';
    html += '<div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;"><div class="form-group"><label>Ambiente</label><input id="u-' + n + '-nombre" placeholder="Ej: Dormitorio principal" value="' + nombre + '"></div>';
    html += '<div class="form-group"><label>Ubicación</label><input id="u-' + n + '-ubic" placeholder="Ej: Contra frente" value="' + ubic + '"></div>';
    html += '<div class="form-group"><label>Tipo Trabajo</label><select id="u-' + n + '-tipo" onchange="autoLoadComponents(' + n + ')"><option value="Instalacion_nueva" ' + (tipo == 'Instalacion_nueva' ? 'selected' : '') + '>Instalación nueva</option><option value="Cambio_pano" ' + (tipo == 'Cambio_pano' ? 'selected' : '') + '>Cambio paño</option><option value="Motorizacion" ' + (tipo == 'Motorizacion' ? 'selected' : '') + '>Motorización</option><option value="Cambio_guias" ' + (tipo == 'Cambio_guias' ? 'selected' : '') + '>Cambio guías</option><option value="Reparacion" ' + (tipo == 'Reparacion' ? 'selected' : '') + '>Reparación</option><option value="Service" ' + (tipo == 'Service' ? 'selected' : '') + '>Service</option><option value="Otro" ' + (tipo == 'Otro' ? 'selected' : '') + '>Otro</option></select></div>';
    html += '<div class="form-group" style="' + showRep + '" id="div-u-' + n + '-tiporep"><label>Tipo Reparación</label><select id="u-' + n + '-tiporep" onchange="autoLoadComponents(' + n + ')"><option value="">-- Elegir reparación --</option><option value="cambio_eje" ' + (tipoRep == 'cambio_eje' ? 'selected' : '') + '>Cambio de eje</option><option value="cambio_cinta" ' + (tipoRep == 'cambio_cinta' ? 'selected' : '') + '>Cambio de cinta</option><option value="cambio_laterales" ' + (tipoRep == 'cambio_laterales' ? 'selected' : '') + '>Cambio de laterales</option><option value="cambio_resortes" ' + (tipoRep == 'cambio_resortes' ? 'selected' : '') + '>Cambio de resortes</option><option value="cambio_polea_tacos" ' + (tipoRep == 'cambio_polea_tacos' ? 'selected' : '') + '>Cambio polea, tacos y punteras</option><option value="bobinado_motor" ' + (tipoRep == 'bobinado_motor' ? 'selected' : '') + '>Bobinado de motor</option></select></div>';
    html += '<div class="form-group" style="' + hideAccion + '"><label>Accionamiento</label><select id="u-' + n + '-accion" onchange="autoLoadComponents(' + n + ')"><option value="motor" ' + (accion == 'motor' ? 'selected' : '') + '>Con motor</option><option value="manual_cinta" ' + (accion == 'manual_cinta' ? 'selected' : '') + '>Manual a cinta</option><option value="manual_antognetti" ' + (accion == 'manual_antognetti' ? 'selected' : '') + '>Manual Antognetti</option></select></div>';
    html += '<div class="form-group"><label>Producto Base</label>';
    html += `<select id="u-${n}-prod" onchange="autoLoadComponents(${n})">${prodOpts}</select></div></div>`;

    // Auto-select billing mode
    if (unidadCount === 1) {
        let jobType = uData ? uData.Tipo_trabajo : '';
        let facturaSel = document.getElementById('np-factura');
        if (facturaSel) {
            if (jobType === 'Reparacion' || jobType === 'Service') {
                facturaSel.value = 'sin_iva';
            } else {
                facturaSel.value = 'con_iva';
            }
        }
    }

    html += '<div class="form-row" style="grid-template-columns:1fr 1fr 2fr"><div class="form-group"><label>Ancho (m)</label><input type="number" id="u-' + n + '-ancho" step="0.01" oninput="autoLoadComponents(' + n + ')" value="' + ancho + '"></div>';
    html += '<div class="form-group"><label>Alto (m)</label><input type="number" id="u-' + n + '-alto" step="0.01" oninput="autoLoadComponents(' + n + ')" value="' + alto + '"></div><div></div></div>';
    html += '<table class="comp-table"><thead><tr><th>Componente</th><th>Cant.</th><th class="hide-margin">Costo</th><th class="hide-margin">Moneda</th><th class="hide-margin">Margen%</th><th>Precio Unit.</th><th>Subtotal</th><th>IVA%</th><th></th></tr></thead><tbody id="comps-u-' + n + '"></tbody></table>';

    html += '<div class="instalacion-row" id="inst-u-' + n + '" style="display:flex; gap:12px; align-items:center; margin:8px 0; padding:8px; background:#f0fdf4; border-radius:6px; border:1px solid #bbf7d0;">';
    html += '<label style="font-weight:600;">Instalación:</label>';
    html += '<input type="number" id="inst-pct-u-' + n + '" value="' + instPct + '" step="0.5" style="width:70px" oninput="window._manualInstPct[' + n + ']=true; recalcUnidad(' + n + ')"> <span>%</span>';
    html += '<span>= </span><span id="inst-monto-u-' + n + '" style="font-weight:700;">$0</span>';
    html += '</div>';

    html += '<button class="btn-add-comp" onclick="addCompRow(' + n + ')">+ Agregar componente</button></div>';
    document.getElementById('np-unidades').insertAdjacentHTML('beforeend', html);
    window.autoLoadComponents(n);
}

// --- Eliminar unidad ---
export function removeUnidad(n) { document.getElementById('unidad-' + n)?.remove(); recalcTotal(); }

// --- Duplicar unidad ---
export function duplicateUnidad(origN) {
    let oldProd = document.getElementById('u-' + origN + '-prod')?.value || '';
    let oldNombre = document.getElementById('u-' + origN + '-nombre')?.value || '';
    let oldUbic = document.getElementById('u-' + origN + '-ubic')?.value || '';
    let oldTipo = document.getElementById('u-' + origN + '-tipo')?.value || '';
    let oldTipoRep = document.getElementById('u-' + origN + '-tiporep')?.value || '';
    let oldAccion = document.getElementById('u-' + origN + '-accion')?.value || '';
    let oldAncho = document.getElementById('u-' + origN + '-ancho')?.value || '';
    let oldAlto = document.getElementById('u-' + origN + '-alto')?.value || '';

    setLoadingEdit(true); window._manualVisitas = false;

    addUnidad();
    let newN = unidadCount;

    if(document.getElementById('u-' + newN + '-prod')) document.getElementById('u-' + newN + '-prod').value = oldProd;
    if(document.getElementById('u-' + newN + '-nombre')) document.getElementById('u-' + newN + '-nombre').value = oldNombre;
    if(document.getElementById('u-' + newN + '-ubic')) document.getElementById('u-' + newN + '-ubic').value = oldUbic;
    if(document.getElementById('u-' + newN + '-tipo')) document.getElementById('u-' + newN + '-tipo').value = oldTipo;
    if(document.getElementById('u-' + newN + '-tiporep')) document.getElementById('u-' + newN + '-tiporep').value = oldTipoRep;
    if(document.getElementById('u-' + newN + '-accion')) document.getElementById('u-' + newN + '-accion').value = oldAccion;
    if(document.getElementById('u-' + newN + '-ancho')) document.getElementById('u-' + newN + '-ancho').value = oldAncho;
    if(document.getElementById('u-' + newN + '-alto')) document.getElementById('u-' + newN + '-alto').value = oldAlto;

    let oldInstPct = document.getElementById('inst-pct-u-' + origN)?.value || 0;
    if(document.getElementById('inst-pct-u-' + newN)) document.getElementById('inst-pct-u-' + newN).value = oldInstPct;

    let cat = getCategoria(oldProd);
    let hideAccion = (cat === 'Seguridad') ? 'none' : 'block';
    if(document.getElementById('u-' + newN + '-accion')) document.getElementById('u-' + newN + '-accion').parentElement.style.display = hideAccion;

    let showRep = (oldTipo == 'Reparacion' || oldTipo == 'Service') ? 'block' : 'none';
    if(document.getElementById('div-u-' + newN + '-tiporep')) document.getElementById('div-u-' + newN + '-tiporep').style.display = showRep;

    setLoadingEdit(true); window._manualVisitas = false;
    let origTbody = document.getElementById('comps-u-' + origN);
    document.getElementById('comps-u-' + newN).innerHTML = '';

    let rows = origTbody.querySelectorAll('tr');
    rows.forEach(r => {
        let filterInput = r.querySelector('input.filter-input');
        let compName = filterInput ? filterInput.value : '';
        let qtyInput = r.querySelector('input[type="number"]');
        let qty = qtyInput ? qtyInput.value : 1;
        let forcedPriceInput = r.cells[5]?.querySelector('input');
        let forcedPrice = forcedPriceInput ? forcedPriceInput.value : null;

        if (compName) {
            let foundComp = DATA.componentes.find(c => c.Nombre === compName);
            if (!foundComp) {
                foundComp = {
                    Id: null,
                    Nombre: compName,
                    Costo_unitario: 0,
                    Moneda_costo: 'ARS',
                    Margen_default: 0,
                    Alicuota_IVA_venta: '21'
                };
            }
            addCompRowWithData(newN, foundComp, qty, null, forcedPrice);
        }
    });

    recalcUnidad(newN);
    recalcTotal();
    setLoadingEdit(false);
}

// --- Agregar fila de componente vacía ---
export function addCompRow(n) {
    let datalistId = `comp-list-${n}-${Date.now()}`;
    let compOpts = '';
    DATA.componentes.forEach(c => { compOpts += `<option value="${cleanLabel(c.Nombre)}">`; });
    let html = `<td>
        <input list="${datalistId}" class="filter-input" placeholder="Buscar componente..." onchange="compSelected(this, ${n})">
        <datalist id="${datalistId}">${compOpts}</datalist>
    </td>
    <td><input type="number" value="1" step="0.01" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-costo hide-margin" data-armado="0">0</td>
    <td class="c-moneda hide-margin">-</td>
    <td class="hide-margin"><input type="number" value="40" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-precio">$0</td>
    <td class="c-subtotal">$0</td>
    <td class="c-iva">21%</td>
    <td><button class="btn-remove" onclick="this.closest('tr').remove();recalcUnidad(${n})">✕</button></td>`;
    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    row.innerHTML = html;
    tbody.appendChild(row);
}

// --- Agregar fila de componente con datos ---
export function addCompRowWithData(n, comp, qty, lineId = null, forcedPrice = null) {
    let tc = DATA.tc.Dolar_oficial || 1150;

    // Check missing 3ml min for Guías 60x50 and 100x60
    if (comp && comp.Nombre && (comp.Nombre.includes('60x50') || comp.Nombre.includes('100x60'))) {
        qty = Math.max(parseFloat(qty), 3);
    }

    let costo = comp.Costo_unitario || 0;
    let moneda = comp.Moneda_costo || 'ARS';
    let pctArmado = comp.Porcentaje_Armado || comp.Pct_armado || 0;
    let margen = comp.Margen_default || 40;
    let iva = comp.Alicuota_IVA_venta || comp.Alicuota_IVA_Venta || '21';

    let costoArs = moneda === 'USD' ? costo * tc : costo;
    let costoBase = costoArs * (1 + pctArmado / 100);
    let pSinIva = costoBase * (1 + margen / 100);

    let precio = forcedPrice !== null ? forcedPrice : pSinIva;
    let pFinal = precio * (1 + parseFloat(iva) / 100);

    let datalistId = `comp-list-${n}-${Date.now()}`;
    let compOpts = '';
    DATA.componentes.forEach(c => { compOpts += `<option value="${cleanLabel(c.Nombre)}">`; });
    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    if (lineId) row.setAttribute('data-db-id', lineId);
    row.innerHTML = `<td>
        <input list="${datalistId}" value="${cleanLabel(comp.Nombre)}" class="filter-input" placeholder="Buscar componente..." onchange="compSelected(this, ${n})">
        <datalist id="${datalistId}">${compOpts}</datalist>
    </td>
    <td><input type="number" value="${qty}" step="0.01" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-costo hide-margin" data-armado="${pctArmado}" data-costo="${costo}">${Number(costo).toFixed(2)}</td>
    <td class="c-moneda hide-margin">${moneda}</td>
    <td class="hide-margin"><input type="number" value="${margen}" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-precio">${fmt(pFinal)}</td>
    <td class="c-subtotal">${fmt(pFinal * qty)}</td>
    <td class="c-iva">${iva}%</td>
    <td><button class="btn-remove" onclick="this.closest('tr').remove();recalcUnidad(${n})">✕</button></td>`;
    tbody.appendChild(row);
}

// --- Seleccionar componente desde datalist ---
export function compSelected(input, n) {
    let name = input.value;
    let comp = DATA.componentes.find(c => cleanLabel(c.Nombre) === name);
    if (!comp) return;
    let row = input.closest('tr');

    // Check minimum 3ml
    let isGuia3ml = comp.Nombre.includes('60x50') || comp.Nombre.includes('100x60');
    let qtyInput = row.querySelectorAll('input[type="number"]')[0];
    if (isGuia3ml && parseFloat(qtyInput.value) < 3) qtyInput.value = 3;

    row.querySelector('.c-costo').textContent = (comp.Costo_unitario || 0).toFixed(2);
    row.querySelector('.c-costo').dataset.costo = comp.Costo_unitario || 0;
    row.querySelector('.c-costo').dataset.armado = comp.Porcentaje_Armado || comp.Pct_armado || 0;
    row.querySelector('.c-moneda').textContent = comp.Moneda_costo || 'ARS';
    row.querySelector('.c-iva').textContent = (comp.Alicuota_IVA_venta || comp.Alicuota_IVA_Venta || '21') + '%';
    let margenInput = row.querySelectorAll('input[type="number"]')[1];
    if (margenInput) margenInput.value = comp.Margen_default || 40;
    recalcUnidad(n);
}

// --- Recalcular subtotal de una unidad ---
export function recalcUnidad(n) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let t = 0;
    document.querySelectorAll('#comps-u-' + n + ' tr').forEach(r => {
        let cCostoEl = r.querySelector('.c-costo');
        let costo = parseFloat(cCostoEl?.dataset.costo || cCostoEl?.textContent) || 0;
        let pctArmado = parseFloat(cCostoEl?.dataset.armado) || 0;
        let mon = r.querySelector('.c-moneda')?.textContent || 'ARS';
        let ivaTxt = r.querySelector('.c-iva')?.textContent || '21';
        let iva = parseFloat(ivaTxt.replace('%','')) || 21;

        let inputs = r.querySelectorAll('input[type="number"]');
        let qty = parseFloat(inputs[0]?.value) || 0;
        let pInput = r.querySelector('input[list]');
        if (pInput && (pInput.value.includes('60x50') || pInput.value.includes('100x60'))) {
            qty = Math.max(qty, 3);
            if(inputs[0]) inputs[0].value = qty;
        }
        let marg = parseFloat(inputs[1]?.value) || 0;

        let costoArs = mon === 'USD' ? costo * tc : costo;
        let costoBase = costoArs * (1 + pctArmado / 100);

        let pUnitSinIva = costoBase * (1 + marg / 100);
        let pUnitConIva = pUnitSinIva * (1 + iva / 100);

        let sub = pUnitConIva * qty;
        r.querySelector('.c-precio').textContent = fmt(pUnitConIva);
        r.querySelector('.c-subtotal').textContent = fmt(sub);
        t += sub;
    });

    let instPctInput = document.getElementById('inst-pct-u-' + n);
    let instMontoSpan = document.getElementById('inst-monto-u-' + n);
    if (instPctInput) {
        let pct = parseFloat(instPctInput.value) || 0;
        let instMonto = t * (pct / 100);
        if (instMontoSpan) instMontoSpan.textContent = fmt(instMonto);
        t += instMonto;
    }

    document.getElementById('sub-u-' + n).textContent = fmt(t);
    recalcTotal();
}

// --- Recalcular traslado ---
export function recalcTraslado() {
    let zonaSelect = document.getElementById('np-zona');
    let tVis = document.getElementById('traslado-visitas');
    let zLabel = document.getElementById('traslado-zona');
    let tViatico = document.getElementById('traslado-viatico');
    let tTransporte = document.getElementById('traslado-transporte');
    let tTotal = document.getElementById('traslado-total');
    // Guard: if DOM elements don't exist yet, bail out
    if (!zonaSelect || !tVis) return;
    let zId = zonaSelect.value;
    let zona = DATA.zonas.find(z => String(z.Id) === String(zId));
    if (!zona) {
        if (zLabel) zLabel.textContent = '-';
        if (tViatico) tViatico.textContent = '$0';
        if (tTransporte) tTransporte.textContent = '$0';
        if (tTotal) tTotal.textContent = '$0';
        tVis.dataset.val = 0;
        recalcTotal();
        return;
    }
    // Si es Centro (Id=1), traslado = 0
    if (zona.Id == 1 || zona.id == 1) {
        if (zLabel) zLabel.textContent = cleanLabel(zona.Nombre);
        if (tViatico) tViatico.textContent = '$0';
        if (tTransporte) tTransporte.textContent = '$0';
        tVis.value = 0;
        tVis.disabled = true;
        if (tTotal) tTotal.textContent = '$0';
        tVis.dataset.val = 0;
        recalcTotal();
        return;
    }
    tVis.disabled = false;
    let viatico = zona.Costo_viatico || 0;
    let transporte = zona.Costo_transporte || 0;
    let visitas = parseInt(tVis.value) || 0;
    let costo = (viatico + transporte) * visitas;
    if (zLabel) zLabel.textContent = cleanLabel(zona.Nombre);
    if (tViatico) tViatico.textContent = fmt(viatico);
    if (tTransporte) tTransporte.textContent = fmt(transporte);
    if (tTotal) tTotal.textContent = fmt(costo);
    tVis.disabled = false;
    tVis.dataset.val = costo;
    recalcTotal();
}

// --- Recalcular total general ---
export function recalcTotal() {
    let total = 0;
    document.querySelectorAll('.unidad-subtotal').forEach(s => {
        total += parseFloat(s.textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0;
    });

    // Auto-calcular visitas basado en Tipo de Trabajo
    if (!_loadingEdit && !window._manualVisitas) {
        let maxVisitas = 1;
        let hasHardWork = false;
        document.querySelectorAll('[id^="u-"][id$="-tipo"]').forEach(sel => {
            let tp = sel.value;
            if (['Instalacion_nueva', 'Cambio_pano', 'Cambio_guias', 'Motorizacion'].includes(tp)) {
                hasHardWork = true;
            }
        });
        if (hasHardWork) maxVisitas = 2;

        let tVis = document.getElementById('traslado-visitas');
        if (tVis && !tVis.disabled && tVis.value != maxVisitas) {
            tVis.value = maxVisitas;
            // Solo logica de update UI interno a traslado para no hacer bucle:
            let zId = document.getElementById('np-zona')?.value;
            let zona = DATA.zonas.find(z => String(z.Id) === String(zId));
            if (zona) {
                let costo = (zona.Costo_viatico || 0) + (zona.Costo_transporte || 0);
                let traslTotal = costo * maxVisitas;
                document.getElementById('traslado-total').textContent = fmt(traslTotal);
                tVis.dataset.val = traslTotal;
            }
        }
    }

    let valTraslado = parseFloat(document.getElementById('traslado-visitas')?.dataset.val) || 0;
    document.getElementById('np-total').textContent = fmt(total + valTraslado);
}
