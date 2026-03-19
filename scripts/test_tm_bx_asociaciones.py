"""
CONSULTA DUAL: 
1. Códigos TM asociados a TOTEM ANYPOS 100
2. Códigos BX asociados a TV BOX (TB BOX)

Ejecutar con: python manage.py shell
Luego copiar y ejecutar este código
"""

from stock.models import Producto, MovimientoInventario
from django.db.models import Q

print("\n" + "="*80)
print("BÚSQUEDA DUAL: ASOCIACIONES DE CÓDIGOS A EQUIPOS")
print("="*80)

# ==========================================
# PARTE 1: CÓDIGOS TM → TOTEM ANYPOS 100
# ==========================================
print("\n" + "▔"*80)
print("PARTE 1: CÓDIGOS TM ↔ TOTEM ANYPOS 100")
print("▔"*80 + "\n")

# Buscar TOTEM
print("1️⃣ Buscando TOTEM ANYPOS 100...")
totem = Producto.objects.filter(
    Q(nombre__icontains='totem') & Q(nombre__icontains='anypos')
).first()

if totem:
    print(f"   ✅ ENCONTRADO: {totem.nombre}")
    print(f"      - ID: {totem.id}")
    print(f"      - Código: {totem.codigo_barra or 'Sin código'}")
    print(f"      - SKU: {totem.sku}")
    print(f"      - Stock: {totem.cantidad}")
    print(f"      - Categoría: {totem.categoria}")
    
    # Verificar si tiene código TM
    tiene_tm = totem.codigo_barra and totem.codigo_barra.startswith('TM')
    print(f"      - Tiene código TM: {'✅ Sí' if tiene_tm else '❌ No'}")
else:
    print("   ❌ NO ENCONTRADO")

# Buscar productos con código TM
print("\n2️⃣ Buscando productos con código TM...")
productos_tm = Producto.objects.filter(codigo_barra__istartswith='TM')
print(f"   Encontrados: {productos_tm.count()} productos")
for prod in productos_tm:
    es_totem = 'totem' in prod.nombre.lower()
    print(f"   • {prod.codigo_barra} - {prod.nombre} {'[ES TOTEM ✅]' if es_totem else '[Otro equipo]'}")

# Resumen TM-TOTEM
print("\n3️⃣ RESUMEN - Asociación TM ↔ TOTEM:")
totem_con_tm = Producto.objects.filter(
    nombre__icontains='totem',
    codigo_barra__istartswith='TM'
).count()
print(f"   TOTEMs con código TM: {totem_con_tm}")
if totem_con_tm == 0 and totem:
    print(f"   💡 Sugerencia: Asignar código 'TM101723' a {totem.nombre}")

# ==========================================
# PARTE 2: CÓDIGOS BX → TV BOX
# ==========================================
print("\n\n" + "▔"*80)
print("PARTE 2: CÓDIGOS BX ↔ TV BOX / TB BOX")
print("▔"*80 + "\n")

# Buscar TV BOX
print("1️⃣ Buscando TV BOX...")
tvbox = Producto.objects.filter(
    Q(nombre__icontains='tv box') | Q(nombre__icontains='tb box')
).first()

if tvbox:
    print(f"   ✅ ENCONTRADO: {tvbox.nombre}")
    print(f"      - ID: {tvbox.id}")
    print(f"      - Código: {tvbox.codigo_barra or 'Sin código'}")
    print(f"      - SKU: {tvbox.sku}")
    print(f"      - Stock: {tvbox.cantidad}")
    print(f"      - Categoría: {tvbox.categoria}")
    
    # Verificar si tiene código BX
    tiene_bx = tvbox.codigo_barra and tvbox.codigo_barra.startswith('BX')
    print(f"      - Tiene código BX: {'✅ Sí' if tiene_bx else '❌ No'}")
else:
    print("   ❌ NO ENCONTRADO")

# Buscar productos con código BX
print("\n2️⃣ Buscando productos con código BX...")
productos_bx = Producto.objects.filter(codigo_barra__istartswith='BX')
print(f"   Encontrados: {productos_bx.count()} productos")
for prod in productos_bx:
    es_box = 'box' in prod.nombre.lower()
    print(f"   • {prod.codigo_barra} - {prod.nombre} {'[ES BOX ✅]' if es_box else '[Otro equipo]'}")

# Resumen BX-TVBOX
print("\n3️⃣ RESUMEN - Asociación BX ↔ TV BOX:")
tvbox_con_bx = Producto.objects.filter(
    Q(nombre__icontains='tv box') | Q(nombre__icontains='tb box'),
    codigo_barra__istartswith='BX'
).count()
print(f"   TV BOXes con código BX: {tvbox_con_bx}")
if tvbox_con_bx == 0 and tvbox:
    print(f"   💡 Sugerencia: Asignar código 'BX...' a {tvbox.nombre}")

# ==========================================
# PARTE 3: MOVIMIENTOS ASOCIADOS
# ==========================================
print("\n\n" + "▔"*80)
print("PARTE 3: MOVIMIENTOS DE MOVIMIENTOS")
print("▔"*80 + "\n")

if totem:
    print(f"📊 Movimientos de TOTEM {totem.codigo_barra}:")
    mods_totem = MovimientoInventario.objects.filter(producto=totem)
    print(f"   Total: {mods_totem.count()} movimientos")
    if mods_totem.exists():
        for mov in mods_totem.order_by('-fecha')[:3]:
            print(f"   • [{mov.fecha.strftime('%d/%m/%Y')}] {mov.get_tipo_display()} - {mov.cantidad} unidades")
    print()

if tvbox:
    print(f"📊 Movimientos de TV BOX {tvbox.codigo_barra}:")
    mods_tvbox = MovimientoInventario.objects.filter(producto=tvbox)
    print(f"   Total: {mods_tvbox.count()} movimientos")
    if mods_tvbox.exists():
        for mov in mods_tvbox.order_by('-fecha')[:3]:
            print(f"   • [{mov.fecha.strftime('%d/%m/%Y')}] {mov.get_tipo_display()} - {mov.cantidad} unidades")

# ==========================================
# PARTE 4: TABLA RESUMEN
# ==========================================
print("\n\n" + "="*80)
print("RESUMEN EJECUTIVO")
print("="*80)

resumen = f"""
┌─ CÓDIGOS TM ─────────────────────────────────────────────────────────────┐
│ Productos con código TM:           {productos_tm.count()}                      
│ TOTEMs encontrados:                {1 if totem else 0}                        
│ TOTEMs con código TM:              {totem_con_tm}                       
│ ¿Hay asociación TM-TOTEM?          {'✅ Sí' if totem_con_tm > 0 else '❌ No'}                   
└──────────────────────────────────────────────────────────────────────────┘

┌─ CÓDIGOS BX ─────────────────────────────────────────────────────────────┐
│ Productos con código BX:           {productos_bx.count()}                      
│ TV BOXes encontrados:              {1 if tvbox else 0}                        
│ TV BOXes con código BX:            {tvbox_con_bx}                       
│ ¿Hay asociación BX-TVBOX?          {'✅ Sí' if tvbox_con_bx > 0 else '❌ No'}                   
└──────────────────────────────────────────────────────────────────────────┘
"""

print(resumen)

# ==========================================
# PARTE 5: CÓDIGO PARA CREAR ASOCIACIONES
# ==========================================
print("\n" + "="*80)
print("CÓDIGO PARA CREAR ASOCIACIONES (si no existen)")
print("="*80 + "\n")

if totem and not (totem.codigo_barra and totem.codigo_barra.startswith('TM')):
    print(f"""✏️ Para asociar TM101723 a TOTEM ANYPOS 100:

totem = Producto.objects.get(id={totem.id})
totem.codigo_barra = 'TM101723'
totem.save()
print(f"✅ Código TM asignado: {{totem.codigo_barra}}")
""")

if tvbox and not (tvbox.codigo_barra and tvbox.codigo_barra.startswith('BX')):
    print(f"""✏️ Para asociar BX... a {tvbox.nombre}:

tvbox = Producto.objects.get(id={tvbox.id})
tvbox.codigo_barra = 'BX123456'  # Cambiar por código real
tvbox.save()
print(f"✅ Código BX asignado: {{tvbox.codigo_barra}}")
""")

print("\n" + "="*80 + "\n")
