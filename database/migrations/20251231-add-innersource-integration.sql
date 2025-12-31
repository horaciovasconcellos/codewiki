-- Adicionar campos para integração com InnerSource
-- Data: 2025-12-31

-- Tentar adicionar coluna inner_source_project (ignore se já existir)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'auditoria_db' AND TABLE_NAME = 'estruturas_projeto' 
    AND COLUMN_NAME = 'inner_source_project') = 0,
    'ALTER TABLE estruturas_projeto ADD COLUMN inner_source_project BOOLEAN DEFAULT FALSE',
    'SELECT "Column inner_source_project already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tentar adicionar coluna aplicacao_base_id (ignore se já existir)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'auditoria_db' AND TABLE_NAME = 'estruturas_projeto' 
    AND COLUMN_NAME = 'aplicacao_base_id') = 0,
    'ALTER TABLE estruturas_projeto ADD COLUMN aplicacao_base_id VARCHAR(36)',
    'SELECT "Column aplicacao_base_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice para pesquisas por InnerSource (procedure condicional)
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'auditoria_db' AND TABLE_NAME = 'estruturas_projeto' 
    AND INDEX_NAME = 'idx_estruturas_innersource') = 0,
    'CREATE INDEX idx_estruturas_innersource ON estruturas_projeto(inner_source_project)',
    'SELECT "Index idx_estruturas_innersource already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar projetos existentes
UPDATE estruturas_projeto 
SET inner_source_project = FALSE 
WHERE inner_source_project IS NULL;
