#!/bin/bash

# Script para carga em lote de habilidades a partir de arquivo JSON
# Uso: ./load-habilidades.sh [arquivo.json]

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arquivo JSON (padrão ou passado como argumento)
JSON_FILE="${1:-../data-templates/habilidades-exemplo.json}"

# Verificar se arquivo existe
if [ ! -f "$JSON_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $JSON_FILE${NC}"
    echo "Uso: $0 [arquivo.json]"
    exit 1
fi

echo -e "${BLUE}=========================================="
echo "CARGA EM LOTE DE HABILIDADES"
echo -e "==========================================${NC}"
echo ""
echo -e "📄 Arquivo: ${YELLOW}$JSON_FILE${NC}"
echo ""

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq não está instalado${NC}"
    echo "Instale com: brew install jq"
    exit 1
fi

# Verificar se servidor está rodando
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Servidor não está rodando em http://localhost:3000${NC}"
    echo "Inicie com: docker-compose up -d"
    exit 1
fi

echo -e "${GREEN}✓ Servidor disponível${NC}"
echo ""

# Contador de sucessos e falhas
SUCCESS=0
FAILED=0
TOTAL=$(jq '. | length' "$JSON_FILE")

echo -e "${BLUE}Total de registros a processar: $TOTAL${NC}"
echo ""

# Ler arquivo JSON e processar cada habilidade
jq -c '.[]' "$JSON_FILE" | while read -r habilidade; do
    SIGLA=$(echo "$habilidade" | jq -r '.Sigla')
    DESCRICAO=$(echo "$habilidade" | jq -r '.Descricao')
    DOMINIO=$(echo "$habilidade" | jq -r '.Dominio')
    SUBCATEGORIA=$(echo "$habilidade" | jq -r '.Subcategoria')
    
    echo -n "Criando: $SIGLA... "
    
    # Fazer POST para API
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/habilidades \
        -H "Content-Type: application/json" \
        -d "$habilidade")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" -eq 201 ]; then
        echo -e "${GREEN}✓ Criada${NC}"
        SUCCESS=$((SUCCESS + 1))
    elif [ "$HTTP_CODE" -eq 409 ]; then
        echo -e "${YELLOW}⚠ Já existe${NC}"
    else
        echo -e "${RED}✗ Erro ($HTTP_CODE)${NC}"
        ERROR_MSG=$(echo "$BODY" | jq -r '.error // "Erro desconhecido"')
        echo -e "  ${RED}→ $ERROR_MSG${NC}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo -e "${BLUE}=========================================="
echo "RESUMO"
echo -e "==========================================${NC}"
echo -e "Total processados: $TOTAL"
echo -e "${GREEN}✓ Sucesso: $SUCCESS${NC}"
echo -e "${RED}✗ Falhas: $FAILED${NC}"

echo ""
echo -e "${BLUE}=========================================="
echo "Listando todas as habilidades..."
echo -e "==========================================${NC}"
curl -s http://localhost:3000/api/habilidades | jq -r '.[] | "\(.sigla) - \(.descricao)"'

echo ""
echo -e "${GREEN}Carga concluída!${NC}"
