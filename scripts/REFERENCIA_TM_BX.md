"""
╔══════════════════════════════════════════════════════════════════════════════╗
║         ASOCIACIONES DE CÓDIGOS DE BARRA A EQUIPOS EN PYTHON               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Estructura:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    ┌─────────────────────────────────────────────────────────────────────┐
    │                          ASOCIACIÓN TM-TOTEM                        │
    ├─────────────────────────────────────────────────────────────────────┤
    │                                                                      │
    │  Producto (Tabla: stock_producto)                                   │
    │  ┌────────────────────────────────────────────────────────────┐    │
    │  │ nombre = "TOTEM ANYPOS 100"                                │    │
    │  │ sku = "TOTEM-001" or AUTO-GENERATED                        │    │
    │  │ codigo_barra = "TM101723" ← CÓDIGO ESCANEADO              │    │
    │  │ categoria = "Equipos" or "Totems"                          │    │
    │  │ cantidad = 1                                               │    │
    │  │ ubicacion = "Bodega A - Mostrador"                         │    │
    │  │ precio = 3500.00                                           │    │
    │  └────────────────────────────────────────────────────────────┘    │
    │                                                                      │
    │  Movimientos Asociados:                                             │
    │  • ENTRADA de 1 unidad → Stock: 0 → 1                             │
    │  • SALIDA de 1 unidad → Stock: 1 → 0                              │
    │  • AJUSTE...                                                        │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────┐
    │                          ASOCIACIÓN BX-TVBOX                        │
    ├─────────────────────────────────────────────────────────────────────┤
    │                                                                      │
    │  Producto (Tabla: stock_producto)                                   │
    │  ┌────────────────────────────────────────────────────────────┐    │
    │  │ nombre = "TV BOX / TB BOX"                                 │    │
    │  │ sku = "TVBOX-001" or AUTO-GENERATED                        │    │
    │  │ codigo_barra = "BX101723" ← CÓDIGO ESCANEADO              │    │
    │  │ categoria = "Equipos" or "TV Box"                          │    │
    │  │ cantidad = 5                                               │    │
    │  │ ubicacion = "Bodega B - Estante 2"                         │    │
    │  │ precio = 150.00                                            │    │
    │  └────────────────────────────────────────────────────────────┘    │
    │                                                                      │
    │  Movimientos Asociados:                                             │
    │  • ENTRADA de 50 unidades → Stock: 0 → 50                         │
    │  • SALIDA de 45 unidades → Stock: 50 → 5                          │
    │  • DEVOLUCION de 3 unidades → Stock: 5 → 8                        │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CÓDIGO PYTHON PARA VERIFICAR Y CREAR ASOCIACIONES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Script 1: VERIFICAR ASOCIACIÓN TM-TOTEM
# ─────────────────────────────────────


from stock.models import Producto
from django.db.models import Q

# Buscar TOTEM ANYPOS 100
totem = Producto.objects.filter(
    Q(nombre__icontains='totem') & Q(nombre__icontains='anypos')
).first()

if totem:
    print(f"✅ Encontrado: {totem.nombre}")
    print(f"   Código: {totem.codigo_barra}")
    print(f"   Tiene TM: {totem.codigo_barra.startswith('TM') if totem.codigo_barra else False}")

    # VER MOVIMIENTOS
    movimientos = totem.movimientos.all()  # Usa related_name='movimientos'
    print(f"\n   Movimientos: {movimientos.count()}")
    for mov in movimientos:
        print(f"   • {mov.get_tipo_display()} - {mov.cantidad} unidades")
else:
    print("❌ TOTEM no encontrado")


# Script 2: VERIFICAR ASOCIACIÓN BX-TVBOX
# ──────────────────────────────────────


from stock.models import Producto

# Buscar TV BOX
tvbox = Producto.objects.filter(
    Q(nombre__icontains='tv box') | Q(nombre__icontains='tb box')
).first()

if tvbox:
    print(f"✅ Encontrado: {tvbox.nombre}")
    print(f"   Código: {tvbox.codigo_barra}")
    print(f"   Tiene BX: {tvbox.codigo_barra.startswith('BX') if tvbox.codigo_barra else False}")

    # VER MOVIMIENTOS
    movimientos = tvbox.movimientos.all()
    print(f"\n   Movimientos: {movimientos.count()}")
    for mov in movimientos:
        print(f"   • {mov.get_tipo_display()} - {mov.cantidad} unidades")
else:
    print("❌ TV BOX no encontrado")


# Script 3: CREAR ASOCIACIONES (si no existen)
# ─────────────────────────────────────────────


from stock.models import Producto

# CREAR / ACTUALIZAR TOTEM con código TM
totem, created = Producto.objects.update_or_create(
    nombre='TOTEM ANYPOS 100',
    defaults={
        'codigo_barra': 'TM101723',
        'sku': 'TOTEM-001',
        'categoria': 'Equipos',
        'cantidad': 1,
        'ubicacion': 'Bodega',
        'precio': 3500.00
    }
)
print(f"✅ TOTEM: {totem.codigo_barra} - {'Creado' if created else 'Actualizado'}")

# CREAR / ACTUALIZAR TV BOX con código BX
tvbox, created = Producto.objects.update_or_create(
    nombre='TV BOX',
    defaults={
        'codigo_barra': 'BX101723',
        'sku': 'TVBOX-001',
        'categoria': 'Equipos',
        'cantidad': 5,
        'ubicacion': 'Bodega',
        'precio': 150.00
    }
)
print(f"✅ TV BOX: {tvbox.codigo_barra} - {'Creado' if created else 'Actualizado'}")


# Script 4: LISTAR TODOS LOS CÓDIGOS TM Y BX
# ────────────────────────────────────────────


from stock.models import Producto

# CÓDIGOS TM
print("CÓDIGOS TM:")
tm_prods = Producto.objects.filter(codigo_barra__istartswith='TM')
for prod in tm_prods:
    print(f"  • {prod.codigo_barra} - {prod.nombre}")

# CÓDIGOS BX
print("\nCÓDIGOS BX:")
bx_prods = Producto.objects.filter(codigo_barra__istartswith='BX')
for prod in bx_prods:
    print(f"  • {prod.codigo_barra} - {prod.nombre}")


# Script 5: VER MOVIMIENTOS DE TOTEM Y TV BOX
# ────────────────────────────────────────────


from stock.models import MovimientoInventario

# Para TOTEM
print("MOVIMIENTOS DE TOTEM:")
mods_totem = MovimientoInventario.objects.filter(
    producto__codigo_barra__startswith='TM'
)
for mov in mods_totem.order_by('-fecha'):
    print(f"  • [{mov.fecha.strftime('%d/%m/%Y')}] {mov.get_tipo_display()}: "
          f"{mov.cantidad} unidades (Stock: {mov.stock_anterior}→{mov.stock_nuevo})")

# Para TV BOX
print("\nMOVIMIENTOS DE TV BOX:")
mods_tvbox = MovimientoInventario.objects.filter(
    producto__codigo_barra__startswith='BX'
)
for mov in mods_tvbox.order_by('-fecha'):
    print(f"  • [{mov.fecha.strftime('%d/%m/%Y')}] {mov.get_tipo_display()}: "
          f"{mov.cantidad} unidades (Stock: {mov.stock_anterior}→{mov.stock_nuevo})")


# Script 6: AUDITORÍA COMPLETA - Tabla resumen
# ──────────────────────────────────────────────


from stock.models import Producto, MovimientoInventario

print("\n" + "="*70)
print("AUDITORÍA DE CÓDIGOS Y ASOCIACIONES")
print("="*70)

# Estadísticas
tm_count = Producto.objects.filter(codigo_barra__istartswith='TM').count()
bx_count = Producto.objects.filter(codigo_barra__istartswith='BX').count()

print(f"\nTOTAL DE PRODUCTOS:")
print(f"  Códigos TM:  {tm_count}")
print(f"  Códigos BX:  {bx_count}")

print(f"\nMOVIMIENTOS POR TIPO:")
for tipo in ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION', 'TRANSFERENCIA']:
    count = MovimientoInventario.objects.filter(tipo=tipo).count()
    if count > 0:
        print(f"  {tipo}: {count}")

print(f"\nULTIMOS MOVIMIENTOS (últimos 5):")
for mov in MovimientoInventario.objects.all().order_by('-fecha')[:5]:
    print(f"  • {mov.fecha.strftime('%d/%m %H:%M')} - "
          f"{mov.producto.nombre} - "
          f"{mov.get_tipo_display()}: {mov.cantidad}")

print("\n" + "="*70)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMEN DE MODELOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Producto(models.Model):
    nombre = CharField                    # "TOTEM ANYPOS 100" or "TV BOX"
    sku = CharField                       # "TOTEM-001" or Auto-generated
    codigo_barra = CharField + unique     # "TM101723" or "BX101723" ← CLAVE
    categoria = CharField                 # "Equipos", "Totems", etc
    precio = DecimalField
    cantidad = IntegerField               # Stock actual
    ubicacion = CharField                 # Ubicación en bodega
    created_at = DateTimeField
    
    # El modelo Producto se relaciona con MovimientoInventario via ForeignKey
    # Acceso: producto.movimientos.all()  (usa related_name)


class MovimientoInventario(models.Model):
    producto = ForeignKey(Producto)                    # ← Asociación clave
    usuario = ForeignKey(User)
    tipo = CharField(ENTRADA|SALIDA|AJUSTE|DEVOLUCION)
    cantidad = IntegerField
    stock_anterior = IntegerField
    stock_nuevo = IntegerField
    motivo = TextField
    referencia_externa = CharField                     # PO, Factura, etc
    codigo_escaneado = CharField                       # Código exacto escaneado
    fecha = DateTimeField(auto_now_add)
    fecha_actualizacion = DateTimeField(auto_now)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

# PARA COPIAR Y EJECUTAR EN DJANGO SHELL:
# python manage.py shell
# exec(open('scripts/tm_bx_directo.py').read())
