#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data-templates"
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Verificando dependências..."
    
    if ! command -v jq &> /dev/null; then
        log_error "jq não está instalado. Instale com: sudo apt-get install jq"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl não está instalado. Instale com: sudo apt-get install curl"
        exit 1
    fi
    
    log_success "Todas as dependências estão instaladas"
}

csv_to_json() {
    local csv_file="$1"
    local entity_type="$2"
    
    log_info "Convertendo CSV para JSON: $csv_file"
    
    case "$entity_type" in
        "tipos-afastamento")
            python3 -c "
import csv
import json
import sys

with open('$csv_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = []
    for row in reader:
        obj = {
            'id': row['id'],
            'sigla': row['sigla'],
            'descricao': row['descricao'],
            'argumentacaoLegal': row['argumentacaoLegal'],
            'numeroDias': int(row['numeroDias']),
            'tipoTempo': row['tipoTempo']
        }
        data.append(obj)
    print(json.dumps(data, ensure_ascii=False, indent=2))
"
            ;;
        "capacidades-negocio")
            python3 -c "
import csv
import json
import sys

with open('$csv_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = []
    for row in reader:
        obj = {
            'id': row['id'],
            'sigla': row['sigla'],
            'nome': row['nome'],
            'descricao': row['descricao'],
            'nivel': row['nivel'],
            'categoria': row['categoria'],
            'coberturaEstrategica': {
                'alinhamentoObjetivos': row['alinhamentoObjetivos'],
                'beneficiosEsperados': row['beneficiosEsperados'],
                'estadoFuturoDesejado': row['estadoFuturoDesejado'],
                'gapEstadoAtualFuturo': row['gapEstadoAtualFuturo']
            }
        }
        data.append(obj)
    print(json.dumps(data, ensure_ascii=False, indent=2))
"
            ;;
        "habilidades")
            python3 -c "
import csv
import json
import sys

with open('$csv_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = []
    for row in reader:
        obj = {
            'id': row['id'],
            'sigla': row['sigla'],
            'descricao': row['descricao'],
            'dominio': row['dominio'],
            'subcategoria': row['subcategoria'],
            'certificacoes': json.loads(row['certificacoes']) if row['certificacoes'] else []
        }
        data.append(obj)
    print(json.dumps(data, ensure_ascii=False, indent=2))
"
            ;;
        "colaboradores")
            python3 -c "
import csv
import json
import sys

with open('$csv_file', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = []
    for row in reader:
        obj = {
            'id': row['id'],
            'matricula': row['matricula'],
            'nome': row['nome'],
            'setor': row['setor'],
            'dataAdmissao': row['dataAdmissao'],
            'afastamentos': json.loads(row['afastamentos']) if row['afastamentos'] else [],
            'habilidades': json.loads(row['habilidades']) if row['habilidades'] else []
        }
        if row.get('dataDemissao'):
            obj['dataDemissao'] = row['dataDemissao']
        data.append(obj)
    print(json.dumps(data, ensure_ascii=False, indent=2))
"
            ;;
        *)
            log_error "Tipo de entidade não suportado para conversão CSV: $entity_type"
            return 1
            ;;
    esac
}

load_data_from_json() {
    local json_file="$1"
    local endpoint="$2"
    local entity_name="$3"
    
    log_info "Carregando dados de $json_file para $endpoint"
    
    if [ ! -f "$json_file" ]; then
        log_error "Arquivo não encontrado: $json_file"
        return 1
    fi
    
    local data=$(cat "$json_file")
    local items=$(echo "$data" | jq -c '.[]')
    local count=0
    local errors=0
    
    while IFS= read -r item; do
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$item" \
            "${BASE_URL}${endpoint}" 2>&1)
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
            ((count++))
            log_success "✓ $entity_name criado com sucesso"
        else
            ((errors++))
            log_warning "✗ Falha ao criar $entity_name (HTTP $http_code)"
        fi
    done <<< "$items"
    
    log_info "Resumo: $count sucesso(s), $errors erro(s)"
}

load_data_from_csv() {
    local csv_file="$1"
    local endpoint="$2"
    local entity_name="$3"
    local entity_type="$4"
    
    log_info "Convertendo CSV e carregando dados..."
    
    local json_data=$(csv_to_json "$csv_file" "$entity_type")
    
    if [ $? -ne 0 ]; then
        log_error "Falha ao converter CSV para JSON"
        return 1
    fi
    
    local temp_file=$(mktemp)
    echo "$json_data" > "$temp_file"
    
    load_data_from_json "$temp_file" "$endpoint" "$entity_name"
    
    rm -f "$temp_file"
}

load_entity() {
    local entity_type="$1"
    local file_path="$2"
    
    case "$entity_type" in
        "tipos-afastamento")
            local endpoint="/api/tipos-afastamento"
            local entity_name="Tipo de Afastamento"
            ;;
        "capacidades-negocio")
            local endpoint="/api/capacidades-negocio"
            local entity_name="Capacidade de Negócio"
            ;;
        "habilidades")
            local endpoint="/api/habilidades"
            local entity_name="Habilidade"
            ;;
        "processos-negocio")
            local endpoint="/api/processos-negocio"
            local entity_name="Processo de Negócio"
            ;;
        "tecnologias")
            local endpoint="/api/tecnologias"
            local entity_name="Tecnologia"
            ;;
        "slas")
            local endpoint="/api/slas"
            local entity_name="SLA"
            ;;
        "colaboradores")
            local endpoint="/api/colaboradores"
            local entity_name="Colaborador"
            ;;
        "aplicacoes")
            local endpoint="/api/aplicacoes"
            local entity_name="Aplicação"
            ;;
        *)
            log_error "Tipo de entidade desconhecido: $entity_type"
            return 1
            ;;
    esac
    
    local extension="${file_path##*.}"
    
    if [ "$extension" = "json" ]; then
        load_data_from_json "$file_path" "$endpoint" "$entity_name"
    elif [ "$extension" = "csv" ]; then
        load_data_from_csv "$file_path" "$endpoint" "$entity_name" "$entity_type"
    else
        log_error "Formato de arquivo não suportado: $extension (use .json ou .csv)"
        return 1
    fi
}

show_usage() {
    cat << EOF
Uso: $0 [OPÇÕES]

Script de carga de dados para o Sistema de Auditoria

OPÇÕES:
    -f, --file FILE          Carregar dados de um arquivo específico (CSV ou JSON)
    -t, --type TYPE          Tipo de entidade (obrigatório com --file)
                             Tipos válidos:
                               - tipos-afastamento
                               - capacidades-negocio
                               - habilidades
                               - processos-negocio
                               - tecnologias
                               - slas
                               - colaboradores
                               - aplicacoes
    
    -a, --all                Carregar todos os arquivos de template
    -u, --url URL            URL base da API (padrão: http://localhost:5173)
    -h, --help               Mostrar esta mensagem de ajuda

EXEMPLOS:
    # Carregar tipos de afastamento de um arquivo JSON
    $0 --file data/tipos-afastamento.json --type tipos-afastamento
    
    # Carregar colaboradores de um arquivo CSV
    $0 --file data/colaboradores.csv --type colaboradores
    
    # Carregar todos os templates padrão
    $0 --all
    
    # Especificar URL customizada
    $0 --all --url http://api.empresa.com

VARIÁVEIS DE AMBIENTE:
    API_BASE_URL            URL base da API (sobrescreve --url)

EOF
}

load_all_templates() {
    log_info "Iniciando carga de todos os templates..."
    echo ""
    
    local entities=(
        "tipos-afastamento"
        "capacidades-negocio"
        "habilidades"
        "processos-negocio"
        "tecnologias"
        "slas"
        "colaboradores"
        "aplicacoes"
    )
    
    for entity in "${entities[@]}"; do
        log_info "=========================================="
        log_info "Carregando: $entity"
        log_info "=========================================="
        
        local json_file="${DATA_DIR}/${entity}.json"
        
        if [ -f "$json_file" ]; then
            load_entity "$entity" "$json_file"
        else
            log_warning "Template não encontrado: $json_file"
        fi
        
        echo ""
    done
    
    log_success "Carga de templates concluída!"
}

main() {
    local file=""
    local entity_type=""
    local load_all=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--file)
                file="$2"
                shift 2
                ;;
            -t|--type)
                entity_type="$2"
                shift 2
                ;;
            -a|--all)
                load_all=true
                shift
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
    
    check_dependencies
    
    log_info "URL da API: $BASE_URL"
    echo ""
    
    if [ "$load_all" = true ]; then
        load_all_templates
    elif [ -n "$file" ]; then
        if [ -z "$entity_type" ]; then
            log_error "Opção --type é obrigatória quando --file é especificado"
            show_usage
            exit 1
        fi
        
        if [ ! -f "$file" ]; then
            log_error "Arquivo não encontrado: $file"
            exit 1
        fi
        
        load_entity "$entity_type" "$file"
    else
        log_error "Especifique --file ou --all"
        show_usage
        exit 1
    fi
}

main "$@"
