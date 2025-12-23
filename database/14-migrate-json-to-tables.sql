-- Migração dos dados JSON para tabelas de relacionamento
USE auditoria_db;

-- Migrar tecnologias do JSON para aplicacao_tecnologias
INSERT INTO aplicacao_tecnologias (id, aplicacao_id, tecnologia_id, data_inicio, data_termino, status)
SELECT 
    UUID(),
    a.id,
    JSON_UNQUOTE(JSON_EXTRACT(tec.value, '$.tecnologiaId')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(tec.value, '$.dataInicio')), CURDATE()),
    JSON_UNQUOTE(JSON_EXTRACT(tec.value, '$.dataTermino')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(tec.value, '$.status')), 'Ativo')
FROM aplicacoes a
CROSS JOIN JSON_TABLE(
    a.tecnologias,
    '$[*]' COLUMNS(
        value JSON PATH '$'
    )
) AS tec
WHERE a.tecnologias IS NOT NULL
  AND JSON_LENGTH(a.tecnologias) > 0;

-- Migrar ambientes do JSON para aplicacao_ambientes
INSERT INTO aplicacao_ambientes (id, aplicacao_id, tipo_ambiente, url_ambiente, data_criacao, tempo_liberacao, status)
SELECT 
    UUID(),
    a.id,
    JSON_UNQUOTE(JSON_EXTRACT(amb.value, '$.tipoAmbiente')),
    JSON_UNQUOTE(JSON_EXTRACT(amb.value, '$.urlAmbiente')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(amb.value, '$.dataCriacao')), CURDATE()),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(amb.value, '$.tempoLiberacao')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(amb.value, '$.status')), 'Ativo')
FROM aplicacoes a
CROSS JOIN JSON_TABLE(
    a.ambientes,
    '$[*]' COLUMNS(
        value JSON PATH '$'
    )
) AS amb
WHERE a.ambientes IS NOT NULL
  AND JSON_LENGTH(a.ambientes) > 0;

-- Migrar capacidades do JSON para aplicacao_capacidades
INSERT INTO aplicacao_capacidades (id, aplicacao_id, capacidade_id, grau_cobertura, data_inicio, data_termino, status)
SELECT 
    UUID(),
    a.id,
    JSON_UNQUOTE(JSON_EXTRACT(cap.value, '$.capacidadeId')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(cap.value, '$.grauCobertura')), 0),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(cap.value, '$.dataInicio')), CURDATE()),
    JSON_UNQUOTE(JSON_EXTRACT(cap.value, '$.dataTermino')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(cap.value, '$.status')), 'Ativo')
FROM aplicacoes a
CROSS JOIN JSON_TABLE(
    a.capacidades,
    '$[*]' COLUMNS(
        value JSON PATH '$'
    )
) AS cap
WHERE a.capacidades IS NOT NULL
  AND JSON_LENGTH(a.capacidades) > 0;

-- Migrar processos do JSON para aplicacao_processos
-- Precisa fazer JOIN com identificacao, adicionando prefixo AA se necessário
INSERT INTO aplicacao_processos (id, aplicacao_id, processo_id, tipo_suporte, criticidade, data_inicio, data_termino, status)
SELECT 
    UUID(),
    a.id,
    p.id,
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.tipoSuporte')), 'Operacional'),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.criticidade')), 'Média'),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.dataInicio')), CURDATE()),
    JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.dataTermino')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.status')), 'Ativo')
FROM aplicacoes a
CROSS JOIN JSON_TABLE(
    a.processos,
    '$[*]' COLUMNS(
        value JSON PATH '$'
    )
) AS proc
LEFT JOIN processos_negocio p ON (
    UPPER(p.identificacao) = UPPER(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.processoId')))
    OR UPPER(p.identificacao) = CONCAT('AA', UPPER(JSON_UNQUOTE(JSON_EXTRACT(proc.value, '$.processoId'))))
)
WHERE a.processos IS NOT NULL
  AND JSON_LENGTH(a.processos) > 0
  AND p.id IS NOT NULL;

-- Migrar integracoes do JSON para aplicacao_integracoes
INSERT INTO aplicacao_integracoes (id, aplicacao_id, aplicacao_destino_id, tipo_integracao, protocolo, frequencia, descricao, status)
SELECT 
    UUID(),
    a.id,
    JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.aplicacaoDestinoId')),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.tipoIntegracao')), 'API'),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.protocolo')), 'REST'),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.frequencia')), 'On-demand'),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.descricao')), ''),
    COALESCE(JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.status')), 'Ativo')
FROM aplicacoes a
CROSS JOIN JSON_TABLE(
    a.integracoes,
    '$[*]' COLUMNS(
        value JSON PATH '$'
    )
) AS integ
WHERE a.integracoes IS NOT NULL
  AND JSON_LENGTH(a.integracoes) > 0
  AND JSON_UNQUOTE(JSON_EXTRACT(integ.value, '$.aplicacaoDestinoId')) IS NOT NULL;

-- Verificar os dados migrados
SELECT 'Tecnologias migradas:' as info, COUNT(*) as total FROM aplicacao_tecnologias;
SELECT 'Ambientes migrados:' as info, COUNT(*) as total FROM aplicacao_ambientes;
SELECT 'Capacidades migradas:' as info, COUNT(*) as total FROM aplicacao_capacidades;
SELECT 'Processos migrados:' as info, COUNT(*) as total FROM aplicacao_processos;
SELECT 'Integracoes migradas:' as info, COUNT(*) as total FROM aplicacao_integracoes;
