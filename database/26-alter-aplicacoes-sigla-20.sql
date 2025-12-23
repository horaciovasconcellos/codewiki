-- ============================================
-- Migration: Alterar coluna sigla para VARCHAR(20)
-- Data: 2025-12-16
-- Descrição: Aumenta o limite da sigla de aplicações de 15 para 20 caracteres
-- ============================================

-- Alterar coluna sigla na tabela aplicacoes
ALTER TABLE aplicacoes
MODIFY COLUMN sigla VARCHAR(20) NOT NULL UNIQUE;

-- Verificação
SELECT 'Coluna sigla da tabela aplicacoes alterada para VARCHAR(20)' AS status;

-- Verificar estrutura da coluna
SHOW COLUMNS FROM aplicacoes LIKE 'sigla';
