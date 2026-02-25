const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const BASE = 'pru2fsphj43juyr';
const H = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };
const TBL = { clientes: 'mwby85581fhjy27', propiedades: 'm0dwlr7ccoim1kf', historial: 'mimh9lp8bkew4t0', categorias: 'mulo5ve82d9ex7q', productos: 'mdr6mo695g0qz6d', componentes: 'mgh9e1zivvhpg26', prod_comp: 'mmjzqw7v4que9q3', tc: 'mhj9fovlmv9036x', zonas: 'mottig5nmj5e3kx', presupuestos: 'mn1yyjyovvoyxme', lineas: 'mv1e9trh23j0q3o', servicios: 'mz8qrki3hz4y7iv', formas_pago: 'm2t4fnjie88gfo0', unidades: 'mix059xkpsz15um', anchos: 'mayai71j546g3as', historial_aumentos: 'myumlbp9hemi3cu' };
let DATA = { clientes: [], propiedades: [], zonas: [], componentes: [], productos: [], prod_comp: [], presupuestos: [], lineas: [], unidades: [], formas_pago: [], tc: null, anchos: [] };
let appReady = false;

function showPage(id, btn) { if (!appReady) { alert("Cargando datos, por favor espere..."); return; } document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById('page-' + id).classList.add('active'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); if (btn) btn.classList.add('active'); if (id === 'dashboard') loadDashboard(); if (id === 'presupuestos') loadPresupuestos(); if (id === 'precios') loadPrecios(); if (id === 'clientes') renderClientes(); if (id === 'propiedades') renderPropiedades(); if (id === 'config') loadConfig(); }
function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
function closeVerPres() { document.getElementById('modal-ver-pres').classList.remove('show'); }
function closeVerCliente() { document.getElementById('modal-ver-cliente').classList.remove('show'); }
function closeModalCliente() { document.getElementById('modal-cliente').classList.remove('show'); }
function closeModalEditComp() { document.getElementById('modal-edit-comp').classList.remove('show'); }
function closeModalPropiedad() { 
    let modal = document.getElementById('modal-propiedad');
    let reopenId = modal.getAttribute('data-reopen-client-id');
    modal.classList.remove('show');
    document.getElementById('np-prop-cliente').disabled = false;
    let si = document.getElementById('np-prop-cliente-search');
    if (si) si.disabled = false;
    if (reopenId) {
        modal.removeAttribute('data-reopen-client-id');
        viewCliente(reopenId);
    }
}

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
function resolveName(row, field, list, idField) { let link = resolveLink(row, field); if (!link) return '-'; let id = link.Id || link.id || link; let found = list.find(i => i.Id == id); return found ? found.Nombre || found.Title || '-' : '-'; }
function showConfigTab(id, btn) { document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none'); document.getElementById('config-' + id).style.display = 'block'; document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
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
    const fetchBase = [
        apiGet(TBL.tc, '&where=(Vigente,eq,true)').then(r => r[0] || { Dolar_oficial: 1150 }),
        apiGet(TBL.clientes), apiGet(TBL.zonas), apiGet(TBL.componentes),
        apiGet(TBL.productos), apiGet(TBL.prod_comp), apiGet(TBL.presupuestos),
        apiGet(TBL.lineas), apiGet(TBL.unidades), apiGet(TBL.formas_pago),
        apiGet(TBL.propiedades), apiGet(TBL.anchos)
    ];
    [DATA.tc, DATA.clientes, DATA.zonas, DATA.componentes, DATA.productos, DATA.prod_comp, DATA.presupuestos, DATA.lineas, DATA.unidades, DATA.formas_pago, DATA.propiedades, DATA.anchos] = await Promise.all(fetchBase);

    console.log('Propiedades:', DATA.propiedades.length);

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

    loadDashboard();
    renderPropiedades();
    renderClientDatalist();
    appReady = true;
}
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
function renderClientes() {
    let tb = document.getElementById('cli-table');
    tb.innerHTML = '';
    DATA.clientes.forEach(c => {
        let presCount = DATA.presupuestos.filter(p => p._clienteId == (c.Id || c.id)).length;

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
            <td><a href="#" onclick="viewCliente(${resolveLink(p, 'Clientes')?.Id || 0}); return false;" style="color:var(--grad1);text-decoration:none;font-weight:600">${cliName}</a></td>
            <td>${p.Telefono || '-'}</td>
            <td>${cleanLabel(p.Tipo_Propiedad || p.Tipo_Propiedad_ || p.Tipo || '-')}</td>
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
        let show = txt.includes(search) || (i === 0 && options[i].value === "");
        options[i].style.display = show ? '' : 'none';
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
            tb.innerHTML += `<tr>
                <td><strong>${cleanLabel(p.Nombre)}</strong></td>
                <td>${p.Direccion || '-'}</td>
                <td>${p.Localidad || '-'}</td>
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
        zt.innerHTML += '<tr><td><strong>' + cleanLabel(z.Nombre) + '</strong></td><td>' + fmt(z.Costo_viatico) + '</td><td>' + fmt(z.Costo_transporte) + '</td><td>' + fmt(z.Costo_traslado_service) + '</td><td>' + (z.Tiempo_viaje_hs || 0) + '</td><td>' + activoIcon + '</td><td>' + actionBtn + '</td></tr>';
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
    if (!prop || !prop.Localidad) {
        if (zonaSelect) zonaSelect.disabled = false;
        return;
    }
    let zone = DATA.zonas.find(z => z.Nombre === prop.Localidad);
    if (zone && zonaSelect) {
        zonaSelect.value = zone.Id;
        zonaSelect.disabled = true;
    } else if (zonaSelect) {
        zonaSelect.disabled = false;
    }
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
    document.getElementById('np-prop-localidad').value = propData ? propData.Localidad || '' : '';
    document.getElementById('np-prop-telefono').value = propData ? propData.Telefono || '' : '';
    document.getElementById('np-prop-tipo').value = propData ? (propData.Tipo_Propiedad || propData.Tipo_Propiedad_ || 'Casa') : 'Casa';
    document.getElementById('np-prop-inquilino').value = propData ? propData.Contacto_Inquilino || '' : '';
    document.getElementById('np-prop-maps').value = propData ? propData.Ubicacion_Maps || propData.Ubicacion_Maps_ || '' : '';
    document.getElementById('np-prop-horario').value = propData ? propData.Horario_Disponible || propData.Horario_Disponible_ || '' : '';
    document.getElementById('np-prop-principal').checked = propData ? !!propData.Principal : false;

    // Poblar select de Zonas (Localidad)
    let zs = document.getElementById('np-prop-localidad');
    zs.innerHTML = '<option value="">Seleccionar zona...</option>';
    DATA.zonas.forEach(z => {
        let sel = (propData && propData.Localidad === z.Nombre) ? 'selected' : '';
        zs.innerHTML += `<option value="${z.Nombre}" ${sel}>${cleanLabel(z.Nombre)}</option>`;
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
        Clientes_id: parseInt(cliId)
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
    if (DATA.clientes.length === 0) await loadAll();
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
    document.getElementById('np-resumen').style.display = 'none';
    unidadCount = 0;

    if (presData && presData._unidades && presData._unidades.length > 0) {
        _loadingEdit = true;
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
            Incluye_instalacion: true
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

    let totalConIva = subtotalNeto + totalIva21 + totalIva105;
    let sinFact = totalConIva * 0.9;
    await apiPatch(TBL.presupuestos, { Id: presId, Subtotal_neto: subtotalNeto, Subtotal_items: subtotalNeto, IVA_21: totalIva21, IVA_105: totalIva105, Total_con_IVA: totalConIva, Total: totalConIva, Descuento_sin_factura_pct: 10, Total_sin_factura: sinFact });

    await loadAll();
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
                <div style="margin-top: 8px;">
                    <img src="footer-pdf.png" style="width: 100%; margin: 0; padding: 0; display: block;">
                </div>
            </div>`;
        let container = document.getElementById('pdf-content');
        if (!container) { alert('Error: Contenedor PDF no encontrado'); return; }
        container.innerHTML = html;
        let opt = { margin: [5, 10, 0, 10], filename: `Presupuesto_${pres.Numero}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
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
    await loadAll();
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
