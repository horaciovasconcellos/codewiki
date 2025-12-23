#!/bin/bash

# Script para carga em lote de Capacidades de Negócio
# Uso: ./load-capacidades-negocio.sh <arquivo.json>
# Exemplo: ./load-capacidades-negocio.sh ../data-templates/capacidades-negocio-carga.json

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
echo "CARGA DE CAPACIDADES DE NEGÓCIO"
echo -e "==========================================${NC}"
echo ""

# Verificar se o arquivo foi informado
if [ -z "$INPUT_FILE" ]; then
    echo -e "${RED}✗ Erro: Arquivo JSON não informado${NC}"
    echo ""
    echo "Uso: $0 <arquivo.json>"
    echo ""
    echo "Exemplos:"
    echo "  $0 capacidades.json"
    echo "  $0 ../data-templates/capacidades-negocio-carga.json"
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
    echo "Certifique-se de que o servidor está rodando (docker-compose up)"
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
echo -e "${BLUE}📊 Total de capacidades a processar:${NC} $TOTAL"
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

# Processar cada capacidade
echo -e "${BLUE}=========================================="
echo "PROCESSANDO REGISTROS"
echo -e "==========================================${NC}"
echo ""

# Criar arquivo de log
LOG_FILE="load-capacidades-$(date +%Y%m%d_%H%M%S).log"
echo "Iniciando carga em $(date)" > "$LOG_FILE"

# Ler o array JSON e processar cada item
jq -c '.[]' "$INPUT_FILE" | while IFS= read -r capacidade; do
    SIGLA=$(echo "$capacidade" | jq -r '.sigla // "SEM-SIGLA"')
    NOME=$(echo "$capacidade" | jq -r '.nome')
    
    echo -e "${YELLOW}Processando:${NC} $SIGLA - $NOME"
    
    # Verificar se já existe (apenas se houver sigla)
    EXISTING=""
    if [ "$SIGLA" != "SEM-SIGLA" ] && [ "$SIGLA" != "null" ]; then
        EXISTING=$(curl -s "$API_URL/api/capacidades-negocio" | jq -r --arg sigla "$SIGLA" '.[] | select(.sigla == $sigla) | .id')
    fi
    
    if [ -n "$EXISTING" ] && [ "$EXISTING" != "null" ]; then
        # Atualizar registro existente
        RESPONSE=$(curl -s -X PUT "$API_URL/api/capacidades-negocio/$EXISTING" \
            -H "Content-Type: application/json" \
            -d "$capacidade")
        
        if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
            echo -e "${BLUE}  ↻ Atualizado (ID: $EXISTING)${NC}"
            UPDATED=$((UPDATED + 1))
        else
            ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Erro desconhecido"')
            echo -e "${RED}  ✗ Erro ao atualizar: $ERROR_MSG${NC}"
            echo "ERRO - $SIGLA: $ERROR_MSG" >> "$LOG_FILE"
            ERRORS=$((ERRORS + 1))
        fi
    else
        # Criar novo registro
        RESPONSE=$(curl -s -X POST "$API_URL/api/capacidades-negocio" \
            -H "Content-Type: application/json" \
            -d "$capacidade")
        
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
                echo "ERRO - $SIGLA: $ERROR_MSG" >> "$LOG_FILE"
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
TOTAL_DB=$(curl -s "$API_URL/api/capacidades-negocio" | jq 'length')
echo -e "${GREEN}✓ Total de capacidades no banco:${NC} $TOTAL_DB"
echo ""

echo -e "${GREEN}✓ Carga concluída!${NC}"

# Listar todas as capacidades
echo ""
echo -e "${BLUE}=========================================="
echo "CAPACIDADES CADASTRADAS"
echo -e "==========================================${NC}"
curl -s "$API_URL/api/capacidades-negocio" | jq -r '.[] | "\(.sigla // "N/A") - \(.nome) (\(.nivel // "N/A"), \(.categoria // "N/A"))"'
