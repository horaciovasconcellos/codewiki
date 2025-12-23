-- Alteração da coluna sigla para suportar 15 caracteres
-- Data: 15/12/2025
-- Objetivo: Aumentar o limite de caracteres do campo sigla de 10 para 15

USE auditoria_db;

-- Alterar a coluna sigla na tabela aplicacoes
ALTER TABLE aplicacoes 
MODIFY COLUMN sigla VARCHAR(15) NOT NULL UNIQUE;

-- Verificar a alteração
DESCRIBE aplicacoes;

SELECT 'Coluna sigla da tabela aplicacoes alterada para VARCHAR(15)' AS status;
