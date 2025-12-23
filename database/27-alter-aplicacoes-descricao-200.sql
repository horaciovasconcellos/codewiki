-- Migration: Alterar campo descricao de VARCHAR(50) para VARCHAR(200)
-- Data: 2025-12-16
-- Descrição: Aumentar o limite de caracteres da descrição das aplicações

USE auditoria_db;

ALTER TABLE aplicacoes MODIFY COLUMN descricao VARCHAR(200) NOT NULL;

-- Verificar a alteração
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'auditoria_db' 
  AND TABLE_NAME = 'aplicacoes' 
  AND COLUMN_NAME = 'descricao';
