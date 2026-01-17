-- =====================================================
-- MIGRATION: Fix Pipelines Structure
-- Data: 15/01/2026
-- Descrição: Adicionar campos faltantes na tabela pipelines
--            para suportar a API atual
-- =====================================================

-- Adicionar coluna status
ALTER TABLE pipelines 
ADD COLUMN status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Em avaliação';

-- Adicionar colunas de data
ALTER TABLE pipelines 
ADD COLUMN data_inicio DATE DEFAULT NULL,
ADD COLUMN data_termino DATE DEFAULT NULL;

-- Adicionar colunas de configuração de branches
ALTER TABLE pipelines 
ADD COLUMN trigger_branches TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
ADD COLUMN trigger_paths TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
ADD COLUMN pr_branches TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Adicionar colunas de recursos
ALTER TABLE pipelines 
ADD COLUMN resources_repositories TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
ADD COLUMN resources_pipelines TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
ADD COLUMN resources_containers TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- Verificar estrutura
SHOW COLUMNS FROM pipelines LIKE 'status';

SELECT 'Migration fix-pipelines-structure completed successfully!' AS status;
