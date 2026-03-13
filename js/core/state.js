// ============================================================
// state.js — Estado centralizado de la aplicación
// ============================================================

export let DATA = {
    clientes: [],
    propiedades: [],
    zonas: [],
    componentes: [],
    productos: [],
    prod_comp: [],
    presupuestos: [],
    lineas: [],
    unidades: [],
    formas_pago: [],
    tc: null,
    anchos: [],
    _loaded: {
        clientes: false,
        precios: false,
        presupuestos: false,
        presupuestos_deps: false,
        propiedades: false,
        config: false
    }
};

export let CLIENT_MAP = {};

export function resetClientMap() {
    // Vaciar el objeto sin perder la referencia
    Object.keys(CLIENT_MAP).forEach(k => delete CLIENT_MAP[k]);
}

export let PAGING = {
    clientes: { page: 1, total: 0 },
    presupuestos: { page: 1, total: 0 },
    propiedades: { page: 1, total: 0 }
};

export let appReady = false;
export function setAppReady(val) { appReady = val; }

export let currentUser = null;
export let currentRole = null;
export function setCurrentUser(u) { currentUser = u; }
export function setCurrentRole(r) { currentRole = r; }

export let editPresId = null;
export let unidadCount = 0;
export let _loadingEdit = false;
export function setEditPresId(v) { editPresId = v; }
export function setUnidadCount(v) { unidadCount = v; }
export function setLoadingEdit(v) { _loadingEdit = v; }
