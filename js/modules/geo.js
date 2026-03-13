// ============================================================
// geo.js — Geocodificación y asignación automática de zonas
// ============================================================

import { DATA } from '../core/state.js';

let _lastGeoTime = 0;

export async function geocodificarDireccion(direccion, localidad) {
    try {
        let now = Date.now();
        let wait = 1000 - (now - _lastGeoTime);
        if (wait > 0) await new Promise(r => setTimeout(r, wait));
        _lastGeoTime = Date.now();
        let q = encodeURIComponent(`${direccion}, ${localidad}, Santa Fe, Argentina`);
        let resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&viewbox=-61.05,-31.35,-60.45,-32.05&bounded=1`, {
            headers: { 'User-Agent': 'PersianaTotal-ERP/1.0' }
        });
        let data = await resp.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        return null;
    } catch (e) { console.error('Geocodificación error:', e); return null; }
}

export function _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function asignarZonaAutomatica(lat, lon) {
    let zonasConDist = [];
    for (let z of DATA.zonas) {
        if (z.Activo === false || z.Activo === 'false' || z.Activo === 0) continue;
        if (!z.Lat_centro || !z.Lon_centro) continue;
        let dist = _haversineKm(lat, lon, z.Lat_centro, z.Lon_centro);
        zonasConDist.push({ zona: z, dist: dist });
    }
    let internas = zonasConDist.filter(zd => zd.zona.Radio_km && zd.zona.Radio_km > 0 && zd.dist <= zd.zona.Radio_km);
    if (internas.length > 0) {
        internas.sort((a, b) => a.dist - b.dist);
        return internas[0].zona;
    }
    if (zonasConDist.length > 0) {
        zonasConDist.sort((a, b) => a.dist - b.dist);
        return zonasConDist[0].zona;
    }
    return null;
}

export async function autoDetectarZonaProp() {
    let direccion = document.getElementById('np-prop-direccion')?.value;
    let locSelect = document.getElementById('np-prop-localidad');
    let localidad = locSelect?.value;
    let autoBtn = document.getElementById('btn-autozona-prop');
    console.log('autoDetectarZonaProp → DIR:', direccion, 'LOC:', localidad, 'LOC_IDX:', locSelect?.selectedIndex, 'LOC_OPTS:', locSelect?.options?.length);
    if (!direccion || !localidad) {
        alert(!direccion ? 'Completá la dirección primero.' : 'Seleccioná la localidad primero.');
        return;
    }
    let zonaSelect = document.getElementById('prop-zona');
    if (localidad !== 'Santa Fe') {
        let zone = DATA.zonas.find(z => z.Nombre === localidad);
        if (zone && zonaSelect) {
            zonaSelect.value = zone.Id || zone.id;
            alert(`Zona detectada: ${zone.Nombre}`);
        } else {
            alert('No se encontró una zona exacta automáticamente para esta localidad.');
        }
        return;
    }

    if (autoBtn) { autoBtn.textContent = '⏳ Detectando...'; autoBtn.disabled = true; }
    let coords = await geocodificarDireccion(direccion, "Santa Fe");
    if (!coords) {
        let fallbackZone = DATA.zonas.find(z => z.Nombre === 'Zona Centro');
        if (fallbackZone && zonaSelect) {
            zonaSelect.value = fallbackZone.Id || fallbackZone.id;
            alert('No se encontró la dirección exacta. Se asignó Zona Centro por defecto. Podés cambiarla manualmente.');
        } else {
            alert('No se pudo geocodificar la dirección. Seleccioná la zona manualmente.');
        }
        if (autoBtn) { autoBtn.textContent = '📍 Auto-detectar zona'; autoBtn.disabled = false; }
        return;
    }
    let autoZona = asignarZonaAutomatica(coords.lat, coords.lon);
    if (autoZona && zonaSelect) {
        zonaSelect.value = autoZona.Id || autoZona.id;
        alert(`Zona detectada: ${autoZona.Nombre}`);
    } else {
        alert('No se encontró una zona cercana.');
    }
    if (autoBtn) { autoBtn.textContent = '📍 Auto-detectar zona'; autoBtn.disabled = false; }
}
