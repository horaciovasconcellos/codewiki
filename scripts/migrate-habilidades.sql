-- Migração da tabela habilidades
-- De: nome, tipo
-- Para: sigla, descricao, dominio, subcategoria

USE auditoria_db;

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

-- Migrar dados existentes (se houver)
INSERT INTO habilidades_new (id, sigla, descricao, dominio, subcategoria, created_at, updated_at)
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
FROM habilidades
WHERE NOT EXISTS (
    SELECT 1 FROM habilidades_new WHERE habilidades_new.id = habilidades.id
);

-- Fazer backup da tabela antiga
DROP TABLE IF EXISTS habilidades_backup;
RENAME TABLE habilidades TO habilidades_backup;

-- Renomear nova tabela
RENAME TABLE habilidades_new TO habilidades;

-- Verificar migração
SELECT COUNT(*) as total_habilidades FROM habilidades;
SELECT COUNT(*) as total_backup FROM habilidades_backup;

-- Se tudo estiver correto, você pode remover o backup depois com:
-- DROP TABLE habilidades_backup;

SELECT 'Migração concluída com sucesso!' as status;
