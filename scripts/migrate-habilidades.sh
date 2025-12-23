#!/bin/bash

# Script para migrar tabela habilidades
# Uso: ./migrate-habilidades.sh

MYSQL_HOST="${MYSQL_HOST:-mysql-master}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-app_user}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-apppass123}"
MYSQL_DATABASE="${MYSQL_DATABASE:-auditoria_db}"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MIGRAÇÃO DA TABELA HABILIDADES                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Banco: ${MYSQL_DATABASE}"
echo "🖥️  Host: ${MYSQL_HOST}:${MYSQL_PORT}"
echo ""
echo "⚠️  Esta operação irá:"
echo "   1. Criar tabela habilidades_new com nova estrutura"
echo "   2. Migrar dados existentes"
echo "   3. Fazer backup da tabela antiga (habilidades_backup)"
echo "   4. Substituir tabela antiga pela nova"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada"
    exit 1
fi

echo ""
echo "🔄 Executando migração..."

# Executar script SQL
docker exec mysql-master mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} <<'EOF'
-- Criar tabela temporária com nova estrutura
CREATE TABLE IF NOT EXISTS habilidades_new (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    dominio VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_habilidades_sigla (sigla),
    INDEX idx_dominio (dominio),
    INDEX idx_subcategoria (subcategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se existe dados na tabela antiga
SELECT CONCAT('📋 Habilidades existentes: ', COUNT(*)) as info FROM habilidades;

-- Migrar dados existentes (se houver)
INSERT IGNORE INTO habilidades_new (id, sigla, descricao, dominio, subcategoria, created_at, updated_at)
SELECT 
    id,
    UPPER(REPLACE(SUBSTRING(nome, 1, 20), ' ', '-')) as sigla,
    nome as descricao,
    CASE 
        WHEN tipo = 'Técnica' THEN 'Técnica'
        WHEN tipo = 'Comportamental' THEN 'Comportamental'
        ELSE 'Gestão'
    END as dominio,
    CASE 
        WHEN tipo = 'Técnica' THEN 'Outras'
        WHEN tipo = 'Comportamental' THEN 'Comportamental'
        ELSE 'Gestão'
    END as subcategoria,
    created_at,
    updated_at
FROM habilidades;

-- Verificar migração
SELECT CONCAT('✅ Habilidades migradas: ', COUNT(*)) as info FROM habilidades_new;

-- Fazer backup da tabela antiga
DROP TABLE IF EXISTS habilidades_backup;
RENAME TABLE habilidades TO habilidades_backup;

-- Renomear nova tabela
RENAME TABLE habilidades_new TO habilidades;

-- Resultado final
SELECT '✅ Migração concluída com sucesso!' as status;
SELECT CONCAT('📊 Total de habilidades: ', COUNT(*)) as resultado FROM habilidades;

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migração concluída com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Teste a aplicação"
    echo "   2. Se tudo estiver OK, remova o backup:"
    echo "      docker exec mysql-master mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} -e 'DROP TABLE habilidades_backup;'"
    echo ""
else
    echo ""
    echo "❌ Erro durante a migração!"
    echo "   Verifique os logs acima"
    exit 1
fi
