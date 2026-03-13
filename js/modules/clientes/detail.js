// ============================================================
// detail.js — Vista detalle de cliente (modal ver cliente)
// ============================================================

import { DATA } from '../../core/state.js';
import { TBL } from '../../core/config.js';
import { apiGet } from '../../core/api.js';
import { fmt, cleanLabel, badgeHtml, resolveLink, resolveName, closeVerCliente } from '../../core/ui.js';
import { CLIENT_MAP } from '../../core/state.js';

export async function viewCliente(clientId) {
    let c = DATA.clientes.find(x => x.Id == clientId);
    if (!c) {
        try {
            c = await apiGet(`${TBL.clientes}/${clientId}`);
            if (c && c.Id) DATA.clientes.push(c);
        } catch(e) { console.error('Fetch client error', e); }
    }
    // Fallback if API fails but it's in CLIENT_MAP
    if (!c && CLIENT_MAP[clientId]) {
        c = { Id: clientId, Nombre: CLIENT_MAP[clientId].Nombre, Telefono: CLIENT_MAP[clientId].Telefono };
    }
    if (!c) {
        alert("No se pudo cargar la información del cliente.");
        return;
    }

    document.getElementById('vc-nombre').textContent = cleanLabel(c.Nombre);
    document.getElementById('vc-telefono').textContent = c.Telefono || '-';
    document.getElementById('vc-mail').textContent = c.Mail || '-';
    document.getElementById('vc-tipo').textContent = cleanLabel(c.Tipo || '-');
    document.getElementById('vc-fiscal').textContent = cleanLabel(c.Condicion_fiscal || '-');
    document.getElementById('vc-documento').textContent = c.CUIT_CUIL_DNI || '-';

    let props = DATA.propiedades.filter(p => {
        let link = resolveLink(p, 'Clientes');
        return (link && (link.Id == clientId || link.id == clientId)) || (p.Clientes_id == clientId);
    });

    if (props.length === 0) {
        try {
            let fetched = await apiGet(TBL.propiedades, `&where=(Clientes_id,eq,${clientId})`);
            if (fetched && fetched.length > 0) {
                fetched.forEach(f => {
                    if (!DATA.propiedades.find(x => x.Id == f.Id)) DATA.propiedades.push(f);
                });
                props = fetched;
            }
        } catch(e) { console.warn("Could not fetch additional properties", e); }
    }

    let tb = document.getElementById('vc-prop-table');
    tb.innerHTML = '';
    if (props.length > 0) {
        document.getElementById('vc-no-prop').style.display = 'none';
        props.forEach(p => {
            let principal = p.Principal ? '✅ Sí' : 'No';
            let zonaName = '-';
            if (p.Zona_id) { let z = DATA.zonas.find(z => z.Id == p.Zona_id); if (z) zonaName = cleanLabel(z.Nombre); }
            tb.innerHTML += `<tr>
                <td><strong>${cleanLabel(p.Nombre || '-')}</strong></td>
                <td>${p.Direccion || '-'}</td>
                <td>${p.Localidad || '-'}</td>
                <td>${zonaName}</td>
                <td>${cleanLabel(p.Tipo_Propiedad || p.Tipo_Propiedad_ || p.Tipo || '-')}</td>
                <td>${principal}</td>
                <td>${p.Telefono || '-'}</td>
            </tr>`;
        });
    } else {
        document.getElementById('vc-no-prop').style.display = 'block';
    }

    document.getElementById('vc-btn-nueva-prop').onclick = () => {
        let modalProp = document.getElementById('modal-propiedad');
        modalProp.setAttribute('data-reopen-client-id', clientId);
        closeVerCliente();
        if (window.openNewPropiedad) window.openNewPropiedad(null, clientId, true);
    };

    document.getElementById('modal-ver-cliente').classList.add('show');

    // Historial de Presupuestos
    let clientPres = DATA.presupuestos.filter(p => p._clienteId == clientId);


    // Ordenar por fecha descendente
    clientPres.sort((a, b) => {
        let dateA = new Date(a.Fecha || 0);
        let dateB = new Date(b.Fecha || 0);
        return dateB - dateA;
    });

    let tp = document.getElementById('vc-pres-table');
    tp.innerHTML = '';
    if (clientPres.length > 0) {
        document.getElementById('vc-no-pres').style.display = 'none';
        clientPres.forEach(p => {
            let id = p.Id || p.id;
            let addr = p._propiedadDir;
            if (!addr || addr === '-') {
                let pr = resolveLink(p, 'Propiedades');
                if (pr) {
                    let pfull = DATA.propiedades.find(x => x.Id == (pr.Id || pr.id));
                    if (pfull) addr = (pfull.Direccion || '-') + ' - ' + (pfull.Localidad || '-');
                }
            }
            if (!addr) addr = '-';
            tp.innerHTML += `<tr>
                <td><strong>${p.Numero || '-'}</strong></td>
                <td>${p.Fecha || '-'}</td>
                <td>${addr}</td>
                <td><strong>${fmt(p.Total_con_IVA || p.Total)}</strong></td>
                <td>${badgeHtml(p.Estado || 'Borrador')}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="closeVerCliente(); viewPresupuesto(${id})">Ver</button>
                </td>
            </tr>`;
        });
    } else {
        document.getElementById('vc-no-pres').style.display = 'block';
    }

    document.getElementById('modal-ver-cliente').classList.add('show');
}
