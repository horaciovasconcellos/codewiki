-- Criação da tabela de habilidades dos colaboradores
USE auditoria_db;

-- Tabela de Habilidades dos Colaboradores
CREATE TABLE IF NOT EXISTS colaborador_habilidades (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    habilidade_id VARCHAR(36) NOT NULL,
    nivel_declarado ENUM('Basico', 'Intermediario', 'Avancado', 'Expert') NOT NULL,
    nivel_avaliado ENUM('Basico', 'Intermediario', 'Avancado', 'Expert') NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (habilidade_id) REFERENCES habilidades(id),
    UNIQUE KEY unique_colaborador_habilidade (colaborador_id, habilidade_id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_habilidade (habilidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
