-- Adiciona coluna semanas_sprint na tabela integrador_projetos
-- Migração: Campo Semanas Sprint
-- Data: 2025-12-09
-- Descrição: Adiciona campo para configurar duração das sprints (1-4 semanas)

USE auditoria_db;

-- Adicionar coluna semanas_sprint após iteracao
ALTER TABLE integrador_projetos 
ADD COLUMN semanas_sprint INT NOT NULL DEFAULT 2 AFTER iteracao;

-- Atualizar registros existentes com valor padrão de 2 semanas
UPDATE integrador_projetos 
SET semanas_sprint = 2 
WHERE semanas_sprint IS NULL OR semanas_sprint = 0;

-- Verificar a alteração
SHOW COLUMNS FROM integrador_projetos LIKE 'semanas_sprint';

SELECT 'Migração concluída com sucesso! Coluna semanas_sprint adicionada.' AS status;
