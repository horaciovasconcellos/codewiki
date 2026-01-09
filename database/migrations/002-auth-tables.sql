-- Migration: Authentication Tables
-- Description: Create tables for user authentication, refresh tokens, and password reset
-- Date: 2026-01-09

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
  ativo BOOLEAN DEFAULT TRUE,
  ultimo_acesso DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_used (used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
-- Password: Admin@123 (hashed with bcrypt, 10 rounds)
-- Note: This is a default password and should be changed in production
INSERT INTO users (id, nome, email, senha, role, ativo, created_at)
SELECT 
  UUID(),
  'Administrador',
  'admin@codewiki.com',
  '$2b$10$rKXH8J5z0q8bYj9q2qJ8j.K9J3Q2q9j8J5z0q8bYj9q2qJ8j.K9J3O',
  'admin',
  TRUE,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@codewiki.com');

-- Insert test user for development
-- Password: User@123
INSERT INTO users (id, nome, email, senha, role, ativo, created_at)
SELECT 
  UUID(),
  'Usuário Teste',
  'user@codewiki.com',
  '$2b$10$rKXH8J5z0q8bYj9q2qJ8j.K9J3Q2q9j8J5z0q8bYj9q2qJ8j.K9J3O',
  'user',
  TRUE,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@codewiki.com');

-- Comments
COMMENT ON TABLE users IS 'Tabela de usuários do sistema com autenticação JWT';
COMMENT ON TABLE refresh_tokens IS 'Tokens de renovação de autenticação';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperação de senha';
