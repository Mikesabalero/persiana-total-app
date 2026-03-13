// ============================================================
// app.js — Código legacy (Fase 5 completada)
// ============================================================
// Todas las funciones fueron extraídas a módulos ES6 en js/.
// Solo quedan los event listeners globales de modal overlay.
// Este archivo será eliminado en Fase 6 (limpieza final).
// ============================================================

import { closeModal, closeDetail, closeVerPres, closeVerCliente,
         closeModalEditComp } from './js/core/ui.js';

// --- Modal overlay click handlers ---
// Patrón mousedown/mouseup para evitar cierres accidentales al arrastrar
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
            else if (event.target.id === 'modal-cliente') window.closeModalCliente();
            else if (event.target.id === 'modal-propiedad') window.closeModalPropiedad();
            else if (event.target.id === 'modal-edit-comp') closeModalEditComp();
        }
        if (event.target.classList.contains('detail-panel')) closeDetail();
    }
});
