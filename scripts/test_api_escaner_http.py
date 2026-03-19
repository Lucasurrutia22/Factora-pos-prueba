"""
EJEMPLOS DE LLAMADAS HTTP - Testing del Scanner de códigos nuevos
Comandos listos para ejecutar en PowerShell o bash
"""

# ============================================================================
# OPCIÓN 1: Usando CURL (en PowerShell)
# ============================================================================

"""
PRUEBA 1: Código CATALOGADO (existen en BD)
-----------
$codigo = "7501234567890"
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=$codigo" -Method GET
$json = $response.Content | ConvertFrom-Json
$json | ConvertTo-Json

RESULTADO ESPERADO:
{
  "success": true,
  "producto": {
    "id": 1,
    "nombre": "Laptop HP ProBook 450",
    "codigo_barra": "7501234567890",
    "sku": "HP-PB450-001",
    "cantidad": 15,
    "ubicacion": "Bodega A - Estante 3",
    "precio": 750.0,
    "categoria": "Equipos"
  },
  "es_generado": false
}
"""

# ============================================================================
# PRUEBA 2: Código DESCONOCIDO (NO existe en BD) - AHORA FUNCIONA ✅
# ============================================================================

"""
$codigo = "9999888877776666"  # Código que NO existe
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=$codigo" -Method GET
$json = $response.Content | ConvertFrom-Json
$json | ConvertTo-Json

RESULTADO ESPERADO:
{
  "success": true,
  "producto": {
    "id": null,  # ← Sin ID en BD
    "nombre": "Producto - 9999888877776666",
    "codigo_barra": "9999888877776666",
    "sku": "9999888877776666",
    "cantidad": 0,
    "ubicacion": "Por ubicar",
    "precio": 0.0,
    "categoria": "Sin categoría"
  },
  "es_generado": true,  # ← NUEVO: Indica que es generado
  "es_nuevo": true      # ← NUEVO: Indica que es código nuevo
}
"""

# ============================================================================
# PRUEBA 3: Búsqueda por PREFIJO
# ============================================================================

"""
$codigo = "750"  # Solo primer 3 caracteres
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=$codigo" -Method GET
$json = $response.Content | ConvertFrom-Json
$json | ConvertTo-Json

RESULTADO: Devolvería el primer producto que comience con "750"
"""

# ============================================================================
# PRUEBA 4: Registrar movimiento con código NUEVO
# ============================================================================

"""
# PASO 1: Escanear código nuevo
$codigo = "5555444433332222"
$response1 = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=$codigo" -Method GET
$productoRespuesta = ($response1.Content | ConvertFrom-Json).producto
Write-Host "Producto encontrado:" ($productoRespuesta | ConvertTo-Json -Depth 2)

# PASO 2: Registrar movimiento
$movimientoData = @{
    producto_id = $productoRespuesta.id  # será null para productos nuevos
    tipo = "ENTRADA"
    cantidad = 25
    motivo = "Recepción de nuevo proveedor"
    referencia_externa = "PO-2026-045"
    ubicacion = "Bodega A - Estante 5"
    categoria = "Equipos Nuevos"
    codigo_escaneado = $codigo  # El código original escaneado
} | ConvertTo-Json

$response2 = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/crear/" `
    -Method POST `
    -Body $movimientoData `
    -ContentType "application/json"

$resultado = $response2.Content | ConvertFrom-Json
$resultado | ConvertTo-Json

RESULTADO ESPERADO:
{
  "success": true,
  "mensaje": "Movimiento creado exitosamente",
  "movimiento_id": 123,
  "producto_nombre": "Producto - 5555444433332222",
  "tipo_movimiento": "ENTRADA",
  "cantidad": 25,
  "timestamp": "2026-03-19T14:30:00Z"
}
"""

# ============================================================================
# CASOS DE TEST COMPLETOS - Copiar y ejecutar direct en terminal
# ============================================================================

"""
PS> # TEST 1: Código catalogado
PS> $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=7501234567890" -Method GET
PS> ($r.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 2

PS> # TEST 2: Código nuevo (lo NUEVO)
PS> $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=CODIGO-NUEVO-123" -Method GET
PS> $data = $r.Content | ConvertFrom-Json
PS> Write-Host "Es nuevo: $($data.es_nuevo)"
PS> Write-Host "Es generado: $($data.es_generado)"
PS> $data.producto | ConvertTo-Json

PS> # TEST 3: Prefijo
PS> $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/stock/api/movimientos/producto-codigo/?codigo=750" -Method GET
PS> ($r.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 2
"""

# ============================================================================
# USANDO PYTHON REQUESTS
# ============================================================================

"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# Función auxiliar
def escanear_codigo(codigo):
    url = f"{BASE_URL}/stock/api/movimientos/producto-codigo/?codigo={codigo}"
    response = requests.get(url)
    return response.json()

# PRUEBA 1: Código conocido
resultado = escanear_codigo("7501234567890")
print("Código conocido:")
print(json.dumps(resultado, indent=2, ensure_ascii=False))

# PRUEBA 2: Código desconocido (NUEVO)
resultado = escanear_codigo("CODIGO-COMPLETAMENTE-NUEVO-999")
print("\nCódigo desconocido (NUEVO - FUNCIONARÁ AHORA):")
print(json.dumps(resultado, indent=2, ensure_ascii=False))

# Verificar campos nuevos
if resultado['success']:
    print(f"\n✓ Es generado: {resultado.get('es_generado')}")
    print(f"✓ Es nuevo: {resultado.get('es_nuevo')}")
    print(f"✓ ID del producto: {resultado['producto'].get('id')}")
    print(f"✓ Nombre: {resultado['producto'].get('nombre')}")

# PRUEBA 3: Registrar movimiento con código nuevo
def crear_movimiento(producto_id, tipo, cantidad, motivo, codigo_escaneado):
    url = f"{BASE_URL}/stock/api/movimientos/crear/"
    payload = {
        "producto_id": producto_id,
        "tipo": tipo,
        "cantidad": cantidad,
        "motivo": motivo,
        "referencia_externa": "TEST-001",
        "codigo_escaneado": codigo_escaneado
    }
    response = requests.post(url, json=payload)
    return response.json()

# Escanear código nueva
escaneo = escanear_codigo("CODIGO-ENTRADA-100")

# Crear movimiento
if escaneo['success']:
    movimiento = crear_movimiento(
        producto_id=escaneo['producto'].get('id'),
        tipo="ENTRADA",
        cantidad=50,
        motivo="Recepción de nueva remesa",
        codigo_escaneado="CODIGO-ENTRADA-100"
    )
    print("\nMovimiento creado:")
    print(json.dumps(movimiento, indent=2, ensure_ascii=False))
"""

# ============================================================================
# NOTAS IMPORTANTES
# ============================================================================

"""
✅ CAMBIOS IMPLEMENTADOS:

1. Backend (stock/views_movimientos.py):
   - Si no encuentra código exacto → busca por prefijo
   - Si no encuentra por prefijo → devuelve PRODUCTO GENÉRICO
   - Ahora devuelve 'es_generado' y 'es_nuevo' en respuesta

2. Frontend (static/js/Movimientos.js):
   - Muestra indicador ⚠️ para productos nuevos
   - Mensaje diferenciado para códigos nuevos
   - Permite registrar movimientos sin restricción

3. Casos de uso soportados:
   - Productos sin catálogo
   - Códigos temporales o de prueba
   - Inventario físico con códigos diversos
   - Devoluciones con códigos genéricos

⚠️ LIMITACIONES:
   - Los movimientos con productos nuevos (id=null) se guardan
   - Recomendable crear producto en BD después si es regular
   - Los datos se traceabilizan completos en MovimientoInventario
"""
