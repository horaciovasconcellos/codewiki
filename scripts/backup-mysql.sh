#!/bin/bash

# Script de backup do MySQL Master
# Uso: ./backup-mysql.sh [master|slave]

set -e

# Configurações
BACKUP_DIR="${HOME}/docker/mysql"
MYSQL_USER="root"
MYSQL_PASS="rootpass123"
DATABASE="auditoria_db"
DATE=$(date +%Y%m%d_%H%M%S)

# Determinar qual instância fazer backup (default: master)
INSTANCE="${1:-master}"

if [ "$INSTANCE" != "master" ] && [ "$INSTANCE" != "slave" ]; then
    echo "Uso: $0 [master|slave]"
    exit 1
fi

# Definir porta e diretório de backup
if [ "$INSTANCE" = "master" ]; then
    PORT=3306
    CONTAINER="mysql-master"
    BACKUP_PATH="${BACKUP_DIR}/master/backup"
else
    PORT=3307
    CONTAINER="mysql-slave"
    BACKUP_PATH="${BACKUP_DIR}/slave/backup"
fi

# Criar diretório de backup se não existir
mkdir -p "${BACKUP_PATH}"

# Nome do arquivo de backup
BACKUP_FILE="${BACKUP_PATH}/backup_${DATABASE}_${DATE}.sql.gz"

echo "========================================"
echo "Backup do MySQL ${INSTANCE}"
echo "========================================"
echo "Database: ${DATABASE}"
echo "Data/Hora: $(date)"
echo "Arquivo: ${BACKUP_FILE}"
echo ""

# Fazer backup usando mysqldump dentro do container
docker exec ${CONTAINER} mysqldump \
    -u${MYSQL_USER} \
    -p${MYSQL_PASS} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases ${DATABASE} | gzip > "${BACKUP_FILE}"

# Verificar se o backup foi criado
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✓ Backup concluído com sucesso!"
    echo "  Tamanho: ${SIZE}"
    echo "  Localização: ${BACKUP_FILE}"
    
    # Limpar backups antigos (manter últimos 7 dias)
    find "${BACKUP_PATH}" -name "backup_*.sql.gz" -type f -mtime +7 -delete
    
    # Contar backups restantes
    BACKUP_COUNT=$(find "${BACKUP_PATH}" -name "backup_*.sql.gz" -type f | wc -l)
    echo "  Backups mantidos: ${BACKUP_COUNT}"
else
    echo "✗ Erro ao criar backup!"
    exit 1
fi

echo ""
echo "========================================"
echo "Backup finalizado"
echo "========================================"
