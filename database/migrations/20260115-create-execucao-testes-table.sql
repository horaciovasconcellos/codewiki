-- Migration: Criar tabelas para Registro de Execução de Testes
-- Data: 2026-01-15
-- Descrição: Cria tabelas para gerenciar casos de teste e execuções de teste com rastreabilidade completa

USE auditoria_db;

-- Tabela de Casos de Teste
CREATE TABLE IF NOT EXISTS casos_teste (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    requisito_vinculado VARCHAR(255),
    tipo_teste ENUM('Funcional', 'Integracao', 'Regressao', 'Performance', 'Seguranca', 'Unitario', 'Aceitacao') NOT NULL DEFAULT 'Funcional',
    prioridade ENUM('Baixa', 'Media', 'Alta', 'Critica') NOT NULL DEFAULT 'Media',
    status ENUM('Ativo', 'Inativo', 'Obsoleto') NOT NULL DEFAULT 'Ativo',
    pre_condicoes TEXT,
    passos_execucao TEXT,
    resultado_esperado TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_tipo_teste (tipo_teste),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Execução de Testes
CREATE TABLE IF NOT EXISTS execucoes_teste (
    id VARCHAR(36) PRIMARY KEY,
    caso_teste_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36) NOT NULL,
    requisito_vinculado VARCHAR(255),
    ambiente ENUM('DEV', 'QA', 'HML', 'PRD') NOT NULL DEFAULT 'QA',
    executor_id VARCHAR(36) NOT NULL,
    data_hora_inicio DATETIME NOT NULL,
    data_hora_termino DATETIME,
    registro_atividades TEXT,
    resultado_execucao TEXT,
    status_execucao ENUM('Aguardando', 'Em Execucao', 'Passou', 'Falhou', 'Bloqueado', 'Cancelado') NOT NULL DEFAULT 'Aguardando',
    arquivo_resultado VARCHAR(500),
    arquivo_nome_original VARCHAR(255),
    arquivo_mime_type VARCHAR(100),
    arquivo_tamanho INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caso_teste_id) REFERENCES casos_teste(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (executor_id) REFERENCES colaboradores(id),
    INDEX idx_caso_teste (caso_teste_id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_executor (executor_id),
    INDEX idx_ambiente (ambiente),
    INDEX idx_status (status_execucao),
    INDEX idx_datas (data_hora_inicio, data_hora_termino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentários para documentação
ALTER TABLE casos_teste 
    COMMENT = 'Armazena os casos de teste das aplicações';

ALTER TABLE execucoes_teste 
    COMMENT = 'Registra as execuções dos testes com rastreabilidade completa';
