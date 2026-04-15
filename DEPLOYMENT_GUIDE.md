# 🚀 GUÍA DE DEPLOYMENT - FACTORА-POS (OPCIÓN A)

## Requisitos

- **VPS Linux** (Ubuntu 22.04 recomendado)
- **Python 3.10+**
- **PostgreSQL 14+**
- **Nginx**
- **Git**
- **Certtbot** (para SSL)

---

## 📋 PASO 1: Preparar el servidor

```bash
# 1.1 Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 1.2 Instalar dependencias
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx git certbot python3-certbot-nginx

# 1.3 Crear usuario para la app
sudo useradd -m -s /bin/bash factora
sudo usermod -aG sudo factora
su - factora

# 1.4 Crear directorios
mkdir -p /var/www/factora-pos
mkdir -p /var/log/factora-pos
mkdir -p /var/run/gunicorn
```

---

## 📦 PASO 2: Clonar y configurar la aplicación

```bash
cd /var/www/factora-pos

# 2.1 Clonar repositorio
git clone https://github.com/Lucasurrutia22/FactoraPos_Git.git .

# 2.2 Crear entorno virtual
python3 -m venv venv
source venv/bin/activate

# 2.3 Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# 2.4 Copiar archivo .env
cp .env.example .env
nano .env  # Editar con tus valores

# 2.5 Crear directorio para logs
mkdir -p logs
chmod 755 logs
```

---

## 🗄️ PASO 3: Configurar PostgreSQL

```bash
sudo -u postgres psql

# Crear base de datos
CREATE DATABASE factora_pos_db;

# Crear usuario
CREATE USER factora_pos_user WITH PASSWORD 'tu-password-seguro-aqui';

# Otorgar permisos
ALTER ROLE factora_pos_user SET client_encoding TO 'utf8';
ALTER ROLE factora_pos_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE factora_pos_user SET default_transaction_deferrable TO on;
ALTER ROLE factora_pos_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE factora_pos_db TO factora_pos_user;

# Salir
\\q

# Conectar con el usuario factora_pos_user para crear extensiones
sudo -u postgres psql -d factora_pos_db -c "ALTER USER factora_pos_user CREATEDB;"
```

---

## ⚙️ PASO 4: Migraciones y configuración de Django

```bash
cd /var/www/factora-pos
source venv/bin/activate

# 4.1 Recopilar archivos estáticos
python manage.py collectstatic --noinput --settings=FactoraPos.settings_production

# 4.2 Ejecutar migraciones
python manage.py migrate --settings=FactoraPos.settings_production

# 4.3 Crear usuario administrador
python manage.py createsuperuser --settings=FactoraPos.settings_production

# 4.4 Verificar que todo está bien
python manage.py check --deploy --settings=FactoraPos.settings_production
```

---

## 🔌 PASO 5: Configurar Gunicorn con Systemd

```bash
# 5.1 Crear archivo de servicio
sudo nano /etc/systemd/system/factora-pos.service
```

Agregar el siguiente contenido:

```ini
[Unit]
Description=FactoraPos Gunicorn Application Server
After=network.target
After=postgresql.service

[Service]
User=factora
Group=www-data
WorkingDirectory=/var/www/factora-pos
Environment="PATH=/var/www/factora-pos/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=FactoraPos.settings_production"

# Cargar variables de .env
EnvironmentFile=/var/www/factora-pos/.env

ExecStart=/var/www/factora-pos/venv/bin/gunicorn \
    --config /var/www/factora-pos/gunicorn_conf.py \
    --bind 127.0.0.1:8000 \
    FactoraPos.wsgi:application

# Restart policy
Restart=always
RestartSec=10

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=factora-pos

[Install]
WantedBy=multi-user.target
```

Luego:

```bash
# 5.2 Habilitar y iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable factora-pos.service
sudo systemctl start factora-pos.service
sudo systemctl status factora-pos.service

# 5.3 Ver logs
sudo journalctl -u factora-pos -f
```

---

## 🌐 PASO 6: Configurar Nginx

```bash
# 6.1 Copiar configuración
sudo cp /var/www/factora-pos/nginx.conf.example /etc/nginx/sites-available/factora-pos

# 6.2 Editar archivo
sudo nano /etc/nginx/sites-available/factora-pos
# Cambiar "tu-dominio.com" por tu dominio real

# 6.3 Habilitar sitio
sudo ln -s /etc/nginx/sites-available/factora-pos /etc/nginx/sites-enabled/

# 6.4 Deshabilitар sitio por defecto (si existe)
sudo rm /etc/nginx/sites-enabled/default

# 6.5 Verificar sintaxis
sudo nginx -t

# 6.6 Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 PASO 7: Configurar SSL con Let's Encrypt

```bash
# 7.1 Generar certificado
sudo certbot certonly --nginx -d tu-dominio.com -d www.tu-dominio.com

# 7.2 Renovación automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 7.3 Verificar renovación
sudo certbot renew --dry-run
```

---

## ✅ PASO 8: Verificación final

```bash
# 8.1 Verificar estado de servicios
sudo systemctl status nginx
sudo systemctl status factora-pos
sudo systemctl status postgresql

# 8.2 Ver logs de Nginx
sudo tail -f /var/log/nginx/factora-pos_*.log

# 8.3 Ver logs de Gunicorn
sudo journalctl -u factora-pos -f

# 8.4 Probar conexión a BD
sudo -u postgres psql -U factora_pos_user -d factora_pos_db -c "SELECT version();"
```

---

## 🔄 Comandos útiles en producción

```bash
# Reiniciar aplicación
sudo systemctl restart factora-pos

# Ver estado
sudo systemctl status factora-pos

# Actualizar código
cd /var/www/factora-pos
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --settings=FactoraPos.settings_production
python manage.py collectstatic --noinput --settings=FactoraPos.settings_production
sudo systemctl restart factora-pos

# Revisar disk space
df -h

# Revisar procesos
ps aux | grep gunicorn

# Backup de base de datos
sudo -u postgres pg_dump factora_pos_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🐛 Troubleshooting

### Error: "connection refused"
```bash
# Verificar que Gunicorn está corriendo
sudo systemctl status factora-pos

# Reiniciar
sudo systemctl restart factora-pos
```

### Error: "permission denied"
```bash
# Verificar permisos
sudo chown -R factora:www-data /var/www/factora-pos
chmod -R 755 /var/www/factora-pos
```

### Error: "502 Bad Gateway"
```bash
# Ver logs
sudo journalctl -u factora-pos -n 50

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Error: "SSL certificate problem"
```bash
# Renovar certificado manualmente
sudo certbot renew --force-renewal
```

---

## 📊 Monitoreo recomendado

Instalar herramientas de monitoreo:

```bash
# Monitoreo de procesos
sudo apt install htop

# Análisis de logs
sudo apt install lnav

# Alertas de error (Sentry)
# Ya incluido en requirements.txt
```

---

## 🎯 Próximos pasos

1. ✅ Configurar backups automáticos de BD
2. ✅ Configurar alertas (Sentry)
3. ✅ Setup de CDN para archivos estáticos
4. ✅ Configurar email transaccional
5. ✅ Monitoreo con Prometheus/Grafana (opcional)

---

**¡Tu FactoraPos está en producción! 🎉**
