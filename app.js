const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const BASE = 'pru2fsphj43juyr';
const H = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };
const TBL = { clientes: 'mwby85581fhjy27', propiedades: 'm0dwlr7ccoim1kf', historial: 'mimh9lp8bkew4t0', categorias: 'mulo5ve82d9ex7q', productos: 'mdr6mo695g0qz6d', componentes: 'mgh9e1zivvhpg26', prod_comp: 'mmjzqw7v4que9q3', tc: 'mhj9fovlmv9036x', zonas: 'mottig5nmj5e3kx', presupuestos: 'mn1yyjyovvoyxme', lineas: 'mv1e9trh23j0q3o', servicios: 'mz8qrki3hz4y7iv', formas_pago: 'm2t4fnjie88gfo0', unidades: 'mix059xkpsz15um', anchos: 'mayai71j546g3as' };
let DATA = { clientes: [], propiedades: [], zonas: [], componentes: [], productos: [], prod_comp: [], presupuestos: [], lineas: [], unidades: [], formas_pago: [], tc: null, anchos: [] };
let unidadCount = 0;
async function apiGet(tid, params = '') { let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=200' + params, { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiGetLinks(tid, colId, rowId) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId + '?limit=10', { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiPost(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'POST', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiPatch(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'PATCH', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiDelete(tid, id) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'DELETE', headers: H, body: JSON.stringify({ Id: id }) }); return r.json(); }
async function apiLink(tid, colId, rowId, linked) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId, { method: 'POST', headers: H, body: JSON.stringify(linked) }); return r.json(); }
function fmt(n) { if (n == null) return '$0'; return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function badgeHtml(estado) { let c = { 'Borrador': 'borrador', 'Enviado': 'enviado', 'Aprobado': 'aprobado', 'Rechazado': 'rechazado', 'Vencido': 'vencido', 'Facturado': 'facturado' }; return '<span class="badge badge-' + (c[estado] || 'borrador') + '">' + cleanLabel(estado) + '</span>'; }
function showPage(id, btn) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById('page-' + id).classList.add('active'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); if (btn) btn.classList.add('active'); if (id === 'dashboard') loadDashboard(); if (id === 'presupuestos') loadPresupuestos(); if (id === 'precios') loadPrecios(); if (id === 'clientes') loadClientes(); if (id === 'config') loadConfig(); }
function showConfigTab(id, btn) { document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none'); document.getElementById('config-' + id).style.display = 'block'; document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
function closeVerPres() { document.getElementById('modal-ver-pres').classList.remove('show'); }
function resolveLink(row, field) { let v = row[field]; if (!v) return null; if (typeof v === 'object' && Array.isArray(v) && v.length > 0) return v[0]; if (typeof v === 'object' && v.Id) return v; return null; }
function resolveName(row, field, list, idField) { let link = resolveLink(row, field); if (!link) return '-'; let id = link.Id || link.id || link; let found = list.find(i => i.Id == id); return found ? found.Nombre || found.Title || '-' : '-'; }
function cleanLabel(text) {
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
async function loadAll() {
    DATA.tc = (await apiGet(TBL.tc, '&where=(Vigente,eq,true)'))[0] || { Dolar_oficial: 1150 };
    DATA.clientes = await apiGet(TBL.clientes);
    DATA.zonas = await apiGet(TBL.zonas);
    DATA.componentes = await apiGet(TBL.componentes);
    DATA.productos = await apiGet(TBL.productos);
    DATA.prod_comp = await apiGet(TBL.prod_comp);
    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.lineas = await apiGet(TBL.lineas);
    DATA.unidades = await apiGet(TBL.unidades);
    DATA.formas_pago = await apiGet(TBL.formas_pago);
    DATA.propiedades = await apiGet(TBL.propiedades);
    DATA.anchos = await apiGet(TBL.anchos);
    for (let p of DATA.presupuestos) {
        try { let cl = await apiGetLinks(TBL.presupuestos, 'canpten8owymbde', p.Id); if (cl.length > 0) p._clienteNombre = cl[0].Nombre || cl[0].Title || '-'; else p._clienteNombre = '-'; } catch (e) { p._clienteNombre = '-'; }
        try { let zl = await apiGetLinks(TBL.presupuestos, 'cr3s0ox51qopwl4', p.Id); if (zl.length > 0) p._zonaNombre = zl[0].Nombre || zl[0].Title || '-'; else p._zonaNombre = '-'; } catch (e) { p._zonaNombre = '-'; }
        try { let pl = await apiGetLinks(TBL.presupuestos, 'cpf764utp1w7yj0', p.Id); if (pl.length > 0) { let propFull = DATA.propiedades.find(pr => pr.Id == pl[0].Id); p._propiedadDir = propFull ? (propFull.Direccion || '-') + ' - ' + (propFull.Localidad || '-') : (pl[0].Nombre || '-'); } else p._propiedadDir = '-'; } catch (e) { p._propiedadDir = '-'; }
    }
    loadDashboard();
}
function loadDashboard() {
    let ps = DATA.presupuestos;
    document.getElementById('dash-total-pres').textContent = ps.length;
    let totalMonto = ps.reduce((s, p) => s + (p.Total_con_IVA || p.Total || 0), 0);
    document.getElementById('dash-facturado').textContent = fmt(totalMonto);
    let pend = ps.filter(p => p.Estado === 'Borrador' || p.Estado === 'Enviado').length;
    document.getElementById('dash-pendientes').textContent = pend;
    document.getElementById('dash-tc').textContent = '$' + Number(DATA.tc.Dolar_oficial || 0).toLocaleString('es-AR');
    let tb = document.getElementById('dash-table');
    tb.innerHTML = '';
    ps.slice(-5).reverse().forEach(p => {
        let cliName = cleanLabel(p._clienteNombre) || '-';
        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + fmt(p.Total_con_IVA || p.Total) + '</td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td></tr>';
    });
}
function loadPresupuestos() {
    let tb = document.getElementById('pres-table');
    tb.innerHTML = '';
    DATA.presupuestos.forEach(p => {
        let cliName = cleanLabel(p._clienteNombre) || '-';
        let propDir = cleanLabel(p._propiedadDir) || '-';
        let zonaName = cleanLabel(p._zonaNombre) || '-';
        let iva = (p.IVA_21 || 0) + (p.IVA_105 || 0);
        let id = p.Id || p.id;
        let actions = '<button class="btn btn-sm btn-secondary" style="margin-right:5px" onclick="viewPresupuesto(' + id + ')">Ver</button>';
        actions += '<button class="btn btn-sm btn-secondary" style="margin-right:5px" onclick="duplicatePresupuesto(' + id + ')" title="Duplicar">📑</button>';
        actions += '<select onchange="changeStatus(' + id + ', this.value)" style="padding:2px;font-size:12px">' +
            '<option value="Borrador" ' + (p.Estado == 'Borrador' ? 'selected' : '') + '>Borrador</option>' +
            '<option value="Enviado" ' + (p.Estado == 'Enviado' ? 'selected' : '') + '>Enviado</option>' +
            '<option value="Aprobado" ' + (p.Estado == 'Aprobado' ? 'selected' : '') + '>Aprobado</option>' +
            '<option value="Rechazado" ' + (p.Estado == 'Rechazado' ? 'selected' : '') + '>Rechazado</option>' +
            '<option value="Facturado" ' + (p.Estado == 'Facturado' ? 'selected' : '') + '>Facturado</option>' +
            '<option value="Vencido" ' + (p.Estado == 'Vencido' ? 'selected' : '') + '>Vencido</option>' +
            '</select>';

        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + propDir + '</td><td>' + zonaName + '</td><td>' + fmt(p.Subtotal_neto || p.Subtotal_items) + '</td><td>' + fmt(iva) + '</td><td><strong>' + fmt(p.Total_con_IVA || p.Total) + '</strong></td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td><td>' + actions + '</td></tr>';
    });
}
function loadPrecios() {
    let tc = DATA.tc.Dolar_oficial || 1150;
    document.getElementById('precios-tc').textContent = 'TC: 1 USD = $' + Number(tc).toLocaleString('es-AR') + ' ARS';
    let tb = document.getElementById('precios-table');
    tb.innerHTML = '';
    DATA.componentes.forEach(c => {
        let costo = c.Costo_unitario || 0;
        let margen = c.Margen_default || 0;
        let precioArs = c.Moneda_costo === 'USD' ? costo * tc * (1 + margen / 100) : costo * (1 + margen / 100);
        tb.innerHTML += '<tr><td><strong>' + cleanLabel(c.Nombre) + '</strong></td><td>' + cleanLabel(c.Tipo_componente || '-') + '</td><td class="hide-margin">' + Number(costo).toFixed(2) + '</td><td class="hide-margin">' + (c.Moneda_costo || '-') + '</td><td class="hide-margin">' + margen + '%</td><td><strong>' + fmt(precioArs) + '</strong></td><td class="hide-margin">' + (c.Alicuota_IVA_compra || '-') + '%</td><td class="hide-margin">' + (c.Alicuota_IVA_venta || '-') + '%</td><td>' + cleanLabel(c.Proveedor || '-') + '</td></tr>';
    });
}
function filterComp() {
    let search = document.getElementById('comp-search').value.toLowerCase();
    let tipo = document.getElementById('comp-filter-tipo').value;
    let rows = document.querySelectorAll('#precios-table tr');
    rows.forEach(r => {
        let name = r.cells[0]?.textContent.toLowerCase() || '';
        let t = r.cells[1]?.textContent || '';
        let show = name.includes(search) && (!tipo || t === tipo);
        r.style.display = show ? '' : 'none';
    });
}
function loadClientes() {
    let tb = document.getElementById('cli-table');
    tb.innerHTML = '';
    DATA.clientes.forEach(c => {
        let presCount = 0;
        let pl = c.Presupuestos;
        if (Array.isArray(pl)) presCount = pl.length;
        tb.innerHTML += '<tr style="cursor:pointer" onclick="showClientDetail(' + c.Id + ')"><td><strong>' + cleanLabel(c.Nombre) + '</strong></td><td>' + (c.Telefono || '-') + '</td><td>' + (c.Mail || '-') + '</td><td>' + cleanLabel(c.Tipo || '-') + '</td><td>' + cleanLabel(c.Condicion_fiscal || '-') + '</td><td>' + (c.CUIT_CUIL_DNI || '-') + '</td><td>' + presCount + '</td></tr>';
    });
}
function filterCli() {
    let search = document.getElementById('cli-search').value.toLowerCase();
    let tipo = document.getElementById('cli-filter-tipo').value;
    let rows = document.querySelectorAll('#cli-table tr');
    rows.forEach(r => {
        let name = r.cells[0]?.textContent.toLowerCase() || '';
        let t = r.cells[3]?.textContent || '';
        let show = name.includes(search) && (!tipo || t === tipo);
        r.style.display = show ? '' : 'none';
    });
}
function filterPres() {
    let search = document.getElementById('pres-search').value.toLowerCase();
    let estado = document.getElementById('pres-filter-estado').value;
    let rows = document.querySelectorAll('#pres-table tr');
    rows.forEach(r => {
        let num = r.cells[0]?.textContent.toLowerCase() || '';
        let cli = r.cells[2]?.textContent.toLowerCase() || '';
        let est = r.cells[7]?.textContent || '';
        let show = (num.includes(search) || cli.includes(search)) && (!estado || est === estado);
        r.style.display = show ? '' : 'none';
    });
}
function showClientDetail(id) {
    let c = DATA.clientes.find(x => x.Id === id);
    if (!c) return;
    let html = '<h2 style="margin-bottom:4px">' + cleanLabel(c.Nombre) + '</h2><span class="badge badge-enviado">' + cleanLabel(c.Tipo || 'Particular') + '</span>';
    html += '<div class="detail-section" style="margin-top:20px"><h4>Contacto</h4>';
    html += '<div class="detail-field"><span>Teléfono</span><span>' + (c.Telefono || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Mail</span><span>' + (c.Mail || '-') + '</span></div></div>';
    html += '<div class="detail-section"><h4>Información Fiscal</h4>';
    html += '<div class="detail-field"><span>CUIT/DNI</span><span>' + (c.CUIT_CUIL_DNI || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Cond. Fiscal</span><span>' + cleanLabel(c.Condicion_fiscal || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Tipo Factura</span><span>' + cleanLabel(c.Tipo_factura || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Razón Social</span><span>' + cleanLabel(c.Razon_social || '-') + '</span></div></div>';
    document.getElementById('detail-content').innerHTML = html;
    document.getElementById('panel-cliente').classList.add('open');
}
function loadConfig() {
    document.getElementById('cfg-tc-valor').value = DATA.tc.Dolar_oficial || '';
    document.getElementById('cfg-tc-fecha').value = DATA.tc.Fecha || '';
    let zt = document.getElementById('cfg-zonas-table');
    zt.innerHTML = '';
    DATA.zonas.forEach(z => {
        zt.innerHTML += '<tr><td><strong>' + cleanLabel(z.Nombre) + '</strong></td><td>' + fmt(z.Costo_viatico) + '</td><td>' + fmt(z.Costo_transporte) + '</td><td>' + fmt(z.Costo_traslado_service) + '</td></tr>';
    });
    let pt = document.getElementById('cfg-pagos-table');
    pt.innerHTML = '';
    DATA.formas_pago.forEach(f => {
        pt.innerHTML += '<tr><td><strong>' + cleanLabel(f.Nombre) + '</strong></td><td>' + (f.Recargo_pct || 0) + '%</td><td>' + (f.Descuento_pct || 0) + '%</td><td>' + (f.Plazo_dias || 0) + '</td><td>' + (f.Activo ? 'Si' : 'No') + '</td></tr>';
    });
    let at = document.getElementById('cfg-anchos-table');
    at.innerHTML = '';
    DATA.anchos.forEach(a => {
        at.innerHTML += '<tr><td>' + a.Ancho_solicitado_hasta + '</td><td>' + a.Ancho_real_pano + '</td><td>' + (a.Notas || '-') + '</td></tr>';
    });
}
async function saveTc() {
    let val = document.getElementById('cfg-tc-valor').value;
    let fecha = document.getElementById('cfg-tc-fecha').value;
    if (!val) { alert('Ingresá el valor del dólar'); return; }
    await apiPatch(TBL.tc, { Id: DATA.tc.Id, Dolar_oficial: parseFloat(val), Fecha: fecha || null });
    DATA.tc.Dolar_oficial = parseFloat(val);
    alert('Tipo de cambio actualizado');
    loadDashboard();
}

function updatePropiedadesSelect() {
    loadPropiedadesSelect();
}

function loadPropiedadesSelect(presData) {
    let ps = document.getElementById('np-propiedad');
    if (!ps) return;
    let cliId = document.getElementById('np-cliente').value;
    ps.innerHTML = '<option value="">Seleccionar propiedad...</option>';
    if (!cliId) return;

    let props = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return link && (link.Id == cliId || link.id == cliId);
    });

    let selectedPropId = null;
    if (presData && presData.Id) {
        let pLink = resolveLink(presData, 'Propiedades');
        if (pLink) selectedPropId = pLink.Id || pLink.id;
    }

    props.forEach(p => {
        let sel = (selectedPropId && (p.Id == selectedPropId)) ? 'selected' : (props.length === 1 ? 'selected' : '');
        ps.innerHTML += '<option value="' + p.Id + '" ' + sel + '>' + cleanLabel(p.Direccion) + ' - ' + cleanLabel(p.Localidad) + '</option>';
    });
}

async function openNewPres(presData = null) {
    if (DATA.clientes.length === 0) await loadAll();

    // Reset Modal
    document.getElementById('modal-title').textContent = presData ? ('Editar Presupuesto ' + presData.Numero) : 'Nuevo Presupuesto';
    let modalEl = document.querySelector('#modal-pres .modal');
    if (modalEl) modalEl.setAttribute('data-db-id', presData ? presData.Id : '');

    // Populate Selects
    let cs = document.getElementById('np-cliente');
    cs.innerHTML = '<option value="">Seleccionar cliente...</option>';
    DATA.clientes.forEach(c => {
        let sel = (presData && presData._clienteData && (presData._clienteData.Id == c.Id)) ? 'selected' : '';
        cs.innerHTML += '<option value="' + c.Id + '" ' + sel + '>' + cleanLabel(c.Nombre) + ' - ' + (c.Telefono || '') + '</option>';
    });

    let zs = document.getElementById('np-zona');
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

    loadPropiedadesSelect(presData);

    document.getElementById('np-canal').value = presData ? (presData.Canal || 'Manual') : 'Manual';
    document.getElementById('np-factura').checked = presData ? (presData.Quiere_factura || false) : false;

    document.getElementById('np-unidades').innerHTML = '';
    document.getElementById('np-resumen').style.display = 'none';
    unidadCount = 0;

    if (presData && presData._unidades && presData._unidades.length > 0) {
        // Load existing units
        for (let u of presData._unidades) {
            unidadCount++;
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
    document.getElementById('modal-pres').classList.add('show');
}

function addUnidad() {
    unidadCount++;
    addUnidadUI(unidadCount, null);
}

function addUnidadUI(n, uData) {
    let uId = uData ? uData.Id : '';
    let prodOpts = '<option value="">Seleccionar producto...</option>';
    let selectedProd = uData ? uData._productoId : '';

    DATA.productos.forEach(p => {
        let sel = (selectedProd && String(p.Id) == String(selectedProd)) ? 'selected' : '';
        prodOpts += '<option value="' + p.Id + '" ' + sel + '>' + cleanLabel(p.Nombre) + '</option>';
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

    let html = '<div class="unidad-card" id="unidad-' + n + '" data-db-id="' + uId + '"><div class="unidad-header"><h3>Unidad ' + n + '</h3><div style="display:flex;gap:8px;align-items:center"><span class="unidad-subtotal" id="sub-u-' + n + '">$0</span><button class="btn-remove" onclick="removeUnidad(' + n + ')" title="Eliminar">🗑</button></div></div>';
    html += '<div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;"><div class="form-group"><label>Ambiente</label><input id="u-' + n + '-nombre" placeholder="Ej: Dormitorio principal" value="' + nombre + '"></div>';
    html += '<div class="form-group"><label>Ubicación</label><input id="u-' + n + '-ubic" placeholder="Ej: Contra frente" value="' + ubic + '"></div>';
    html += '<div class="form-group"><label>Tipo Trabajo</label><select id="u-' + n + '-tipo" onchange="autoLoadComponents(' + n + ')"><option value="Instalacion_nueva" ' + (tipo == 'Instalacion_nueva' ? 'selected' : '') + '>Instalación nueva</option><option value="Cambio_pano" ' + (tipo == 'Cambio_pano' ? 'selected' : '') + '>Cambio paño</option><option value="Motorizacion" ' + (tipo == 'Motorizacion' ? 'selected' : '') + '>Motorización</option><option value="Cambio_guias" ' + (tipo == 'Cambio_guias' ? 'selected' : '') + '>Cambio guías</option><option value="Reparacion" ' + (tipo == 'Reparacion' ? 'selected' : '') + '>Reparación</option><option value="Service" ' + (tipo == 'Service' ? 'selected' : '') + '>Service</option><option value="Otro" ' + (tipo == 'Otro' ? 'selected' : '') + '>Otro</option></select></div>';
    html += '<div class="form-group" style="' + showRep + '" id="div-u-' + n + '-tiporep"><label>Tipo Reparación</label><select id="u-' + n + '-tiporep" onchange="autoLoadComponents(' + n + ')"><option value="">-- Elegir reparación --</option><option value="cambio_eje" ' + (tipoRep == 'cambio_eje' ? 'selected' : '') + '>Cambio de eje</option><option value="cambio_cinta" ' + (tipoRep == 'cambio_cinta' ? 'selected' : '') + '>Cambio de cinta</option><option value="cambio_laterales" ' + (tipoRep == 'cambio_laterales' ? 'selected' : '') + '>Cambio de laterales</option><option value="cambio_resortes" ' + (tipoRep == 'cambio_resortes' ? 'selected' : '') + '>Cambio de resortes</option><option value="cambio_polea_tacos" ' + (tipoRep == 'cambio_polea_tacos' ? 'selected' : '') + '>Cambio polea, tacos y punteras</option><option value="bobinado_motor" ' + (tipoRep == 'bobinado_motor' ? 'selected' : '') + '>Bobinado de motor</option></select></div>';
    html += '<div class="form-group" style="' + hideAccion + '"><label>Accionamiento</label><select id="u-' + n + '-accion" onchange="autoLoadComponents(' + n + ')"><option value="motor" ' + (accion == 'motor' ? 'selected' : '') + '>Con motor</option><option value="manual_cinta" ' + (accion == 'manual_cinta' ? 'selected' : '') + '>Manual a cinta</option><option value="manual_antognetti" ' + (accion == 'manual_antognetti' ? 'selected' : '') + '>Manual Antognetti</option></select></div>';
    html += '<div class="form-group"><label>Producto Base</label><select id="u-' + n + '-prod" onchange="autoLoadComponents(' + n + ')">' + prodOpts + '</select></div></div>';
    html += '<div class="form-row" style="grid-template-columns:1fr 1fr 2fr"><div class="form-group"><label>Ancho (m)</label><input type="number" id="u-' + n + '-ancho" step="0.01" oninput="autoLoadComponents(' + n + ')" value="' + ancho + '"></div>';
    html += '<div class="form-group"><label>Alto (m)</label><input type="number" id="u-' + n + '-alto" step="0.01" oninput="autoLoadComponents(' + n + ')" value="' + alto + '"></div><div></div></div>';
    html += '<table class="comp-table"><thead><tr><th>Componente</th><th>Cant.</th><th class="hide-margin">Costo</th><th class="hide-margin">Moneda</th><th class="hide-margin">Margen%</th><th>Precio Unit.</th><th>Subtotal</th><th>IVA%</th><th></th></tr></thead><tbody id="comps-u-' + n + '"></tbody></table>';
    html += '<button class="btn-add-comp" onclick="addCompRow(' + n + ')">+ Agregar componente</button></div>';
    document.getElementById('np-unidades').insertAdjacentHTML('beforeend', html);
}

function removeUnidad(n) { document.getElementById('unidad-' + n)?.remove(); recalcTotal(); }

// ===== AUTO-LOAD COMPONENTS =====
const PESO_M2 = {
    16: 11, 17: 13, 18: 10, 19: 12, 20: 14,
    21: 4, 22: 7, 24: 3,
    25: 10, 26: 5, 27: 10, 28: 5
};
const PROD_COMP_MAP = {
    16: 33, 17: 34, 18: 35, 19: 36, 20: 37,
    21: 38, 22: 39, 23: 40, 24: 41,
    25: 42, 26: 43, 27: 44, 28: 45,
    31: 46, 32: 47
};
const CAT_SEGURIDAD = [16, 17, 18, 19, 20];
const CAT_EXTERIOR = [21, 22, 23, 24, 25, 26, 27, 28];
const CAT_INTERIOR = [31, 32];

function getCategoria(prodId) {
    let pid = parseInt(prodId);
    if (CAT_SEGURIDAD.includes(pid)) return 'Seguridad';
    if (CAT_EXTERIOR.includes(pid)) return 'Exterior';
    if (CAT_INTERIOR.includes(pid)) return 'Interior';
    return null;
}

function selectMotor(cat, peso, ancho, m2) {
    if (cat === 'Seguridad') {
        if (ancho < 6) {
            if (m2 <= 10) return 55; // Tubular 140
            if (peso <= 330) return 50; // Paralelo 600
            if (peso <= 370) return 51; // Paralelo 700
        } else {
            if (peso <= 330) return 52;
            if (peso <= 390) return 53;
            if (peso <= 770) return 54;
        }
    } else if (cat === 'Exterior') {
        if (ancho < 6) {
            if (peso <= 115) return 56; // Tubular 60
            if (peso <= 200) return 55; // Tubular 140
            if (peso <= 330) return 50;
            if (peso <= 370) return 51;
        } else {
            if (peso <= 330) return 52;
            if (peso <= 390) return 53;
            if (peso <= 770) return 54;
        }
    } else if (cat === 'Interior') {
        if (peso <= 35) return 144;
        if (peso <= 47) return 145;
        if (peso <= 70) return 146;
    }
    return null;
}

function autoLoadComponents(n) {
    let prodIdInput = document.getElementById('u-' + n + '-prod');
    if (!prodIdInput) return;
    let prodId = prodIdInput.value;
    let tbody = document.getElementById('comps-u-' + n);
    let ancho = parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || 0;
    let alto = parseFloat(document.getElementById('u-' + n + '-alto')?.value) || 0;

    let tipoTrabajo = document.getElementById('u-' + n + '-tipo')?.value;
    if (!prodId) { tbody.innerHTML = ''; recalcUnidad(n); return; }

    let pid = parseInt(prodId);
    let cat = getCategoria(pid);
    if (!cat) { tbody.innerHTML = ''; addCompRow(n); recalcUnidad(n); return; }

    let accSelect = document.getElementById('u-' + n + '-accion');
    let accion = accSelect ? accSelect.value : 'motor';

    // UI visibility management
    let divTipoRep = document.getElementById('div-u-' + n + '-tiporep');
    if (divTipoRep) divTipoRep.style.display = (tipoTrabajo === 'Reparacion' || tipoTrabajo === 'Service') ? 'block' : 'none';

    if (accSelect) {
        let accDiv = accSelect.parentElement;
        if (cat === 'Seguridad') {
            accDiv.style.display = 'none';
            accSelect.value = 'motor';
            accion = 'motor';
        } else if (tipoTrabajo === 'Reparacion' || tipoTrabajo === 'Service') {
            accDiv.style.display = 'none'; // No accionamiento for repairs usually
        } else {
            accDiv.style.display = 'block';
        }
    }

    let m2 = ancho * alto;
    let pesoM2 = PESO_M2[pid] || 5;
    let peso = m2 * pesoM2;

    tbody.innerHTML = '';

    // 1. Material/Paño (Common for Base products)
    if (tipoTrabajo !== 'Reparacion' && tipoTrabajo !== 'Service') {
        let matCompId = PROD_COMP_MAP[pid];
        if (matCompId) {
            let matComp = DATA.componentes.find(c => c.Id == matCompId);
            if (matComp) addCompRowWithData(n, matComp, m2 > 0 ? parseFloat(m2.toFixed(2)) : 1);
        }
    }

    if (tipoTrabajo === 'Reparacion' || tipoTrabajo === 'Service') {
        // --- LOGICA REPARACIONES ---
        let tipoRep = document.getElementById('u-' + n + '-tiporep')?.value;
        if (!tipoRep) { recalcUnidad(n); return; }

        let materialTotal = 0;
        const addRepairComp = (id, qty) => {
            let comp = DATA.componentes.find(c => c.Id == id);
            if (comp) {
                addCompRowWithData(n, comp, qty);
                let tc = DATA.tc.Dolar_oficial || 1150;
                let costoArs = (comp.Moneda_costo === 'USD' ? comp.Costo_unitario * tc : comp.Costo_unitario) || 0;
                let precio = costoArs * (1 + (comp.Margen_default || 40) / 100);
                materialTotal += precio * qty;
            }
        };

        if (tipoRep === 'cambio_eje') {
            addRepairComp(150, parseFloat(ancho.toFixed(2))); // Eje 70mm
            addRepairComp(154, 1); // Puntas
            addRepairComp(153, 2); // Tacos
            let poleaId = m2 <= 1.5 ? 151 : 152;
            addRepairComp(poleaId, 1);
        } else if (tipoRep === 'cambio_cinta') {
            addRepairComp(155, parseFloat((alto + 0.5).toFixed(2))); // Cinta
        } else if (tipoRep === 'cambio_laterales') {
            addRepairComp(159, parseFloat(m2.toFixed(2))); // Laterales
            addRepairComp(160, 1); // Flejes
        } else if (tipoRep === 'cambio_resortes') {
            addRepairComp(158, 1); // Resorte
        } else if (tipoRep === 'cambio_polea_tacos') {
            let poleaId = m2 <= 1.5 ? 151 : 152;
            addRepairComp(poleaId, 1);
            addRepairComp(153, 2); // Tacos
            addRepairComp(154, 1); // Puntas
        } else if (tipoRep === 'bobinado_motor') {
            addRepairComp(115, 1); // Bobinado
        }

        // 3. Mano de Obra (50% materiales, min 40k)
        let moPrecio = Math.max(materialTotal * 0.5, 40000);
        let moComp = DATA.componentes.find(c => c.Id == 93);
        if (moComp) addCompRowWithData(n, moComp, 1, null, moPrecio);

        // 4. Viático (Check if already added in any unit)
        let hasViatico = false;
        document.querySelectorAll('tbody[id^="comps-u-"] tr').forEach(row => {
            let sel = row.querySelector('select');
            if (sel && [138, 139, 140, 141, 142, 143].includes(parseInt(sel.value))) hasViatico = true;
        });

        if (!hasViatico) {
            let zonaId = document.getElementById('np-zona')?.value;
            let viaticoMap = { '1': 138, '2': 139, '3': 140, '4': 141, '5': 142, '6': 143 };
            let vId = viaticoMap[zonaId] || 143;
            let vComp = DATA.componentes.find(c => c.Id == vId);
            if (vComp) addCompRowWithData(n, vComp, 1);
        }

    } else if (cat === 'Seguridad') {
        // --- LOGICA SEGURIDAD ---
        let motorId = selectMotor(cat, peso, ancho, m2);
        if (motorId) {
            let motorComp = DATA.componentes.find(c => c.Id == motorId);
            if (motorComp) addCompRowWithData(n, motorComp, 1);

            // Eje Seguridad
            let ejeId = null;
            if (motorId === 55) ejeId = 147;
            else if (motorId === 50 || motorId === 51) ejeId = 148;
            else if (motorId === 52 || motorId === 53 || motorId === 54) ejeId = 149;
            if (ejeId) {
                let ejeComp = DATA.componentes.find(c => c.Id == ejeId);
                if (ejeComp) addCompRowWithData(n, ejeComp, parseFloat(ancho.toFixed(2)));
            }
        }

        // Guías Seguridad
        let guiaId = ancho < 5 ? 60 : 61;
        let guiaComp = DATA.componentes.find(c => c.Id == guiaId);
        if (guiaComp) addCompRowWithData(n, guiaComp, 1);

        // Kit Remoto
        let kitComp = DATA.componentes.find(c => c.Id == 58);
        if (kitComp) addCompRowWithData(n, kitComp, 1);

        // Mano de Obra Seguridad
        let moBase = DATA.componentes.find(c => c.Id == 94);
        if (moBase) addCompRowWithData(n, moBase, 1);
        if (m2 > 4) {
            let moPlus = DATA.componentes.find(c => c.Id == 95);
            if (moPlus) addCompRowWithData(n, moPlus, 1);
        }
        if (motorId) {
            let moMotor = DATA.componentes.find(c => c.Id == 96);
            if (moMotor) addCompRowWithData(n, moMotor, 1);
        }
        let moGuias = DATA.componentes.find(c => c.Id == 97);
        if (moGuias) addCompRowWithData(n, moGuias, 1);

    } else if (cat === 'Exterior') {
        // --- LOGICA EXTERIOR ---
        if (accion === 'motor') {
            let motorId = selectMotor(cat, peso, ancho, m2);
            if (motorId) {
                let motorComp = DATA.componentes.find(c => c.Id == motorId);
                if (motorComp) addCompRowWithData(n, motorComp, 1);
            }
            // Eje 70mm
            let eje = DATA.componentes.find(c => c.Id == 150);
            if (eje) addCompRowWithData(n, eje, parseFloat(ancho.toFixed(2)));

            // Guías Aluminio (63)
            let guias = DATA.componentes.find(c => c.Id == 63);
            if (guias) addCompRowWithData(n, guias, parseFloat((alto * 2).toFixed(2)));

            // Kit Remoto (58)
            let kit = DATA.componentes.find(c => c.Id == 58);
            if (kit) addCompRowWithData(n, kit, 1);

            // Mano de Obra Exterior + Pluses
            let moBase = DATA.componentes.find(c => c.Id == 93);
            if (moBase) addCompRowWithData(n, moBase, 1);
            if (m2 > 4) {
                let moPlus = DATA.componentes.find(c => c.Id == 95);
                if (moPlus) addCompRowWithData(n, moPlus, 1);
            }
            if (motorId) {
                let moMotor = DATA.componentes.find(c => c.Id == 96);
                if (moMotor) addCompRowWithData(n, moMotor, 1);
            }
            let moGuias = DATA.componentes.find(c => c.Id == 97);
            if (moGuias) addCompRowWithData(n, moGuias, 1);

        } else if (accion === 'manual_cinta') {
            // Eje 70mm
            let eje = DATA.componentes.find(c => c.Id == 150);
            if (eje) addCompRowWithData(n, eje, parseFloat(ancho.toFixed(2)));

            // Polea (151/152)
            let poleaId = m2 <= 1.5 ? 151 : 152;
            let polea = DATA.componentes.find(c => c.Id == poleaId);
            if (polea) addCompRowWithData(n, polea, 1);

            // Tacos
            let tacos = DATA.componentes.find(c => c.Id == 153);
            if (tacos) addCompRowWithData(n, tacos, 2);

            // Puntas de eje
            let puntas = DATA.componentes.find(c => c.Id == 154);
            if (puntas) addCompRowWithData(n, puntas, 1);

            // Cinta (alto + 0.5)
            let cinta = DATA.componentes.find(c => c.Id == 155);
            if (cinta) addCompRowWithData(n, cinta, parseFloat((alto + 0.5).toFixed(2)));

            // Juego de soportes (129)
            let soportes = DATA.componentes.find(c => c.Id == 129);
            if (soportes) addCompRowWithData(n, soportes, 2);

            // Guías Aluminio (63)
            let guias = DATA.componentes.find(c => c.Id == 63);
            if (guias) addCompRowWithData(n, guias, parseFloat((alto * 2).toFixed(2)));

            // Enrollador (120/121/122)
            let enrId = alto <= 1.4 ? 120 : (alto <= 2.3 ? 121 : 122);
            let enrollador = DATA.componentes.find(c => c.Id == enrId);
            if (enrollador) addCompRowWithData(n, enrollador, 1);

            // Caja (126/127/157)
            let cajaId = alto <= 1.4 ? 126 : (alto <= 2.3 ? 127 : 157);
            let caja = DATA.componentes.find(c => c.Id == cajaId);
            if (caja) addCompRowWithData(n, caja, 1);

            // Mano de Obra Exterior
            let moBase = DATA.componentes.find(c => c.Id == 93);
            if (moBase) addCompRowWithData(n, moBase, 1);
            if (m2 > 4) {
                let moPlus = DATA.componentes.find(c => c.Id == 95);
                if (moPlus) addCompRowWithData(n, moPlus, 1);
            }
            let moGuias = DATA.componentes.find(c => c.Id == 97);
            if (moGuias) addCompRowWithData(n, moGuias, 1);

        } else if (accion === 'manual_antognetti') {
            // Eje 70mm
            let eje = DATA.componentes.find(c => c.Id == 150);
            if (eje) addCompRowWithData(n, eje, parseFloat(ancho.toFixed(2)));

            // Polea (151/152)
            let poleaId = m2 <= 1.5 ? 151 : 152;
            let polea = DATA.componentes.find(c => c.Id == poleaId);
            if (polea) addCompRowWithData(n, polea, 1);

            // Tacos
            let tacos = DATA.componentes.find(c => c.Id == 153);
            if (tacos) addCompRowWithData(n, tacos, 2);

            // Puntas de eje
            let puntas = DATA.componentes.find(c => c.Id == 154);
            if (puntas) addCompRowWithData(n, puntas, 1);

            // Caño cinta (alto + 0.5)
            let cano = DATA.componentes.find(c => c.Id == 156);
            if (cano) addCompRowWithData(n, cano, parseFloat((alto + 0.5).toFixed(2)));

            // Juego de soportes (129)
            let soportes = DATA.componentes.find(c => c.Id == 129);
            if (soportes) addCompRowWithData(n, soportes, 2);

            // Guías Aluminio (63)
            let guias = DATA.componentes.find(c => c.Id == 63);
            if (guias) addCompRowWithData(n, guias, parseFloat((alto * 2).toFixed(2)));

            // Antognetti (136/137)
            let antId = m2 <= 1.5 ? 136 : 137;
            let antognetti = DATA.componentes.find(c => c.Id == antId);
            if (antognetti) addCompRowWithData(n, antognetti, 1);

            // Mano de Obra Exterior
            let moBase = DATA.componentes.find(c => c.Id == 93);
            if (moBase) addCompRowWithData(n, moBase, 1);
            if (m2 > 4) {
                let moPlus = DATA.componentes.find(c => c.Id == 95);
                if (moPlus) addCompRowWithData(n, moPlus, 1);
            }
            let moGuias = DATA.componentes.find(c => c.Id == 97);
            if (moGuias) addCompRowWithData(n, moGuias, 1);
        }
    } else if (cat === 'Interior') {
        // Mano de obra Interior
        let moBase = DATA.componentes.find(c => c.Id == 92);
        if (moBase) addCompRowWithData(n, moBase, 1);
    }

    recalcUnidad(n);
}
function addCompRow(n) {
    let compOpts = '<option value="">Seleccionar...</option>';
    DATA.componentes.forEach(c => { compOpts += '<option value="' + c.Id + '">' + cleanLabel(c.Nombre) + '</option>'; });
    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    row.innerHTML = '<td><select onchange="compSelected(this,' + n + ')" style="min-width:160px">' + compOpts + '</select></td><td><input type="number" value="1" step="0.01" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-costo hide-margin">0</td><td class="c-moneda hide-margin">-</td><td class="hide-margin"><input type="number" value="40" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-precio">$0</td><td class="c-subtotal">$0</td><td class="c-iva">21%</td><td><button class="btn-remove" onclick="this.closest(\'tr\').remove();recalcUnidad(' + n + ')">✕</button></td>';
    tbody.appendChild(row);
}
function addCompRowWithData(n, comp, qty, lineId = null, forcedPrice = null) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let costo = comp.Costo_unitario || 0;
    let moneda = comp.Moneda_costo || 'ARS';
    let margen = comp.Margen_default || 40;
    let costoArs = moneda === 'USD' ? costo * tc : costo;
    let precio = forcedPrice !== null ? forcedPrice : (costoArs * (1 + margen / 100));
    let iva = comp.Alicuota_IVA_venta || '21';
    let compOpts = '';
    // If we have an ID, we select it. If not (text only), we just show all and maybe select none or first?
    // Better: if comp.Id is null (custom item), we should perhaps have a free text input?
    // Current requirement: "Por cada componente: Nombre...".
    // For now, if comp.Id is valid we select it.
    if (comp.Id) {
        DATA.componentes.forEach(c => { compOpts += '<option value="' + c.Id + '"' + (c.Id === comp.Id ? ' selected' : '') + '>' + cleanLabel(c.Nombre) + '</option>'; });
    } else {
        compOpts = '<option value="" selected>' + cleanLabel(comp.Nombre) + ' (Custom)</option>';
        DATA.componentes.forEach(c => { compOpts += '<option value="' + c.Id + '">' + cleanLabel(c.Nombre) + '</option>'; });
    }

    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    if (lineId) row.setAttribute('data-db-id', lineId);

    row.innerHTML = '<td><select onchange="compSelected(this,' + n + ')" style="min-width:160px">' + compOpts + '</select></td><td><input type="number" value="' + qty + '" step="0.01" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-costo hide-margin">' + Number(costo).toFixed(2) + '</td><td class="c-moneda hide-margin">' + moneda + '</td><td class="hide-margin"><input type="number" value="' + margen + '" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-precio">' + fmt(precio) + '</td><td class="c-subtotal">' + fmt(precio * qty) + '</td><td class="c-iva">' + iva + '%</td><td><button class="btn-remove" onclick="this.closest(\'tr\').remove();recalcUnidad(' + n + ')">✕</button></td>';
    tbody.appendChild(row);
}
function compSelected(sel, n) {
    let compId = sel.value;
    let comp = DATA.componentes.find(c => c.Id == compId);
    if (!comp) return;
    let row = sel.closest('tr');
    row.querySelector('.c-costo').textContent = (comp.Costo_unitario || 0).toFixed(2);
    row.querySelector('.c-moneda').textContent = comp.Moneda_costo || 'ARS';
    row.querySelector('.c-iva').textContent = (comp.Alicuota_IVA_venta || '21') + '%';
    let margenInput = row.querySelectorAll('input[type="number"]')[1];
    if (margenInput) margenInput.value = comp.Margen_default || 40;
    recalcUnidad(n);
}
function recalcUnidad(n) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let rows = document.querySelectorAll('#comps-u-' + n + ' tr');
    let subtotal = 0;
    rows.forEach(r => {
        let costo = parseFloat(r.querySelector('.c-costo')?.textContent) || 0;
        let moneda = r.querySelector('.c-moneda')?.textContent || 'ARS';
        let inputs = r.querySelectorAll('input[type="number"]');
        let qty = parseFloat(inputs[0]?.value) || 1;
        let margen = parseFloat(inputs[1]?.value) || 0;
        let costoArs = moneda === 'USD' ? costo * tc : costo;
        let precio = costoArs * (1 + margen / 100);
        let sub = precio * qty;
        r.querySelector('.c-precio').textContent = fmt(precio);
        r.querySelector('.c-subtotal').textContent = fmt(sub);
        subtotal += sub;
    });
    let el = document.getElementById('sub-u-' + n);
    if (el) el.textContent = fmt(subtotal);
    recalcTotal();
}
function recalcTotal() {
    let subtotal = 0, iva21 = 0, iva105 = 0;
    let tc = DATA.tc.Dolar_oficial || 1150;
    document.querySelectorAll('[id^="comps-u-"]').forEach(tbody => {
        tbody.querySelectorAll('tr').forEach(r => {
            let costo = parseFloat(r.querySelector('.c-costo')?.textContent) || 0;
            let moneda = r.querySelector('.c-moneda')?.textContent || 'ARS';
            let inputs = r.querySelectorAll('input[type="number"]');
            let qty = parseFloat(inputs[0]?.value) || 1;
            let margen = parseFloat(inputs[1]?.value) || 0;
            let iva = (r.querySelector('.c-iva')?.textContent || '21').replace(/%/g, '').trim();
            let costoArs = moneda === 'USD' ? costo * tc : costo;
            let precio = costoArs * (1 + margen / 100);
            let sub = precio * qty;
            subtotal += sub;
            if (iva === '10.5') iva105 += sub * 0.105;
            else iva21 += sub * 0.21;
        });
    });
    let total = subtotal + iva21 + iva105;
    let sinFact = total * 0.9;
    document.getElementById('np-subtotal').textContent = fmt(subtotal);
    document.getElementById('np-iva21').textContent = fmt(iva21);
    document.getElementById('np-iva105').textContent = fmt(iva105);
    document.getElementById('np-total').textContent = fmt(total);
    document.getElementById('np-sinfact').textContent = fmt(sinFact);
    document.getElementById('np-resumen').style.display = subtotal > 0 ? 'block' : 'none';
}

async function savePres() {
    let modal = document.querySelector('#modal-pres .modal');
    let editPresId = modal.getAttribute('data-db-id');

    let clienteId = document.getElementById('np-cliente').value;
    let zonaId = document.getElementById('np-zona').value;
    if (!clienteId) { alert('Seleccioná un cliente'); return; }
    if (!zonaId) { alert('Seleccioná una zona'); return; }
    let tc = DATA.tc.Dolar_oficial || 1150;

    let presId = editPresId;
    let num = '';

    if (editPresId) {
        // UPDATE Existing
        let oldP = DATA.presupuestos.find(p => p.Id == editPresId);
        num = oldP.Numero;
        await apiPatch(TBL.presupuestos, {
            Id: editPresId,
            Canal: document.getElementById('np-canal').value,
            Quiere_factura: document.getElementById('np-factura').checked
        });
        await apiLink(TBL.presupuestos, 'canpten8owymbde', editPresId, [{ Id: parseInt(clienteId) }]);
        await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', editPresId, [{ Id: parseInt(zonaId) }]);
        let propId = document.getElementById('np-propiedad').value;
        if (propId) await apiLink(TBL.presupuestos, 'cpf764utp1w7yj0', editPresId, [{ Id: parseInt(propId) }]);
    } else {
        // CREATE New
        let year = new Date().getFullYear();
        num = year + '-' + (String(DATA.presupuestos.length + 1).padStart(4, '0'));
        let presData = { Numero: num, Fecha: new Date().toISOString().split('T')[0], Estado: 'Borrador', TC_usado: tc, Canal: document.getElementById('np-canal').value, Quiere_factura: document.getElementById('np-factura').checked, Incluye_instalacion: true };
        let pres = await apiPost(TBL.presupuestos, presData);
        presId = pres.Id || pres.id;
        if (!presId) { alert('Error creando presupuesto'); return; }
        await apiLink(TBL.presupuestos, 'canpten8owymbde', presId, [{ Id: parseInt(clienteId) }]);
        await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', presId, [{ Id: parseInt(zonaId) }]);
        let propId = document.getElementById('np-propiedad').value;
        if (propId) await apiLink(TBL.presupuestos, 'cpf764utp1w7yj0', presId, [{ Id: parseInt(propId) }]);
        let pagoId = document.getElementById('np-pago').value;
        if (pagoId) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', presId, [{ Id: parseInt(pagoId) }]);
    }

    let subtotalNeto = 0, totalIva21 = 0, totalIva105 = 0;
    let unidadCards = document.querySelectorAll('[id^="unidad-"]');

    // Deletion Logic
    let processedUnitIds = [];

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
            // Update Producto_base link on edit
            let prodSelValEdit = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelValEdit) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelValEdit) }]);
        } else {
            let unidad = await apiPost(TBL.unidades, uData);
            uId = unidad.Id || unidad.id;
            await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', uId, [{ Id: presId }]);
            // Link Producto_base if selected
            let prodSelVal = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelVal) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelVal) }]);
        }

        let rows = document.querySelectorAll('#comps-u-' + n + ' tr');
        let orden = 0;
        // Lines deletion needs logic: get all current lines for unit in DB, compare with filtered processed.
        // It's easier to fetch *all* possible lines for this unit if updating, but we only have global DATA.lineas which is a snapshot.
        let originalLinesForUnit = [];
        if (cardDbId) {
            originalLinesForUnit = DATA.lineas.filter(l => {
                let link = l.Unidad;
                return (link && (link.Id || link) == cardDbId);
            });
        }
        let processedLineIds = [];

        for (let r of rows) {
            orden++;
            let rowDbId = r.getAttribute('data-db-id');
            let sel = r.querySelector('select');
            let compId = sel ? sel.value : null;
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
                Descripcion_pdf: sel ? sel.options[sel.selectedIndex]?.text : 'Item',
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

            if (rowDbId) {
                await apiPatch(TBL.lineas, { Id: rowDbId, ...lineaData });
                processedLineIds.push(rowDbId);
            } else {
                let linea = await apiPost(TBL.lineas, lineaData);
                let lineaId = linea.Id || linea.id;
                if (lineaId) {
                    await apiLink(TBL.lineas, 'c4hnodnss6zlr32', lineaId, [{ Id: presId }]);
                    if (compId) await apiLink(TBL.lineas, 'czka6po5myr5wu6', lineaId, [{ Id: parseInt(compId) }]);
                    if (uId) await apiLink(TBL.lineas, 'cn9406tc3q1jmw0', lineaId, [{ Id: uId }]);
                }
            }
            subtotalNeto += sub;
            if (iva === '10.5') totalIva105 += montoIva;
            else totalIva21 += montoIva;
        }

        // Delete removed lines (only if unit existed)
        if (cardDbId) {
            for (let ol of originalLinesForUnit) {
                let imid = ol.Id || ol.id;
                if (!processedLineIds.includes(imid)) {
                    await apiDelete(TBL.lineas, imid);
                }
            }
        }
    }

    // Delete removed Units
    if (editPresId) {
        // Get original units for this budget
        let originalUnits = DATA.unidades.filter(u => {
            let link = u.Presupuesto;
            return (link && (link.Id || link) == editPresId);
        });

        for (let ou of originalUnits) {
            let ouId = ou.Id || ou.id;
            if (!processedUnitIds.includes(ouId)) {
                // Cascading delete lines? Safe to delete lines first if we can find them.
                // Assuming DATA.lineas is current snapshot.
                let uLines = DATA.lineas.filter(l => {
                    let link = l.Unidad;
                    return (link && (link.Id || link) == ouId);
                });
                for (let l of uLines) await apiDelete(TBL.lineas, l.Id || l.id);
                await apiDelete(TBL.unidades, ouId);
            }
        }
    }

    let totalConIva = subtotalNeto + totalIva21 + totalIva105;
    let sinFact = totalConIva * 0.9;
    await apiPatch(TBL.presupuestos, { Id: presId, Subtotal_neto: subtotalNeto, Subtotal_items: subtotalNeto, IVA_21: totalIva21, IVA_105: totalIva105, Total_con_IVA: totalConIva, Total: totalConIva, Descuento_sin_factura_pct: 10, Total_sin_factura: sinFact });

    // Refresh data
    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.lineas = await apiGet(TBL.lineas);
    DATA.unidades = await apiGet(TBL.unidades);
    loadDashboard();
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);

    closeModal();
    if (confirm('Presupuesto ' + num + ' guardado. ¿Ver ahora?')) {
        viewPresupuesto(presId);
    }
}

async function aplicarAumento() {
    let pctVal = document.getElementById('aumento-pct').value;
    let cat = document.getElementById('aumento-cat').value;
    if (!pctVal) { alert('Ingresá un porcentaje'); return; }
    let pct = parseFloat(pctVal);
    if (pct === 0) return;

    if (!confirm('¿Estás seguro de aumentar ' + pct + '% a ' + cleanLabel(cat) + '?')) return;

    let toUpdate = DATA.componentes.filter(c => {
        if (cat === 'Todos') return true;
        return c.Tipo_componente === cat;
    });

    if (toUpdate.length === 0) { alert('No hay componentes para actualizar'); return; }

    let patchData = [];
    toUpdate.forEach(c => {
        let costo = parseFloat(c.Costo_unitario || 0);
        let newCosto = costo * (1 + pct / 100);
        patchData.push({ Id: c.Id, Costo_unitario: newCosto });
        // Update local data
        c.Costo_unitario = newCosto;
    });

    // Bulk update
    try {
        await apiPatch(TBL.componentes, patchData);
        alert('Se actualizaron ' + patchData.length + ' componentes correctamente.');
        loadPrecios();

        // Add to history
        let tbody = document.getElementById('aumento-historial');
        let row = '<tr><td>' + new Date().toLocaleString() + '</td><td>' + pct + '%</td><td>' + cleanLabel(cat) + '</td><td>' + patchData.length + '</td></tr>';
        tbody.insertAdjacentHTML('afterbegin', row);

        document.getElementById('aumento-pct').value = '';
    } catch (e) {
        console.error(e);
        alert('Error al actualizar precios: ' + e.message);
    }
}

async function generarPDF(presId) {
    let pres = DATA.presupuestos.find(p => p.Id == presId);
    if (!pres) { alert('Presupuesto no encontrado'); return; }
    try {
        let res = await fetchBudgetDeepData(presId);
        let client = res.client || {};
        let zona = res.zona || {};
        let pago = res.pago || '-';
        let presUnidades = res.unidades;
        let presLineas = res.lineas;

        let fecha = new Date(pres.Fecha).toLocaleDateString() || '-';
        let venc = new Date(new Date(pres.Fecha).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString();

        let html = `
            <div id="pdf-content">
                <div class="pdf-header">
                    <div class="pdf-logo">
                        <img src="logo-pdf.png" alt="Persiana Total">
                    </div>
                    <div class="pdf-company-info">
                        <h3>PRESUPUESTO #${pres.Numero || '-'}</h3>
                        <p>Tel: 0342 4895492</p>
                        <p>WhatsApp: 3426393439</p>
                        <p>persianatotal@hotmail.com</p>
                        <p>www.persianatotal.com.ar</p>
                    </div>
                </div>

                <div class="pdf-title-row">
                    <div class="pdf-meta">
                        <p>Fecha: ${fecha}</p>
                        <p>Válido hasta: ${venc}</p>
                        <p>Estado: ${badgeHtml(pres.Estado)}</p>
                    </div>
                    <div class="pdf-meta" style="text-align:right">
                        <h3>CLIENTE</h3>
                        <p><strong>${cleanLabel(client.Nombre) || '-'}</strong></p>
                        <p>${client.Telefono || ''}</p>
                        <p>${res.propDir || ''}</p>
                        <p>${zona.Nombre ? 'Zona: ' + cleanLabel(zona.Nombre) : ''}</p>
                    </div>
                </div>
        `;

        for (let u of presUnidades) {
            let unitLines = presLineas.filter(l => l._unidadId == u.Id);
            unitLines.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
            let unitTotal = unitLines.reduce((acc, l) => acc + (parseFloat(l.Subtotal_ARS) || 0), 0);

            let measures = u.Ancho_m && u.Alto_m ? ` (${u.Ancho_m}m × ${u.Alto_m}m)` : '';

            html += `
                <div class="pdf-unit" style="margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <div class="pdf-unit-header" style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 1.1em; color: #1f2937;">${cleanLabel(u.Nombre)} - ${cleanLabel(u.Ubicacion) || ''}${measures}</span>
                        <span style="color: #4b5563; font-weight: normal;">${cleanLabel(u.Tipo_trabajo) || ''}</span>
                    </div>
                    <ul style="margin: 0; padding-left: 25px; font-size: 1em; color: #374151; list-style-type: disc;">
            `;

            let isRepair = u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service';
            let repairLabels = {
                'cambio_eje': 'Cambio de eje completo',
                'cambio_cinta': 'Cambio de cinta',
                'cambio_laterales': 'Cambio de laterales y flejes',
                'cambio_resortes': 'Cambio de resortes',
                'cambio_polea_tacos': 'Cambio de polea, tacos y punteras',
                'bobinado_motor': 'Bobinado de motor'
            };

            if (isRepair) {
                let repName = repairLabels[u.Tipo_reparacion] || 'Reparación / Service';
                html += `<li style="margin-bottom: 4px;">${repName}</li>`;
            }

            // Mano_obra descriptive labels for PDF
            let hasMO = false, hasMotorMO = false, hasGuiasMO = false;
            for (let l of unitLines) {
                let compObj = l._componenteId ? DATA.componentes.find(c => c.Id == l._componenteId) : null;
                let tipoComp = compObj ? compObj.Tipo_componente : '';

                // If repair, skip materials and labor (already grouped), but KEEP travel fees (Viáticos)
                if (isRepair) {
                    if (compObj && compObj.Nombre && compObj.Nombre.toLowerCase().includes('viático')) {
                        html += `<li style="margin-bottom: 4px;">${cleanLabel(l.Descripcion_pdf || 'Viático')}</li>`;
                    }
                    continue;
                }

                if (tipoComp === 'Mano_obra') {
                    // Track which MO items exist for descriptive text
                    if (compObj.Id == 92 || compObj.Id == 93 || compObj.Id == 94) hasMO = true;
                    else if (compObj.Id == 96) hasMotorMO = true;
                    else if (compObj.Id == 97) hasGuiasMO = true;
                    // Skip individual MO listing
                    continue;
                }
                html += `<li style="margin-bottom: 4px;">${cleanLabel(l.Descripcion_pdf || 'Item')}</li>`;
            }
            // Add descriptive MO text (only for non-repairs)
            if (!isRepair && (hasMO || hasMotorMO || hasGuiasMO)) html += `<li style="margin-bottom: 4px;">Incluye instalación completa</li>`;

            html += `
                    </ul>
                    <div style="text-align: right; margin-top: 12px; font-size: 1.1em; font-weight: bold; color: #111;">
                        Precio unidad: ${fmt(unitTotal)}
                    </div>
                </div>
            `;
        }

        let sub = pres.Subtotal_neto || 0;
        let iva21 = pres.IVA_21 || 0;
        let iva105 = pres.IVA_105 || 0;
        let total = pres.Total_con_IVA || 0;

        html += `
                <div class="pdf-totals">
                    <div class="pdf-totals-box">
                        <div class="pdf-total-row"><span>Subtotal Neto:</span> <span>${fmt(sub)}</span></div>
                        ${iva21 > 0 ? `<div class='pdf-total-row'><span>IVA 21%:</span> <span>${fmt(iva21)}</span></div>` : ''}
                        ${iva105 > 0 ? `<div class='pdf-total-row'><span>IVA 10.5%:</span> <span>${fmt(iva105)}</span></div>` : ''}
                        <div class="pdf-total-row final"><span>TOTAL:</span> <span>${fmt(total)}</span></div>
                        <div class="pdf-total-row" style="margin-top:10px;font-size:0.8em;color:#6b7280">
                            Condición de pago: ${cleanLabel(pago)}
                        </div>
                    </div>
                </div>

                <div class="pdf-footer">
                    <div>
                        <p>Presupuesto válido por 15 días.</p>
                        <p>Los precios pueden sufrir modificaciones sin previo aviso.</p>
                    </div>
                    <div class="pdf-signature">
                        Firma y Aclaración
                    </div>
                </div>
            </div>
        `;

        let container = document.getElementById('pdf-content');
        if (!container) { alert('Error: Contenedor PDF no encontrado'); return; }
        container.innerHTML = html;

        let opt = {
            margin: 0,
            filename: `Presupuesto_${pres.Numero}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(container.firstElementChild).set(opt).save();

    } catch (e) {
        console.error(e);
        alert('Error generando PDF: ' + e.message);
    }
}

// Helpers for View/Edit/Duplicate (Fetching Links)
async function fetchBudgetDeepData(presId) {
    let client = {}, zona = {}, pago = '-';

    // Header links
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

    // Refresh data
    DATA.unidades = await apiGet(TBL.unidades);
    DATA.lineas = await apiGet(TBL.lineas);

    /* 
    DIAGNOSTICS (User requested):
    console.log('DATA.unidades total:', DATA.unidades.length);
    if(DATA.unidades.length > 0) console.log('Primera unidad:', JSON.stringify(DATA.unidades[0]));
    console.log('DATA.lineas total:', DATA.lineas.length);
    if(DATA.lineas.length > 0) console.log('Primera linea:', JSON.stringify(DATA.lineas[0]));
    */

    let presUnidades = [];

    // Filter Units - Correct Column: 'Presupuestos' (plural)
    for (let u of DATA.unidades) {
        let pLink = resolveLink(u, 'Presupuestos');
        if (pLink && (pLink.Id == presId || pLink.id == presId)) {
            // Resolve Producto_base via apiGetLinks for correct ID
            let prodLinks = await apiGetLinks(TBL.unidades, 'co1b5kwpl8d2rya', u.Id);
            if (prodLinks.length > 0) {
                u._productoId = prodLinks[0].Id;
                u._productoNombre = prodLinks[0].Nombre || prodLinks[0].Title || '';
            } else {
                let prodLink = resolveLink(u, 'Producto_base');
                if (prodLink) {
                    u._productoId = prodLink.Id || prodLink.id;
                    u._productoNombre = prodLink.Nombre || prodLink.Title || '';
                } else if (u.Producto_base && typeof u.Producto_base === 'number') {
                    let prod = DATA.productos.find(p => p.Id == u.Producto_base);
                    if (prod) { u._productoId = prod.Id; u._productoNombre = prod.Nombre || ''; }
                }
            }
            presUnidades.push(u);
        }
    }
    presUnidades.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));

    let presLineas = [];
    // Filter Lines
    for (let l of DATA.lineas) {
        // Correct Column: 'Presupuestos'
        let pLink = resolveLink(l, 'Presupuestos');
        let matchesPres = pLink && (pLink.Id == presId || pLink.id == presId);

        // Correct Column: 'Presupuesto_Unidades'
        let uLink = resolveLink(l, 'Presupuesto_Unidades');
        let uId = uLink ? (uLink.Id || uLink.id) : null;
        let matchesUnit = uId && presUnidades.some(u => u.Id == uId);

        if (matchesPres || matchesUnit) {
            l._unidadId = uId;
            // Correct Column: 'Componentes'
            let cLink = resolveLink(l, 'Componentes');
            if (cLink) {
                l._componenteId = cLink.Id || cLink.id;
            }
            presLineas.push(l);
        }
    }

    return { client, zona, pago, propDir, unidades: presUnidades, lineas: presLineas };
}

async function viewPresupuesto(presId) {
    let pres = DATA.presupuestos.find(p => p.Id == presId);
    if (!pres) return;

    // Show loading state?
    document.getElementById('vp-contenido').innerHTML = '<p style="text-align:center;padding:20px">Cargando detalles...</p>';
    document.getElementById('modal-ver-pres').classList.add('show');

    let res = await fetchBudgetDeepData(presId);
    let client = res.client;
    let zona = res.zona;
    let pago = res.pago;
    let propAddr = '-';
    if (pres._propiedadDir && pres._propiedadDir !== '-') {
        propAddr = pres._propiedadDir;
    } else {
        let pLink = resolveLink(pres, 'Propiedades');
        if (pLink) {
            let pData = DATA.propiedades.find(x => x.Id == (pLink.Id || pLink.id));
            if (pData) propAddr = (pData.Direccion || '-') + ' - ' + (pData.Localidad || '-');
        }
    }

    document.getElementById('vp-titulo').textContent = 'Presupuesto #' + pres.Numero;
    document.getElementById('vp-fecha').textContent = new Date(pres.Fecha).toLocaleDateString();
    document.getElementById('vp-cliente').textContent = cleanLabel(client.Nombre) || '-';
    document.getElementById('vp-propiedad').textContent = cleanLabel(propAddr) || '-';
    document.getElementById('vp-zona').textContent = cleanLabel(zona.Nombre) || '-';
    document.getElementById('vp-estado').innerHTML = badgeHtml(pres.Estado);
    document.getElementById('vp-pago').textContent = cleanLabel(pago);

    // Add Address to viewPresupuesto modal - need to check if there is a place for it in modal structure
    // Since I don't want to change index.html too much, I'll inject it or replace something
    // Let's assume index.html has a place or I just add to a div.
    // Looking at index.html, it has:
    // <p><strong>Cliente:</strong> <span id="vp-cliente">-</span></p>
    // <p><strong>Zona:</strong> <span id="vp-zona">-</span></p>
    // I will add a new <p> for Direction after Cliente or similar.


    // Build Content
    let html = '';
    res.unidades.forEach(u => {
        let prodName = u._productoNombre || '';
        if (!prodName && u._productoId) {
            let prod = DATA.productos.find(p => p.Id == u._productoId);
            if (prod) prodName = prod.Nombre;
        }

        let uLines = res.lineas.filter(l => l._unidadId == u.Id);
        uLines.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));
        let unitTotal = uLines.reduce((acc, l) => acc + (parseFloat(l.Subtotal_ARS) || 0), 0);
        let measures = u.Ancho_m && u.Alto_m ? ` (${u.Ancho_m}m × ${u.Alto_m}m)` : '';

        html += `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:12px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px">
                <h4 style="margin:0;color:var(--grad1)">${cleanLabel(u.Nombre)} - ${cleanLabel(u.Ubicacion) || ''}${measures}</h4>
                <span style="font-size:0.9em; color:#6b7280; font-weight:bold">${cleanLabel(u.Tipo_trabajo) || ''}</span>
            </div>
            <div style="font-size:0.9em;color:#6b7280;margin-bottom:8px">
                <strong>Producto:</strong> ${cleanLabel(prodName) || '-'}
            </div>
            <ul style="margin: 0; padding-left: 20px; font-size: 0.9em; color: #374151; list-style-type: disc;">`;

        uLines.forEach(l => {
            html += `<li style="margin-bottom:2px">${cleanLabel(l.Descripcion_pdf)}</li>`;
        });

        html += `</ul>
            <div style="text-align:right; margin-top:10px; font-size:1.1em;">
                <strong>Precio unidad: ${fmt(unitTotal)}</strong>
            </div>
        </div>`;
    });

    document.getElementById('vp-contenido').innerHTML = html;
    document.getElementById('vp-subtotal').textContent = fmt(pres.Subtotal_neto);
    document.getElementById('vp-iva').textContent = fmt((pres.IVA_21 || 0) + (pres.IVA_105 || 0));
    document.getElementById('vp-total').textContent = fmt(pres.Total_con_IVA);

    let btnEdit = document.getElementById('vp-btn-editar');
    btnEdit.onclick = function () {
        closeVerPres();
        pres._clienteData = client;
        pres._zonaData = zona;
        pres._pagoNombre = pago;
        pres._unidades = res.unidades;
        pres._lineas = res.lineas;
        openNewPres(pres);
    };

    document.getElementById('vp-btn-pdf').onclick = function () { generarPDF(presId); };
}

async function changeStatus(presId, newStatus) {
    if (!confirm('¿Cambiar estado a ' + newStatus + '?')) {
        loadPresupuestos(); // Revert selection
        return;
    }
    await apiPatch(TBL.presupuestos, { Id: presId, Estado: newStatus });
    let p = DATA.presupuestos.find(x => x.Id == presId);
    if (p) p.Estado = newStatus;
    loadPresupuestos();
}

async function duplicatePresupuesto(presId) {
    if (!confirm('¿Duplicar este presupuesto?')) return;
    let oldP = DATA.presupuestos.find(p => p.Id == presId);
    if (!oldP) return;

    // Fetch deep data
    let res = await fetchBudgetDeepData(presId);

    // Create new Presupuesto
    let year = new Date().getFullYear();
    let num = year + '-' + (String(DATA.presupuestos.length + 1).padStart(4, '0'));
    let tc = DATA.tc.Dolar_oficial || 1150;

    let presData = {
        Numero: num,
        Fecha: new Date().toISOString().split('T')[0],
        Estado: 'Borrador',
        TC_usado: tc,
        Canal: oldP.Canal,
        Quiere_factura: oldP.Quiere_factura,
        Incluye_instalacion: true
    };
    let newPres = await apiPost(TBL.presupuestos, presData);
    let newId = newPres.Id || newPres.id;

    // Links
    if (res.client.Id) await apiLink(TBL.presupuestos, 'canpten8owymbde', newId, [{ Id: res.client.Id }]);
    if (res.zona.Id) await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', newId, [{ Id: res.zona.Id }]);
    // Find payment ID? We only have name from fetchBudgetDeepData.
    // If we want to duplicate accurately, we should find ID from DATA.formas_pago
    let pagoObj = DATA.formas_pago.find(f => f.Nombre === res.pago);
    if (pagoObj) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', newId, [{ Id: pagoObj.Id }]);

    // Duplicate Units & Lines
    for (let u of res.unidades) {
        let uData = {
            Nombre: u.Nombre,
            Ubicacion: u.Ubicacion,
            Tipo_trabajo: u.Tipo_trabajo,
            Ancho_m: u.Ancho_m,
            Alto_m: u.Alto_m,
            M2_calculados: u.M2_calculados,
            Orden: u.Orden
        };
        let newU = await apiPost(TBL.unidades, uData);
        let newUId = newU.Id || newU.id;
        await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', newUId, [{ Id: newId }]);

        // Lines
        let lines = res.lineas.filter(l => l._unidadId == u.Id);
        for (let l of lines) {
            let lineaData = {
                Descripcion_pdf: l.Descripcion_pdf,
                Ancho_m: l.Ancho_m,
                Alto_m: l.Alto_m,
                Cantidad: l.Cantidad,
                M2_calculados: l.M2_calculados,
                Moneda_costo_orig: l.Moneda_costo_orig,
                Costo_unit_orig: l.Costo_unit_orig,
                TC_aplicado: l.TC_aplicado,
                Costo_unit_ARS: l.Costo_unit_ARS,
                Margen_pct: l.Margen_pct,
                Precio_unit_ARS: l.Precio_unit_ARS,
                Subtotal_ARS: l.Subtotal_ARS,
                Alicuota_IVA: l.Alicuota_IVA,
                Monto_IVA: l.Monto_IVA,
                Subtotal_con_IVA: l.Subtotal_con_IVA,
                Orden: l.Orden,
                Visible_pdf: true
            };
            let newLine = await apiPost(TBL.lineas, lineaData);
            let nLId = newLine.Id || newLine.id;
            await apiLink(TBL.lineas, 'c4hnodnss6zlr32', nLId, [{ Id: newId }]); // Link to Pres
            await apiLink(TBL.lineas, 'cn9406tc3q1jmw0', nLId, [{ Id: newUId }]); // Link to Unit
            // Component Link?
            // l has no component ID in it directly from this fetch. 
            // In a deeper implementation we would track it, but for now we rely on Description matching or manual fix.
            // Duplicate won't link to component ID but keeps data values, which is acceptable for snapshot.
        }
    }

    // Copy Totals
    await apiPatch(TBL.presupuestos, {
        Id: newId,
        Subtotal_neto: oldP.Subtotal_neto,
        Subtotal_items: oldP.Subtotal_items,
        IVA_21: oldP.IVA_21,
        IVA_105: oldP.IVA_105,
        Total_con_IVA: oldP.Total_con_IVA,
        Total: oldP.Total
    });

    alert('Presupuesto duplicado exitosamente.');
    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.unidades = await apiGet(TBL.unidades);
    DATA.lineas = await apiGet(TBL.lineas);
    loadDashboard();
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);
}

loadAll();