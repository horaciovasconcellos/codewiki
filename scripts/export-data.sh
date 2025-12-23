#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_URL="${API_BASE_URL:-http://localhost:5173}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

export_entity() {
    local entity_type="$1"
    local output_file="$2"
    local format="$3"
    
    case "$entity_type" in
        "tipos-afastamento")
            local endpoint="/api/tipos-afastamento"
            ;;
        "capacidades-negocio")
            local endpoint="/api/capacidades-negocio"
            ;;
        "habilidades")
            local endpoint="/api/habilidades"
            ;;
        "processos-negocio")
            local endpoint="/api/processos-negocio"
            ;;
        "tecnologias")
            local endpoint="/api/tecnologias"
            ;;
        "slas")
            local endpoint="/api/slas"
            ;;
        "colaboradores")
            local endpoint="/api/colaboradores"
            ;;
        "aplicacoes")
            local endpoint="/api/aplicacoes"
            ;;
        *)
            log_error "Tipo de entidade desconhecido: $entity_type"
            return 1
            ;;
    esac
    
    log_info "Exportando $entity_type de ${BASE_URL}${endpoint}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}${endpoint}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        if [ "$format" = "json" ]; then
            echo "$body" | jq '.' > "$output_file"
            log_success "Dados exportados para $output_file"
        elif [ "$format" = "csv" ]; then
            log_error "Exportação para CSV não implementada nesta versão"
            return 1
        else
            log_error "Formato não suportado: $format"
            return 1
        fi
    else
        log_error "Falha ao exportar dados (HTTP $http_code)"
        return 1
    fi
}

show_usage() {
    cat << EOF
Uso: $0 [OPÇÕES]

Script de exportação de dados do Sistema de Auditoria

OPÇÕES:
    -t, --type TYPE          Tipo de entidade a exportar
    -o, --output FILE        Arquivo de saída
    -f, --format FORMAT      Formato de saída (json, csv) - padrão: json
    -u, --url URL            URL base da API (padrão: http://localhost:5173)
    -h, --help               Mostrar esta mensagem de ajuda

EXEMPLOS:
    # Exportar tipos de afastamento para JSON
    $0 --type tipos-afastamento --output backup.json
    
    # Exportar colaboradores
    $0 -t colaboradores -o colaboradores-export.json

EOF
}

main() {
    local entity_type=""
    local output_file=""
    local format="json"
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                entity_type="$2"
                shift 2
                ;;
            -o|--output)
                output_file="$2"
                shift 2
                ;;
            -f|--format)
                format="$2"
                shift 2
                ;;
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Opção desconhecida: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    if [ -z "$entity_type" ] || [ -z "$output_file" ]; then
        log_error "Opções --type e --output são obrigatórias"
        show_usage
        exit 1
    fi
    
    export_entity "$entity_type" "$output_file" "$format"
}

main "$@"
