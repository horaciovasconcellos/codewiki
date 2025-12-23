#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO COMPLETO"
echo "=========================================="

echo ""
echo "1. Verificando se o servidor está rodando..."
SERVER_RUNNING=$(lsof -ti:3000)
if [ -z "$SERVER_RUNNING" ]; then
    echo "❌ Servidor NÃO está rodando na porta 3000"
    echo ""
    echo "Inicie o servidor com: npm run dev:api"
    exit 1
else
    echo "✅ Servidor rodando (PID: $SERVER_RUNNING)"
fi

echo ""
echo "2. Verificando MySQL Docker..."
MYSQL_RUNNING=$(docker ps --filter "name=mysql-master" --format "{{.ID}}")
if [ -z "$MYSQL_RUNNING" ]; then
    echo "❌ Container MySQL NÃO está rodando"
    echo ""
    echo "Inicie o MySQL com: docker-compose up -d"
    exit 1
else
    echo "✅ MySQL rodando (Container: $MYSQL_RUNNING)"
fi

echo ""
echo "3. Testando conexão MySQL..."
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT 'OK' as status;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Conexão MySQL OK"
else
    echo "❌ Falha na conexão MySQL"
    exit 1
fi

echo ""
echo "4. Verificando estrutura da tabela habilidades..."
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "DESCRIBE habilidades;" 2>/dev/null

echo ""
echo "5. Tentando inserir diretamente no MySQL..."
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "
INSERT INTO habilidades (id, sigla, descricao, dominio, subcategoria) 
VALUES (UUID(), 'TEST', 'Teste direto no banco', 'Técnica', 'Teste');
SELECT * FROM habilidades WHERE sigla = 'TEST';
DELETE FROM habilidades WHERE sigla = 'TEST';
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ INSERT direto no MySQL funciona"
else
    echo "❌ Falha ao inserir direto no MySQL"
fi

echo ""
echo "6. Testando endpoint de diagnóstico da API..."
DIAG_RESPONSE=$(curl -s http://localhost:3000/api/habilidades/diagnostico)
echo "$DIAG_RESPONSE" | jq '.' 2>/dev/null || echo "$DIAG_RESPONSE"

echo ""
echo "7. Testando POST via API (verifique os logs do servidor!)..."
echo ""
curl -v -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "DEBUG",
    "descricao": "Teste de Debug",
    "dominio": "Técnica",
    "subcategoria": "Debug"
  }' 2>&1

echo ""
echo ""
echo "=========================================="
echo "VERIFIQUE OS LOGS DO SERVIDOR"
echo "No terminal onde está rodando 'npm run dev:api'"
echo "Procure por linhas começando com:"
echo "  [API POST /habilidades]"
echo "=========================================="
