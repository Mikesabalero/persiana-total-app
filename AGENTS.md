# Persiana Total - Contexto del Proyecto

## Qué es
App web para gestión de presupuestos de persianas, cortinas y automatizaciones. Empresa ubicada en Santa Fe, Argentina.

## Stack
- Frontend: HTML/CSS/JS vanilla (index.html, styles.css, módulos ES6 nativos)
- Backend: NocoDB API REST en http://93.127.212.235:32770
- Servidor web: Nginx en Docker, sirve archivos desde /root/persiana-app/ en puerto 3000
- Auth: Header `xc-token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ`
- Base ID: pru2fsphj43juyr
- Auth usuarios: Firebase Auth (compat SDK desde CDN)

## Tablas NocoDB (16 tablas)
- Clientes - Nombre, Telefono, Email, Direccion, Tipo, CUIT_CUIL_DNI, Condicion_fiscal, Razon_social, Tipo_factura
- Propiedades - Nombre, Direccion, linked a Clientes y Zonas
- Productos (15) - Nombre, Tipo_producto, Material
- Componentes - Nombre, Tipo_componente, Costo_unitario, Moneda_costo, Margen_default, Alicuota_IVA_compra, Alicuota_IVA_venta, Proveedor
- Producto_Componentes (67) - templates de componentes por producto (tabla `prod_comp`)
- Presupuestos - Numero, Fecha, Estado, Subtotal_neto, IVA_21, IVA_105, Total_con_IVA, linked a Clientes, Zonas, Formas_Pago
- Presupuesto_Unidades - Ambiente, Ubicacion, Trabajo, linked a Presupuestos y Productos
- Presupuesto_Lineas - Cantidad, Precio_unitario, Subtotal, linked a Unidades y Componentes
- Categorias_Producto (5), Zonas (6), Formas_Pago (10), Tipo_Cambio, Servicios_Mantenimiento, Historial_Conversaciones, Anchos_Estandar_PVC, Historial_Aumentos

## Lógica de negocio
- Precios en USD se convierten con tipo de cambio de tabla Tipo_Cambio
- Cada componente tiene Margen_default que se aplica al costo
- IVA 21% o 10.5% según componente
- Presupuesto = suma de unidades, cada unidad tiene líneas (componentes)

## Diseño
- Degradé sidebar: #3E5D68 → #12BAA8
- Font: Montserrat
- Colores: oscuro para sidebar, claro para contenido

## Deploy
- Archivos en servidor: /root/persiana-app/
- Después de push a GitHub, ejecutar en servidor: cd /root/persiana-app && git pull
- App visible en: http://93.127.212.235:3000

## Reglas
- NO mostrar costos, márgenes, moneda ni IVA compra/venta al usuario final (están ocultos con clase hide-margin)
- Precios se muestran ya calculados en ARS con margen incluido
- El campo Margen_default se toma de NocoDB, no se edita en la app

---

# Estado de la refactorización ES6 (actualizado 2026-03-14, sesion 2)

> Branch: `claude/awesome-kilby`
> Worktree: `.claude/worktrees/awesome-kilby`

## Fases completadas: 1–5 de 6

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Infraestructura de módulos ES6 | Completa |
| 2 | Extraer capa core (state, api, auth, ui, router) | Completa |
| 3 | Extraer módulos simples (dashboard, geo, chatbot, config) | Completa |
| 4 | Extraer módulos de datos (clientes, propiedades, precios) | Completa |
| 5 | Extraer presupuestos + motor dinámico BOM | Completa (bugs corregidos post-testeo) |
| 6 | Limpieza final y eliminación de app.js | **PENDIENTE** |

---

## Arquitectura de archivos

```
index.html
  <script type="module" src="js/main.js">    <- carga todos los módulos
  <script type="module" src="app.js">         <- legacy: solo overlay listeners (31 líneas)

js/
  main.js (255 líneas) <- hub de imports + window.* exposures
  core/
    api.js        <- apiGet, apiGetAll, apiGetPaged, apiGetLinks, apiPost, apiPatch, apiDelete, apiLink, loadClientMap
    auth.js       <- Firebase Auth (compat SDK CDN), initAuth, loginUser, logoutUser
    config.js     <- API url, token, TBL (IDs tablas NocoDB), categorías, constantes
    notify.js     <- showNotification
    router.js     <- ensureData (lazy loading), showPage, reloadAllData, paginación
    state.js      <- DATA, PAGING, CLIENT_MAP, editPresId, unidadCount, setters
    ui.js         <- fmt, cleanLabel, badgeHtml, resolveLink, resolveName, modals, pagination
  modules/
    chatbot.js
    dashboard.js
    geo.js
    clientes/
      clientes.js    <- renderClientes, saveCliente, setupClientSearch, searchClientsAPI
      detail.js      <- viewCliente
    propiedades/
      propiedades.js <- renderPropiedades, savePropiedad
    precios/
      precios.js     <- loadPrecios, saveComponente, openModalEditComp
      aumentos.js    <- aplicarAumento
    presupuestos/
      list.js        <- loadPresupuestos, filterPresupuestos, changeStatus, duplicatePresupuesto, deletePresupuesto
      form.js        <- openNewPres, addUnidad, addUnidadUI, removeUnidad, duplicateUnidad, addCompRow, addCompRowWithData, compSelected, recalcUnidad, recalcTraslado, recalcTotal, selects helpers
      save.js        <- savePres (crear/editar presupuesto + unidades + líneas)
      view.js        <- fetchBudgetDeepData, viewPresupuesto
      pdf.js         <- generarPDF (usa html2pdf.js)
      components-engine.js <- getCategoria, selectMotor, autoLoadComponents
    config/
      config-main.js
      zonas.js
      anchos.js
      formas-pago.js
      empresa.js
```

---

## Patrón de exposición global

Las funciones se exportan en los módulos y se exponen en `window.*` desde `main.js` para que los `onclick` inline del HTML las encuentren:

```js
// En el módulo:
export function openNewPres(...) { ... }

// En main.js:
import { openNewPres } from './modules/presupuestos/form.js';
window.openNewPres = openNewPres;
```

**REGLA CRITICA**: Toda función referenciada en `onclick="..."` de index.html DEBE estar en `window.*`.

---

## Archivos creados en Fase 5

| Archivo | Descripción |
|---------|-------------|
| `js/modules/presupuestos/list.js` | Listado, filtrado, cambio estado, duplicar, eliminar |
| `js/modules/presupuestos/form.js` | Formulario completo (abrir, unidades, componentes, recalc) |
| `js/modules/presupuestos/save.js` | Guardar presupuesto (crear/editar con unidades y líneas) |
| `js/modules/presupuestos/view.js` | Vista readonly + fetchBudgetDeepData |
| `js/modules/presupuestos/pdf.js` | Generación PDF con html2pdf.js (base64 inline del footer) |
| `js/modules/presupuestos/components-engine.js` | Motor auto-carga componentes (PROD_COMP_MAP eliminado, usa DATA.prod_comp dinámico) |

## Archivos modificados en Fase 5

| Archivo | Cambios |
|---------|---------|
| `js/main.js` | Agregados imports + window.* para todos los módulos de presupuestos |
| `app.js` | Reducido de ~1628 a 31 líneas (solo modal overlay listeners) |
| `js/core/router.js` | `ensureData('presupuestos')` carga `prod_comp` en paralelo |
| `js/core/state.js` | Agregado `DATA.prod_comp` al objeto de estado |

## Bugs corregidos post-testeo Fase 5

1. **Cliente se deselecciona al editar**: `setupClientSearch` ya no se ejecuta en modo edición; campos `disabled + pointer-events:none`; botón dropdown oculto.

2. **Presupuesto nuevo no aparece en lista**: Removidos campos link del POST body (NocoDB v2 no los soporta inline); reset `PAGING.presupuestos.page = 1`; `await showPage(...)`.

3. **Modal extremadamente lento**: `Promise.all` para cargas paralelas en openNewPres; cache de datalist de componentes (`getCompOpts()`); eliminación de `innerHTML +=` en loops.

4. **Propiedad/Zona editables en edición**: `np-propiedad.disabled = true`, `np-zona.disabled = true`; valores originales en `data-original-*` attributes para save.js.

---

## Pendientes

### Fase 6: Limpieza final
- [ ] Mover los 31 líneas de modal overlay listeners de `app.js` a `main.js`
- [ ] Eliminar `app.js` y su `<script>` de `index.html`
- [ ] Revisar imports muertos en main.js
- [ ] Verificar que no queden funciones duplicadas

### Funcional (pausado por el usuario)
- [ ] **Testear lógica matemática de `components-engine.js`** — El motor fue extraído con `PROD_COMP_MAP` reemplazado por lookup dinámico a `DATA.prod_comp` (tabla `Producto_Componentes`). El usuario pausó la verificación para enfocarse en bugs de UI/save.
- [ ] **Inconsistencia precio unitario web vs PDF** — Se aplicó fix (commit `39e0f3e`) pero no fue re-testeado por el usuario.

---

## Advertencias criticas para continuar

### 1. NocoDB v2 Link Fields
Los links NO se crean en el body del POST. Siempre usar endpoint separado:
```js
await apiLink(tableId, columnId, rowId, [{ Id: linkedRowId }]);
```
Los column IDs de links estan hardcodeados en save.js, list.js, view.js. Si NocoDB regenera IDs, actualizarlos.

### 2. Formulas matematicas (NO TOCAR SIN TESTEAR)
- `recalcUnidad(n)` en form.js: `costoArs * (1 + pctArmado/100) * (1 + margen/100)` + IVA + instalacion %
- `recalcTotal()`: suma subtotales de unidades + traslado
- `savePres()` en save.js: `precioUnit = costoArs * (1 + margen/100)` (pctArmado ya incluido en costo mostrado)

### 3. Estado mutable compartido
state.js exporta variables con setters obligatorios:
```js
import { editPresId, setEditPresId } from '../../core/state.js';
// editPresId es read-only import, usar setEditPresId() para modificar
```

### 4. Orden de carga HTML
index.html tiene dos scripts module: main.js primero, app.js segundo. Si se elimina app.js (Fase 6), mover sus listeners a main.js.

### 5. IDs hardcodeados de componentes
`components-engine.js` tiene IDs de componentes hardcodeados (motores: 50-56, 58; cintas: 60-63; ejes: 115, 120-122; etc.). Si cambian en NocoDB, el motor se rompe.

### 6. Tabla prod_comp
`Producto_Componentes` (ID: `mmjzqw7v4que9q3`) se carga en `ensureData('presupuestos')` y se almacena en `DATA.prod_comp`. Es usada por `components-engine.js` para el lookup dinamico Producto -> Componentes.

---

## Commits de esta sesion (branch claude/awesome-kilby, pusheados a origin)

```
b783aa7 refactor: Fase 4 completa - extraer módulos de datos (clientes, propiedades, precios)
63fe545 refactor: Fase 5 - extraer módulos de presupuestos + motor dinámico BOM
39e0f3e fix: unificar cálculo de Precio unidad entre vista web y PDF
f5e2258 fix(presupuestos): preserve client/property selection in edit mode
73b2168 fix(presupuestos): fully block client change in edit mode
1d3649d perf(presupuestos): parallelize data loading in openNewPres
b26712c perf(presupuestos): eliminate DOM thrashing in modal open
6248e28 fix(presupuestos): fix save not showing in list + edit field safety
d9889ab docs: actualizar AGENTS.md con estado completo de refactorización
```

### Resumen de lo hecho en esta sesion

1. **Fase 4 completada**: Extraccion de modulos clientes, propiedades, precios y aumentos
2. **Fase 5 completada**: Extraccion completa de presupuestos en 6 modulos (list, form, save, view, pdf, components-engine)
3. **PROD_COMP_MAP eliminado**: Reemplazado por lookup dinamico a `DATA.prod_comp` (tabla Producto_Componentes de NocoDB)
4. **app.js reducido de ~1628 a 31 lineas** (solo modal overlay listeners)
5. **4 bugs criticos corregidos post-testeo**:
   - Cliente se deselecciona al editar presupuesto
   - Presupuesto nuevo no aparece en lista despues de guardar
   - Modal de presupuesto extremadamente lento al abrir
   - Propiedad/Zona editables cuando deberian estar bloqueados en edicion
6. **Optimizaciones de rendimiento**: Promise.all para cargas paralelas, cache de datalist, eliminacion de innerHTML += en loops

### Archivos que requieren atencion del usuario (testeo pendiente)

- `js/modules/presupuestos/save.js` — El usuario reporto que "no se guarda". Se corrigio removiendo link fields del POST body y reseteando paginacion. **Necesita re-testeo**.
- `js/modules/presupuestos/form.js` — Cliente/propiedad bloqueados en edicion. **Necesita re-testeo**.
- `js/modules/presupuestos/components-engine.js` — Logica matematica de auto-carga de componentes. **Usuario pidio pausar la verificacion**.
- `js/modules/presupuestos/pdf.js` — Inconsistencia precio unitario web vs PDF. **Se aplico fix pero no fue re-testeado**.

---

## Como testear

1. Servir con server HTTP estatico (`python -m http.server 8080`, Live Server, etc.)
2. Login con Firebase Auth
3. Presupuestos -> "Nuevo Presupuesto" -> verificar velocidad de apertura
4. Seleccionar cliente, propiedad, producto -> verificar auto-carga de componentes
5. Guardar -> verificar que aparece en la lista
6. Abrir presupuesto existente -> Editar -> verificar cliente/propiedad bloqueados
7. Generar PDF -> comparar montos con vista web
