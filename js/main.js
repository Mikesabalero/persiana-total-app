// ============================================================
// main.js — Entry point de la aplicación (ES6 module)
// ============================================================
// Importa los módulos core y expone funciones en window para
// que los onclick del HTML y el código legacy de app.js funcionen.
// ============================================================

// --- Core: Notify ---
import { showToast, handleApiError } from './core/notify.js';
window.showToast = showToast;
window.handleApiError = handleApiError;

// --- Core: State ---
import { DATA, CLIENT_MAP, PAGING, appReady, currentUser, currentRole,
         setAppReady, setCurrentUser, setCurrentRole,
         editPresId, unidadCount, _loadingEdit,
         setEditPresId, setUnidadCount, setLoadingEdit } from './core/state.js';
// Exponer estado global para que app.js legacy pueda accederlo
window._STATE = { DATA, CLIENT_MAP, PAGING };

// --- Core: Config ---
import { API, TOKEN, BASE, H, TBL, PAGE_SIZE, USER_ROLES, firebaseConfig,
         INSTALACION_PCT, PESO_M2, CAT_SEGURIDAD, CAT_EXTERIOR, CAT_INTERIOR,
         REPAIR_LABELS } from './core/config.js';

// --- Core: API ---
import { apiGet, apiGetAll, apiGetPaged, apiGetLinks,
         apiPost, apiPatch, apiDelete, apiLink,
         loadClientMap } from './core/api.js';
window.apiGet = apiGet;
window.apiGetAll = apiGetAll;
window.apiGetPaged = apiGetPaged;
window.apiGetLinks = apiGetLinks;
window.apiPost = apiPost;
window.apiPatch = apiPatch;
window.apiDelete = apiDelete;
window.apiLink = apiLink;
window.loadClientMap = loadClientMap;

// --- Core: UI ---
import { fmt, cleanLabel, badgeHtml, resolveLink, resolveName,
         renderPagination, _showPageSpinner,
         closeModal, closeDetail, closeVerPres, closeVerCliente,
         closeModalEditComp, showConfigTab } from './core/ui.js';
window.fmt = fmt;
window.cleanLabel = cleanLabel;
window.badgeHtml = badgeHtml;
window.resolveLink = resolveLink;
window.resolveName = resolveName;
window.renderPagination = renderPagination;
window._showPageSpinner = _showPageSpinner;
window.closeModal = closeModal;
window.closeDetail = closeDetail;
window.closeVerPres = closeVerPres;
window.closeVerCliente = closeVerCliente;
window.closeModalEditComp = closeModalEditComp;
window.showConfigTab = showConfigTab;

// --- Core: Router ---
import { showPage, ensureData, initApp, reloadAllData, loadAll,
         prevPage, nextPage, _resolvePresupuestoLinks } from './core/router.js';
window.showPage = showPage;
window.ensureData = ensureData;
window.initApp = initApp;
window.reloadAllData = reloadAllData;
window.loadAll = loadAll;
window.prevPage = prevPage;
window.nextPage = nextPage;
window._resolvePresupuestoLinks = _resolvePresupuestoLinks;

// --- Core: Auth ---
import { loginEmail, loginGoogle, logout, applyRolePermissions, initAuth } from './core/auth.js';
window.loginEmail = loginEmail;
window.loginGoogle = loginGoogle;
window.logout = logout;
window.applyRolePermissions = applyRolePermissions;

// --- Exponer constantes de config que usa app.js legacy ---
window.API = API;
window.TOKEN = TOKEN;
window.BASE = BASE;
window.H = H;
window.TBL = TBL;
window.PAGE_SIZE = PAGE_SIZE;
window.USER_ROLES = USER_ROLES;
window.INSTALACION_PCT = INSTALACION_PCT;
window.PESO_M2 = PESO_M2;
window.CAT_SEGURIDAD = CAT_SEGURIDAD;
window.CAT_EXTERIOR = CAT_EXTERIOR;
window.CAT_INTERIOR = CAT_INTERIOR;
window.REPAIR_LABELS = REPAIR_LABELS;

// --- Exponer estado mutable para app.js legacy ---
// app.js usa DATA, CLIENT_MAP, PAGING directamente como globales.
// Los exponemos en window para que siga funcionando.
window.DATA = DATA;
window.CLIENT_MAP = CLIENT_MAP;
window.PAGING = PAGING;

// ============================================================
// MÓDULOS — Fase 3
// ============================================================

// --- Módulo: Dashboard ---
import { loadDashboard } from './modules/dashboard.js';
window.loadDashboard = loadDashboard;

// --- Módulo: Geo ---
import { geocodificarDireccion, asignarZonaAutomatica, autoDetectarZonaProp } from './modules/geo.js';
window.geocodificarDireccion = geocodificarDireccion;
window.asignarZonaAutomatica = asignarZonaAutomatica;
window.autoDetectarZonaProp = autoDetectarZonaProp;

// --- Módulo: Chatbot ---
import { openChatbot, closeChatbot, submitChatInput, showChatOptions } from './modules/chatbot.js';
window.openChatbot = openChatbot;
window.closeChatbot = closeChatbot;
window.submitChatInput = submitChatInput;
window.showChatOptions = showChatOptions;

// --- Módulo: Config (principal + sub-módulos) ---
import { loadConfig } from './modules/config/config-main.js';
import { loadConfigEmpresa, saveConfigEmpresa } from './modules/config/empresa.js';
import { openModalZona, closeModalZona, saveZona, deleteZona } from './modules/config/zonas.js';
import { openModalPago, closeModalPago, savePago, deletePago } from './modules/config/formas-pago.js';
import { openModalAncho, closeModalAncho, saveAncho, deleteAncho } from './modules/config/anchos.js';
window.loadConfig = loadConfig;
window.loadConfigEmpresa = loadConfigEmpresa;
window.saveConfigEmpresa = saveConfigEmpresa;
window.openModalZona = openModalZona;
window.closeModalZona = closeModalZona;
window.saveZona = saveZona;
window.deleteZona = deleteZona;
window.openModalPago = openModalPago;
window.closeModalPago = closeModalPago;
window.savePago = savePago;
window.deletePago = deletePago;
window.openModalAncho = openModalAncho;
window.closeModalAncho = closeModalAncho;
window.saveAncho = saveAncho;
window.deleteAncho = deleteAncho;

// ============================================================
// MÓDULOS — Fase 4: Módulos de datos
// ============================================================

// --- Módulo: Clientes ---
import { renderClientes, renderClientDatalist, searchClientsAPI, setupClientSearch,
         syncClientSelect, filterCli, filterSelectOptions, showClientDetail,
         openNewCliente, closeModalCliente, saveCliente, deleteCliente } from './modules/clientes/clientes.js';
import { viewCliente } from './modules/clientes/detail.js';
window.renderClientes = renderClientes;
window.renderClientDatalist = renderClientDatalist;
window.searchClientsAPI = searchClientsAPI;
window.setupClientSearch = setupClientSearch;
window.syncClientSelect = syncClientSelect;
window.filterCli = filterCli;
window.filterSelectOptions = filterSelectOptions;
window.showClientDetail = showClientDetail;
window.openNewCliente = openNewCliente;
window.closeModalCliente = closeModalCliente;
window.saveCliente = saveCliente;
window.deleteCliente = deleteCliente;
window.viewCliente = viewCliente;

// --- Módulo: Propiedades ---
import { renderPropiedades, filterPropiedades, openNewPropiedad,
         closeModalPropiedad, savePropiedad, deletePropiedad } from './modules/propiedades/propiedades.js';
window.renderPropiedades = renderPropiedades;
window.filterPropiedades = filterPropiedades;
window.openNewPropiedad = openNewPropiedad;
window.closeModalPropiedad = closeModalPropiedad;
window.savePropiedad = savePropiedad;
window.deletePropiedad = deletePropiedad;

// --- Módulo: Precios ---
import { calcPrecioVentaComp, loadPrecios, updateTcFromPrecios, nuevoComponente,
         openModalEditComp, saveComponent, deleteComponent,
         filterComp, sortCompTable, exportCsv } from './modules/precios/precios.js';
import { aplicarAumento, toggleAumentoModo, loadHistorialPrecios } from './modules/precios/aumentos.js';
window.calcPrecioVentaComp = calcPrecioVentaComp;
window.loadPrecios = loadPrecios;
window.updateTcFromPrecios = updateTcFromPrecios;
window.nuevoComponente = nuevoComponente;
window.openModalEditComp = openModalEditComp;
window.saveComponent = saveComponent;
window.deleteComponent = deleteComponent;
window.filterComp = filterComp;
window.sortCompTable = sortCompTable;
window.exportCsv = exportCsv;
window.aplicarAumento = aplicarAumento;
window.toggleAumentoModo = toggleAumentoModo;
window.loadHistorialPrecios = loadHistorialPrecios;

// ============================================================
// MÓDULOS — Fase 5: Presupuestos
// ============================================================

// --- Módulo: Presupuestos / List ---
import { loadPresupuestos, filterPresupuestos, changeStatus,
         duplicatePresupuesto, deletePresupuesto } from './modules/presupuestos/list.js';
window.loadPresupuestos = loadPresupuestos;
window.filterPresupuestos = filterPresupuestos;
window.changeStatus = changeStatus;
window.duplicatePresupuesto = duplicatePresupuesto;
window.deletePresupuesto = deletePresupuesto;

// --- Módulo: Presupuestos / Form ---
import { openNewPres, addUnidad, addUnidadUI, removeUnidad, duplicateUnidad,
         addCompRow, addCompRowWithData, compSelected,
         recalcUnidad, recalcTraslado, recalcTotal,
         updatePropiedadesSelect, loadPropiedadesSelect, updateZonaFromProp } from './modules/presupuestos/form.js';
window.openNewPres = openNewPres;
window.addUnidad = addUnidad;
window.addUnidadUI = addUnidadUI;
window.removeUnidad = removeUnidad;
window.duplicateUnidad = duplicateUnidad;
window.addCompRow = addCompRow;
window.addCompRowWithData = addCompRowWithData;
window.compSelected = compSelected;
window.recalcUnidad = recalcUnidad;
window.recalcTraslado = recalcTraslado;
window.recalcTotal = recalcTotal;
window.updatePropiedadesSelect = updatePropiedadesSelect;
window.loadPropiedadesSelect = loadPropiedadesSelect;
window.updateZonaFromProp = updateZonaFromProp;

// --- Módulo: Presupuestos / Save ---
import { savePres } from './modules/presupuestos/save.js';
window.savePres = savePres;

// --- Módulo: Presupuestos / View ---
import { fetchBudgetDeepData, viewPresupuesto } from './modules/presupuestos/view.js';
window.fetchBudgetDeepData = fetchBudgetDeepData;
window.viewPresupuesto = viewPresupuesto;

// --- Módulo: Presupuestos / PDF ---
import { generarPDF } from './modules/presupuestos/pdf.js';
window.generarPDF = generarPDF;

// --- Módulo: Presupuestos / Components Engine ---
import { getCategoria, selectMotor, autoLoadComponents } from './modules/presupuestos/components-engine.js';
window.getCategoria = getCategoria;
window.selectMotor = selectMotor;
window.autoLoadComponents = autoLoadComponents;

// --- Estado local de presupuestos ---
window._manualInstPct = window._manualInstPct || {};
window._manualVisitas = window._manualVisitas || undefined;

// --- Iniciar autenticación ---
// initAuth recibe initApp como callback para evitar dependencia circular
initAuth(initApp);

console.log('[main.js] Módulos core + Fase 3 + Fase 4 + Fase 5 cargados correctamente');
