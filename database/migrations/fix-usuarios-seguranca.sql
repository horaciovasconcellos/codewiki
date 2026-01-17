-- Script para criar a tabela usuarios_seguranca se não existir
-- Execute este script antes de iniciar o servidor

USE codewiki;

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS usuarios_seguranca (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  data_vigencia_inicial DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_vigencia_termino DATETIME NULL,
  status ENUM('ATIVO', 'INATIVO', 'BLOQUEADO', 'AGUARDANDO_ATIVACAO') NOT NULL DEFAULT 'ATIVO',
  salt_usado VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  INDEX idx_login (login),
  INDEX idx_status (status),
  INDEX idx_vigencia (data_vigencia_inicial, data_vigencia_termino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a tabela foi criada
SELECT 'Tabela usuarios_seguranca criada com sucesso!' AS status;

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios_seguranca (
  login, 
  password_hash, 
  data_vigencia_inicial, 
  status, 
  salt_usado,
  created_by
) VALUES (
  'admin',
  '$2b$10$N9qo8uLOickgx2ZMRZoMye.IxrXwJdGXFKvVZVbKzGbXOXNJ0/V6i', -- senha: admin123
  NOW(),
  'ATIVO',
  'default_salt_12345678901234',
  'SYSTEM'
) ON DUPLICATE KEY UPDATE id=id;

SELECT 'Usuário admin criado!' AS status;
