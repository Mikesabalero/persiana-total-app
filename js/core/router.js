// ============================================================
// router.js — Navegación, lazy loading, inicialización
// ============================================================

import { TBL, PAGE_SIZE } from './config.js';
import { DATA, CLIENT_MAP, PAGING, setAppReady, appReady } from './state.js';
import { apiGet, apiGetAll, apiGetPaged, apiGetLinks, loadClientMap } from './api.js';
import { _showPageSpinner } from './ui.js';

// --- Resolver links de presupuestos (para dashboard y listado) ---
export async function _resolvePresupuestoLinks() {
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

// --- Lazy loading de datos por página ---
export async function ensureData(page) {
    if (page === 'clientes' || page === 'propiedades') {
        if (Object.keys(CLIENT_MAP).length === 0) {
            await loadClientMap();
        }
        DATA._loaded.propiedades = true;
        DATA._loaded.clientes = true;
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
                apiGet(TBL.unidades), apiGet(TBL.lineas), apiGetAll(TBL.propiedades)
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

// --- Navegación entre páginas ---
export async function showPage(id, btn) {
    if (!appReady) { alert("Cargando datos, por favor espere..."); return; }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Spinner y lazy-load
    let showSpn = DATA._loaded[id] === false;
    if (showSpn) _showPageSpinner(id, true);
    try { await ensureData(id); } catch(e) { console.error('ensureData error:', e); }
    if (showSpn) _showPageSpinner(id, false);
    // Render — las funciones vienen de window (aún en app.js legacy)
    if (id === 'dashboard' && window.loadDashboard) window.loadDashboard();
    if (id === 'presupuestos' && window.loadPresupuestos) window.loadPresupuestos();
    if (id === 'precios' && window.loadPrecios) window.loadPrecios();
    if (id === 'clientes' && window.renderClientes) window.renderClientes();
    if (id === 'propiedades' && window.renderPropiedades) window.renderPropiedades();
    if (id === 'config' && window.loadConfig) window.loadConfig();
}

// --- Paginación ---
export async function prevPage(key) {
    if (PAGING[key].page > 1) {
        PAGING[key].page--;
        if (key === 'clientes' && window.renderClientes) await window.renderClientes();
        if (key === 'presupuestos' && window.loadPresupuestos) await window.loadPresupuestos();
        if (key === 'propiedades' && window.renderPropiedades) await window.renderPropiedades();
    }
}

export async function nextPage(key) {
    let totalPages = Math.ceil(PAGING[key].total / PAGE_SIZE) || 1;
    if (PAGING[key].page < totalPages) {
        PAGING[key].page++;
        if (key === 'clientes' && window.renderClientes) await window.renderClientes();
        if (key === 'presupuestos' && window.loadPresupuestos) await window.loadPresupuestos();
        if (key === 'propiedades' && window.renderPropiedades) await window.renderPropiedades();
    }
}

// --- Inicialización de la app ---
export async function initApp() {
    console.time('initApp');
    // Fase 1: Solo datos esenciales para dashboard
    let cliPaged = await apiGetPaged(TBL.clientes, 1, '');
    let presPaged = await apiGetPaged(TBL.presupuestos, 1, '&sort=-Fecha');

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
    if (window.loadDashboard) window.loadDashboard();
    await loadClientMap();
    setAppReady(true);
    console.timeEnd('initApp');
    console.log('initApp: totales', PAGING.clientes.total, 'clientes,', PAGING.presupuestos.total, 'presupuestos');
}

// --- Recarga completa ---
export async function reloadAllData() {
    let cliPaged = await apiGetPaged(TBL.clientes, 1, '');
    let presPaged = await apiGetPaged(TBL.presupuestos, 1, '&sort=-Fecha');
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
    if (document.getElementById('page-dashboard').classList.contains('active') && window.loadDashboard) window.loadDashboard();
}

export async function loadAll() { await reloadAllData(); }
