// ============================================================
// propiedades.js — Listado, CRUD de propiedades
// ============================================================

import { DATA, PAGING } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet, apiGetAll, apiGetPaged, apiPost, apiPatch, apiDelete } from '../../core/api.js';
import { cleanLabel, resolveLink, resolveName, renderPagination, _showPageSpinner } from '../../core/ui.js';

// --- Listado paginado ---
export async function renderPropiedades() {
    _showPageSpinner('propiedades', true);
    let search = document.getElementById('prop-search')?.value || '';
    let extra = '&sort=-CreatedAt';
    if(search) extra += `&where=(Nombre,like,%${search}%)`;

    let res = await apiGetPaged(TBL.propiedades, PAGING.propiedades.page, extra);
    DATA.propiedades = res.list;
    PAGING.propiedades.total = res.total;

    let tb = document.getElementById('prop-table');
    if (!tb) return;
    tb.innerHTML = '';
    DATA.propiedades.forEach(p => {
        let cliName = resolveName(p, 'Clientes', DATA.clientes);
        let principal = p.Principal ? '✅ Sí' : 'No';
        let zonaName = '-';
        if (p.Zona_id) { let z = DATA.zonas.find(z => z.Id == p.Zona_id); if (z) zonaName = cleanLabel(z.Nombre); }
        tb.innerHTML += `<tr>
            <td><strong>${cleanLabel(p.Nombre)}</strong></td>
            <td>${p.Direccion || '-'}</td>
            <td>${p.Localidad || '-'}</td>
            <td>${zonaName}</td>
            <td><a href="#" onclick="viewCliente(${resolveLink(p, 'Clientes')?.Id || 0}); return false;" style="color:var(--grad1);text-decoration:none;font-weight:600">${cliName}</a></td>
            <td>${p.Telefono || '-'}</td>
            <td>${cleanLabel(p.Tipo_Propiedad || p.Tipo_Propiedad_ || p.Tipo || '-')}</td>
            <td>${principal}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-remove" onclick="openNewPropiedad(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Editar" style="background:#f3f4f6;color:var(--text)">✏️</button>
                    <button class="btn-remove" onclick="deletePropiedad(${p.id || p.Id}, '${(p.Nombre||'').replace(/'/g, "\\'")}')" title="Eliminar" style="color:var(--danger)">🗑</button>
                </div>
            </td>
        </tr>`;
    });
    renderPagination('pag-propiedades', PAGING.propiedades, 'propiedades');
    _showPageSpinner('propiedades', false);
}

// --- Filtro rápido ---
export function filterPropiedades() {
    PAGING.propiedades.page = 1;
    renderPropiedades();
}

// --- CRUD ---
export async function openNewPropiedad(propData = null, preselectedClientId = null, forceDisableClient = false) {
    document.getElementById('mp-title').textContent = propData ? 'Editar Propiedad' : 'Nueva Propiedad';
    let modal = document.getElementById('modal-propiedad');
    modal.setAttribute('data-db-id', propData ? (propData.id || propData.Id) : '');

    // Llenar select de clientes
    let cs = document.getElementById('np-prop-cliente');
    cs.innerHTML = '<option value="">Seleccionar cliente...</option>';
    let selectedClientId = preselectedClientId;
    if (propData) {
        let link = resolveLink(propData, 'Clientes');
        if (link) selectedClientId = link.Id || link.id;
    }

    DATA.clientes.forEach(c => {
        let sel = (selectedClientId == c.Id) ? 'selected' : '';
        cs.innerHTML += `<option value="${c.Id}" ${sel}>${cleanLabel(c.Nombre)}</option>`;
    });

    // Deshabilitar/Habilitar según corresponda
    let forceDisabled = forceDisableClient || (propData && propData.Id ? true : false);
    cs.disabled = forceDisabled;
    let si = document.getElementById('np-prop-cliente-search');
    if (si) si.disabled = forceDisabled;

    document.getElementById('np-prop-nombre').value = propData ? propData.Nombre : '';
    document.getElementById('np-prop-direccion').value = propData ? propData.Direccion || '' : '';
    document.getElementById('np-prop-telefono').value = propData ? propData.Telefono || '' : '';
    document.getElementById('np-prop-tipo').value = propData ? (propData.Tipo_Propiedad || propData.Tipo_Propiedad_ || 'Casa') : 'Casa';
    document.getElementById('np-prop-inquilino').value = propData ? propData.Contacto_Inquilino || '' : '';
    document.getElementById('np-prop-maps').value = propData ? propData.Ubicacion_Maps || propData.Ubicacion_Maps_ || '' : '';
    document.getElementById('np-prop-horario').value = propData ? propData.Horario_Disponible || propData.Horario_Disponible_ || '' : '';
    document.getElementById('np-prop-principal').checked = propData ? !!propData.Principal : false;

    // Poblar select de Localidad
    let sloc = document.getElementById('np-prop-localidad');
    sloc.innerHTML = '<option value="">Seleccionar localidad...</option>';
    let localies = new Set();
    DATA.zonas.forEach(z => {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) return;
        if (z.Radio_km > 0) localies.add('Santa Fe');
        else localies.add(z.Nombre);
    });
    [...localies].sort().forEach(loc => {
        let sel = (propData && propData.Localidad === loc) ? 'selected' : '';
        sloc.innerHTML += `<option value="${loc}" ${sel}>${cleanLabel(loc)}</option>`;
    });
    sloc.innerHTML += `<option value="Otra" ${(propData && propData.Localidad === 'Otra') ? 'selected' : ''}>Otra</option>`;

    // Poblar select de Zona asignada
    let pz = document.getElementById('prop-zona');
    pz.innerHTML = '<option value="">Seleccionar zona...</option>';
    DATA.zonas.forEach(z => {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) return;
        let sel = (propData && propData.Zona_id == (z.Id || z.id)) ? 'selected' : '';
        pz.innerHTML += `<option value="${z.Id || z.id}" ${sel}>${cleanLabel(z.Nombre)}</option>`;
    });

    // Sincronizar buscador de clientes
    if (si) {
        if (propData) {
            si.value = resolveName(propData, 'Clientes', DATA.clientes);
        } else if (preselectedClientId) {
            let client = DATA.clientes.find(c => c.Id == preselectedClientId);
            si.value = client ? cleanLabel(client.Nombre) : '';
        } else {
            si.value = '';
        }
    }

    modal.classList.add('show');
}

export function closeModalPropiedad() {
    let modal = document.getElementById('modal-propiedad');
    let reopenId = modal.getAttribute('data-reopen-client-id');
    modal.classList.remove('show');
    // Restaurar campos habilitados
    document.getElementById('np-prop-cliente').disabled = false;
    let si = document.getElementById('np-prop-cliente-search');
    if (si) si.disabled = false;

    if (reopenId) {
        modal.removeAttribute('data-reopen-client-id');
        if (window.viewCliente) window.viewCliente(reopenId);
    }
}

export async function savePropiedad() {
    let id = document.getElementById('modal-propiedad').getAttribute('data-db-id');
    let cliId = document.getElementById('np-prop-cliente').value;

    if (!cliId) { alert('Debe seleccionar un cliente'); return; }

    // Si es la primera propiedad del cliente, marcar como principal automáticamente
    let clientProps = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return link && (link.Id == cliId || link.id == cliId);
    });

    let isPrincipal = document.getElementById('np-prop-principal').checked;
    if (!id && clientProps.length === 0) isPrincipal = true;

    let data = {
        Nombre: document.getElementById('np-prop-nombre').value,
        Direccion: document.getElementById('np-prop-direccion').value,
        Localidad: document.getElementById('np-prop-localidad').value,
        Telefono: document.getElementById('np-prop-telefono').value,
        Tipo_Propiedad: document.getElementById('np-prop-tipo').value,
        Contacto_Inquilino: document.getElementById('np-prop-inquilino').value,
        Ubicacion_Maps: document.getElementById('np-prop-maps').value,
        Horario_Disponible: document.getElementById('np-prop-horario').value,
        Principal: isPrincipal,
        Clientes_id: parseInt(cliId),
        Zona_id: parseInt(document.getElementById('prop-zona').value) || null
    };

    if (!data.Nombre) { alert('El nombre es obligatorio'); return; }

    try {
        let savedRes;
        if (id) {
            savedRes = await apiPatch(TBL.propiedades, { id: id, ...data });
        } else {
            savedRes = await apiPost(TBL.propiedades, data);
        }
        let savedId = id || savedRes.Id || savedRes.id;

        // Si esta es principal, quitar principal a las otras del mismo cliente
        if (data.Principal) {
            let others = DATA.propiedades.filter(p => {
                let link = resolveLink(p, 'Clientes');
                let sameCli = link && (link.Id == cliId || link.id == cliId);
                let pId = p.Id || p.id;
                return sameCli && pId != savedId && p.Principal;
            });
            for (let other of others) {
                await apiPatch(TBL.propiedades, { id: other.Id || other.id, Principal: false });
            }
        }

        DATA.propiedades = await apiGetAll(TBL.propiedades);
        renderPropiedades();
        closeModalPropiedad();
        // Si el panel de cliente está abierto, actualizarlo
        let panel = document.getElementById('panel-cliente');
        if (panel.classList.contains('open')) {
            if (window.showClientDetail) window.showClientDetail(parseInt(cliId));
        }
        // Si el modal de ficha cliente está abierto, actualizarlo
        let modalVer = document.getElementById('modal-ver-cliente');
        if (modalVer.classList.contains('show')) {
            if (window.viewCliente) window.viewCliente(parseInt(cliId));
        }
    } catch (e) {
        console.error(e);
        alert('Error al guardar propiedad');
    }
}

export async function deletePropiedad(id, name) {
    if (!confirm(`¿Eliminar propiedad ${name}?`)) return;
    try {
        await apiDelete(TBL.propiedades, id);
        DATA.propiedades = await apiGetAll(TBL.propiedades);
        renderPropiedades();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar propiedad');
    }
}
