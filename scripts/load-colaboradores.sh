#!/bin/bash

API_URL="http://localhost:3000"
DATA_FILE="../data-templates/colaboradores.json"

echo "Carregando colaboradores..."

# Ler o arquivo JSON e processar cada colaborador
jq -c '.[]' "$DATA_FILE" | while read -r colaborador; do
  id=$(echo "$colaborador" | jq -r '.id')
  matricula=$(echo "$colaborador" | jq -r '.matricula')
  nome=$(echo "$colaborador" | jq -r '.nome')
  setor=$(echo "$colaborador" | jq -r '.setor')
  dataAdmissao=$(echo "$colaborador" | jq -r '.dataAdmissao')
  
  echo "Criando colaborador: $nome ($matricula)..."
  
  response=$(curl -s -X POST "$API_URL/api/colaboradores" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$id\",
      \"matricula\": \"$matricula\",
      \"nome\": \"$nome\",
      \"setor\": \"$setor\",
      \"dataAdmissao\": \"$dataAdmissao\"
    }")
  
  if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
    echo "  ✓ Colaborador criado com sucesso"
  else
    echo "  ✗ Erro ao criar colaborador: $response"
  fi
done

echo ""
echo "Carga finalizada!"
echo ""
echo "Total de colaboradores:"
curl -s "$API_URL/api/colaboradores" | jq 'length'
