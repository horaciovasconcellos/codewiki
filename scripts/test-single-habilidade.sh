#!/bin/bash

echo "=========================================="
echo "Testando criação de uma habilidade"
echo "=========================================="

echo ""
echo "Enviando POST para /api/habilidades..."
echo ""

curl -v -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "REACT",
    "descricao": "React 18 - Biblioteca para interfaces de usuário",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  }'

echo ""
echo ""
echo "=========================================="
echo "Verificando no banco de dados..."
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT * FROM habilidades WHERE sigla = 'REACT';"

echo ""
echo "=========================================="
echo "Total de registros:"
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT COUNT(*) as total FROM habilidades;"
