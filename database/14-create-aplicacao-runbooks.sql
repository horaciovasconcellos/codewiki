-- Criação de tabela de relacionamento aplicacao_runbooks
USE auditoria_db;

-- Tabela de relacionamento aplicacao_runbooks
CREATE TABLE IF NOT EXISTS aplicacao_runbooks (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    runbook_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(500),
    data_associacao DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (runbook_id) REFERENCES runbooks(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_runbook (runbook_id),
    INDEX idx_status (status),
    UNIQUE KEY unique_aplicacao_runbook (aplicacao_id, runbook_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
