-- Script para normalizar valores de tipo_ambiente no banco de dados
-- Converte valores antigos (Dev, Prod, Cloud, On-Premise) para novos (DEV, PROD, LAB, POC, SANDBOX)

USE auditoria_db;

-- Verificar registros antes da normalização
SELECT 'Registros ANTES da normalização:' as info;
SELECT 
    tipo_ambiente,
    COUNT(*) as total
FROM aplicacao_ambientes
GROUP BY tipo_ambiente
ORDER BY tipo_ambiente;

-- Normalizar Dev -> DEV
UPDATE aplicacao_ambientes 
SET tipo_ambiente = 'DEV'
WHERE tipo_ambiente = 'Dev';

-- Normalizar Prod -> PROD
UPDATE aplicacao_ambientes 
SET tipo_ambiente = 'PROD'
WHERE tipo_ambiente = 'Prod';

-- Normalizar Cloud -> DEV (assumindo que Cloud é ambiente de desenvolvimento)
UPDATE aplicacao_ambientes 
SET tipo_ambiente = 'DEV'
WHERE tipo_ambiente = 'Cloud';

-- Normalizar On-Premise -> PROD (assumindo que On-Premise é produção)
UPDATE aplicacao_ambientes 
SET tipo_ambiente = 'PROD'
WHERE tipo_ambiente = 'On-Premise';

-- Verificar registros após a normalização
SELECT 'Registros APÓS a normalização:' as info;
SELECT 
    tipo_ambiente,
    COUNT(*) as total
FROM aplicacao_ambientes
GROUP BY tipo_ambiente
ORDER BY tipo_ambiente;

-- Exibir amostra dos dados normalizados
SELECT 'Amostra dos ambientes normalizados:' as info;
SELECT 
    id,
    aplicacao_id,
    identificador_aplicacao,
    tipo_ambiente,
    localizacao_regiao,
    url_ambiente,
    status
FROM aplicacao_ambientes
ORDER BY updated_at DESC
LIMIT 15;

SELECT '✓ Normalização de tipo_ambiente concluída!' as status;
