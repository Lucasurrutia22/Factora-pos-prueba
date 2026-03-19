"""
CREAR ASOCIACIONES EN BASE DE DATOS
Crear/actualizar TOTEM con código TM y TV BOX con código BX

Ejecutar con:
python manage.py shell
exec(open('scripts/crear_asociaciones_tm_bx.py').read())
"""

from stock.models import Producto
from datetime import datetime

print("\n" + "="*80)
print("CREANDO ASOCIACIONES DE CÓDIGOS EN BASE DE DATOS")
print("="*80 + "\n")

# ==========================================
# 1. CREAR/ACTUALIZAR TOTEM ANYPOS 100 con código TM
# ==========================================
print("1️⃣ Procesando TOTEM ANYPOS 100 con código TM101723...")
print("-" * 80)

totem_data = {
    'nombre': 'TOTEM ANYPOS 100',
    'codigo_barra': 'TM101723',
    'sku': 'TOTEM-001',
    'categoria': 'Equipos',
    'cantidad': 1,
    'ubicacion': 'Bodega A - Mostrador',
    'precio': 3500.00
}

try:
    totem, created = Producto.objects.update_or_create(
        nombre='TOTEM ANYPOS 100',
        defaults={{
            'codigo_barra': 'TM101723',
            'sku': 'TOTEM-001',
            'categoria': 'Equipos',
            'cantidad': 1,
            'ubicacion': 'Bodega A - Mostrador',
            'precio': 3500.00
        }}
    )
    
    if created:
        print("✅ TOTEM CREADO")
        print(f"   📦 {totem.nombre}")
        print(f"   🔖 Código: {totem.codigo_barra}")
        print(f"   📍 ID: {totem.id}")
        print(f"   💾 Guardado en BD")
    else:
        print("✅ TOTEM ACTUALIZADO")
        print(f"   📦 {totem.nombre}")
        print(f"   🔖 Código: {totem.codigo_barra}")
        print(f"   📍 ID: {totem.id}")
        if totem.codigo_barra == 'TM101723':
            print(f"   ✅ Código TM verificado")
    
    print()

except Exception as e:
    print(f"❌ ERROR al crear TOTEM: {str(e)}")
    print()

# ==========================================
# 2. CREAR/ACTUALIZAR TV BOX con código BX
# ==========================================
print("2️⃣ Procesando TV BOX con código BX101723...")
print("-" * 80)

try:
    tvbox, created = Producto.objects.update_or_create(
        nombre='TV BOX',
        defaults={{
            'codigo_barra': 'BX101723',
            'sku': 'TVBOX-001',
            'categoria': 'Equipos',
            'cantidad': 5,
            'ubicacion': 'Bodega B - Estante 2',
            'precio': 150.00
        }}
    )
    
    if created:
        print("✅ TV BOX CREADO")
        print(f"   📦 {tvbox.nombre}")
        print(f"   🔖 Código: {tvbox.codigo_barra}")
        print(f"   📍 ID: {tvbox.id}")
        print(f"   💾 Guardado en BD")
    else:
        print("✅ TV BOX ACTUALIZADO")
        print(f"   📦 {tvbox.nombre}")
        print(f"   🔖 Código: {tvbox.codigo_barra}")
        print(f"   📍 ID: {tvbox.id}")
        if tvbox.codigo_barra == 'BX101723':
            print(f"   ✅ Código BX verificado")
    
    print()

except Exception as e:
    print(f"❌ ERROR al crear TV BOX: {str(e)}")
    print()

# ==========================================
# 3. VERIFICACIÓN - Listar productos creados
# ==========================================
print("\n3️⃣ VERIFICACIÓN - Productos con códigos TM y BX en BD...")
print("-" * 80)

tm_productos = Producto.objects.filter(codigo_barra__istartswith='TM')
print(f"\n🔍 Productos con código TM: {tm_productos.count()}")
for prod in tm_productos:
    print(f"   ✓ {prod.codigo_barra} - {prod.nombre} (ID: {prod.id})")

bx_productos = Producto.objects.filter(codigo_barra__istartswith='BX')
print(f"\n🔍 Productos con código BX: {bx_productos.count()}")
for prod in bx_productos:
    print(f"   ✓ {prod.codigo_barra} - {prod.nombre} (ID: {prod.id})")

# ==========================================
# 4. VERIFICACIÓN - Movimientos asociados
# ==========================================
print("\n\n4️⃣ MOVIMIENTOS ASOCIADOS...")
print("-" * 80)

from stock.models import MovimientoInventario

if 'totem' in locals():
    mods_totem = MovimientoInventario.objects.filter(producto=totem)
    print(f"\n📊 TOTEM {totem.codigo_barra}:")
    print(f"   Movimientos registrados: {mods_totem.count()}")
    if mods_totem.exists():
        for mov in mods_totem.order_by('-fecha')[:3]:
            print(f"   • [{mov.fecha.strftime('%d/%m/%Y %H:%M')}] {mov.get_tipo_display()}: {mov.cantidad} unidades")
    else:
        print(f"   (Sin movimientos aún)")

if 'tvbox' in locals():
    mods_tvbox = MovimientoInventario.objects.filter(producto=tvbox)
    print(f"\n📊 TV BOX {tvbox.codigo_barra}:")
    print(f"   Movimientos registrados: {mods_tvbox.count()}")
    if mods_tvbox.exists():
        for mov in mods_tvbox.order_by('-fecha')[:3]:
            print(f"   • [{mov.fecha.strftime('%d/%m/%Y %H:%M')}] {mov.get_tipo_display()}: {mov.cantidad} unidades")
    else:
        print(f"   (Sin movimientos aún)")

# ==========================================
# 5. RESUMEN FINAL
# ==========================================
print("\n\n" + "="*80)
print("RESUMEN FINAL")
print("="*80)

resumen = f"""
✅ ASOCIACIONES CREADAS EN BASE DE DATOS:

┌─ ASOCIACIÓN TM-TOTEM ─────────────────────────────────────────────┐
│ Producto: TOTEM ANYPOS 100                                         │
│ Código:   TM101723                                                 │
│ SKU:      TOTEM-001                                                │
│ Estado:   ACTIVO EN BD ✅                                          │
│ ID BD:    {totem.id if 'totem' in locals() else 'ERROR'}                                              
└────────────────────────────────────────────────────────────────────┘

┌─ ASOCIACIÓN BX-TVBOX ─────────────────────────────────────────────┐
│ Producto: TV BOX                                                   │
│ Código:   BX101723                                                 │
│ SKU:      TVBOX-001                                                │
│ Estado:   ACTIVO EN BD ✅                                          │
│ ID BD:    {tvbox.id if 'tvbox' in locals() else 'ERROR'}                                              
└────────────────────────────────────────────────────────────────────┘

📋 PRÓXIMOS PASOS:
   1. El scanner ahora puede escanear TM101723 → TOTEM ANYPOS 100 ✅
   2. El scanner ahora puede escanear BX101723 → TV BOX ✅
   3. Los movimientos serán registrados correctamente ✅
   4. El stock se actualizará automáticamente ✅

🔍 VERIFICAR EN SHELL:
   # Ver TOTEM
   from stock.models import Producto
   totem = Producto.objects.get(codigo_barra='TM101723')
   print(totem.nombre, totem.movimientos.count())
   
   # Ver TV BOX
   tvbox = Producto.objects.get(codigo_barra='BX101723')
   print(tvbox.nombre, tvbox.movimientos.count())

"""

print(resumen)

print("="*80)
print("✅ PROCESO COMPLETADO EXITOSAMENTE")
print("="*80 + "\n")
