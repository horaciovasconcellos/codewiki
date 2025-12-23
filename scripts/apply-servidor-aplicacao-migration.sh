#!/bin/bash

# Script para aplicar a migration da tabela servidor_aplicacao
# Data: 2025-12-19

echo "=== Aplicando migration: servidor_aplicacao ==="
echo ""

# Verificar se o arquivo SQL existe
if [ ! -f "database/31-create-servidor-aplicacao.sql" ]; then
    echo "❌ Erro: Arquivo database/31-create-servidor-aplicacao.sql não encontrado!"
    exit 1
fi

echo "📄 Arquivo SQL encontrado: database/31-create-servidor-aplicacao.sql"
echo ""

# Tentar diferentes métodos de conexão

# Método 1: Docker Compose
echo "Tentando conectar via Docker Compose..."
if docker-compose exec -T mysql mysql -u root -proot auditoria_db < database/31-create-servidor-aplicacao.sql 2>/dev/null; then
    echo "✅ Migration aplicada com sucesso via Docker Compose!"
    exit 0
fi

# Método 2: MySQL local (sem senha)
echo "Tentando conectar via MySQL local (sem senha)..."
if mysql -u root auditoria_db < database/31-create-servidor-aplicacao.sql 2>/dev/null; then
    echo "✅ Migration aplicada com sucesso via MySQL local!"
    exit 0
fi

# Método 3: MySQL local (com senha root)
echo "Tentando conectar via MySQL local (com senha)..."
if mysql -u root -proot auditoria_db < database/31-create-servidor-aplicacao.sql 2>/dev/null; then
    echo "✅ Migration aplicada com sucesso via MySQL local!"
    exit 0
fi

# Se chegou aqui, nenhum método funcionou
echo ""
echo "❌ Não foi possível conectar ao MySQL automaticamente."
echo ""
echo "Por favor, execute manualmente um dos seguintes comandos:"
echo ""
echo "1. Via Docker Compose:"
echo "   docker-compose exec mysql mysql -u root -proot auditoria_db < database/31-create-servidor-aplicacao.sql"
echo ""
echo "2. Via MySQL local:"
echo "   mysql -u root -p auditoria_db < database/31-create-servidor-aplicacao.sql"
echo ""
echo "3. Via MySQL Workbench ou outra ferramenta gráfica:"
echo "   Abra o arquivo database/31-create-servidor-aplicacao.sql e execute o conteúdo"
echo ""

exit 1
