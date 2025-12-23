-- Adicionar PIIDA ao ENUM de cloud_provider
-- Data: 18/12/2025
-- Objetivo: Incluir PIIDA como opção de provedor de nuvem

USE auditoria_db;

-- Modificar a coluna cloud_provider para incluir PIIDA
ALTER TABLE aplicacoes 
MODIFY COLUMN cloud_provider ENUM(
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
) DEFAULT NULL;

-- Verificar a alteração
DESCRIBE aplicacoes;

SELECT 'PIIDA adicionado ao cloud_provider' AS status;
