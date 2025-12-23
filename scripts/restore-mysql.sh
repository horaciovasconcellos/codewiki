#!/bin/bash

# Script de restauração do MySQL
# Uso: ./restore-mysql.sh [arquivo_backup.sql.gz] [master|slave]

set -e

if [ -z "$1" ]; then
    echo "Uso: $0 <arquivo_backup.sql.gz> [master|slave]"
    echo ""
    echo "Exemplo:"
    echo "  $0 ~/docker/mysql/master/backup/backup_auditoria_db_20251123_065700.sql.gz master"
    exit 1
fi

BACKUP_FILE="$1"
INSTANCE="${2:-master}"

# Verificar se o arquivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "✗ Arquivo de backup não encontrado: ${BACKUP_FILE}"
    exit 1
fi

# Configurações
MYSQL_USER="root"
MYSQL_PASS="rootpass123"
DATABASE="auditoria_db"

# Determinar container
if [ "$INSTANCE" = "master" ]; then
    CONTAINER="mysql-master"
else
    CONTAINER="mysql-slave"
fi

echo "========================================"
echo "Restauração do MySQL ${INSTANCE}"
echo "========================================"
echo "Arquivo: ${BACKUP_FILE}"
echo "Container: ${CONTAINER}"
echo "Database: ${DATABASE}"
echo ""

read -p "ATENÇÃO: Isso irá sobrescrever o banco de dados atual. Continuar? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "Restaurando backup..."

# Copiar arquivo para dentro do container
docker cp "${BACKUP_FILE}" ${CONTAINER}:/tmp/restore.sql.gz

# Descompactar e restaurar
docker exec ${CONTAINER} bash -c "gunzip < /tmp/restore.sql.gz | mysql -u${MYSQL_USER} -p${MYSQL_PASS}"

# Limpar arquivo temporário
docker exec ${CONTAINER} rm /tmp/restore.sql.gz

echo ""
echo "✓ Restauração concluída com sucesso!"
echo ""
echo "========================================"
echo "Restauração finalizada"
echo "========================================"
