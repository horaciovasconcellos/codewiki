USE auditoria_db;

ALTER TABLE tecnologias ADD COLUMN documentacao_oficial VARCHAR(500);
ALTER TABLE tecnologias ADD COLUMN repositorio_interno VARCHAR(500);

CREATE TABLE IF NOT EXISTS tecnologia_responsaveis (
    id VARCHAR(36) PRIMARY KEY,
    tecnologia_id VARCHAR(36) NOT NULL,
    colaborador_id VARCHAR(36) NOT NULL,
    perfil VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
    INDEX idx_tecnologia (tecnologia_id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
