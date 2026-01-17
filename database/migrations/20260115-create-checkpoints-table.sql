-- =====================================================
-- MIGRATION: Create Checkpoints Tables
-- Data: 15/01/2026
-- Descrição: Cria tabelas para checkpoints de aplicações
--            e seus detalhes associados
-- =====================================================

-- Tabela principal de checkpoints
CREATE TABLE IF NOT EXISTS checkpoints (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    categoria ENUM('Escopo', 'Prazo', 'Custo', 'Qualidade', 'Seguranca', 'Compliance') NOT NULL,
    status ENUM('OK', 'Em Risco', 'Bloqueado') NOT NULL DEFAULT 'Em Risco',
    data_prevista DATE NOT NULL,
    data_real DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_checkpoint_aplicacao (aplicacao_id),
    INDEX idx_checkpoint_status (status),
    INDEX idx_checkpoint_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de detalhes do checkpoint
CREATE TABLE IF NOT EXISTS checkpoint_detalhes (
    id VARCHAR(36) PRIMARY KEY,
    checkpoint_id VARCHAR(36) NOT NULL,
    responsavel_id VARCHAR(36) DEFAULT NULL,
    data_planejada DATE DEFAULT NULL,
    data_efetiva DATE DEFAULT NULL,
    descricao_detalhada TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    comentarios TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (checkpoint_id) REFERENCES checkpoints(id) ON DELETE CASCADE,
    FOREIGN KEY (responsavel_id) REFERENCES colaboradores(id) ON DELETE SET NULL,
    INDEX idx_detalhe_checkpoint (checkpoint_id),
    INDEX idx_detalhe_responsavel (responsavel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de execução
SELECT 'Migration create-checkpoints-table completed successfully!' AS status;
