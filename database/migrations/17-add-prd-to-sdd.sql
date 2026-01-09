-- Adicionar coluna PRD (Product Requirements Document) à tabela projetos_sdd
ALTER TABLE projetos_sdd 
ADD COLUMN IF NOT EXISTS prd_content LONGTEXT COMMENT 'Conteúdo do PRD em formato Markdown';

-- Adicionar campo de origem do requisito para rastreabilidade
ALTER TABLE requisitos_sdd 
ADD COLUMN IF NOT EXISTS origem_prd BOOLEAN DEFAULT FALSE COMMENT 'Indica se o requisito veio do PRD',
ADD COLUMN IF NOT EXISTS secao_prd VARCHAR(255) COMMENT 'Seção do PRD de onde o requisito foi extraído';
