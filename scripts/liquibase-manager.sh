#!/bin/bash

##############################################################################
# Script de Gerenciamento de Database com Liquibase
# 
# Uso: ./liquibase-manager.sh [comando] [opcoes]
#
# Comandos disponíveis:
#   validate    - Valida os changelogs
#   update      - Aplica todas as migrations pendentes
#   status      - Mostra status das migrations
#   rollback    - Faz rollback (requer -n N para número de changesets)
#   tag         - Cria uma tag (requer -t nome-da-tag)
#   clear       - Limpa checksums
#   docs        - Gera documentação do banco
#
##############################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações padrão
PROFILE="dev"
DB_URL="jdbc:mysql://localhost:3306/auditoria_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Sao_Paulo"
DB_USER="root"
DB_PASS="rootpass123"

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Gerenciador de Database com Liquibase + Maven${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Uso: $0 [comando] [opções]"
    echo ""
    echo "Comandos:"
    echo "  validate              Valida sintaxe dos changelogs"
    echo "  update                Aplica todas migrations pendentes"
    echo "  status                Mostra status das migrations"
    echo "  rollback -n N         Faz rollback de N changesets"
    echo "  rollback-date -d DATA Faz rollback até uma data (YYYY-MM-DD)"
    echo "  tag -t TAG            Cria uma tag no estado atual"
    echo "  clear                 Limpa checksums (use após editar changelog)"
    echo "  docs                  Gera documentação HTML do banco"
    echo "  history               Mostra histórico de execuções"
    echo "  diff                  Mostra diferenças entre changelog e banco"
    echo ""
    echo "Opções:"
    echo "  -p, --profile PROFILE Profile Maven (dev|ci|prod) [default: dev]"
    echo "  -h, --help            Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 validate"
    echo "  $0 update"
    echo "  $0 status"
    echo "  $0 rollback -n 1"
    echo "  $0 tag -t v1.0.0"
    echo "  $0 update -p prod"
    echo ""
}

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Função para verificar pré-requisitos
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    # Verificar Maven
    if ! command -v mvn &> /dev/null; then
        log_error "Maven não encontrado! Instale Maven 3.6+ primeiro."
        exit 1
    fi
    
    # Verificar Java
    if ! command -v java &> /dev/null; then
        log_error "Java não encontrado! Instale Java 11+ primeiro."
        exit 1
    fi
    
    # Verificar MySQL Client (opcional, para comandos extras)
    if ! command -v mysql &> /dev/null; then
        log_warning "MySQL client não encontrado. Alguns comandos podem não funcionar."
    fi
    
    log_success "Pré-requisitos OK"
}

# Função para executar comando Maven
run_maven() {
    local goal=$1
    shift
    local extra_args="$@"
    
    log_info "Executando: mvn liquibase:${goal} -P${PROFILE} ${extra_args}"
    mvn liquibase:${goal} -P${PROFILE} ${extra_args}
}

# Comando: Validate
cmd_validate() {
    log_info "Validando changelogs..."
    run_maven validate
    log_success "Validação concluída!"
}

# Comando: Update
cmd_update() {
    log_info "Aplicando migrations..."
    run_maven update
    log_success "Migrations aplicadas com sucesso!"
}

# Comando: Status
cmd_status() {
    log_info "Verificando status das migrations..."
    run_maven status
}

# Comando: Rollback
cmd_rollback() {
    if [ -z "$ROLLBACK_COUNT" ]; then
        log_error "Especifique o número de changesets com -n"
        echo "Exemplo: $0 rollback -n 1"
        exit 1
    fi
    
    log_warning "Fazendo rollback de ${ROLLBACK_COUNT} changeset(s)..."
    read -p "Tem certeza? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        run_maven rollback "-Dliquibase.rollbackCount=${ROLLBACK_COUNT}"
        log_success "Rollback concluído!"
    else
        log_info "Rollback cancelado."
    fi
}

# Comando: Rollback por data
cmd_rollback_date() {
    if [ -z "$ROLLBACK_DATE" ]; then
        log_error "Especifique a data com -d YYYY-MM-DD"
        exit 1
    fi
    
    log_warning "Fazendo rollback até ${ROLLBACK_DATE}..."
    read -p "Tem certeza? (s/N): " confirm
    if [[ $confirm == [sS] ]]; then
        run_maven rollback "-Dliquibase.rollbackDate='${ROLLBACK_DATE}'"
        log_success "Rollback concluído!"
    else
        log_info "Rollback cancelado."
    fi
}

# Comando: Tag
cmd_tag() {
    if [ -z "$TAG_NAME" ]; then
        log_error "Especifique o nome da tag com -t"
        echo "Exemplo: $0 tag -t v1.0.0"
        exit 1
    fi
    
    log_info "Criando tag '${TAG_NAME}'..."
    run_maven tag "-Dliquibase.tag=${TAG_NAME}"
    log_success "Tag '${TAG_NAME}' criada!"
}

# Comando: Clear Checksums
cmd_clear() {
    log_info "Limpando checksums..."
    run_maven clearCheckSums
    log_success "Checksums limpos!"
}

# Comando: Generate Docs
cmd_docs() {
    log_info "Gerando documentação do banco..."
    mkdir -p target/dbdocs
    run_maven dbDoc "-Dliquibase.outputDirectory=target/dbdocs"
    log_success "Documentação gerada em: target/dbdocs/index.html"
    
    if command -v open &> /dev/null; then
        open target/dbdocs/index.html
    fi
}

# Comando: History
cmd_history() {
    log_info "Histórico de execuções (últimas 20):"
    mysql -h localhost -u root -p${DB_PASS} auditoria_db -e \
        "SELECT ID, AUTHOR, FILENAME, DATE_FORMAT(DATEEXECUTED, '%Y-%m-%d %H:%i:%s') AS EXECUTED, EXECTYPE 
         FROM DATABASECHANGELOG 
         ORDER BY DATEEXECUTED DESC 
         LIMIT 20;" 2>/dev/null || log_warning "Erro ao conectar no banco. Verifique se MySQL está rodando."
}

# Comando: Diff
cmd_diff() {
    log_info "Comparando changelog com banco atual..."
    run_maven diff
}

# Parse de argumentos
COMMAND=""
ROLLBACK_COUNT=""
ROLLBACK_DATE=""
TAG_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        validate|update|status|clear|docs|history|diff)
            COMMAND=$1
            shift
            ;;
        rollback)
            COMMAND="rollback"
            shift
            ;;
        rollback-date)
            COMMAND="rollback-date"
            shift
            ;;
        tag)
            COMMAND="tag"
            shift
            ;;
        -n)
            ROLLBACK_COUNT="$2"
            shift 2
            ;;
        -d)
            ROLLBACK_DATE="$2"
            shift 2
            ;;
        -t)
            TAG_NAME="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Comando desconhecido: $1"
            show_help
            exit 1
            ;;
    esac
done

# Verificar se comando foi especificado
if [ -z "$COMMAND" ]; then
    show_help
    exit 1
fi

# Executar comando
check_prerequisites

case $COMMAND in
    validate)
        cmd_validate
        ;;
    update)
        cmd_update
        ;;
    status)
        cmd_status
        ;;
    rollback)
        cmd_rollback
        ;;
    rollback-date)
        cmd_rollback_date
        ;;
    tag)
        cmd_tag
        ;;
    clear)
        cmd_clear
        ;;
    docs)
        cmd_docs
        ;;
    history)
        cmd_history
        ;;
    diff)
        cmd_diff
        ;;
esac

log_success "Operação concluída!"
