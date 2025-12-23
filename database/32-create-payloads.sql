-- Migration: Criar tabela de payloads
-- Data: 2025-12-23
-- Descrição: Tabela para gerenciar payloads/especificações OpenAPI de APIs

USE auditoria_db;

CREATE TABLE IF NOT EXISTS payloads (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Identificação
    aplicacao_id VARCHAR(36) NOT NULL,
    sigla VARCHAR(20) UNIQUE NOT NULL,
    definicao VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Arquivo OpenAPI
    formato_arquivo ENUM('JSON', 'YAML') NOT NULL DEFAULT 'JSON',
    conteudo_arquivo LONGTEXT NOT NULL,
    versao_openapi VARCHAR(20) DEFAULT '3.0.0',
    
    -- Validação
    arquivo_valido BOOLEAN DEFAULT FALSE,
    ultima_validacao TIMESTAMP NULL,
    erros_validacao TEXT,
    
    -- Datas
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_termino TIMESTAMP NULL,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_sigla (sigla),
    INDEX idx_data_inicio (data_inicio),
    INDEX idx_data_termino (data_termino),
    INDEX idx_formato (formato_arquivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
