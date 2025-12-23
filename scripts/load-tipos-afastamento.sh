#!/bin/bash

# Script para carga em lote de Tipos de Afastamento
# Uso: ./load-tipos-afastamento.sh [arquivo.json]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-http://localhost:3000}"
DEFAULT_FILE="../data-templates/tipos-afastamento-carga.json"
INPUT_FILE="${1:-$DEFAULT_FILE}"

echo -e "${BLUE}=========================================="
echo "CARGA DE TIPOS DE AFASTAMENTO"
echo -e "==========================================${NC}"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}✗ Erro: Arquivo não encontrado: $INPUT_FILE${NC}"
    echo ""
    echo "Uso: $0 [arquivo.json]"
    echo "Exemplo: $0 ../data-templates/tipos-afastamento-carga.json"
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
echo ""

# Validar JSON
echo -e "${YELLOW}🔍 Validando arquivo JSON...${NC}"
if ! jq empty "$INPUT_FILE" 2>/dev/null; then
    echo -e "${RED}✗ Arquivo JSON inválido${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JSON válido${NC}"
echo ""

# Contar total de registros
TOTAL=$(jq 'length' "$INPUT_FILE")
echo -e "${BLUE}📊 Total de tipos de afastamento a processar:${NC} $TOTAL"
echo ""

# Perguntar confirmação
read -p "Deseja continuar com a carga? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
fi
echo ""

# Contadores
SUCCESS=0
ERRORS=0
DUPLICATES=0
UPDATED=0

# Processar cada tipo de afastamento
echo -e "${BLUE}=========================================="
echo "PROCESSANDO REGISTROS"
echo -e "==========================================${NC}"
echo ""

# Criar arquivo de log
LOG_FILE="load-tipos-afastamento-$(date +%Y%m%d_%H%M%S).log"
echo "Iniciando carga em $(date)" > "$LOG_FILE"

# Ler o array JSON e processar cada item
jq -c '.[]' "$INPUT_FILE" | while IFS= read -r tipo; do
    CODIGO=$(echo "$tipo" | jq -r '.sigla')
    NOME=$(echo "$tipo" | jq -r '.descricao')
    
    echo -e "${YELLOW}Processando:${NC} $CODIGO - $NOME"
    
    # Verificar se já existe
    EXISTING=$(curl -s "$API_URL/api/tipos-afastamento" | jq -r --arg codigo "$CODIGO" '.[] | select(.codigo == $codigo) | .id')
    
    if [ -n "$EXISTING" ] && [ "$EXISTING" != "null" ]; then
        # Atualizar registro existente
        RESPONSE=$(curl -s -X PUT "$API_URL/api/tipos-afastamento/$EXISTING" \
            -H "Content-Type: application/json" \
            -d "$tipo")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            echo -e "${BLUE}  ↻ Atualizado (ID: $EXISTING)${NC}"
            UPDATED=$((UPDATED + 1))
        else
            ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
            echo -e "${RED}  ✗ Erro ao atualizar: $ERROR_MSG${NC}"
            echo "ERRO - $CODIGO: $ERROR_MSG" >> "$LOG_FILE"
            ERRORS=$((ERRORS + 1))
        fi
    else
        # Criar novo registro
        RESPONSE=$(curl -s -X POST "$API_URL/api/tipos-afastamento" \
            -H "Content-Type: application/json" \
            -d "$tipo")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            NEW_ID=$(echo "$RESPONSE" | jq -r '.id')
            echo -e "${GREEN}  ✓ Criado (ID: $NEW_ID)${NC}"
            SUCCESS=$((SUCCESS + 1))
        else
            ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
            CODE=$(echo "$RESPONSE" | jq -r '.code // ""')
            
            if [ "$CODE" == "DUPLICATE" ]; then
                echo -e "${YELLOW}  ⚠ Já existe${NC}"
                DUPLICATES=$((DUPLICATES + 1))
            else
                echo -e "${RED}  ✗ Erro: $ERROR_MSG${NC}"
                echo "ERRO - $CODIGO: $ERROR_MSG" >> "$LOG_FILE"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    fi
    
    echo ""
    sleep 0.1
done

# Resumo final
echo -e "${BLUE}=========================================="
echo "RESUMO DA CARGA"
echo -e "==========================================${NC}"
echo -e "${GREEN}✓ Criados:${NC}      $SUCCESS"
echo -e "${BLUE}↻ Atualizados:${NC}  $UPDATED"
echo -e "${YELLOW}⚠ Duplicados:${NC}   $DUPLICATES"
echo -e "${RED}✗ Erros:${NC}        $ERRORS"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Total:${NC}        $TOTAL"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Verifique o arquivo de log: $LOG_FILE${NC}"
fi

# Verificar total no banco
echo -e "${YELLOW}🔍 Verificando registros no banco...${NC}"
TOTAL_DB=$(curl -s "$API_URL/api/tipos-afastamento" | jq 'length')
echo -e "${GREEN}✓ Total de tipos de afastamento no banco:${NC} $TOTAL_DB"
echo ""

echo -e "${GREEN}✓ Carga concluída!${NC}"

# Listar todos os tipos de afastamento
echo ""
echo -e "${BLUE}=========================================="
echo "TIPOS DE AFASTAMENTO CADASTRADOS"
echo -e "==========================================${NC}"
curl -s "$API_URL/api/tipos-afastamento" | jq -r '.[] | "\(.codigo) - \(.nome) (Remunerado: \(.remunerado))"'
