#!/bin/bash

# Script para carga em lote de Aplicações com Relacionamentos
# Uso: ./load-aplicacoes.sh <arquivo.json>
# Exemplo: ./load-aplicacoes.sh ../data-templates/aplicacoes-carga.json
#
# Suporta:
# - Aplicações simples (apenas dados básicos)
# - Aplicações com relacionamentos (tecnologias, ambientes, capacidades, processos, integracoes, slas)
#
# Formato do JSON:
# {
#   "sigla": "CRM",
#   "descricao": "Sistema CRM",
#   "urlDocumentacao": "https://docs.example.com",
#   "faseCicloVida": "Produção",
#   "criticidadeNegocio": "Alta",
#   "tecnologias": [...],  // Opcional
#   "ambientes": [...],    // Opcional
#   "capacidades": [...],  // Opcional
#   "processos": [...],    // Opcional
#   "integracoes": [...],  // Opcional
#   "slas": [...]          // Opcional
# }

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-http://localhost:3000}"
INPUT_FILE="$1"

echo -e "${BLUE}=========================================="
echo "CARGA DE APLICAÇÕES"
echo -e "==========================================${NC}"
echo ""

# Verificar se o arquivo foi informado
if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}✗ Erro: Arquivo JSON não informado${NC}"
    echo ""
    echo "Uso: $0 <arquivo.json>"
    echo ""
    echo "Exemplos:"
    echo "  $0 aplicacoes.json"
    echo "  $0 ../data-templates/aplicacoes-carga.json"
    echo "  $0 /caminho/completo/para/dados.json"
    exit 1
fi

# Verificar se o arquivo existe
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}✗ Erro: Arquivo não encontrado: $INPUT_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📄 Arquivo:${NC} $INPUT_FILE"
echo ""

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}✗ Erro: jq não está instalado${NC}"
    echo "Instale com: brew install jq"
    exit 1
fi

# Verificar se o servidor está rodando
echo -e "${YELLOW}🔍 Verificando servidor...${NC}"
if ! curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Servidor não está respondendo em $API_URL${NC}"
    echo "Certifique-se de que o servidor está rodando (npm run dev:api ou docker-compose up)"
    exit 1
fi
echo -e "${GREEN}✓ Servidor OK${NC}"

# Validar JSON
echo -e "${YELLOW}🔍 Validando JSON...${NC}"
if ! jq empty "$INPUT_FILE" 2>/dev/null; then
    echo -e "${RED}✗ Erro: JSON inválido${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JSON válido${NC}"

# Contar total de registros
TOTAL=$(jq 'length' "$INPUT_FILE")
echo -e "${BLUE}📊 Total de aplicações a processar:${NC} $TOTAL"
echo ""

# Confirmar execução
echo -e "${YELLOW}⚠️  Esta operação irá criar ou atualizar $TOTAL aplicações.${NC}"
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi
echo ""

# Contadores
CREATED=0
UPDATED=0
ERRORS=0

# Arquivo de log
LOG_FILE="aplicacoes-carga-$(date +%Y%m%d-%H%M%S).log"
echo "Iniciando carga em $(date)" > "$LOG_FILE"

# Processar cada aplicação
for i in $(seq 0 $((TOTAL - 1))); do
    APP=$(jq -r ".[$i]" "$INPUT_FILE")
    SIGLA=$(echo "$APP" | jq -r '.sigla')
    DESCRICAO=$(echo "$APP" | jq -r '.descricao')
    
    # Contar relacionamentos
    TOTAL_TEC=$(echo "$APP" | jq '.tecnologias // [] | length')
    TOTAL_AMB=$(echo "$APP" | jq '.ambientes // [] | length')
    TOTAL_CAP=$(echo "$APP" | jq '.capacidades // [] | length')
    TOTAL_PROC=$(echo "$APP" | jq '.processos // [] | length')
    TOTAL_INT=$(echo "$APP" | jq '.integracoes // [] | length')
    TOTAL_SLA=$(echo "$APP" | jq '.slas // [] | length')
    
    echo -e "${BLUE}Processando [$((i + 1))/$TOTAL]:${NC} $SIGLA - $DESCRICAO"
    echo -e "  Relacionamentos: Tec:$TOTAL_TEC | Amb:$TOTAL_AMB | Cap:$TOTAL_CAP | Proc:$TOTAL_PROC | Int:$TOTAL_INT | SLA:$TOTAL_SLA"
    
    # Verificar se já existe
    EXISTING_ID=$(curl -s "$API_URL/api/aplicacoes" | jq -r ".[] | select(.sigla == \"$SIGLA\") | .id")
    
    if [ -z "$EXISTING_ID" ]; then
        # Criar nova
        RESPONSE=$(curl -s -X POST "$API_URL/api/aplicacoes" \
            -H "Content-Type: application/json" \
            -d "$APP")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            ID=$(echo "$RESPONSE" | jq -r '.id')
            echo -e "  ${GREEN}✓ Criado (ID: $ID)${NC}"
            echo "[$i] CREATED - $SIGLA - ID: $ID - T:$TOTAL_TEC A:$TOTAL_AMB C:$TOTAL_CAP P:$TOTAL_PROC I:$TOTAL_INT S:$TOTAL_SLA" >> "$LOG_FILE"
            ((CREATED++))
        else
            ERROR=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
            echo -e "  ${RED}✗ Erro: $ERROR${NC}"
            echo "[$i] ERROR - $SIGLA - $ERROR" >> "$LOG_FILE"
            ((ERRORS++))
        fi
    else
        # Atualizar existente
        RESPONSE=$(curl -s -X PUT "$API_URL/api/aplicacoes/$EXISTING_ID" \
            -H "Content-Type: application/json" \
            -d "$APP")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            echo -e "  ${YELLOW}↻ Atualizado (ID: $EXISTING_ID)${NC}"
            echo "[$i] UPDATED - $SIGLA - ID: $EXISTING_ID - T:$TOTAL_TEC A:$TOTAL_AMB C:$TOTAL_CAP P:$TOTAL_PROC I:$TOTAL_INT S:$TOTAL_SLA" >> "$LOG_FILE"
            ((UPDATED++))
        else
            ERROR=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
            echo -e "  ${RED}✗ Erro: $ERROR${NC}"
            echo "[$i] ERROR - $SIGLA - $ERROR" >> "$LOG_FILE"
            ((ERRORS++))
        fi
    fi
done

echo ""
echo -e "${BLUE}=========================================="
echo "RESUMO DA CARGA"
echo -e "==========================================${NC}"
echo -e "${GREEN}✓ Criados:${NC}      $CREATED"
echo -e "${YELLOW}↻ Atualizados:${NC}  $UPDATED"
echo -e "${RED}✗ Erros:${NC}        $ERRORS"
echo ""

# Verificar total no banco
TOTAL_DB=$(curl -s "$API_URL/api/aplicacoes" | jq 'length')
echo -e "${BLUE}📊 Total de aplicações no banco:${NC} $TOTAL_DB"
echo ""

# Listar aplicações cadastradas
echo -e "${BLUE}=========================================="
echo "APLICAÇÕES CADASTRADAS"
echo -e "==========================================${NC}"
curl -s "$API_URL/api/aplicacoes" | jq -r '.[] | "\(.sigla) - \(.descricao) (\(.categoriaSistema // "Sem categoria"), \(.statusOperacional // "Sem status"))"' | sort
echo ""

echo -e "${GREEN}✓ Carga concluída!${NC}"
echo -e "${BLUE}📝 Log salvo em:${NC} $LOG_FILE"
