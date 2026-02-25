const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const BASE = 'pru2fsphj43juyr';
const H = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };
const TBL = { clientes: 'mwby85581fhjy27', propiedades: 'm0dwlr7ccoim1kf', historial: 'mimh9lp8bkew4t0', categorias: 'mulo5ve82d9ex7q', productos: 'mdr6mo695g0qz6d', componentes: 'mgh9e1zivvhpg26', prod_comp: 'mmjzqw7v4que9q3', tc: 'mhj9fovlmv9036x', zonas: 'mottig5nmj5e3kx', presupuestos: 'mn1yyjyovvoyxme', lineas: 'mv1e9trh23j0q3o', servicios: 'mz8qrki3hz4y7iv', formas_pago: 'm2t4fnjie88gfo0', unidades: 'mix059xkpsz15um', anchos: 'mayai71j546g3as', historial_aumentos: 'myumlbp9hemi3cu' };
let DATA = { clientes: [], propiedades: [], zonas: [], componentes: [], productos: [], prod_comp: [], presupuestos: [], lineas: [], unidades: [], formas_pago: [], tc: null, anchos: [], _loaded: { clientes: false, precios: false, presupuestos: false, presupuestos_deps: false, propiedades: false, config: false } };
let appReady = false;

const PAGE_SIZE = 20;
let PAGING = {
    clientes: { page: 1, total: 0 },
    presupuestos: { page: 1, total: 0 },
    propiedades: { page: 1, total: 0 }
};

async function apiGetPaged(tid, page, extraParams = '') {
    let offset = (page - 1) * PAGE_SIZE;
    let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=' + PAGE_SIZE + '&offset=' + offset + extraParams, { headers: H });
    if (!r.ok) return { list: [], total: 0 };
    let d = await r.json();
    return { list: d.list || [], total: d.pageInfo?.totalRows || 0 };
}

function renderPagination(containerId, pagingState, pageKey) {
    let container = document.getElementById(containerId);
    if (!container) return;
    let totalPages = Math.ceil(pagingState.total / PAGE_SIZE) || 1;
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top:16px; color:var(--text)">
            <button class="btn btn-secondary btn-sm" onclick="prevPage('${pageKey}')" ${pagingState.page <= 1 ? 'disabled' : ''}>« Anterior</button>
            <span>Página ${pagingState.page} de ${totalPages}</span>
            <button class="btn btn-secondary btn-sm" onclick="nextPage('${pageKey}')" ${pagingState.page >= totalPages ? 'disabled' : ''}>Siguiente »</button>
        </div>
    `;
}

async function prevPage(key) {
    if (PAGING[key].page > 1) {
        PAGING[key].page--;
        if (key === 'clientes') await renderClientes();
        if (key === 'presupuestos') await loadPresupuestos();
        if (key === 'propiedades') await renderPropiedades();
    }
}
async function nextPage(key) {
    let totalPages = Math.ceil(PAGING[key].total / PAGE_SIZE) || 1;
    if (PAGING[key].page < totalPages) {
        PAGING[key].page++;
        if (key === 'clientes') await renderClientes();
        if (key === 'presupuestos') await loadPresupuestos();
        if (key === 'propiedades') await renderPropiedades();
    }
}

function _showPageSpinner(pageId, show) {
    let page = document.getElementById('page-' + pageId);
    if (!page) return;
    let existing = page.querySelector('.lazy-spinner');
    if (show && !existing) {
        let d = document.createElement('div');
        d.className = 'lazy-spinner';
        d.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:60px;color:var(--text-light);font-size:1.1em;gap:10px;';
        d.innerHTML = '<div style="width:22px;height:22px;border:3px solid var(--border);border-top-color:var(--grad1);border-radius:50%;animation:spin .7s linear infinite"></div> Cargando datos...';
        page.prepend(d);
    } else if (!show && existing) {
        existing.remove();
    }
}

async function ensureData(page) {
    if (page === 'clientes' || page === 'propiedades') {
        if (!DATA._loaded.propiedades) {
            DATA.propiedades = await apiGet(TBL.propiedades);
            DATA._loaded.propiedades = true;
            DATA._loaded.clientes = true;
            console.log('Lazy loaded: Propiedades (' + DATA.propiedades.length + ')');
        }
    }
    if (page === 'precios') {
        if (!DATA._loaded.precios) {
            DATA.componentes = await apiGet(TBL.componentes);
            DATA._loaded.precios = true;
            console.log('Lazy loaded: Componentes (' + DATA.componentes.length + ')');
        }
    }
    if (page === 'presupuestos') {
        if (!DATA._loaded.presupuestos) {
            let [productos, prod_comp, unidades, lineas, propiedades] = await Promise.all([
                apiGet(TBL.productos), apiGet(TBL.prod_comp),
                apiGet(TBL.unidades), apiGet(TBL.lineas), apiGet(TBL.propiedades)
            ]);
            DATA.productos = productos;
            DATA.prod_comp = prod_comp;
            DATA.unidades = unidades;
            DATA.lineas = lineas;
            DATA.propiedades = propiedades;
            DATA._loaded.propiedades = true;
            DATA._loaded.presupuestos = true;
            console.log('Lazy loaded: Productos, Prod_Comp, Unidades, Lineas, Propiedades');
        }
    }
    if (page === 'config') {
        if (!DATA._loaded.config) {
            DATA.anchos = await apiGet(TBL.anchos);
            DATA._loaded.config = true;
            console.log('Lazy loaded: Anchos (' + DATA.anchos.length + ')');
        }
    }
}

async function showPage(id, btn) {
    if (!appReady) { alert("Cargando datos, por favor espere..."); return; }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Show spinner and lazy-load data for the page
    _showPageSpinner(id, true);
    try { await ensureData(id); } catch(e) { console.error('ensureData error:', e); }
    _showPageSpinner(id, false);
    // Render
    if (id === 'dashboard') loadDashboard();
    if (id === 'presupuestos') loadPresupuestos();
    if (id === 'precios') loadPrecios();
    if (id === 'clientes') renderClientes();
    if (id === 'propiedades') renderPropiedades();
    if (id === 'config') loadConfig();
}
function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
function closeVerPres() { document.getElementById('modal-ver-pres').classList.remove('show'); }
function closeVerCliente() { document.getElementById('modal-ver-cliente').classList.remove('show'); }
function closeModalCliente() { document.getElementById('modal-cliente').classList.remove('show'); }
function closeModalEditComp() { document.getElementById('modal-edit-comp').classList.remove('show'); }
// closeModalPropiedad definida más abajo (línea ~1363)

let _loadingEdit = false;
let unidadCount = 0;
let editPresId = null;

async function apiGet(tid, params = '') { let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=200' + params, { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiGetLinks(tid, colId, rowId) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId + '?limit=10', { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiPost(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'POST', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiPatch(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'PATCH', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiDelete(tid, id) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'DELETE', headers: H, body: JSON.stringify({ Id: id }) }); return r.json(); }
async function apiLink(tid, colId, rowId, linked) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId, { method: 'POST', headers: H, body: JSON.stringify(linked) }); return r.json(); }
// Helpers
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

function fmt(n) { if (n == null) return '$0'; return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function badgeHtml(estado) { let c = { 'Borrador': 'borrador', 'Enviado': 'enviado', 'Aprobado': 'aprobado', 'Rechazado': 'rechazado', 'Vencido': 'vencido', 'Facturado': 'facturado' }; return '<span class="badge badge-' + (c[estado] || 'borrador') + '">' + cleanLabel(estado) + '</span>'; }
function resolveLink(row, field) { let v = row[field]; if (!v) return null; if (typeof v === 'object' && Array.isArray(v) && v.length > 0) return v[0]; if (typeof v === 'object' && v.Id) return v; return null; }
function resolveName(row, field, list, idField) { let link = resolveLink(row, field); if (!link) return '-'; let id = link.Id || link.id || link; let found = list.find(i => i.Id == id); return found ? found.Nombre || found.Title || '-' : (link.Nombre || link.Title || '-'); }
function showConfigTab(id, btn) { document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none'); document.getElementById('config-' + id).style.display = 'block'; document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
const REPAIR_LABELS = {
    'cambio_eje': 'Cambio de eje completo',
    'cambio_cinta': 'Cambio de cinta',
    'cambio_laterales': 'Cambio de laterales y flejes',
    'cambio_resortes': 'Cambio de resortes',
    'cambio_polea_tacos': 'Cambio polea, tacos y punteras',
    'bobinado_motor': 'Bobinado de motor'
};

// cleanLabel ya definida arriba (línea 159)
async function _resolvePresupuestoLinks() {
    await Promise.all(DATA.presupuestos.map(async p => {
        try {
            const [cl, zl, pl] = await Promise.all([
                apiGetLinks(TBL.presupuestos, 'canpten8owymbde', p.Id),
                apiGetLinks(TBL.presupuestos, 'cr3s0ox51qopwl4', p.Id),
                apiGetLinks(TBL.presupuestos, 'cpf764utp1w7yj0', p.Id)
            ]);
            if (cl.length > 0) { p._clienteNombre = cl[0].Nombre || cl[0].Title || '-'; p._clienteId = cl[0].Id; }
            else { p._clienteNombre = '-'; p._clienteId = null; }
            if (zl.length > 0) { p._zonaNombre = zl[0].Nombre || zl[0].Title || '-'; p._zonaId = zl[0].Id; }
            else { p._zonaNombre = '-'; p._zonaId = null; }
            if (pl.length > 0) {
                p._propiedadId = pl[0].Id;
                let propFull = DATA.propiedades.find(pr => pr.Id == pl[0].Id);
                p._propiedadDir = propFull ? (propFull.Direccion || '-') + ' - ' + (propFull.Localidad || '-') : (pl[0].Nombre || '-');
            } else { p._propiedadDir = '-'; p._propiedadId = null; }
        } catch (e) { p._clienteNombre = '-'; p._clienteId = null; p._zonaNombre = '-'; p._zonaId = null; p._propiedadDir = '-'; p._propiedadId = null; }
    }));
}

async function initApp() {
    console.time('initApp');
    // Fase 1: Solo datos esenciales para dashboard
    let cliPaged = await apiGetPaged(TBL.clientes, 1, '&limit=1');
    let presPaged = await apiGetPaged(TBL.presupuestos, 1, '&sort=-Fecha&limit=5');
    
    PAGING.clientes.total = cliPaged.total;
    PAGING.presupuestos.total = presPaged.total;
    DATA.presupuestos = presPaged.list;

    [DATA.tc, DATA.zonas, DATA.formas_pago] = await Promise.all([
        apiGet(TBL.tc, '&where=(Vigente,eq,true)').then(r => r[0] || { Dolar_oficial: 1150 }),
        apiGet(TBL.zonas),
        apiGet(TBL.formas_pago)
    ]);
    // Resolver links de presupuestos para dashboard
    await _resolvePresupuestoLinks();
    loadDashboard();
    appReady = true;
    console.timeEnd('initApp');
    console.log('initApp: totales', PAGING.clientes.total, 'clientes,', PAGING.presupuestos.total, 'presupuestos');
}

async function reloadAllData() {
    // Recarga todo para dashboard y limpia lazy variables
    let cliPaged = await apiGetPaged(TBL.clientes, 1, '&limit=1');
    let presPaged = await apiGetPaged(TBL.presupuestos, 1, '&sort=-Fecha&limit=5');
    PAGING.clientes.total = cliPaged.total;
    PAGING.presupuestos.total = presPaged.total;
    DATA.presupuestos = presPaged.list;

    [DATA.tc, DATA.zonas, DATA.formas_pago] = await Promise.all([
        apiGet(TBL.tc, '&where=(Vigente,eq,true)').then(r => r[0] || { Dolar_oficial: 1150 }),
        apiGet(TBL.zonas),
        apiGet(TBL.formas_pago)
    ]);
    // Invalidar lazy flags
    DATA._loaded.precios = false;
    DATA._loaded.presupuestos = false;
    DATA._loaded.clientes = false;
    DATA._loaded.propiedades = false;
    
    await _resolvePresupuestoLinks();
    if(document.getElementById('page-dashboard').classList.contains('active')) loadDashboard();
}

// Mantener compatibilidad: loadAll llama a reloadAllData
async function loadAll() { await reloadAllData(); }
function renderClientDatalist() {
    let dl = document.getElementById('client-datalist');
    if (!dl) return;
    let html = '';
    DATA.clientes.forEach(c => {
        html += `<option value="${cleanLabel(c.Nombre)}">`;
    });
    dl.innerHTML = html;
}
function syncClientSelect(input, selectId) {
    let name = input.value;
    let client = DATA.clientes.find(c => cleanLabel(c.Nombre) === name);
    if (client) {
        document.getElementById(selectId).value = client.Id;
        if (selectId === 'np-cliente') updatePropiedadesSelect();
    }
}
function loadDashboard() {
    document.getElementById('dash-total-pres').textContent = PAGING.presupuestos.total;
    // Cálculos parciales con los cargados (Dashboard summary)
    let ps = DATA.presupuestos;
    let totalMonto = ps.reduce((s, p) => s + (p.Total_con_IVA || p.Total || 0), 0);
    document.getElementById('dash-facturado').textContent = fmt(totalMonto); // Será el de los últimos 5
    let pend = ps.filter(p => p.Estado === 'Borrador' || p.Estado === 'Enviado').length;
    document.getElementById('dash-pendientes').textContent = pend;
    document.getElementById('dash-tc').textContent = '$' + Number(DATA.tc.Dolar_oficial || 0).toLocaleString('es-AR');
    let tb = document.getElementById('dash-table');
    tb.innerHTML = '';
    ps.slice(0, 5).forEach(p => {
        let cliName = cleanLabel(p._clienteNombre) || '-';
        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + fmt(p.Total_con_IVA || p.Total) + '</td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td></tr>';
    });
}
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
function loadPrecios() {
    let tc = DATA.tc.Dolar_oficial || 1150;
    document.getElementById('precios-tc').textContent = 'TC: 1 USD = $' + Number(tc).toLocaleString('es-AR') + ' ARS';
    let inputTc = document.getElementById('precios-tc-input');
    if(inputTc) inputTc.value = tc;
    
    toggleAumentoModo();
    loadHistorialPrecios();

    let tb = document.getElementById('precios-table');
    tb.innerHTML = '';
    
    // Convert current component data into array
    let currentData = Array.from(DATA.componentes);
    
    currentData.forEach(c => {
        let costo = c.Costo_unitario || 0;
        let margen = c.Margen_default || 0;
        let precioArs = c.Moneda_costo === 'USD' ? costo * tc * (1 + margen / 100) : costo * (1 + margen / 100);
        
        let isOld = false;
        let pDateStr = '-';
        if (c.Fecha_ult_actualizacion) {
            let pDate = new Date(c.Fecha_ult_actualizacion);
            // fix timezone offset trick for correct date formatting (skip if it looks weird)
            let pDateLocal = new Date(pDate.getTime() + pDate.getTimezoneOffset() * 60000);
            pDateStr = pDateLocal.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            let diffDays = (new Date() - pDateLocal) / (1000 * 60 * 60 * 24);
            if (diffDays > 30) isOld = true;
        }
        let dateColor = isOld ? 'color:var(--danger);font-weight:bold;' : '';
        let activoIcon = (c.Activo === false || c.Activo === 'false' || c.Activo === 0) ? '❌' : '✅';
        
        let cData = JSON.stringify(c).replace(/"/g, '&quot;');
        let actionBtn = `<div style="display:flex;gap:4px">
            <button class="btn-remove" onclick="openModalEditComp(${cData})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
            <button class="btn-remove" onclick="deleteComponent(${c.Id || c.id}, '${cleanLabel(c.Nombre).replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
        </div>`;

        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(c.Nombre)}</strong></td>
            <td>${cleanLabel(c.Codigo_interno || '-')}</td>
            <td>${cleanLabel(c.Tipo_componente || '-')}</td>
            <td class="hide-margin">${Number(costo).toFixed(2)}</td>
            <td class="hide-margin">${c.Moneda_costo || '-'}</td>
            <td>${c.Unidad || '-'}</td>
            <td class="hide-margin">${margen}%</td>
            <td><strong>${fmt(precioArs)}</strong></td>
            <td>${cleanLabel(c.Proveedor || '-')}</td>
            <td>${activoIcon}</td>
            <td style="${dateColor}">${pDateStr}</td>
            <td>${actionBtn}</td>
        </tr>`;
    });
    
    // Sort table initially logic is not applied here, wait for click 
    filterComp();
}
async function updateTcFromPrecios() {
    let val = document.getElementById('precios-tc-input').value;
    if (!val) { alert('Ingresá el valor del dólar'); return; }
    let fecha = new Date().toISOString().split('T')[0];
    try {
        await apiPatch(TBL.tc, { Id: DATA.tc.Id, Dolar_oficial: parseFloat(val), Fecha: fecha });
        DATA.tc.Dolar_oficial = parseFloat(val);
        alert('Tipo de cambio actualizado');
        loadPrecios();
        loadDashboard();
    } catch (e) {
        console.error(e);
        alert('Error al actualizar TC');
    }
}

function nuevoComponente() {
    document.getElementById('ec-id').value = '';
    document.getElementById('ec-nombre').value = '';
    document.getElementById('ec-codigo').value = '';
    document.getElementById('ec-tipo').value = 'Material';
    document.getElementById('ec-unidad').value = 'unidad';
    document.getElementById('ec-costo').value = 0;
    document.getElementById('ec-moneda').value = 'ARS';
    document.getElementById('ec-margen').value = 0;
    document.getElementById('ec-proveedor').value = '';
    document.getElementById('ec-iva-compra').value = '21';
    document.getElementById('ec-iva-venta').value = '21';
    document.getElementById('ec-notas').value = '';
    document.getElementById('ec-activo').checked = true;
    
    document.getElementById('ec-title').textContent = 'Nuevo Componente';
    document.getElementById('modal-edit-comp').classList.add('show');
}

function openModalEditComp(compData) {
    document.getElementById('ec-id').value = compData.Id || compData.id;
    document.getElementById('ec-nombre').value = compData.Nombre || '';
    document.getElementById('ec-codigo').value = compData.Codigo_interno || '';
    document.getElementById('ec-tipo').value = compData.Tipo_componente || 'Material';
    document.getElementById('ec-unidad').value = compData.Unidad || 'unidad';
    document.getElementById('ec-costo').value = compData.Costo_unitario || 0;
    document.getElementById('ec-moneda').value = compData.Moneda_costo || 'ARS';
    document.getElementById('ec-margen').value = compData.Margen_default || 0;
    document.getElementById('ec-proveedor').value = compData.Proveedor || '';
    document.getElementById('ec-iva-compra').value = compData.Alicuota_IVA_compra || '21';
    document.getElementById('ec-iva-venta').value = compData.Alicuota_IVA_venta || '21';
    document.getElementById('ec-notas').value = compData.Notas || '';
    document.getElementById('ec-activo').checked = (compData.Activo !== false && compData.Activo !== 'false' && compData.Activo !== 0);
    
    document.getElementById('ec-title').textContent = 'Editar Componente';
    document.getElementById('modal-edit-comp').classList.add('show');
}

async function saveComponent() {
    let id = document.getElementById('ec-id').value;
    let oldCosto = 0;
    if (id) {
        let oldComp = DATA.componentes.find(c => String(c.Id) === String(id) || String(c.id) === String(id));
        if (oldComp) oldCosto = parseFloat(oldComp.Costo_unitario || 0);
    }
    
    let newCosto = parseFloat(document.getElementById('ec-costo').value);
    
    let data = {
        Nombre: document.getElementById('ec-nombre').value,
        Codigo_interno: document.getElementById('ec-codigo').value,
        Tipo_componente: document.getElementById('ec-tipo').value,
        Unidad: document.getElementById('ec-unidad').value,
        Costo_unitario: newCosto,
        Moneda_costo: document.getElementById('ec-moneda').value,
        Margen_default: parseFloat(document.getElementById('ec-margen').value),
        Proveedor: document.getElementById('ec-proveedor').value,
        Alicuota_IVA_compra: document.getElementById('ec-iva-compra').value,
        Alicuota_IVA_venta: document.getElementById('ec-iva-venta').value,
        Notas: document.getElementById('ec-notas').value,
        Activo: document.getElementById('ec-activo').checked,
        Fecha_ult_actualizacion: new Date().toISOString().split('T')[0]
    };

    try {
        if (id) {
            data.Id = parseInt(id);
            await apiPatch(TBL.componentes, data);
            
            if (oldCosto > 0 && newCosto !== oldCosto) {
                let pct = ((newCosto - oldCosto) / oldCosto) * 100;
                await apiPost(TBL.historial_aumentos, [{
                    Fecha: data.Fecha_ult_actualizacion,
                    Tipo: 'individual',
                    Detalle: data.Nombre,
                    Porcentaje: parseFloat(pct.toFixed(2)),
                    Componentes_afectados: 1
                }]);
            }
        } else {
            await apiPost(TBL.componentes, [data]);
        }
        DATA.componentes = await apiGet(TBL.componentes);
        loadPrecios();
        closeModalEditComp();
    } catch (e) {
        console.error(e);
        alert('Error al guardar componente');
    }
}

async function deleteComponent(id, nombre) {
    if (confirm(`¿Eliminar componente ${nombre}?`)) {
        try {
            await apiDelete(TBL.componentes, id);
            DATA.componentes = await apiGet(TBL.componentes);
            loadPrecios();
            alert('Componente eliminado exitosamente.');
        } catch(e) {
            console.error(e);
            alert('Error al eliminar componente. Verificá consola.');
        }
    }
}

function filterComp() {
    let search = document.getElementById('comp-search').value.toLowerCase();
    let tipo = document.getElementById('comp-filter-tipo').value;
    let activoFilter = document.getElementById('comp-filter-activo');
    let activoVal = activoFilter ? activoFilter.value : 'all';

    let rows = document.querySelectorAll('#precios-table tr');
    rows.forEach(r => {
        let name = r.cells[0]?.textContent.toLowerCase() || '';
        let t = r.cells[2]?.textContent || '';
        let isActivo = r.cells[9]?.textContent.includes('✅');
        
        let matchActivo = true;
        if (activoVal === 'true') matchActivo = isActivo;
        else if (activoVal === 'false') matchActivo = !isActivo;

        let show = name.includes(search) && (!tipo || t === tipo) && matchActivo;
        r.style.display = show ? '' : 'none';
    });
}

// Table sort logic
let currentSortCol = -1;
let currentSortDir = 'asc';
function sortCompTable(colIdx) {
    let table = document.querySelector('#precios-table');
    let rows = Array.from(table.querySelectorAll('tr'));
    
    if (currentSortCol === colIdx) {
        currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortCol = colIdx;
        currentSortDir = 'asc';
    }

    rows.sort((a, b) => {
        let textA = a.cells[colIdx]?.textContent.trim().toLowerCase() || '';
        let textB = b.cells[colIdx]?.textContent.trim().toLowerCase() || '';

        // If numerical or currency column, parse floats
        if ([3, 6, 7].includes(colIdx)) {
            let numA = parseFloat(textA.replace(/[^0-9.-]+/g, '')) || 0;
            let numB = parseFloat(textB.replace(/[^0-9.-]+/g, '')) || 0;
            return currentSortDir === 'asc' ? numA - numB : numB - numA;
        }

        if (textA < textB) return currentSortDir === 'asc' ? -1 : 1;
        if (textA > textB) return currentSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    table.innerHTML = '';
    rows.forEach(r => table.appendChild(r));
}

function exportCsv() {
    let rows = document.querySelectorAll('#precios-table tr');
    let csvContent = '\uFEFFNombre,Código,Tipo,Costo,Moneda,Unidad,Margen,Precio final ARS,Proveedor,Activo,Última actualización\n';
    
    rows.forEach(r => {
        if (r.style.display !== 'none') {
            let c0 = `"${r.cells[0]?.textContent.replace(/"/g, '""') || ''}"`;
            let c1 = `"${r.cells[1]?.textContent.replace(/"/g, '""') || ''}"`;
            let c2 = `"${r.cells[2]?.textContent.replace(/"/g, '""') || ''}"`;
            let c3 = `"${r.cells[3]?.textContent.replace(/"/g, '""') || ''}"`;
            let c4 = `"${r.cells[4]?.textContent.replace(/"/g, '""') || ''}"`;
            let c5 = `"${r.cells[5]?.textContent.replace(/"/g, '""') || ''}"`;
            let c6 = `"${r.cells[6]?.textContent.replace(/"/g, '""') || ''}"`;
            let c7 = `"${r.cells[7]?.textContent.replace(/"/g, '""') || ''}"`;
            let c8 = `"${r.cells[8]?.textContent.replace(/"/g, '""') || ''}"`;
            let c9 = `"${r.cells[9]?.textContent.replace(/"/g, '""') || ''}"`;
            let c10 = `"${r.cells[10]?.textContent.replace(/"/g, '""') || ''}"`;
            
            csvContent += `${c0},${c1},${c2},${c3},${c4},${c5},${c6},${c7},${c8},${c9},${c10}\n`;
        }
    });

    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `Lista_precios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
async function renderClientes() {
    _showPageSpinner('clientes', true);
    let search = document.getElementById('cli-search')?.value || '';
    let tipo = document.getElementById('cli-filter-tipo')?.value || '';
    
    let parts = [];
    if(search) parts.push(`(Nombre,like,%${search}%)`);
    if(tipo) parts.push(`(Tipo,eq,${tipo})`);
    let extra = '&sort=-CreatedAt';
    if(parts.length > 0) extra += `&where=(${parts.join('~and')})`;

    let res = await apiGetPaged(TBL.clientes, PAGING.clientes.page, extra);
    DATA.clientes = res.list;
    PAGING.clientes.total = res.total;

    let tb = document.getElementById('cli-table');
    if(!tb) return;
    tb.innerHTML = '';
    
    for (let c of DATA.clientes) {
        // Obtenemos pres count asincronamente pero rápido usando limit=1
        let r = await fetch(API + '/api/v2/tables/' + TBL.presupuestos + '/links/canpten8owymbde/records/' + (c.Id || c.id) + '?limit=1', { headers: H }).catch(()=>null);
        let presCount = 0;
        if (r && r.ok) { let d = await r.json(); presCount = d.pageInfo?.totalRows || 0; }

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
                    <button class="btn-remove" onclick="viewCliente(${c.id || c.Id})" title="Ver" style="background:#f3f4f6;color:var(--text)">👁</button>
                    <button class="btn-remove" onclick="openNewCliente(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deleteCliente(${c.id || c.Id}, '${c.Nombre.replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    }
    renderPagination('pag-clientes', PAGING.clientes, 'clientes');
    // Para el Modal "Nuevo Presupuesto" cargamos un datalist
    renderClientDatalist();
    _showPageSpinner('clientes', false);
}
async function renderPropiedades() {
    _showPageSpinner('propiedades', true);
    let search = document.getElementById('prop-search')?.value || '';
    let extra = '&sort=-CreatedAt';
    if(search) extra += `&where=(Nombre,like,%${search}%)`;
    
    let res = await apiGetPaged(TBL.propiedades, PAGING.propiedades.page, extra);
    DATA.propiedades = res.list;
    PAGING.propiedades.total = res.total;

    let tb = document.getElementById('prop-table');
    if (!tb) return;
    tb.innerHTML = '';
    DATA.propiedades.forEach(p => {
        let cliName = resolveName(p, 'Clientes', DATA.clientes);
        let principal = p.Principal ? '✅ Sí' : 'No';
        let zonaName = '-';
        if (p.Zona_id) { let z = DATA.zonas.find(z => z.Id == p.Zona_id); if (z) zonaName = cleanLabel(z.Nombre); }
        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(p.Nombre)}</strong></td>
            <td>${p.Direccion || '-'}</td>
            <td>${p.Localidad || '-'}</td>
            <td>${zonaName}</td>
            <td><a href="#" onclick="viewCliente(${resolveLink(p, 'Clientes')?.Id || 0}); return false;" style="color:var(--grad1);text-decoration:none;font-weight:600">${cliName}</a></td>
            <td>${p.Telefono || '-'}</td>
            <td>${cleanLabel(p.Tipo_Propiedad || p.Tipo_Propiedad_ || p.Tipo || '-')}</td>
            <td>${principal}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-remove" onclick="openNewPropiedad(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deletePropiedad(${p.id || p.Id}, '${p.Nombre.replace(/'/g, "\\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    });
    renderPagination('pag-propiedades', PAGING.propiedades, 'propiedades');
    _showPageSpinner('propiedades', false);
}
function filterSelectOptions(inputId, selectId) {
    let search = document.getElementById(inputId).value.toLowerCase();
    let select = document.getElementById(selectId);
    let options = select.options;
    for (let i = 0; i < options.length; i++) {
        let txt = options[i].text.toLowerCase();
        let show = txt.includes(search) || (i === 0 && options[i].value === "");
        options[i].style.display = show ? '' : 'none';
    }
}
function filterPropiedades() {
    PAGING.propiedades.page = 1;
    renderPropiedades();
}
function filterCli() {
    PAGING.clientes.page = 1;
    renderClientes();
}
function filterPresupuestos() {
    PAGING.presupuestos.page = 1;
    loadPresupuestos();
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

function viewCliente(clientId) {
    let c = DATA.clientes.find(x => x.Id == clientId);
    if (!c) return;

    document.getElementById('vc-nombre').textContent = cleanLabel(c.Nombre);
    document.getElementById('vc-telefono').textContent = c.Telefono || '-';
    document.getElementById('vc-mail').textContent = c.Mail || '-';
    document.getElementById('vc-tipo').textContent = cleanLabel(c.Tipo || '-');
    document.getElementById('vc-fiscal').textContent = cleanLabel(c.Condicion_fiscal || '-');
    document.getElementById('vc-documento').textContent = c.CUIT_CUIL_DNI || '-';

    let props = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return link && (link.Id == clientId || link.id == clientId);
    });

    let tb = document.getElementById('vc-prop-table');
    tb.innerHTML = '';
    if (props.length > 0) {
        document.getElementById('vc-no-prop').style.display = 'none';
        props.forEach(p => {
            let principal = p.Principal ? '✅ Sí' : 'No';
            let zonaName = '-';
            if (p.Zona_id) { let z = DATA.zonas.find(z => z.Id == p.Zona_id); if (z) zonaName = cleanLabel(z.Nombre); }
            tb.innerHTML += `<tr>
                <td><strong>${cleanLabel(p.Nombre)}</strong></td>
                <td>${p.Direccion || '-'}</td>
                <td>${p.Localidad || '-'}</td>
                <td>${zonaName}</td>
                <td>${cleanLabel(p.Tipo_Propiedad || p.Tipo_Propiedad_ || p.Tipo || '-')}</td>
                <td>${principal}</td>
                <td>${p.Telefono || '-'}</td>
            </tr>`;
        });
    } else {
        document.getElementById('vc-no-prop').style.display = 'block';
    }

    document.getElementById('vc-btn-nueva-prop').onclick = () => {
        let modalProp = document.getElementById('modal-propiedad');
        modalProp.setAttribute('data-reopen-client-id', clientId);
        closeVerCliente();
        openNewPropiedad(null, clientId, true);
    };

    // Historial de Presupuestos
    let clientPres = DATA.presupuestos.filter(p => p._clienteId == clientId);


    // Ordenar por fecha descendente
    clientPres.sort((a, b) => {
        let dateA = new Date(a.Fecha || 0);
        let dateB = new Date(b.Fecha || 0);
        return dateB - dateA;
    });

    let tp = document.getElementById('vc-pres-table');
    tp.innerHTML = '';
    if (clientPres.length > 0) {
        document.getElementById('vc-no-pres').style.display = 'none';
        clientPres.forEach(p => {
            let id = p.Id || p.id;
            let addr = p._propiedadDir;
            if (!addr || addr === '-') {
                let pr = resolveLink(p, 'Propiedades');
                if (pr) {
                    let pfull = DATA.propiedades.find(x => x.Id == (pr.Id || pr.id));
                    if (pfull) addr = (pfull.Direccion || '-') + ' - ' + (pfull.Localidad || '-');
                }
            }
            if (!addr) addr = '-';
            tp.innerHTML += `<tr>
                <td><strong>${p.Numero || '-'}</strong></td>
                <td>${p.Fecha || '-'}</td>
                <td>${addr}</td>
                <td><strong>${fmt(p.Total_con_IVA || p.Total)}</strong></td>
                <td>${badgeHtml(p.Estado || 'Borrador')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="closeVerCliente(); viewPresupuesto(${id})">Ver</button>
                </td>
            </tr>`;
        });
    } else {
        document.getElementById('vc-no-pres').style.display = 'block';
    }

    document.getElementById('modal-ver-cliente').classList.add('show');
}
function loadConfig() {
    loadConfigEmpresa();
    let zt = document.getElementById('cfg-zonas-table');
    zt.innerHTML = '';
    DATA.zonas.forEach(z => {
        let zData = JSON.stringify(z).replace(/"/g, '&quot;');
        let actionBtn = `<div style="display:flex;gap:4px">
            <button class="btn-remove" onclick="openModalZona(${zData})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
            <button class="btn-remove" onclick="deleteZona(${z.Id || z.id}, '${cleanLabel(z.Nombre).replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
        </div>`;
        let activoIcon = (z.Activo === false || z.Activo === 'false' || z.Activo === 0) ? '❌' : '✅';
        zt.innerHTML += '<tr><td><strong>' + cleanLabel(z.Nombre) + '</strong></td><td>' + fmt(z.Costo_viatico) + '</td><td>' + fmt(z.Costo_transporte) + '</td><td>' + activoIcon + '</td><td>' + actionBtn + '</td></tr>';
    });
    let pt = document.getElementById('cfg-pagos-table');
    pt.innerHTML = '';
    DATA.formas_pago.forEach(f => {
        let fData = JSON.stringify(f).replace(/"/g, '&quot;');
        let actionBtn = `<div style="display:flex;gap:4px">
            <button class="btn-remove" onclick="openModalPago(${fData})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
            <button class="btn-remove" onclick="deletePago(${f.Id || f.id}, '${cleanLabel(f.Nombre).replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
        </div>`;
        let activoIcon = (f.Activo === false || f.Activo === 'false' || f.Activo === 0) ? '❌' : '✅';
        pt.innerHTML += '<tr><td><strong>' + cleanLabel(f.Nombre) + '</strong></td><td>' + (f.Recargo_pct || 0) + '%</td><td>' + (f.Descuento_pct || 0) + '%</td><td>' + (f.Plazo_dias || 0) + '</td><td>' + activoIcon + '</td><td>' + actionBtn + '</td></tr>';
    });
    let at = document.getElementById('cfg-anchos-table');
    at.innerHTML = '';
    DATA.anchos.forEach(a => {
        let aData = JSON.stringify(a).replace(/"/g, '&quot;');
        let actionBtn = `<div style="display:flex;gap:4px">
            <button class="btn-remove" onclick="openModalAncho(${aData})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
            <button class="btn-remove" onclick="deleteAncho(${a.Id || a.id}, '${(a.Ancho_solicitado_hasta || '')}')" title="Eliminar" style="color:var(--danger)">🗑</button>
        </div>`;
        at.innerHTML += '<tr><td>' + a.Ancho_solicitado_hasta + '</td><td>' + a.Ancho_real_pano + '</td><td>' + (a.Notas || '-') + '</td><td>' + actionBtn + '</td></tr>';
    });
}
function loadConfigEmpresa() {
    document.getElementById('cfg-emp-nombre').value = DATA.tc.Empresa_nombre || '';
    document.getElementById('cfg-emp-cuit').value = DATA.tc.Empresa_cuit || '';
    document.getElementById('cfg-emp-telefono').value = DATA.tc.Empresa_telefono || '';
    document.getElementById('cfg-emp-whatsapp').value = DATA.tc.Empresa_whatsapp || '';
    document.getElementById('cfg-emp-email').value = DATA.tc.Empresa_email || '';
    document.getElementById('cfg-emp-web').value = DATA.tc.Empresa_web || '';
    document.getElementById('cfg-emp-validez').value = DATA.tc.Validez_dias || 15;
    document.getElementById('cfg-emp-condiciones').value = DATA.tc.PDF_condiciones || '';
    document.getElementById('cfg-emp-garantia').value = DATA.tc.PDF_garantia || '';
    document.getElementById('cfg-emp-nota').value = DATA.tc.PDF_nota_pie || '';
}

async function saveConfigEmpresa() {
    let empData = {
        Id: 3,
        Empresa_nombre: document.getElementById('cfg-emp-nombre').value,
        Empresa_cuit: document.getElementById('cfg-emp-cuit').value,
        Empresa_telefono: document.getElementById('cfg-emp-telefono').value,
        Empresa_whatsapp: document.getElementById('cfg-emp-whatsapp').value,
        Empresa_email: document.getElementById('cfg-emp-email').value,
        Empresa_web: document.getElementById('cfg-emp-web').value,
        Validez_dias: parseInt(document.getElementById('cfg-emp-validez').value) || 15,
        PDF_condiciones: document.getElementById('cfg-emp-condiciones').value,
        PDF_garantia: document.getElementById('cfg-emp-garantia').value,
        PDF_nota_pie: document.getElementById('cfg-emp-nota').value
    };
    try {
        await apiPatch('mhj9fovlmv9036x', empData);
        Object.assign(DATA.tc, empData);
        alert('Configuración guardada correctamente.');
    } catch (e) {
        console.error(e);
        alert('Error guardando configuración: ' + e.message);
    }
}

// ================= ZONAS CRUD =================
function openModalZona(zona = null) {
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
function closeModalZona() { document.getElementById('modal-zona').classList.remove('show'); }
async function saveZona() {
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
        loadConfig();
        if (typeof renderPresupuestosOptions === 'function') renderPresupuestosOptions();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}
async function deleteZona(id, nombre) {
    if (!confirm('¿Seguro que querés eliminar la zona: ' + nombre + '?')) return;
    try {
        await apiDelete(TBL.zonas, id);
        DATA.zonas = DATA.zonas.filter(z => (z.Id || z.id) != id);
        loadConfig();
        if (typeof renderPresupuestosOptions === 'function') renderPresupuestosOptions();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
}

// ================= GEOCODIFICACIÓN =================
let _lastGeoTime = 0;
async function geocodificarDireccion(direccion, localidad) {
    try {
        let now = Date.now();
        let wait = 1000 - (now - _lastGeoTime);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        _lastGeoTime = Date.now();
        let q = encodeURIComponent(`${direccion}, ${localidad}, Santa Fe, Argentina`);
        let resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&viewbox=-61.05,-31.35,-60.45,-32.05&bounded=1`, {
            headers: { 'User-Agent': 'PersianaTotal-ERP/1.0' }
        });
        let data = await resp.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        return null;
    } catch (e) { console.error('Geocodificación error:', e); return null; }
}

function _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function asignarZonaAutomatica(lat, lon) {
    // Calcular distancia a TODAS las zonas activas con coordenadas
    let zonasConDist = [];
    for (let z of DATA.zonas) {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) continue;
        if (!z.Lat_centro || !z.Lon_centro) continue;
        let dist = _haversineKm(lat, lon, z.Lat_centro, z.Lon_centro);
        zonasConDist.push({ zona: z, dist: dist });
    }
    // Filtrar zonas internas: tienen Radio_km y la distancia cae dentro
    let internas = zonasConDist.filter(zd => zd.zona.Radio_km && zd.zona.Radio_km > 0 && zd.dist <= zd.zona.Radio_km);
    if (internas.length > 0) {
        // De las que matchean, elegir la MÁS CERCANA
        internas.sort((a, b) => a.dist - b.dist);
        return internas[0].zona;
    }
    // Fallback: zona más cercana sin importar radio
    if (zonasConDist.length > 0) {
        zonasConDist.sort((a, b) => a.dist - b.dist);
        return zonasConDist[0].zona;
    }
    return null;
}

// ================= FORMAS DE PAGO CRUD =================
function openModalPago(pago = null) {
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
function closeModalPago() { document.getElementById('modal-pago').classList.remove('show'); }
async function savePago() {
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
        loadConfig();
        if (typeof renderPresupuestosOptions === 'function') renderPresupuestosOptions();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}
async function deletePago(id, nombre) {
    if (!confirm('¿Seguro que querés eliminar la forma de pago: ' + nombre + '?')) return;
    try {
        await apiDelete(TBL.formas_pago, id);
        DATA.formas_pago = DATA.formas_pago.filter(p => (p.Id || p.id) != id);
        loadConfig();
        if (typeof renderPresupuestosOptions === 'function') renderPresupuestosOptions();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
}

// ================= ANCHOS PVC CRUD =================
function openModalAncho(ancho = null) {
    document.getElementById('ma-id').value = ancho ? ancho.Id || ancho.id : '';
    document.getElementById('ma-solicitado').value = ancho ? ancho.Ancho_solicitado_hasta || '' : '';
    document.getElementById('ma-real').value = ancho ? ancho.Ancho_real_pano || '' : '';
    document.getElementById('ma-notas').value = ancho ? ancho.Notas || '' : '';
    document.getElementById('ma-title').textContent = ancho ? 'Editar Ancho PVC' : 'Nuevo Ancho PVC';
    document.getElementById('modal-ancho').classList.add('show');
}
function closeModalAncho() { document.getElementById('modal-ancho').classList.remove('show'); }
async function saveAncho() {
    let id = document.getElementById('ma-id').value;
    let data = {
        Ancho_solicitado_hasta: parseFloat(document.getElementById('ma-solicitado').value) || 0,
        Ancho_real_pano: parseFloat(document.getElementById('ma-real').value) || 0,
        Notas: document.getElementById('ma-notas').value
    };
    try {
        if (id) {
            data.Id = parseInt(id);
            await apiPatch(TBL.anchos, data);
            let idx = DATA.anchos.findIndex(a => (a.Id || a.id) == id);
            if (idx >= 0) Object.assign(DATA.anchos[idx], data);
        } else {
            let res = await apiPost(TBL.anchos, [data]);
            data.Id = res[0].Id;
            DATA.anchos.push(data);
        }
        closeModalAncho();
        loadConfig();
    } catch (e) { console.error(e); alert('Error al guardar: ' + e.message); }
}
async function deleteAncho(id, anchoSol) {
    if (!confirm('¿Seguro que querés eliminar el ancho hasta: ' + anchoSol + ' ?')) return;
    try {
        await apiDelete(TBL.anchos, id);
        DATA.anchos = DATA.anchos.filter(a => (a.Id || a.id) != id);
        loadConfig();
    } catch (e) { console.error(e); alert('Error al eliminar: ' + e.message); }
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
    if (props.length === 1 || selectedPropId) {
        let pId = selectedPropId || props[0].Id;
        updateZonaFromProp(pId);
    }
}

function updateZonaFromProp(propId) {
    let zonaSelect = document.getElementById('np-zona');
    if (!propId) {
        if (zonaSelect) zonaSelect.disabled = false;
        return;
    }
    let prop = DATA.propiedades.find(p => p.Id == propId);
    if (!prop) {
        if (zonaSelect) zonaSelect.disabled = false;
        return;
    }
    // Read Zona_id from property
    if (prop.Zona_id && zonaSelect) {
        zonaSelect.value = prop.Zona_id;
        zonaSelect.disabled = false;
        recalcTraslado();
        return;
    }
    // Fallback: try exact name match on Localidad
    let zone = DATA.zonas.find(z => z.Nombre === prop.Localidad);
    if (zone && zonaSelect) {
        zonaSelect.value = zone.Id;
        zonaSelect.disabled = false;
        recalcTraslado();
    } else if (zonaSelect) {
        zonaSelect.disabled = false;
    }
}

async function autoDetectarZonaProp() {
    let direccion = document.getElementById('np-prop-direccion')?.value;
    let locSelect = document.getElementById('np-prop-localidad');
    let localidad = locSelect?.value;
    let autoBtn = document.getElementById('btn-autozona-prop');
    console.log('autoDetectarZonaProp → DIR:', direccion, 'LOC:', localidad, 'LOC_IDX:', locSelect?.selectedIndex, 'LOC_OPTS:', locSelect?.options?.length);
    if (!direccion || !localidad) {
        alert(!direccion ? 'Completá la dirección primero.' : 'Seleccioná la localidad primero.');
        return;
    }
    let zonaSelect = document.getElementById('prop-zona');
    if (localidad !== 'Santa Fe') {
        let zone = DATA.zonas.find(z => z.Nombre === localidad);
        if (zone && zonaSelect) {
            zonaSelect.value = zone.Id || zone.id;
            alert(`Zona detectada: ${zone.Nombre}`);
        } else {
            alert('No se encontró una zona exacta automáticamente para esta localidad.');
        }
        return;
    }

    if (autoBtn) { autoBtn.textContent = '⏳ Detectando...'; autoBtn.disabled = true; }
    let coords = await geocodificarDireccion(direccion, "Santa Fe");
    if (!coords) {
        // Fallback para Santa Fe: asignar SF - Centro/Sur por defecto
        let fallbackZone = DATA.zonas.find(z => z.Nombre === 'Zona Centro');
        if (fallbackZone && zonaSelect) {
            zonaSelect.value = fallbackZone.Id || fallbackZone.id;
            alert('No se encontró la dirección exacta. Se asignó Zona Centro por defecto. Podés cambiarla manualmente.');
        } else {
            alert('No se pudo geocodificar la dirección. Seleccioná la zona manualmente.');
        }
        if (autoBtn) { autoBtn.textContent = '📍 Auto-detectar zona'; autoBtn.disabled = false; }
        return;
    }
    let autoZona = asignarZonaAutomatica(coords.lat, coords.lon);
    if (autoZona && zonaSelect) {
        zonaSelect.value = autoZona.Id || autoZona.id;
        alert(`Zona detectada: ${autoZona.Nombre}`);
    } else {
        alert('No se encontró una zona cercana.');
    }
    if (autoBtn) { autoBtn.textContent = '📍 Auto-detectar zona'; autoBtn.disabled = false; }
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

async function openNewPropiedad(propData = null, preselectedClientId = null, forceDisableClient = false) {
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

    // Deshabilitar/Habilitar según corresponda
    cs.disabled = forceDisableClient;
    let si = document.getElementById('np-prop-cliente-search');
    if (si) si.disabled = forceDisableClient;

    document.getElementById('np-prop-nombre').value = propData ? propData.Nombre : '';
    document.getElementById('np-prop-direccion').value = propData ? propData.Direccion || '' : '';
    document.getElementById('np-prop-telefono').value = propData ? propData.Telefono || '' : '';
    document.getElementById('np-prop-tipo').value = propData ? (propData.Tipo_Propiedad || propData.Tipo_Propiedad_ || 'Casa') : 'Casa';
    document.getElementById('np-prop-inquilino').value = propData ? propData.Contacto_Inquilino || '' : '';
    document.getElementById('np-prop-maps').value = propData ? propData.Ubicacion_Maps || propData.Ubicacion_Maps_ || '' : '';
    document.getElementById('np-prop-horario').value = propData ? propData.Horario_Disponible || propData.Horario_Disponible_ || '' : '';
    document.getElementById('np-prop-principal').checked = propData ? !!propData.Principal : false;

    // Poblar select de Localidad
    let sloc = document.getElementById('np-prop-localidad');
    sloc.innerHTML = '<option value="">Seleccionar localidad...</option>';
    let localies = new Set();
    DATA.zonas.forEach(z => {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) return;
        if (z.Radio_km > 0) localies.add('Santa Fe');
        else localies.add(z.Nombre);
    });
    [...localies].sort().forEach(loc => {
        let sel = (propData && propData.Localidad === loc) ? 'selected' : '';
        sloc.innerHTML += `<option value="${loc}" ${sel}>${cleanLabel(loc)}</option>`;
    });
    sloc.innerHTML += `<option value="Otra" ${(propData && propData.Localidad === 'Otra') ? 'selected' : ''}>Otra</option>`;

    // Poblar select de Zona asignada
    let pz = document.getElementById('prop-zona');
    pz.innerHTML = '<option value="">Seleccionar zona...</option>';
    DATA.zonas.forEach(z => {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) return;
        let sel = (propData && propData.Zona_id == (z.Id || z.id)) ? 'selected' : '';
        pz.innerHTML += `<option value="${z.Id || z.id}" ${sel}>${cleanLabel(z.Nombre)}</option>`;
    });

    // Sincronizar buscador de clientes
    if (si) {
        if (propData) {
            si.value = resolveName(propData, 'Clientes', DATA.clientes);
        } else if (preselectedClientId) {
            let client = DATA.clientes.find(c => c.Id == preselectedClientId);
            si.value = client ? cleanLabel(client.Nombre) : '';
        } else {
            si.value = '';
        }
    }

    modal.classList.add('show');
}

function closeModalPropiedad() {
    let modal = document.getElementById('modal-propiedad');
    let reopenId = modal.getAttribute('data-reopen-client-id');
    modal.classList.remove('show');
    // Restaurar campos habilitados
    document.getElementById('np-prop-cliente').disabled = false;
    let si = document.getElementById('np-prop-cliente-search');
    if (si) si.disabled = false;

    if (reopenId) {
        modal.removeAttribute('data-reopen-client-id');
        viewCliente(reopenId);
    }
}

async function savePropiedad() {
    let id = document.getElementById('modal-propiedad').getAttribute('data-db-id');
    let cliId = document.getElementById('np-prop-cliente').value;

    if (!cliId) { alert('Debe seleccionar un cliente'); return; }

    // Si es la primera propiedad del cliente, marcar como principal automáticamente
    let clientProps = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return link && (link.Id == cliId || link.id == cliId);
    });

    let isPrincipal = document.getElementById('np-prop-principal').checked;
    if (!id && clientProps.length === 0) isPrincipal = true;

    let data = {
        Nombre: document.getElementById('np-prop-nombre').value,
        Direccion: document.getElementById('np-prop-direccion').value,
        Localidad: document.getElementById('np-prop-localidad').value,
        Telefono: document.getElementById('np-prop-telefono').value,
        Tipo_Propiedad: document.getElementById('np-prop-tipo').value,
        Contacto_Inquilino: document.getElementById('np-prop-inquilino').value,
        Ubicacion_Maps: document.getElementById('np-prop-maps').value,
        Horario_Disponible: document.getElementById('np-prop-horario').value,
        Principal: isPrincipal,
        Clientes_id: parseInt(cliId),
        Zona_id: parseInt(document.getElementById('prop-zona').value) || null
    };

    if (!data.Nombre) { alert('El nombre es obligatorio'); return; }

    try {
        let savedRes;
        if (id) {
            savedRes = await apiPatch(TBL.propiedades, { id: id, ...data });
        } else {
            savedRes = await apiPost(TBL.propiedades, data);
        }
        let savedId = id || savedRes.Id || savedRes.id;

        // Si esta es principal, quitar principal a las otras del mismo cliente
        if (data.Principal) {
            let others = DATA.propiedades.filter(p => {
                let link = resolveLink(p, 'Clientes');
                let sameCli = link && (link.Id == cliId || link.id == cliId);
                let pId = p.Id || p.id;
                return sameCli && pId != savedId && p.Principal;
            });
            for (let other of others) {
                await apiPatch(TBL.propiedades, { id: other.Id || other.id, Principal: false });
            }
        }

        DATA.propiedades = await apiGet(TBL.propiedades);
        renderPropiedades();
        closeModalPropiedad();
        // Si el panel de cliente está abierto, actualizarlo
        let panel = document.getElementById('panel-cliente');
        if (panel.classList.contains('open')) {
            showClientDetail(parseInt(cliId));
        }
        // Si el modal de ficha cliente está abierto, actualizarlo
        let modalVer = document.getElementById('modal-ver-cliente');
        if (modalVer.classList.contains('show')) {
            viewCliente(parseInt(cliId));
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
    renderClientDatalist();
    editPresId = presData ? (presData.Id || presData.id) : null;

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

    loadPropiedadesSelect(presData);

    if (presData) {
        document.getElementById('np-pago').value = resolveLink(presData, 'Formas_pago')?.Id || '';
        document.getElementById('np-canal').value = presData.Canal || 'Manual';
        document.getElementById('np-factura').value = presData.Facturacion || 'con_iva';
        document.getElementById('np-cliente').disabled = true;
        let searchInput = document.getElementById('np-pres-cliente-search');
        if (searchInput) searchInput.disabled = true;
        document.getElementById('np-propiedad').disabled = true;
        document.getElementById('np-zona').disabled = true;
    } else {
        document.getElementById('np-pago').value = '';
        document.getElementById('np-canal').value = 'Manual';
        document.getElementById('np-factura').value = 'con_iva';
        document.getElementById('np-cliente').disabled = false;
        let searchInput = document.getElementById('np-pres-cliente-search');
        if (searchInput) searchInput.disabled = false;
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
    unidadCount = 0;

    _loadingEdit = true;

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
    _loadingEdit = false;
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
    html += '<button class="btn-add-comp" onclick="addCompRow(' + n + ')">+ Agregar componente</button></div>';
    document.getElementById('np-unidades').insertAdjacentHTML('beforeend', html);
    autoLoadComponents(n);
}

function removeUnidad(n) { document.getElementById('unidad-' + n)?.remove(); recalcTotal(); }

function duplicateUnidad(origN) {
    let oldProd = document.getElementById('u-' + origN + '-prod')?.value || '';
    let oldNombre = document.getElementById('u-' + origN + '-nombre')?.value || '';
    let oldUbic = document.getElementById('u-' + origN + '-ubic')?.value || '';
    let oldTipo = document.getElementById('u-' + origN + '-tipo')?.value || '';
    let oldTipoRep = document.getElementById('u-' + origN + '-tiporep')?.value || '';
    let oldAccion = document.getElementById('u-' + origN + '-accion')?.value || '';
    let oldAncho = document.getElementById('u-' + origN + '-ancho')?.value || '';
    let oldAlto = document.getElementById('u-' + origN + '-alto')?.value || '';

    _loadingEdit = true;
    
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

    let cat = getCategoria(oldProd);
    let hideAccion = (cat === 'Seguridad') ? 'none' : 'block';
    if(document.getElementById('u-' + newN + '-accion')) document.getElementById('u-' + newN + '-accion').parentElement.style.display = hideAccion;
    
    let showRep = (oldTipo == 'Reparacion' || oldTipo == 'Service') ? 'block' : 'none';
    if(document.getElementById('div-u-' + newN + '-tiporep')) document.getElementById('div-u-' + newN + '-tiporep').style.display = showRep;

    _loadingEdit = true;
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
    _loadingEdit = false;
}

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

function recalcTraslado() {
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
    let viatico = zona.Costo_viatico || 0;
    let transporte = zona.Costo_transporte || 0;
    let visitas = parseInt(tVis.value) || 0;
    let costo = (viatico + transporte) * visitas;
    if (zLabel) zLabel.textContent = cleanLabel(zona.Nombre);
    if (tViatico) tViatico.textContent = fmt(viatico);
    if (tTransporte) tTransporte.textContent = fmt(transporte);
    if (tTotal) tTotal.textContent = fmt(costo);
    tVis.dataset.val = costo;
    recalcTotal();
}

function recalcTotal() {
    let total = 0;
    document.querySelectorAll('.unidad-subtotal').forEach(s => {
        total += parseFloat(s.textContent.replace('$', '').replace(/\./g, '').replace(',', '.')) || 0;
    });
    
    // Auto-calcular visitas basado en Tipo de Trabajo
    if (!_loadingEdit) {
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
    // El subtotal de los modales incluye ya el traslado para mostarse "concreto" en UI.
    // Aunque en backend totalizamos aparte. Para NP modal, el np-total es todo mas IVA, el traslado lo sumaremos aca:
    document.getElementById('np-total').textContent = fmt(total + valTraslado);
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
        let pagoId = document.getElementById('np-pago').value;
        if (pagoId) await apiLink(TBL.presupuestos, 'cr9l2n9wiubrcra', editPresId, [{ Id: parseInt(pagoId) }]);
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
        let deepData = await fetchBudgetDeepData(editPresId);
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
    if (confirm('Presupuesto ' + num + ' guardado. ¿Ver ahora?')) viewPresupuesto(presId);
}

async function aplicarAumento() {
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
        loadPrecios();
        document.getElementById('aumento-pct').value = '';
    } catch (e) {
        console.error(e);
        alert('Error al actualizar precios: ' + e.message);
    }
}

function toggleAumentoModo() {
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

async function loadHistorialPrecios() {
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
        let diasValidez = DATA.tc.Validez_dias || 15;
        let venc = new Date(new Date(pres.Fecha).getTime() + diasValidez * 24 * 60 * 60 * 1000).toLocaleDateString();
        let html = `
            <div id="pdf-content" style="width: 750px; margin: 0 auto; font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif; color: #1f2937;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; margin-bottom: 15px;">
                    <div><img src="logo-pdf.png" alt="Persiana Total" style="max-width: 300px;"></div>
                    <div style="text-align: right; font-size: 0.85em; color: #4b5563;">
                        <h3 style="margin: 0 0 5px 0;">PRESUPUESTO #${pres.Numero || '-'}</h3>
                        <p style="margin: 2px 0;">Tel: ${DATA.tc.Empresa_telefono || ''}</p>
                        <p style="margin: 2px 0;">WhatsApp: ${DATA.tc.Empresa_whatsapp || ''}</p>
                        <p style="margin: 2px 0;">${DATA.tc.Empresa_email || ''}</p>
                        <p style="margin: 2px 0;">${DATA.tc.Empresa_web || ''}</p>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 4px;">
                    <div style="font-size: 0.9em;">
                        <p style="margin: 3px 0;">Fecha: ${fecha}</p>
                        <p style="margin: 3px 0;">Válido hasta: ${venc}</p>
                        <p style="margin: 3px 0;">Estado: ${badgeHtml(pres.Estado)}</p>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="margin: 0 0 5px 0; font-size: 1em; color: #374151;">CLIENTE</h3>
                        <p style="margin: 3px 0;"><strong>${cleanLabel(client.Nombre) || '-'}</strong></p>
                        <p style="margin: 3px 0;">${client.Telefono || ''}</p>
                        <p style="margin: 3px 0;">${res.propDir || ''}</p>
                        <p style="margin: 3px 0;">${zona.Nombre ? 'Zona: ' + cleanLabel(zona.Nombre) : ''}</p>
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
                <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <div style="background: #f3f4f6; padding: 8px; border-radius: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: bold; font-size: 1.1em; color: #1f2937;">${cleanLabel(u.Nombre)} - ${cleanLabel(u.Ubicacion) || ''}${measures}</span>
                        <span style="color: #4b5563; font-weight: normal;">${cleanLabel(u.Tipo_trabajo) || ''}</span>
                    </div>
                    <ul style="margin: 5px 0; padding-left: 25px; font-size: 0.9em; color: #374151; list-style-type: disc;">
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

                html += `<li style="margin-bottom: 4px;">${cleanLabel(l.Descripcion_pdf)}</li>`;
            }

            if (!isRepair && (hasMO || hasMotorMO || hasGuiasMO)) html += `<li style="margin-bottom: 4px;">Incluye instalación completa</li>`;

            html += `
                    </ul>
                    <div style="text-align: right; margin-top: 8px; font-size: 1.1em; font-weight: bold; color: #111;">
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

        html += `<div style="margin-top: 15px; margin-left: auto; width: fit-content; min-width: 280px; background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">`;

        if (billingMode === 'con_iva') {
            html += `
                <div style="display: flex; justify-content: space-between; font-size: 1.4em; font-weight: bold; color: #111; margin-bottom: 5px;"><span>TOTAL:</span> <span>${fmt(total)}</span></div>
                <div style="font-size: 0.8em; color: #6b7280; text-align: right; margin-bottom: 15px;">Precios con IVA incluido</div>
            `;
        } else {
            html += `
                <div style="display: flex; justify-content: space-between; font-size: 1.4em; font-weight: bold; color: #111;"><span>TOTAL:</span> <span>${fmt(total)}</span></div>
            `;
        }

        html += `
                    <div style="margin-top: 10px; font-size: 0.85em; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                        Condición de pago: ${cleanLabel(pago)}
                    </div>
                </div>
                
            </div>`;
        let container = document.getElementById('pdf-content');
        if (!container) { alert('Error: Contenedor PDF no encontrado'); return; }
        container.innerHTML = html;
        let opt = { margin: [5, 10, 0, 10], filename: `Presupuesto_${pres.Numero}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
        // Generar PDF con footer imagen fija al pie
        html2pdf().from(container.firstElementChild).set(opt).toPdf().get('pdf').then(function(pdf) {
            let pageCount = pdf.internal.getNumberOfPages();
            let pageWidth = pdf.internal.pageSize.getWidth();
            let pageHeight = pdf.internal.pageSize.getHeight();
            let footerImg = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABz0AAADCCAYAAADTnd+mAAAABHNCSVQICAgIfAhkiAAAIABJREFUeF7t3Qe0FEW6wPFvTCgSVEBFVkURSSoZDICKCQOgoq5ZTKtiwBxIghjXNa6uoqtiFkEFd59iJohKEDPBAKgLqIABMwbe+Wpuz63bt2e6au4M987Mf87Z857cDlW/qq6urq+rOrHNnTevFn4IIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIBAgQoktiXoWaBFR7IRQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQEAFEtvewUxPqgICCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCBSuAEHPwi07Uo4AAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAsz0pA4ggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggEChCyS2/ddNqws9E6QfAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRKV4CgZ+mWPTlHAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoCgECHoWRTGSCQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRKVyDRjOVtS7f0yTkCCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACRSCQaHY73/QsgnIkCwgggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAgiUrECi2e03ri7Z3JNxBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBAoeAGCngVfhGQAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAgdIWSDS7jZmepV0FyD0CCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAAChS1A0LOwy4/UI4AAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIFDyAolmt93ANz1LvhoAgAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggEDhCiS2+ydBz8ItPlKOAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIEPakDCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCBQ0AIEPQu6+Eg8AggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggktruV5W2pBggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAgggULgCie1u/cfqwk0+KUcAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAgVIXIOhZ6jWA/COAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCBQ4AIEPQu8AEk+AggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAqUukGh+C8vblnolIP8IIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIFLIAQc9CLj3SjgACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACkmh+y/WrcUAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQKVSDR/GaCnoVaeKQbAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRECHpSCxBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoKAFCHoWdPGReAQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQSDS/ieVtqQYIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIFC4Aontb/r76sJNPilHAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAIFSFyDoWeo1gPwjgAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAgggUOACie1vZKZngZchyUcAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEECgpAUIepZ08ZN5BBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBApfILH9jdfxTc/CL0dygAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggEDJChD0LNmiJ+MIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIFIdAYvsbmOlZHEVJLhBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBAoTYFEC4KepVny5BoBBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQACBIhEg6FkkBUk2EEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEChVgUSLf1y7ulQzT74RQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQKDwBQh6Fn4ZkgMEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEESlqAoGdJFz+ZRwABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQKDwBRItrmd528IvRnKAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAQOkKEPQs3bIn5wgggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggUhUCi5fXXrC6KnJAJBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBAoSYFEy78T9CzJkifTCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCBSJAEHPIilIsoEAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIBAqQoQ9CzVkiffCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCBSJQKLl36/mm55FUphkAwEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAIFSFEi0vI6gZykWPHlGAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoFgECHoWS0mSDwQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRKVCDRipmeJVr0ZBsBBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQACB4hBItLqW5W2LoyjJBQIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAKlKZBode1Vq0sz6+QaAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQSKQYCgZzGUInlAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoIQFEq2uYaZnCZc/WUcAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEECg4AUIehZ8EZIBBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBEpbINGamZ6lXQPIPQIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIFLpBoffWVqws8DyQfAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRKWICgZwkXPllHAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoBgECHoWQymSBwQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQRKWICgZwkXPllHAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAoBgEEq2v4puexVCQ5AEBBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQACBUhVItL5q5OpSzTz5RgABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQACBwhdItCHoWfilSA4QQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQKGGBRJsrmelZwuVP1hFAAAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBAoeAGCngVfhGQAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEEAAgdIWSLS58gq+6VnadYDcI4AAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIFDQAok2Iwl6FnQJkngEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEESlyAoGeJVwCyjwACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggEChCxD0LPQSJP0IIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIlLhAYocrWN62xOsA2UcAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEEECgoAUSO1wxYnVB54DEI4AAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIBASQsQ9Czp4ifzCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCBS+AEHPwi9DcoAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIIIIBASQskdhjB8rYlXQPIPAIIIIAAAggggAACCCCAAAIIIIAAAggggAACCCCAAAIFLkDQs8ALkOQjgAACCCCAAAIIIIAAAggggAACCCCAAAIIIIAAAgggUOoCiR1GDF9d6gjkHwEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEEClcgseNwgp6FW3ykHAEEEEAAAQQQQAABBBBAAAEEEEAAAQQQQAABBBBAAAEECHpSBxBAAAEEEEAAAQQQQAABBBBAAAEEEECgZAVaN24sf9l4Y9modm1ZZ621RJfF+/ann2Tpd9/J259/XrIuZBwBBBBAAIFCEyDoWWglRnoRQAABBBBAAAEEEEAAAQQQQAABBBBAoEoCfdq2le7Nm8seLVrIqx99JL//+acJdC5asUK2LAuA/vL773JIu3by1uefywtz5siYmTPNdvwQQAABBBBAoGYKJHa8nOVta2bRkCoEEEAAAQQQQAABBBBAAAEEEEAAAQQQyKXAibvtKgP23FMmvv++THjrbXl38f9k1e9/pE6xViIhf67WuZ7lv/ZbbSn7tG4tf+3cWe599VW5/ZVJuUwSx0IAAQQQQACBHAkkdrz88op38RwdmMMggAACCCCAAAIIIIAAAggggAACCCCAAAI1QWC37baTKw85RO545RUZ//bbsur332XdtdeWTk2byuuffGKSWHf99eWeE06QoePHy/wvvzT/1mGrrczsz69//NH89/477CDXHXaYDH7qKfnPO+/UhKyRBgQQQAABBBAoEyDoSVVAAAEEEEAAAQQQQAABBBBAAAEEEEAAgaIVOKV7d2mw4YZy99SpJnjZcvPN5bhddpH92rSRVX/8Ibtec4202GwzOX7XXWXYhAly/j77yOzPPpOX5s6VcaefLpvVry9vffaZPPzGGzJ94ULjdHbPnrJJnToy4umni9aNjCGAAAIIIFBoAokdhzHT06fQdm+xvZyxxx4+u+Rk2zsmTZLJ8z/MybE4CAIIIFBdAk0bNpROTbeW1o23MElovUVj76TMWbLU7DNn6RKZtehTWbR8ufcx2AEBBBAoFIHa660nh3XqKJ2bNpVGdeuukWRrOzvuzVkStLdr5KScBAEEEEAAAQQQyJPA4R07SuON6sutL71sznDuPnvLFhttJFPmfygN69aVH3/9VcbOmiVXHXKICWrOWbpU6tSqJTf89Qg57YEHZbftmkmP7VvIa598Irs221Y2rLW+DHnqKXOsQzt0kB3/0kRGPP2fPKWewyKAAAIIIICAj0BiJ4KePl7y6Gl/89o+lxsfNequXB6OYyGAAAJrTECDnfoWbTZBzrhE6qD8g6+/TvAzDoq/I4BAwQlowHNon97StEGDakn7na9Mkskf8tJdteBzUgQQQAABBBDIicCQ3gfJyp9/kVtffNEcb8LZZ8n42W/JfdOmmf+eeN550v/ee2Wj2rVleJ8+cuSoUanzXtOvn0z58EN59r33ZPqQwdLj2uvk199/l4PatpXL+/SWbtdca/67T9u20rdDezn5vtE5STMHQQABBBBAAIHsBRI7DRvGNz09/B497TSPrXO76VFWxyu3R+ZoCCCAQP4EWm+xhVyw336ig/fh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';
            let imgW = pageWidth;
            let imgH = imgW * (194 / 1853);
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.addImage(footerImg, 'PNG', 0, pageHeight - imgH, imgW, imgH);
            }
            pdf.save('Presupuesto_' + (pres.Numero || 'sin-numero') + '.pdf');
        });
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

initApp();

let modalMouseDownTarget = null;
window.addEventListener('mousedown', function (event) {
    modalMouseDownTarget = event.target;
});

window.addEventListener('mouseup', function (event) {
    if (modalMouseDownTarget === event.target) {
        if (event.target.classList.contains('modal-overlay')) {
            if (event.target.id === 'modal-pres') closeModal();
            else if (event.target.id === 'modal-ver-pres') closeVerPres();
            else if (event.target.id === 'modal-ver-cliente') closeVerCliente();
            else if (event.target.id === 'modal-cliente') closeModalCliente();
            else if (event.target.id === 'modal-propiedad') closeModalPropiedad();
            else if (event.target.id === 'modal-edit-comp') closeModalEditComp();
        }
        if (event.target.classList.contains('detail-panel')) closeDetail();
    }
});
