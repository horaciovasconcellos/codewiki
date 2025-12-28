-- =====================================================
-- PIPELINE DATABASE SCHEMA
-- Sistema de Gerenciamento de Pipelines CI/CD
-- =====================================================

-- Tabela principal de Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    status ENUM('Ativa', 'Em avaliação', 'Obsoleta', 'Descontinuada') DEFAULT 'Em avaliação',
    data_inicio DATE,
    data_termino DATE,
    -- Grupo trigger
    trigger_branches TEXT,
    trigger_paths TEXT,
    -- Grupo pr
    pr_branches TEXT,
    -- Variables
    variables TEXT,
    -- Grupo resources
    resources_repositories TEXT,
    resources_pipelines TEXT,
    resources_containers TEXT,
    -- Grupo schedules
    schedules TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pipeline_nome (nome),
    INDEX idx_pipeline_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Stages associados ao Pipeline (datatable)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    status ENUM('Ativa', 'Em avaliação', 'Obsoleta', 'Descontinuada') DEFAULT 'Ativa',
    data_inicio DATE NOT NULL,
    data_termino DATE,
    ordem INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_pipeline_stage_pipeline (pipeline_id),
    INDEX idx_pipeline_stage_stage (stage_id),
    UNIQUE KEY uk_pipeline_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
