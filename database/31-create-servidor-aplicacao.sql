-- Migration: Criar tabela de relacionamento servidor-aplicação
-- Data: 2025-12-19
-- Descrição: Tabela para gerenciar o relacionamento entre servidores e aplicações

USE auditoria_db;

CREATE TABLE IF NOT EXISTS servidor_aplicacao (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Relacionamentos
    servidor_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36) NOT NULL,
    
    -- Período
    data_inicio DATE NOT NULL,
    data_termino DATE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'Planejado',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (servidor_id) REFERENCES servidores(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_servidor_id (servidor_id),
    INDEX idx_aplicacao_id (aplicacao_id),
    INDEX idx_status (status),
    INDEX idx_data_inicio (data_inicio),
    
    -- Constraint para evitar duplicatas
    UNIQUE KEY uk_servidor_aplicacao (servidor_id, aplicacao_id, data_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
