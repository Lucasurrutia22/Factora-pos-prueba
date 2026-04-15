#!/bin/bash

# ============================================
# Script de Deployment y Actualización
# Guardar como: deploy.sh
# Uso: bash deploy.sh
# ============================================

set -e  # Exit on error

echo "🚀 FactoraPos - Deployment Script"
echo "=================================="

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/factora-pos"
GIT_BRANCH="${1:-main}"
BACKUP_DIR="/var/backups/factora-pos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Funciones
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar permisos
if [ "$EUID" -ne 0 ]; then 
    log_error "Este script debe ejecutarse con sudo"
    exit 1
fi

# 2. Crear backup de base de datos
log_info "Creando backup de base de datos..."
mkdir -p "$BACKUP_DIR"
sudo -u postgres pg_dump factora_pos_db > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
log_info "✓ Backup guardado en $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# 3. Actualizar código
log_info "Actualizando código desde Git ($GIT_BRANCH)..."
cd "$APP_DIR"
git fetch origin
git checkout "$GIT_BRANCH"
git pull origin "$GIT_BRANCH"
log_info "✓ Código actualizado"

# 4. Activar entorno virtual
log_info "Activando entorno virtual..."
source "$APP_DIR/venv/bin/activate"

# 5. Instalar dependencias
log_info "Instalando dependencias..."
pip install --upgrade pip
pip install -r requirements.txt
log_info "✓ Dependencias instaladas"

# 6. Ejecutar migraciones
log_info "Ejecutando migraciones de base de datos..."
python manage.py migrate --settings=FactoraPos.settings_production
log_info "✓ Migraciones completadas"

# 7. Recopilar archivos estáticos
log_info "Compilando archivos estáticos..."
python manage.py collectstatic --noinput --settings=FactoraPos.settings_production
log_info "✓ Archivos estáticos listos"

# 8. Validar configuración
log_info "Validando configuración de Django..."
python manage.py check --deploy --settings=FactoraPos.settings_production
log_info "✓ Configuración válida"

# 9. Reiniciar servicios
log_info "Reiniciando servicios..."
systemctl restart factora-pos
systemctl restart nginx
log_info "✓ Servicios reiniciados"

# 10. Verificar estado
log_info "Verificando estado de servicios..."
if systemctl is-active --quiet factora-pos && systemctl is-active --quiet nginx; then
    log_info "✓ Servicios corriendo correctamente"
else
    log_error "✗ Uno o más servicios no está corriendo"
    exit 1
fi

# 11. Resumen
echo ""
log_info "✅ DEPLOYMENT COMPLETADO"
echo "=================================="
echo "  Rama: $GIT_BRANCH"
echo "  Timestamp: $TIMESTAMP"
echo "  Backup DB: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
echo ""
log_info "Ver logs con: journalctl -u factora-pos -f"
log_info "Visita: https://tu-dominio.com"
echo ""
