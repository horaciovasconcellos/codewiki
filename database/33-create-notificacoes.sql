-- Criação da tabela de notificações por e-mail
-- Data: 2025-12-18

USE auditoria_db;

CREATE TABLE IF NOT EXISTS notificacoes (
  id VARCHAR(36) PRIMARY KEY,
  data TIMESTAMP NOT NULL,
  subject VARCHAR(500) NOT NULL,
  conteudo TEXT NOT NULL,
  de VARCHAR(255) NOT NULL,
  para VARCHAR(255) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_data (data),
  INDEX idx_lida (lida),
  INDEX idx_subject (subject(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
