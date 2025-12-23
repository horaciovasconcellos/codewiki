#!/bin/bash

# Script para testar o endpoint de servidores da aplicação

API_URL="${API_URL:-http://localhost:3000}"

echo "========================================"
echo "Teste do Endpoint: Servidores da Aplicação"
echo "========================================"
echo ""

# Função para fazer request e mostrar resultado
test_endpoint() {
    local app_id=$1
    local app_sigla=$2
    
    echo "Testando: GET /api/aplicacoes/${app_id}/servidores"
    echo "Aplicação: ${app_sigla}"
    echo "----------------------------------------"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${API_URL}/api/aplicacoes/${app_id}/servidores")
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    echo "Status HTTP: ${http_status}"
    echo ""
    
    if [ "$http_status" = "200" ]; then
        echo "✓ Endpoint funcionando!"
        echo "Resposta:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo "✗ Erro na requisição"
        echo "Resposta:"
        echo "$body"
    fi
    
    echo ""
}

# 1. Verificar se o servidor está rodando
echo "1. Verificando se o servidor está rodando..."
if ! curl -s "${API_URL}/api/health" > /dev/null 2>&1; then
    echo "✗ Servidor não está respondendo em ${API_URL}"
    echo "Inicie o servidor com: npm run dev"
    exit 1
fi
echo "✓ Servidor está rodando"
echo ""

# 2. Buscar primeira aplicação
echo "2. Buscando primeira aplicação..."
app_data=$(curl -s "${API_URL}/api/aplicacoes?limit=1")
app_id=$(echo "$app_data" | jq -r '.[0].id' 2>/dev/null)
app_sigla=$(echo "$app_data" | jq -r '.[0].sigla' 2>/dev/null)

if [ -z "$app_id" ] || [ "$app_id" = "null" ]; then
    echo "✗ Nenhuma aplicação encontrada"
    echo "Cadastre aplicações primeiro"
    exit 1
fi

echo "✓ Aplicação encontrada: ${app_sigla} (ID: ${app_id})"
echo ""

# 3. Testar endpoint
echo "3. Testando endpoint..."
test_endpoint "$app_id" "$app_sigla"

# 4. Instruções
echo "========================================"
echo "Instruções:"
echo "========================================"
echo ""
echo "Se nenhum servidor foi retornado:"
echo "1. Verifique se há servidores cadastrados"
echo "2. Associe servidores às aplicações via interface"
echo "3. Execute: node test-servidor-aplicacao.js"
echo ""
echo "Para testar com outra aplicação:"
echo "  curl ${API_URL}/api/aplicacoes/\$APP_ID/servidores"
echo ""
