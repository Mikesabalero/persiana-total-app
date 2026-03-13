// ============================================================
// config-main.js — Carga principal de la pestaña Configuración
// ============================================================

import { DATA } from '../../core/state.js';
import { fmt, cleanLabel } from '../../core/ui.js';
import { loadConfigEmpresa } from './empresa.js';

export function loadConfig() {
    loadConfigEmpresa();

    // --- Zonas ---
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

    // --- Formas de Pago ---
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

    // --- Anchos PVC ---
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
