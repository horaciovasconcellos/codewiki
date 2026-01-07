#!/bin/bash

################################################################################
# SCRIPT DE ROLLBACK
# Sistema de Auditoria
# 
# Restaura a aplicação para um estado anterior usando backup
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"

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

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   ROLLBACK - Sistema de Auditoria              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Verificar se há backups disponíveis
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    log_error "Nenhum backup encontrado em $BACKUP_DIR"
    exit 1
fi

# Listar backups disponíveis
echo "Backups disponíveis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null | awk '{print NR". "$9" ("$5")"}'
echo ""

# Selecionar backup (usar o mais recente por padrão)
BACKUP_FILE=$(ls -t "$BACKUP_DIR"/db-backup-*.sql.gz 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    log_error "Nenhum arquivo de backup encontrado"
    exit 1
fi

log "Backup selecionado: $(basename "$BACKUP_FILE")"
echo ""

# Confirmar rollback
log_warning "Esta operação irá:"
log_warning "  1. Parar todos os containers"
log_warning "  2. Restaurar o banco de dados do backup"
log_warning "  3. Reiniciar a aplicação"
echo ""
read -p "Deseja continuar com o rollback? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    log "Rollback cancelado"
    exit 0
fi

# Carregar variáveis de ambiente
source "$PROJECT_ROOT/.env.production" 2>/dev/null || source "$PROJECT_ROOT/.env" || true

DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-rootpass123}"
DB_NAME="${MYSQL_DATABASE:-auditoria_db}"
CONTAINER_NAME="mysql-master-prod"

# Parar aplicação
log "Parando containers da aplicação..."
cd "$PROJECT_ROOT"
docker-compose -f docker-compose.prod.yml stop app nginx 2>/dev/null || true
log_success "Containers parados"

# Verificar se MySQL está rodando
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    log_error "Container MySQL não está rodando"
    log "Iniciando MySQL..."
    docker-compose -f docker-compose.prod.yml up -d mysql-master
    sleep 10
fi

# Restaurar backup
log "Restaurando banco de dados..."
log "Arquivo: $BACKUP_FILE"

if gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" mysql \
    -u root \
    -p"${DB_PASSWORD}" \
    "${DB_NAME}" 2>/dev/null; then
    log_success "Banco de dados restaurado com sucesso!"
else
    log_error "Falha ao restaurar banco de dados"
    exit 1
fi

# Reiniciar aplicação
log "Reiniciando aplicação..."
docker-compose -f docker-compose.prod.yml up -d

# Aguardar inicialização
log "Aguardando aplicação inicializar..."
sleep 15

# Verificar saúde
log "Verificando saúde da aplicação..."
if curl -f -s http://localhost:3000/health >/dev/null; then
    log_success "Aplicação está saudável!"
else
    log_warning "Não foi possível verificar saúde da aplicação"
fi

echo ""
log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "  ROLLBACK CONCLUÍDO COM SUCESSO!"
log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "Aplicação: http://localhost"
log "Backup restaurado: $(basename "$BACKUP_FILE")"
echo ""
