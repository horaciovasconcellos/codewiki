-- MIGRATION URGENTE: Adicionar colunas na tabela aplicacao_ambientes
-- Execute este arquivo AGORA para corrigir o erro

USE auditoria_db;

-- Adicionar coluna identificador_aplicacao (ignora erro se já existir)
ALTER TABLE aplicacao_ambientes 
ADD COLUMN identificador_aplicacao VARCHAR(20) DEFAULT 'api' AFTER aplicacao_id;

-- Adicionar coluna localizacao_regiao (ignora erro se já existir)
ALTER TABLE aplicacao_ambientes 
ADD COLUMN localizacao_regiao VARCHAR(20) DEFAULT 'not-specified' AFTER tipo_ambiente;

-- Adicionar índice (ignora erro se já existir)
ALTER TABLE aplicacao_ambientes 
ADD INDEX idx_identificador (identificador_aplicacao);

-- Atualizar registros NULL
UPDATE aplicacao_ambientes 
SET identificador_aplicacao = 'api'
WHERE identificador_aplicacao IS NULL OR identificador_aplicacao = '';

UPDATE aplicacao_ambientes 
SET localizacao_regiao = 'not-specified'
WHERE localizacao_regiao IS NULL OR localizacao_regiao = '';

-- Normalizar tipos de ambiente
UPDATE aplicacao_ambientes SET tipo_ambiente = 'DEV' WHERE tipo_ambiente = 'Dev';
UPDATE aplicacao_ambientes SET tipo_ambiente = 'PROD' WHERE tipo_ambiente = 'Prod';
UPDATE aplicacao_ambientes SET tipo_ambiente = 'DEV' WHERE tipo_ambiente = 'Cloud';
UPDATE aplicacao_ambientes SET tipo_ambiente = 'PROD' WHERE tipo_ambiente = 'On-Premise';

-- Verificar resultado
SELECT 'Migration concluída! ✓' as status;
SELECT COUNT(*) as total_ambientes FROM aplicacao_ambientes;
SELECT tipo_ambiente, COUNT(*) as total FROM aplicacao_ambientes GROUP BY tipo_ambiente;
