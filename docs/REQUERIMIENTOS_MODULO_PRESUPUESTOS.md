# Requerimientos - Reescritura del Modulo de Presupuestos

## Por que reescribir

El modulo actual tiene un problema estructural de raiz: NocoDB maneja las relaciones HasMany (Presupuestos -> Clientes, Presupuestos -> Zonas, Presupuestos -> Propiedades) con una FK almacenada en la tabla hija. Esto significa que:

1. **Vincular un cliente a un presupuesto nuevo desvincula al anterior.** NocoDB sobreescribe el FK en el registro del cliente, rompiendo la relacion con cualquier presupuesto previo.
2. **Idem con Zona y Propiedad.** El mismo mecanismo causa el mismo efecto en las tres relaciones.
3. **El FK de Propiedades fue eliminado** (2026-04-02) para evitar cascade delete, dejando `apiGetLinks` devolviendo `[]` para todas las propiedades.
4. **Cada parche genera un efecto secundario nuevo.** La solucion con campos `_id` de respaldo funciona para nuevos presupuestos pero no migra los existentes. La eliminacion de `apiGetLinks` mejora performance pero pierde datos historicos.

**Conclusion:** Los links LTAR de NocoDB no son aptos para relaciones N:1 (muchos presupuestos a un mismo cliente). La unica solucion de raiz es usar campos Number simples (`Cliente_id`, `Zona_id`, `Propiedad_id`) como fuente de verdad, eliminar la dependencia de `apiGetLinks` para la resolucion de nombres, y migrar los presupuestos existentes una unica vez.

---

## Alcance

Reescribir **solo las funciones del modulo de presupuestos** (~800 lineas de app.js). No se toca:
- Modulo de clientes
- Modulo de propiedades
- Modulo de precios/componentes
- Modulo de configuracion
- Chatbot
- Autenticacion (Firebase)
- Estilos CSS
- HTML base (index.html)

---

## Cambios en esquema NocoDB (prerequisito)

### Campos nuevos en tabla Presupuestos

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `Cliente_id` | Number | ID del cliente (reemplaza link HasMany) |
| `Zona_id` | Number | ID de la zona (reemplaza link HasMany) |
| `Propiedad_id` | Number | ID de la propiedad (reemplaza link HasMany) |

**Script de migracion:** crear los tres campos via API de NocoDB y poblarlos una unica vez recorriendo los presupuestos existentes:
- Para cada presupuesto, consultar `apiGetLinks` con los column IDs actuales
- Si devuelve resultado, guardar el ID en el campo Number correspondiente
- Si devuelve vacio, dejar null (dato perdido, no recuperable)

**Los links LTAR existentes NO se eliminan.** Quedan en NocoDB pero el frontend no los usa mas para resolver nombres. Los `apiLink` se pueden mantener para compatibilidad con la interfaz web de NocoDB (el usuario puede ver las relaciones desde ahi).

---

## Modelo de datos

### Presupuesto

```
Presupuesto
  Id                    (auto, PK)
  Numero                (string, formato YYYY-NNNN, unico, correlativo)
  Fecha                 (date, ISO)
  Estado                (enum: Borrador|Enviado|Aprobado|Rechazado|Facturado|Vencido)
  Canal                 (enum: Manual|Chatbot)
  Facturacion           (enum: con_iva|sin_iva)
  TC_usado              (number, tipo de cambio al momento de crear)
  Incluye_instalacion   (boolean)
  Cliente_id            (number, FK -> Clientes.Id)       *** CAMPO SIMPLE ***
  Zona_id               (number, FK -> Zonas.Id)          *** CAMPO SIMPLE ***
  Propiedad_id          (number, FK -> Propiedades.Id)    *** CAMPO SIMPLE ***
  Costo_traslado        (number, ARS)
  Visitas_traslado      (number, entero)
  Subtotal_neto         (number, suma de items sin IVA)
  IVA_21                (number, monto IVA 21%)
  IVA_105               (number, monto IVA 10.5%)
  Total_con_IVA         (number, subtotal + IVA + traslado)
  Descuento_sin_factura_pct (number, default 10)
  Total_sin_factura     (number, Total_con_IVA * 0.9)
  Quiere_factura        (boolean, opcional)
```

### Presupuesto_Unidades

```
Unidad
  Id                    (auto, PK)
  Nombre                (string, ej: "Dormitorio principal")
  Ubicacion             (string, ej: "Contra frente")
  Tipo_trabajo          (enum: Instalacion_nueva|Cambio_pano|Motorizacion|Cambio_guias|Reparacion|Service|Otro)
  Tipo_reparacion       (enum: cambio_eje|cambio_cinta|cambio_laterales|cambio_resortes|cambio_polea_tacos|bobinado_motor)
  Accionamiento         (enum: motor|manual_cinta|manual_antognetti|cadena)
  Ancho_m               (number, metros)
  Alto_m                (number, metros)
  Alt_colocacion_m      (number, metros, solo para Interior)
  M2_calculados         (number, Ancho * Alto)
  Pct_instalacion       (number, % sobre subtotal de componentes)
  Monto_instalacion     (number, ARS)
  Cantidad              (number, multiplicador de unidades iguales)
  Orden                 (number, posicion en el presupuesto)
  -- Links LTAR (se mantienen) --
  Presupuestos          (link, column: cm5xv0vmlne7r6u)
  Producto_base         (link, column: co1b5kwpl8d2rya)
```

### Presupuesto_Lineas

```
Linea
  Id                    (auto, PK)
  Descripcion_pdf       (string, nombre del componente)
  Cantidad              (number, ej: 2.50 ml de perfil)
  Ancho_m               (number, heredado de unidad)
  Alto_m                (number, heredado de unidad)
  M2_calculados         (number, heredado de unidad)
  Moneda_costo_orig     (enum: ARS|USD)
  Costo_unit_orig       (number, costo original del componente)
  TC_aplicado           (number, tipo de cambio si USD)
  Costo_unit_ARS        (number, costo en ARS con armado aplicado)
  Margen_pct            (number, margen aplicado)
  Precio_unit_ARS       (number, precio sin IVA)
  Subtotal_ARS          (number, precio sin IVA * cantidad)
  Alicuota_IVA          (number, 21 o 10.5)
  Monto_IVA             (number, subtotal * alicuota/100)
  Subtotal_con_IVA      (number, subtotal + IVA)
  Orden                 (number, posicion en la unidad)
  Visible_pdf           (boolean, default true)
  -- Links LTAR (se mantienen) --
  Presupuestos          (link, column: c4hnodnss6zlr32)
  Presupuesto_Unidades  (link, column: cn9406tc3q1jmw0)
  Componentes           (link, column: czka6po5myr5wu6)
```

---

## Funciones a reescribir

### 1. `_resolvePresupuestoLinks()`

**Comportamiento actual:** Hace hasta 60 requests HTTP (`apiGetLinks` x 3 x 20 presupuestos por pagina) para resolver nombres de cliente, zona y propiedad. Causa freeze del navegador.

**Comportamiento nuevo:**
- Lee `Cliente_id`, `Zona_id`, `Propiedad_id` directamente del registro del presupuesto
- Busca el nombre en `DATA.clientes`, `DATA.zonas`, `DATA.propiedades` (arrays en memoria)
- **0 requests HTTP adicionales**
- Si el array de datos no esta cargado, hace un unico `apiGetAll` para cargarlo

```
Para cada presupuesto p:
  p._clienteNombre = DATA.clientes.find(c => c.Id == p.Cliente_id)?.Nombre || '-'
  p._zonaNombre    = DATA.zonas.find(z => z.Id == p.Zona_id)?.Nombre || '-'
  p._propiedadDir  = buscar en DATA.propiedades por p.Propiedad_id -> Direccion + Localidad
```

### 2. `_savePresInner()` - Crear presupuesto

**Flujo:**
1. Validar: cliente y zona seleccionados (obligatorios)
2. Obtener total real de presupuestos (sin filtros) para generar numero correlativo
3. Generar numero: `YYYY-NNNN` donde NNNN = total + 1, padded con ceros
4. Crear registro presupuesto con `apiPost`:
   - Numero, Fecha (hoy), Estado: Borrador
   - TC_usado (tipo de cambio vigente)
   - Canal: Manual
   - Facturacion: valor del select
   - **Cliente_id, Zona_id, Propiedad_id como campos Number**
5. Vincular via `apiLink` a Cliente, Zona, Propiedad, Forma_pago (para compatibilidad NocoDB UI)
6. Para cada unidad en el formulario:
   - Crear registro unidad con `apiPost`
   - Vincular unidad al presupuesto via `apiLink`
   - Para cada componente en la unidad:
     - Crear registro linea con todos los campos de precio calculados
     - Vincular linea al presupuesto y a la unidad via `apiLink`
7. Calcular totales finales y actualizar presupuesto con `apiPatch`
8. Recargar datos y navegar a la pagina de presupuestos

### 3. `_savePresInner()` - Editar presupuesto

**Flujo:**
1. Actualizar campos editables: Canal, Facturacion, Propiedad_id, Cliente_id, Zona_id
2. Re-vincular via apiLink (para NocoDB UI)
3. **Eliminar todas las unidades y lineas existentes** (delete + recrear, no update parcial)
4. Recrear unidades y lineas como en la creacion
5. Recalcular totales y actualizar presupuesto

**Campos bloqueados en edicion:** Cliente, Propiedad, Zona (readonly en UI)

### 4. `duplicatePresupuesto(presId)`

**Flujo:**
1. Confirmar con usuario
2. Obtener datos completos del presupuesto original via `fetchBudgetDeepData`
3. Generar nuevo numero correlativo
4. Crear nuevo presupuesto con **mismos `Cliente_id`, `Zona_id`, `Propiedad_id`**
5. Copiar todas las unidades y lineas
6. Vincular todo via apiLink
7. Copiar totales del original
8. Recargar datos

### 5. `deletePresupuesto(presId)`

**Flujo:**
1. Confirmar con usuario (mostrar numero del presupuesto)
2. Obtener unidades del presupuesto via `apiGetLinks(TBL.presupuestos, 'cm5xv0vmlne7r6u', presId)`
3. Para cada unidad: eliminar sus lineas, luego eliminar la unidad
4. Eliminar el presupuesto
5. Recargar datos

### 6. `fetchBudgetDeepData(presId)`

**Comportamiento nuevo:**
- **Cliente:** buscar en `DATA.clientes` por `presupuesto.Cliente_id` (no apiGetLinks)
- **Zona:** buscar en `DATA.zonas` por `presupuesto.Zona_id` (no apiGetLinks)
- **Propiedad:** buscar en `DATA.propiedades` por `presupuesto.Propiedad_id` (no apiGetLinks)
- **Forma de pago:** `apiGetLinks(TBL.presupuestos, 'cr9l2n9wiubrcra', presId)` (este link funciona bien, es ManyToMany)
- **Unidades y lineas:** se mantiene el patron actual (apiGet + resolveLink)

### 7. `viewPresupuesto(presId)`

Sin cambios funcionales. Usa `fetchBudgetDeepData` que ya resolvera los datos correctamente.

### 8. `generarPDF(presId)`

Sin cambios funcionales. Usa `fetchBudgetDeepData` que ya resolvera los datos correctamente.

### 9. `loadPresupuestos()`

Sin cambios funcionales. Usa `_resolvePresupuestoLinks()` que ya no hara requests HTTP.

### 10. `changeStatus(presId, newStatus)`

Sin cambios.

---

## Logica de negocio a conservar exactamente

### Seleccion de motor (`selectMotor`)

```
Seguridad (ancho < 6m):
  peso < 80kg  -> Tubular 140 (ID 55)
  peso < 200kg -> Paralelo 400 (ID 50)
  peso < 300kg -> Paralelo 600 (ID 51)
  peso < 500kg -> Paralelo 800 (ID 52)
  peso < 700kg -> Paralelo 1000 (ID 53)
  else         -> Paralelo 1500 (ID 54)

Seguridad (ancho >= 6m):
  peso < 500kg -> Paralelo 800 (ID 52)
  peso < 700kg -> Paralelo 1000 (ID 53)
  else         -> Paralelo 1500 (ID 54)

Exterior:
  peso < 30kg  -> Tubular 60 (ID 56)
  peso < 80kg  -> Tubular 140 (ID 55)
  peso < 200kg -> Paralelo 400 (ID 50)
  peso < 300kg -> Paralelo 600 (ID 51)
  peso < 500kg -> Paralelo 800 (ID 52)
  peso < 700kg -> Paralelo 1000 (ID 53)
  else         -> Paralelo 1500 (ID 54)

Interior:
  peso < 5kg   -> Motor roller 1 (ID 144)
  peso < 15kg  -> Motor roller 2 (ID 145)
  else         -> Motor roller 3 (ID 146)
```

### Peso por m2 (`PESO_M2`)

```
ID 16 -> 11 kg/m2    ID 21 -> 4 kg/m2     ID 25 -> 10 kg/m2
ID 17 -> 13 kg/m2    ID 22 -> 7 kg/m2     ID 26 -> 5 kg/m2
ID 18 -> 10 kg/m2    ID 24 -> 3 kg/m2     ID 27 -> 10 kg/m2
ID 19 -> 12 kg/m2                          ID 28 -> 5 kg/m2
ID 20 -> 14 kg/m2                          ID 29 -> 10 kg/m2
```

### Porcentaje de instalacion (`INSTALACION_PCT`)

```
Instalacion_nueva  -> 8%
Cambio_pano        -> 8%
Cambio_guias       -> 8%
Motorizacion       -> 8%
Reparacion         -> 0%
Service            -> 0%
Otro               -> 0%
```

### Auto-carga de componentes (`autoLoadComponents`)

Esta funcion es la mas compleja. Decide que componentes agregar automaticamente segun:
- **Tipo de trabajo** (instalacion nueva, reparacion, motorizacion, etc.)
- **Categoria del producto** (Exterior, Interior, Seguridad)
- **Accionamiento** (motor, manual cinta, manual antognetti, cadena)
- **Dimensiones** (ancho, alto, m2, peso)
- **Altura de colocacion** (solo para Interior)

Se debe conservar identica. No se reescribe, solo se verifica que siga funcionando con los datos nuevos.

### Calculo de precios

```
Por cada linea de componente:
  CostoARS = Costo_unitario * TC (si USD) * (1 + Porcentaje_Armado/100)
  PrecioSinIVA = CostoARS * (1 + Margen/100)
  PrecioConIVA = PrecioSinIVA * (1 + Alicuota_IVA/100)
  SubtotalLinea = PrecioConIVA * Cantidad

Por cada unidad:
  SubtotalComponentes = suma de SubtotalLinea
  SubtotalUnidad = SubtotalComponentes * CantidadUnidades
  MontoInstalacion = SubtotalUnidad * (Pct_instalacion / 100)
  TotalUnidad = SubtotalUnidad + MontoInstalacion

Total presupuesto:
  SubtotalItems = suma de TotalUnidad
  CostoTraslado = DistanciaKm * TarifaKm * Visitas
  IVA_21 = suma de montos IVA donde alicuota = 21
  IVA_105 = suma de montos IVA donde alicuota = 10.5
  TotalConIVA = SubtotalItems + CostoTraslado
  TotalSinFactura = TotalConIVA * 0.9
```

### Calculo de traslado

```
Constantes:
  TALLER_LAT = -31.6520
  TALLER_LON = -60.7254
  TARIFA_KM  = 1500 $/km

Distancia = haversine(TALLER_LAT, TALLER_LON, zona.Lat_centro, zona.Lon_centro)
Si distancia <= zona.Radio_km: distancia = 0 (zona interna, sin costo)
CostoPorViaje = round(distancia * TARIFA_KM)
CostoTraslado = CostoPorViaje * Visitas

Auto-visitas (si no fue manual):
  Si algun tipo de trabajo es Instalacion_nueva/Cambio_pano/Cambio_guias/Motorizacion: 2 visitas
  Sino: 1 visita
```

### Reparaciones

```
cambio_eje:
  - Eje PVC (ID 150, cantidad: ancho_m)
  - Polea (ID 154, cantidad: 1)
  - Tacos (ID 153, cantidad: 2)
  - Puntera chica (ID 151) si m2 <= 1.5, grande (ID 152) si m2 > 1.5
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)

cambio_cinta:
  - Cinta (ID 155, cantidad: alto + 0.5 ml)
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)

cambio_laterales:
  - Laterales (ID 159, cantidad: m2)
  - Tope lateral (ID 160, cantidad: 1)
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)

cambio_resortes:
  - Resortes (ID 158, cantidad: 1)
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)

cambio_polea_tacos:
  - Puntera chica (ID 151) o grande (ID 152) segun m2
  - Tacos (ID 153, cantidad: 2)
  - Polea (ID 154, cantidad: 1)
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)

bobinado_motor:
  - Bobinado (ID 115, cantidad: 1)
  - Mano de obra: max(materialPriceTotal * 0.5, $40000)
```

---

## Formulario del presupuesto (modal)

### Campos del encabezado

| Campo | Elemento | Obligatorio | Comportamiento |
|-------|----------|-------------|----------------|
| Cliente | Input de busqueda + select oculto | Si | Busqueda en CLIENT_MAP con dropdown. Al seleccionar, carga propiedades. |
| Propiedad | Select | No | Se filtra por cliente seleccionado. Auto-selecciona si hay una sola. |
| Zona | Select | Si | Se auto-asigna desde la propiedad (si tiene Zona_id). Se bloquea si viene de propiedad. |
| Forma de pago | Select | No | Lista de DATA.formas_pago |
| Canal | Select | No | Manual (default) o Chatbot |
| Facturacion | Select | No | con_iva (default) o sin_iva. Se auto-cambia a sin_iva si primer unidad es Reparacion/Service. |

### Bloque de unidades

Cada unidad es una tarjeta (`.unidad-card`) con:
- Ambiente (texto libre)
- Ubicacion (texto libre)
- Tipo de trabajo (select)
- Tipo reparacion (select, visible solo si Reparacion/Service)
- Accionamiento (select, oculto para Seguridad/Reparacion/Motorizacion/Cambio_pano/Cambio_guias)
- Producto base (select, oculto para Reparacion/Cambio_guias)
- Ancho (number, metros)
- Alto (number, metros)
- Cantidad (number, multiplicador)
- Altura de colocacion (number, solo visible para Interior)
- Tabla de componentes (auto-cargados + manuales)
- Instalacion: porcentaje editable + monto calculado
- Subtotal de la unidad

### Bloque de traslado

- Zona seleccionada + distancia en km
- Viatico por viaje
- Transporte (km x tarifa)
- Numero de visitas (editable, auto-calculado)
- Total traslado

### Resumen

- Subtotal de items
- Total con IVA
- Boton guardar

### Comportamiento en edicion

- Cliente, Propiedad y Zona: **bloqueados** (readonly, pointer-events none, opacidad 0.7)
- Se cargan las unidades existentes con sus componentes y precios
- Se restaura el costo de traslado si existia

---

## Generacion de PDF

### Contenido del PDF

1. **Encabezado:** logo empresa, nombre empresa, CUIT, telefono, email, web
2. **Datos del presupuesto:** numero, fecha, cliente, propiedad, zona, estado
3. **Por cada unidad:**
   - Nombre del ambiente + ubicacion
   - Dimensiones (ancho x alto)
   - Tipo de trabajo
   - Para reparaciones: tipo de reparacion como subtitulo
   - Tabla de lineas: cantidad, descripcion, precio unitario, subtotal
   - Monto de instalacion (si > 0)
4. **Totales:**
   - Subtotal neto
   - Costo traslado (si > 0)
   - IVA 21% y 10.5% (montos)
   - Total con IVA
   - Si sin_iva: total con descuento
5. **Pie:** condiciones, garantia, validez (dias), notas

### Modo de facturacion

- **con_iva:** precios mostrados con IVA incluido
- **sin_iva:** precios sin IVA, se aplica 10% de descuento al total

---

## Lista de verificacion para testing

### Crear presupuesto nuevo
- [ ] Seleccionar cliente con buscador funciona
- [ ] Al seleccionar cliente se cargan sus propiedades
- [ ] Al seleccionar propiedad se asigna zona automaticamente
- [ ] Si propiedad no tiene zona, se puede seleccionar manualmente
- [ ] Numero correlativo YYYY-NNNN no se repite aunque haya filtro activo
- [ ] Agregar unidad con producto base carga componentes automaticamente
- [ ] Motor se selecciona correctamente segun peso y categoria
- [ ] Cambiar accionamiento a manual recarga componentes sin motor
- [ ] Cambiar tipo de trabajo a Reparacion muestra selector de tipo reparacion
- [ ] Componentes de reparacion se cargan segun tipo seleccionado
- [ ] Mano de obra de reparacion se calcula correctamente
- [ ] Instalacion se calcula como % del subtotal de componentes
- [ ] Traslado se calcula por distancia haversine a zona
- [ ] Visitas se auto-ajustan segun tipo de trabajo
- [ ] Duplicar unidad copia todos los datos y componentes
- [ ] Eliminar unidad recalcula total
- [ ] Agregar componente manual con datalist funciona
- [ ] Modificar cantidad o margen recalcula precios
- [ ] Total final = items + traslado
- [ ] Guardar crea registros en Presupuestos, Unidades y Lineas
- [ ] Cliente_id, Zona_id, Propiedad_id se guardan como Number en el registro

### Editar presupuesto existente
- [ ] Cliente, propiedad y zona estan bloqueados
- [ ] Unidades existentes se cargan con sus componentes y precios
- [ ] Modificar unidad y guardar actualiza correctamente
- [ ] Agregar nueva unidad a presupuesto existente funciona
- [ ] Eliminar unidad existente funciona

### Duplicar presupuesto
- [ ] Se crea con nuevo numero correlativo
- [ ] Fecha es la de hoy
- [ ] Estado es Borrador
- [ ] Mismo cliente, zona, propiedad
- [ ] Todas las unidades y lineas copiadas
- [ ] Totales coinciden con el original

### Eliminar presupuesto
- [ ] Confirma antes de eliminar
- [ ] Elimina unidades y lineas asociadas
- [ ] El presupuesto desaparece de la lista

### Ver presupuesto
- [ ] Muestra cliente, zona, propiedad correctamente
- [ ] Muestra todas las unidades con sus componentes
- [ ] Precios coinciden con lo guardado
- [ ] Boton editar abre el modal en modo edicion
- [ ] Boton PDF genera archivo descargable

### PDF
- [ ] Encabezado con datos de empresa
- [ ] Datos del presupuesto correctos
- [ ] Unidades y lineas correctas
- [ ] Totales correctos
- [ ] Formato visual aceptable

### Lista de presupuestos
- [ ] Muestra cliente, propiedad y zona (no "-") para presupuestos con _id fields
- [ ] Paginacion funciona (20 por pagina)
- [ ] Busqueda por numero funciona
- [ ] Filtro por estado funciona
- [ ] Cambiar estado actualiza correctamente

### Dashboard
- [ ] Muestra ultimos 5 presupuestos con nombre de cliente
- [ ] Total facturado correcto
- [ ] Pendientes = Borrador + Enviado

### Performance
- [ ] La pagina NO se congela al abrir "+ Nuevo Presupuesto"
- [ ] La lista de presupuestos carga en < 3 segundos
- [ ] No se disparan mas de 5 requests HTTP al cargar la lista

---

## Orden de implementacion sugerido

1. **Script de migracion:** crear campos `Cliente_id`, `Zona_id`, `Propiedad_id` y poblarlos desde links existentes
2. **`_resolvePresupuestoLinks`:** reescribir sin `apiGetLinks` (resolucion local)
3. **`_savePresInner` (crear):** guardar `_id` fields + `apiLink` para compatibilidad
4. **`_savePresInner` (editar):** idem
5. **`duplicatePresupuesto`:** idem
6. **`fetchBudgetDeepData`:** reemplazar `apiGetLinks` de cliente/zona/propiedad por lookup local
7. **Testing completo con la checklist de arriba**
8. **Deploy**

---

## Que NO cambiar

- `autoLoadComponents` - funciona correctamente, no tiene relacion con los bugs
- `recalcUnidad` / `recalcTotal` / `recalcTraslado` - calculo de precios intacto
- `addUnidadUI` / `addCompRowWithData` / `compSelected` - UI de componentes intacta
- `selectMotor` - seleccion de motor intacta
- `generarPDF` (logica interna) - solo cambia la fuente de datos (fetchBudgetDeepData)
- `deletePresupuesto` - funciona correctamente con apiGetLinks para unidades
- `changeStatus` - funciona correctamente
- `loadPropiedadesSelect` / `updateZonaFromProp` - asignacion de propiedad/zona intacta
- `setupClientSearch` / `searchClientsAPI` - busqueda de clientes intacta
- Links LTAR para Unidades y Lineas (`cm5xv0vmlne7r6u`, `cn9406tc3q1jmw0`, `c4hnodnss6zlr32`, `czka6po5myr5wu6`) - estos SI funcionan bien porque son relaciones 1:N reales (una unidad pertenece a un solo presupuesto)
