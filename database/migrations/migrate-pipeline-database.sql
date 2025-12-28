-- =====================================================
-- MIGRATION: Pipeline Database - Nova Estrutura
-- Data: 27/12/2025
-- Descrição: Reestruturação da tabela pipelines com
--            Bloco de Definições e criação de tabelas
--            associativas para grupos de stages
-- =====================================================

-- Fazer backup da tabela existente
CREATE TABLE IF NOT EXISTS pipelines_backup_20251227 AS SELECT * FROM pipelines;

-- Remover a tabela antiga
DROP TABLE IF EXISTS pipelines;

-- Criar nova tabela de Pipelines com Bloco de Definições
CREATE TABLE IF NOT EXISTS pipelines (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    extends TEXT,
    jobs TEXT,
    parameters TEXT,
    pool TEXT,
    pr TEXT,
    resources TEXT,
    schedules TEXT,
    stages TEXT,
    steps TEXT,
    target TEXT,
    `trigger` TEXT,
    variables TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pipeline_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabelas associativas para grupos de stages

-- Tabela: Pipeline → Policy & Governance Stage
CREATE TABLE IF NOT EXISTS pipeline_policy_governance_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_policy_gov_pipeline (pipeline_id),
    UNIQUE KEY uk_policy_gov_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Pipeline → Build Stage
CREATE TABLE IF NOT EXISTS pipeline_build_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_build_pipeline (pipeline_id),
    UNIQUE KEY uk_build_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Pipeline → Security Stage
CREATE TABLE IF NOT EXISTS pipeline_security_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_security_pipeline (pipeline_id),
    UNIQUE KEY uk_security_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Pipeline → Test Stage
CREATE TABLE IF NOT EXISTS pipeline_test_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_test_pipeline (pipeline_id),
    UNIQUE KEY uk_test_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Pipeline → Deploy Stage
CREATE TABLE IF NOT EXISTS pipeline_deploy_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_deploy_pipeline (pipeline_id),
    UNIQUE KEY uk_deploy_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Pipeline → Monitor Stage
CREATE TABLE IF NOT EXISTS pipeline_monitor_stages (
    id VARCHAR(36) PRIMARY KEY,
    pipeline_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(36) NOT NULL,
    ordem_execucao INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
    INDEX idx_monitor_pipeline (pipeline_id),
    UNIQUE KEY uk_monitor_stage (pipeline_id, stage_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados de exemplo
INSERT INTO pipelines (id, nome, extends, jobs, parameters, stages, `trigger`, variables) VALUES
(UUID(), 'CI/CD Backend Pipeline', 
'template: azure-pipelines-template.yml', 
'- build\n- test\n- deploy', 
'NODE_ENV: production',
'- Build\n- Test\n- Security Scan\n- Deploy',
'branches:\n  include:\n    - main\n    - develop',
'APP_NAME: backend-api\nREGION: us-east-1');

INSERT INTO pipelines (id, nome, stages, `trigger`) VALUES
(UUID(), 'Frontend Deploy Pipeline', 
'- Build\n- Test\n- Deploy to CDN',
'push:\n  branches:\n    - main');

-- Log de execução
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS total_pipelines FROM pipelines;
SELECT 'Backup table: pipelines_backup_20251227' AS backup_info;
