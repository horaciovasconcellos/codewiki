#!/bin/bash
# Script de Backup Automático Diário
# Autor: Sistema de Auditoria
# Data: 2024-01-15
# Descrição: Realiza backup automático dos bancos de dados MySQL

# Configurações
DB_USER="app_user"
DB_PASSWORD="apppass123"
DB_HOST="mysql-master"
DB_NAME="auditoria_db"
BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Criar diretório de backup se não existir
mkdir -p ${BACKUP_DIR}

# Executar backup
echo "Iniciando backup do banco ${DB_NAME}..."
mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} | gzip > ${BACKUP_DIR}/backup_${DB_NAME}_${DATE}.sql.gz

# Verificar se o backup foi criado com sucesso
if [ $? -eq 0 ]; then
    echo "Backup criado com sucesso: backup_${DB_NAME}_${DATE}.sql.gz"
    
    # Remover backups antigos
    echo "Removendo backups com mais de ${RETENTION_DAYS} dias..."
    find ${BACKUP_DIR} -name "backup_${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
    
    echo "Processo de backup concluído!"
else
    echo "ERRO: Falha ao criar backup!"
    exit 1
fi
