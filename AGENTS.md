# Persiana Total - Contexto del Proyecto

## Reglas de Git — SIEMPRE respetar

### Ramas activas
| Rama | Propósito |
|------|-----------|
| `main` | Producción. Solo código listo y probado. NUNCA desarrollar acá. |
| `feature/crm` | Módulo CRM en desarrollo. Mergeará a main cuando esté listo. |

### Regla de oro
- Todo módulo nuevo o feature importante → crear rama `feature/nombre`
- `main` solo recibe merges de ramas terminadas y probadas
- Deploy a producción = push a main + git pull en servidor

### Cómo crear un módulo nuevo (para Claude)
1. `git checkout main && git pull` — asegurarse de partir de main actualizado
2. `git checkout -b feature/nombre-modulo` — crear rama nueva
3. Desarrollar y commitear en esa rama libremente
4. Cuando esté listo y probado: `git checkout main && git merge feature/nombre-modulo && git push`
5. Avisar al usuario que haga `git pull` en el servidor

### Lo que NO hacer
- NUNCA commitear features nuevas directamente en `main`
- NUNCA hacer merge a main sin que el usuario confirme que está listo para producción
- NUNCA mezclar en un mismo commit cambios de producción con features en desarrollo

---

## Qué es
App web para gestión de presupuestos de persianas, cortinas y automatizaciones. Empresa ubicada en Santa Fe, Argentina.

## Stack
- Frontend: HTML/CSS/JS vanilla (index.html, styles.css, app.js)
- Backend: NocoDB API REST en http://93.127.212.235:32770
- Servidor web: Nginx en Docker, sirve archivos desde /root/persiana-app/ en puerto 3000
- Auth: Header `xc-token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ`
- Base ID: pru2fsphj43juyr

## Tablas NocoDB (15 tablas)
- Clientes (9 registros) - Nombre, Telefono, Email, Direccion, Tipo, CUIT_CUIL_DNI, Condicion_fiscal, Razon_social, Tipo_factura
- Propiedades (10) - Nombre (igual a Direccion, se asigna automáticamente), Direccion, linked a Clientes y Zonas
- Productos (15) - Nombre, Tipo_producto, Material
- Componentes (32) - Nombre, Tipo_componente, Costo_unitario, Moneda_costo, Margen_default, Alicuota_IVA_compra, Alicuota_IVA_venta, Proveedor
- Producto_Componentes (67) - templates de componentes por producto
- Presupuestos - Numero, Fecha, Estado, Subtotal_neto, IVA_21, IVA_105, Total_con_IVA, linked a Clientes, Zonas, Formas_Pago
- Presupuesto_Unidades - Ambiente, Ubicacion, Trabajo, linked a Presupuestos y Productos
- Presupuesto_Lineas - Cantidad, Precio_unitario, Subtotal, linked a Unidades y Componentes
- Categorias_Producto (5), Zonas (6) - nombres actuales: "Santa Fe", "Zona Norte", "Sauce Viejo", "Santo Tomé", "Recreo", "Otra"; Formas_Pago (10), Tipo_Cambio, Servicios_Mantenimiento, Historial_Conversaciones, Anchos_Estandar_PVC

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

## Formulario de Propiedades (modal-propiedad)
- Campos visibles: Cliente, Dirección, Localidad, Teléfono, Tipo Propiedad, Contacto Inquilino, Ubicación Maps, Horario Disponible, Es dirección principal
- Campo "Nombre" eliminado del formulario; se asigna automáticamente igual a Dirección en savePropiedad
- Campo "Zona asignada" eliminado del formulario; reemplazado por `<input type="hidden" id="prop-zona">`
- La zona se asigna automáticamente al elegir Localidad: busca en DATA.zonas la zona cuyo Nombre coincida con la localidad elegida y guarda su Id en el hidden input
- Zona_id se persiste en NocoDB al guardar la propiedad

## Cambios de esquema NocoDB

### 2026-04-06 — Campos _id simples en Presupuestos (refactor v2)
- **Problema de raíz:** Los links HasMany de NocoDB (Presupuestos→Clientes, →Zonas, →Propiedades) almacenan el FK en la tabla hija. Vincular un cliente a un presupuesto nuevo desvinculaba al anterior. Además, `_resolvePresupuestoLinks()` hacía 60+ HTTP requests por página.
- **Solución:** Se agregaron campos Number simples `Cliente_id`, `Zona_id`, `Propiedad_id` en tabla Presupuestos como **fuente de verdad**. Los links LTAR se mantienen para compatibilidad con NocoDB UI pero el frontend ya no los usa para resolver nombres.
- **Migración:** `scripts/migrate_ids.js` recorrió los 29 presupuestos existentes y pobló los campos _id desde apiGetLinks. 16 migrados, 13 sin datos recuperables.
- **Funciones reescritas:** `_resolvePresupuestoLinks()` (0 HTTP), `_savePresInner()` (guarda _id + apiLink), `duplicatePresupuesto()` (copia _id), `fetchBudgetDeepData()` (lookup local para cliente/zona/propiedad).
- **Performance:** initApp pasó de freezear el navegador a cargar en ~2.5s.

### 2026-04-02 — Eliminación de Presupuestos_id en Propiedades
- **Problema:** Al crear un presupuesto nuevo para una propiedad que ya tenía uno, NocoDB borraba el presupuesto anterior por cascade delete (restricción HasOne inversa).
- **Causa:** La tabla Propiedades tenía un campo `Presupuestos_id` (ForeignKey, columna ID `ce6dgh4sodvmo3b`) y su columna virtual `Presupuestos` (LinkToAnotherRecord, columna ID `c9pkiok73yxowj5`).
- **Solución:** Se eliminó la columna `Presupuestos` (LinkToAnotherRecord) via `DELETE /api/v1/db/meta/columns/c9pkiok73yxowj5`. NocoDB también eliminó automáticamente la FK `Presupuestos_id`.
- **Impacto en app.js:** Ninguno. La app solo usa el link Presupuestos→Propiedades (column ID `cpf764utp1w7yj0` en tabla Presupuestos), que permanece intacto.
- **Verificación:** Los registros de Propiedades ya no incluyen los campos `Presupuestos_id` ni `Presupuestos`.

## Reglas
- NO mostrar costos, márgenes, moneda ni IVA compra/venta al usuario final (están ocultos con clase hide-margin)
- Precios se muestran ya calculados en ARS con margen incluido
- El campo Margen_default se toma de NocoDB, no se edita en la app
- No pedir al usuario que ingrese Nombre ni Zona en el formulario de propiedad — ambos se asignan automáticamente
- La fuente de verdad para cliente/zona/propiedad en Presupuestos son los campos Number simples (`Cliente_id`, `Zona_id`, `Propiedad_id`), NO los links HasMany LTAR
- Los apiLink se mantienen solo para compatibilidad con la interfaz web de NocoDB
- `_resolvePresupuestoLinks()` NO debe hacer HTTP requests — resuelve todo con CLIENT_MAP, DATA.zonas y DATA.propiedades en memoria

## Column IDs de relaciones (NocoDB v2)
- `canpten8owymbde` — Presupuestos ↔ Clientes
- `cr3s0ox51qopwl4` — Presupuestos ↔ Zonas
- `cpf764utp1w7yj0` — Presupuestos ↔ Propiedades
- `cr9l2n9wiubrcra` — Presupuestos ↔ Formas_Pago
- `cm5xv0vmlne7r6u` — Presupuestos ↔ Presupuesto_Unidades (funciona en ambas direcciones)
- `co1b5kwpl8d2rya` — Presupuesto_Unidades ↔ Productos
- `c4hnodnss6zlr32` — Presupuesto_Lineas ↔ Presupuestos
- `czka6po5myr5wu6` — Presupuesto_Lineas ↔ Componentes
- `cn9406tc3q1jmw0` — Presupuesto_Lineas ↔ Presupuesto_Unidades

## Fixes aplicados
- **2026-04-06 — Refactor presupuestos v2**: Reescritura de `_resolvePresupuestoLinks`, `_savePresInner`, `duplicatePresupuesto`, `fetchBudgetDeepData` para usar campos Number simples (`Cliente_id`, `Zona_id`, `Propiedad_id`) en vez de links LTAR. Elimina el bug de desvinculación de clientes y reduce HTTP requests de 60+ a 0 en la lista.
- **2026-04-02 — Revert fetchBudgetDeepData a resolveLink**: Se revirtió el patrón `apiGetLinks(TBL.presupuestos, 'cm5xv0vmlne7r6u', presId)` de vuelta a `apiGet(TBL.unidades)` + `resolveLink(u, 'Presupuestos')`. El apiGetLinks devolvía HTTP 400 porque NocoDB no permite usar ese column ID desde el lado de presupuestos → cero unidades mostradas en Ver/PDF. El campo `Presupuestos` sí está poblado en cada unidad, por lo que resolveLink funciona correctamente.
- **2026-04-01 — Fix delete presupuesto (unidades huérfanas)**: En `deletePresupuesto`, se reemplazó `DATA.unidades.filter(u => resolveLink(u, 'Presupuestos'))` por `apiGetLinks(TBL.presupuestos, 'cm5xv0vmlne7r6u', presId)` para encontrar las unidades a borrar. El patrón anterior podía dejar unidades y líneas huérfanas en la base.
- **2026-04-02 — Fix líneas no visibles por limit global**: En `fetchBudgetDeepData`, se reemplazó `apiGet(TBL.lineas)` (traía todas las líneas con limit=200 hardcodeado) por `apiGet(TBL.lineas, '&where=(Presupuestos_id,eq,${presId})')` para traer solo las líneas del presupuesto consultado. Las líneas de presupuestos nuevos no aparecían en Ver ni PDF porque la tabla superó los 200 registros.

## Fixes aplicados (2026-04-06)
- **Fix offline fallback sin Firebase token**: El `onAuthStateChanged` tenía un fallback (línea 116-123) que al encontrar credentials en localStorage pero sin `currentUser` de Firebase, inicializaba la app sin token. El proxy devolvía 401 en todas las API calls → tablas vacías. Fix: se elimina el fallback y se fuerza re-login. También se agregó guard en `initApp()` que aborta si `currentUser` es null y detecta 401/502 del proxy para forzar re-login.

## Bugs diagnosticados (2026-04-07)
- **Pintura Chapa precio incorrecto ($905k vs $65k)**: Causa raíz doble. (1) Dos componentes con nombre idéntico "Pintura Chapa" (Id 74 en USD, Id 187 en ARS). `compSelected` usa `DATA.componentes.find()` por nombre, que devuelve siempre el primero (Id 74, USD 368.73), no el que el usuario espera (Id 187, ARS 27000). El TC×costo da $534k base. (2) Bug de fallback `comp.Margen_default || 40`: cuando Margen_default es 0 (valor legítimo), JS lo trata como falsy y lo reemplaza por 40%. Afecta a compSelected (línea ~2607) y addCompRowWithData (línea ~2560). Combinados: 368.73×1450×1.4×1.21 = $905k. Fix: usuario eliminó el duplicado en NocoDB. El bug de código del fallback `|| 40` (debería ser `?? 40`) queda pendiente.

## Bugs corregidos (2026-04-01)
- _savePresInner: validación de Cliente/Zona se saltea en modo edición (editPresId existe) porque los selects están deshabilitados
- _savePresInner: después de crear presupuesto se incrementa PAGING.presupuestos.total para evitar números duplicados sin recargar

## Cambios de esquema NocoDB

### 2026-04-13 — Eliminación de Presupuestos_id en Propiedades
- **Problema:** Al crear un presupuesto nuevo para una propiedad que ya tenía uno, NocoDB borraba el presupuesto anterior (cascade delete por relación HasOne inversa).
- **Causa:** La tabla Propiedades tenía el campo `Presupuestos_id` (ForeignKey, id `ce6dgh4sodvmo3b`) y columna virtual `Presupuestos` (LinkToAnotherRecord, id `c9pkiok73yxowj5`).
- **Solución:** DELETE /api/v1/db/meta/columns/c9pkiok73yxowj5 — NocoDB eliminó automáticamente ambas columnas.
- **Impacto en app.js:** Ninguno. Solo se usa el link Presupuestos→Propiedades (cpf764utp1w7yj0) que permanece intacto.
## Desarrollo local

Para correr la app en tu PC local necesitás **3 cosas corriendo**:

1. **NocoDB accesible en localhost:32770** — NocoDB corre en el servidor remoto pero el puerto 32770 es accesible desde la red local. Si no responde, crear túnel SSH: `ssh -L 32770:127.0.0.1:32770 root@93.127.212.235`
2. **Proxy (port 3001)** — Valida tokens Firebase y agrega xc-token. Ejecutar en PowerShell:
   ```
   cd C:\Users\Migue\Desktop\persiana-total-app
   $env:NOCODB_TOKEN="dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ"; node proxy.js
   ```
   Debe decir: `Reenviando a NocoDB en 127.0.0.1:32770`
3. **Dev server (port 3000)** — Sirve archivos estáticos + proxy de `/api/` a port 3001. Ejecutar en otra terminal:
   ```
   cd C:\Users\Migue\Desktop\persiana-total-app
   node dev-server.js
   ```

**IMPORTANTE**: No usar `npx http-server` para desarrollo local. http-server es solo archivos estáticos, no hace proxy de `/api/`. Usar siempre `dev-server.js`.

**Auth local**: Al abrir localhost:3000 hay que hacer login con Firebase (Google o email/password). El proxy valida el token Firebase en cada request. Si las tablas aparecen vacías, es porque no hay sesión Firebase activa — cerrar sesión y volver a loguear.

**Cadena de requests**: Browser → dev-server(3000) → proxy(3001) → NocoDB(32770)

El archivo `proxy.js` acepta variables de entorno opcionales:
- `NOCODB_HOST` (default: 127.0.0.1) — IP de NocoDB
- `NOCODB_PORT` (default: 32770) — Puerto de NocoDB
- `NOCODB_TOKEN` (requerido) — Token xc-token de NocoDB

## Módulo CRM (2026-04-07)

### Arquitectura
- **Módulo admin-only** en la app web: vista 360 del cliente con historial de conversaciones, propiedades y presupuestos
- **Conectado al Orquestador n8n** (WF-01, ID: M7lltfXj45iGq8P0SoGRw) via Webhook estándar
- **Webhook URL**: `https://n8n.srv1323649.hstgr.cloud/webhook/f2989923-d6f4-484c-bb96-68acb5f27ae1`
- **Formato request**: `{ sessionId: "...", chatInput: "..." }` (sin action)
- **Formato response**: `{ output: "..." }`
- **El mismo webhook recibe WhatsApp (yCloud) y chat web** — el nodo "Normalizar Input" detecta la fuente y extrae el mensaje

### Workflows n8n conectados
- **WF-01 Orquestador** (M7lltfXj45iGq8P0SoGRw) — AI Agent GPT-4o-mini con Redis Memory. Herramientas:
  - WF-00 BUFFER (tSB6BCRXjvFZVfQWNm5fa) — Acumula datos del cliente en Redis por teléfono
  - WF-02 Presupuesto (V-8vri9bmbnO22U9i6uZN) — Calcula presupuestos por m² desde NocoDB precios
  - WF-04 Historial (PnGLX6eF3YBu8IGPT_OII) — Registra conversaciones en NocoDB tabla Historial
  - WF-06 CRM Determinístico (77JBu97qaEYj3fqSAQSvO) — Busca/crea clientes y propiedades en NocoDB
  - WF-GRABAR (U5OYOofzx8scUxVZUpYF1) — Al final de conversación, vuelca buffer Redis a NocoDB

### Flujo de datos
1. Cliente chatea (WhatsApp via yCloud / web) → Orquestador recopila datos en Redis
2. Orquestador calcula presupuesto estimado si se pide
3. Al despedirse → WF-GRABAR crea/actualiza cliente + propiedades + historial en NocoDB
4. Admin abre CRM en la app → ve historial de conversaciones del cliente
5. Click "Crear Presupuesto" en un registro de historial → abre formulario pre-cargado

### Tabla Historial en NocoDB (mimh9lp8bkew4t0)
- Campos existentes: session_id, intencion, resumen, resultado, fecha, Cliente (M2M link)
- **Campos estructurados agregados** (2026-04-06, para pre-cargar presupuestos desde CRM):
  - `producto` (SingleLineText) ✅
  - `ancho` (Number) ✅
  - `alto` (Number) ✅
  - `cantidad` (Number) ✅
  - `presupuesto_monto` (Number) ✅
- ✅ Nodo "Crear Historial" en WF-GRABAR actualizado (2026-04-07) para guardar estos campos en el body del POST a NocoDB

### Funciones CRM en app.js
- `renderCRM()` — Lista de clientes con conteo de historial/presupuestos, paginada
- `filterCRM()` — Filtro por nombre, teléfono o tipo
- `openCrmDetail(clientId)` — Modal 360 con tabs (Resumen/Historial/Propiedades/Presupuestos)
- `showCrmTab(tabName)` — Cambio de tabs
- `renderCrmTimeline(historial, presupuestos)` — Timeline cronológica combinada
- `_buildHistorialByClient()` — Agrupa historial por cliente
- `_crmResultadoBadge(resultado)` — Badge coloreado por resultado de conversación
- `crearPresDesdeHistorial(histData, clientId)` — Abre formulario presupuesto pre-cargado
- `openCrmChat(clientId)` — Chat embebido conectado al Orquestador, con contexto del cliente

### Chatbot — dos flujos separados (2026-04-08)
- **Botón "Cargar Cliente IA"** (sidebar) → usa `WEBHOOK_CHATBOT` = `https://n8n.srv1323649.hstgr.cloud/webhook/chat-app` → workflow "Chatbot Carga de Clientes" (ID: D6UNcCuUv4ayRLG195o-5). Destinado a vendedores para cargar clientes nuevos desde la app en producción.
- **Chat del CRM** (`openCrmChat`) → usa `WEBHOOK_ORQUESTADOR` = `https://n8n.srv1323649.hstgr.cloud/webhook/f2989923-d6f4-484c-bb96-68acb5f27ae1` → workflow WF-01 Orquestador (ID: M7lltfXj45iGq8P0SoGRw). Destinado al módulo CRM, con contexto del cliente.
- `submitChatInput()` elige el webhook según el prefijo del `chatSessionId`: `crm_...` → Orquestador, `app_...` → Chatbot viejo
- Constantes en app.js línea ~154: `WEBHOOK_ORQUESTADOR` y `WEBHOOK_CHATBOT`

### Orquestador n8n - Arquitectura actual (2026-04-07)
- **Trigger**: Webhook estándar (POST) — reemplaza al Chat Trigger que no funcionaba en producción
- **Nodos**: Webhook → Normalizar Input (Code) → AI Agent → Respond to Webhook
- **Normalizar Input**: detecta si es chat web (`body.chatInput`) o WhatsApp yCloud (`body.whatsappMessage`), ignora echoes de mensajes salientes
- **yCloud webhook secret**: `whsec_e2975cff3dd5428d8a953b7d11d5c30f`
- **WhatsApp**: yCloud apunta al mismo webhook del Orquestador. Los mensajes entrantes se procesan, los echoes se ignoran.

### n8n API
- Instancia: `https://n8n.srv1323649.hstgr.cloud`
- API Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZjVmMzg1NC01MDJmLTQ4MGQtODRkOS01YWQxMTNiODUzZjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNjk2YzI2ZjQtNTE1YS00YTU5LTljMzItZDExZmExNTZhYzY1IiwiaWF0IjoxNzc1NTc0MDk4fQ.b_bmf4nVMs5wDEd_mhhe_0IVMqrzkaBdSsWbvvpXpJU`
- Header: `X-N8N-API-KEY: <key>`
- El MCP de n8n integrado en Claude Code NO está conectado a esta instancia; usar curl directo con `-k` flag para SSL

---

## Referencia rápida de servidores y endpoints

### Servidor VPS (Hostinger)
- **IP pública**: `93.127.212.235`
- **SSH**: `root@93.127.212.235` (solo publickey desde terminal, no acepta password por SSH)
- **App producción**: `https://app.srv1323649.hstgr.cloud/` (también accesible en `http://93.127.212.235:3000`) — sirve desde `/root/persiana-app/`
- **Deploy**: `cd /root/persiana-app && git pull`
- **NocoDB UI**: `http://93.127.212.235:32770` (accesible desde browser externo)
- **NocoDB desde Docker (n8n)**: `http://nocodb:8080` ← IMPORTANTE: dentro de los containers usar esta URL, nunca la IP pública

### NocoDB
- **URL externa**: `http://93.127.212.235:32770`
- **URL interna (Docker)**: `http://nocodb:8080`
- **Token**: `dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ`
- **Base ID**: `pru2fsphj43juyr`
- **Tabla Historial ID**: `mimh9lp8bkew4t0`

### n8n
- **URL**: `https://n8n.srv1323649.hstgr.cloud`
- **Editor**: acceder desde browser con credenciales del usuario
- **API**: `https://n8n.srv1323649.hstgr.cloud/api/v1/` con header `X-N8N-API-KEY`
- **Nota**: para llamar la API usar `curl -k` (SSL self-signed)

### Webhooks n8n (producción — siempre activos)
| Nombre | URL | Workflow |
|--------|-----|----------|
| Chatbot Carga de Clientes | `https://n8n.srv1323649.hstgr.cloud/webhook/chat-app` | D6UNcCuUv4ayRLG195o-5 |
| Orquestador CRM | `https://n8n.srv1323649.hstgr.cloud/webhook/f2989923-d6f4-484c-bb96-68acb5f27ae1` | M7lltfXj45iGq8P0SoGRw |

### Workflows n8n — IDs
| Nombre | ID |
|--------|-----|
| WF-01 Orquestador | M7lltfXj45iGq8P0SoGRw |
| WF-00 Buffer Redis | tSB6BCRXjvFZVfQWNm5fa |
| WF-02 Presupuesto | V-8vri9bmbnO22U9i6uZN |
| WF-04 Historial | PnGLX6eF3YBu8IGPT_OII |
| WF-06 CRM Determinístico | 77JBu97qaEYj3fqSAQSvO |
| WF-GRABAR | U5OYOofzx8scUxVZUpYF1 |
| Chatbot Carga de Clientes | D6UNcCuUv4ayRLG195o-5 |

### Firebase
- Proyecto: configurado en app.js (objeto `firebaseConfig`)
- Auth: email/password + Google
- El proxy valida el Bearer token Firebase en cada request a `/api/`

### Desarrollo local
- Proxy: puerto 3001 — `$env:NOCODB_TOKEN="dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ"; node proxy.js`
- Dev server: puerto 3000 — `node dev-server.js`
- Túnel SSH si NocoDB no responde: `ssh -L 32770:127.0.0.1:32770 root@93.127.212.235`
