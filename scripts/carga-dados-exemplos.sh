#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data-templates"
API_URL="${API_URL:-http://localhost:3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Função para carregar dados via API
load_json_data() {
    local file="$1"
    local endpoint="$2"
    local entity_name="$3"
    
    if [ ! -f "$file" ]; then
        log_error "Arquivo não encontrado: $file"
        return 1
    fi
    
    log_info "Carregando $entity_name de $file..."
    
    # Lê o arquivo JSON
    local data=$(cat "$file")
    
    # Verifica se é um array ou objeto único
    if echo "$data" | jq -e 'type == "array"' > /dev/null 2>&1; then
        # É um array, processar cada item
        local count=$(echo "$data" | jq '. | length')
        log_info "Encontrados $count registros"
        
        local success=0
        local failed=0
        
        echo "$data" | jq -c '.[]' | while read -r item; do
            response=$(curl -s -w "\n%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d "$item" \
                "$API_URL$endpoint" 2>/dev/null)
            
            http_code=$(echo "$response" | tail -n1)
            body=$(echo "$response" | sed '$d')
            
            if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
                ((success++))
                echo -ne "\r${GREEN}[✓]${NC} Processados: $success"
            else
                ((failed++))
                log_error "Falha ao inserir: HTTP $http_code - $body"
            fi
        done
        
        echo ""
        log_success "$entity_name: $success registros carregados"
        [ $failed -gt 0 ] && log_error "$failed registros falharam"
    else
        # É um objeto único
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint" 2>/dev/null)
        
        http_code=$(echo "$response" | tail -n1)
        
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            log_success "$entity_name carregado com sucesso"
        else
            log_error "Falha ao carregar $entity_name: HTTP $http_code"
            echo "$response" | sed '$d'
        fi
    fi
    
    echo ""
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CARGA DE DADOS DE EXEMPLO - SISTEMA AUDITORIA       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se a API está rodando
log_info "Verificando conexão com a API em $API_URL..."
if ! curl -s "$API_URL/health" > /dev/null 2>&1 && ! curl -s "$API_URL" > /dev/null 2>&1; then
    log_error "API não está acessível em $API_URL"
    log_info "Certifique-se de que o backend está rodando"
    exit 1
fi
log_success "API acessível"
echo ""

# Carregar dados na ordem correta (respeitando dependências)

log_info "═══════════════════════════════════════════════════════════"
log_info "1. TIPOS DE AFASTAMENTO"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/tipos-afastamento-carga.json" "/api/tipos-afastamento" "Tipos de Afastamento"

log_info "═══════════════════════════════════════════════════════════"
log_info "2. CAPACIDADES DE NEGÓCIO"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/capacidades-negocio-carga.json" "/api/capacidades-negocio" "Capacidades de Negócio"

log_info "═══════════════════════════════════════════════════════════"
log_info "3. HABILIDADES"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/habilidades.json" "/api/habilidades" "Habilidades"

log_info "═══════════════════════════════════════════════════════════"
log_info "4. TECNOLOGIAS"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/tecnologias-carga.json" "/api/tecnologias" "Tecnologias"

log_info "═══════════════════════════════════════════════════════════"
log_info "5. PROCESSOS DE NEGÓCIO"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/processos-negocio.json" "/api/processos-negocio" "Processos de Negócio"

log_info "═══════════════════════════════════════════════════════════"
log_info "6. SLAs"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/slas.json" "/api/slas" "SLAs"

log_info "═══════════════════════════════════════════════════════════"
log_info "7. COLABORADORES"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/colaboradores.json" "/api/colaboradores" "Colaboradores"

log_info "═══════════════════════════════════════════════════════════"
log_info "8. APLICAÇÕES"
log_info "═══════════════════════════════════════════════════════════"
load_json_data "$DATA_DIR/aplicacoes-carga.json" "/api/aplicacoes" "Aplicações"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              CARGA DE DADOS CONCLUÍDA                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
log_success "Todos os dados de exemplo foram carregados!"
echo ""
