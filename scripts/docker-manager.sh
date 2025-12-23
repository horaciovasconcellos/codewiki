#!/bin/bash

# Script de gerenciamento do ambiente Docker
# Sistema de Auditoria - Aplicação Completa em Container

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Função para verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker não está rodando. Inicie o Docker Desktop."
        exit 1
    fi
}

# Função para build
build() {
    log_info "Construindo containers..."
    docker-compose build --no-cache
    log_success "Build concluído!"
}

# Função para iniciar
start() {
    log_info "Iniciando containers..."
    docker-compose up -d
    
    log_info "Aguardando containers ficarem saudáveis..."
    sleep 10
    
    # Verificar status
    docker-compose ps
    
    log_success "Containers iniciados!"
    log_info "Frontend: http://localhost:5173"
    log_info "Backend: http://localhost:3000"
    log_info "MySQL Master: localhost:3306"
    log_info "MySQL Slave: localhost:3307"
}

# Função para parar
stop() {
    log_info "Parando containers..."
    docker-compose down
    log_success "Containers parados!"
}

# Função para restart
restart() {
    stop
    start
}

# Função para logs
logs() {
    SERVICE=${1:-app}
    log_info "Mostrando logs do serviço: $SERVICE"
    docker-compose logs -f "$SERVICE"
}

# Função para status
status() {
    log_info "Status dos containers:"
    docker-compose ps
    echo ""
    log_info "Uso de recursos:"
    docker stats --no-stream $(docker-compose ps -q)
}

# Função para shell
shell() {
    SERVICE=${1:-app}
    log_info "Abrindo shell no container: $SERVICE"
    docker-compose exec "$SERVICE" /bin/sh
}

# Função para limpar tudo
clean() {
    log_warning "Isso vai remover TODOS os containers, volumes e imagens do projeto!"
    read -p "Tem certeza? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        log_info "Removendo containers e volumes..."
        docker-compose down -v
        docker-compose rm -f
        log_success "Limpeza concluída!"
    else
        log_info "Operação cancelada."
    fi
}

# Função para health check
health() {
    log_info "Verificando saúde dos serviços..."
    echo ""
    
    echo "🔍 Backend (API):"
    curl -s http://localhost:3000/health | jq . || echo "  ✗ Backend não está respondendo"
    
    echo ""
    echo "🔍 Frontend (Vite):"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "  ✓ Frontend está respondendo (HTTP $HTTP_CODE)"
    else
        echo "  ✗ Frontend não está respondendo (HTTP $HTTP_CODE)"
    fi
    
    echo ""
    echo "🔍 MySQL Master:"
    docker exec mysql-master mysqladmin ping -h localhost -uroot -prootpass123 2>/dev/null && \
        echo "  ✓ MySQL Master está rodando" || \
        echo "  ✗ MySQL Master não está respondendo"
    
    echo ""
    echo "🔍 MySQL Slave:"
    docker exec mysql-slave mysqladmin ping -h localhost -uroot -prootpass123 2>/dev/null && \
        echo "  ✓ MySQL Slave está rodando" || \
        echo "  ✗ MySQL Slave não está respondendo"
}

# Função para exibir ajuda
show_help() {
    cat << EOF
${GREEN}Sistema de Auditoria - Gerenciador Docker${NC}

${BLUE}Uso:${NC}
  ./docker-manager.sh [comando]

${BLUE}Comandos disponíveis:${NC}
  ${GREEN}build${NC}       Constrói as imagens Docker
  ${GREEN}start${NC}       Inicia todos os containers
  ${GREEN}stop${NC}        Para todos os containers
  ${GREEN}restart${NC}     Reinicia todos os containers
  ${GREEN}logs${NC}        Exibe logs (padrão: app)
              Uso: ./docker-manager.sh logs [app|mysql-master|mysql-slave]
  ${GREEN}status${NC}      Mostra status dos containers
  ${GREEN}health${NC}      Verifica saúde dos serviços
  ${GREEN}shell${NC}       Abre shell no container (padrão: app)
              Uso: ./docker-manager.sh shell [app|mysql-master|mysql-slave]
  ${GREEN}clean${NC}       Remove containers, volumes e imagens
  ${GREEN}help${NC}        Exibe esta ajuda

${BLUE}Exemplos:${NC}
  ./docker-manager.sh start          # Inicia toda a aplicação
  ./docker-manager.sh logs app       # Vê logs da aplicação
  ./docker-manager.sh shell app      # Abre shell no container da app
  ./docker-manager.sh health         # Verifica se tudo está funcionando

EOF
}

# Main
check_docker

case "${1:-help}" in
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
        logs "$2"
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    shell)
        shell "$2"
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Comando desconhecido: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
