const API = 'http://93.127.212.235:32770';
const TOKEN = 'dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ';
const BASE = 'pru2fsphj43juyr';
const H = { 'xc-token': TOKEN, 'Content-Type': 'application/json' };
const TBL = { clientes: 'mwby85581fhjy27', propiedades: 'm0dwlr7ccoim1kf', historial: 'mimh9lp8bkew4t0', categorias: 'mulo5ve82d9ex7q', productos: 'mdr6mo695g0qz6d', componentes: 'mgh9e1zivvhpg26', prod_comp: 'mmjzqw7v4que9q3', tc: 'mhj9fovlmv9036x', zonas: 'mottig5nmj5e3kx', presupuestos: 'mn1yyjyovvoyxme', lineas: 'mv1e9trh23j0q3o', servicios: 'mz8qrki3hz4y7iv', formas_pago: 'm2t4fnjie88gfo0', unidades: 'mix059xkpsz15um', anchos: 'mayai71j546g3as' };
let DATA = { clientes: [], zonas: [], componentes: [], productos: [], prod_comp: [], presupuestos: [], lineas: [], unidades: [], formas_pago: [], tc: null, anchos: [] };
let unidadCount = 0;
async function apiGet(tid, params = '') { let r = await fetch(API + '/api/v2/tables/' + tid + '/records?limit=200' + params, { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiGetLinks(tid, colId, rowId) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId + '?limit=10', { headers: H }); if (!r.ok) return []; let d = await r.json(); return d.list || []; }
async function apiPost(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'POST', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiPatch(tid, body) { let r = await fetch(API + '/api/v2/tables/' + tid + '/records', { method: 'PATCH', headers: H, body: JSON.stringify(body) }); return r.json(); }
async function apiLink(tid, colId, rowId, linked) { let r = await fetch(API + '/api/v2/tables/' + tid + '/links/' + colId + '/records/' + rowId, { method: 'POST', headers: H, body: JSON.stringify(linked) }); return r.json(); }
function fmt(n) { if (n == null) return '$0'; return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function badgeHtml(estado) { let c = { 'Borrador': 'borrador', 'Enviado': 'enviado', 'Aprobado': 'aprobado', 'Rechazado': 'rechazado', 'Vencido': 'vencido', 'Facturado': 'facturado' }; return '<span class="badge badge-' + (c[estado] || 'borrador') + '">' + estado + '</span>'; }
function showPage(id, btn) { document.querySelectorAll('.page').forEach(p => p.classList.remove('active')); document.getElementById('page-' + id).classList.add('active'); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); if (btn) btn.classList.add('active'); if (id === 'dashboard') loadDashboard(); if (id === 'presupuestos') loadPresupuestos(); if (id === 'precios') loadPrecios(); if (id === 'clientes') loadClientes(); if (id === 'config') loadConfig(); }
function showConfigTab(id, btn) { document.querySelectorAll('.config-section').forEach(s => s.style.display = 'none'); document.getElementById('config-' + id).style.display = 'block'; document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active')); btn.classList.add('active'); }
function closeModal() { document.getElementById('modal-pres').classList.remove('show'); }
function closeDetail() { document.getElementById('panel-cliente').classList.remove('open'); }
function resolveLink(row, field) { let v = row[field]; if (!v) return null; if (typeof v === 'object' && Array.isArray(v) && v.length > 0) return v[0]; if (typeof v === 'object' && v.Id) return v; return null; }
function resolveName(row, field, list, idField) { let link = resolveLink(row, field); if (!link) return '-'; let id = link.Id || link.id || link; let found = list.find(i => i.Id == id); return found ? found.Nombre || found.Title || '-' : '-'; }
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
    DATA.anchos = await apiGet(TBL.anchos);
    for (let p of DATA.presupuestos) {
        try { let cl = await apiGetLinks(TBL.presupuestos, 'canpten8owymbde', p.Id); if (cl.length > 0) p._clienteNombre = cl[0].Nombre || cl[0].Title || '-'; else p._clienteNombre = '-'; } catch (e) { p._clienteNombre = '-'; }
        try { let zl = await apiGetLinks(TBL.presupuestos, 'cr3s0ox51qopwl4', p.Id); if (zl.length > 0) p._zonaNombre = zl[0].Nombre || zl[0].Title || '-'; else p._zonaNombre = '-'; } catch (e) { p._zonaNombre = '-'; }
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
        let cliName = p._clienteNombre || '-';
        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + fmt(p.Total_con_IVA || p.Total) + '</td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td></tr>';
    });
}
function loadPresupuestos() {
    let tb = document.getElementById('pres-table');
    tb.innerHTML = '';
    DATA.presupuestos.forEach(p => {
        let cliName = p._clienteNombre || '-';
        let zonaName = p._zonaNombre || '-';
        let iva = (p.IVA_21 || 0) + (p.IVA_105 || 0);
        tb.innerHTML += '<tr><td><strong>' + (p.Numero || '-') + '</strong></td><td>' + (p.Fecha || '-') + '</td><td>' + cliName + '</td><td>' + zonaName + '</td><td>' + fmt(p.Subtotal_neto || p.Subtotal_items) + '</td><td>' + fmt(iva) + '</td><td><strong>' + fmt(p.Total_con_IVA || p.Total) + '</strong></td><td>' + badgeHtml(p.Estado || 'Borrador') + '</td><td><button class="btn btn-sm btn-secondary">Ver</button></td></tr>';
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
        tb.innerHTML += '<tr><td><strong>' + c.Nombre + '</strong></td><td>' + (c.Tipo_componente || '-') + '</td><td class="hide-margin">' + Number(costo).toFixed(2) + '</td><td class="hide-margin">' + (c.Moneda_costo || '-') + '</td><td class="hide-margin">' + margen + '%</td><td><strong>' + fmt(precioArs) + '</strong></td><td class="hide-margin">' + (c.Alicuota_IVA_compra || '-') + '%</td><td class="hide-margin">' + (c.Alicuota_IVA_venta || '-') + '%</td><td>' + (c.Proveedor || '-') + '</td></tr>';
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
        tb.innerHTML += '<tr style="cursor:pointer" onclick="showClientDetail(' + c.Id + ')"><td><strong>' + c.Nombre + '</strong></td><td>' + (c.Telefono || '-') + '</td><td>' + (c.Mail || '-') + '</td><td>' + (c.Tipo || '-') + '</td><td>' + (c.Condicion_fiscal || '-') + '</td><td>' + (c.CUIT_CUIL_DNI || '-') + '</td><td>' + presCount + '</td></tr>';
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
    let html = '<h2 style="margin-bottom:4px">' + c.Nombre + '</h2><span class="badge badge-enviado">' + (c.Tipo || 'Particular') + '</span>';
    html += '<div class="detail-section" style="margin-top:20px"><h4>Contacto</h4>';
    html += '<div class="detail-field"><span>Teléfono</span><span>' + (c.Telefono || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Mail</span><span>' + (c.Mail || '-') + '</span></div></div>';
    html += '<div class="detail-section"><h4>Información Fiscal</h4>';
    html += '<div class="detail-field"><span>CUIT/DNI</span><span>' + (c.CUIT_CUIL_DNI || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Cond. Fiscal</span><span>' + (c.Condicion_fiscal || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Tipo Factura</span><span>' + (c.Tipo_factura || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Razón Social</span><span>' + (c.Razon_social || '-') + '</span></div></div>';
    document.getElementById('detail-content').innerHTML = html;
    document.getElementById('panel-cliente').classList.add('open');
}
function loadConfig() {
    document.getElementById('cfg-tc-valor').value = DATA.tc.Dolar_oficial || '';
    document.getElementById('cfg-tc-fecha').value = DATA.tc.Fecha || '';
    let zt = document.getElementById('cfg-zonas-table');
    zt.innerHTML = '';
    DATA.zonas.forEach(z => {
        zt.innerHTML += '<tr><td><strong>' + z.Nombre + '</strong></td><td>' + fmt(z.Costo_viatico) + '</td><td>' + fmt(z.Costo_transporte) + '</td><td>' + fmt(z.Costo_traslado_service) + '</td></tr>';
    });
    let pt = document.getElementById('cfg-pagos-table');
    pt.innerHTML = '';
    DATA.formas_pago.forEach(f => {
        pt.innerHTML += '<tr><td><strong>' + f.Nombre + '</strong></td><td>' + (f.Recargo_pct || 0) + '%</td><td>' + (f.Descuento_pct || 0) + '%</td><td>' + (f.Plazo_dias || 0) + '</td><td>' + (f.Activo ? 'Si' : 'No') + '</td></tr>';
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
async function openNewPres() {
    if (DATA.clientes.length === 0) await loadAll();
    let cs = document.getElementById('np-cliente');
    cs.innerHTML = '<option value="">Seleccionar cliente...</option>';
    DATA.clientes.forEach(c => { cs.innerHTML += '<option value="' + c.Id + '">' + c.Nombre + ' - ' + (c.Telefono || '') + '</option>'; });
    let zs = document.getElementById('np-zona');
    zs.innerHTML = '<option value="">Seleccionar zona...</option>';
    DATA.zonas.forEach(z => { zs.innerHTML += '<option value="' + z.Id + '">' + z.Nombre + '</option>'; });
    let ps = document.getElementById('np-pago');
    ps.innerHTML = '';
    DATA.formas_pago.forEach(f => { ps.innerHTML += '<option value="' + f.Id + '">' + f.Nombre + '</option>'; });
    document.getElementById('np-unidades').innerHTML = '';
    document.getElementById('np-resumen').style.display = 'none';
    unidadCount = 0;
    addUnidad();
    document.getElementById('modal-pres').classList.add('show');
}
function addUnidad() {
    unidadCount++;
    let n = unidadCount;
    let prodOpts = '<option value="">Seleccionar producto...</option>';
    DATA.productos.forEach(p => { prodOpts += '<option value="' + p.Id + '">' + p.Nombre + '</option>'; });
    let html = '<div class="unidad-card" id="unidad-' + n + '"><div class="unidad-header"><h3>Unidad ' + n + '</h3><div style="display:flex;gap:8px;align-items:center"><span class="unidad-subtotal" id="sub-u-' + n + '">$0</span><button class="btn-remove" onclick="removeUnidad(' + n + ')" title="Eliminar">🗑</button></div></div>';
    html += '<div class="form-row-4"><div class="form-group"><label>Ambiente</label><input id="u-' + n + '-nombre" placeholder="Ej: Dormitorio principal"></div>';
    html += '<div class="form-group"><label>Ubicación</label><input id="u-' + n + '-ubic" placeholder="Ej: Contra frente"></div>';
    html += '<div class="form-group"><label>Tipo Trabajo</label><select id="u-' + n + '-tipo"><option>Instalacion_nueva</option><option>Cambio_pano</option><option>Motorizacion</option><option>Cambio_guias</option><option>Reparacion</option><option>Service</option><option>Otro</option></select></div>';
    html += '<div class="form-group"><label>Producto Base</label><select id="u-' + n + '-prod" onchange="loadCompSugeridos(' + n + ')">' + prodOpts + '</select></div></div>';
    html += '<div class="form-row" style="grid-template-columns:1fr 1fr 2fr"><div class="form-group"><label>Ancho (m)</label><input type="number" id="u-' + n + '-ancho" step="0.01" oninput="recalcUnidad(' + n + ')"></div>';
    html += '<div class="form-group"><label>Alto (m)</label><input type="number" id="u-' + n + '-alto" step="0.01" oninput="recalcUnidad(' + n + ')"></div><div></div></div>';
    html += '<table class="comp-table"><thead><tr><th>Componente</th><th>Cant.</th><th class="hide-margin">Costo</th><th class="hide-margin">Moneda</th><th class="hide-margin">Margen%</th><th>Precio Unit.</th><th>Subtotal</th><th>IVA%</th><th></th></tr></thead><tbody id="comps-u-' + n + '"></tbody></table>';
    html += '<button class="btn-add-comp" onclick="addCompRow(' + n + ')">+ Agregar componente</button></div>';
    document.getElementById('np-unidades').insertAdjacentHTML('beforeend', html);
}
function removeUnidad(n) { document.getElementById('unidad-' + n)?.remove(); recalcTotal(); }
function loadCompSugeridos(n) {
    let prodId = document.getElementById('u-' + n + '-prod').value;
    let tbody = document.getElementById('comps-u-' + n);
    tbody.innerHTML = '';
    if (!prodId) return;
    let templates = DATA.prod_comp.filter(pc => {
        let pLink = pc.Productos;
        if (!pLink) return false;
        if (typeof pLink === 'object') {
            if (Array.isArray(pLink)) return pLink.some(p => (p.Id || p) == prodId);
            return (pLink.Id || pLink) == prodId;
        }
        return pLink == prodId;
    });
    templates.forEach(t => {
        let compLink = t.Componentes;
        let compId = null;
        if (compLink) {
            if (typeof compLink === 'object') {
                if (Array.isArray(compLink) && compLink.length > 0) compId = compLink[0].Id || compLink[0];
                else compId = compLink.Id || compLink;
            } else compId = compLink;
        }
        let comp = DATA.componentes.find(c => c.Id == compId);
        if (comp) addCompRowWithData(n, comp, t.Cantidad_default || 1);
    });
    if (templates.length === 0) addCompRow(n);
    recalcUnidad(n);
}
function addCompRow(n) {
    let compOpts = '<option value="">Seleccionar...</option>';
    DATA.componentes.forEach(c => { compOpts += '<option value="' + c.Id + '">' + c.Nombre + '</option>'; });
    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    row.innerHTML = '<td><select onchange="compSelected(this,' + n + ')" style="min-width:160px">' + compOpts + '</select></td><td><input type="number" value="1" step="0.01" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-costo hide-margin">0</td><td class="c-moneda hide-margin">-</td><td class="hide-margin"><input type="number" value="40" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-precio">$0</td><td class="c-subtotal">$0</td><td class="c-iva">21%</td><td><button class="btn-remove" onclick="this.closest(\'tr\').remove();recalcUnidad(' + n + ')">✕</button></td>';
    tbody.appendChild(row);
}
function addCompRowWithData(n, comp, qty) {
    let tc = DATA.tc.Dolar_oficial || 1150;
    let costo = comp.Costo_unitario || 0;
    let moneda = comp.Moneda_costo || 'ARS';
    let margen = comp.Margen_default || 40;
    let costoArs = moneda === 'USD' ? costo * tc : costo;
    let precio = costoArs * (1 + margen / 100);
    let iva = comp.Alicuota_IVA_venta || '21';
    let compOpts = '';
    DATA.componentes.forEach(c => { compOpts += '<option value="' + c.Id + '"' + (c.Id === comp.Id ? ' selected' : '') + '>' + c.Nombre + '</option>'; });
    let tbody = document.getElementById('comps-u-' + n);
    let row = document.createElement('tr');
    row.innerHTML = '<td><select onchange="compSelected(this,' + n + ')" style="min-width:160px">' + compOpts + '</select></td><td><input type="number" value="' + qty + '" step="0.01" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-costo hide-margin">' + costo.toFixed(2) + '</td><td class="c-moneda hide-margin">' + moneda + '</td><td class="hide-margin"><input type="number" value="' + margen + '" style="width:60px" oninput="recalcUnidad(' + n + ')"></td><td class="c-precio">' + fmt(precio) + '</td><td class="c-subtotal">' + fmt(precio * qty) + '</td><td class="c-iva">' + iva + '%</td><td><button class="btn-remove" onclick="this.closest(\'tr\').remove();recalcUnidad(' + n + ')">✕</button></td>';
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
            let iva = r.querySelector('.c-iva')?.textContent || '21';
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
    let clienteId = document.getElementById('np-cliente').value;
    let zonaId = document.getElementById('np-zona').value;
    if (!clienteId) { alert('Seleccioná un cliente'); return; }
    if (!zonaId) { alert('Seleccioná una zona'); return; }
    let tc = DATA.tc.Dolar_oficial || 1150;
    let year = new Date().getFullYear();
    let num = year + '-' + (String(DATA.presupuestos.length + 1).padStart(4, '0'));
    let presData = { Numero: num, Fecha: new Date().toISOString().split('T')[0], Estado: 'Borrador', TC_usado: tc, Canal: document.getElementById('np-canal').value, Quiere_factura: document.getElementById('np-factura').checked, Incluye_instalacion: true };
    let pres = await apiPost(TBL.presupuestos, presData);
    let presId = pres.Id || pres.id;
    if (!presId) { alert('Error creando presupuesto'); return; }
    await apiLink(TBL.presupuestos, 'canpten8owymbde', presId, [{ Id: parseInt(clienteId) }]);
    await apiLink(TBL.presupuestos, 'cr3s0ox51qopwl4', presId, [{ Id: parseInt(zonaId) }]);
    let subtotalNeto = 0, totalIva21 = 0, totalIva105 = 0;
    let unidadCards = document.querySelectorAll('[id^="unidad-"]');
    for (let card of unidadCards) {
        let n = card.id.split('-')[1];
        let uData = { Nombre: document.getElementById('u-' + n + '-nombre')?.value || 'Unidad ' + n, Ubicacion: document.getElementById('u-' + n + '-ubic')?.value || '', Tipo_trabajo: document.getElementById('u-' + n + '-tipo')?.value || 'Otro', Ancho_m: parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || null, Alto_m: parseFloat(document.getElementById('u-' + n + '-alto')?.value) || null, Orden: parseInt(n) };
        let ancho = uData.Ancho_m || 0;
        let alto = uData.Alto_m || 0;
        if (ancho && alto) uData.M2_calculados = ancho * alto;
        let unidad = await apiPost(TBL.unidades, uData);
        let uId = unidad.Id || unidad.id;
        if (uId) {
            await apiLink(TBL.unidades, 'cm5xv0vmlne7r6u', uId, [{ Id: presId }]);
            let prodId = document.getElementById('u-' + n + '-prod')?.value;
            if (prodId) await apiLink(TBL.unidades, 'co1b5kwpl8d2rya', uId, [{ Id: parseInt(prodId) }]);
        }
        let rows = document.querySelectorAll('#comps-u-' + n + ' tr');
        let orden = 0;
        for (let r of rows) {
            orden++;
            let sel = r.querySelector('select');
            let compId = sel ? sel.value : null;
            let costo = parseFloat(r.querySelector('.c-costo')?.textContent) || 0;
            let moneda = r.querySelector('.c-moneda')?.textContent || 'ARS';
            let iva = r.querySelector('.c-iva')?.textContent || '21';
            let inputs = r.querySelectorAll('input[type="number"]');
            let qty = parseFloat(inputs[0]?.value) || 1;
            let margen = parseFloat(inputs[1]?.value) || 0;
            let costoArs = moneda === 'USD' ? costo * tc : costo;
            let precioUnit = costoArs * (1 + margen / 100);
            let sub = precioUnit * qty;
            let montoIva = iva === '10.5' ? sub * 0.105 : sub * 0.21;
            let lineaData = { Descripcion_pdf: sel ? sel.options[sel.selectedIndex]?.text : 'Item', Ancho_m: parseFloat(document.getElementById('u-' + n + '-ancho')?.value) || null, Alto_m: parseFloat(document.getElementById('u-' + n + '-alto')?.value) || null, Cantidad: qty, M2_calculados: uData.M2_calculados || null, Moneda_costo_orig: moneda, Costo_unit_orig: costo, TC_aplicado: moneda === 'USD' ? tc : null, Costo_unit_ARS: costoArs, Margen_pct: margen, Precio_unit_ARS: precioUnit, Subtotal_ARS: sub, Alicuota_IVA: iva, Monto_IVA: montoIva, Subtotal_con_IVA: sub + montoIva, Orden: orden, Visible_pdf: true };
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
    let totalConIva = subtotalNeto + totalIva21 + totalIva105;
    let sinFact = totalConIva * 0.9;
    await apiPatch(TBL.presupuestos, { Id: presId, Subtotal_neto: subtotalNeto, Subtotal_items: subtotalNeto, IVA_21: totalIva21, IVA_105: totalIva105, Total_con_IVA: totalConIva, Total: totalConIva, Descuento_sin_factura_pct: 10, Total_sin_factura: sinFact });
    alert('Presupuesto ' + num + ' guardado correctamente');
    closeModal();
    DATA.presupuestos = await apiGet(TBL.presupuestos);
    DATA.lineas = await apiGet(TBL.lineas);
    DATA.unidades = await apiGet(TBL.unidades);
    loadDashboard();
    showPage('presupuestos', document.querySelectorAll('.nav-item')[1]);
}
loadAll();

async function aplicarAumento() {
    let pctVal = document.getElementById('aumento-pct').value;
    let cat = document.getElementById('aumento-cat').value;
    if (!pctVal) { alert('Ingresá un porcentaje'); return; }
    let pct = parseFloat(pctVal);
    if (pct === 0) return;

    if (!confirm('¿Estás seguro de aumentar ' + pct + '% a ' + cat + '?')) return;

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
        let row = '<tr><td>' + new Date().toLocaleString() + '</td><td>' + pct + '%</td><td>' + cat + '</td><td>' + patchData.length + '</td></tr>';
        tbody.insertAdjacentHTML('afterbegin', row);

        document.getElementById('aumento-pct').value = '';
    } catch (e) {
        console.error(e);
        alert('Error al actualizar precios: ' + e.message);
    }
}