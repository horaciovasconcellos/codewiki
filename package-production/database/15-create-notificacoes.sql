-- Criação da tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id VARCHAR(36) PRIMARY KEY,
  data_recebimento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  de VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  conteudo TEXT,
  lido BOOLEAN DEFAULT FALSE,
  aplicacao_id VARCHAR(36),
  aplicacao_sigla VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_data_recebimento (data_recebimento),
  INDEX idx_lido (lido),
  INDEX idx_aplicacao_id (aplicacao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
