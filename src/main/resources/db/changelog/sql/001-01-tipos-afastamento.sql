CREATE TABLE IF NOT EXISTS tipos_afastamento (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(10) UNIQUE NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    argumentacao_legal VARCHAR(60) NOT NULL,
    numero_dias INT NOT NULL CHECK (numero_dias BETWEEN 1 AND 99),
    tipo_tempo CHAR(1) NOT NULL CHECK (tipo_tempo IN ('C', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
