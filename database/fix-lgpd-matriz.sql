-- Fix LGPD matriz columns to use new short ENUM values
ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_vendas ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_marketing ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_financeiro ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_rh ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_logistica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_assistencia_tecnica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_analytics ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') DEFAULT 'Sem Anonimização';
