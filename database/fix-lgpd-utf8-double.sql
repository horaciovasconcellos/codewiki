-- Corrigir ENUM com encoding correto usando conversão BINARY

-- 1. Converter para VARCHAR temporário
ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

-- 2. Converter valores existentes de UTF-8 duplo para UTF-8 simples
UPDATE lgpd_registros
SET tipo_dados = CONVERT(CAST(CONVERT(tipo_dados USING latin1) AS BINARY) USING utf8mb4);

UPDATE lgpd_registros
SET tecnica_anonimizacao = CONVERT(CAST(CONVERT(tecnica_anonimizacao USING latin1) AS BINARY) USING utf8mb4);

-- 3. Recriar ENUM com valores corretos
ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados ENUM(
    'Dados Identificadores Diretos',
    'Dados Identificadores Indiretos',
    'Dados Sensíveis',
    'Dados Financeiros',
    'Dados de Localização'
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tipo de dados pessoais';

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Técnica padrão de anonimização';

-- 4. Verificar resultado
SELECT id, identificacao_dados, tipo_dados, tecnica_anonimizacao, HEX(tipo_dados) as hex_tipo
FROM lgpd_registros;
