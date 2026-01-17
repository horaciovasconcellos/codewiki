-- Migration: Adicionar campos identificador_aplicacao e localizacao_regiao na tabela aplicacao_ambientes
-- Data: 2026-01-16
-- Descrição: Adiciona novos campos para melhor identificação e localização dos ambientes das aplicações

USE auditoria_db;

-- Verificar se as colunas já existem antes de adicionar
SET @dbname = DATABASE();
SET @tablename = 'aplicacao_ambientes';

-- Adicionar coluna identificador_aplicacao (se não existir)
SET @column_exists_identificador = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'identificador_aplicacao'
);

SET @query_identificador = IF(
    @column_exists_identificador = 0,
    'ALTER TABLE aplicacao_ambientes ADD COLUMN identificador_aplicacao VARCHAR(20) NOT NULL DEFAULT "api" AFTER aplicacao_id',
    'SELECT "Coluna identificador_aplicacao já existe" as message'
);

PREPARE stmt FROM @query_identificador;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna localizacao_regiao (se não existir)
SET @column_exists_localizacao = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'localizacao_regiao'
);

SET @query_localizacao = IF(
    @column_exists_localizacao = 0,
    'ALTER TABLE aplicacao_ambientes ADD COLUMN localizacao_regiao VARCHAR(20) NOT NULL DEFAULT "us-east-1" AFTER tipo_ambiente',
    'SELECT "Coluna localizacao_regiao já existe" as message'
);

PREPARE stmt FROM @query_localizacao;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice para identificador_aplicacao (se não existir)
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = 'idx_identificador'
);

SET @query_index = IF(
    @index_exists = 0,
    'ALTER TABLE aplicacao_ambientes ADD INDEX idx_identificador (identificador_aplicacao)',
    'SELECT "Índice idx_identificador já existe" as message'
);

PREPARE stmt FROM @query_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar registros existentes (se houver)
-- Definir valores padrão para todos os registros que ainda não têm os novos campos preenchidos
UPDATE aplicacao_ambientes 
SET identificador_aplicacao = 'api'
WHERE identificador_aplicacao IS NULL OR identificador_aplicacao = '';

UPDATE aplicacao_ambientes 
SET localizacao_regiao = 'not-specified'
WHERE localizacao_regiao IS NULL OR localizacao_regiao = '';

-- Exibir resultado
SELECT 'Migration concluída com sucesso!' as status;
SELECT 'Registros atualizados:' as info;
SELECT COUNT(*) as total_registros FROM aplicacao_ambientes;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = @dbname
AND TABLE_NAME = @tablename
AND COLUMN_NAME IN ('identificador_aplicacao', 'localizacao_regiao')
ORDER BY ORDINAL_POSITION;
