-- Migration: Corrigir valores da coluna tipo em habilidades
-- Data: 2025-12-23
-- Descrição: Migrar de Tecnica/Comportamental/Gestao para Soft Skills/Hard Skills

USE auditoria_db;

-- Passo 1: Adicionar coluna temporária
ALTER TABLE habilidades ADD COLUMN tipo_temp VARCHAR(20);

-- Passo 2: Migrar dados para a coluna temporária
UPDATE habilidades 
SET tipo_temp = CASE 
  WHEN tipo = 'Tecnica' THEN 'Hard Skills'
  WHEN tipo = 'Comportamental' THEN 'Soft Skills'
  WHEN tipo = 'Gestao' THEN 'Soft Skills'
  ELSE 'Hard Skills'
END;

-- Passo 3: Remover coluna antiga
ALTER TABLE habilidades DROP COLUMN tipo;

-- Passo 4: Renomear e converter para ENUM
ALTER TABLE habilidades 
CHANGE COLUMN tipo_temp tipo ENUM('Soft Skills', 'Hard Skills') NOT NULL DEFAULT 'Hard Skills';

-- Passo 5: Verificar resultado
SELECT tipo, COUNT(*) as total 
FROM habilidades 
GROUP BY tipo;
