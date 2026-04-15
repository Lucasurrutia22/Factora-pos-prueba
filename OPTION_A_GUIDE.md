# 📘 GUÍA RÁPIDA - OPCIÓN A: Django + PostgreSQL + Gunicorn + Nginx

## Resumen Ejecutivo

Has decidido ir con **Opción A** (Django + PostgreSQL + Gunicorn + Nginx). Esta es la mejor opción para:

- ✅ Mantener toda tu lógica Django
- ✅ Escalabilidad mejor que SQLite
- ✅ Control total del servidor
- ✅ Bajo costo (~$10-50/mes en VPS)
- ✅ Sin vendor lock-in

---

## 📁 Archivos nuevos creados

```
/
├── .env.example              👈 Variables de entorno
├── FactoraPos/
│   └── settings_production.py 👈 Configuración para producción
├── gunicorn_conf.py          👈 Configuración del servidor WSGI
├── nginx.conf.example        👈 Configuración del proxy inverso
├── deploy.sh                 👈 Script de deployment automático
├── DEPLOYMENT_GUIDE.md       👈 Guía paso a paso
└── PRE_DEPLOYMENT_CHECKLIST.md 👈 Checklist antes del launch
```

---

## 🚀 Inicio Rápido Local (Pruebas)

### Paso 1: Instalar dependencias
```bash
# Activar venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate     # Windows

# Instalar paquetes
pip install -r requirements.txt
```

### Paso 2: Configurar .env local
```bash
cp .env.example .env
# Editar .env con valores locales
```

### Paso 3: Instalar PostgreSQL local (opcional)
```bash
# Para Windows: descargar desde postgresql.org
# Para Linux: sudo apt install postgresql

# Crear BD de prueba
createdb factora_pos_dev
```

### Paso 4: Ejecutar migraciones
```bash
python manage.py migrate --settings=FactoraPos.settings_production
```

### Paso 5: Crear superusuario
```bash
python manage.py createsuperuser --settings=FactoraPos.settings_production
```

### Paso 6: Recopilar estáticos
```bash
python manage.py collectstatic --noinput --settings=FactoraPos.settings_production
```

### Paso 7: Probar con Gunicorn
```bash
gunicorn --bind 127.0.0.1:8000 FactoraPos.wsgi:application
```

---

## 🌐 Deployment en Servidor (Producción)

Sigue la **[GUÍA COMPLETA DE DEPLOYMENT](DEPLOYMENT_GUIDE.md)** que incluye:

1. Preparación del servidor
2. Instalación de PostgreSQL
3. Configuración de Gunicorn
4. Configuración de Nginx
5. Certificados SSL con Let's Encrypt
6. Systemd services para auto-restart

**Tiempo estimado:** 30-60 minutos

---

## 🔑 Cambios más importantes

### 1. **settings.py vs settings_production.py**

| Aspecto | Desarrollo | Producción |
|---------|-----------|-----------|
| DEBUG | True | False |
| ALLOWED_HOSTS | * | tu-dominio.com |
| DATABASE | SQLite | PostgreSQL |
| STATIC | Django | WhiteNoise/Nginx |
| SSL | No requerido | Sí (HTTPS forzado) |

### 2. **Variables de entorno (.env)**

Nunca comiteas contraseñas. Usa `.env`:

```python
# Antes (❌ NUNCA HAGAS ESTO)
SECRET_KEY = 'mi-clave-super-secreta'
DB_PASSWORD = 'password123'

# Después (✅ CORRECTO)
SECRET_KEY = os.getenv('SECRET_KEY')
DB_PASSWORD = os.getenv('DB_PASSWORD')
```

### 3. **Estructura del servidor**

```
VPS (Ubuntu 22.04)
  ├── Nginx (Puerto 80/443 - Proxy inverso)
  ├── Gunicorn (Puerto 8000 - App Django)
  ├── PostgreSQL (Base de datos)
  └── Redis (Cache - opcional)
```

---

## ⚙️ Checklist de Configuración

Antes de hacer deploy, asegúrate de:

- [ ] Actualizar SECRET_KEY y ALLOWED_HOSTS en `.env`
- [ ] Cambiar DEBUG a False
- [ ] Configurar EMAIL si necesitas notificaciones
- [ ] Cambiar contraseña de PostgreSQL
- [ ] Generar certificado SSL
- [ ] Revisar [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)

---

## 📊 Comparación: Desarrollo vs Producción

```
┌─────────────────────────────────────────────────────────────┐
│ DESARROLLO (manage.py runserver)                            │
├─────────────────────────────────────────────────────────────┤
│ ✓ Recarga automática de código                              │
│ ✓ Debugging fácil                                           │
│ ✓ Sin SSL/HTTPS                                             │
│ ✓ BD SQLite (suficiente para testing)                       │
│ ✓ Rápido de configurar                                      │
│ ✗ Un solo proceso (sin concurrencia)                        │
│ ✗ Inseguro para datos reales                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRODUCCIÓN (Nginx + Gunicorn + PostgreSQL)                  │
├─────────────────────────────────────────────────────────────┤
│ ✓ Múltiples procesos (concurrencia)                         │
│ ✓ BD PostgreSQL (escalable)                                 │
│ ✓ SSL/HTTPS (seguro)                                        │
│ ✓ Auto-restart en crashes                                   │
│ ✓ Monitoreo y logging                                       │
│ ✓ Asset cache busting                                       │
│ ✗ Configuración más compleja                                │
│ ✗ Costo de servidor                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Recursos útiles

- **[Django Deployment Checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/)**
- **[Gunicorn Documentation](https://docs.gunicorn.org/)**
- **[Nginx Documentation](https://nginx.org/en/docs/)**
- **[PostgreSQL Documentation](https://www.postgresql.org/docs/)**
- **[Let's Encrypt](https://letsencrypt.org/)**

---

## ❓ Preguntas frecuentes

### ¿Qué VPS recomiendas?

- **DigitalOcean** - $6/mes (Basic)
- **Linode** - $5/mes (Basic)
- **AWS** - Variable (~$15-50/mes)
- **Scaleway** - €4/mes
- **Hetzner** - €3/mes

### ¿Cuántos usuarios soporta?

Depende del VPS:
- **$10/mes (2GB RAM)**: ~100-500 usuarios/mes
- **$20/mes (4GB RAM)**: ~1000-5000 usuarios/mes
- **$50/mes (8GB RAM)**: ~10000+ usuarios/mes

### ¿Cómo monitoreo en producción?

```bash
# Ver logs en tiempo real
sudo journalctl -u factora-pos -f

# Ver estado
sudo systemctl status factora-pos

# Ver procesos
ps aux | grep gunicorn

# Usar Sentry (incluido en settings_production.py)
```

### ¿Puedo migrar a Supabase después?

Sí, pero:
- Requeriría reescribir el backend
- Es más trabajo a futuro que hacer ahora
- Tu actual setup es más flexible

**Mi recomendación:** Quédate con Opción A por ahora.

---

## 🎯 Próximos pasos

1. **Hoy**: Leer [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Mañana**: Crear cuenta en DigitalOcean o VPS de tu elección
3. **Semana 1**: Seguir guía de deployment paso a paso
4. **Semana 2**: Testing en producción
5. **Semana 3**: Launch oficial

---

**¡Tu FactoraPos está listo para producción! 🚀**

¿Necesitas ayuda con algo específico? Pregunta en la siguiente línea.

