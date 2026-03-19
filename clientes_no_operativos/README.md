# Módulo de Clientes No Operativos

## 📋 Descripción

El módulo de **Clientes No Operativos** es un sistema de gestión para administrar y dar seguimiento a clientes que han sido desactivados o que no tienen actividad en el sistema FactoraPos. Permite:

- **Listar** todos los clientes desactivados con búsqueda y paginación
- **Desactivar** clientes nuevos (marcar como no operativos)
- **Ver detalles** de clientes no operativos
- **Editar** motivo y observaciones de desactivación
- **Reactivar** clientes cuando sea necesario
- **Monitorear** tiempo de inactividad en días

## 🎯 Características Principales

### 1. Listado de Clientes No Operativos
- Vista con tabla listada todos los clientes no operativos
- Búsqueda por nombre del cliente o motivo de desactivación
- Paginación automática (20 registros por página)
- Muestra:
  - Nombre del cliente y país
  - Fecha de desactivación
  - Días inactivos (badge con color)
  - Motivo de desactivación previsualizado
  - Acciones rápidas (ver, editar, reactivar)

### 2. Desactivar Cliente
- Formulario para marcar un cliente como no operativo
- Campos obligatorios:
  - **Motivo de Desactivación**: Razón principal
  - **Observaciones**: Información complementaria (opcional)
- Marca automáticamente el cliente como `activo=False`
- Crea un registro con fecha de desactivación

### 3. Detalles del Cliente
- Información completa del cliente
- Información de desactivación
- Días inactivos calculados automáticamente
- Observaciones y motivo de desactivación
- Acciones: Editar, Reactivar

### 4. Editar Cliente No Operativo
- Actualizar motivo y observaciones
- Campos de solo lectura:
  - Fecha de desactivación
  - Días inactivos

### 5. Reactivar Cliente
- Confirmación de reactivación
- Marca el cliente como `activo=True`
- Elimina el registro de no operativo
- Retorna a estado operativo

## 🗂️ Estructura del Módulo

```
clientes_no_operativos/
├── models.py                    # Modelo ClienteNoOperativo
├── views.py                     # 5 vistas CRUD
├── urls.py                      # Rutas configuradas
├── admin.py                     # Admin Django registrado
├── apps.py                      # Configuración del app
├── tests.py                     # Tests unitarios
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py          # Migración inicial
└── templates/clientes_no_operativos/
    ├── list.html                # Listado
    ├── detail.html              # Detalles
    ├── desactivar.html          # Formulario desactivar
    ├── edit.html                # Editar
    └── confirmar_reactivar.html # Confirmación reactivar
```

## 🔧 Configuración

### Instalación

El módulo está completamente integrado. Solo necesitas:

1. **Verificar que está en INSTALLED_APPS** (en `settings.py`):
```python
INSTALLED_APPS = [
    ...
    'clientes_no_operativos',
]
```

2. **URLs configuradas** (en `FactoraPos/urls.py`):
```python
path('clientes-no-operativos/', include('clientes_no_operativos.urls')),
```

### Rutas Disponibles

| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/clientes-no-operativos/` | `list` | Listado de clientes no operativos |
| `/clientes-no-operativos/desactivar/<id>/` | `desactivar` | Desactivar un cliente |
| `/clientes-no-operativos/<id>/` | `detail` | Detalles de cliente no operativo |
| `/clientes-no-operativos/<id>/editar/` | `edit` | Editar información |
| `/clientes-no-operativos/<id>/reactivar/` | `reactivar` | Reactivar cliente |

## 📊 Modelo de Datos

### ClienteNoOperativo

```python
class ClienteNoOperativo(models.Model):
    cliente              # OneToOneField → Cliente (PK)
    fecha_desactivacion  # DateTime (auto_now_add)
    motivo_desactivacion # CharField (500, opcional)
    observaciones        # TextField (opcional)
    
    # Propiedades
    dias_inactivo        # Calcula días desde desactivación
```

**Relación con Cliente:**
- Un Cliente puede tener UN registro de no operativo
- Si se elimina el Cliente, se elimina el registro no operativo (CASCADE)
- Cliente tiene campo `activo` (BooleanField)

## 🚀 Uso

### Desactivar un Cliente

1. Ir a `/clientes-no-operativos/`
2. Hacer clic en el botón "Desactivar Cliente"
3. Seleccionar el cliente
4. Llenar motivo y observaciones
5. Hacer clic en "Desactivar Cliente"

### Buscar Clientes No Operativos

1. Ir a `/clientes-no-operativos/`
2. En el campo de búsqueda, escribir:
   - Nombre del cliente (búsqueda parcial)
   - Motivo de desactivación
3. Hacer clic en "Buscar"

### Reactivar un Cliente

1. Navegar a `/clientes-no-operativos/`
2. Hacer clic en el icono "Reactivar" (⟳)
3. Confirmar la reactivación
4. El cliente volverá a estar OPERATIVO

## 🔐 Permisos

Actualmente el módulo es accesible para todos los usuarios autenticados. Para restringir acceso:

```python
# En views.py
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

class ClienteNoOperativoListView(LoginRequiredMixin, PermissionRequiredMixin, generic.ListView):
    permission_required = 'clientes_no_operativos.view_clientenooperativo'
    ...
```

## 📈 Admin Django

Acceso via `/admin/clientes_no_operativos/clientenooperativo/`

**Configuración:**
- **Listado:** Muestra nombre, fecha, días inactivos, motivo
- **Filtros:** Por fecha y país
- **Búsqueda:** Por nombre y motivo
- **Campos de solo lectura:** Fecha desactivación, días inactivos

## ✅ Tests

Ejecutar tests del módulo:

```bash
python manage.py test clientes_no_operativos
```

**Pruebas incluidas:**
- Creación de ClienteNoOperativo
- Propiedad `dias_inactivo`
- Listado de clientes
- Vista de detalle

## 📝 Datos de Prueba

Script para cargar datos de prueba:

```bash
python manage.py shell -c "exec(open('scripts/cargar_clientes_no_operativos.py').read())"
```

Carga 4 clientes de prueba con motivos y observaciones.

## 🐛 Troubleshooting

### Templates no encontrados
- Verificar que existe `templates/base.html`
- Verificar que `APP_DIRS = True` en settings.py

### BD no actualizada
```bash
python manage.py makemigrations clientes_no_operativos
python manage.py migrate
```

### Permisos denegados
- Asegurar que el usuario está autenticado
- Verificar permisos en admin

## 🔄 Flujo de Trabajo

```
Cliente Activo
    ↓
Hacer clic en "Desactivar"
    ↓
Llenar motivo y observaciones
    ↓
Confirmar desactivación
    ↓
Cliente marcado como NO OPERATIVO
    ↓
Aparece en listado de no operativos
    ↓
[Si es necesario reactivar...]
Hacer clic en "Reactivar"
    ↓
Confirmar reactivación
    ↓
Cliente vuelve a ser OPERATIVO
```

## 📞 Soporte

Para reportar errores o sugerencias, contactar al equipo de desarrollo.

---

**Versión:** 1.0  
**Última actualización:** 18/03/2026  
**Estado:** ✅ Completo y funcional
