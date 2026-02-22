---
name: persiana-erp-developer
description: Usar esta skill para CUALQUIER modificacion a la aplicacion Persiana Total ERP. Incluye correccion de bugs, nuevas funcionalidades, cambios de UI, operaciones con NocoDB API, generacion de PDF y logica de precarga de componentes. Activar SIEMPRE al trabajar con app.js, index.html o styles.css del proyecto persiana-app.
---

# Persiana Total ERP - Skill de Desarrollo

## Objetivo
Asegurar que cada cambio al ERP de Persiana Total sea correcto, probado y pusheado sin romper funcionalidad existente.

## Descripcion del Proyecto
- App: Aplicacion de presupuestos para cortinas y persianas (Persiana Total)
- Stack: Vanilla JS (app.js), HTML (index.html), CSS (styles.css), servido por Express (server.js)
- Backend: NocoDB REST API en http://93.127.212.235:32770/api/v2
- Token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ
- Servidor: http://93.127.212.235:3000
- Repositorio: /root/persiana-app

## Checklist OBLIGATORIO antes de escribir codigo

### Paso 1: Voy a verificar nombres de campos en NocoDB
Antes de hacer cualquier POST o PATCH a NocoDB, voy a ejecutar:
curl -s -H "xc-token: dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ" "http://93.127.212.235:32770/api/v2/meta/tables/TABLE_ID" | python3 -c "import sys,json; [print(c['title'], '|', c['uidt'], '|', c.get('dtxp','')) for c in json.loads(sys.stdin.read())['columns']]"
Voy a usar los nombres EXACTOS que devuelve la API. No voy a adivinar nombres de campos.

### Paso 2: Voy a entender la estructura actual del codigo
Antes de modificar una funcion, voy a leerla primero:
grep -n "function NOMBRE_FUNCION" /root/persiana-app/app.js
sed -n 'INICIO,FINp' /root/persiana-app/app.js

### Paso 3: Voy a contar funciones antes de los cambios
grep -c "function " /root/persiana-app/app.js
Voy a guardar este numero. Despues de los cambios, debe ser igual o mayor.

## Checklist OBLIGATORIO despues de cada cambio (antes de CADA commit)

### Paso 1: Voy a verificar sintaxis
node -c /root/persiana-app/app.js
Si falla, voy a corregir el error antes de continuar. No voy a commitear con errores de sintaxis.

### Paso 2: Voy a verificar que la app carga
curl -s http://localhost:3000 | grep -c "showPage"
Debe devolver >= 1. Si devuelve 0, la app esta rota y voy a corregirlo.

### Paso 3: Voy a verificar cantidad de funciones
grep -c "function " /root/persiana-app/app.js
Voy a comparar con el Paso 3 del checklist previo. Si es menor, voy a investigar que se borro accidentalmente.

### Paso 4: Voy a eliminar logs de debug
grep -n "console.log" /root/persiana-app/app.js | grep -i "debug\|test\|TODO"
Voy a eliminar cualquier console.log temporal de diagnostico.

### Paso 5: Voy a commitear y pushear
git add -A && git commit -m "MENSAJE" && git push
Siempre voy a pushear. No voy a dejar commits sin pushear.

## Errores Comunes (voy a evitar estos)

### Error 1: Nombres de campos incorrectos en NocoDB
Ya paso 4 veces que el POST devolvio 400 porque los nombres de campos no coincidian. Voy a SIEMPRE consultar la API antes de escribir POST o PATCH.

### Error 2: Variables no definidas por scope incorrecto
Ya paso con editPresId. Cuando necesite una variable compartida entre funciones, voy a declararla como variable global al inicio del archivo.

### Error 3: Modales que se superponen
Cuando abro un modal desde otro modal, voy a cerrar el primero antes de abrir el segundo.

### Error 4: Commits sin pushear
Voy a ejecutar siempre git push despues del commit y verificar que fue exitoso.

### Error 5: Funciones borradas accidentalmente
Voy a contar funciones antes y despues para detectar esto.

### Error 6: Select con valores que no coinciden con NocoDB
Los campos SingleSelect solo aceptan valores especificos. Voy a verificar los valores permitidos antes de crear selects.

### Error 7: Links de NocoDB mal vinculados
Voy a verificar si se usa foreign key directo o apiLink y usar el metodo correcto.

## IDs de Tablas NocoDB (referencia)
- Clientes: mwby85581fhjy27
- Propiedades: m0dwlr7ccoim1kf
- Categorias: mulo5ve82d9ex7q
- Productos: mdr6mo695g0qz6d
- Componentes: mgh9e1zivvhpg26
- Prod_Comp: mmjzqw7v4que9q3
- Tipo Cambio: mhj9fovlmv9036x
- Zonas: mottig5nmj5e3kx
- Presupuestos: mn1yyjyovvoyxme
- Lineas: mv1e9trh23j0q3o
- Formas Pago: m2t4fnjie88gfo0
- Unidades: mix059xkpsz15um
- Anchos: mayai71j546g3as

## IDs de Motores (no voy a cambiar estos)
- Tubular 60: ID 56
- Tubular 140: ID 55
- Paralelo 600: ID 50
- Paralelo 700: ID 51
- Paralelo 800: ID 52
- Paralelo 1000: ID 53
- Paralelo 1500: ID 54

## IDs de Componentes Clave
- Ejes: 4pulgadas (147), 5pulgadas (148), 7.5pulgadas (149), 70mm (150)
- Guias: 60x50 (60), 100x60 (61), Aluminio (63)
- Kit Remoto: 58
- Enrolladores: 4 (120), 6 (121), 8 (122)
- Cajas enrollador: 4 (126), 6 (127), 8 (157)
- Soportes: 129
- Antognetti: A2 (136), A3 (137)
- Polea: Chica (151), Grande (152)
- Tacos: 153, Puntas eje: 154, Cinta: 155, Canio cinta: 156
- Corazon: 161, Resorte 45mm: 158
- Cambio laterales: 159, Adicional flejes: 160

## IDs de Mano de Obra
- Base Seguridad: 92
- Base Exterior: 93
- Base Interior: 94
- Plus tamanio grande: 95
- Plus motor: 96
- Plus guias: 97
- Base motorizacion: 102
- Plus cableado: 103

## Reglas Criticas
1. No voy a modificar selectMotor() salvo que se pida explicitamente
2. No voy a modificar la logica existente de precarga Seguridad/Exterior salvo que se pida
3. No voy a cambiar IDs de motores ni de componentes
4. No voy a modificar la generacion de PDF salvo que se pida explicitamente
5. No voy a modificar funciones de guardado/carga salvo que se pida
6. Al agregar nuevas funcionalidades, voy a agregarlas en bloques NUEVOS de codigo
7. Siempre voy a usar addCompRowWithData() para agregar filas de componentes
8. Todos los precios en ARS salvo que se indique lo contrario
9. IVA por defecto: 21%

## Restricciones
- Esta es una app en PRODUCCION usada por personas reales
- Cada error de sintaxis rompe TODA la aplicacion
- Voy a probar los cambios exhaustivamente antes de pushear
- Si no estoy seguro de un nombre de campo, voy a consultar la API primero
- No voy a borrar funciones accidentalmente al editar codigo cercano
