#!/bin/bash

# ===========================================
# Script de Deploy para Produção
# ===========================================
# Uso: ./deploy-production.sh [comando]
#
# Comandos:
#   build     - Build das imagens
#   start     - Iniciar serviços
#   stop      - Parar serviços
#   restart   - Reiniciar serviços
#   logs      - Ver logs
#   status    - Status dos containers
#   health    - Verificar health da aplicação
#   backup    - Fazer backup do banco
# ===========================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arquivo do docker-compose
COMPOSE_FILE="docker-compose.prod.yml"

# Função para printar com cor
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se .env existe
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env não encontrado!"
        print_info "Copiando .env.production para .env..."
        cp .env.production .env
        print_warning "⚠️  IMPORTANTE: Edite o arquivo .env e altere as senhas padrão!"
        print_info "Execute: nano .env"
        exit 1
    fi
}

# Build das imagens
build() {
    print_info "Building imagens Docker..."
    docker-compose -f $COMPOSE_FILE build
    print_success "Build concluído!"
}

# Iniciar serviços
start() {
    check_env
    print_info "Iniciando serviços..."
    
    # Perguntar se quer incluir Nginx
    read -p "Incluir Nginx? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE --profile with-nginx up -d
    else
        docker-compose -f $COMPOSE_FILE up -d
    fi
    
    print_success "Serviços iniciados!"
    print_info "Aguarde alguns segundos para os healthchecks..."
    sleep 5
    status
}

# Parar serviços
stop() {
    print_info "Parando serviços..."
    docker-compose -f $COMPOSE_FILE down
    print_success "Serviços parados!"
}

# Reiniciar serviços
restart() {
    print_info "Reiniciando serviços..."
    docker-compose -f $COMPOSE_FILE restart
    print_success "Serviços reiniciados!"
}

# Ver logs
logs() {
    if [ -z "$2" ]; then
        docker-compose -f $COMPOSE_FILE logs -f --tail=100
    else
        docker-compose -f $COMPOSE_FILE logs -f --tail=100 "$2"
    fi
}

# Status dos containers
status() {
    print_info "Status dos containers:"
    docker-compose -f $COMPOSE_FILE ps
    echo
    print_info "Uso de recursos:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        $(docker-compose -f $COMPOSE_FILE ps -q) 2>/dev/null || echo "Nenhum container rodando"
}

# Verificar health da aplicação
health() {
    print_info "Verificando health da aplicação..."
    
    # Tentar conectar no healthcheck
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
        print_success "Aplicação está saudável!"
        echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
    else
        print_error "Aplicação não está respondendo!"
        print_info "Verificando logs..."
        docker-compose -f $COMPOSE_FILE logs --tail=20 app
        exit 1
    fi
}

# Backup do banco
backup() {
    print_info "Fazendo backup do banco de dados..."
    
    # Pegar senha do .env
    source .env
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec mysql-master-prod mysqldump \
        -u root \
        -p"${MYSQL_ROOT_PASSWORD}" \
        "${MYSQL_DATABASE}" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Backup criado: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
    else
        print_error "Erro ao criar backup!"
        exit 1
    fi
}

# Shell interativo no container
shell() {
    SERVICE=${2:-app}
    print_info "Abrindo shell no container $SERVICE..."
    docker-compose -f $COMPOSE_FILE exec "$SERVICE" sh
}

# Mostrar ajuda
help() {
    cat << EOF
🐳 Script de Deploy para Produção

Uso: ./deploy-production.sh [comando] [opções]

Comandos disponíveis:
  build              Build das imagens Docker
  start              Iniciar todos os serviços
  stop               Parar todos os serviços
  restart            Reiniciar todos os serviços
  logs [serviço]     Ver logs (app, mysql-master-prod, nginx)
  status             Status e uso de recursos
  health             Verificar health da aplicação
  backup             Fazer backup do banco de dados
  shell [serviço]    Abrir shell no container (padrão: app)
  help               Mostrar esta ajuda

Exemplos:
  ./deploy-production.sh build
  ./deploy-production.sh start
  ./deploy-production.sh logs app
  ./deploy-production.sh health
  ./deploy-production.sh backup
  ./deploy-production.sh shell mysql-master-prod

Para mais informações, consulte: DOCKER-PRODUCTION-SETUP.md
EOF
}

# Main
case "$1" in
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$@"
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    backup)
        backup
        ;;
    shell)
        shell "$@"
        ;;
    help|--help|-h|"")
        help
        ;;
    *)
        print_error "Comando desconhecido: $1"
        echo
        help
        exit 1
        ;;
esac

exit 0
