// ============================================================
// precios.js — Tabla componentes, CRUD, filtros, sort, export
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../core/api.js';
import { fmt, cleanLabel, closeModalEditComp } from '../../core/ui.js';

export function calcPrecioVentaComp() {
    let costo = parseFloat(document.getElementById('ec-costo').value) || 0;
    let pctArmado = parseFloat(document.getElementById('ec-pct-armado').value) || 0;
    let margen = parseFloat(document.getElementById('ec-margen').value) || 0;
    let ivaVenta = parseFloat(document.getElementById('ec-iva-venta').value) || 21;
    let tc = DATA.tc.Dolar_oficial || 1150;
    let moneda = document.getElementById('ec-moneda').value;
    let costoBase = costo * (1 + pctArmado / 100);
    if (moneda === 'USD') costoBase *= tc;
    let precioSinIva = costoBase * (1 + margen / 100);
    let precioConIva = precioSinIva * (1 + ivaVenta / 100);
    let fmtStr = n => '$' + Math.round(n).toLocaleString('es-AR');
    let elPV = document.getElementById('ec-precio-venta');
    let elPVI = document.getElementById('ec-precio-venta-iva');
    if(elPV) elPV.value = fmtStr(precioSinIva);
    if(elPVI) elPVI.value = fmtStr(precioConIva);
}

export function loadPrecios() {
    let tc = DATA.tc.Dolar_oficial || 1150;
    document.getElementById('precios-tc').textContent = 'TC: 1 USD = $' + Number(tc).toLocaleString('es-AR') + ' ARS';
    let inputTc = document.getElementById('precios-tc-input');
    if(inputTc) inputTc.value = tc;

    if (window.toggleAumentoModo) window.toggleAumentoModo();
    if (window.loadHistorialPrecios) window.loadHistorialPrecios();

    let tb = document.getElementById('precios-table');
    tb.innerHTML = '';

    // Convert current component data into array
    let currentData = Array.from(DATA.componentes);

    currentData.forEach(c => {
        let costo = parseFloat(c.Costo_unitario) || 0;
        let pctArmado = parseFloat(c.Porcentaje_Armado || c.Pct_armado) || 0;
        let margen = parseFloat(c.Margen_default) || 0;
        let ivaVenta = parseFloat(c.Alicuota_IVA_venta || c.Alicuota_IVA_Venta) || 21;

        // Fórmula: Costo * (1 + Armado/100) * (1 + Margen/100) * (1 + IVA/100)
        let costoBase = costo * (1 + pctArmado / 100);
        if (c.Moneda_costo === 'USD') costoBase *= tc;

        let precioSinIva = costoBase * (1 + margen / 100);
        let precioFinal = precioSinIva * (1 + ivaVenta / 100);

        let pDateStr = '—';
        if (c.Fecha_ult_actualizacion) {
            let pDate = new Date(c.Fecha_ult_actualizacion);
            let pDateLocal = new Date(pDate.getTime() + pDate.getTimezoneOffset() * 60000);
            pDateStr = pDateLocal.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }

        let tipoCompClass = 'row-' + (c.Tipo_componente || 'Material');
        let activoIcon = (c.Activo === false || c.Activo === 'false' || c.Activo === 0) ? '❌' : '✅';

        let cData = JSON.stringify(c).replace(/"/g, '&quot;');
        let actionBtn = `<div style="display:flex;gap:4px">
            <button class="btn-remove" onclick="openModalEditComp(${cData})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
            <button class="btn-remove" onclick="deleteComponent(${c.Id || c.id}, '${cleanLabel(c.Nombre).replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
        </div>`;

        tb.innerHTML += `<tr class="row-comp ${tipoCompClass}">
            <td><strong>${cleanLabel(c.Nombre)}</strong></td>
            <td>${cleanLabel(c.Tipo_componente || '-')}</td>
            <td>${c.Unidad || '-'}</td>
            <td><strong>${fmt(precioFinal)}</strong></td>
            <td>${activoIcon}</td>
            <td>${pDateStr}</td>
            <td>${actionBtn}</td>
        </tr>`;
    });

    filterComp();
}

export async function updateTcFromPrecios() {
    let val = document.getElementById('precios-tc-input').value;
    if (!val) { alert('Ingresá el valor del dólar'); return; }
    let fecha = new Date().toISOString().split('T')[0];
    try {
        await apiPatch(TBL.tc, { Id: DATA.tc.Id, Dolar_oficial: parseFloat(val), Fecha: fecha });
        DATA.tc.Dolar_oficial = parseFloat(val);
        alert('Tipo de cambio actualizado');
        loadPrecios();
        if (window.loadDashboard) window.loadDashboard();
    } catch (e) {
        console.error(e);
        alert('Error al actualizar TC');
    }
}

export function nuevoComponente() {
    document.getElementById('ec-id').value = '';
    document.getElementById('ec-nombre').value = '';
    document.getElementById('ec-codigo').value = '';
    document.getElementById('ec-tipo').value = 'Material';
    document.getElementById('ec-unidad').value = 'unidad';
    document.getElementById('ec-costo').value = 0;
    document.getElementById('ec-pct-armado').value = 0;
    document.getElementById('ec-moneda').value = 'ARS';
    document.getElementById('ec-margen').value = 0;
    document.getElementById('ec-proveedor').value = '';
    document.getElementById('ec-iva-compra').value = '21';
    document.getElementById('ec-iva-venta').value = '21';
    document.getElementById('ec-notas').value = '';
    document.getElementById('ec-activo').checked = true;

    document.getElementById('ec-title').textContent = 'Nuevo Componente';
    document.getElementById('modal-edit-comp').classList.add('show');
    calcPrecioVentaComp();
}

export function openModalEditComp(compData) {
    document.getElementById('ec-id').value = compData.Id || compData.id;
    document.getElementById('ec-nombre').value = compData.Nombre || '';
    document.getElementById('ec-codigo').value = compData.Codigo_interno || '';
    document.getElementById('ec-tipo').value = compData.Tipo_componente || 'Material';
    document.getElementById('ec-unidad').value = compData.Unidad || 'unidad';
    document.getElementById('ec-costo').value = compData.Costo_unitario || 0;
    document.getElementById('ec-pct-armado').value = compData.Porcentaje_Armado || compData.Pct_armado || 0;
    document.getElementById('ec-moneda').value = compData.Moneda_costo || 'ARS';
    document.getElementById('ec-margen').value = compData.Margen_default || 0;
    document.getElementById('ec-proveedor').value = compData.Proveedor || '';
    document.getElementById('ec-iva-compra').value = compData.Alicuota_IVA_compra || '21';
    document.getElementById('ec-iva-venta').value = compData.Alicuota_IVA_venta || '21';
    document.getElementById('ec-notas').value = compData.Notas || '';
    document.getElementById('ec-activo').checked = (compData.Activo !== false && compData.Activo !== 'false' && compData.Activo !== 0);

    document.getElementById('ec-title').textContent = 'Editar Componente';
    document.getElementById('modal-edit-comp').classList.add('show');
    calcPrecioVentaComp();
}

export async function saveComponent() {
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
        Porcentaje_Armado: parseFloat(document.getElementById('ec-pct-armado').value) || 0,
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

export async function deleteComponent(id, nombre) {
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

export function filterComp() {
    let search = document.getElementById('comp-search').value.toLowerCase();
    let tipo = document.getElementById('comp-filter-tipo').value;
    let activoFilter = document.getElementById('comp-filter-activo');
    let activoVal = activoFilter ? activoFilter.value : 'all';

    let rows = document.querySelectorAll('#precios-table tr');
    rows.forEach(r => {
        let name = r.cells[0]?.textContent.toLowerCase() || '';
        let t = r.cells[1]?.textContent || '';
        let isActivo = r.cells[4]?.textContent.includes('✅');

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
export function sortCompTable(colIdx) {
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
        if (colIdx === 3) {
            let numA = parseFloat(textA.replace(/[^0-9.-]+/g, '')) || 0;
            let numB = parseFloat(textB.replace(/[^0-9.-]+/g, '')) || 0;
            return currentSortDir === 'asc' ? numA - numB : numB - numA;
        }

        if (colIdx === 5) {
            let dateA = textA === '—' ? '' : textA.split('/').reverse().join('');
            let dateB = textB === '—' ? '' : textB.split('/').reverse().join('');
            if (dateA < dateB) return currentSortDir === 'asc' ? -1 : 1;
            if (dateA > dateB) return currentSortDir === 'asc' ? 1 : -1;
            return 0;
        }

        if (textA < textB) return currentSortDir === 'asc' ? -1 : 1;
        if (textA > textB) return currentSortDir === 'asc' ? 1 : -1;
        return 0;
    });

    table.innerHTML = '';
    rows.forEach(r => table.appendChild(r));
}

export function exportCsv() {
    let rows = document.querySelectorAll('#precios-table tr');
    let csvContent = '\uFEFFNombre,Tipo,Unidad,Precio final ARS,Activo,Última actualización\n';

    rows.forEach(r => {
        if (r.style.display !== 'none') {
            let rowCsv = [];
            for (let i = 0; i < 6; i++) {
                rowCsv.push(`"${r.cells[i]?.textContent.replace(/"/g, '""') || ''}"`);
            }
            csvContent += rowCsv.join(',') + '\n';
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
