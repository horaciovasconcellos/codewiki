-- Migration: Adicionar coluna status_repositorio
-- Data: 2024-12-29
-- Descrição: Adiciona coluna para controlar se os repositórios já foram criados no Azure DevOps

-- Adicionar coluna status_repositorio na tabela estruturas_projeto
ALTER TABLE estruturas_projeto 
ADD COLUMN status_repositorio CHAR(1) DEFAULT 'N' CHECK (status_repositorio IN ('N', 'Y')) 
COMMENT 'Status de criação dos repositórios: N = Não criado, Y = Criado';

-- Atualizar registros existentes que já têm URL de projeto para Y (assumindo que se tem URL, os repositórios foram criados)
UPDATE estruturas_projeto 
SET status_repositorio = 'Y' 
WHERE url_projeto IS NOT NULL;

-- Adicionar índice para performance
CREATE INDEX idx_estruturas_status_repo ON estruturas_projeto(status_repositorio);

COMMIT;
