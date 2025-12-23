-- Criação da tabela de avaliações de colaboradores
USE auditoria_db;

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS avaliacoes_colaborador (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    data_avaliacao DATE NOT NULL,
    resultados_entregas DECIMAL(3,1) NOT NULL,
    competencias_tecnicas DECIMAL(3,1) NOT NULL,
    qualidade_seguranca DECIMAL(3,1) NOT NULL,
    comportamento_cultura DECIMAL(3,1) NOT NULL,
    evolucao_aprendizado DECIMAL(3,1) NOT NULL,
    motivo TEXT,
    data_conversa DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_data_avaliacao (data_avaliacao),
    CONSTRAINT chk_resultados_entregas CHECK (resultados_entregas >= 0 AND resultados_entregas <= 10),
    CONSTRAINT chk_competencias_tecnicas CHECK (competencias_tecnicas >= 0 AND competencias_tecnicas <= 10),
    CONSTRAINT chk_qualidade_seguranca CHECK (qualidade_seguranca >= 0 AND qualidade_seguranca <= 10),
    CONSTRAINT chk_comportamento_cultura CHECK (comportamento_cultura >= 0 AND comportamento_cultura <= 10),
    CONSTRAINT chk_evolucao_aprendizado CHECK (evolucao_aprendizado >= 0 AND evolucao_aprendizado <= 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
