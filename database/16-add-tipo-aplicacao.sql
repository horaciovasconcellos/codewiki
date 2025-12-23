-- Add tipo_aplicacao column to aplicacoes table
ALTER TABLE aplicacoes 
ADD COLUMN tipo_aplicacao ENUM('BOT', 'COTS', 'INTERNO', 'MOTS', 'OSS', 'OTS', 'PAAS', 'SAAS') DEFAULT NULL
COMMENT 'Tipo de aplicação: BOT, COTS (Commercial Off-The-Shelf), INTERNO, MOTS (Modified Off-The-Shelf), OSS (Open Source Software), OTS (Off-The-Shelf), PAAS (Platform as a Service), SAAS (Software as a Service)';

-- Update existing records to have a default value (optional)
-- UPDATE aplicacoes SET tipo_aplicacao = 'INTERNO' WHERE tipo_aplicacao IS NULL;
