# 📋 MÓDULO DE CLIENTES - GUÍA COMPLETA

## 📌 Descripción

Módulo completo de gestión de clientes desarrollado con **HTML + CSS + JavaScript puro** (sin frameworks) y almacenamiento en **localStorage** del navegador. Permite crear, editar, buscar y eliminar clientes con validación en tiempo real.

---

## ✨ Características

### ✅ Funcionalidades Implementadas

1. **Formulario de Nuevo Cliente**
   - Campos: Nombre, Email, Teléfono, RUT, Dirección, Ciudad
   - Validación en tiempo real con feedback visual
   - Mensajes de error contextualizados
   - Limpiar automáticamente después de guardar

2. **Tabla de Clientes**
   - Visualización limpia y profesional
   - ID autoincremental
   - Fecha de registro automática (YYYY-MM-DD)
   - Ordenada por fecha descendente
   - Contador de clientes registrados

3. **Operaciones CRUD**
   - ✅ Crear clientes
   - ✅ Leer/Ver clientes
   - ✅ Actualizar clientes
   - ✅ Eliminar clientes con confirmación

4. **Validaciones**
   - **Nombre**: Obligatorio, sin límite de caracteres
   - **Email**: Validación de formato (usuario@dominio.com)
   - **Teléfono**: 8-9 dígitos, solo números
   - **RUT**: Formato chileno (XXXXXXXX-X), opcional
   - **Dirección**: Texto libre, opcional
   - **Ciudad**: Texto libre, opcional

5. **Búsqueda y Filtrado**
   - Búsqueda en tiempo real por nombre
   - Actualización dinámica de resultados
   - Indicador cuando no hay resultados

6. **UX/UI Mejorada**
   - Validación visual (bordes rojos/verdes)
   - Mensajes de éxito/error con auto-cierre
   - Modal de confirmación para eliminar
   - Scroll automático al formulario al editar
   - Cambio de texto del botón (Crear/Actualizar)
   - Tooltips informativos

7. **Almacenamiento**
   - localStorage con clave: `"clientes"`
   - Manejo robusto de errores JSON
   - Persistencia entre sesiones
   - Inicialización automática de array si está vacío

---

## 📁 Estructura de Archivos

```
proyecto/
├── templates/
│   └── clientes/
│       └── clientes.html          # Template principal
├── static/
│   ├── css/
│   │   └── Clientes.css           # Estilos personalizados
│   └── js/
│       └── clientes.js            # Lógica JavaScript (clase GestorClientes)
└── docs/
    └── CLIENTES_MODULO.md         # Esta documentación
```

---

## 🚀 Instalación y Uso

### 1. **Copiar archivos a tu proyecto Django**

```bash
# Copiar template
cp templates/clientes/clientes.html tu_proyecto/templates/clientes/

# Copiar CSS
cp static/css/Clientes.css tu_proyecto/static/css/

# Copiar JavaScript
cp static/js/clientes.js tu_proyecto/static/js/
```

### 2. **Acceder a la página**

Simplemente abre el archivo HTML en un navegador o accede a través de una URL Django:

```python
# En urls.py
path('clientes/', TemplateView.as_view(template_name='clientes/clientes.html'), name='clientes'),
```

### 3. **Usar en django**

```python
# En tu vista de Django
from django.views.generic import TemplateView

class ClientesView(TemplateView):
    template_name = 'clientes/clientes.html'
```

---

## 📊 Estructura de Datos (localStorage)

Los clientes se almacenan en localStorage con el siguiente formato:

```javascript
[
    {
        "id": 1,
        "nombre": "Juan Pérez García",
        "email": "juan@ejemplo.com",
        "telefono": "987654321",
        "rut": "12345678-9",
        "direccion": "Calle Principal 123",
        "ciudad": "Santiago",
        "fechaRegistro": "2024-03-19"
    },
    {
        "id": 2,
        "nombre": "María López",
        "email": "maria@ejemplo.com",
        "telefono": "912345678",
        "rut": "87654321-2",
        "direccion": "Avenida Secundaria 456",
        "ciudad": "Valparaíso",
        "fechaRegistro": "2024-03-18"
    }
]
```

---

## 🎨 Clases y Métodos JavaScript

### Clase Principal: `GestorClientes`

```javascript
// Instancia global
let gestor;

// Constructor
new GestorClientes()

// Métodos públicos disponibles para llamar desde HTML
gestor.editarCliente(id)              // Carga cliente en formulario
gestor.mostrarConfirmacion(id, nombre) // Muestra modal de eliminar
gestor.confirmarEliminar()            // Confirma eliminación
gestor.filtrarClientes(termino)       // Busca por nombre
```

### Métodos Privados (Uso Interno)

```javascript
init()                    // Inicialización del módulo
configurarEventos()       // Asigna listeners a elementos DOM
validarCampo(campo)       // Valida un campo específico
validarFormulario()       // Valida el formulario completo
manejarEnvioFormulario()  // Procesa envío del formulario
cargarClientes()          // Carga datos de localStorage
guardarClientes()         // Guarda datos en localStorage
renderizarTabla()         // Renderiza tabla de clientes
limpiarEstilosInputs()    // Limpia clases de validación
mostrarExito()            // Muestra mensaje de éxito
mostrarError(texto)       // Muestra mensaje de error
```

---

## 🔍 Validaciones Detalladas

| Campo | Validación | Ejemplos Válidos | Ejemplos Inválidos |
|-------|-----------|------------------|-------------------|
| Nombre | Obligatorio | "Juan Pérez", "María" | "" (vacío) |
| Email | Formato email | "user@domain.com" | "email", "@domain.com" |
| Teléfono | 8-9 dígitos, solo números | "987654321", "12345678" | "9876-54321", "abc123456" |
| RUT | Formato chileno XXXXXXXX-X | "12345678-9", "87654321-K" | "12345678", "123-456" |
| Dirección | Texto libre | "Calle 123", "Avenida Libertad" | - (opcional) |
| Ciudad | Texto libre | "Santiago", "Valparaíso" | - (opcional) |

---

## 🎯 Casos de Uso

### Crear un Cliente

1. Rellenar el formulario con datos válidos
2. El botón "Guardar Cliente" se habilitará automáticamente
3. Los datos se validan en tiempo real (bordes verdes/rojos)
4. Al hacer clic en "Guardar", se agrega a la tabla
5. Se muestra mensaje de éxito
6. El formulario se limpia automáticamente

### Editar un Cliente

1. Hacer clic en "Editar" en la fila del cliente
2. Los datos cargan en el formulario automáticamente
3. El botón cambia a "Actualizar Cliente"
4. Modificar los datos necesarios
5. Hacer clic en "Actualizar"
6. La tabla se actualiza automáticamente

### Eliminar un Cliente

1. Hacer clic en "Eliminar" en la fila del cliente
2. Se abre una modal de confirmación
3. Confirmar la eliminación
4. El cliente se elimina inmediatamente
5. La tabla se actualiza

### Buscar Clientes

1. Escribir en el cuadro de búsqueda
2. La tabla se filtra en tiempo real
3. Solo muestra clientes cuyo nombre contiene el término
4. Borrar el término para ver todos los clientes

---

## 🛡️ Manejo de Errores

| Error | Síntoma | Solución |
|-------|---------|----------|
| localStorage lleno | No se puede guardar | Borrar datos antiguo o usar IndexedDB |
| JSON.parse error | Tabla no muestra datos | Verificar integridad de localStorage |
| Bootstrap no cargado | Modal no aparece | Asegurar que Bootstrap esté en base.html |
| Eventos no funcionan | Botones no responden | Recargar página, verificar console |

---

## 🌐 Compatibilidad

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ⚠️ IE 11 (parcial, sin soporte para algunas características modernas)

### Requisitos

- Browser con soporte para:
  - ES6 (arrow functions, clases, template literals)
  - localStorage
  - Fetch API
  - Bootstrap 5.3+
  - Font Awesome 6.4+

---

## 💾 Exportar/Importar Datos

Para exportar datos de clientes a JSON:

```javascript
// En la consola del navegador
const clientes = JSON.parse(localStorage.getItem('clientes'));
console.log(JSON.stringify(clientes, null, 2));
```

Para importar datos:

```javascript
// En la consola
const nuevosDatos = [...]  // Tu array de clientes
localStorage.setItem('clientes', JSON.stringify(nuevosDatos));
location.reload();
```

---

## 🔧 Configuración y Personalización

### Cambiar la clave de almacenamiento

En `clientes.js` línea 4:

```javascript
this.clave_almacenamiento = 'misClientes';  // Cambiar de 'clientes'
```

### Cambiar formatos de fecha

En `clientes.js` busca:

```javascript
new Date().toISOString().split('T')[0]  // Formato YYYY-MM-DD
```

Puedes cambiarlo a otro formato:

```javascript
new Date().toLocaleDateString('es-ES')  // Formato local (DD/MM/YYYY)
```

### Personalizar validaciones

En el método `validarCampo()`:

```javascript
case 'email':
    // Cambiar regex de validación de email
    const regexEmail = tuNuevaRegex;
    esValido = regexEmail.test(input.value);
    break;
```

---

## 📱 Responsive Design

El módulo es completamente responsive:

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 991px)
- ✅ Mobile (< 768px)

### Cambios en mobile:

- El formulario y tabla se apilan verticalmente
- La búsqueda se mueve a ancho completo
- Los botones se redimensionan
- La tabla se comprime

---

## 🚀 Mejoras Futuras (Bonus)

Características sugeridas para mejoras:

1. **Exportar a CSV/PDF** - Descargar datos de clientes
2. **Búsqueda avanzada** - Filtrar por múltiples criterios
3. **Validación de email real** - Enviar código de confirmación
4. **Fotos de perfil** - Subir avatar por cliente
5. **Historial de cambios** - Auditoría de modificaciones
6. **Sincronización con backend** - API REST integrada
7. **Importar desde CSV** - Carga masiva de clientes
8. **Categorización** - Tags o etiquetas por cliente
9. **Estadísticas** - Dashboard con KPIs
10. **Predicción de churn** - Análisis de clientes inactivos

---

## 📝 Licencia

Este módulo es parte del sistema **FactoraPos**. Uso interno permitido.

---

## 👨‍💻 Autor

Desarrollado para FactoraPos - Sistema de Gestión POS

**Versión**: 1.0  
**Última actualización**: 19 de marzo de 2024  
**Estado**: ✅ Producción

---

## 📞 Soporte

Problemas comunes:

**P: Los datos no se guardan**  
R: Verifica que localStorage esté habilitado en el navegador. Algunos navegadores privados lo desactivan.

**P: La modal no aparece**  
R: Asegúrate que Bootstrap 5 esté cargado correctamente en base.html

**P: Las validaciones no funcionan**  
R: Abre la consola del navegador (F12) y verifica que no haya errores de JavaScript.

**P: ¿Cómo respaldar los datos?**  
R: Usa la Developer Tools (F12) > Storage > LocalStorage y copia el contenido.

---

Fin de la documentación. ¡Disfruta usando el módulo de clientes! 🎉
