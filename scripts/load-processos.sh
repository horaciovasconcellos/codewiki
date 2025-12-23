#!/bin/bash

API_URL="http://localhost:3000"
DATA_FILE="../data-templates/processos-negocio.json"

echo "Carregando processos de negócio..."

jq -c '.[]' "$DATA_FILE" | while read -r processo; do
  identificacao=$(echo "$processo" | jq -r '.identificacao')
  nome=$(echo "$processo" | jq -r '.nome')
  descricao=$(echo "$processo" | jq -r '.descricao')
  
  echo "Criando processo: $identificacao - $nome..."
  
  response=$(curl -s -X POST "$API_URL/api/processos-negocio" \
    -H "Content-Type: application/json" \
    -d "{
      \"identificacao\": \"$identificacao\",
      \"nome\": \"$nome\",
      \"descricao\": \"$descricao\"
    }")
  
  if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
    echo "  ✓ Processo criado com sucesso"
  else
    echo "  ✗ Erro ao criar processo: $response"
  fi
done

echo ""
echo "Carga finalizada!"
echo ""
echo "Total de processos:"
curl -s "$API_URL/api/processos-negocio" | jq 'length'
