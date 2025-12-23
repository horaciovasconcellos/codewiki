-- Adicionar campos adicionais na tabela habilidades
-- Executar em: auditoria_db

USE auditoria_db;

-- Adicionar novas colunas
ALTER TABLE habilidades
ADD COLUMN descricao VARCHAR(255) DEFAULT NULL AFTER nome,
ADD COLUMN dominio VARCHAR(100) DEFAULT NULL AFTER tipo,
ADD COLUMN subcategoria VARCHAR(100) DEFAULT NULL AFTER dominio;

-- Atualizar registros existentes copiando nome para descricao
UPDATE habilidades SET descricao = nome WHERE descricao IS NULL;
UPDATE habilidades SET dominio = tipo WHERE dominio IS NULL;
UPDATE habilidades SET subcategoria = 'Outras' WHERE subcategoria IS NULL;

-- Renomear coluna nome para sigla para melhor semântica
ALTER TABLE habilidades CHANGE COLUMN nome sigla VARCHAR(100) NOT NULL;

-- Verificar estrutura
DESCRIBE habilidades;

-- Contar registros
SELECT COUNT(*) as total FROM habilidades;
