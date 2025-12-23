#!/bin/bash

API_URL="http://localhost:3000"
DATA_FILE="../data-templates/slas.json"

echo "Carregando SLAs..."

jq -c '.[]' "$DATA_FILE" | while read -r sla; do
  sigla=$(echo "$sla" | jq -r '.sigla')
  descricao=$(echo "$sla" | jq -r '.descricao')
  
  echo "Criando SLA: $sigla - $descricao..."
  
  response=$(curl -s -X POST "$API_URL/api/slas" \
    -H "Content-Type: application/json" \
    -d "$sla")
  
  if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
    echo "  ✓ SLA criado com sucesso"
  else
    echo "  ✗ Erro ao criar SLA: $response"
  fi
done

echo ""
echo "Carga finalizada!"
echo ""
echo "Total de SLAs:"
curl -s "$API_URL/api/slas" | jq 'length'
