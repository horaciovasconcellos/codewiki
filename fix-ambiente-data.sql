-- Script para corrigir rapidamente dados de ambientes sem os novos campos
-- Execute este script caso as colunas já existam mas os dados não estejam preenchidos

USE auditoria_db;

-- Verificar registros sem os novos campos preenchidos
SELECT 'Registros antes da correção:' as info;
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN identificador_aplicacao IS NULL OR identificador_aplicacao = '' THEN 1 ELSE 0 END) as sem_identificador,
    SUM(CASE WHEN localizacao_regiao IS NULL OR localizacao_regiao = '' THEN 1 ELSE 0 END) as sem_localizacao
FROM aplicacao_ambientes;

-- Atualizar identificador_aplicacao para registros sem valor
UPDATE aplicacao_ambientes 
SET identificador_aplicacao = 'api'
WHERE identificador_aplicacao IS NULL OR identificador_aplicacao = '';

-- Atualizar localizacao_regiao para registros sem valor
UPDATE aplicacao_ambientes 
SET localizacao_regiao = 'not-specified'
WHERE localizacao_regiao IS NULL OR localizacao_regiao = '';

-- Verificar registros após a correção
SELECT 'Registros após a correção:' as info;
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN identificador_aplicacao IS NULL OR identificador_aplicacao = '' THEN 1 ELSE 0 END) as sem_identificador,
    SUM(CASE WHEN localizacao_regiao IS NULL OR localizacao_regiao = '' THEN 1 ELSE 0 END) as sem_localizacao
FROM aplicacao_ambientes;

-- Exibir amostra dos dados corrigidos
SELECT 'Amostra dos dados corrigidos (últimos 10):' as info;
SELECT 
    id,
    aplicacao_id,
    identificador_aplicacao,
    tipo_ambiente,
    localizacao_regiao,
    url_ambiente,
    status
FROM aplicacao_ambientes
ORDER BY created_at DESC
LIMIT 10;

SELECT '✓ Correção concluída com sucesso!' as status;
