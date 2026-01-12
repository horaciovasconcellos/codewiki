-- Tabela de Tokens de Acesso
CREATE TABLE IF NOT EXISTS tokens_acesso (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    entidade_tipo ENUM('Usuario', 'Servico', 'Aplicacao') NOT NULL,
    entidade_nome VARCHAR(255) NOT NULL,
    data_inicio_validade DATE NOT NULL,
    data_expiracao DATE NOT NULL,
    escopos JSON NOT NULL,
    token VARCHAR(500) NOT NULL,
    permitir_regeneracao BOOLEAN DEFAULT FALSE,
    requer_mfa BOOLEAN DEFAULT FALSE,
    status ENUM('Ativo', 'Revogado', 'Expirado') DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_entidade_tipo (entidade_tipo),
    INDEX idx_status (status),
    INDEX idx_data_expiracao (data_expiracao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
