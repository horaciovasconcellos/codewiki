#!/bin/bash

echo "=== Testando Integração com Sigla de 30 caracteres ==="

# Criar integração com 30 caracteres
echo -e "\n1. Testando criação com sigla de 30 caracteres..."
RESULT=$(curl -s -X POST http://localhost:3000/api/integracoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "INTEGRACAO-TESTE-COMPLETO-30",
    "nome": "Integração Teste 30 Chars"
  }')

echo "$RESULT" | jq

# Verificar no banco
echo -e "\n2. Verificando no banco de dados..."
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "SELECT sigla, nome FROM integracoes WHERE sigla LIKE 'INTEGRACAO-TESTE%'" 2>/dev/null

# Testar erro com 31 caracteres
echo -e "\n3. Testando erro com 31 caracteres..."
RESULT_ERROR=$(curl -s -X POST http://localhost:3000/api/integracoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "INTEGRACAO-TESTE-COMPLETO-31X",
    "nome": "Teste Erro"
  }')

echo "$RESULT_ERROR" | jq

# Limpar
echo -e "\n4. Limpando registros de teste..."
docker exec mysql-master mysql -u root -prootpass123 auditoria_db -e "DELETE FROM integracoes WHERE sigla LIKE 'INTEGRACAO-TESTE%'" 2>/dev/null

echo -e "\n✅ Teste concluído!"
