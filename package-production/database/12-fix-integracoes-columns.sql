-- Corrigir colunas de ENUM para VARCHAR para maior flexibilidade
-- ENUM pode causar problemas se os valores não corresponderem exatamente

ALTER TABLE integracoes
MODIFY COLUMN estilo_integracao VARCHAR(100) NULL,
MODIFY COLUMN padrao_caso_uso VARCHAR(100) NULL,
MODIFY COLUMN integracao_tecnologica VARCHAR(100) NULL;
