-- Script para corrigir encoding dos valores ENUM na tabela lgpd_registros
-- Problema: Dados inseridos com encoding incorreto (ISO-8859-1) ao invés de UTF-8

-- IMPORTANTE: Fazer backup antes de executar!

-- 1. Verificar registros com encoding incorreto
SELECT id, identificacao_dados, tipo_dados, tecnica_anonimizacao
FROM lgpd_registros
WHERE tipo_dados LIKE '%SensÃ%' 
   OR tecnica_anonimizacao LIKE '%SupressÃ%'
   OR tecnica_anonimizacao LIKE '%GeneralizaÃ§Ã£o%'
   OR tecnica_anonimizacao LIKE '%PermutaÃ§Ã£o%';

-- 2. Alterar a tabela temporariamente para VARCHAR para fazer a correção
ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados VARCHAR(100) NOT NULL;

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao VARCHAR(100) NOT NULL;

-- 3. Corrigir valores de tipo_dados
UPDATE lgpd_registros 
SET tipo_dados = 'Dados Sensíveis'
WHERE tipo_dados LIKE '%SensÃ%';

UPDATE lgpd_registros 
SET tipo_dados = 'Dados Identificadores Diretos'
WHERE tipo_dados LIKE '%Identificadores Diretos%';

UPDATE lgpd_registros 
SET tipo_dados = 'Dados Identificadores Indiretos'
WHERE tipo_dados LIKE '%Identificadores Indiretos%';

UPDATE lgpd_registros 
SET tipo_dados = 'Dados Financeiros'
WHERE tipo_dados LIKE '%Financeiros%';

UPDATE lgpd_registros 
SET tipo_dados = 'Dados de Localização'
WHERE tipo_dados LIKE '%LocalizaÃ§Ã£o%' OR tipo_dados LIKE '%Localização%';

-- 4. Corrigir valores de tecnica_anonimizacao
UPDATE lgpd_registros 
SET tecnica_anonimizacao = 'Anonimização por Supressão'
WHERE tecnica_anonimizacao LIKE '%SupressÃ%';

UPDATE lgpd_registros 
SET tecnica_anonimizacao = 'Anonimização por Generalização'
WHERE tecnica_anonimizacao LIKE '%GeneralizaÃ§Ã£o%' OR tecnica_anonimizacao LIKE '%Generalização%';

UPDATE lgpd_registros 
SET tecnica_anonimizacao = 'Pseudonimização (Embaralhamento Reversível)'
WHERE tecnica_anonimizacao LIKE '%Embaralhamento%';

UPDATE lgpd_registros 
SET tecnica_anonimizacao = 'Anonimização por Permutação'
WHERE tecnica_anonimizacao LIKE '%PermutaÃ§Ã£o%' OR tecnica_anonimizacao LIKE '%Permutação%';

-- 5. Restaurar ENUM com valores corretos
ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados ENUM(
    'Dados Identificadores Diretos',
    'Dados Identificadores Indiretos',
    'Dados Sensíveis',
    'Dados Financeiros',
    'Dados de Localização'
  ) NOT NULL COMMENT 'Tipo de dados pessoais';

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica padrão de anonimização';

-- 6. Verificar resultado
SELECT id, identificacao_dados, tipo_dados, tecnica_anonimizacao
FROM lgpd_registros;

-- 7. Se tudo estiver OK, commit
COMMIT;
