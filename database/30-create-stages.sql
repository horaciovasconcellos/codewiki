-- =====================================================
-- STAGES SCHEMA
-- Sistema de Gerenciamento de Estágios de Pipeline
-- =====================================================

-- Catálogo de Stages (Estágios Reutilizáveis)
CREATE TABLE IF NOT EXISTS stages (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo ENUM('Build', 'Test', 'Security', 'Deploy', 'Quality', 'Notification', 'Custom') NOT NULL,
    reutilizavel BOOLEAN DEFAULT TRUE,
    timeout_seconds INT DEFAULT 3600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stage_nome (nome),
    INDEX idx_stage_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir alguns stages de exemplo
INSERT INTO stages (id, nome, descricao, tipo, reutilizavel, timeout_seconds) VALUES
(UUID(), 'Build Application', 'Compilação e build da aplicação', 'Build', TRUE, 1800),
(UUID(), 'Unit Tests', 'Execução de testes unitários', 'Test', TRUE, 900),
(UUID(), 'Security Scan', 'Análise de segurança SAST/DAST', 'Security', TRUE, 1200),
(UUID(), 'Code Quality', 'Análise de qualidade de código', 'Quality', TRUE, 600),
(UUID(), 'Deploy to Dev', 'Deploy para ambiente de desenvolvimento', 'Deploy', TRUE, 300),
(UUID(), 'Deploy to Staging', 'Deploy para ambiente de staging', 'Deploy', TRUE, 600),
(UUID(), 'Deploy to Production', 'Deploy para ambiente de produção', 'Deploy', FALSE, 900),
(UUID(), 'Integration Tests', 'Testes de integração', 'Test', TRUE, 1500),
(UUID(), 'Send Notification', 'Envio de notificações', 'Notification', TRUE, 60)
ON DUPLICATE KEY UPDATE nome=VALUES(nome);
