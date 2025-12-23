-- Tabela para armazenar Work Items do Azure DevOps
CREATE TABLE IF NOT EXISTS azure_work_items (
    id VARCHAR(36) PRIMARY KEY,
    projeto_id VARCHAR(36) NOT NULL,
    projeto_nome VARCHAR(100) NOT NULL,
    time_nome VARCHAR(100) NOT NULL,
    
    -- Dados do Work Item
    work_item_id INT NOT NULL,
    work_item_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    state VARCHAR(50) NOT NULL,
    assigned_to VARCHAR(200),
    activity VARCHAR(100),
    area_path VARCHAR(500),
    iteration_path VARCHAR(500),
    
    -- Datas
    created_date TIMESTAMP NOT NULL,
    changed_date TIMESTAMP NOT NULL,
    closed_date TIMESTAMP NULL,
    
    -- Informações adicionais
    priority INT,
    effort DECIMAL(10,2),
    remaining_work DECIMAL(10,2),
    completed_work DECIMAL(10,2),
    story_points DECIMAL(10,2),
    
    -- URLs e referências
    url VARCHAR(500),
    
    -- Metadados
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (projeto_id) REFERENCES estruturas_projeto(id) ON DELETE CASCADE,
    
    INDEX idx_projeto (projeto_id),
    INDEX idx_projeto_nome (projeto_nome),
    INDEX idx_state (state),
    INDEX idx_work_item_type (work_item_type),
    INDEX idx_created_date (created_date),
    INDEX idx_changed_date (changed_date),
    INDEX idx_sync_date (sync_date),
    
    UNIQUE KEY unique_work_item (projeto_id, work_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para histórico de alterações dos Work Items (auditoria)
CREATE TABLE IF NOT EXISTS azure_work_items_historico (
    id VARCHAR(36) PRIMARY KEY,
    work_item_table_id VARCHAR(36) NOT NULL,
    work_item_id INT NOT NULL,
    projeto_nome VARCHAR(100) NOT NULL,
    
    -- Dados da alteração
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    
    -- Quem alterou
    alterado_por VARCHAR(200),
    data_alteracao TIMESTAMP NOT NULL,
    
    -- Metadados
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (work_item_table_id) REFERENCES azure_work_items(id) ON DELETE CASCADE,
    
    INDEX idx_work_item (work_item_table_id),
    INDEX idx_work_item_id (work_item_id),
    INDEX idx_projeto (projeto_nome),
    INDEX idx_campo (campo_alterado),
    INDEX idx_data_alteracao (data_alteracao),
    INDEX idx_sync_date (sync_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para controle de sincronização
CREATE TABLE IF NOT EXISTS azure_sync_log (
    id VARCHAR(36) PRIMARY KEY,
    projeto_id VARCHAR(36) NOT NULL,
    projeto_nome VARCHAR(100) NOT NULL,
    
    -- Informações da sincronização
    inicio_sync TIMESTAMP NOT NULL,
    fim_sync TIMESTAMP NULL,
    status ENUM('em_progresso', 'sucesso', 'erro') NOT NULL,
    
    -- Estatísticas
    total_work_items INT DEFAULT 0,
    novos_work_items INT DEFAULT 0,
    atualizados_work_items INT DEFAULT 0,
    erro_mensagem TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (projeto_id) REFERENCES estruturas_projeto(id) ON DELETE CASCADE,
    
    INDEX idx_projeto (projeto_id),
    INDEX idx_status (status),
    INDEX idx_inicio_sync (inicio_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
