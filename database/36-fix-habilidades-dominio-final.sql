-- Migration: Corrigir encoding e valores na coluna dominio
-- Data: 2025-12-23

USE auditoria_db;

-- Converter para VARCHAR temporariamente
ALTER TABLE habilidades MODIFY COLUMN dominio VARCHAR(100);

-- Corrigir valores com encoding errado
UPDATE habilidades 
SET dominio = 'Comunicação & Relacionamento'
WHERE dominio LIKE '%Comunica%' OR dominio = 'Comportamental';

UPDATE habilidades 
SET dominio = 'Gestão & Organização'
WHERE dominio LIKE '%Gest%' OR dominio = 'Gestao';

UPDATE habilidades 
SET dominio = 'Desenvolvimento & Engenharia'
WHERE dominio = 'Tecnica' OR dominio IS NULL OR dominio = '';

-- Converter de volta para ENUM
ALTER TABLE habilidades MODIFY COLUMN dominio ENUM(
  'Arquitetura & Integração de Sistemas',
  'Comunicação & Relacionamento',
  'Dados & Informação',
  'Desenvolvimento & Engenharia',
  'DevOps & DevSecOps',
  'ERP & Plataformas Corporativas',
  'Ética & Postura Profissional',
  'Gestão & Organização',
  'Liderança & Influência',
  'Pensamento Estratégico',
  'Segurança & Compliance'
) NOT NULL DEFAULT 'Desenvolvimento & Engenharia';

-- Verificar resultado
SELECT dominio, COUNT(*) as total 
FROM habilidades 
GROUP BY dominio 
ORDER BY dominio;
