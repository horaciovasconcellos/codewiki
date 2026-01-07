#!/bin/bash

################################################################################
# SCRIPT DE MIGRAÇÃO DO BANCO DE DADOS
# Sistema de Auditoria
# 
# Executa scripts SQL de migração em ordem
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MIGRATIONS_DIR="${PROJECT_ROOT}/database/migrations"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   DATABASE MIGRATION - Sistema de Auditoria    ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Carregar variáveis de ambiente
source "$PROJECT_ROOT/.env.production" 2>/dev/null || source "$PROJECT_ROOT/.env" || true

DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-rootpass123}"
DB_NAME="${MYSQL_DATABASE:-auditoria_db}"
CONTAINER_NAME="${1:-mysql-master-prod}"

# Verificar se container está rodando
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    log_error "Container $CONTAINER_NAME não está rodando"
    exit 1
fi

# Criar tabela de controle de migrações se não existir
log "Criando tabela de controle de migrações..."
docker exec -i "$CONTAINER_NAME" mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" <<EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(500),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INT,
    checksum VARCHAR(64),
    INDEX idx_version (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

log_success "Tabela de controle criada"

# Verificar se há migrações
if [ ! -d "$MIGRATIONS_DIR" ]; then
    log "Nenhum diretório de migrações encontrado"
    log "Criando diretório: $MIGRATIONS_DIR"
    mkdir -p "$MIGRATIONS_DIR"
    exit 0
fi

# Listar migrações disponíveis
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
    log "Nenhuma migração encontrada em $MIGRATIONS_DIR"
    exit 0
fi

log "Migrações encontradas:"
echo "$MIGRATION_FILES" | while read -r file; do
    echo "  - $(basename "$file")"
done
echo ""

# Executar migrações
EXECUTED=0
SKIPPED=0
FAILED=0

while IFS= read -r migration_file; do
    MIGRATION_NAME=$(basename "$migration_file" .sql)
    
    # Verificar se migração já foi executada
    ALREADY_EXECUTED=$(docker exec "$CONTAINER_NAME" mysql -u root -p"${DB_PASSWORD}" -N -e \
        "SELECT COUNT(*) FROM ${DB_NAME}.schema_migrations WHERE version='${MIGRATION_NAME}'" 2>/dev/null || echo "0")
    
    if [ "$ALREADY_EXECUTED" -gt 0 ]; then
        echo -e "${YELLOW}⊘${NC} $(basename "$migration_file") - Já executada"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    log "Executando: $(basename "$migration_file")"
    
    START_TIME=$(date +%s%3N)
    
    if docker exec -i "$CONTAINER_NAME" mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" < "$migration_file" 2>/dev/null; then
        END_TIME=$(date +%s%3N)
        EXECUTION_TIME=$((END_TIME - START_TIME))
        
        # Calcular checksum
        CHECKSUM=$(md5sum "$migration_file" | cut -d' ' -f1)
        
        # Registrar migração
        docker exec -i "$CONTAINER_NAME" mysql -u root -p"${DB_PASSWORD}" "${DB_NAME}" <<EOF
INSERT INTO schema_migrations (version, description, execution_time_ms, checksum)
VALUES ('${MIGRATION_NAME}', 'Migration from file', ${EXECUTION_TIME}, '${CHECKSUM}');
EOF
        
        log_success "$(basename "$migration_file") - Executada (${EXECUTION_TIME}ms)"
        EXECUTED=$((EXECUTED + 1))
    else
        log_error "$(basename "$migration_file") - Falhou"
        FAILED=$((FAILED + 1))
    fi
done <<< "$MIGRATION_FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "Migrações concluídas!"
echo "  Executadas: $EXECUTED"
echo "  Ignoradas: $SKIPPED"
if [ $FAILED -gt 0 ]; then
    log_error "  Falhadas: $FAILED"
    exit 1
fi
echo ""
