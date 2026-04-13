# Persiana Total App — Contexto para Claude

## Stack
- **Frontend**: Vanilla JS/HTML/CSS, un solo `app.js` + `index.html`
- **Backend/DB**: NocoDB REST API — self-hosted Hostinger, puerto 32770 expuesto al host
- **Automatizaciones**: n8n self-hosted (`https://n8n.srv1323649.hstgr.cloud`)
- **Auth**: Firebase Auth | **Infra**: Nginx + Docker | **Prod**: `https://app.srv1323649.hstgr.cloud/`

## Git — Estado actual (2026-04-13)
- **Rama principal**: `main` — en producción. Commit HEAD: `08453b5`
- **Rama en desarrollo**: `feature/crm` — módulo CRM completo, listo para merge cuando el usuario confirme
- **NUNCA** mergear `feature/crm` → `main` sin confirmación explícita del usuario
- **Deploy**: push a `main` + `git pull` en servidor (`ssh root@srv1323649.hstgr.cloud`)
- ⚠️ El Windows local puede divergir del servidor. Siempre hacer `git fetch && git reset --hard origin/main` antes de trabajar

## Constantes clave en app.js
```js
const WEBHOOK_CRM_ADMIN  = 'https://n8n.srv1323649.hstgr.cloud/webhook/0e1dad22-7ced-4472-a1ab-16560ff2ff1f';
const WEBHOOK_VENTAS_WEB = 'https://n8n.srv1323649.hstgr.cloud/webhook/chat-app';
const WEBHOOK_ORQUESTADOR = WEBHOOK_CRM_ADMIN;  // alias
const WEBHOOK_CHATBOT     = WEBHOOK_VENTAS_WEB; // alias
const TBL = { clientes:'mwby85581fhjy27', propiedades:'m0dwlr7ccoim1kf', historial:'mimh9lp8bkew4t0', presupuestos:'mn1yyjyovvoyxme', wa_messages:'mt0hgi00vq6cgok' };
// NocoDB token: xc-token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ
// n8n API key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...b_bmf4nVMs5wDEd_mhhe_0IVMqrzkaBdSsWbvvpXpJU
```

## Workflows n8n
| ID | Nombre | Webhook/Rol |
|----|--------|-------------|
| `OUOGenIxILkjYLP6` | WF-CRM-Admin | `0e1dad22-…` — copiloto admin, tool `crm_query` + Redis memory |
| `uhQF2tbz8ZgrcPyn` | WF-CRM-Query | sub-workflow — consulta NocoDB 4 tablas |
| `D6UNcCuUv4ayRLG195o-5` | Chatbot Carga Clientes | `chat-app` — captura leads web pública |
| `SCbkZ8wUnUUvShIi` | WF-WA-Agent | `wa-agent` — bot WhatsApp, 10 tools + Log Incoming/Outgoing a wa_messages |

**Tool crm_query**: `entity`(req), `filter`(string JSON, NO object), `search`, `cliente_id`, `sort`, `limit`(def 20, max 100).  
`filter` es `string` serializado — el nodo Build Request parsea con `JSON.parse(filter || '{}')`.

## Módulo CRM (feature/crm) — Estado
- Lista clientes: búsqueda **Nombre + Teléfono** (server-side OR), filtro por tipo, paginación
- **Columna PRESUPUESTOS**: cache `DATA._presupuestosAll` (completo, independiente del slice paginado) ✅
- Modal 360 (4 tabs): Resumen / Historial / Propiedades / Presupuestos + timeline cronológica
- Botón "Crear Presupuesto" desde historial (pre-carga cliente)
- "Asistente IA" en header CRM → `openCrmGlobalChat()` | "Chat" por fila/ficha → `openCrmChat(clientId)`
- Solo visible para admin (`applyRolePermissions`)
- Búsquedas OR: Clientes (Nombre+Teléfono), Propiedades (Nombre+Dirección+Cliente), Presupuestos (Numero+Cliente+Dirección)
- **Listo para merge a main** — confirmar con usuario antes de hacerlo

## WF-WA-Agent (WhatsApp) — Estado
- **Fase 1** ✅: workflow testeado 9/9 (saludo, identificación, captación, handoff)
- **Fase 1.5** ✅: tabla `wa_messages` con persistencia turno-por-turno. 18 registros verificados.
- **Fase 2** ❌ pendiente: integración yCloud (webhook yCloud → WF-WA-Agent → enviar via yCloud API)
- **Fase 3** ❌ pendiente: UI pestaña WhatsApp en CRM (leer conversaciones + handoff manual)
- **Plan acordado**: agregar `const WHATSAPP_ENABLED = false` en app.js. La UI solo aparece en `true`.
- **Tabla wa_messages**: `mt0hgi00vq6cgok` — session_id, direction (in/out), message, phone, cliente_id

## NocoDB — Cambios de esquema aplicados
- **2026-04-13**: Eliminado campo `Presupuestos_id` (ForeignKey) + columna virtual `Presupuestos` de tabla Propiedades. Causa: cascade delete al crear segundo presupuesto para misma propiedad. Solución: `DELETE /api/v1/db/meta/columns/c9pkiok73yxowj5`. El link Presupuestos→Propiedades (`cpf764utp1w7yj0`) permanece intacto.

## Lógica de presupuestos — Refactor 2026-04-11 ✅
- `PROD_COMP_MAP`: 25→172, 26→174, 29→168, 30→167
- `selectMotor`: Exterior → Tubular 60 (≤115kg) / Tubular 140. Seguridad eje 7.5" → P800/P1000/P1500
- Sin MO en ningún caso. Presupuesto libre = tabla vacía. PVC Cambio paño = 20% instalación.
- **Pendiente P3**: productos 33-36 (Cajón Exterior, Sistema Dual, Bandas Verticales)

## Arquitectura de chats
| Función | sessionId | Webhook |
|---------|-----------|---------|
| `openCrmGlobalChat()` | `crm_global_*` | WF-CRM-Admin |
| `openCrmChat(clientId)` | `crm_<id>_*` | WF-CRM-Admin |
| `openChatbot()` | `app_*` | WF-Chatbot Carga de Leads |

## Dev local — Túnel SSH
Puerto 32770 NO expuesto a internet. Dos opciones:
```bash
# Opción A — SSH nativo (requiere clave o sshpass)
ssh -L 32770:localhost:32770 root@srv1323649.hstgr.cloud

# Opción B — tunnel.js (Node ssh2, recomendado en Windows)
node tunnel.js   # en /root/persiana-app/tunnel.js — usa ssh2 con password
```
Luego: `NOCODB_TOKEN=dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ node proxy.js & node dev-server.js`  
App en **http://localhost:3000** | Proxy NocoDB en **:3001**

## API PUT n8n workflows
Payload acepta solo `name`, `nodes`, `connections`, `settings` — cualquier campo extra da 400.
```bash
curl --ssl-no-revoke -X PUT "https://n8n.srv1323649.hstgr.cloud/api/v1/workflows/ID" \
  -H "X-N8N-API-KEY: ..." -H "Content-Type: application/json" \
  -d '{"name":"...","nodes":[...],"connections":{...},"settings":{}}'
```

## Próximas tareas (en orden de prioridad)
1. **Merge feature/crm → main** (usuario debe confirmar)
2. **WhatsApp Fase 2**: conectar yCloud como gateway real (requiere número WhatsApp Business)
3. **WhatsApp Fase 3**: UI pestaña WhatsApp en CRM + flag `WHATSAPP_ENABLED`
4. **Productos P3**: lógica para IDs 33-36 (Cajón Exterior, Sistema Dual, Bandas Verticales)
5. **Fix pendiente**: fallback `Margen_default || 40` → cambiar a `?? 40` en compSelected y addCompRowWithData
