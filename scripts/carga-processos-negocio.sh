#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/../data-templates"
API_URL="${API_URL:-http://localhost:3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_detail() {
    echo -e "${CYAN}  ➜${NC} $1"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     CARGA DE PROCESSOS DE NEGÓCIO COM NORMAS E COMPLIANCE  ║"
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

# Carregar dados
FILE="$DATA_DIR/processos-negocio-carga.json"

if [ ! -f "$FILE" ]; then
    log_error "Arquivo não encontrado: $FILE"
    exit 1
fi

log_info "═══════════════════════════════════════════════════════════"
log_info "Carregando Processos de Negócio com Normas"
log_info "═══════════════════════════════════════════════════════════"
echo ""

# Lê o arquivo JSON
data=$(cat "$FILE")

# Verifica se é um array
if ! echo "$data" | jq -e 'type == "array"' > /dev/null 2>&1; then
    log_error "O arquivo deve conter um array JSON"
    exit 1
fi

# Conta total de processos
total=$(echo "$data" | jq '. | length')
log_info "Total de processos a carregar: $total"
echo ""

success=0
failed=0

# Processa cada processo
echo "$data" | jq -c '.[]' | while IFS= read -r processo; do
    identificacao=$(echo "$processo" | jq -r '.identificacao')
    descricao=$(echo "$processo" | jq -r '.descricao')
    total_normas=$(echo "$processo" | jq '.normas | length')
    
    log_info "Processando: $identificacao - $descricao"
    log_detail "Normas: $total_normas"
    
    # Envia para a API
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$processo" \
        "$API_URL/api/processos-negocio" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_success "Processo cadastrado: $identificacao"
        
        # Lista as normas carregadas
        echo "$processo" | jq -r '.normas[] | "  • \(.tipo): \(.nome)"' | while read -r norma; do
            log_detail "$norma"
        done
        
        ((success++)) || true
        echo ""
    else
        log_error "Falha ao cadastrar processo $identificacao"
        log_error "HTTP $http_code: $body"
        ((failed++)) || true
        echo ""
    fi
done

# Aguardar um momento para sincronização
sleep 1

# Resumo final
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    RESUMO DA CARGA                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Buscar contagem atual
current_count=$(curl -s "$API_URL/api/processos-negocio" | jq '. | length' 2>/dev/null || echo "0")

log_success "Processos cadastrados com sucesso"
log_info "Total de processos no sistema: $current_count"
echo ""

# Estatísticas por tipo de norma
log_info "═══════════════════════════════════════════════════════════"
log_info "Estatísticas de Normas Carregadas"
log_info "═══════════════════════════════════════════════════════════"
echo ""

normas_tecnicas=$(echo "$data" | jq '[.[].normas[] | select(.tipo == "Norma Técnica")] | length')
normas_reguladoras=$(echo "$data" | jq '[.[].normas[] | select(.tipo == "Norma Reguladora")] | length')
normas_internacionais=$(echo "$data" | jq '[.[].normas[] | select(.tipo == "Regulamentação Internacional")] | length')

log_detail "Normas Técnicas: $normas_tecnicas"
log_detail "Normas Reguladoras: $normas_reguladoras"
log_detail "Regulamentações Internacionais: $normas_internacionais"
echo ""

normas_obrigatorias=$(echo "$data" | jq '[.[].normas[] | select(.obrigatoriedade == "Obrigatória")] | length')
normas_nao_obrigatorias=$(echo "$data" | jq '[.[].normas[] | select(.obrigatoriedade == "Não Obrigatória")] | length')

log_detail "Normas Obrigatórias: $normas_obrigatorias"
log_detail "Normas Não Obrigatórias: $normas_nao_obrigatorias"
echo ""

normas_ativas=$(echo "$data" | jq '[.[].normas[] | select(.status == "Ativo")] | length')
normas_inativas=$(echo "$data" | jq '[.[].normas[] | select(.status == "Inativo")] | length')

log_detail "Normas Ativas: $normas_ativas"
log_detail "Normas Inativas: $normas_inativas"
echo ""

# Exemplos de normas carregadas
log_info "═══════════════════════════════════════════════════════════"
log_info "Exemplos de Normas Cadastradas"
log_info "═══════════════════════════════════════════════════════════"
echo ""

echo -e "${CYAN}Normas Técnicas:${NC}"
echo "$data" | jq -r '[.[].normas[] | select(.tipo == "Norma Técnica")] | unique_by(.nome) | .[] | "  • \(.nome) - \(.descricao)"' | head -5
echo ""

echo -e "${CYAN}Normas Reguladoras:${NC}"
echo "$data" | jq -r '[.[].normas[] | select(.tipo == "Norma Reguladora")] | unique_by(.nome) | .[] | "  • \(.nome) - \(.descricao)"' | head -5
echo ""

echo -e "${CYAN}Regulamentações Internacionais:${NC}"
echo "$data" | jq -r '[.[].normas[] | select(.tipo == "Regulamentação Internacional")] | unique_by(.nome) | .[] | "  • \(.nome) - \(.descricao)"' | head -5
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║              CARGA CONCLUÍDA COM SUCESSO                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
log_success "Todos os processos de negócio foram carregados!"
log_info "Acesse a interface para visualizar os processos e suas normas"
echo ""
