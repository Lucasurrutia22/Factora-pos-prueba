"""
SCRIPT DE PRUEBA PARA MOVIMIENTOS DE INVENTARIO
Ejecutar con: python manage.py shell < scripts/test_movimientos_completo.py
"""

from django.contrib.auth.models import User
from stock.models import Producto, Categoria
from stock.models_movimientos import MovimientoInventario
from django.utils import timezone

print("\n" + "="*70)
print("PRUEBA COMPLETA DE MOVIMIENTOS DE INVENTARIO")
print("="*70 + "\n")

# 1. CREAR USUARIO DE PRUEBA
print("1. Creando usuario de prueba...")
user, created = User.objects.get_or_create(
    username='prueba_inventario',
    defaults={
        'email': 'prueba@factora.com',
        'first_name': 'Usuario',
        'last_name': 'Prueba'
    }
)
print(f"   ✓ Usuario: {user.username} ({'creado' if created else 'existente'})\n")

# 2. CREAR CATEGORÍA DE PRUEBA
print("2. Creando categoría de prueba...")
categoria, created = Categoria.objects.get_or_create(
    nombre='Productos de Prueba',
    defaults={'descripcion': 'Categoría para pruebas de movimiento'}
)
print(f"   ✓ Categoría: {categoria.nombre}\n")

# 3. CREAR PRODUCTOS DE PRUEBA
print("3. Creando productos de prueba...")
productos_datos = [
    {
        'codigo': 'TEST-001',
        'nombre': 'Laptop de Prueba',
        'descripcion': 'Laptop para pruebas de movimiento',
        'precio_costo': 500.00,
        'precio_venta': 800.00,
        'stock': 0
    },
    {
        'codigo': 'TEST-002',
        'nombre': 'Mouse de Prueba',
        'descripcion': 'Mouse para pruebas de movimiento',
        'precio_costo': 10.00,
        'precio_venta': 15.00,
        'stock': 0
    },
    {
        'codigo': 'TEST-003',
        'nombre': 'Teclado de Prueba',
        'descripcion': 'Teclado para pruebas de movimiento',
        'precio_costo': 25.00,
        'precio_venta': 40.00,
        'stock': 0
    }
]

productos = []
for datos in productos_datos:
    producto, created = Producto.objects.get_or_create(
        codigo=datos['codigo'],
        defaults={
            'nombre': datos['nombre'],
            'descripcion': datos['descripcion'],
            'categoria': categoria,
            'precio_costo': datos['precio_costo'],
            'precio_venta': datos['precio_venta'],
            'stock': datos['stock']
        }
    )
    productos.append(producto)
    print(f"   ✓ {producto.codigo}: {producto.nombre} (Stock: {producto.stock})")

print()

# 4. PRUEBA 1: ENTRADA DE STOCK (Compra a proveedor)
print("4. PRUEBA 1 - ENTRADA DE STOCK (Compra a proveedor):")
print("   Comprando 10 Laptops a proveedor...")

producto1 = productos[0]
stock_anterior = producto1.stock

# Registrar movimiento
movimiento_entrada = MovimientoInventario.objects.create(
    producto=producto1,
    usuario=user,
    tipo='ENTRADA',
    cantidad=10,
    stock_anterior=stock_anterior,
    stock_nuevo=stock_anterior + 10,
    motivo='Compra a proveedor DELL',
    referencia_externa='OC-2026-001'
)

# Actualizar stock del producto
producto1.stock = stock_anterior + 10
producto1.save()

print(f"   ✓ Movimiento registrado:")
print(f"     - ID: {movimiento_entrada.id}")
print(f"     - Tipo: {movimiento_entrada.tipo}")
print(f"     - Stock anterior: {stock_anterior}")
print(f"     - Cantidad: +{movimiento_entrada.cantidad}")
print(f"     - Stock nuevo: {producto1.stock}")
print(f"     - Referencia: {movimiento_entrada.referencia_externa}\n")

# 5. PRUEBA 2: SALIDA DE STOCK (Venta)
print("5. PRUEBA 2 - SALIDA DE STOCK (Venta):")
print("   Vendiendo 3 Laptops a cliente...")

stock_anterior = producto1.stock
movimiento_salida = MovimientoInventario.objects.create(
    producto=producto1,
    usuario=user,
    tipo='SALIDA',
    cantidad=3,
    stock_anterior=stock_anterior,
    stock_nuevo=stock_anterior - 3,
    motivo='Venta a cliente mayorista',
    referencia_externa='FC-2026-150'
)

producto1.stock = stock_anterior - 3
producto1.save()

print(f"   ✓ Movimiento registrado:")
print(f"     - Tipo: {movimiento_salida.tipo}")
print(f"     - Stock anterior: {stock_anterior}")
print(f"     - Cantidad: -{movimiento_salida.cantidad}")
print(f"     - Stock nuevo: {producto1.stock}")
print(f"     - Referencia: {movimiento_salida.referencia_externa}\n")

# 6. PRUEBA 3: AJUSTE DE INVENTARIO (Inventario físico)
print("6. PRUEBA 3 - AJUSTE DE INVENTARIO (Inventario físico):")
print("   Ajuste por inventario físico: faltaban 1 unidad...")

stock_anterior = producto1.stock
movimiento_ajuste = MovimientoInventario.objects.create(
    producto=producto1,
    usuario=user,
    tipo='AJUSTE',
    cantidad=-1,
    stock_anterior=stock_anterior,
    stock_nuevo=stock_anterior - 1,
    motivo='Faltante en inventario físico',
    codigo_escaneado='TEST-001-FALTANTE'
)

producto1.stock = stock_anterior - 1
producto1.save()

print(f"   ✓ Movimiento registrado:")
print(f"     - Tipo: {movimiento_ajuste.tipo}")
print(f"     - Stock anterior: {stock_anterior}")
print(f"     - Cantidad: {movimiento_ajuste.cantidad}")
print(f"     - Stock nuevo: {producto1.stock}")
print(f"     - Motivo: {movimiento_ajuste.motivo}\n")

# 7. PRUEBA 4: ENTRADA CON MÚLTIPLES UNIDADES (Mouse)
print("7. PRUEBA 4 - ENTRADA CON MÚLTIPLES UNIDADES (Mouse):")
print("   Comprando 100 Mouses...")

producto2 = productos[1]
stock_anterior = producto2.stock

movimiento_mouse = MovimientoInventario.objects.create(
    producto=producto2,
    usuario=user,
    tipo='ENTRADA',
    cantidad=100,
    stock_anterior=stock_anterior,
    stock_nuevo=stock_anterior + 100,
    motivo='Compra bulk a distribuidor',
    referencia_externa='OC-2026-002'
)

producto2.stock = stock_anterior + 100
producto2.save()

print(f"   ✓ Movimiento registrado:")
print(f"     - Producto: {producto2.codigo} - {producto2.nombre}")
print(f"     - Cantidad: +{movimiento_mouse.cantidad}")
print(f"     - Stock nuevo: {producto2.stock}\n")

# 8. PRUEBA 5: DEVOLUCIÓN
print("8. PRUEBA 5 - DEVOLUCIÓN (Cliente devuelve producto):")
print("   Cliente devuelve 2 Mouses por defecto...")

stock_anterior = producto2.stock
movimiento_devolucion = MovimientoInventario.objects.create(
    producto=producto2,
    usuario=user,
    tipo='DEVOLUCION',
    cantidad=2,
    stock_anterior=stock_anterior,
    stock_nuevo=stock_anterior + 2,
    motivo='Devolución por defecto de fábrica',
    referencia_externa='DEV-2026-001'
)

producto2.stock = stock_anterior + 2
producto2.save()

print(f"   ✓ Movimiento registrado:")
print(f"     - Tipo: {movimiento_devolucion.tipo}")
print(f"     - Cantidad: +{movimiento_devolucion.cantidad}")
print(f"     - Stock nuevo: {producto2.stock}\n")

# 9. MOSTRAR RESUMEN
print("9. RESUMEN DE MOVIMIENTOS REGISTRADOS:")
print("="*70)

for producto in productos:
    movimientos = MovimientoInventario.objects.filter(producto=producto, activo=True)
    print(f"\n{producto.codigo} - {producto.nombre}")
    print(f"Stock actual: {producto.stock}")
    print(f"Total movimientos: {movimientos.count()}")
    print("\nHistorial:")
    
    for mov in movimientos.order_by('fecha'):
        print(f"  [{mov.get_tipo_display():15}] {mov.cantidad:+5} | "
              f"Stock: {mov.stock_anterior} → {mov.stock_nuevo} | "
              f"Por: {mov.usuario.first_name} | {mov.fecha.strftime('%Y-%m-%d %H:%M')}")

# 10. ESTADÍSTICAS
print("\n" + "="*70)
print("ESTADÍSTICAS:")
print("="*70)

total_movimientos = MovimientoInventario.objects.filter(activo=True).count()
movimientos_por_tipo = {}
for tipo, _ in MovimientoInventario.TIPO_CHOICES:
    count = MovimientoInventario.objects.filter(tipo=tipo, activo=True).count()
    if count > 0:
        movimientos_por_tipo[tipo] = count

print(f"\nTotal movimientos registrados: {total_movimientos}")
print("\nDesglose por tipo:")
for tipo, count in movimientos_por_tipo.items():
    print(f"  - {tipo}: {count}")

total_stock = sum(p.stock for p in productos)
total_costo = sum(p.stock * p.precio_costo for p in productos)
print(f"\nTotal unidades en stock: {total_stock}")
print(f"Valor total de inventario: ${total_costo:,.2f}")

print("\n" + "="*70)
print("✓ PRUEBA COMPLETADA EXITOSAMENTE")
print("="*70 + "\n")
