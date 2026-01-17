-- Migration: Ajustar tabela execucoes_teste para permitir caso de teste como texto
-- Data: 2026-01-15
-- Descrição: Adiciona campo caso_teste_titulo e torna caso_teste_id opcional

USE auditoria_db;

-- Adicionar campo caso_teste_titulo
ALTER TABLE execucoes_teste 
ADD COLUMN caso_teste_titulo VARCHAR(100) AFTER caso_teste_id;

-- Tornar caso_teste_id opcional (remover NOT NULL)
ALTER TABLE execucoes_teste 
MODIFY COLUMN caso_teste_id VARCHAR(36) NULL;

-- Remover foreign key antiga
ALTER TABLE execucoes_teste 
DROP FOREIGN KEY execucoes_teste_ibfk_1;

-- Adicionar foreign key novamente, mas como opcional
ALTER TABLE execucoes_teste 
ADD CONSTRAINT fk_execucoes_teste_caso_teste 
FOREIGN KEY (caso_teste_id) REFERENCES casos_teste(id) ON DELETE SET NULL;
