// ============================================================
// notify.js — Sistema de notificaciones toast (reemplaza alert())
// ============================================================

let _toastContainer = null;

function _ensureContainer() {
    if (_toastContainer && document.body.contains(_toastContainer)) return _toastContainer;
    _toastContainer = document.createElement('div');
    _toastContainer.id = 'toast-container';
    _toastContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(_toastContainer);
    return _toastContainer;
}

/**
 * Muestra una notificación toast
 * @param {string} message - Texto a mostrar
 * @param {'success'|'error'|'warning'|'info'} type - Tipo de notificación
 * @param {number} duration - Milisegundos antes de desaparecer (default 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
    const container = _ensureContainer();

    const colors = {
        success: { bg: '#10b981', icon: '\u2713' },
        error:   { bg: '#ef4444', icon: '\u2717' },
        warning: { bg: '#f59e0b', icon: '\u26A0' },
        info:    { bg: '#3b82f6', icon: '\u2139' }
    };
    const c = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background:${c.bg}; color:white; padding:12px 20px; border-radius:8px;
        box-shadow:0 4px 12px rgba(0,0,0,0.15); font-family:Montserrat,sans-serif;
        font-size:0.9em; display:flex; align-items:center; gap:10px;
        pointer-events:auto; cursor:pointer; opacity:0; transform:translateX(40px);
        transition:opacity 0.3s, transform 0.3s; max-width:400px; word-break:break-word;
    `;
    toast.innerHTML = `<span style="font-size:1.2em">${c.icon}</span><span>${message}</span>`;

    // Click para cerrar inmediatamente
    toast.addEventListener('click', () => _removeToast(toast));

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // Auto-remover
    setTimeout(() => _removeToast(toast), duration);
}

function _removeToast(toast) {
    if (!toast.parentNode) return;
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
}

/**
 * Maneja errores de API de forma unificada
 * @param {Error} error - El error capturado
 * @param {string} context - Descripción de la operación que falló
 */
export function handleApiError(error, context = '') {
    const msg = context ? `${context}: ${error.message}` : error.message;
    console.error('[API Error]', msg, error);
    showToast(msg, 'error', 6000);
}
