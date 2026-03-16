# 🛒 FactoraPos - Sistema de Punto de Venta

Sistema integral de gestión para puntos de venta con autenticación 2FA, conexión a Oracle Database y APIs REST.

![Django](https://img.shields.io/badge/Django-5.2-green)
![Oracle](https://img.shields.io/badge/Oracle-21c-red)
![Python](https://img.shields.io/badge/Python-3.10+-blue)

## 📋 Características

- ✅ **Autenticación 2FA** - Login seguro con verificación en dos pasos
- ✅ **Gestión de Inventario** - CRUD completo de productos
- ✅ **Punto de Venta** - Proceso de ventas rápido e intuitivo
- ✅ **Gestión de Clientes** - Registro y seguimiento de clientes
- ✅ **Proveedores** - Administración de proveedores
- ✅ **Reportes** - Estadísticas y reportes de ventas
- ✅ **RMA/Garantías** - Gestión de devoluciones
- ✅ **Usuarios** - Gestión de usuarios del sistema

---

## 🚀 Instalación Local

### Requisitos Previos

- **Python 3.10+** - [Descargar Python](https://www.python.org/downloads/)
- **Oracle Database 21c Express Edition** - [Descargar Oracle XE](https://www.oracle.com/database/technologies/xe-downloads.html)
- **Git** - [Descargar Git](https://git-scm.com/downloads)

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Lucasurrutia22/FactoraPos_Git.git
cd FactoraPos_Git
```

### Paso 2: Crear Entorno Virtual

**Windows:**
```powershell
python -m venv venv
.\venv\Scripts\activate
```

**Linux/macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Paso 3: Instalar Dependencias

```bash
pip install django oracledb
```

### Paso 4: Configurar Base de Datos Oracle

#### 4.1 Crear Usuario en Oracle

Abre SQL*Plus o SQL Developer y ejecuta:

```sql
-- Conectar como SYSDBA
ALTER SESSION SET CONTAINER = XEPDB1;

-- Crear usuario
CREATE USER FACTORA_POS IDENTIFIED BY factorapass
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

-- Otorgar permisos
GRANT CONNECT, RESOURCE, CREATE SESSION TO FACTORA_POS;
GRANT CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO FACTORA_POS;
```

#### 4.2 Crear Tablas

Conecta como `FACTORA_POS` y ejecuta:

```sql
-- Tabla PROVEEDORES
CREATE TABLE PROVEEDORES (
    ID_PROVEEDOR NUMBER PRIMARY KEY,
    NOMBRE VARCHAR2(100) NOT NULL,
    CONTACTO VARCHAR2(100),
    TELEFONO VARCHAR2(20),
    EMAIL VARCHAR2(100),
    DIRECCION VARCHAR2(200),
    FECHA_REGISTRO DATE DEFAULT SYSDATE
);

-- Tabla PRODUCTOS
CREATE TABLE PRODUCTOS (
    ID_PRODUCTO NUMBER PRIMARY KEY,
    CODIGO VARCHAR2(50) UNIQUE NOT NULL,
    NOMBRE VARCHAR2(100) NOT NULL,
    DESCRIPCION VARCHAR2(500),
    CATEGORIA VARCHAR2(50),
    PRECIO_COMPRA NUMBER(10,2),
    PRECIO_VENTA NUMBER(10,2),
    STOCK NUMBER DEFAULT 0,
    STOCK_MINIMO NUMBER DEFAULT 5,
    ID_PROVEEDOR NUMBER REFERENCES PROVEEDORES(ID_PROVEEDOR),
    FECHA_CREACION DATE DEFAULT SYSDATE,
    ACTIVO CHAR(1) DEFAULT 'S'
);

-- Tabla CLIENTES
CREATE TABLE CLIENTES (
    ID_CLIENTE NUMBER PRIMARY KEY,
    RUT VARCHAR2(20) UNIQUE,
    NOMBRE VARCHAR2(100) NOT NULL,
    EMAIL VARCHAR2(100),
    TELEFONO VARCHAR2(20),
    DIRECCION VARCHAR2(200),
    FECHA_REGISTRO DATE DEFAULT SYSDATE
);

-- Tabla USUARIOS
CREATE TABLE USUARIOS (
    ID_USUARIO NUMBER PRIMARY KEY,
    USERNAME VARCHAR2(50) UNIQUE NOT NULL,
    PASSWORD VARCHAR2(255) NOT NULL,
    NOMBRE VARCHAR2(100),
    EMAIL VARCHAR2(100),
    ROL VARCHAR2(20) DEFAULT 'vendedor',
    ACTIVO CHAR(1) DEFAULT 'S',
    FECHA_CREACION DATE DEFAULT SYSDATE
);

-- Tabla VENTAS
CREATE TABLE VENTAS (
    ID_VENTA NUMBER PRIMARY KEY,
    NUMERO_BOLETA VARCHAR2(20) UNIQUE,
    ID_CLIENTE NUMBER REFERENCES CLIENTES(ID_CLIENTE),
    ID_USUARIO NUMBER REFERENCES USUARIOS(ID_USUARIO),
    FECHA_VENTA DATE DEFAULT SYSDATE,
    SUBTOTAL NUMBER(12,2),
    IMPUESTO NUMBER(12,2),
    TOTAL NUMBER(12,2),
    METODO_PAGO VARCHAR2(20),
    ESTADO VARCHAR2(20) DEFAULT 'completada'
);

-- Tabla DETALLE_VENTA
CREATE TABLE DETALLE_VENTA (
    ID_DETALLE NUMBER PRIMARY KEY,
    ID_VENTA NUMBER REFERENCES VENTAS(ID_VENTA),
    ID_PRODUCTO NUMBER REFERENCES PRODUCTOS(ID_PRODUCTO),
    CANTIDAD NUMBER,
    PRECIO_UNITARIO NUMBER(10,2),
    SUBTOTAL NUMBER(12,2)
);

-- Tabla MOVIMIENTOS_INVENTARIO
CREATE TABLE MOVIMIENTOS_INVENTARIO (
    ID_MOVIMIENTO NUMBER PRIMARY KEY,
    ID_PRODUCTO NUMBER REFERENCES PRODUCTOS(ID_PRODUCTO),
    TIPO_MOVIMIENTO VARCHAR2(20),
    CANTIDAD NUMBER,
    FECHA_MOVIMIENTO DATE DEFAULT SYSDATE,
    MOTIVO VARCHAR2(200),
    ID_USUARIO NUMBER REFERENCES USUARIOS(ID_USUARIO)
);

-- Tabla GARANTIAS
CREATE TABLE GARANTIAS (
    ID_GARANTIA NUMBER PRIMARY KEY,
    ID_PRODUCTO NUMBER REFERENCES PRODUCTOS(ID_PRODUCTO),
    ID_CLIENTE NUMBER REFERENCES CLIENTES(ID_CLIENTE),
    FECHA_INICIO DATE,
    FECHA_FIN DATE,
    ESTADO VARCHAR2(20) DEFAULT 'activa',
    DESCRIPCION VARCHAR2(500)
);

-- Secuencias para auto-increment
CREATE SEQUENCE SEQ_PROVEEDORES START WITH 1;
CREATE SEQUENCE SEQ_PRODUCTOS START WITH 1;
CREATE SEQUENCE SEQ_CLIENTES START WITH 1;
CREATE SEQUENCE SEQ_USUARIOS START WITH 1;
CREATE SEQUENCE SEQ_VENTAS START WITH 1;
CREATE SEQUENCE SEQ_DETALLE START WITH 1;
CREATE SEQUENCE SEQ_MOVIMIENTOS START WITH 1;
CREATE SEQUENCE SEQ_GARANTIAS START WITH 1;
```

#### 4.3 Configurar Conexión

Edita el archivo `FactoraPos/settings.py` y verifica la configuración:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.oracle',
        'NAME': 'localhost:1521/XEPDB1',
        'USER': 'FACTORA_POS',
        'PASSWORD': 'factorapass',
    }
}
```

> ⚠️ **Nota:** Cambia `factorapass` por tu contraseña si usaste una diferente.

### Paso 5: Ejecutar el Servidor

```bash
python manage.py runserver
```

### Paso 6: Acceder a la Aplicación

Abre tu navegador y ve a: **http://127.0.0.1:8000**

---

## 🔐 Credenciales de Prueba

### Login Web
- **Usuario:** admin
- **Contraseña:** admin123
- **Código 2FA:** `123123` (código de prueba fijo)

---

## 📁 Estructura del Proyecto

```
FactoraPos/
├── FactoraPos/          # Configuración Django
│   ├── settings.py      # Configuración principal
│   ├── urls.py          # URLs principales
│   └── wsgi.py
├── core/                # Login y Dashboard
├── inventario/          # Gestión de productos
├── ventas/              # Punto de venta y clientes
├── usuarios/            # Gestión de usuarios
├── proveedores/         # Gestión de proveedores
├── movimientos/         # Movimientos de inventario
├── reportes/            # Reportes y estadísticas
├── rma/                 # Garantías y devoluciones
├── config/              # Configuración del sistema
└── static/              # CSS, JS, imágenes
    ├── css/
    └── js/
```

---

## 🔧 API REST Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/inventario/api/productos/` | GET | Listar productos |
| `/inventario/api/productos/` | POST | Crear producto |
| `/inventario/api/productos/<id>/` | PUT | Actualizar producto |
| `/inventario/api/productos/<id>/` | DELETE | Eliminar producto |
| `/ventas/api/clientes/` | GET | Listar clientes |
| `/ventas/api/clientes/` | POST | Crear cliente |
| `/ventas/api/ventas/` | GET | Listar ventas |
| `/inventario/api/proveedores/` | GET | Listar proveedores |

---

## 🛠️ Solución de Problemas

### Error: "oracledb" no encontrado
```bash
pip install oracledb
```

### Error: ORA-12541 TNS:no listener
- Verifica que Oracle Database esté ejecutándose
- En Windows: Servicios → OracleServiceXE → Iniciar

### Error: ORA-01017 invalid username/password
- Verifica usuario y contraseña en `settings.py`
- Asegúrate de conectar al PDB correcto (XEPDB1)

### Error: CSRF verification failed
- Limpia cookies del navegador
- Usa navegación en incógnito

---

## 📝 Comandos Útiles

```bash
# Activar entorno virtual (Windows)
.\venv\Scripts\activate

# Iniciar servidor
python manage.py runserver

# Iniciar en puerto específico
python manage.py runserver 8080

# Ver datos en Oracle
python ver_datos.py
```

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de uso privado.

---

## 👨‍💻 Autor

**Lucas Urrutia** - [GitHub](https://github.com/Lucasurrutia22)

---

⭐ Si este proyecto te fue útil, ¡dale una estrella!
