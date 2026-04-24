# Persiana Total App — Contexto para Claude

## Stack
- **Frontend**: Vanilla JS/HTML/CSS, un solo `app.js` + `index.html`
- **Backend/DB**: NocoDB REST API — self-hosted Hostinger, puerto 32770 (solo localhost en servidor)
- **Automatizaciones**: n8n self-hosted (`https://n8n.srv1323649.hstgr.cloud`)
- **Auth**: Firebase Auth | **Infra**: Nginx + Docker | **Prod**: `https://app.srv1323649.hstgr.cloud/`
- **Servidor**: `ssh root@srv1323649.hstgr.cloud` | archivos en `/root/persiana-app/`

## Estado actual (2026-04-24) — HEAD: c848cd5
- **CRM en producción** ✅ — módulo CRM mergeado a main y deployado
- **WhatsApp completo** ✅ — Fases 1/2/3 done: yCloud gateway, tab CRM, botón Tomar/Soltar, bot Anthropic
- **Bot WA en Anthropic** ✅ — claude-haiku-4-5-20251001, fixes: phone injection, JSON, horario, PLACEHOLDER_ID, logs
- **Tab WA en CRM** ✅ — app.js busca wa_messages por cliente_id OR phone (fix para msgs pre-cliente)
- **proxy.js fix** ✅ — escucha en 0.0.0.0:3001 (antes 127.0.0.1, rompía conexión Docker)
- **feature/crm** — rama obsoleta, el CRM ya está en main

## ⚠️ REGLAS DE GIT — CRÍTICAS (aprendidas por errores)

### El problema que tuvimos
El Windows local divergió del servidor porque Claude Code crea procesos git en background
(worktrees) que bloquean el index y hacen commits en ramas equivocadas.
Resultado: cambios que "se pushearon" pero no llegaron a GitHub real.

### Regla de oro
**NUNCA hacer git commit/push desde la máquina Windows con Claude Code.**
Todos los commits de código van desde el servidor vía SSH.

### Flujo correcto para trabajar
```
1. Editar código → Windows (Claude Code edita los archivos localmente)
2. Commit y push → SIEMPRE desde el servidor vía SSH

# En el servidor:
cd /root/persiana-app
git add archivo.js
git commit -m "descripción"
git push origin main
```

### Si Claude necesita hacer git desde Windows
Usar siempre este bloque antes de cualquier git:
```bash
taskkill //F //IM git.exe 2>/dev/null
powershell -Command "Remove-Item '.git/index.lock' -Force -ErrorAction SilentlyContinue"
git fetch origin && git reset --hard origin/main
```

### Deploy a producción
```bash
# Si Claude commiteó desde el servidor: ya está deployado.
# Si se pusheó desde Windows a GitHub:
ssh root@srv1323649.hstgr.cloud
cd /root/persiana-app && git pull
```

## Constantes clave en app.js
```js
const WEBHOOK_CRM_ADMIN  = 'https://n8n.srv1323649.hstgr.cloud/webhook/0e1dad22-7ced-4472-a1ab-16560ff2ff1f';
const WEBHOOK_VENTAS_WEB = 'https://n8n.srv1323649.hstgr.cloud/webhook/chat-app';
const WEBHOOK_ORQUESTADOR = 'https://n8n.srv1323649.hstgr.cloud/webhook/f2989923-d6f4-484c-bb96-68acb5f27ae1';
const WEBHOOK_CHATBOT     = 'https://n8n.srv1323649.hstgr.cloud/webhook/chat-app';
const TBL = { clientes:'mwby85581fhjy27', propiedades:'m0dwlr7ccoim1kf', historial:'mimh9lp8bkew4t0', presupuestos:'mn1yyjyovvoyxme', wa_messages:'mt0hgi00vq6cgok' };
// NocoDB token: xc-token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ
// n8n API key (2026-04-24): eyJ...REDACTED
// Anthropic API key: sk-ant-api03-REDACTED
// Anthropic model WA bot: claude-haiku-4-5-20251001 (Claude 3 deprecated en la cuenta)
```

## Workflows n8n
| ID | Nombre | Webhook/Rol |
|----|--------|-------------|
| `OUOGenIxILkjYLP6` | WF-CRM-Admin | `0e1dad22-…` — copiloto admin CRM, tool crm_query + Redis |
| `uhQF2tbz8ZgrcPyn` | WF-CRM-Query | sub-workflow — consulta NocoDB 4 tablas |
| `D6UNcCuUv4ayRLG195o-5` | Chatbot Carga Clientes | `chat-app` — captura leads web pública |
| `SCbkZ8wUnUUvShIi` | WF-WA-Agent | `wa-agent` — bot WhatsApp, 10 tools + log wa_messages |

**Tool crm_query**: `entity`(req), `filter`(string JSON serializado), `search`, `cliente_id`, `sort`, `limit`(def 20, max 100).

## Módulo CRM — en producción ✅
- Lista clientes: búsqueda Nombre + Teléfono (OR server-side), filtro por tipo, paginación
- Cache `DATA._presupuestosAll` independiente del slice paginado
- Modal 360 (4 tabs): Resumen / Historial / Propiedades / Presupuestos
- Asistente IA global (`openCrmGlobalChat`) + chat por cliente (`openCrmChat`)
- Solo visible para admin (`applyRolePermissions`)
- `submitChatInput`: rutea por sessionId — `crm_*` → WEBHOOK_ORQUESTADOR, resto → WEBHOOK_CHATBOT
- ⚠️ Pendiente verificar: flujos de chat en n8n (CRM Admin + Chatbot)

## WhatsApp — Estado ✅ COMPLETO
- **Fase 1** ✅: WF-WA-Agent testeado 9/9, tabla wa_messages activa
- **Fase 2** ✅: yCloud gateway integrado, número WhatsApp Business activo
- **Fase 3** ✅: Tab WhatsApp en CRM modal 360°, botón Tomar/Soltar, flag WHATSAPP_ENABLED=true
- **Bot** ✅: Anthropic claude-haiku-4-5-20251001, system prompt con DATOS DE SESIÓN inyectados
- **WF-WA-Agent** (n8n `SCbkZ8wUnUUvShIi`): toolsAgent typeVersion 1.7, Window Buffer Memory (_v2 session key)
- **Logs**: wa_messages tabla `mt0hgi00vq6cgok`, Log Outgoing con `=` prefix y cliente_id dinámico
- **Tab CRM**: app.js busca por `cliente_id OR phone` (para msgs pre-cliente con cliente_id=0)

## NocoDB — Cambios de esquema
- **2026-04-13**: Eliminado `Presupuestos_id` (FK `ce6dgh4sodvmo3b`) y link virtual `Presupuestos` (`c9pkiok73yxowj5`) de tabla Propiedades. Fix cascade delete. Columna Presupuestos→Propiedades (`cpf764utp1w7yj0`) intacta.

## Column IDs de relaciones (NocoDB v2)
- `canpten8owymbde` — Presupuestos ↔ Clientes
- `cr3s0ox51qopwl4` — Presupuestos ↔ Zonas
- `cpf764utp1w7yj0` — Presupuestos ↔ Propiedades
- `cr9l2n9wiubrcra` — Presupuestos ↔ Formas_Pago
- `cm5xv0vmlne7r6u` — Presupuestos ↔ Presupuesto_Unidades
- `co1b5kwpl8d2rya` — Presupuesto_Unidades ↔ Productos
- `czka6po5myr5wu6` — Presupuesto_Lineas ↔ Componentes
- `cn9406tc3q1jmw0` — Presupuesto_Lineas ↔ Presupuesto_Unidades

## Lógica de presupuestos — Refactor ✅
- `PROD_COMP_MAP`: 25→172, 26→174, 29→168, 30→167
- `selectMotor`: Exterior → Tubular 60 (≤115kg) / Tubular 140. Seguridad eje 7.5" → P800/P1000/P1500
- Sin MO. Presupuesto libre = tabla vacía. PVC Cambio paño = 20% instalación.
- **Pendiente P3**: productos 33-36 (Cajón Exterior, Sistema Dual, Bandas Verticales)

## Fix pendiente en código
- `Margen_default || 40` → debe ser `?? 40` en `compSelected` (~línea 2607) y `addCompRowWithData` (~línea 2560)

## Dev local — cómo arrancar
```bash
# Terminal 1 — túnel NocoDB (Node.js, desde raíz del proyecto)
node tunnel.js

# Terminal 2 — servidores
NOCODB_TOKEN=dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ node proxy.js &
node dev-server.js
# App en http://localhost:3000
```

## Arquitectura del servidor (infra clave)
```
Usuario → Traefik (Docker, puerto 443) → persiana-app container (nginx, puerto 80)
nginx en container:
  - Sirve estáticos desde /root/persiana-app (bind mount ro)
  - Proxy /api/* → http://host.docker.internal:3001
host:3001 → proxy.js (PM2 "persiana-proxy") → NocoDB (127.0.0.1:32770, Docker)

Containers: n8n-traefik-1 | persiana-app | nocodb-4xnv-nocodb-1 | redis-redis-1 | n8n-n8n-1
⚠️ proxy.js DEBE escuchar en 0.0.0.0:3001 (no 127.0.0.1) para que Docker lo alcance
```

## Próximas tareas
1. Test E2E bot WA con cliente nuevo — verificar tab WhatsApp en CRM muestra la conv completa
2. Verificar flujos de chat n8n (CRM Admin + Chatbot web) — detalles pendientes
3. Productos P3: lógica IDs 33-36 (Cajón Exterior, Sistema Dual, Bandas Verticales)
4. Fix `Margen_default ?? 40` en `compSelected` (~L2607) y `addCompRowWithData` (~L2560)
