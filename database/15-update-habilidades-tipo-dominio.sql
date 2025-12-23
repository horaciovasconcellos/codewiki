-- Migração para adicionar campo tipo e atualizar domínios em habilidades
-- Data: 14/12/2024

USE auditoria_db;

-- Adicionar coluna tipo (ignorar erro se já existe)
ALTER TABLE habilidades 
ADD COLUMN tipo ENUM('Soft Skills', 'Hard Skills') NOT NULL DEFAULT 'Hard Skills' AFTER descricao;

-- Criar coluna temporária com novos valores
ALTER TABLE habilidades
ADD COLUMN dominio_temp VARCHAR(100);

-- Migrar dados antigos para novos valores
UPDATE habilidades 
SET dominio_temp = CASE 
  WHEN dominio = 'Técnica' THEN 'Desenvolvimento & Engenharia'
  WHEN dominio = 'Comportamental' THEN 'Comunicação & Relacionamento'
  WHEN dominio = 'Gestão' THEN 'Gestão & Organização'
  WHEN dominio = 'Negócio' THEN 'Pensamento Estratégico'
  WHEN dominio = 'Segurança' THEN 'Segurança & Compliance'
  WHEN dominio = 'DevOps' THEN 'DevOps & DevSecOps'
  ELSE 'Desenvolvimento & Engenharia'
END;

-- Remover coluna antiga
ALTER TABLE habilidades DROP COLUMN dominio;

-- Renomear e converter para ENUM
ALTER TABLE habilidades 
CHANGE COLUMN dominio_temp dominio ENUM(
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
) NOT NULL;

-- Definir tipo baseado no domínio
UPDATE habilidades 
SET tipo = CASE 
  WHEN dominio IN (
    'Comunicação & Relacionamento', 
    'Ética & Postura Profissional', 
    'Liderança & Influência', 
    'Pensamento Estratégico', 
    'Gestão & Organização'
  ) THEN 'Soft Skills'
  ELSE 'Hard Skills'
END;

-- Criar índices
CREATE INDEX idx_habilidades_tipo ON habilidades(tipo);
CREATE INDEX idx_habilidades_dominio ON habilidades(dominio);

-- Verificar resultado
SELECT tipo, dominio, COUNT(*) as total 
FROM habilidades 
GROUP BY tipo, dominio 
ORDER BY tipo, dominio;
