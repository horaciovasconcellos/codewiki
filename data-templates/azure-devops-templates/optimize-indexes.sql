-- Script de Otimização de Índices MySQL
-- Autor: Sistema de Auditoria
-- Data: 2024-01-10
-- Descrição: Otimiza índices e analisa tabelas para melhorar performance

-- Otimizar tabela de logs_auditoria
OPTIMIZE TABLE logs_auditoria;
ANALYZE TABLE logs_auditoria;

-- Otimizar tabela de colaboradores
OPTIMIZE TABLE colaboradores;
ANALYZE TABLE colaboradores;

-- Otimizar tabela de tecnologias
OPTIMIZE TABLE tecnologias;
ANALYZE TABLE tecnologias;

-- Otimizar tabela de aplicacoes
OPTIMIZE TABLE aplicacoes;
ANALYZE TABLE aplicacoes;

-- Otimizar tabela de habilidades
OPTIMIZE TABLE habilidades;
ANALYZE TABLE habilidades;

-- Otimizar tabela de scripts
OPTIMIZE TABLE scripts;
ANALYZE TABLE scripts;

-- Verificar status dos índices
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM 
    information_schema.STATISTICS
WHERE 
    TABLE_SCHEMA = 'auditoria_db'
    AND TABLE_NAME IN ('logs_auditoria', 'colaboradores', 'tecnologias', 'aplicacoes', 'habilidades', 'scripts')
ORDER BY 
    TABLE_NAME, INDEX_NAME;

-- Exibir estatísticas de uso das tabelas
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'Size (MB)',
    ROUND((DATA_LENGTH / 1024 / 1024), 2) AS 'Data Size (MB)',
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS 'Index Size (MB)'
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'auditoria_db'
ORDER BY 
    (DATA_LENGTH + INDEX_LENGTH) DESC;

COMMIT;
