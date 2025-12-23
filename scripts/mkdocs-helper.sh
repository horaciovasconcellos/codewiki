#!/bin/bash

# Script para gerenciar o container MkDocs
# Uso: ./mkdocs-helper.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
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

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║   MkDocs Container Helper             ║"
    echo "║   Sistema de Auditoria                ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
}

# Ajuda
show_help() {
    cat << EOF
Uso: ./mkdocs-helper.sh [comando]

Comandos disponíveis:

  build       - Build da imagem Docker do MkDocs
  start       - Iniciar container MkDocs
  stop        - Parar container MkDocs
  restart     - Reiniciar container MkDocs
  logs        - Ver logs do container
  status      - Verificar status do container
  open        - Abrir documentação no navegador
  rebuild     - Rebuild completo (sem cache)
  remove      - Remover container e imagem
  validate    - Validar mkdocs.yml
  serve-local - Servir MkDocs localmente (sem Docker)
  help        - Mostrar esta ajuda

Exemplos:
  ./mkdocs-helper.sh build
  ./mkdocs-helper.sh start
  ./mkdocs-helper.sh logs
  ./mkdocs-helper.sh open

EOF
}

# Build da imagem
build_image() {
    log_info "Building imagem Docker do MkDocs..."
    docker-compose build mkdocs
    log_success "Imagem criada com sucesso!"
}

# Iniciar container
start_container() {
    log_info "Iniciando container MkDocs..."
    docker-compose up -d mkdocs
    sleep 2
    
    if docker ps | grep -q auditoria-mkdocs; then
        log_success "Container iniciado com sucesso!"
        log_info "Documentação disponível em: ${GREEN}http://localhost:8082${NC}"
    else
        log_error "Falha ao iniciar container"
        exit 1
    fi
}

# Parar container
stop_container() {
    log_info "Parando container MkDocs..."
    docker-compose stop mkdocs
    log_success "Container parado"
}

# Restart container
restart_container() {
    log_info "Reiniciando container MkDocs..."
    docker-compose restart mkdocs
    log_success "Container reiniciado"
}

# Ver logs
show_logs() {
    log_info "Mostrando logs do container (Ctrl+C para sair)..."
    docker-compose logs -f mkdocs
}

# Status
check_status() {
    log_info "Verificando status do container..."
    
    if docker ps | grep -q auditoria-mkdocs; then
        log_success "Container está rodando"
        echo ""
        docker ps --filter name=auditoria-mkdocs --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        log_info "URL: ${GREEN}http://localhost:8082${NC}"
        
        # Testar conectividade
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082 | grep -q 200; then
            log_success "Serviço respondendo corretamente"
        else
            log_warning "Container rodando mas serviço não responde"
        fi
    else
        log_warning "Container não está rodando"
        echo ""
        docker ps -a --filter name=auditoria-mkdocs --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
}

# Abrir no navegador
open_browser() {
    log_info "Abrindo documentação no navegador..."
    
    if docker ps | grep -q auditoria-mkdocs; then
        if command -v open &> /dev/null; then
            open http://localhost:8082
        elif command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:8082
        else
            log_info "Acesse manualmente: ${GREEN}http://localhost:8082${NC}"
        fi
        log_success "Navegador aberto"
    else
        log_error "Container não está rodando. Execute: ./mkdocs-helper.sh start"
        exit 1
    fi
}

# Rebuild completo
rebuild_image() {
    log_info "Rebuild completo do container MkDocs..."
    docker-compose build --no-cache mkdocs
    docker-compose up -d --force-recreate mkdocs
    log_success "Rebuild concluído!"
}

# Remover container e imagem
remove_all() {
    log_warning "Removendo container e imagem MkDocs..."
    read -p "Tem certeza? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        docker-compose down mkdocs
        docker rmi sistema-de-auditoria-mkdocs 2>/dev/null || true
        log_success "Container e imagem removidos"
    else
        log_info "Operação cancelada"
    fi
}

# Validar mkdocs.yml
validate_config() {
    log_info "Validando mkdocs.yml..."
    
    if command -v mkdocs &> /dev/null; then
        mkdocs build --strict 2>&1 | head -20
        log_success "Validação concluída"
    else
        log_warning "MkDocs não instalado localmente. Validando no container..."
        docker-compose run --rm mkdocs mkdocs build --strict
    fi
}

# Servir localmente
serve_local() {
    log_info "Servindo MkDocs localmente (sem Docker)..."
    
    if ! command -v mkdocs &> /dev/null; then
        log_error "MkDocs não instalado. Instale com: pip install mkdocs-material"
        exit 1
    fi
    
    log_info "Documentação disponível em: ${GREEN}http://localhost:8000${NC}"
    mkdocs serve
}

# Main
main() {
    show_banner
    
    case "${1:-help}" in
        build)
            build_image
            ;;
        start)
            start_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        logs)
            show_logs
            ;;
        status)
            check_status
            ;;
        open)
            open_browser
            ;;
        rebuild)
            rebuild_image
            ;;
        remove)
            remove_all
            ;;
        validate)
            validate_config
            ;;
        serve-local)
            serve_local
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
}

main "$@"
