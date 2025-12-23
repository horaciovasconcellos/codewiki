#!/bin/bash

# Script para testar e reiniciar o servidor se necessário

API_URL="${API_URL:-http://localhost:3000}"

echo "========================================"
echo "Verificador e Reiniciador do Servidor"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para verificar se o servidor está rodando
check_server() {
    if curl -s "${API_URL}/api/health" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Função para testar o endpoint
test_endpoint() {
    local app_id=$1
    echo -e "${BLUE}Testando endpoint: /api/aplicacoes/${app_id}/servidores${NC}"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${API_URL}/api/aplicacoes/${app_id}/servidores")
    status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ Endpoint funcionando (200 OK)${NC}"
        return 0
    elif [ "$status" = "404" ]; then
        echo -e "${RED}✗ Endpoint não encontrado (404)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ Status inesperado: ${status}${NC}"
        return 1
    fi
}

# 1. Verificar se servidor está rodando
echo -e "${BLUE}1. Verificando se o servidor está rodando...${NC}"
if check_server; then
    echo -e "${GREEN}✓ Servidor está respondendo${NC}"
else
    echo -e "${RED}✗ Servidor não está respondendo${NC}"
    echo "Inicie o servidor com: npm run dev ou bash quick-restart.sh"
    exit 1
fi
echo ""

# 2. Buscar uma aplicação de teste
echo -e "${BLUE}2. Buscando aplicação para teste...${NC}"
app_data=$(curl -s "${API_URL}/api/aplicacoes?limit=1")
app_id=$(echo "$app_data" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$app_id" ]; then
    echo -e "${RED}✗ Nenhuma aplicação encontrada${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Usando aplicação ID: ${app_id}${NC}"
echo ""

# 3. Testar o endpoint
echo -e "${BLUE}3. Testando o endpoint de servidores...${NC}"
if test_endpoint "$app_id"; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Tudo funcionando corretamente!${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Endpoint não está funcionando!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    
    # 4. Perguntar se deve reiniciar
    echo -e "${YELLOW}O servidor precisa ser reiniciado para carregar o novo endpoint.${NC}"
    echo ""
    
    # Verificar se está rodando com Docker ou npm
    if docker-compose ps 2>/dev/null | grep -q "app"; then
        echo "Detectado ambiente Docker."
        echo ""
        read -p "Deseja reiniciar os containers agora? (s/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            echo ""
            echo -e "${BLUE}Reiniciando containers...${NC}"
            bash quick-restart.sh
            
            echo ""
            echo -e "${BLUE}Aguardando servidor inicializar...${NC}"
            sleep 10
            
            echo ""
            echo -e "${BLUE}Testando novamente...${NC}"
            if test_endpoint "$app_id"; then
                echo ""
                echo -e "${GREEN}✓ Endpoint funcionando após reinício!${NC}"
            else
                echo ""
                echo -e "${RED}✗ Ainda não funcionando. Verifique os logs:${NC}"
                echo "  docker-compose logs -f app"
            fi
        fi
    else
        echo "Detectado servidor Node.js (npm)."
        echo ""
        echo "Para reiniciar:"
        echo "  1. Pare o servidor (Ctrl+C no terminal onde está rodando)"
        echo "  2. Execute: npm run dev"
        echo ""
        echo "Ou se preferir, use nodemon para reload automático:"
        echo "  npm install -g nodemon"
        echo "  nodemon server/index.js"
    fi
fi
