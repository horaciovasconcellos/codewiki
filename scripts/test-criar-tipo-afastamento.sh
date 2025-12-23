#!/bin/bash

# Script para testar criação de Tipos de Afastamento via API
# Sistema de Auditoria

set -e

# Configurações
BASE_URL="${API_BASE_URL:-http://localhost:5173}"
API_ENDPOINT="$BASE_URL/api/tipos-afastamento"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Função para criar tipo de afastamento
criar_tipo() {
    local sigla="$1"
    local descricao="$2"
    local argumentacao="$3"
    local dias="$4"
    local tipo_tempo="$5"
    
    log_info "Criando tipo: $sigla - $descricao"
    
    local payload=$(cat <<EOF
{
  "sigla": "$sigla",
  "descricao": "$descricao",
  "argumentacaoLegal": "$argumentacao",
  "numeroDias": $dias,
  "tipoTempo": "$tipo_tempo"
}
EOF
)
    
    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_ENDPOINT" \
        -H 'Content-Type: application/json' \
        -d "$payload")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
        log_success "Tipo criado com sucesso! (HTTP $http_code)"
        echo -e "${CYAN}Resposta:${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        log_error "Falha ao criar tipo (HTTP $http_code)"
        echo -e "${RED}Resposta:${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║     Sistema de Auditoria - Teste de Tipos de Afastamento ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se a API está acessível
log_info "Verificando conectividade com a API..."
if ! curl -s --head --fail "$BASE_URL" > /dev/null 2>&1; then
    log_error "API não acessível em $BASE_URL"
    log_warning "Certifique-se de que o sistema está rodando (docker-compose up -d)"
    exit 1
fi
log_success "API acessível!"

echo ""
log_info "URL Base: $BASE_URL"
log_info "Endpoint: $API_ENDPOINT"
echo ""

# Menu interativo
echo -e "${CYAN}Escolha uma opção:${NC}"
echo "1) Criar Férias (FER)"
echo "2) Criar Licença Médica (LM)"
echo "3) Criar Licença Maternidade (LMT)"
echo "4) Criar Licença Paternidade (LPT)"
echo "5) Criar Banco de Horas (BH) - Não Consecutivo"
echo "6) Criar TODOS os exemplos acima"
echo "7) Criar tipo personalizado"
echo "8) Listar tipos existentes"
echo "0) Sair"
echo ""

read -p "Opção: " opcao

case $opcao in
    1)
        criar_tipo "FER" "Férias" "Lei 5.452/1943 (CLT) Art. 129" 30 "C"
        ;;
    2)
        criar_tipo "LM" "Licença Médica" "Lei 8.213/1991 Art. 60" 15 "C"
        ;;
    3)
        criar_tipo "LMT" "Licença Maternidade" "Lei 11.770/2008 Art. 1º" 180 "C"
        ;;
    4)
        criar_tipo "LPT" "Licença Paternidade" "Lei 13.257/2016 Art. 38" 20 "C"
        ;;
    5)
        criar_tipo "BH" "Banco de Horas" "CCT 2024/2025 Cláusula 22" 10 "N"
        ;;
    6)
        log_info "Criando todos os exemplos..."
        echo ""
        
        criar_tipo "FER" "Férias" "Lei 5.452/1943 (CLT) Art. 129" 30 "C"
        echo ""
        
        criar_tipo "LM" "Licença Médica" "Lei 8.213/1991 Art. 60" 15 "C"
        echo ""
        
        criar_tipo "LMT" "Licença Maternidade" "Lei 11.770/2008 Art. 1º" 180 "C"
        echo ""
        
        criar_tipo "LPT" "Licença Paternidade" "Lei 13.257/2016 Art. 38" 20 "C"
        echo ""
        
        criar_tipo "BH" "Banco de Horas" "CCT 2024/2025 Cláusula 22" 10 "N"
        ;;
    7)
        echo ""
        read -p "Sigla (3 caracteres): " sigla
        read -p "Descrição: " descricao
        read -p "Argumentação Legal: " argumentacao
        read -p "Número de Dias (1-99): " dias
        echo "Tipo de Tempo:"
        echo "  C - Consecutivo (dias corridos)"
        echo "  N - Não Consecutivo (dias intercalados)"
        read -p "Tipo (C/N): " tipo_tempo
        
        criar_tipo "$sigla" "$descricao" "$argumentacao" "$dias" "$tipo_tempo"
        ;;
    8)
        log_info "Listando tipos de afastamento existentes..."
        echo ""
        curl -s "$API_ENDPOINT" | jq '.' 2>/dev/null || curl -s "$API_ENDPOINT"
        ;;
    0)
        log_info "Saindo..."
        exit 0
        ;;
    *)
        log_error "Opção inválida!"
        exit 1
        ;;
esac

echo ""
log_success "Operação concluída!"
echo ""
log_info "Para listar todos os tipos criados, execute:"
echo "  curl http://localhost:5173/api/tipos-afastamento | jq"
echo ""
