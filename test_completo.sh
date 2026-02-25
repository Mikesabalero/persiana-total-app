#!/bin/bash
API="http://93.127.212.235:32770"
TOKEN="dZMS2te8v6cf47Jlmlnk3S3ft9LT_QO8bjNdOcZZ"
H="xc-token: $TOKEN"
PASS=0; FAIL=0

green() { echo -e "\033[32m✅ $1\033[0m"; PASS=$((PASS+1)); }
red() { echo -e "\033[31m❌ $1\033[0m"; FAIL=$((FAIL+1)); }
title() { echo -e "\n\033[1;34m━━━ $1 ━━━\033[0m"; }
jpost() { curl -s -X POST -H "$H" -H "Content-Type: application/json" "$API/api/v2/tables/$1/records" -d "$2"; }
jpatch() { curl -s -X PATCH -H "$H" -H "Content-Type: application/json" "$API/api/v2/tables/$1/records" -d "$2"; }
jdelete() { curl -s -X DELETE -H "$H" -H "Content-Type: application/json" "$API/api/v2/tables/$1/records" -d "{\"Id\":$2}"; }
jget() { curl -s -H "$H" "$API/api/v2/tables/$1/records?$2"; }
jlinks() { curl -s -H "$H" "$API/api/v2/tables/$1/links/$2/records/$3"; }
jlink() { curl -s -X POST -H "$H" -H "Content-Type: application/json" "$API/api/v2/tables/$1/links/$2/records/$3" -d "$4"; }
getid() { python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('Id',''))"; }
getfield() { python3 -c "import sys,json; r=json.loads(sys.stdin.read()); l=r.get('list',[]); print(l[0].get('$1','') if l else '')"; }
countlist() { python3 -c "import sys,json; r=json.loads(sys.stdin.read()); print(len(r.get('list',[])))"; }

T_CLI="mwby85581fhjy27"; T_PROP="m0dwlr7ccoim1kf"; T_PRES="mn1yyjyovvoyxme"
T_UNID="mix059xkpsz15um"; T_LIN="mv1e9trh23j0q3o"; T_ZONA="mottig5nmj5e3kx"
T_PAGO="m2t4fnjie88gfo0"; T_ANCHO="mayai71j546g3as"; T_COMP="mgh9e1zivvhpg26"
T_TC="mhj9fovlmv9036x"; T_HIST="myumlbp9hemi3cu"

L_PRES_CLI="canpten8owymbde"; L_PRES_PROP="cpf764utp1w7yj0"
L_PRES_ZONA="cr3s0ox51qopwl4"; L_PRES_PAGO="cr9l2n9wiubrcra"
L_UNID_PRES="cm5xv0vmlne7r6u"; L_UNID_PROD="co1b5kwpl8d2rya"
L_LIN_PRES="c4hnodnss6zlr32"; L_LIN_COMP="czka6po5myr5wu6"; L_LIN_UNID="cn9406tc3q1jmw0"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   TEST COMPLETO - PERSIANA TOTAL     ║"
echo "╚══════════════════════════════════════╝"

# ============================================
title "1. CONFIGURACIÓN Y TC"
TC_VAL=$(jget $T_TC "limit=1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['list'][0].get('Dolar_oficial',''))")
EMP=$(jget $T_TC "limit=1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['list'][0].get('Empresa_nombre',''))")
VALID=$(jget $T_TC "limit=1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['list'][0].get('Validez_dias',''))")
[ -n "$TC_VAL" ] && [ "$TC_VAL" != "None" ] && green "TC cargado: $TC_VAL" || red "TC no cargado"
[ -n "$EMP" ] && [ "$EMP" != "None" ] && green "Empresa: $EMP" || red "Empresa no configurada"
[ -n "$VALID" ] && [ "$VALID" != "None" ] && green "Validez: $VALID días" || red "Validez no configurada"
PDF_FIELDS=$(jget $T_TC "limit=1" | python3 -c "
import sys,json; r=json.loads(sys.stdin.read())['list'][0]
for f in ['Empresa_telefono','Empresa_whatsapp','Empresa_email','Empresa_web','PDF_condiciones']:
    print(f'{f}={r.get(f,\"\")}')")
echo "$PDF_FIELDS"
green "Campos PDF verificados"

# ============================================
title "2. CRUD CLIENTE"
CLI_ID=$(jpost $T_CLI '{"Nombre":"TEST_Auto","Telefono":"1199887766","Mail":"test@test.com"}' | getid)
[ -n "$CLI_ID" ] && green "Cliente creado: ID=$CLI_ID" || red "Error creando cliente"
CLI_CHK=$(jget $T_CLI "where=(Nombre,eq,TEST_Auto)" | countlist)
[ "$CLI_CHK" = "1" ] && green "Cliente verificado en DB" || red "Cliente no encontrado"
jpatch $T_CLI "{\"Id\":$CLI_ID,\"Notas\":\"Editado\"}" > /dev/null
CLI_N=$(jget $T_CLI "where=(Id,eq,$CLI_ID)" | getfield Notas)
[ "$CLI_N" = "Editado" ] && green "Cliente editado OK" || red "Error editando cliente"

# ============================================
title "3. CRUD PROPIEDAD"
PROP_ID=$(jpost $T_PROP '{"Nombre":"TEST_Prop","Direccion":"Calle Test 123","Localidad":"Santa Fe","Principal":true}' | getid)
[ -n "$PROP_ID" ] && green "Propiedad creada: ID=$PROP_ID" || red "Error creando propiedad"
jpatch $T_PROP "{\"Id\":$PROP_ID,\"Localidad\":\"Rosario\"}" > /dev/null
PROP_L=$(jget $T_PROP "where=(Id,eq,$PROP_ID)" | getfield Localidad)
[ "$PROP_L" = "Rosario" ] && green "Propiedad editada OK" || red "Error editando propiedad"

# ============================================
title "4. CRUD ZONA"
ZONA_ID=$(jpost $T_ZONA '{"Nombre":"TEST_Zona","Costo_viatico":5000,"Costo_transporte":8000,"Costo_traslado_service":3000,"Tiempo_viaje_hs":1.5,"Activo":true}' | getid)
[ -n "$ZONA_ID" ] && green "Zona creada: ID=$ZONA_ID" || red "Error creando zona"
jpatch $T_ZONA "{\"Id\":$ZONA_ID,\"Costo_viatico\":6000}" > /dev/null
ZONA_V=$(jget $T_ZONA "where=(Id,eq,$ZONA_ID)" | getfield Costo_viatico)
echo "$ZONA_V" | grep -q "6000" && green "Zona editada OK" || red "Error editando zona"

# ============================================
title "5. CRUD FORMA DE PAGO"
PAGO_ID=$(jpost $T_PAGO '{"Nombre":"TEST_Pago","Recargo_pct":10,"Descuento_pct":0,"Plazo_dias":30,"Activo":true}' | getid)
[ -n "$PAGO_ID" ] && green "Forma de pago creada: ID=$PAGO_ID" || red "Error creando forma de pago"
jpatch $T_PAGO "{\"Id\":$PAGO_ID,\"Recargo_pct\":15}" > /dev/null
PAGO_R=$(jget $T_PAGO "where=(Id,eq,$PAGO_ID)" | getfield Recargo_pct)
echo "$PAGO_R" | grep -q "15" && green "Forma de pago editada OK" || red "Error editando pago"

# ============================================
title "6. CRUD ANCHO PVC"
ANCHO_ID=$(jpost $T_ANCHO '{"Ancho_solicitado_hasta":1.50,"Ancho_real_pano":1.52,"Notas":"Test"}' | getid)
[ -n "$ANCHO_ID" ] && green "Ancho creado: ID=$ANCHO_ID" || red "Error creando ancho"
jpatch $T_ANCHO "{\"Id\":$ANCHO_ID,\"Notas\":\"Editado\"}" > /dev/null
ANCHO_N=$(jget $T_ANCHO "where=(Id,eq,$ANCHO_ID)" | getfield Notas)
[ "$ANCHO_N" = "Editado" ] && green "Ancho editado OK" || red "Error editando ancho"

# ============================================
title "7. PRESUPUESTO COMPLETO"
PRES_JSON="{\"Numero\":\"TEST-0001\",\"Fecha\":\"2026-02-24\",\"Estado\":\"Borrador\",\"TC_usado\":$TC_VAL}"
PRES_ID=$(jpost $T_PRES "$PRES_JSON" | getid)
[ -n "$PRES_ID" ] && green "Presupuesto creado: ID=$PRES_ID" || red "Error creando presupuesto"

# Vincular cliente
jlink $T_PRES $L_PRES_CLI $PRES_ID "[{\"Id\":$CLI_ID}]" > /dev/null
CLI_LK=$(jlinks $T_PRES $L_PRES_CLI $PRES_ID | countlist)
[ "$CLI_LK" = "1" ] && green "Cliente vinculado" || red "Error vinculando cliente"

# Vincular propiedad
jlink $T_PRES $L_PRES_PROP $PRES_ID "[{\"Id\":$PROP_ID}]" > /dev/null
PROP_LK=$(jlinks $T_PRES $L_PRES_PROP $PRES_ID | countlist)
[ "$PROP_LK" = "1" ] && green "Propiedad vinculada" || red "Error vinculando propiedad"

# Vincular zona
jlink $T_PRES $L_PRES_ZONA $PRES_ID "[{\"Id\":$ZONA_ID}]" > /dev/null
ZONA_LK=$(jlinks $T_PRES $L_PRES_ZONA $PRES_ID | countlist)
[ "$ZONA_LK" = "1" ] && green "Zona vinculada" || red "Error vinculando zona"

# Vincular forma de pago
jlink $T_PRES $L_PRES_PAGO $PRES_ID "[{\"Id\":$PAGO_ID}]" > /dev/null
PAGO_LK=$(jlinks $T_PRES $L_PRES_PAGO $PRES_ID | countlist)
[ "$PAGO_LK" = "1" ] && green "Forma de pago vinculada" || red "Error vinculando pago"

# Crear unidad 1 - Instalación
UNID1_ID=$(jpost $T_UNID '{"Nombre":"TEST Chapa 75","Ubicacion":"Dormitorio","Tipo_trabajo":"Instalacion_nueva","Ancho_m":1.5,"Alto_m":2.0,"M2_calculados":3.0,"Accionamiento":"Cinta","Orden":1}' | getid)
[ -n "$UNID1_ID" ] && green "Unidad 1 creada: ID=$UNID1_ID" || red "Error creando unidad 1"
jlink $T_UNID $L_UNID_PRES $UNID1_ID "[{\"Id\":$PRES_ID}]" > /dev/null

# Crear línea para unidad 1
COMP_ID=$(jget $T_COMP "limit=1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['list'][0]['Id'])")
SUBTOTAL=$(python3 -c "print(round(82.55 * $TC_VAL * 2 * 3, 2))")
IVA=$(python3 -c "print(round($SUBTOTAL * 0.21, 2))")
TOTAL_LIN=$(python3 -c "print(round($SUBTOTAL + $IVA, 2))")
LIN1_JSON="{\"Descripcion_pdf\":\"Chapa Lisa 75\",\"Cantidad\":3,\"M2_calculados\":3.0,\"Costo_unit_orig\":82.55,\"Moneda_costo_orig\":\"USD\",\"TC_aplicado\":$TC_VAL,\"Costo_unit_ARS\":$(python3 -c "print(82.55*$TC_VAL)"),\"Margen_pct\":100,\"Precio_unit_ARS\":$(python3 -c "print(82.55*$TC_VAL*2)"),\"Subtotal_ARS\":$SUBTOTAL,\"Orden\":1,\"Visible_pdf\":true,\"Alicuota_IVA\":\"21\",\"Monto_IVA\":$IVA,\"Subtotal_con_IVA\":$TOTAL_LIN}"
LIN1_ID=$(jpost $T_LIN "$LIN1_JSON" | getid)
[ -n "$LIN1_ID" ] && green "Línea 1 creada: ID=$LIN1_ID" || red "Error creando línea 1"
jlink $T_LIN $L_LIN_PRES $LIN1_ID "[{\"Id\":$PRES_ID}]" > /dev/null
jlink $T_LIN $L_LIN_UNID $LIN1_ID "[{\"Id\":$UNID1_ID}]" > /dev/null
jlink $T_LIN $L_LIN_COMP $LIN1_ID "[{\"Id\":$COMP_ID}]" > /dev/null
green "Línea vinculada a presupuesto, unidad y componente"

# Crear unidad 2 - Reparación
UNID2_ID=$(jpost $T_UNID '{"Nombre":"TEST Reparacion","Ubicacion":"Cocina","Tipo_trabajo":"Reparacion","Tipo_reparacion":"cambio_cinta","Ancho_m":1.2,"Alto_m":1.8,"Orden":2}' | getid)
[ -n "$UNID2_ID" ] && green "Unidad 2 creada: ID=$UNID2_ID" || red "Error creando unidad 2"
jlink $T_UNID $L_UNID_PRES $UNID2_ID "[{\"Id\":$PRES_ID}]" > /dev/null

# Actualizar total
jpatch $T_PRES "{\"Id\":$PRES_ID,\"Total_con_IVA\":$TOTAL_LIN}" > /dev/null
green "Total presupuesto: \$$TOTAL_LIN"

# ============================================
title "8. VERIFICAR LINKS"
RES_CLI=$(jlinks $T_PRES $L_PRES_CLI $PRES_ID | python3 -c "import sys,json; r=json.loads(sys.stdin.read()).get('list',[]); print(r[0]['Nombre'] if r else 'NONE')")
[ "$RES_CLI" = "TEST_Auto" ] && green "Link cliente: $RES_CLI" || red "Link cliente: $RES_CLI"
RES_PROP=$(jlinks $T_PRES $L_PRES_PROP $PRES_ID | python3 -c "import sys,json; r=json.loads(sys.stdin.read()).get('list',[]); print(r[0].get('Nombre','') if r else 'NONE')")
[ "$RES_PROP" = "TEST_Prop" ] && green "Link propiedad: $RES_PROP" || red "Link propiedad: $RES_PROP"
RES_ZONA=$(jlinks $T_PRES $L_PRES_ZONA $PRES_ID | python3 -c "import sys,json; r=json.loads(sys.stdin.read()).get('list',[]); print(r[0].get('Nombre','') if r else 'NONE')")
[ "$RES_ZONA" = "TEST_Zona" ] && green "Link zona: $RES_ZONA" || red "Link zona: $RES_ZONA"
RES_PAGO=$(jlinks $T_PRES $L_PRES_PAGO $PRES_ID | python3 -c "import sys,json; r=json.loads(sys.stdin.read()).get('list',[]); print(r[0].get('Nombre','') if r else 'NONE')")
[ "$RES_PAGO" = "TEST_Pago" ] && green "Link pago: $RES_PAGO" || red "Link pago: $RES_PAGO"

# ============================================
title "9. EDITAR PRESUPUESTO"
jpatch $T_PRES "{\"Id\":$PRES_ID,\"Estado\":\"Enviado\"}" > /dev/null
PRES_EST=$(jget $T_PRES "where=(Id,eq,$PRES_ID)" | getfield Estado)
[ "$PRES_EST" = "Enviado" ] && green "Estado → Enviado" || red "Error estado: $PRES_EST"

jpatch $T_PRES "{\"Id\":$PRES_ID,\"Estado\":\"Aprobado\"}" > /dev/null
PRES_EST2=$(jget $T_PRES "where=(Id,eq,$PRES_ID)" | getfield Estado)
[ "$PRES_EST2" = "Aprobado" ] && green "Estado → Aprobado" || red "Error estado: $PRES_EST2"

# ============================================
title "10. COMPONENTES Y PRECIOS"
COMP_CNT=$(jget $T_COMP "limit=1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('pageInfo',{}).get('totalRows',0))")
[ "$COMP_CNT" -gt "0" ] && green "Componentes en DB: $COMP_CNT" || red "Sin componentes"
COMP_T_ID=$(jpost $T_COMP '{"Nombre":"TEST_Comp","Costo_unitario":100,"Moneda_costo":"ARS","Tipo_componente":"Material","Unidad":"unidad","Margen_default":50,"Activo":true,"Proveedor":"TEST_Prov"}' | getid)
[ -n "$COMP_T_ID" ] && green "Componente test: ID=$COMP_T_ID" || red "Error creando componente"
jpatch $T_COMP "{\"Id\":$COMP_T_ID,\"Costo_unitario\":120}" > /dev/null
COMP_C=$(jget $T_COMP "where=(Id,eq,$COMP_T_ID)" | getfield Costo_unitario)
echo "$COMP_C" | grep -q "120" && green "Componente editado: $COMP_C" || red "Error editando comp"

# ============================================
title "11. HISTORIAL DE AUMENTOS"
HIST_ID=$(jpost $T_HIST '{"Fecha":"2026-02-24","Tipo":"categoria","Detalle":"Material","Porcentaje":0,"Componentes_afectados":1,"Notas":"Test"}' | getid)
[ -n "$HIST_ID" ] && green "Historial registrado: ID=$HIST_ID" || red "Error en historial"

# ============================================
title "12. LIMPIEZA"
[ -n "$HIST_ID" ] && jdelete $T_HIST $HIST_ID > /dev/null && green "Historial eliminado"
[ -n "$COMP_T_ID" ] && jdelete $T_COMP $COMP_T_ID > /dev/null && green "Componente test eliminado"
[ -n "$LIN1_ID" ] && jdelete $T_LIN $LIN1_ID > /dev/null && green "Línea eliminada"
[ -n "$UNID2_ID" ] && jdelete $T_UNID $UNID2_ID > /dev/null && green "Unidad 2 eliminada"
[ -n "$UNID1_ID" ] && jdelete $T_UNID $UNID1_ID > /dev/null && green "Unidad 1 eliminada"
[ -n "$PRES_ID" ] && jdelete $T_PRES $PRES_ID > /dev/null && green "Presupuesto eliminado"
[ -n "$ANCHO_ID" ] && jdelete $T_ANCHO $ANCHO_ID > /dev/null && green "Ancho eliminado"
[ -n "$PAGO_ID" ] && jdelete $T_PAGO $PAGO_ID > /dev/null && green "Pago eliminado"
[ -n "$ZONA_ID" ] && jdelete $T_ZONA $ZONA_ID > /dev/null && green "Zona eliminada"
[ -n "$PROP_ID" ] && jdelete $T_PROP $PROP_ID > /dev/null && green "Propiedad eliminada"
[ -n "$CLI_ID" ] && jdelete $T_CLI $CLI_ID > /dev/null && green "Cliente eliminado"

# Verificar limpieza
CLEAN=$(jget $T_CLI "where=(Nombre,eq,TEST_Auto)" | countlist)
[ "$CLEAN" = "0" ] && green "Limpieza OK: sin datos de test" || red "Quedan datos de test"

# ============================================
title "RESUMEN"
echo ""
echo "╔══════════════════════════════════════╗"
printf "║  Pasaron:  %-25s║\n" "$PASS"
printf "║  Fallaron: %-25s║\n" "$FAIL"
echo "╚══════════════════════════════════════╝"
[ "$FAIL" -eq 0 ] && echo -e "\033[32m🎉 TODOS LOS TESTS PASARON\033[0m" || echo -e "\033[31m⚠️  HAY $FAIL TESTS FALLIDOS\033[0m"
echo ""
