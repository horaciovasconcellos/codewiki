-- Solução definitiva: substituir ENUM por VARCHAR com CHECK constraint

-- 1. Alterar para VARCHAR
ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- 2. Limpar e padronizar valores existentes
UPDATE lgpd_registros SET tipo_dados = 'Dados Identificadores Diretos' WHERE tipo_dados LIKE '%Identificadores Diretos%';
UPDATE lgpd_registros SET tipo_dados = 'Dados Identificadores Indiretos' WHERE tipo_dados LIKE '%Identificadores Indiretos%';
UPDATE lgpd_registros SET tipo_dados = 'Dados Sensíveis' WHERE tipo_dados LIKE '%Sens%';
UPDATE lgpd_registros SET tipo_dados = 'Dados Financeiros' WHERE tipo_dados LIKE '%Financeiros%';
UPDATE lgpd_registros SET tipo_dados = 'Dados de Localização' WHERE tipo_dados LIKE '%Local%';

UPDATE lgpd_registros SET tecnica_anonimizacao = 'Anonimização por Supressão' WHERE tecnica_anonimizacao LIKE '%Supress%';
UPDATE lgpd_registros SET tecnica_anonimizacao = 'Anonimização por Generalização' WHERE tecnica_anonimizacao LIKE '%General%';
UPDATE lgpd_registros SET tecnica_anonimizacao = 'Pseudonimização (Embaralhamento Reversível)' WHERE tecnica_anonimizacao LIKE '%Embaralhamento%' OR tecnica_anonimizacao LIKE '%Pseudon%';
UPDATE lgpd_registros SET tecnica_anonimizacao = 'Anonimização por Permutação' WHERE tecnica_anonimizacao LIKE '%Permut%';

-- 3. Verificar resultado
SELECT id, identificacao_dados, tipo_dados, tecnica_anonimizacao
FROM lgpd_registros;
