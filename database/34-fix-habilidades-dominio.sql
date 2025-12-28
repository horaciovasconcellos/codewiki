-- Migration: Corrigir valores da coluna dominio em habilidades
-- Data: 2025-12-23
-- Descrição: Migrar de Tecnica/Comportamental/Gestao para os novos domínios

USE auditoria_db;

-- Atualizar valores de dominio
UPDATE habilidades 
SET dominio = CASE 
  WHEN dominio = 'Tecnica' THEN 'Desenvolvimento & Engenharia'
  WHEN dominio = 'Comportamental' THEN 'Comunicação & Relacionamento'
  WHEN dominio = 'Gestao' THEN 'Gestão & Organização'
  WHEN dominio = 'Negócio' THEN 'Pensamento Estratégico'
  WHEN dominio = 'Segurança' THEN 'Segurança & Compliance'
  WHEN dominio = 'DevOps' THEN 'DevOps & DevSecOps'
  WHEN dominio IS NULL THEN 'Desenvolvimento & Engenharia'
  ELSE dominio
END;

-- Converter para ENUM (primeiro para VARCHAR grande, depois para ENUM)
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

-- Criar índice (se não existir, ignora erro)
CREATE INDEX idx_habilidades_dominio ON habilidades(dominio);

-- Verificar resultado
SELECT dominio, COUNT(*) as total 
FROM habilidades 
GROUP BY dominio 
ORDER BY dominio;
