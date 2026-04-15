# ✅ PRE-DEPLOYMENT CHECKLIST - FACTORА-POS

## 🔐 Seguridad

- [ ] `DEBUG = False` en settings_production.py
- [ ] `SECRET_KEY` cambiado a une nueva clave segura
- [ ] `ALLOWED_HOSTS` configurado correctamente
- [ ] Variables de entorno en `.env` (no en código)
- [ ] `.env` agregado a `.gitignore`
- [ ] Contraseña de BD segura (16+ caracteres)
- [ ] HTTPS/SSL habilitado en Nginx
- [ ] CSRF tokens funcionando
- [ ] Headers de seguridad configurados

## 🗄️ Base de Datos

- [ ] PostgreSQL instalado y configurado
- [ ] Base de datos "factora_pos_db" creada
- [ ] Usuario "factora_pos_user" creado con permisos limitados
- [ ] Conexión probada desde Django
- [ ] Migraciones ejecutadas (`python manage.py migrate`)
- [ ] Plan de backups automáticos establecido

## 📦 Dependencias

- [ ] Todas las dependencias en `requirements.txt`
- [ ] `requirements.txt` versionado y testeado
- [ ] No hay conflictos de versiones
- [ ] Virtual environment separado para producción

## 🚀 Servidor

- [ ] Gunicorn instalado y configurado
- [ ] Nginx instalado y configurado
- [ ] Firewall permitiendo puertos 80 y 443
- [ ] Systemd service creado para auto-inicio

## 📂 Archivos & Permisos

- [ ] `STATIC_ROOT` y `STATIC_ROOT` existen
- [ ] Permisos correctos en `/var/www/factora-pos`
- [ ] Permisos correctos en directorios de logs
- [ ] Permisos correctos en directorios de media
- [ ] Archivos estáticos compilados (`collectstatic`)

## 🧪 Testing

- [ ] Tests unitarios pasan
- [ ] `python manage.py check --deploy` sin errores
- [ ] URLs robadas funcionan en producción
- [ ] API endpoints responden correctamente
- [ ] Scanner 2D funciona en producción
- [ ] Autenticación funciona
- [ ] Reportes generan correctamente

## 📊 Monitoring & Logging

- [ ] Logging configurado
- [ ] Directorio de logs existe y es escribible
- [ ] Rotación de logs configurada
- [ ] Monitoreo de errores (Sentry) opcional
- [ ] Alertas de uptime configuradas

## 🔄 Deployment Process

- [ ] Script `deploy.sh` probado
- [ ] Backup automático de BD configurado
- [ ] Plan de rollback documentado
- [ ] Actualizaciones programadas en horarios de bajo uso
- [ ] Equipo notificado de cambios

## 🌍 Domain & DNS

- [ ] Dominio apunta a IP del servidor
- [ ] A records configurados correctamente
- [ ] AAAA records (IPv6) si aplica
- [ ] TTL de DNS apropiado
- [ ] Certificados SSL válidos

## 📱 Performance

- [ ] Caché configurado (Redis)
- [ ] Archivos estáticos servidos por Nginx (no por Django)
- [ ] Compresión GZIP habilitada
- [ ] CDN configurado (opcional)
- [ ] Comprobación de velocidad realizada

## 📚 Documentación

- [ ] `DEPLOYMENT_GUIDE.md` actualizado
- [ ] `README.md` con instrucciones de producción
- [ ] Credenciales en gestor seguro (1Password, LastPass, etc)
- [ ] Runbooks para emergencias documentados
- [ ] Contactos de soporte establecidos

## 🎯 Pruebas Finales (48h antes del launch)

```bash
# Verificar todas estas acciones:
python manage.py check --deploy --settings=FactoraPos.settings_production

# Prueba de stress (simular carga)
ab -n 1000 -c 10 https://tu-dominio.com/

# Prueba de SSL
curl -I https://tu-dominio.com/

# Verificar headers de seguridad
curl -I https://tu-dominio.com/ | grep -E "Strict-Transport|X-Content-Type|X-Frame"

# Probar login y funcionalidades principales
Manual testing en navegador
```

## 🚨 Plan de Rollback

En caso de emergencia:

```bash
# 1. Revertir código
cd /var/www/factora-pos
git revert <commit-hash>

# 2. Restaurar BD desde backup
sudo -u postgres pg_restore -d factora_pos_db < backup_YYYYMMDD_HHMMSS.sql

# 3. Reiniciar servicios
sudo systemctl restart factora-pos nginx

# 4. Verificar estado
sudo systemctl status factora-pos
```

---

**Completar TODOS los ítems antes de hacer deploy en producción.**

**Última revisión:** ____/__/__  
**Responsable:** _______________  
**Aprobado por:** _______________
