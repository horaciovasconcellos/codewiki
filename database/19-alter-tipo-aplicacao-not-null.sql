-- Tornando tipo_aplicacao obrigatório (NOT NULL)
USE auditoria_db;

-- Primeiro, atualizar registros existentes com valor padrão se estiverem NULL
UPDATE aplicacoes 
SET tipo_aplicacao = 'INTERNO' 
WHERE tipo_aplicacao IS NULL;

-- Alterar a coluna para NOT NULL
ALTER TABLE aplicacoes 
MODIFY COLUMN tipo_aplicacao ENUM('BOT','COTS','INTERNO','MOTS','OSS','OTS','PAAS','SAAS') NOT NULL;
