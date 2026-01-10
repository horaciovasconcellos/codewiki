-- Tabela principal de registros LGPD
CREATE TABLE IF NOT EXISTS lgpd_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identificacao_dados VARCHAR(255) NOT NULL COMMENT 'Nome/Identificação do conjunto de dados',
  tipo_dados ENUM(
    'Dados Identificadores Diretos',
    'Dados Identificadores Indiretos',
    'Dados Sensíveis',
    'Dados Financeiros',
    'Dados de Localização'
  ) NOT NULL COMMENT 'Tipo de dados pessoais',
  tecnica_anonimizacao ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica padrão de anonimização',
  data_inicio DATE NOT NULL DEFAULT (CURDATE()) COMMENT 'Data de início do tratamento',
  data_termino DATE NULL COMMENT 'Data de término do tratamento',
  ativo BOOLEAN DEFAULT true COMMENT 'Registro ativo ou inativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_tipo_dados (tipo_dados),
  INDEX idx_data_inicio (data_inicio),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Registros de dados pessoais para conformidade com LGPD';

-- Tabela de campos e matriz de anonimização por departamento
CREATE TABLE IF NOT EXISTS lgpd_campos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lgpd_id INT NOT NULL COMMENT 'ID do registro LGPD pai',
  nome_campo VARCHAR(255) NOT NULL COMMENT 'Nome do campo da tabela',
  descricao TEXT NOT NULL COMMENT 'Descrição do campo',
  matriz_vendas ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de Vendas',
  matriz_marketing ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de Marketing',
  matriz_financeiro ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento Financeiro',
  matriz_rh ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de RH',
  matriz_logistica ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de Logística',
  matriz_assistencia_tecnica ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de Assistência Técnica',
  matriz_analytics ENUM(
    'Anonimização por Supressão',
    'Anonimização por Generalização',
    'Pseudonimização (Embaralhamento Reversível)',
    'Anonimização por Permutação'
  ) NOT NULL COMMENT 'Técnica para departamento de Analytics',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lgpd_id) REFERENCES lgpd_registros(id) ON DELETE CASCADE,
  INDEX idx_lgpd_id (lgpd_id),
  INDEX idx_nome_campo (nome_campo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Campos individuais e matriz de anonimização por departamento';

-- Inserir dados de exemplo
INSERT INTO lgpd_registros (
  identificacao_dados,
  tipo_dados,
  tecnica_anonimizacao,
  data_inicio,
  data_termino,
  ativo
) VALUES
(
  'Dados de Clientes - CRM',
  'Dados Identificadores Diretos',
  'Pseudonimização (Embaralhamento Reversível)',
  '2024-01-01',
  NULL,
  true
),
(
  'Histórico de Navegação',
  'Dados Identificadores Indiretos',
  'Anonimização por Generalização',
  '2024-01-15',
  '2024-12-31',
  true
),
(
  'Dados de Saúde - Plano',
  'Dados Sensíveis',
  'Anonimização por Supressão',
  '2024-02-01',
  NULL,
  true
);

-- Inserir campos de exemplo para o primeiro registro
INSERT INTO lgpd_campos (
  lgpd_id,
  nome_campo,
  descricao,
  matriz_vendas,
  matriz_marketing,
  matriz_financeiro,
  matriz_rh,
  matriz_logistica,
  matriz_assistencia_tecnica,
  matriz_analytics
) VALUES
(
  1,
  'cpf',
  'CPF do cliente',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão',
  'Anonimização por Supressão',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Generalização'
),
(
  1,
  'nome_completo',
  'Nome completo do cliente',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Generalização',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão',
  'Anonimização por Supressão',
  'Anonimização por Generalização',
  'Anonimização por Supressão'
),
(
  1,
  'email',
  'Endereço de e-mail do cliente',
  'Pseudonimização (Embaralhamento Reversível)',
  'Pseudonimização (Embaralhamento Reversível)',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão',
  'Anonimização por Supressão',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Generalização'
),
(
  1,
  'telefone',
  'Número de telefone do cliente',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Generalização',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão',
  'Anonimização por Generalização',
  'Pseudonimização (Embaralhamento Reversível)',
  'Anonimização por Supressão'
);
