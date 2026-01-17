-- Migration: Aumentar tamanho da coluna sigla de 20 para 50 caracteres
-- Data: 2026-01-15
-- Motivo: Algumas siglas de tecnologias ultrapassam 20 caracteres (ex: MICROSOFT BLOB STORAGE com 23 caracteres)

-- Aumentar tamanho da coluna sigla mantendo NOT NULL e UNIQUE
ALTER TABLE tecnologias MODIFY COLUMN sigla VARCHAR(50) NOT NULL UNIQUE;

-- Verificar a alteração
DESCRIBE tecnologias;
