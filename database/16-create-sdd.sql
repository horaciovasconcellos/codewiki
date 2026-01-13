-- Tabela de Projetos SDD
CREATE TABLE IF NOT EXISTS projetos_sdd (
  id VARCHAR(36) PRIMARY KEY,
  aplicacao_id VARCHAR(36),
  nome_projeto VARCHAR(255) NOT NULL,
  ia_selecionada VARCHAR(50) NOT NULL,
  constituicao TEXT,
  prd_content TEXT,
  gerador_projetos BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_aplicacao (aplicacao_id),
  INDEX idx_nome (nome_projeto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Requisitos
CREATE TABLE IF NOT EXISTS requisitos_sdd (
  id VARCHAR(36) PRIMARY KEY,
  projeto_id VARCHAR(36) NOT NULL,
  sequencia VARCHAR(20) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'BACKLOG',
  status_anterior VARCHAR(50),
  origem_prd BOOLEAN DEFAULT FALSE,
  secao_prd VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_sdd(id) ON DELETE CASCADE,
  INDEX idx_projeto (projeto_id),
  INDEX idx_sequencia (sequencia),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tarefas_sdd (
  id VARCHAR(36) PRIMARY KEY,
  requisito_id VARCHAR(36) NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'TO DO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requisito_id) REFERENCES requisitos_sdd(id) ON DELETE CASCADE,
  INDEX idx_requisito (requisito_id),
  INDEX idx_status (status),
  INDEX idx_data_inicio (data_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Decisões Arquiteturais (relacionamento com ADRs)
CREATE TABLE IF NOT EXISTS decisoes_arquiteturais_sdd (
  id VARCHAR(36) PRIMARY KEY,
  projeto_id VARCHAR(36) NOT NULL,
  adr_id VARCHAR(36) NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Proposta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos_sdd(id) ON DELETE CASCADE,
  INDEX idx_projeto (projeto_id),
  INDEX idx_adr (adr_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
