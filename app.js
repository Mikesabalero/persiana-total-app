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
function showPage(id, btn) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById('page-' + id).classList.add('active'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); if (btn) btn.classList.add('active'); if (id === 'dashboard') loadDashboard(); if (id === 'presupuestos') loadPresupuestos(); if (id === 'precios') loadPrecios(); if (id === 'clientes') renderClientes(); if (id === 'propiedades') renderPropiedades(); if (id === 'config') loadConfig(); }
function showConfigTab(id, btn) { document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none'); document.getElementById('config-' + id).style.display = 'block'; document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
function closeVerPres() { document.getElementById('modal-ver-pres').classList.remove('show'); }
function resolveLink(row, field) { let v = row[field]; if (!v) return null; if (typeof v === 'object' && Array.isArray(v) && v.length > 0) return v[0]; if (typeof v === 'object' && v.Id) return v; return null; }
function resolveName(row, field, list, idField) { let link = resolveLink(row, field); if (!link) return '-'; let id = link.Id || link.id || link; let found = list.find(i => i.Id == id); return found ? found.Nombre || found.Title || '-' : '-'; }
const REPAIR_LABELS = {
    'cambio_eje': 'Cambio de eje completo',
    'cambio_cinta': 'Cambio de cinta',
    'cambio_laterales': 'Cambio de laterales y flejes',
    'cambio_resortes': 'Cambio de resortes',
    'cambio_polea_tacos': 'Cambio polea, tacos y punteras',
    'bobinado_motor': 'Bobinado de motor'
};

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
    console.log('Propiedades:', DATA.propiedades.length);
    DATA.anchos = await apiGet(TBL.anchos);
    for (let p of DATA.presupuestos) {
        try { let cl = await apiGetLinks(TBL.presupuestos, 'canpten8owymbde', p.Id); if (cl.length > 0) p._clienteNombre = cl[0].Nombre || cl[0].Title || '-'; else p._clienteNombre = '-'; } catch (e) { p._clienteNombre = '-'; }
        try { let zl = await apiGetLinks(TBL.presupuestos, 'cr3s0ox51qopwl4', p.Id); if (zl.length > 0) p._zonaNombre = zl[0].Nombre || zl[0].Title || '-'; else p._zonaNombre = '-'; } catch (e) { p._zonaNombre = '-'; }
        try { let pl = await apiGetLinks(TBL.presupuestos, 'cpf764utp1w7yj0', p.Id); if (pl.length > 0) { let propFull = DATA.propiedades.find(pr => pr.Id == pl[0].Id); p._propiedadDir = propFull ? (propFull.Direccion || '-') + ' - ' + (propFull.Localidad || '-') : (pl[0].Nombre || '-'); } else p._propiedadDir = '-'; } catch (e) { p._propiedadDir = '-'; }
    }
    loadDashboard();
    renderPropiedades();
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
function renderClientes() {
    let tb = document.getElementById('cli-table');
    tb.innerHTML = '';
    DATA.clientes.forEach(c => {
        let presCount = 0;
        let pl = c.Presupuestos;
        if (Array.isArray(pl)) presCount = pl.length;
        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(c.Nombre)}</strong></td>
            <td>${c.Telefono || '-'}</td>
            <td>${c.Mail || '-'}</td>
            <td>${cleanLabel(c.Tipo || '-')}</td>
            <td>${cleanLabel(c.Condicion_fiscal || '-')}</td>
            <td>${c.CUIT_CUIL_DNI || '-'}</td>
            <td>${presCount}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-remove" onclick="openNewCliente(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deleteCliente(${c.id || c.Id}, '${c.Nombre.replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    });
}
function renderPropiedades() {
    let tb = document.getElementById('prop-table');
    if (!tb) return;
    tb.innerHTML = '';
    DATA.propiedades.forEach(p => {
        let cliName = resolveName(p, 'Clientes', DATA.clientes);
        let principal = p.Principal ? '✅ Sí' : 'No';
        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(p.Nombre)}</strong></td>
            <td>${p.Direccion || '-'}</td>
            <td>${p.Localidad || '-'}</td>
            <td>${cliName}</td>
            <td>${p.Telefono || '-'}</td>
            <td>${cleanLabel(p.Tipo_propiedad || '-')}</td>
            <td>${principal}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-remove" onclick="openNewPropiedad(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deletePropiedad(${p.id || p.Id}, '${p.Nombre.replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    });
}
function filterSelectOptions(inputId, selectId) {
    let search = document.getElementById(inputId).value.toLowerCase();
    let select = document.getElementById(selectId);
    let options = select.options;
    for (let i = 0; i < options.length; i++) {
        let txt = options[i].text.toLowerCase();
        options[i].style.display = txt.includes(search) || options[i].value === "" ? '' : 'none';
    }
}
function filterPropiedades() {
    let search = document.getElementById('prop-search').value.toLowerCase();
    let rows = document.querySelectorAll('#prop-table tr');
    rows.forEach(r => {
        let text = r.textContent.toLowerCase();
        let show = text.includes(search);
        r.style.display = show ? '' : 'none';
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
function filterPresupuestos() {
    let search = document.getElementById('pres-search').value.toLowerCase();
    let estado = document.getElementById('pres-filter-estado').value;
    let rows = document.querySelectorAll('#pres-table tr');
    rows.forEach(r => {
        let nro = r.cells[0]?.textContent.toLowerCase() || '';
        let cli = r.cells[2]?.textContent.toLowerCase() || '';
        let dir = r.cells[3]?.textContent.toLowerCase() || '';
        let zona = r.cells[4]?.textContent.toLowerCase() || '';
        let est = r.cells[8]?.textContent || ''; // Columna Estado (9na col. index 8)

        // El texto busca en todas estas columnas
        let matchesSearch = nro.includes(search) || cli.includes(search) || dir.includes(search) || zona.includes(search);

        // El estado debe coincidir exactamente si no es vacío
        let matchesEstado = !estado || est === estado;

        r.style.display = (matchesSearch && matchesEstado) ? '' : 'none';
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

async function openNewCliente(clientData = null) {
    document.getElementById('mc-title').textContent = clientData ? 'Editar Cliente' : 'Nuevo Cliente';
    let modal = document.getElementById('modal-cliente');
    modal.setAttribute('data-db-id', clientData ? (clientData.id || clientData.Id) : '');

    document.getElementById('nc-nombre').value = clientData ? clientData.Nombre : '';
    document.getElementById('nc-telefono').value = clientData ? clientData.Telefono || '' : '';
    document.getElementById('nc-mail').value = clientData ? clientData.Mail || '' : '';
    document.getElementById('nc-tipo').value = clientData ? (clientData.Tipo || 'Particular') : 'Particular';
    document.getElementById('nc-cond-fiscal').value = clientData ? (clientData.Condicion_fiscal || 'Consumidor Final') : 'Consumidor Final';
    document.getElementById('nc-cuit').value = clientData ? clientData.CUIT_CUIL_DNI || '' : '';

    modal.classList.add('show');
}

function closeModalCliente() {
    document.getElementById('modal-cliente').classList.remove('show');
}

async function saveCliente() {
    let id = document.getElementById('modal-cliente').getAttribute('data-db-id');
    let rawPhone = document.getElementById('nc-telefono').value;
    let cleanPhone = rawPhone.replace(/\D/g, '');

    if (cleanPhone) {
        let existing = DATA.clientes.find(c => {
            let existingPhone = (c.Telefono || '').replace(/\D/g, '');
            let existingId = c.Id || c.id;
            return existingPhone === cleanPhone && existingId != id;
        });
        if (existing) {
            alert(`Ya existe un cliente con ese teléfono: ${existing.Nombre}. Verificá antes de continuar.`);
            return;
        }
    }

    let data = {
        Nombre: document.getElementById('nc-nombre').value,
        Telefono: document.getElementById('nc-telefono').value,
        Mail: document.getElementById('nc-mail').value,
        Tipo: document.getElementById('nc-tipo').value,
        Condicion_fiscal: document.getElementById('nc-cond-fiscal').value,
        CUIT_CUIL_DNI: document.getElementById('nc-cuit').value
    };

    if (!data.Nombre) { alert('El nombre es obligatorio'); return; }

    try {
        if (id) {
            await apiPatch(TBL.clientes, { id: id, ...data });
        } else {
            await apiPost(TBL.clientes, data);
        }
        DATA.clientes = await apiGet(TBL.clientes);
        renderClientes();
        closeModalCliente();
    } catch (e) {
        console.error(e);
        alert('Error al guardar cliente');
    }
}

async function deleteCliente(id, name) {
    if (!confirm(`¿Eliminar cliente ${name}?`)) return;
    try {
        await apiDelete(TBL.clientes, id);
        DATA.clientes = await apiGet(TBL.clientes);
        renderClientes();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar cliente');
    }
}

async function openNewPropiedad(propData = null, preselectedClientId = null) {
    document.getElementById('mp-title').textContent = propData ? 'Editar Propiedad' : 'Nueva Propiedad';
    let modal = document.getElementById('modal-propiedad');
    modal.setAttribute('data-db-id', propData ? (propData.id || propData.Id) : '');

    // Llenar select de clientes
    let cs = document.getElementById('np-prop-cliente');
    cs.innerHTML = '<option value="">Seleccionar cliente...</option>';
    let selectedClientId = preselectedClientId;
    if (propData) {
        let link = resolveLink(propData, 'Clientes');
        if (link) selectedClientId = link.Id || link.id;
    }

    DATA.clientes.forEach(c => {
        let sel = (selectedClientId == c.Id) ? 'selected' : '';
        cs.innerHTML += `<option value="${c.Id}" ${sel}>${cleanLabel(c.Nombre)}</option>`;
    });

    document.getElementById('np-prop-nombre').value = propData ? propData.Nombre : '';
    document.getElementById('np-prop-direccion').value = propData ? propData.Direccion || '' : '';
    document.getElementById('np-prop-localidad').value = propData ? propData.Localidad || '' : '';
    document.getElementById('np-prop-telefono').value = propData ? propData.Telefono || '' : '';
    document.getElementById('np-prop-tipo').value = propData ? (propData.Tipo_propiedad || 'Casa') : 'Casa';
    document.getElementById('np-prop-inquilino').value = propData ? propData.Contacto_inquilino || '' : '';
    document.getElementById('np-prop-maps').value = propData ? propData.Ubicacion_maps || '' : '';
    document.getElementById('np-prop-horario').value = propData ? propData.Horario_disponible || '' : '';
    document.getElementById('np-prop-principal').checked = propData ? !!propData.Principal : false;

    modal.classList.add('show');
}

function closeModalPropiedad() {
    document.getElementById('modal-propiedad').classList.remove('show');
}

async function savePropiedad() {
    let id = document.getElementById('modal-propiedad').getAttribute('data-db-id');
    let cliId = document.getElementById('np-prop-cliente').value;

    if (!cliId) { alert('Debe seleccionar un cliente'); return; }

    let data = {
        Nombre: document.getElementById('np-prop-nombre').value,
        Direccion: document.getElementById('np-prop-direccion').value,
        Localidad: document.getElementById('np-prop-localidad').value,
        Telefono: document.getElementById('np-prop-telefono').value,
        Tipo_propiedad: document.getElementById('np-prop-tipo').value,
        Contacto_Inquilino: document.getElementById('np-prop-inquilino').value,
        Ubicacion_Maps: document.getElementById('np-prop-maps').value,
        Horario_Disponible: document.getElementById('np-prop-horario').value,
        Principal: document.getElementById('np-prop-principal').checked,
        Clientes: [{ Id: parseInt(cliId) }]
    };

    if (!data.Nombre) { alert('El nombre es obligatorio'); return; }

    try {
        if (id) {
            await apiPatch(TBL.propiedades, { id: id, ...data });
        } else {
            await apiPost(TBL.propiedades, data);
        }
        DATA.propiedades = await apiGet(TBL.propiedades);
        renderPropiedades();
        closeModalPropiedad();
        // Si el panel de cliente está abierto, actualizarlo
        let panel = document.getElementById('panel-cliente');
        if (panel.classList.contains('open')) {
            showClientDetail(parseInt(cliId));
        }
    } catch (e) {
        console.error(e);
        alert('Error al guardar propiedad');
    }
}

async function deletePropiedad(id, name) {
    if (!confirm(`¿Eliminar propiedad ${name}?`)) return;
    try {
        await apiDelete(TBL.propiedades, id);
        DATA.propiedades = await apiGet(TBL.propiedades);
        renderPropiedades();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar propiedad');
    }
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

    document.getElementById('np-pago').value = resolveLink(presData, 'Formas_pago')?.Id || '';
    document.getElementById('np-canal').value = presData ? (presData.Canal || 'Manual') : 'Manual';
    document.getElementById('np-factura').value = presData ? (presData.Facturacion || 'con_iva') : 'con_iva';

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

    let html = '<div class="unidad-card" id="unidad-' + n + '" data-db-id="' + uId + '"><div class="unidad-header"><h3>Unidad ' + n + '</h3><div style="display:flex;gap:8px;align-items:center"><span class="unidad-subtotal" id="sub-u-' + n + '">$0</span><button class="btn-remove" onclick="removeUnidad(' + n + ')" title="Eliminar">🗑</button></div></div>';
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
    html += '<button class="btn-add-comp" onclick="addCompRow(' + n + ')">+ Agregar componente</button></div>';
    document.getElementById('np-unidades').insertAdjacentHTML('beforeend', html);
    autoLoadComponents(n);
}

function removeUnidad(n) { document.getElementById('unidad-' + n)?.remove(); recalcTotal(); }


// ===== AUTO-LOAD COMPONENTS =====
const PESO_M2 = {
    16: 11, 17: 13, 18: 10, 19: 12, 20: 14,
    21: 4, 22: 7, 24: 3,
    25: 10, 26: 5, 27: 10, 28: 5, 29: 10
};
const PROD_COMP_MAP = {
    16: 33, 17: 34, 18: 35, 19: 36, 20: 37,
    21: 38, 22: 39, 23: 40, 24: 41,
    25: 42, 26: 43, 27: 44, 28: 45, 29: 46,
    31: 48, 32: 49
};
const CAT_SEGURIDAD = [16, 17, 18, 19, 20];
const CAT_EXTERIOR = [21, 22, 23, 24, 25, 26, 27, 28, 29];
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
        tbody.innerHTML = ''; recalcUnidad(n); return;
    }
    if (isGuias && (!ancho || !alto)) {
        console.log("Early return: Guias without measurements");
        tbody.innerHTML = ''; recalcUnidad(n); return;
    }

    let accion = accSelect ? accSelect.value : 'motor';
    if (cat === 'Seguridad') accion = 'motor';

    let m2 = ancho * alto;
    let pesoM2 = PESO_M2[pid] || 5;
    let peso = m2 * pesoM2;

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
            addCompRowWithData(n, comp, qty);
            let tc = DATA.tc.Dolar_oficial || 1150;
            let costoArs = (comp.Moneda_costo === 'USD' ? comp.Costo_unitario * tc : comp.Costo_unitario) || 0;
            let precioUnit = costoArs * (1 + (comp.Margen_default || 40) / 100);
            materialPriceTotal += precioUnit * qty;
            return precioUnit * qty;
        }
        return 0;
    };

    if (isRep) {
        let tipoRep = document.getElementById('u-' + n + '-tiporep')?.value;
        if (!tipoRep) { recalcUnidad(n); return; }
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
        let hasViatico = Array.from(tbody.querySelectorAll('input.filter-input')).some(i => i.value.toLowerCase().includes('viatico'));
        if (!hasViatico) {
            let zonaId = document.getElementById('np-zona')?.value;
            let zonaObj = DATA.zonas.find(z => z.Id == zonaId);
            let zonaNombre = (zonaObj?.Nombre || '').toLowerCase();
            let vId = 143;
            if (zonaNombre.includes('santa fe')) vId = 138;
            else if (zonaNombre.includes('santo tom')) vId = 139;
            else if (zonaNombre.includes('recreo')) vId = 140;
            else if (zonaNombre.includes('esperanza')) vId = 141;
            else if (zonaNombre.includes('paran')) vId = 142;
            let vComp = DATA.componentes.find(c => c.Id == vId);
            if (vComp) addCompRowWithData(n, vComp, 1);
        }
    } else if (isMotor) {
        let motorId = selectMotor(cat, peso, ancho, m2);
        if (motorId) {
            addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
            if (cat === 'Seguridad') {
                let ejeId = motorId === 55 ? 147 : ([50, 51].includes(motorId) ? 148 : ([52, 53, 54].includes(motorId) ? 149 : 147));
                addCompWithPrice(ejeId, parseFloat(ancho.toFixed(2)));
            } else {
                addCompWithPrice(150, parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
            }
        }
        addCompWithPrice(58, 1); addCompWithPrice(102, 1);
        if (m2 > 4) addCompWithPrice(95, 1);
        addCompWithPrice(103, 1);
    } else if (isPano) {
        let matCompId = PROD_COMP_MAP[pid];
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
        if (effectiveCat === 'Seguridad') addCompWithPrice(ancho < 5 ? 60 : 61, parseFloat((alto * 2).toFixed(2)));
        else addCompWithPrice(63, parseFloat((alto * 2).toFixed(2)));
        addCustomLabor("Mano de obra cambio guías", Math.max(materialPriceTotal * 0.5, 40000));
    } else {
        let matCompId = PROD_COMP_MAP[pid];
        if (matCompId) addCompRowWithData(n, DATA.componentes.find(c => c.Id == matCompId), m2 > 0 ? parseFloat(m2.toFixed(2)) : 1);
        if (cat === 'Seguridad') {
            let motorId = selectMotor(cat, peso, ancho, m2);
            if (motorId) {
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
                let ejeId = motorId === 55 ? 147 : ([50, 51].includes(motorId) ? 148 : 147);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == ejeId), parseFloat(ancho.toFixed(2)));
            }
            addCompRowWithData(n, DATA.componentes.find(c => c.Id == (ancho < 5 ? 60 : 61)), 1);
            addCompWithPrice(58, 1); addCompWithPrice(94, 1);
            if (m2 > 4) addCompWithPrice(95, 1);
            if (motorId) addCompWithPrice(96, 1);
            addCompWithPrice(97, 1);
        } else if (cat === 'Exterior') {
            if (accion === 'motor') {
                let motorId = selectMotor(cat, peso, ancho, m2);
                if (motorId) addCompRowWithData(n, DATA.componentes.find(c => c.Id == motorId), 1);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompRowWithData(n, DATA.componentes.find(c => c.Id == 161), Math.ceil(ancho / 0.4));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat((alto * 2).toFixed(2)));
                addCompWithPrice(58, 1); addCompWithPrice(93, 1);
                if (m2 > 4) addCompWithPrice(95, 1);
                if (motorId) addCompWithPrice(96, 1);
                addCompWithPrice(97, 1);
            } else if (accion === 'manual_cinta') {
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 151 : 152)), 1);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 153), 2);
                addCompWithPrice(154, 1); addCompWithPrice(155, parseFloat((alto + 0.5).toFixed(2)));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 129), 2);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat((alto * 2).toFixed(2)));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == (alto <= 1.4 ? 120 : (alto <= 2.3 ? 121 : 122))), 1);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == (alto <= 1.4 ? 126 : (alto <= 2.3 ? 127 : 157))), 1);
                addCompWithPrice(93, 1);
                if (m2 > 4) addCompWithPrice(95, 1);
                addCompWithPrice(97, 1);
            } else if (accion === 'manual_antognetti') {
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 150), parseFloat(ancho.toFixed(2)));
                if (pid === 27 || pid === 29) addCompWithPrice(161, Math.ceil(ancho / 0.4));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 151 : 152)), 1);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 153), 2);
                addCompWithPrice(154, 1); addCompWithPrice(156, parseFloat((alto + 0.5).toFixed(2)));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 129), 2);
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == 63), parseFloat((alto * 2).toFixed(2)));
                addCompRowWithData(n, DATA.componentes.find(c => c.Id == (m2 <= 1.5 ? 136 : 137)), 1);
                addCompWithPrice(93, 1);
                if (m2 > 4) addCompWithPrice(95, 1);
                addCompWithPrice(97, 1);
            }
        } else if (cat === 'Interior' && tipoTrabajo === 'Instalacion_nueva') {
            addCompRowWithData(n, DATA.componentes.find(c => c.Id == 92), 1);
        }
    }
    recalcUnidad(n);
}

function addCompRow(n) {
    let datalistId = `comp-list-${n}-${Date.now()}`;
    let compOpts = '';
    DATA.componentes.forEach(c => { compOpts += `<option value="${cleanLabel(c.Nombre)}">`; });
    let html = `<td>
        <input list="${datalistId}" class="filter-input" placeholder="Buscar componente..." onchange="compSelected(this, ${n})">
        <datalist id="${datalistId}">${compOpts}</datalist>
    </td>
    <td><input type="number" value="1" step="0.01" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-costo hide-margin">0</td>
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
function addCompRowWithData(n, comp, qty, lineId = null, forcedPrice = null) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let costo = comp.Costo_unitario || 0;
    let moneda = comp.Moneda_costo || 'ARS';
    let margen = comp.Margen_default || 40;
    let costoArs = moneda === 'USD' ? costo * tc : costo;
    let precio = forcedPrice !== null ? forcedPrice : (costoArs * (1 + margen / 100));
    let iva = comp.Alicuota_IVA_venta || '21';
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
    <td class="c-costo hide-margin">${Number(costo).toFixed(2)}</td>
    <td class="c-moneda hide-margin">${moneda}</td>
    <td class="hide-margin"><input type="number" value="${margen}" style="width:60px" oninput="recalcUnidad(${n})"></td>
    <td class="c-precio">${fmt(precio)}</td>
    <td class="c-subtotal">${fmt(precio * qty)}</td>
    <td class="c-iva">${iva}%</td>
    <td><button class="btn-remove" onclick="this.closest('tr').remove();recalcUnidad(${n})">✕</button></td>`;
    tbody.appendChild(row);
}
function compSelected(input, n) {
    let name = input.value;
    let comp = DATA.componentes.find(c => cleanLabel(c.Nombre) === name);
    if (!comp) return;
    let row = input.closest('tr');
    row.querySelector('.c-costo').textContent = (comp.Costo_unitario || 0).toFixed(2);
    row.querySelector('.c-moneda').textContent = comp.Moneda_costo || 'ARS';
    row.querySelector('.c-iva').textContent = (comp.Alicuota_IVA_venta || '21') + '%';
    let margenInput = row.querySelectorAll('input[type="number"]')[1];
    if (margenInput) margenInput.value = comp.Margen_default || 40;
    recalcUnidad(n);
}

function recalcUnidad(n) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let t = 0;
    document.querySelectorAll('#comps-u-' + n + ' tr').forEach(r => {
        let costo = parseFloat(r.querySelector('.c-costo')?.textContent) || 0;
        let mon = r.querySelector('.c-moneda')?.textContent || 'ARS';
        let inputs = r.querySelectorAll('input[type="number"]');
        let qty = parseFloat(inputs[0]?.value) || 0;
        let marg = parseFloat(inputs[1]?.value) || 0;
        let costoArs = mon === 'USD' ? costo * tc : costo;
        let pUnit = costoArs * (1 + marg / 100);
        let sub = pUnit * qty;
        r.querySelector('.c-precio').textContent = fmt(pUnit);
        r.querySelector('.c-subtotal').textContent = fmt(sub);
        t += sub;
    });
    document.getElementById('sub-u-' + n).textContent = fmt(t);
    recalcTotal();
}

function recalcTotal() {
    let total = 0;
    document.querySelectorAll('.unidad-subtotal').forEach(s => {
        total += parseFloat(s.textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0;
    });
    document.getElementById('np-total').textContent = fmt(total);
}
async function savePres() {
    let clienteId = document.getElementById('np-cliente').value;
    let zonaId = document.getElementById('np-zona').value;
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
        await apiLink(TBL.presupuestos, 'canpten8owymbde', editPresId, [{ Id: parseInt(clienteId) }]);
        await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', editPresId, [{ Id: parseInt(zonaId) }]);
        let propId = document.getElementById('np-propiedad').value;
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
            Incluye_instalacion: true
        };
        let pres = await apiPost(TBL.presupuestos, presData);
        presId = pres.Id || pres.id;
        if (!presId) { alert('Error creando presupuesto'); return; }
    }

    let subtotalNeto = 0, totalIva21 = 0, totalIva105 = 0;
    let unidadCards = document.querySelectorAll('[id^="unidad-"]');
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
            let prodSelValEdit = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelValEdit) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelValEdit) }]);
        } else {
            let unidad = await apiPost(TBL.unidades, uData);
            uId = unidad.Id || unidad.id;
            await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', uId, [{ Id: presId }]);
            let prodSelVal = document.getElementById('u-' + n + '-prod')?.value;
            if (prodSelVal) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodSelVal) }]);
        }

        let rows = document.querySelectorAll('#comps-u-' + n + ' tr');
        let orden = 0;
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

        if (cardDbId) {
            for (let ol of originalLinesForUnit) {
                let imid = ol.Id || ol.id;
                if (!processedLineIds.includes(imid)) await apiDelete(TBL.lineas, imid);
            }
        }
    }

    if (editPresId) {
        let originalUnits = DATA.unidades.filter(u => {
            let link = u.Presupuesto;
            return (link && (link.Id || link) == editPresId);
        });
        for (let ou of originalUnits) {
            let ouId = ou.Id || ou.id;
            if (!processedUnitIds.includes(ouId)) {
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

    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.lineas = await apiGet(TBL.lineas);
    DATA.unidades = await apiGet(TBL.unidades);
    loadDashboard();
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);
    closeModal();
    if (confirm('Presupuesto ' + num + ' guardado. ¿Ver ahora?')) viewPresupuesto(presId);
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
        c.Costo_unitario = newCosto;
    });

    try {
        await apiPatch(TBL.componentes, patchData);
        alert('Se actualizaron ' + patchData.length + ' componentes correctamente.');
        loadPrecios();
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
                    <div class="pdf-logo"><img src="logo-pdf.png" alt="Persiana Total"></div>
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
            let uLines = presLineas.filter(l => (l._unidadId || l.Unidad?.Id || l.Unidad) == u.Id);
            uLines.sort((a, b) => (a.Orden || 0) - (b.Orden || 0));

            let billingMode = pres.Facturacion;
            if (!billingMode) {
                let allRepair = presUnidades.every(unit => unit.Tipo_trabajo === 'Reparacion' || unit.Tipo_trabajo === 'Service');
                billingMode = allRepair ? 'sin_iva' : 'con_iva';
            }
            let isRepair = u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service';

            let unitTotal = uLines.reduce((acc, l) => acc + (parseFloat(l.Subtotal_con_IVA) || 0), 0);
            let measures = (u.Ancho_m && u.Alto_m) ? ` (${u.Ancho_m}m x ${u.Alto_m}m)` : '';

            html += `
                <div class="pdf-unit" style="margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <div class="pdf-unit-header" style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 1.1em; color: #1f2937;">${cleanLabel(u.Nombre)} - ${cleanLabel(u.Ubicacion) || ''}${measures}</span>
                        <span style="color: #4b5563; font-weight: normal;">${cleanLabel(u.Tipo_trabajo) || ''}</span>
                    </div>
                    <ul style="margin: 0; padding-left: 25px; font-size: 1em; color: #374151; list-style-type: disc;">
            `;

            if (isRepair) {
                let repLabel = REPAIR_LABELS[u.Tipo_reparacion] || 'Reparación / Service';
                html += `<li style="margin-bottom: 4px;">${repLabel}</li><li style="margin-bottom: 4px;">Incluye mano de obra</li>`;
            }

            let hasMO = false, hasMotorMO = false, hasGuiasMO = false;
            for (let l of uLines) {
                let compObj = l._componenteId ? DATA.componentes.find(c => c.Id == l._componenteId) : null;
                let tipoComp = compObj ? compObj.Tipo_componente : '';

                if (isRepair) {
                    if (compObj?.Nombre?.toLowerCase().includes('viático')) {
                        html += `<li style="margin-bottom: 4px;">${cleanLabel(l.Descripcion_pdf || 'Viático')}</li>`;
                    }
                    continue;
                }

                if (tipoComp === 'Mano_obra') {
                    if ([92, 93, 94].includes(compObj?.Id)) hasMO = true;
                    else if (compObj?.Id == 96) hasMotorMO = true;
                    else if (compObj?.Id == 97) hasGuiasMO = true;
                    continue;
                }

                let pWithIva = billingMode === 'con_iva' ? ` (${fmt(l.Subtotal_con_IVA / l.Cantidad)})` : '';
                html += `<li style="margin-bottom: 4px;">${cleanLabel(l.Descripcion_pdf)}${pWithIva}</li>`;
            }

            if (!isRepair && (hasMO || hasMotorMO || hasGuiasMO)) html += `<li style="margin-bottom: 4px;">Incluye instalación completa</li>`;

            html += `
                    </ul>
                    <div style="text-align: right; margin-top: 12px; font-size: 1.1em; font-weight: bold; color: #111;">
                        Precio unidad: ${fmt(unitTotal)}
                    </div>
                </div>
            `;
        }

        let billingMode = pres.Facturacion;
        if (!billingMode) {
            let allRepair = presUnidades.every(u => u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service');
            billingMode = allRepair ? 'sin_iva' : 'con_iva';
        }
        let total = pres.Total_con_IVA || 0;

        html += `<div class="pdf-totals" style="margin-top: 30px;">
                    <div class="pdf-totals-box" style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-left: auto; width: fit-content; min-width: 250px;">`;

        if (billingMode === 'con_iva') {
            html += `
                <div class="pdf-total-row final" style="display: flex; justify-content: space-between; font-size: 1.4em; font-weight: bold; color: #111; margin-bottom: 5px;"><span>TOTAL:</span> <span>${fmt(total)}</span></div>
                <div class="pdf-total-row info" style="font-size: 0.8em; color: #6b7280; text-align: right; margin-bottom: 15px;">Precios con IVA incluido</div>
                <div class="pdf-total-row discount" style="display: flex; justify-content: space-between; font-size: 0.9em; color: #4b5563; margin-bottom: 5px;"><span>Dto. 10% sin factura:</span> <span>-${fmt(total * 0.1)}</span></div>
                <div class="pdf-total-row result" style="display: flex; justify-content: space-between; font-size: 1.1em; font-weight: bold; color: #059669; border-top: 1px solid #e5e7eb; padding-top: 10px;"><span>Total sin factura:</span> <span>${fmt(total * 0.9)}</span></div>
            `;
        } else {
            html += `
                <div class="pdf-total-row final" style="display: flex; justify-content: space-between; font-size: 1.4em; font-weight: bold; color: #111;"><span>TOTAL:</span> <span>${fmt(total)}</span></div>
            `;
        }

        html += `
                    <div class="pdf-total-row" style="margin-top:20px; font-size:0.8em; color:#6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                        Condición de pago: ${cleanLabel(pago)}
                    </div>
                </div>
            </div>`;

        html += `
                <div class="pdf-footer" style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="font-size: 0.8em; color: #6b7280;"><p>Presupuesto válido por 15 días.</p><p>Los precios pueden sufrir modificaciones sin previo aviso.</p></div>
                    <div class="pdf-signature" style="border-top: 1px solid #374151; width: 200px; text-align: center; font-size: 0.8em; color: #374151; padding-top: 8px; margin-bottom: 10px;">Firma y Aclaración</div>
                </div>
            </div>`;
        let container = document.getElementById('pdf-content');
        if (!container) { alert('Error: Contenedor PDF no encontrado'); return; }
        container.innerHTML = html;
        let opt = { margin: 0, filename: `Presupuesto_${pres.Numero}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        html2pdf().from(container.firstElementChild).set(opt).save();
    } catch (e) { console.error(e); alert('Error generando PDF: ' + e.message); }
}

async function fetchBudgetDeepData(presId) {
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

async function viewPresupuesto(presId) {
    let pres = DATA.presupuestos.find(p => p.Id == presId);
    if (!pres) return;
    document.getElementById('vp-contenido').innerHTML = '<p style="text-align:center;padding:20px">Cargando detalles...</p>';
    document.getElementById('modal-ver-pres').classList.add('show');
    let res = await fetchBudgetDeepData(presId);
    let client = res.client;
    let zona = res.zona;
    let pago = res.pago;
    let propAddr = '-';
    if (pres._propiedadDir && pres._propiedadDir !== '-') propAddr = pres._propiedadDir;
    else {
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
        html += `</ul><div style="text-align:right; margin-top:10px; font-size:1.1em;"><strong>Precio unidad: ${fmt(unitTotal)}</strong></div></div>`;
    });
    document.getElementById('vp-contenido').innerHTML = html;

    let billingMode = pres.Facturacion;
    if (!billingMode) {
        let allRepair = res.unidades.every(u => u.Tipo_trabajo === 'Reparacion' || u.Tipo_trabajo === 'Service');
        billingMode = allRepair ? 'sin_iva' : 'con_iva';
    }

    document.getElementById('vp-subtotal').textContent = fmt(pres.Subtotal_neto);
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
        openNewPres(pres);
    };
    document.getElementById('vp-btn-pdf').onclick = function () { generarPDF(presId); };
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
    let res = await fetchBudgetDeepData(presId);
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
    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.unidades = await apiGet(TBL.unidades);
    DATA.lineas = await apiGet(TBL.lineas);
    loadDashboard();
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
        loadAll();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar presupuesto: ' + e.message);
    }
}

loadAll();

window.onclick = function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        if (event.target.id === 'modal-pres') closeModal();
        else if (event.target.id === 'modal-ver-pres') closeVerPres();
        else if (event.target.id === 'modal-cliente') closeModalCliente();
        else if (event.target.id === 'modal-propiedad') closeModalPropiedad();
    }
    if (event.target.classList.contains('detail-panel')) closeDetail();
};
