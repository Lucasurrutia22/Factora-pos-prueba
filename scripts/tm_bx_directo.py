"""
CÓDIGO PARA COPIAR Y PEGAR EN DJANGO SHELL

Ejecutar:
python manage.py shell

Luego copiar cada sección y pegar en el shell
"""

# ===============================================
# SECCIÓN 1: VERIFICAR CÓDIGOS TM → TOTEM
# ===============================================
print("\n" + "="*70)
print("BÚSQUEDA 1: CÓDIGOS TM ↔ TOTEM ANYPOS 100")
print("="*70 + "\n")

from stock.models import Producto
from django.db.models import Q

# Buscar TOTEM
print("1. TOTEM ANYPOS 100:")
totem = Producto.objects.filter(
    Q(nombre__icontains='totem') & Q(nombre__icontains='anypos')
).first()

if totem:
    print(f"   ✅ {totem.nombre}")
    print(f"      Código: {totem.codigo_barra or 'Sin código'}")
    print(f"      Es TM: {'✅' if totem.codigo_barra and totem.codigo_barra.startswith('TM') else '❌'}")
else:
    print("   ❌ No encontrado")

# Buscar todos los TM
print("\n2. Productos con código TM:")
tm_productos = Producto.objects.filter(codigo_barra__istartswith='TM')
if tm_productos.exists():
    for p in tm_productos:
        print(f"   • {p.codigo_barra} - {p.nombre}")
else:
    print("   (Sin productos TM)")


# ===============================================
# SECCIÓN 2: VERIFICAR CÓDIGOS BX → TV BOX
# ===============================================
print("\n" + "="*70)
print("BÚSQUEDA 2: CÓDIGOS BX ↔ TV BOX / TB BOX")
print("="*70 + "\n")

# Buscar TV BOX
print("1. TV BOX / TB BOX:")
tvbox = Producto.objects.filter(
    Q(nombre__icontains='tv box') | Q(nombre__icontains='tb box')
).first()

if tvbox:
    print(f"   ✅ {tvbox.nombre}")
    print(f"      Código: {tvbox.codigo_barra or 'Sin código'}")
    print(f"      Es BX: {'✅' if tvbox.codigo_barra and tvbox.codigo_barra.startswith('BX') else '❌'}")
else:
    print("   ❌ No encontrado")

# Buscar todos los BX
print("\n2. Productos con código BX:")
bx_productos = Producto.objects.filter(codigo_barra__istartswith='BX')
if bx_productos.exists():
    for p in bx_productos:
        print(f"   • {p.codigo_barra} - {p.nombre}")
else:
    print("   (Sin productos BX)")


# ===============================================
# SECCIÓN 3: CREAR ASOCIACIONES (si no existen)
# ===============================================
print("\n" + "="*70)
print("CREAR ASOCIACIONES")
print("="*70 + "\n")

# Crear asociación TM → TOTEM
if totem and not (totem.codigo_barra and totem.codigo_barra.startswith('TM')):
    print("1. Asignando código TM101723 a TOTEM ANYPOS 100...")
    totem.codigo_barra = 'TM101723'
    totem.save()
    print(f"   ✅ Asignado: {totem.codigo_barra}")
elif totem:
    print(f"1. TOTEM ya tiene código TM: {totem.codigo_barra}")

# Crear asociación BX → TV BOX
if tvbox and not (tvbox.codigo_barra and tvbox.codigo_barra.startswith('BX')):
    print("\n2. Asignando código BX a TV BOX...")
    # Pregunta: ¿Qué código BX específico usar?
    # Ejemplo: BX101723, BX202324, etc.
    bx_code = 'BX101723'  # Cambiar si es necesario
    tvbox.codigo_barra = bx_code
    tvbox.save()
    print(f"   ✅ Asignado: {tvbox.codigo_barra}")
elif tvbox:
    print(f"\n2. TV BOX ya tiene código BX: {tvbox.codigo_barra}")


# ===============================================
# SECCIÓN 4: MOSTRAR MOVIMIENTOS
# ===============================================
print("\n" + "="*70)
print("MOVIMIENTOS REGISTRADOS")
print("="*70 + "\n")

from stock.models import MovimientoInventario

if totem:
    print(f"TOTEM {totem.codigo_barra}:")
    mods = MovimientoInventario.objects.filter(producto=totem)
    print(f"  Total movimientos: {mods.count()}")
    for mov in mods.order_by('-fecha')[:5]:
        print(f"  • {mov.fecha.strftime('%d/%m %H:%M')} - {mov.get_tipo_display()} - {mov.cantidad} unidades")
    print()

if tvbox:
    print(f"TV BOX {tvbox.codigo_barra}:")
    mods = MovimientoInventario.objects.filter(producto=tvbox)
    print(f"  Total movimientos: {mods.count()}")
    for mov in mods.order_by('-fecha')[:5]:
        print(f"  • {mov.fecha.strftime('%d/%m %H:%M')} - {mov.get_tipo_display()} - {mov.cantidad} unidades")
