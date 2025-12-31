-- Criar tabela para projetos InnerSource
CREATE TABLE IF NOT EXISTS innersource_projects (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  full_nome VARCHAR(500) NOT NULL,
  html_url TEXT NOT NULL,
  descricao TEXT,
  stargazers_count INT DEFAULT 0,
  watchers_count INT DEFAULT 0,
  language VARCHAR(100),
  forks_count INT DEFAULT 0,
  open_issues_count INT DEFAULT 0,
  license VARCHAR(100),
  owner JSON NOT NULL COMMENT 'Informações do proprietário (login, avatar_url, html_url, type)',
  metadata JSON NOT NULL COMMENT 'Metadados InnerSource (logo, topics, participation, description_extended, documentation, contribution_guidelines, maturity, contact, last_sync)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nome (nome),
  INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar comentários na tabela
ALTER TABLE innersource_projects COMMENT = 'Projetos InnerSource da organização com metadados estendidos';
