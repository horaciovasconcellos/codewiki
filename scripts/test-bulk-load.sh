#!/bin/bash

# Script para testar a API de Carga em Lote de Aplicações
# Autor: Sistema de Auditoria
# Data: 2024-12-15

echo "========================================="
echo "   TESTE DE CARGA EM LOTE - APLICAÇÕES"
echo "========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL da API
API_URL="http://localhost:3000/api/aplicacoes/bulk"

# Arquivo JSON de exemplo
JSON_FILE="examples/bulk-load-aplicacoes-example.json"

# Verificar se o arquivo existe
if [ ! -f "$JSON_FILE" ]; then
    echo -e "${RED}✗ Arquivo $JSON_FILE não encontrado!${NC}"
    echo "  Certifique-se de estar no diretório raiz do projeto."
    exit 1
fi

echo -e "${YELLOW}📄 Arquivo de dados:${NC} $JSON_FILE"
echo -e "${YELLOW}🌐 URL da API:${NC} $API_URL"
echo ""

# Verificar se o servidor está rodando
echo -e "${YELLOW}🔍 Verificando se o servidor está rodando...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo -e "${RED}✗ Servidor não está rodando!${NC}"
    echo "  Inicie o servidor com: docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Servidor está online${NC}"
echo ""

# Executar a carga em lote
echo -e "${YELLOW}🚀 Iniciando carga em lote...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d @"$JSON_FILE" \
  -w "\nHTTP_CODE:%{http_code}")

# Separar o corpo da resposta do código HTTP
HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_CODE:.*//g')
HTTP_CODE=$(echo "$RESPONSE" | sed -e 's/.*HTTP_CODE://g')

echo "Resposta da API:"
echo "----------------------------------------"
echo "$HTTP_BODY" | jq '.'
echo "----------------------------------------"
echo ""

# Verificar resultado
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Carga realizada com sucesso! (HTTP $HTTP_CODE)${NC}"
    
    # Extrair estatísticas
    TOTAL=$(echo "$HTTP_BODY" | jq -r '.summary.total')
    SUCESSO=$(echo "$HTTP_BODY" | jq -r '.summary.sucesso')
    FALHAS=$(echo "$HTTP_BODY" | jq -r '.summary.falhas')
    
    echo ""
    echo "📊 Resumo da Carga:"
    echo "  • Total de aplicações: $TOTAL"
    echo -e "  • Sucesso: ${GREEN}$SUCESSO${NC}"
    if [ "$FALHAS" -gt 0 ]; then
        echo -e "  • Falhas: ${RED}$FALHAS${NC}"
    else
        echo -e "  • Falhas: ${GREEN}$FALHAS${NC}"
    fi
    echo ""
    
    # Mostrar detalhes de cada aplicação
    echo "📋 Detalhes por Aplicação:"
    echo "$HTTP_BODY" | jq -r '.results[] | "  • \(.sigla): \(.status) \(if .totals then "(\(.totals.ambientes) ambientes, \(.totals.tecnologias) tecnologias, \(.totals.capacidades) capacidades, \(.totals.processos) processos, \(.totals.integracoes) integrações, \(.totals.slas) SLAs)" else "(erro: \(.error))" end)"'
    echo ""
    
else
    echo -e "${RED}✗ Erro na carga! (HTTP $HTTP_CODE)${NC}"
    echo ""
    ERROR_MSG=$(echo "$HTTP_BODY" | jq -r '.error // "Erro desconhecido"')
    echo -e "${RED}Mensagem de erro:${NC} $ERROR_MSG"
    echo ""
    exit 1
fi

echo "========================================="
echo "           TESTE CONCLUÍDO"
echo "========================================="
