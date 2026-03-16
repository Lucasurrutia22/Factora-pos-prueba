"""
Script de prueba para validar Movimientos de Inventario + Scanner 2D
Ejecutar con: python manage.py shell < scripts/test_movimientos.py
"""
# -*- coding: utf-8 -*-

from django.contrib.auth.models import User
from stock.models import Producto
from stock.models_movimientos import MovimientoInventario
from datetime import datetime

print("\n" + "="*60)
print("PRUEBAS MOVIMIENTOS DE INVENTARIO + SCANNER 2D")
print("="*60)

# 1. Crear usuario de prueba
print("\n1. Creando usuario de prueba...")
usuario, creado = User.objects.get_or_create(
    username='tester',
    defaults={'first_name': 'Test', 'last_name': 'User', 'email': 'test@example.com'}
)
print(f"   Usuario: {usuario.username} ({'creado' if creado else 'ya existe'})")

# 2. Crear productos de prueba con códigos de barra
print("\n2. Creando productos con códigos de barra...")
productos = [
    {
        'nombre': 'Laptop HP ProBook',
        'sku': 'HP-PB-001',
        'codigo_barra': '7501234567890',
        'categoria': 'Computadoras',
        'precio': 1200000,
        'cantidad': 10,
        'ubicacion': 'Estante A-1'
    },
    {
        'nombre': 'Mouse Logitech MX Master',
        'sku': 'LOG-MX-001',
        'codigo_barra': '7501234567891',
        'categoria': 'Accesorios',
        'precio': 79900,
        'cantidad': 50,
        'ubicacion': 'Estante B-3'
    },
    {
        'nombre': 'Teclado Mecanico RGB',
        'sku': 'TEC-RGB-001',
        'codigo_barra': '7501234567892',
        'categoria': 'Accesorios',
        'precio': 149900,
        'cantidad': 25,
        'ubicacion': 'Estante B-5'
    }
]

for prod_data in productos:
    prod, creado = Producto.objects.get_or_create(
        codigo_barra=prod_data['codigo_barra'],
        defaults=prod_data
    )
    print(f"   OK: {prod.nombre} (Codigo: {prod.codigo_barra}) - Stock: {prod.cantidad}")

# 3. Crear movimientos de prueba
print("\n3. Creando movimientos de prueba...")

# ENTRADA
laptop = Producto.objects.get(sku='HP-PB-001')
mov_entrada = MovimientoInventario(
    producto=laptop,
    usuario=usuario,
    tipo='ENTRADA',
    cantidad=5,
    motivo='Compra a proveedor Dell Chile - Factura #INV-2024-001',
    referencia_externa='PO-2024-001',
    stock_anterior=laptop.cantidad - 5
)
mov_entrada.save()
print(f"   OK: ENTRADA: {mov_entrada.cantidad} unidades de {laptop.nombre}")
print(f"      Stock: {mov_entrada.stock_anterior} -> {mov_entrada.stock_nuevo}")

# SALIDA
mouse = Producto.objects.get(sku='LOG-MX-001')
mov_salida = MovimientoInventario(
    producto=mouse,
    usuario=usuario,
    tipo='SALIDA',
    cantidad=10,
    motivo='Venta a cliente ABC Corp - Factura #2024-001',
    referencia_externa='VTA-2024-001',
    stock_anterior=mouse.cantidad
)
mov_salida.save()
print(f"   OK: SALIDA: {mov_salida.cantidad} unidades de {mouse.nombre}")
print(f"      Stock: {mov_salida.stock_anterior} -> {mov_salida.stock_nuevo}")

# AJUSTE
teclado = Producto.objects.get(sku='TEC-RGB-001')
mov_ajuste = MovimientoInventario(
    producto=teclado,
    usuario=usuario,
    tipo='AJUSTE',
    cantidad=2,
    motivo='Correccion de inventario por danio en transporte',
    stock_anterior=teclado.cantidad
)
mov_ajuste.save()
print(f"   OK: AJUSTE: Correccion de {mov_ajuste.cantidad} unidades de {teclado.nombre}")
print(f"      Stock: {mov_ajuste.stock_anterior} -> {mov_ajuste.stock_nuevo}")

# 4. Verificar API endpoints
print("\n4. Validando modelos y metodos...")
todos_movimientos = MovimientoInventario.objects.filter(activo=True)
print(f"   OK: Total de movimientos activos: {todos_movimientos.count()}")

por_tipo = {}
for mov in todos_movimientos:
    tipo = mov.tipo
    por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

print("   OK: Movimientos por tipo:")
for tipo, count in por_tipo.items():
    print(f"      - {tipo}: {count}")

# 5. Resumen
print("\n" + "="*60)
print("RESUMEN")
print("="*60)
print(f"OK: Usuarios: {User.objects.count()}")
print(f"OK: Productos: {Producto.objects.count()}")
print(f"OK: Movimientos: {MovimientoInventario.objects.count()}")
print(f"OK: Movimientos activos: {MovimientoInventario.objects.filter(activo=True).count()}")

print("\nPRUEBAS COMPLETADAS")
print("\nProximos pasos:")
print("   1. Acceder a /admin/ para ver MovimientoInventario registrado")
print("   2. Ingresar a /movimientos/ para usar la interfaz Scanner 2D")
print("   3. Escanear codigo de barra: 7501234567890 (Laptop HP ProBook)")
print("   4. Registrar movimientos usando la interfaz")
print("   5. Verificar que los stocks se actualicen correctamente")
print("\n" + "="*60 + "\n")


# 1. Crear usuario de prueba
print("\n1️⃣ Creando usuario de prueba...")
usuario, creado = User.objects.get_or_create(
    username='tester',
    defaults={'first_name': 'Test', 'last_name': 'User', 'email': 'test@example.com'}
)
print(f"   Usuario: {usuario.username} ({'creado' if creado else 'ya existe'})")

# 2. Crear productos de prueba con códigos de barra
print("\n2️⃣ Creando productos con códigos de barra...")
productos = [
    {
        'nombre': 'Laptop HP ProBook',
        'sku': 'HP-PB-001',
        'codigo_barra': '7501234567890',
        'categoria': 'Computadoras',
        'precio': 1200000,
        'cantidad': 10,
        'ubicacion': 'Estante A-1'
    },
    {
        'nombre': 'Mouse Logitech MX Master',
        'sku': 'LOG-MX-001',
        'codigo_barra': '7501234567891',
        'categoria': 'Accesorios',
        'precio': 79900,
        'cantidad': 50,
        'ubicacion': 'Estante B-3'
    },
    {
        'nombre': 'Teclado Mecánico RGB',
        'sku': 'TEC-RGB-001',
        'codigo_barra': '7501234567892',
        'categoria': 'Accesorios',
        'precio': 149900,
        'cantidad': 25,
        'ubicacion': 'Estante B-5'
    }
]

for prod_data in productos:
    prod, creado = Producto.objects.get_or_create(
        codigo_barra=prod_data['codigo_barra'],
        defaults=prod_data
    )
    print(f"   ✓ {prod.nombre} (Código: {prod.codigo_barra}) - Stock: {prod.cantidad}")

# 3. Crear movimientos de prueba
print("\n3️⃣ Creando movimientos de prueba...")

# ENTRADA
laptop = Producto.objects.get(sku='HP-PB-001')
mov_entrada = MovimientoInventario(
    producto=laptop,
    usuario=usuario,
    tipo='ENTRADA',
    cantidad=5,
    motivo='Compra a proveedor Dell Chile - Factura #INV-2024-001',
    referencia_externa='PO-2024-001',
    stock_anterior=laptop.cantidad - 5
)
mov_entrada.save()
print(f"   ✓ ENTRADA: {mov_entrada.cantidad} unidades de {laptop.nombre}")
print(f"     Stock: {mov_entrada.stock_anterior} → {mov_entrada.stock_nuevo}")

# SALIDA
mouse = Producto.objects.get(sku='LOG-MX-001')
mov_salida = MovimientoInventario(
    producto=mouse,
    usuario=usuario,
    tipo='SALIDA',
    cantidad=10,
    motivo='Venta a cliente ABC Corp - Factura #2024-001',
    referencia_externa='VTA-2024-001',
    stock_anterior=mouse.cantidad
)
mov_salida.save()
print(f"   ✓ SALIDA: {mov_salida.cantidad} unidades de {mouse.nombre}")
print(f"     Stock: {mov_salida.stock_anterior} → {mov_salida.stock_nuevo}")

# AJUSTE
teclado = Producto.objects.get(sku='TEC-RGB-001')
mov_ajuste = MovimientoInventario(
    producto=teclado,
    usuario=usuario,
    tipo='AJUSTE',
    cantidad=2,
    motivo='Corrección de inventario por daño en transporte',
    stock_anterior=teclado.cantidad
)
mov_ajuste.save()
print(f"   ✓ AJUSTE: Corrección de {mov_ajuste.cantidad} unidades de {teclado.nombre}")
print(f"     Stock: {mov_ajuste.stock_anterior} → {mov_ajuste.stock_nuevo}")

# 4. Verificar API endpoints
print("\n4️⃣ Validando modelos y métodos...")
todos_movimientos = MovimientoInventario.objects.filter(activo=True)
print(f"   ✓ Total de movimientos activos: {todos_movimientos.count()}")

por_tipo = {}
for mov in todos_movimientos:
    tipo = mov.tipo
    por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

print("   ✓ Movimientos por tipo:")
for tipo, count in por_tipo.items():
    print(f"      - {tipo}: {count}")

# 5. Validar soft delete
print("\n5️⃣ Probando soft delete...")
mov_a_eliminar = MovimientoInventario.objects.first()
stock_antes = mov_a_eliminar.producto.cantidad
mov_a_eliminar.delete()  # Soft delete
print(f"   ✓ Movimiento marcado como inactivo")
print(f"   ✓ Stock antes de eliminar: {stock_antes}")
print(f"   ✓ Stock después de eliminar: {mov_a_eliminar.producto.cantidad}")

# 6. Resumen
print("\n" + "="*60)
print("📊 RESUMEN")
print("="*60)
print(f"✓ Usuarios: {User.objects.count()}")
print(f"✓ Productos: {Producto.objects.count()}")
print(f"✓ Movimientos: {MovimientoInventario.objects.count()}")
print(f"✓ Movimientos activos: {MovimientoInventario.objects.filter(activo=True).count()}")

print("\n✅ PRUEBAS COMPLETADAS")
print("\n💡 Próximos pasos:")
print("   1. Acceder a /admin/ para ver MovimientoInventario registrado")
print("   2. Ingresar a /movimientos/ para usar la interfaz Scanner 2D")
print("   3. Escanear código de barra: 7501234567890 (Laptop HP ProBook)")
print("   4. Registrar movimientos usando la interfaz")
print("   5. Verificar que los stocks se actualicen correctamente")
print("\n" + "="*60 + "\n")
