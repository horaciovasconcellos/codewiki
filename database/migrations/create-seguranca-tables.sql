-- =====================================================
-- MÓDULO DE SEGURANÇA - TABELAS
-- =====================================================

-- Tabela de Usuários de Segurança
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

-- Tabela de Roles (Papéis/Perfis)
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  INDEX idx_nome (nome),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Resources (Recursos do Sistema)
CREATE TABLE IF NOT EXISTS resources (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  tipo ENUM('API', 'TELA', 'RELATORIO', 'FUNCIONALIDADE') NOT NULL DEFAULT 'FUNCIONALIDADE',
  path VARCHAR(255),
  status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  INDEX idx_nome (nome),
  INDEX idx_tipo (tipo),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Scopes (Escopos/Permissões)
CREATE TABLE IF NOT EXISTS scopes (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  acao ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'EXPORT', 'IMPORT') NOT NULL,
  status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  INDEX idx_nome (nome),
  INDEX idx_acao (acao),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela ACL (Access Control List)
CREATE TABLE IF NOT EXISTS acl (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role_id VARCHAR(36) NOT NULL,
  resource_id VARCHAR(36) NOT NULL,
  scope_id VARCHAR(36) NOT NULL,
  permitido BOOLEAN NOT NULL DEFAULT TRUE,
  condicoes JSON,
  status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (scope_id) REFERENCES scopes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_acl (role_id, resource_id, scope_id),
  INDEX idx_role (role_id),
  INDEX idx_resource (resource_id),
  INDEX idx_scope (scope_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação Usuário-Role (muitos para muitos)
CREATE TABLE IF NOT EXISTS usuario_roles (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_termino DATETIME NULL,
  status ENUM('ATIVO', 'INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios_seguranca(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_usuario_role (usuario_id, role_id),
  INDEX idx_usuario (usuario_id),
  INDEX idx_role (role_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Auditoria de Acesso
CREATE TABLE IF NOT EXISTS auditoria_acesso (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  usuario_id VARCHAR(36) NOT NULL,
  resource_id VARCHAR(36),
  acao VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  resultado ENUM('SUCESSO', 'FALHA', 'NEGADO') NOT NULL,
  detalhes JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios_seguranca(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL,
  INDEX idx_usuario (usuario_id),
  INDEX idx_resource (resource_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_resultado (resultado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
INSERT INTO roles (id, nome, descricao, status) VALUES
  (UUID(), 'ADMIN', 'Administrador do Sistema', 'ATIVO'),
  (UUID(), 'USER', 'Usuário Padrão', 'ATIVO'),
  (UUID(), 'AUDITOR', 'Auditor - Apenas Leitura', 'ATIVO')
ON DUPLICATE KEY UPDATE nome = nome;

INSERT INTO scopes (id, nome, descricao, acao, status) VALUES
  (UUID(), 'CREATE', 'Criar novos registros', 'CREATE', 'ATIVO'),
  (UUID(), 'READ', 'Visualizar registros', 'READ', 'ATIVO'),
  (UUID(), 'UPDATE', 'Atualizar registros existentes', 'UPDATE', 'ATIVO'),
  (UUID(), 'DELETE', 'Excluir registros', 'DELETE', 'ATIVO'),
  (UUID(), 'EXECUTE', 'Executar operações', 'EXECUTE', 'ATIVO'),
  (UUID(), 'EXPORT', 'Exportar dados', 'EXPORT', 'ATIVO'),
  (UUID(), 'IMPORT', 'Importar dados', 'IMPORT', 'ATIVO')
ON DUPLICATE KEY UPDATE nome = nome;
