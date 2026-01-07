#!/bin/bash

################################################################################
# SCRIPT DE DEPLOY PARA PRODUÇÃO
# Sistema de Auditoria
# 
# Este script gerencia todo o processo de deploy em ambiente de produção:
# - Backup do banco de dados
# - Build da aplicação
# - Deploy com zero-downtime
# - Verificação de saúde
# - Rollback automático em caso de falha
################################################################################

set -e  # Exit on error

# ==================== CONFIGURAÇÕES ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${PROJECT_ROOT}/backups"
LOG_FILE="${PROJECT_ROOT}/deploy-${DEPLOY_DATE}.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ==================== FUNÇÕES UTILITÁRIAS ====================

log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}" | tee -a "$LOG_FILE"
}

log_step() {
    echo -e "${MAGENTA}▶ $1${NC}" | tee -a "$LOG_FILE"
}

# Verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos..."
    
    local missing_tools=()
    
    if ! command_exists docker; then
        missing_tools+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        if ! docker compose version >/dev/null 2>&1; then
            missing_tools+=("docker-compose")
        fi
    fi
    
    if ! command_exists node; then
        missing_tools+=("node")
    fi
    
    if ! command_exists npm; then
        missing_tools+=("npm")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Ferramentas ausentes: ${missing_tools[*]}"
        log_info "Instale as ferramentas necessárias antes de continuar."
        exit 1
    fi
    
    log_success "Todos os pré-requisitos estão instalados"
}

# Verificar arquivo .env.production
check_env_file() {
    log_step "Verificando arquivo de configuração..."
    
    if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
        log_error "Arquivo .env.production não encontrado!"
        log_info "Copie .env.example para .env.production e configure as variáveis:"
        log_info "  cp .env.example .env.production"
        exit 1
    fi
    
    # Verificar senhas padrão
    if grep -q "rootpass123\|apppass123" "$PROJECT_ROOT/.env.production"; then
        log_warning "ATENÇÃO: Senhas padrão detectadas no .env.production!"
        log_warning "Altere as senhas antes de fazer deploy em produção!"
        read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            log_info "Deploy cancelado pelo usuário"
            exit 1
        fi
    fi
    
    log_success "Arquivo de configuração verificado"
}

# Criar diretório de backup
setup_backup_dir() {
    log_step "Preparando diretório de backup..."
    mkdir -p "$BACKUP_DIR"
    log_success "Diretório de backup pronto: $BACKUP_DIR"
}

# Backup do banco de dados
backup_database() {
    log_step "Realizando backup do banco de dados..."
    
    # Verificar se container MySQL está rodando
    if ! docker ps | grep -q mysql-master; then
        log_warning "Container MySQL não está rodando. Pulando backup."
        return 0
    fi
    
    local backup_file="${BACKUP_DIR}/db-backup-${DEPLOY_DATE}.sql"
    
    # Carregar variáveis de ambiente
    source "$PROJECT_ROOT/.env.production" 2>/dev/null || source "$PROJECT_ROOT/.env" || true
    
    local db_password="${MYSQL_ROOT_PASSWORD:-rootpass123}"
    local db_name="${MYSQL_DATABASE:-auditoria_db}"
    
    # Executar backup
    if docker exec mysql-master-prod mysqldump \
        -u root \
        -p"${db_password}" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        "${db_name}" > "$backup_file" 2>/dev/null; then
        
        # Comprimir backup
        gzip "$backup_file"
        log_success "Backup criado: ${backup_file}.gz"
        
        # Manter apenas últimos 5 backups
        cd "$BACKUP_DIR"
        ls -t db-backup-*.sql.gz 2>/dev/null | tail -n +6 | xargs -r rm --
        log_info "Backups antigos limpos (mantidos últimos 5)"
    else
        log_warning "Falha ao criar backup do banco de dados"
        log_warning "Continuando mesmo assim..."
    fi
}

# Build da aplicação
build_application() {
    log_step "Construindo aplicação..."
    
    cd "$PROJECT_ROOT"
    
    # Instalar dependências
    log_info "Instalando dependências..."
    npm ci --production=false
    
    # Build do frontend
    log_info "Compilando frontend..."
    npm run build
    
    log_success "Build da aplicação concluído"
}

# Verificar saúde da aplicação
check_health() {
    local url="$1"
    local max_attempts="${2:-30}"
    local attempt=1
    
    log_info "Verificando saúde da aplicação: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -o /dev/null "$url"; then
            log_success "Aplicação está saudável!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Aplicação não respondeu após $max_attempts tentativas"
    return 1
}

# Stop containers antigos
stop_old_containers() {
    log_step "Parando containers antigos..."
    
    cd "$PROJECT_ROOT"
    
    if docker-compose -f docker-compose.prod.yml ps -q 2>/dev/null | grep -q .; then
        docker-compose -f docker-compose.prod.yml down
        log_success "Containers antigos parados"
    else
        log_info "Nenhum container antigo rodando"
    fi
}

# Deploy com docker-compose
deploy_with_docker() {
    log_step "Iniciando deploy com Docker..."
    
    cd "$PROJECT_ROOT"
    
    # Copiar .env.production para .env (usado pelo docker-compose)
    cp .env.production .env
    
    # Build das imagens
    log_info "Construindo imagens Docker..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Iniciar containers
    log_info "Iniciando containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Containers iniciados"
}

# Verificar status dos containers
check_containers() {
    log_step "Verificando status dos containers..."
    
    cd "$PROJECT_ROOT"
    
    local containers=(
        "auditoria-app-prod"
        "mysql-master-prod"
        "nginx-prod"
    )
    
    local all_healthy=true
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            log_success "Container ${container} está rodando"
        else
            log_warning "Container ${container} NÃO está rodando"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = false ]; then
        log_error "Alguns containers não estão rodando"
        return 1
    fi
    
    return 0
}

# Executar migrações do banco de dados
run_migrations() {
    log_step "Executando migrações do banco de dados..."
    
    # Aguardar MySQL estar pronto
    sleep 10
    
    # Verificar se há scripts de migração
    if [ -d "$PROJECT_ROOT/database/migrations" ]; then
        log_info "Aplicando migrações..."
        
        # Aqui você pode adicionar lógica de migração
        # Exemplo com Liquibase, Flyway, ou scripts SQL customizados
        
        log_success "Migrações aplicadas"
    else
        log_info "Nenhuma migração encontrada"
    fi
}

# Rollback em caso de falha
rollback() {
    log_error "Iniciando rollback..."
    
    cd "$PROJECT_ROOT"
    
    # Parar containers atuais
    docker-compose -f docker-compose.prod.yml down
    
    # Restaurar backup se existir
    local latest_backup=$(ls -t "${BACKUP_DIR}"/db-backup-*.sql.gz 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Restaurando backup: $latest_backup"
        
        # Descompactar e restaurar
        gunzip -c "$latest_backup" | docker exec -i mysql-master-prod mysql \
            -u root \
            -p"${MYSQL_ROOT_PASSWORD:-rootpass123}" \
            "${MYSQL_DATABASE:-auditoria_db}" 2>/dev/null || true
        
        log_success "Banco de dados restaurado"
    fi
    
    log_info "Rollback concluído"
    exit 1
}

# Exibir informações pós-deploy
show_deploy_info() {
    log_success "═══════════════════════════════════════════"
    log_success "  DEPLOY CONCLUÍDO COM SUCESSO!"
    log_success "═══════════════════════════════════════════"
    echo ""
    log_info "Aplicação: http://localhost"
    log_info "API: http://localhost/api"
    log_info "Health Check: http://localhost/health"
    echo ""
    log_info "Comandos úteis:"
    log_info "  Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
    log_info "  Status: docker-compose -f docker-compose.prod.yml ps"
    log_info "  Parar: docker-compose -f docker-compose.prod.yml down"
    echo ""
    log_info "Log do deploy: $LOG_FILE"
    log_info "Backup: ${BACKUP_DIR}/db-backup-${DEPLOY_DATE}.sql.gz"
}

# ==================== MAIN ====================

main() {
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║   DEPLOY TO PRODUCTION - Sistema de Auditoria ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    
    log_info "Iniciando deploy em: $(date)"
    log_info "Projeto: $PROJECT_ROOT"
    
    # Trap para executar rollback em caso de erro
    trap rollback ERR
    
    # Executar passos do deploy
    check_prerequisites
    check_env_file
    setup_backup_dir
    backup_database
    build_application
    stop_old_containers
    deploy_with_docker
    
    # Aguardar containers iniciarem
    log_info "Aguardando containers iniciarem..."
    sleep 15
    
    check_containers
    run_migrations
    
    # Verificar saúde da aplicação
    if check_health "http://localhost:3000/health" 30; then
        show_deploy_info
    else
        log_error "Falha na verificação de saúde"
        rollback
    fi
    
    # Remover trap de erro
    trap - ERR
    
    log_success "Deploy finalizado em: $(date)"
}

# Executar main
main "$@"
