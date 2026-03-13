// ============================================================
// main.js — Entry point de la aplicación (ES6 module)
// ============================================================
// Este archivo es el punto de entrada. Importa los módulos core
// y expone funciones en window para que los onclick del HTML funcionen.
// En fases posteriores, se irán importando los módulos extraídos.
// ============================================================

// --- Imports core ---
import { showToast, handleApiError } from './core/notify.js';

// Exponer utilidades en window para uso global
window.showToast = showToast;
window.handleApiError = handleApiError;

// --- Cargar app.js legacy ---
// En esta fase, app.js sigue conteniendo toda la lógica.
// Se carga como script legacy (no module) desde index.html.
// A medida que avancemos en las fases, las funciones migrarán aquí.

// Verificar que los módulos cargaron correctamente
console.log('[main.js] Módulos core cargados correctamente');
