#!/bin/bash
# Script de Limpeza de Logs Antigos
# Autor: Sistema de Auditoria
# Data: 2024-02-01
# Descrição: Remove logs com mais de 30 dias

# Configurações
LOG_DIRS=(
    "/var/log/auditoria"
    "/var/log/app"
    "/var/log/nginx"
)
RETENTION_DAYS=30

echo "Iniciando limpeza de logs com mais de ${RETENTION_DAYS} dias..."

for LOG_DIR in "${LOG_DIRS[@]}"; do
    if [ -d "${LOG_DIR}" ]; then
        echo "Processando diretório: ${LOG_DIR}"
        
        # Encontrar e remover arquivos .log antigos
        find "${LOG_DIR}" -name "*.log" -type f -mtime +${RETENTION_DAYS} -delete
        
        # Encontrar e remover arquivos .gz antigos
        find "${LOG_DIR}" -name "*.gz" -type f -mtime +${RETENTION_DAYS} -delete
        
        echo "Limpeza concluída para: ${LOG_DIR}"
    else
        echo "Diretório não encontrado: ${LOG_DIR}"
    fi
done

echo "Processo de limpeza concluído!"
