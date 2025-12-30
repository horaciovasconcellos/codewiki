#!/bin/bash

################################################################################
# Script: list-azure-projects.sh
# Descrição: Lista todos os projetos do Azure DevOps que o usuário tem acesso
# Autor: Sistema de Auditoria
# Data: 30/12/2024
# Versão: 1.0
################################################################################

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para exibir ajuda
show_help() {
    cat << EOF
Uso: $0 [OPÇÕES]

Lista todos os projetos do Azure DevOps que o usuário possui acesso.

OPÇÕES:
    -o, --organization NOME    Nome da organização Azure DevOps (obrigatório)
    -t, --token TOKEN          Personal Access Token (PAT) do Azure DevOps
    -f, --format FORMATO       Formato de saída: table|json|csv (padrão: table)
    -v, --verbose              Modo verbose - mostra mais detalhes
    -h, --help                 Exibe esta ajuda

VARIÁVEIS DE AMBIENTE:
    AZURE_DEVOPS_ORG           Nome da organização
    AZURE_DEVOPS_PAT           Personal Access Token

EXEMPLOS:
    # Listar projetos usando variáveis de ambiente
    export AZURE_DEVOPS_ORG="minha-org"
    export AZURE_DEVOPS_PAT="seu-token-aqui"
    $0

    # Listar projetos com parâmetros
    $0 -o minha-org -t seu-token-aqui

    # Listar em formato JSON
    $0 -o minha-org -t seu-token-aqui -f json

    # Listar em formato CSV
    $0 -o minha-org -t seu-token-aqui -f csv > projects.csv

NOTA:
    Para criar um PAT, acesse:
    https://dev.azure.com/{organization}/_usersSettings/tokens
    
    Permissões necessárias:
    - Project and Team: Read

EOF
}

# Valores padrão
ORGANIZATION="${AZURE_DEVOPS_ORG:-}"
PAT="${AZURE_DEVOPS_PAT:-}"
FORMAT="table"
VERBOSE=false

# Parse de argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--organization)
            ORGANIZATION="$2"
            shift 2
            ;;
        -t|--token)
            PAT="$2"
            shift 2
            ;;
        -f|--format)
            FORMAT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validações
if [[ -z "$ORGANIZATION" ]]; then
    log_error "Nome da organização é obrigatório!"
    echo ""
    show_help
    exit 1
fi

if [[ -z "$PAT" ]]; then
    log_error "Personal Access Token (PAT) é obrigatório!"
    echo ""
    show_help
    exit 1
fi

# Validar formato
if [[ ! "$FORMAT" =~ ^(table|json|csv)$ ]]; then
    log_error "Formato inválido: $FORMAT (use: table, json ou csv)"
    exit 1
fi

# URL da API
API_VERSION="7.0"
BASE_URL="https://dev.azure.com/${ORGANIZATION}"
PROJECTS_URL="${BASE_URL}/_apis/projects?api-version=${API_VERSION}"

# Codificar PAT em base64 para autenticação
AUTH_HEADER="Authorization: Basic $(echo -n :${PAT} | base64)"

log_info "Conectando ao Azure DevOps..."
log_info "Organização: $ORGANIZATION"
[[ "$VERBOSE" == true ]] && log_info "URL: $PROJECTS_URL"

# Fazer requisição à API
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    "$PROJECTS_URL")

# Separar body e status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

# Verificar status code
if [[ "$HTTP_CODE" != "200" ]]; then
    log_error "Falha na requisição! HTTP Status: $HTTP_CODE"
    [[ "$VERBOSE" == true ]] && echo "$BODY"
    exit 1
fi

# Verificar se há projetos
PROJECT_COUNT=$(echo "$BODY" | jq -r '.count // 0')

if [[ "$PROJECT_COUNT" -eq 0 ]]; then
    log_warning "Nenhum projeto encontrado na organização $ORGANIZATION"
    exit 0
fi

log_success "Encontrados $PROJECT_COUNT projeto(s)"
echo ""

# Exibir resultados conforme formato solicitado
case "$FORMAT" in
    json)
        echo "$BODY" | jq '.'
        ;;
    
    csv)
        echo "Nome,ID,Estado,Visibilidade,URL,Descrição"
        echo "$BODY" | jq -r '.value[] | [
            .name,
            .id,
            .state,
            .visibility,
            .url,
            (.description // "")
        ] | @csv'
        ;;
    
    table)
        # Cabeçalho
        printf "${GREEN}%-30s %-12s %-20s %-50s${NC}\n" "PROJETO" "ESTADO" "VISIBILIDADE" "DESCRIÇÃO"
        printf "%.s-" {1..120}
        echo ""
        
        # Listar projetos
        echo "$BODY" | jq -r '.value[] | [
            .name,
            .state,
            .visibility,
            (.description // "N/A")
        ] | @tsv' | while IFS=$'\t' read -r name state visibility description; do
            # Truncar descrição se muito longa
            if [[ ${#description} -gt 47 ]]; then
                description="${description:0:44}..."
            fi
            
            # Colorir estado
            case "$state" in
                wellFormed)
                    state_colored="${GREEN}${state}${NC}"
                    ;;
                *)
                    state_colored="${YELLOW}${state}${NC}"
                    ;;
            esac
            
            printf "%-30s %-12s %-20s %-50s\n" "$name" "$state_colored" "$visibility" "$description"
        done
        
        echo ""
        log_info "Total: $PROJECT_COUNT projeto(s)"
        
        # Modo verbose - mostrar mais detalhes
        if [[ "$VERBOSE" == true ]]; then
            echo ""
            log_info "Detalhes completos:"
            echo "$BODY" | jq -r '.value[] | "
────────────────────────────────────────────────────────────────
Nome:        \(.name)
ID:          \(.id)
Estado:      \(.state)
Visibilidade: \(.visibility)
URL:         \(.url)
Descrição:   \(.description // "N/A")
Revisão:     \(.revision)
Última Atualização: \(.lastUpdateTime)
"'
        fi
        ;;
esac

# Salvar resultado em arquivo se solicitado
if [[ -n "${OUTPUT_FILE:-}" ]]; then
    echo "$BODY" > "$OUTPUT_FILE"
    log_success "Resultados salvos em: $OUTPUT_FILE"
fi

exit 0
