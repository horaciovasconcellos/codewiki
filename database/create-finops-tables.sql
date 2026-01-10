-- FinOps-Focus: Tabelas para gerenciamento de custos cloud
-- Suporta AWS, Azure, GCP e OCI

-- Tabela de Provedores Cloud
CREATE TABLE IF NOT EXISTS finops_providers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- AWS, Azure, GCP, OCI
    display_name VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500),
    last_sync_date DATETIME,
    active BOOLEAN DEFAULT TRUE,
    metadata JSON, -- Configurações específicas do provedor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_provider_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Recursos Cloud
CREATE TABLE IF NOT EXISTS finops_resources (
    id VARCHAR(36) PRIMARY KEY,
    provider_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36), -- Associação com aplicação interna
    resource_id VARCHAR(255) NOT NULL, -- ID do recurso no provedor (ex: i-0abcd1234)
    resource_type VARCHAR(100) NOT NULL, -- EC2, Virtual Machine, Compute Engine, etc
    resource_name VARCHAR(255),
    region VARCHAR(100),
    tags JSON, -- Tags do recurso para categorização
    metadata JSON, -- Dados adicionais do recurso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES finops_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE SET NULL,
    UNIQUE KEY idx_provider_resource (provider_id, resource_id),
    KEY idx_aplicacao (aplicacao_id),
    KEY idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Custos Diários (Focus-based)
CREATE TABLE IF NOT EXISTS finops_costs_daily (
    id VARCHAR(36) PRIMARY KEY,
    resource_id VARCHAR(36) NOT NULL,
    provider_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36), -- Desnormalizado para queries rápidas
    cost_date DATE NOT NULL, -- Data do custo
    
    -- Métricas de Uso
    cpu_hours DECIMAL(15, 2) DEFAULT 0,
    storage_gb DECIMAL(15, 2) DEFAULT 0,
    network_gb DECIMAL(15, 2) DEFAULT 0,
    memory_gb_hours DECIMAL(15, 2) DEFAULT 0,
    requests_count BIGINT DEFAULT 0,
    
    -- Métricas de Custo (FOCUS-based)
    cpu_cost DECIMAL(15, 2) DEFAULT 0,
    storage_cost DECIMAL(15, 2) DEFAULT 0,
    network_cost DECIMAL(15, 2) DEFAULT 0,
    memory_cost DECIMAL(15, 2) DEFAULT 0,
    other_cost DECIMAL(15, 2) DEFAULT 0,
    total_cost DECIMAL(15, 2) NOT NULL,
    
    -- Classificação FinOps
    service_category VARCHAR(100), -- Compute, Storage, Network, Database, etc
    is_tagged BOOLEAN DEFAULT FALSE, -- Se o recurso tem tags adequadas
    is_allocated BOOLEAN DEFAULT FALSE, -- Se está alocado a uma aplicação
    unit_cost DECIMAL(15, 6), -- Custo unitário (ex: custo por request)
    
    currency VARCHAR(3) DEFAULT 'USD',
    billing_account VARCHAR(255),
    metadata JSON, -- Dados adicionais específicos
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (resource_id) REFERENCES finops_resources(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES finops_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE SET NULL,
    
    UNIQUE KEY idx_resource_date (resource_id, cost_date),
    KEY idx_cost_date (cost_date),
    KEY idx_provider_date (provider_id, cost_date),
    KEY idx_aplicacao_date (aplicacao_id, cost_date),
    KEY idx_total_cost (total_cost),
    KEY idx_is_allocated (is_allocated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tags para análise
CREATE TABLE IF NOT EXISTS finops_tags (
    id VARCHAR(36) PRIMARY KEY,
    resource_id VARCHAR(36) NOT NULL,
    tag_key VARCHAR(255) NOT NULL,
    tag_value VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES finops_resources(id) ON DELETE CASCADE,
    KEY idx_tag_key (tag_key),
    KEY idx_tag_value (tag_value(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir provedores padrão
INSERT INTO finops_providers (id, name, display_name, active) VALUES
    (UUID(), 'AWS', 'Amazon Web Services', TRUE),
    (UUID(), 'Azure', 'Microsoft Azure', TRUE),
    (UUID(), 'GCP', 'Google Cloud Platform', TRUE),
    (UUID(), 'OCI', 'Oracle Cloud Infrastructure', TRUE)
ON DUPLICATE KEY UPDATE 
    display_name = VALUES(display_name),
    active = VALUES(active);

-- View para Dashboard (agregações pré-calculadas)
CREATE OR REPLACE VIEW vw_finops_daily_summary AS
SELECT 
    cost_date,
    provider_id,
    aplicacao_id,
    service_category,
    SUM(total_cost) as daily_cost,
    SUM(cpu_cost) as daily_cpu_cost,
    SUM(storage_cost) as daily_storage_cost,
    SUM(network_cost) as daily_network_cost,
    COUNT(DISTINCT resource_id) as resource_count,
    SUM(CASE WHEN is_allocated THEN total_cost ELSE 0 END) as allocated_cost,
    SUM(CASE WHEN NOT is_allocated THEN total_cost ELSE 0 END) as unallocated_cost,
    SUM(CASE WHEN is_tagged THEN total_cost ELSE 0 END) as tagged_cost,
    SUM(CASE WHEN NOT is_tagged THEN total_cost ELSE 0 END) as untagged_cost
FROM finops_costs_daily
GROUP BY cost_date, provider_id, aplicacao_id, service_category;

-- Índices adicionais para performance
CREATE INDEX idx_daily_summary ON finops_costs_daily(cost_date, provider_id, aplicacao_id);
CREATE INDEX idx_service_category ON finops_costs_daily(service_category, cost_date);
