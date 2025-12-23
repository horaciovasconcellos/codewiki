#!/bin/bash

# Script de carga de comunicações
# Carrega os dados de comunicações a partir do arquivo JSON

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuração
API_URL="${API_URL:-http://localhost:3000}"
DATA_FILE="data-templates/comunicacoes-carga.json"

echo -e "${YELLOW}===========================================${NC}"
echo -e "${YELLOW}  Script de Carga - Comunicações${NC}"
echo -e "${YELLOW}===========================================${NC}"
echo ""

# Verificar se o arquivo de dados existe
if [ ! -f "$DATA_FILE" ]; then
  echo -e "${RED}❌ Erro: Arquivo $DATA_FILE não encontrado${NC}"
  exit 1
fi

echo -e "${GREEN}📄 Arquivo de dados encontrado: $DATA_FILE${NC}"

# Verificar se a API está acessível
echo -e "${YELLOW}🔍 Verificando conectividade com a API...${NC}"
if ! curl -s -f -o /dev/null "$API_URL/api/comunicacoes"; then
  echo -e "${RED}❌ Erro: API não está acessível em $API_URL${NC}"
  echo -e "${YELLOW}💡 Dica: Certifique-se de que o servidor está rodando${NC}"
  exit 1
fi

echo -e "${GREEN}✓ API acessível${NC}"
echo ""

# Contar registros no arquivo
TOTAL_RECORDS=$(jq '. | length' "$DATA_FILE")
echo -e "${YELLOW}📊 Total de registros a carregar: $TOTAL_RECORDS${NC}"
echo ""

# Carregar cada registro
SUCCESS=0
ERRORS=0
DUPLICATES=0

for i in $(seq 0 $((TOTAL_RECORDS - 1))); do
  # Extrair dados do registro
  SIGLA=$(jq -r ".[$i].sigla" "$DATA_FILE")
  
  echo -e "${YELLOW}➤ Processando: $SIGLA${NC}"
  
  # Verificar se já existe
  EXISTING=$(curl -s "$API_URL/api/comunicacoes" | jq -r ".[] | select(.sigla == \"$SIGLA\") | .id")
  
  if [ ! -z "$EXISTING" ]; then
    echo -e "${YELLOW}  ⚠ Registro já existe (ID: $EXISTING)${NC}"
    ((DUPLICATES++))
    continue
  fi
  
  # Preparar payload
  PAYLOAD=$(jq -c ".[$i]" "$DATA_FILE")
  
  # Fazer POST
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$API_URL/api/comunicacoes")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "201" ]; then
    ID=$(echo "$BODY" | jq -r '.id')
    echo -e "${GREEN}  ✓ Criado com sucesso (ID: $ID)${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}  ✗ Erro ao criar (HTTP $HTTP_CODE)${NC}"
    echo -e "${RED}    $BODY${NC}"
    ((ERRORS++))
  fi
  
  echo ""
done

# Resumo
echo -e "${YELLOW}===========================================${NC}"
echo -e "${YELLOW}  Resumo da Carga${NC}"
echo -e "${YELLOW}===========================================${NC}"
echo -e "${GREEN}✓ Sucesso:     $SUCCESS${NC}"
echo -e "${YELLOW}⚠ Duplicados:  $DUPLICATES${NC}"
echo -e "${RED}✗ Erros:       $ERRORS${NC}"
echo -e "${YELLOW}===========================================${NC}"

# Exit code baseado no resultado
if [ $ERRORS -gt 0 ]; then
  exit 1
else
  exit 0
fi
