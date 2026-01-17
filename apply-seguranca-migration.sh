#!/bin/bash

# Script para aplicar migration de segurança
echo "==================================="
echo "Aplicando Migration de Segurança"
echo "==================================="

# Executar migration
mysql -u root -p codewiki < database/migrations/create-seguranca-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration aplicada com sucesso!"
    echo ""
    echo "Tabelas criadas:"
    echo "  - usuarios_seguranca"
    echo "  - roles"
    echo "  - resources"
    echo "  - scopes"
    echo "  - acl"
    echo "  - usuario_roles"
    echo "  - auditoria_acesso"
    echo ""
    echo "⚠️  IMPORTANTE: Configure o SALT em Configurações antes de criar usuários!"
else
    echo "❌ Erro ao aplicar migration"
    exit 1
fi
