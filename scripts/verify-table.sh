#!/bin/bash

# Script para verificar se a tabela servidor_aplicacao existe

echo "Verificando tabela servidor_aplicacao..."
echo ""

# Tentar conectar e verificar
mysql -h localhost -u root -prootpass123 auditoria_db << 'EOF'
-- Verificar se a tabela existe
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'auditoria_db' 
  AND TABLE_NAME = 'servidor_aplicacao';

-- Se existir, mostrar estrutura
DESCRIBE servidor_aplicacao;

-- Contar registros
SELECT COUNT(*) as total_registros FROM servidor_aplicacao;

-- Mostrar alguns registros
SELECT * FROM servidor_aplicacao LIMIT 5;
EOF

echo ""
echo "Se a tabela não existe, execute:"
echo "  mysql -h localhost -u root -prootpass123 auditoria_db < database/31-create-servidor-aplicacao.sql"
