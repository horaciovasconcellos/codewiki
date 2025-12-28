-- Migration: Corrigir encoding UTF-8 na tabela habilidades
-- Data: 2025-12-23
-- Descrição: Corrigir caracteres com encoding errado

USE auditoria_db;

-- Corrigir valores com encoding errado
UPDATE habilidades 
SET dominio = 'Comunicação & Relacionamento'
WHERE dominio LIKE '%Comunica%Relacionamento%';

UPDATE habilidades 
SET dominio = 'Gestão & Organização'
WHERE dominio LIKE '%Gest%Organiza%';

-- Verificar resultado
SELECT dominio, COUNT(*) as total 
FROM habilidades 
GROUP BY dominio 
ORDER BY dominio;
