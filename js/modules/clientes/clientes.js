// ============================================================
// clientes.js — Listado, CRUD, filtros y búsqueda de clientes
// ============================================================

import { DATA, CLIENT_MAP, PAGING } from '../../core/state.js';
import { API, H, TBL, PAGE_SIZE } from '../../core/config.js';
import { apiGet, apiGetPaged, apiPost, apiPatch, apiDelete } from '../../core/api.js';
import { cleanLabel, renderPagination, _showPageSpinner, resolveLink } from '../../core/ui.js';

// --- Listado paginado ---
export async function renderClientes() {
    _showPageSpinner('clientes', true);
    let search = document.getElementById('cli-search')?.value || '';
    let tipo = document.getElementById('cli-filter-tipo')?.value || '';

    let parts = [];
    if (search) {
        let words = search.trim().toLowerCase().split(/\s+/);
        let list = Object.entries(CLIENT_MAP).map(([id, data]) => ({ Id: parseInt(id), Nombre: data.Nombre, Telefono: data.Telefono }));
        list = list.filter(c => {
            let n = (c.Nombre || '').toLowerCase();
            let t = (c.Telefono || '').toLowerCase();
            return words.every(w => n.includes(w) || t.includes(w));
        });
        list.sort((a, b) => b.Id - a.Id);

        PAGING.clientes.total = list.length;
        let startIndex = (PAGING.clientes.page - 1) * PAGE_SIZE;
        DATA.clientes = list.slice(startIndex, startIndex + PAGE_SIZE);
    } else {
        if (tipo) {
            parts.push(`(Tipo,eq,${tipo})`);
        }
        let extra = '&sort=-CreatedAt';
        if (parts.length > 0) extra += `&where=${parts.join('~and')}`;

        let res = await apiGetPaged(TBL.clientes, PAGING.clientes.page, extra);
        DATA.clientes = res.list;
        PAGING.clientes.total = res.total;
    }

    let tb = document.getElementById('cli-table');
    if (!tb) return;
    tb.innerHTML = '';

    for (let c of DATA.clientes) {
        let r = await fetch(API + '/api/v2/tables/' + TBL.presupuestos + '/links/canpten8owymbde/records/' + (c.Id || c.id) + '?limit=1', { headers: H }).catch(() => null);
        let presCount = 0;
        if (r && r.ok) { let d = await r.json(); presCount = d.pageInfo?.totalRows || 0; }

        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(c.Nombre)}</strong></td>
            <td>${c.Telefono || '-'}</td>
            <td>${c.Mail || '-'}</td>
            <td>${cleanLabel(c.Tipo || '-')}</td>
            <td>${cleanLabel(c.Condicion_fiscal || '-')}</td>
            <td>${c.CUIT_CUIL_DNI || '-'}</td>
            <td>${presCount}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-remove" onclick="viewCliente(${c.id || c.Id})" title="Ver" style="background:#f3f4f6;color:var(--text)">👁</button>
                    <button class="btn-remove" onclick="openNewCliente(${JSON.stringify(c).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deleteCliente(${c.id || c.Id}, '${(c.Nombre || '').replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    }
    renderPagination('pag-clientes', PAGING.clientes, 'clientes');
    renderClientDatalist();
    _showPageSpinner('clientes', false);
}

// --- Datalist y búsqueda dinámica ---
export async function renderClientDatalist() {
    let dl = document.getElementById('client-datalist');
    if (dl) dl.innerHTML = '';
}

export async function searchClientsAPI(query, all = false) {
    let clients = Object.entries(CLIENT_MAP).map(([id, data]) => ({ Id: parseInt(id), Nombre: data.Nombre, Telefono: data.Telefono }));
    clients.sort((a, b) => b.Id - a.Id);
    if (all) return clients.slice(0, 15);
    if (!query) return [];
    let words = query.trim().toLowerCase().split(/\s+/);
    let results = clients.filter(c => {
        let n = (c.Nombre || '').toLowerCase();
        let t = (c.Telefono || '').toLowerCase();
        return words.every(w => n.includes(w) || t.includes(w));
    });
    return results.slice(0, 15);
}

export function setupClientSearch(inputId, selectId) {
    let input = document.getElementById(inputId);
    if (!input) return;
    input.removeAttribute('list');

    let dropdown = document.createElement('div');
    dropdown.id = inputId + '-dropdown';
    let bgColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#1f2937' : '#ffffff';
    dropdown.style.cssText = 'position:absolute;z-index:99999;background:' + bgColor + ';border:1px solid var(--border);border-radius:6px;max-height:200px;overflow-y:auto;width:100%;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);top:100%;';
    input.parentElement.style.position = 'relative';
    input.parentElement.style.overflow = 'visible';
    input.parentElement.style.zIndex = '100';

    let btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '▼';
    btn.style.cssText = 'position:absolute;right:1px;top:1px;bottom:1px;width:30px;background:transparent;border:none;cursor:pointer;color:var(--text-muted);font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;';
    input.parentElement.appendChild(btn);
    input.parentElement.appendChild(dropdown);
    input.style.paddingRight = '30px';

    function renderDropdown(results) {
        if (results.length === 0) {
            dropdown.innerHTML = '<div style="padding:8px;color:var(--text-muted);font-size:0.85em;">Sin resultados</div>';
        } else {
            dropdown.innerHTML = results.map(c =>
                '<div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.9em;" onmouseover="this.style.background=\'#f3f4f6\'" onmouseout="this.style.background=\'transparent\'" data-id="' + c.Id + '">' +
                cleanLabel(c.Nombre) + (c.Telefono ? ' <span style="color:var(--text-muted);font-size:0.8em;"> - ' + c.Telefono + '</span>' : '') + '</div>'
            ).join('');
        }
        dropdown.style.display = 'block';
        dropdown.querySelectorAll('[data-id]').forEach(el => {
            el.addEventListener('click', function (e) {
                e.stopPropagation();
                let id = this.dataset.id;
                let name = cleanLabel(results.find(c => c.Id == id)?.Nombre || '');
                input.value = name;
                let sel = document.getElementById(selectId);
                let opt = sel.querySelector('option[value="' + id + '"]');
                if (!opt) {
                    sel.innerHTML = '<option value="' + id + '" selected>' + name + '</option>';
                } else { opt.selected = true; }
                sel.value = id;
                dropdown.style.display = 'none';
                if (selectId === 'np-cliente' && window.updatePropiedadesSelect) window.updatePropiedadesSelect();
            });
        });
    }

    btn.addEventListener('click', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (dropdown.style.display === 'block') { dropdown.style.display = 'none'; return; }
        input.focus();
        let results = await searchClientsAPI('', true);
        renderDropdown(results);
    });

    let debounce = null;
    input.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(async () => {
            let q = input.value.trim();
            if (q.length < 2) { dropdown.style.display = 'none'; return; }
            let results = await searchClientsAPI(q);
            renderDropdown(results);
        }, 300);
    });

    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

export function syncClientSelect(input, selectId) {
    let name = input.value;
    let client = DATA.clientes.find(c => cleanLabel(c.Nombre) === name);
    if (client) {
        let sel = document.getElementById(selectId);
        let id = client.Id;
        let opt = sel.querySelector('option[value="' + id + '"]');
        if (!opt) {
            sel.innerHTML = '<option value="' + id + '" selected>' + cleanLabel(client.Nombre) + '</option>';
        } else { opt.selected = true; }
        sel.value = id;
        if (selectId === 'np-cliente' && window.updatePropiedadesSelect) window.updatePropiedadesSelect();
    }
}

// --- Filtro rápido ---
export function filterCli() {
    PAGING.clientes.page = 1;
    renderClientes();
}

export function filterSelectOptions(inputId, selectId) {
    let search = document.getElementById(inputId).value.toLowerCase();
    let select = document.getElementById(selectId);
    let options = select.options;
    for (let i = 0; i < options.length; i++) {
        let txt = options[i].text.toLowerCase();
        let show = txt.includes(search) || (i === 0 && options[i].value === "");
        options[i].style.display = show ? '' : 'none';
    }
}

// --- Panel lateral detalle ---
export function showClientDetail(id) {
    let c = DATA.clientes.find(x => x.Id === id);
    if (!c) return;
    let html = '<h2 style="margin-bottom:4px">' + cleanLabel(c.Nombre) + '</h2><span class="badge badge-enviado">' + cleanLabel(c.Tipo || 'Particular') + '</span>';
    html += '<div class="detail-section" style="margin-top:20px"><h4>Contacto</h4>';
    html += '<div class="detail-field"><span>Teléfono</span><span>' + (c.Telefono || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Mail</span><span>' + (c.Mail || '-') + '</span></div></div>';
    html += '<div class="detail-section"><h4>Información Fiscal</h4>';
    html += '<div class="detail-field"><span>CUIT/DNI</span><span>' + (c.CUIT_CUIL_DNI || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Cond. Fiscal</span><span>' + cleanLabel(c.Condicion_fiscal || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Tipo Factura</span><span>' + cleanLabel(c.Tipo_factura || '-') + '</span></div>';
    html += '<div class="detail-field"><span>Razón Social</span><span>' + cleanLabel(c.Razon_social || '-') + '</span></div></div>';
    document.getElementById('detail-content').innerHTML = html;
    document.getElementById('panel-cliente').classList.add('open');
}

// --- CRUD ---
export async function openNewCliente(clientData = null) {
    if (clientData && (clientData instanceof Event || typeof clientData !== 'object' || (!clientData.Id && !clientData.Nombre && !clientData.id))) {
        clientData = null;
    }
    document.getElementById('mc-title').textContent = clientData ? 'Editar Cliente' : 'Nuevo Cliente';
    let modal = document.getElementById('modal-cliente');
    modal.setAttribute('data-db-id', clientData ? (clientData.id || clientData.Id || '') : '');
    document.getElementById('nc-nombre').value = clientData ? (clientData.Nombre || '') : '';
    document.getElementById('nc-telefono').value = clientData ? (clientData.Telefono || '') : '';
    document.getElementById('nc-mail').value = clientData ? (clientData.Mail || '') : '';
    document.getElementById('nc-tipo').value = clientData ? (clientData.Tipo || 'Particular') : 'Particular';
    document.getElementById('nc-cond-fiscal').value = clientData ? (clientData.Condicion_fiscal || 'Consumidor Final') : 'Consumidor Final';
    document.getElementById('nc-cuit').value = clientData ? (clientData.CUIT_CUIL_DNI || '') : '';
    modal.classList.add('show');
}

export function closeModalCliente() {
    document.getElementById('modal-cliente').classList.remove('show');
}

export async function saveCliente() {
    let id = document.getElementById('modal-cliente').getAttribute('data-db-id');
    let rawPhone = document.getElementById('nc-telefono').value;
    let cleanPhone = rawPhone.replace(/\D/g, '');

    if (cleanPhone) {
        let existing = DATA.clientes.find(c => {
            let existingPhone = (c.Telefono || '').replace(/\D/g, '');
            let existingId = c.Id || c.id;
            return existingPhone === cleanPhone && existingId != id;
        });
        if (existing) {
            alert(`Ya existe un cliente con ese teléfono: ${existing.Nombre}. Verificá antes de continuar.`);
            return;
        }
    }

    let data = {
        Nombre: document.getElementById('nc-nombre').value,
        Telefono: document.getElementById('nc-telefono').value,
        Mail: document.getElementById('nc-mail').value,
        Tipo: document.getElementById('nc-tipo').value,
        Condicion_fiscal: document.getElementById('nc-cond-fiscal').value,
        CUIT_CUIL_DNI: document.getElementById('nc-cuit').value
    };

    if (!data.Nombre) { alert('El nombre es obligatorio'); return; }

    try {
        if (id) {
            await apiPatch(TBL.clientes, { id: id, ...data });
            CLIENT_MAP[id] = { Nombre: data.Nombre, Telefono: data.Telefono };
        } else {
            let result = await apiPost(TBL.clientes, data);
            let nId = result && (result.Id || result.id || (Array.isArray(result) && result[0] && (result[0].Id || result[0].id)));
            if (nId) CLIENT_MAP[nId] = { Nombre: data.Nombre, Telefono: data.Telefono };
        }
        DATA.clientes = await apiGet(TBL.clientes);
        renderClientes();
        closeModalCliente();
    } catch (e) {
        console.error(e);
        alert('Error al guardar cliente');
    }
}

export async function deleteCliente(id, name) {
    if (!confirm(`¿Eliminar cliente ${name}?`)) return;
    try {
        await apiDelete(TBL.clientes, id);
        DATA.clientes = await apiGet(TBL.clientes);
        renderClientes();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar cliente');
    }
}
