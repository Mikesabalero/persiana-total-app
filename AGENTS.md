# Persiana Total - Contexto del Proyecto

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
- Propiedades (10) - Nombre, Direccion, linked a Clientes y Zonas
- Productos (15) - Nombre, Tipo_producto, Material
- Componentes (32) - Nombre, Tipo_componente, Costo_unitario, Moneda_costo, Margen_default, Alicuota_IVA_compra, Alicuota_IVA_venta, Proveedor
- Producto_Componentes (67) - templates de componentes por producto
- Presupuestos - Numero, Fecha, Estado, Subtotal_neto, IVA_21, IVA_105, Total_con_IVA, linked a Clientes, Zonas, Formas_Pago
- Presupuesto_Unidades - Ambiente, Ubicacion, Trabajo, linked a Presupuestos y Productos
- Presupuesto_Lineas - Cantidad, Precio_unitario, Subtotal, linked a Unidades y Componentes
- Categorias_Producto (5), Zonas (6), Formas_Pago (10), Tipo_Cambio, Servicios_Mantenimiento, Historial_Conversaciones, Anchos_Estandar_PVC

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
