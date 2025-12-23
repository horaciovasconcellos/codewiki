-- ======================================================================
-- Script de Migração: Correção da estrutura da tabela processos_negocio
-- ======================================================================
-- Este script adiciona os campos faltantes na tabela processos_negocio
-- incluindo o campo 'frequencia' que não estava sendo gravado/exibido
-- ======================================================================

USE auditoria_db;

-- Verificar se a tabela existe
SET @table_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
);

-- Adicionar coluna 'nivel_maturidade' se não existir
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'nivel_maturidade'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN nivel_maturidade VARCHAR(50) NOT NULL DEFAULT ''Inicial'' AFTER descricao',
    'SELECT ''Coluna nivel_maturidade já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna 'area_responsavel' se não existir
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'area_responsavel'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN area_responsavel VARCHAR(200) NOT NULL DEFAULT '''' AFTER nivel_maturidade',
    'SELECT ''Coluna area_responsavel já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna 'frequencia' se não existir (CAMPO PRINCIPAL DO FIX)
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'frequencia'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN frequencia VARCHAR(50) NOT NULL DEFAULT ''Mensal'' AFTER area_responsavel',
    'SELECT ''Coluna frequencia já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna 'duracao_media' se não existir
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'duracao_media'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN duracao_media DECIMAL(10,2) DEFAULT NULL AFTER frequencia',
    'SELECT ''Coluna duracao_media já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna 'complexidade' se não existir
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'complexidade'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN complexidade VARCHAR(50) NOT NULL DEFAULT ''Média'' AFTER duracao_media',
    'SELECT ''Coluna complexidade já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar coluna 'normas' se não existir
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'normas'
);

SET @sql = IF(@table_exists > 0 AND @column_exists = 0,
    'ALTER TABLE processos_negocio ADD COLUMN normas JSON DEFAULT NULL AFTER complexidade',
    'SELECT ''Coluna normas já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modificar coluna 'identificacao' para NOT NULL se existir como nullable
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND COLUMN_NAME = 'identificacao'
    AND IS_NULLABLE = 'YES'
);

SET @sql = IF(@table_exists > 0 AND @column_exists > 0,
    'ALTER TABLE processos_negocio MODIFY COLUMN identificacao VARCHAR(50) NOT NULL',
    'SELECT ''Coluna identificacao já é NOT NULL ou não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índices se não existirem
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND INDEX_NAME = 'idx_processos_identificacao'
);

SET @sql = IF(@table_exists > 0 AND @index_exists = 0,
    'CREATE INDEX idx_processos_identificacao ON processos_negocio(identificacao)',
    'SELECT ''Índice idx_processos_identificacao já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND INDEX_NAME = 'idx_processos_area'
);

SET @sql = IF(@table_exists > 0 AND @index_exists = 0,
    'CREATE INDEX idx_processos_area ON processos_negocio(area_responsavel)',
    'SELECT ''Índice idx_processos_area já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME = 'processos_negocio'
    AND INDEX_NAME = 'idx_processos_complexidade'
);

SET @sql = IF(@table_exists > 0 AND @index_exists = 0,
    'CREATE INDEX idx_processos_complexidade ON processos_negocio(complexidade)',
    'SELECT ''Índice idx_processos_complexidade já existe ou tabela não existe'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Exibir estrutura final da tabela
SELECT 'Estrutura final da tabela processos_negocio:' AS message;
DESCRIBE processos_negocio;

SELECT '✓ Migração concluída com sucesso!' AS message;
SELECT 'Campos adicionados/verificados:' AS info;
SELECT '  - nivel_maturidade' AS campo;
SELECT '  - area_responsavel' AS campo;
SELECT '  - frequencia (CAMPO PRINCIPAL CORRIGIDO)' AS campo;
SELECT '  - duracao_media' AS campo;
SELECT '  - complexidade' AS campo;
SELECT '  - normas' AS campo;
