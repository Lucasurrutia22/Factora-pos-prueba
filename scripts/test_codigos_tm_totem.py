"""
CONSULTA: Códigos que comienzan con "TM" asociados a TOTEM ANYPOS 100
Ejecutar con: python manage.py shell < scripts/test_codigos_tm_totem.py
"""

from stock.models import Producto, MovimientoInventario
from django.db.models import Q

print("\n" + "="*80)
print("BÚSQUEDA: CÓDIGOS 'TM' ASOCIADOS A TOTEM ANYPOS 100")
print("="*80 + "\n")

# ========== PASO 1: BUSCAR TOTEM ANYPOS 100 ==========
print("PASO 1: Buscando 'TOTEM ANYPOS 100'...")
print("-" * 80)

totem_productos = Producto.objects.filter(
    Q(nombre__icontains='totem') & Q(nombre__icontains='anypos') & Q(nombre__icontains='100')
)

if totem_productos.exists():
    print(f"✓ Se encontraron {totem_productos.count()} producto(s) TOTEM ANYPOS 100:\n")
    for prod in totem_productos:
        print(f"  📦 {prod.nombre}")
        print(f"     - ID: {prod.id}")
        print(f"     - SKU: {prod.sku}")
        print(f"     - Código Barra: {prod.codigo_barra}")
        print(f"     - Categoría: {prod.categoria}")
        print(f"     - Stock: {prod.cantidad}")
        print(f"     - Ubicación: {prod.ubicacion}")
        print()
else:
    print("❌ No se encontraron productos con nombre 'TOTEM ANYPOS 100'")
    print("\n   Buscando TOTEMs disponibles en el sistema:")
    totems = Producto.objects.filter(nombre__icontains='totem')
    if totems.exists():
        for totem in totems:
            print(f"   - {totem.nombre} (ID: {totem.id}, Código: {totem.codigo_barra})")
    else:
        print("   ❌ No hay TOTEMs en el sistema")

print()

# ========== PASO 2: BUSCAR CÓDIGOS QUE COMIENCEN CON "TM" ==========
print("\nPASO 2: Buscando códigos que comienzan con 'TM'...")
print("-" * 80)

codigos_tm = Producto.objects.filter(codigo_barra__istartswith='TM')

if codigos_tm.exists():
    print(f"✓ Se encontraron {codigos_tm.count()} producto(s) con código 'TM':\n")
    for prod in codigos_tm:
        print(f"  📦 {prod.nombre}")
        print(f"     - ID: {prod.id}")
        print(f"     - Código Barra: {prod.codigo_barra} ← COMIENZA CON 'TM'")
        print(f"     - SKU: {prod.sku}")
        print(f"     - Categoría: {prod.categoria}")
        print(f"     - Stock: {prod.cantidad}")
        print()
else:
    print("❌ No se encontraron códigos que comiencen con 'TM'")

print()

# ========== PASO 3: BUSCAR RELACIÓN DIRECTA ==========
print("\nPASO 3: Buscando RELACIÓN entre TOTEM y códigos TM...")
print("-" * 80)

# Si hay TOTEMs
if totem_productos.exists():
    for totem in totem_productos:
        print(f"\n📦 TOTEM: {totem.nombre} (ID: {totem.id})")
        print("-" * 40)
        
        # Movimientos de este TOTEM
        movimientos_totem = MovimientoInventario.objects.filter(producto=totem)
        
        if movimientos_totem.exists():
            print(f"   ✓ Movimientos encontrados: {movimientos_totem.count()}")
            for mov in movimientos_totem.order_by('-fecha')[:10]:  # Últimos 10
                print(f"\n     [{mov.fecha.strftime('%d/%m/%Y %H:%M')}] {mov.get_tipo_display()}")
                print(f"     Cantidad: {mov.cantidad} | Stock: {mov.stock_anterior} → {mov.stock_nuevo}")
                print(f"     Código escaneado: {mov.codigo_escaneado or 'N/A'}")
                print(f"     Usuario: {mov.usuario.username if mov.usuario else 'N/A'}")
                print(f"     Motivo: {mov.motivo or 'N/A'}")
        else:
            print(f"   ❌ Sin movimientos registrados")

print()

# ========== PASO 4: ANÁLISIS CRUZADO ==========
print("\nPASO 4: ANÁLISIS - ¿Hay códigos TM en TOTEM?")
print("-" * 80)

# Caso 1: TOTEM tiene código_barra que comienza con TM
totem_con_tm = Producto.objects.filter(
    nombre__icontains='totem',
    codigo_barra__istartswith='TM'
)

if totem_con_tm.exists():
    print(f"\n✅ HALLAZGO: Enconté TOTEMs que tienen código 'TM':\n")
    for prod in totem_con_tm:
        print(f"  📦 {prod.nombre}")
        print(f"     Código TM: {prod.codigo_barra}")
        print(f"     ✓ ASOCIACIÓN ENCONTRADA\n")
else:
    print("❌ No hay TOTEMs con código que comience con 'TM'")

# Caso 2: Productos TM que son TOTEM
productos_tm_totem = Producto.objects.filter(
    codigo_barra__istartswith='TM',
    nombre__icontains='totem'
)

if productos_tm_totem.exists():
    print(f"\n✅ HALLAZGO: Productos con código 'TM' que son TOTEMs:\n")
    for prod in productos_tm_totem:
        print(f"  📦 {prod.nombre}")
        print(f"     Código: {prod.codigo_barra}")
        print(f"     ✓ ASOCIACIÓN ENCONTRADA\n")

print()

# ========== RESUMEN ==========
print("\n" + "="*80)
print("RESUMEN EJECUTIVO")
print("="*80)

print(f"\n📊 ESTADÍSTICAS:")
print(f"   - TOTEMs en sistema: {Producto.objects.filter(nombre__icontains='totem').count()}")
print(f"   - TOTEMs 'ANYPOS 100': {totem_productos.count()}")
print(f"   - Códigos que comienzan con 'TM': {codigos_tm.count()}")
print(f"   - TOTEMs CON código 'TM': {totem_con_tm.count()}")
print(f"   - Productos 'TM' que son 'TOTEM': {productos_tm_totem.count()}")

print(f"\n🔍 BÚSQUEDA:")
print(f"   ¿Existen asoc códigos TM con TOTEM ANYPOS 100?")
if totem_con_tm.exists() or productos_tm_totem.exists():
    print(f"   ✅ SÍ - Hay asociación")
    print(f"\n   Productos TM encontrados:")
    for prod in totem_con_tm | productos_tm_totem:
        print(f"   - {prod.nombre} ({prod.codigo_barra})")
else:
    print(f"   ❌ NO - No hay asociación directa")
    print(f"\n   💡 SUGERENCIA:")
    print(f"      Si TM101723 es un código relacionado con TOTEM ANYPOS 100,")
    print(f"      considere:")
    print(f"      1. Crear producto con código 'TM101723' = TOTEM ANYPOS 100")
    print(f"      2. O asignar código 'TM101723' al TOTEM existente")

print("\n" + "="*80 + "\n")
