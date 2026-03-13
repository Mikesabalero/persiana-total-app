// ============================================================
// empresa.js — Configuración de datos de empresa
// ============================================================

import { DATA } from '../../core/state.js';
import { apiPatch } from '../../core/api.js';

export function loadConfigEmpresa() {
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

export async function saveConfigEmpresa() {
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
