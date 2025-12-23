#!/bin/bash

echo "=========================================="
echo "Verificando processo na porta 3000..."
echo "=========================================="
lsof -i :3000 || echo "Nenhum processo encontrado na porta 3000"

echo ""
echo "=========================================="
echo "Verificando se o Docker está rodando..."
echo "=========================================="
docker ps | grep mysql

echo ""
echo "=========================================="
echo "Testando conexão com o banco..."
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT 'Conexão OK' as status;"

echo ""
echo "=========================================="
echo "Verificando logs do container MySQL..."
echo "=========================================="
docker logs --tail 20 mysql-master

echo ""
echo "=========================================="
echo "Testando endpoint de diagnóstico..."
echo "=========================================="
curl -s http://localhost:3000/api/habilidades/diagnostico | jq '.' || echo "Erro ao acessar endpoint"
