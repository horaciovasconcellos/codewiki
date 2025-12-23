#!/bin/bash

# Script para testar criação de habilidades via API

echo "=========================================="
echo "1. Verificando estrutura da tabela..."
echo "=========================================="
curl -s http://localhost:3000/api/habilidades/diagnostico | jq '.'

echo ""
echo "=========================================="
echo "2. Criando habilidades de teste..."
echo "=========================================="

# Habilidade 1: React
echo ""
echo "Criando: REACT - React 18"
curl -s -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "REACT",
    "descricao": "React 18 - Biblioteca para interfaces de usuário",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  }' | jq '.'

# Habilidade 2: Node.js
echo ""
echo "Criando: NODEJS - Node.js"
curl -s -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "NODEJS",
    "descricao": "Node.js - Runtime JavaScript server-side",
    "dominio": "Técnica",
    "subcategoria": "Backend"
  }' | jq '.'

# Habilidade 3: MySQL
echo ""
echo "Criando: MYSQL - MySQL Database"
curl -s -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "MYSQL",
    "descricao": "MySQL - Sistema de gerenciamento de banco de dados",
    "dominio": "Técnica",
    "subcategoria": "Database"
  }' | jq '.'

# Habilidade 4: Gestão de Projetos
echo ""
echo "Criando: GESTPROJ - Gestão de Projetos"
curl -s -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "GESTPROJ",
    "descricao": "Gestão de Projetos com metodologias ágeis",
    "dominio": "Negócio",
    "subcategoria": "Gestão"
  }' | jq '.'

echo ""
echo "=========================================="
echo "3. Listando todas as habilidades via API..."
echo "=========================================="
curl -s http://localhost:3000/api/habilidades | jq '.[] | {sigla, descricao, dominio, subcategoria}'

echo ""
echo "=========================================="
echo "4. Verificando no banco de dados MySQL..."
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT * FROM habilidades ORDER BY sigla;"

echo ""
echo "=========================================="
echo "5. Contando registros..."
echo "=========================================="
docker exec mysql-master mysql -uapp_user -papppass123 auditoria_db -e "SELECT COUNT(*) as total FROM habilidades;"

echo ""
echo "Teste concluído!"
