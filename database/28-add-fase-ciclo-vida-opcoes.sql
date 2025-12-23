-- Migration: Adicionar novas opções ao campo fase_ciclo_vida
-- Data: 2025-12-17
-- Descrição: Adicionar "Ideação" e "Aposentado" às opções de Fase do Ciclo de Vida

-- NOTA: O campo fase_ciclo_vida já é VARCHAR(20), então não há alteração
-- necessária no banco de dados. Esta migração documenta as novas opções
-- disponíveis na aplicação.

-- Novas opções disponíveis:
-- 1. Ideação (nova)
-- 2. Planejamento (existente)
-- 3. Desenvolvimento (existente)
-- 4. Produção (existente)
-- 5. Aposentado (nova)

USE auditoria_db;

-- Verificar aplicações existentes e suas fases
SELECT 
    fase_ciclo_vida,
    COUNT(*) as quantidade
FROM aplicacoes
GROUP BY fase_ciclo_vida
ORDER BY fase_ciclo_vida;

-- Não há necessidade de UPDATE pois:
-- 1. O campo já é VARCHAR(20) sem constraints ENUM
-- 2. As aplicações existentes mantêm seus valores atuais
-- 3. Os novos valores estão disponíveis apenas para novas aplicações ou edições
