-- Migration: Altera campo nome da tabela integracoes para 80 caracteres
-- Data: 2025-12-15
-- Descrição: Expande o campo nome de VARCHAR(30) para VARCHAR(80)

ALTER TABLE integracoes 
MODIFY COLUMN nome VARCHAR(80) NOT NULL;

-- Verificação
DESCRIBE integracoes;
