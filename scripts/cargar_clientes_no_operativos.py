#!/usr/bin/env python
"""
Script para cargar datos de prueba en el módulo de Clientes No Operativos.
Uso: python manage.py shell < scripts/cargar_clientes_no_operativos.py
"""

from core.models import Cliente
from clientes_no_operativos.models import ClienteNoOperativo

# Crear clientes de prueba
clientes_datos = [
    {
        'nombre': 'Cliente A - No Operativo',
        'pais': 'Colombia',
        'motivo': 'Deuda vencida por más de 90 días',
        'observaciones': 'Contactado en múltiples ocasiones sin respuesta. Pendiente de gestión de cobranza.'
    },
    {
        'nombre': 'Cliente B - No Operativo',
        'pais': 'Perú',
        'motivo': 'Solicitud de desactivación por cambio de proveedor',
        'observaciones': 'Cliente cambió a otro proveedor. Si retorna, verificar condiciones comerciales.'
    },
    {
        'nombre': 'Cliente C - No Operativo',
        'pais': 'Ecuador',
        'motivo': 'Cierre de operaciones',
        'observaciones': 'Cliente cerraste sus operaciones. Fondos a reembolsar pendiente.'
    },
    {
        'nombre': 'Cliente D - No Operativo',
        'pais': 'Chile',
        'motivo': 'Incumplimiento de términos comerciales',
        'observaciones': 'Recurrentes incumplimientos en tiempos de entrega. Revisar posibilidad de reactivación.'
    },
]

print("Cargando datos de prueba para Clientes No Operativos...")

for datos in clientes_datos:
    # Crear cliente
    cliente, creado = Cliente.objects.get_or_create(
        nombre=datos['nombre'],
        defaults={
            'pais': datos['pais'],
            'activo': False
        }
    )
    
    if creado:
        print(f"✓ Creado cliente: {cliente.nombre}")
    
    # Crear registro de no operativo
    cliente_no_op, creado_no_op = ClienteNoOperativo.objects.get_or_create(
        cliente=cliente,
        defaults={
            'motivo_desactivacion': datos['motivo'],
            'observaciones': datos['observaciones']
        }
    )
    
    if creado_no_op:
        print(f"  ✓ Creado registro no operativo con motivo: {datos['motivo']}")
    else:
        print(f"  ℹ Registro ya existe")

print("\n✓ Carga de datos completada!")
print(f"Total de clientes no operativos: {ClienteNoOperativo.objects.count()}")
