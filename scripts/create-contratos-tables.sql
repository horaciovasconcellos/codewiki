CREATE TABLE IF NOT EXISTS tecnologia_contratos (
    id VARCHAR(36) PRIMARY KEY,
    tecnologia_id VARCHAR(36) NOT NULL,
    numero_contrato VARCHAR(100) NOT NULL,
    vigencia_inicial DATE NOT NULL,
    vigencia_termino DATE NOT NULL,
    valor_contrato DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE,
    INDEX idx_tecnologia (tecnologia_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tecnologia_contratos_ams (
    id VARCHAR(36) PRIMARY KEY,
    tecnologia_id VARCHAR(36) NOT NULL,
    contrato VARCHAR(100) NOT NULL,
    cnpj_contratado VARCHAR(18) NOT NULL,
    custo_anual DECIMAL(15,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE,
    INDEX idx_tecnologia (tecnologia_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tecnologia_custos_saas (
    id VARCHAR(36) PRIMARY KEY,
    tecnologia_id VARCHAR(36) NOT NULL,
    custo_total_saas DECIMAL(15,2) NOT NULL,
    custo_por_licenca DECIMAL(15,2) NOT NULL,
    numero_licencas_contratadas INT NOT NULL,
    licencas_utilizadas INT NOT NULL,
    crescimento_custo_mensal_mom DECIMAL(5,2) NOT NULL,
    sla_cumprido DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE,
    INDEX idx_tecnologia (tecnologia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tecnologia_manutencoes_saas (
    id VARCHAR(36) PRIMARY KEY,
    tecnologia_id VARCHAR(36) NOT NULL,
    data_hora_inicio DATETIME NOT NULL,
    data_hora_termino DATETIME NOT NULL,
    tempo_indisponibilidade_horas DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id) ON DELETE CASCADE,
    INDEX idx_tecnologia (tecnologia_id),
    INDEX idx_data_inicio (data_hora_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
