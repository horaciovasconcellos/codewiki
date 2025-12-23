-- Adicionar campo cloud_provider na tabela aplicacoes
-- Data: 15/12/2025
-- Objetivo: Permitir especificar o provedor de nuvem da aplicação

USE auditoria_db;

-- Adicionar a coluna cloud_provider com ENUM
ALTER TABLE aplicacoes 
ADD COLUMN cloud_provider ENUM(
  'AWS',
  'Microsoft Azure',
  'Google Cloud',
  'Alibaba Cloud',
  'Oracle',
  'Salesforce',
  'IBM Cloud',
  'Tencent Cloud',
  'PIIDA',
  'ON-PREMISE',
  'Outros'
) DEFAULT NULL AFTER tipo_hospedagem;

-- Verificar a alteração
DESCRIBE aplicacoes;

SELECT 'Campo cloud_provider adicionado à tabela aplicacoes' AS status;
