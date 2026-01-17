-- Criação de tabelas de relacionamento para aplicações
USE auditoria_db;

-- Tabela de relacionamento aplicacao_ambientes
CREATE TABLE IF NOT EXISTS aplicacao_ambientes (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    identificador_aplicacao VARCHAR(20) NOT NULL,
    tipo_ambiente VARCHAR(50) NOT NULL,
    localizacao_regiao VARCHAR(20) NOT NULL,
    url_ambiente VARCHAR(500) NOT NULL,
    data_criacao DATE NOT NULL,
    tempo_liberacao INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_tipo (tipo_ambiente),
    INDEX idx_identificador (identificador_aplicacao),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento aplicacao_tecnologias
CREATE TABLE IF NOT EXISTS aplicacao_tecnologias (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    tecnologia_id VARCHAR(36) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (tecnologia_id) REFERENCES tecnologias(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_tecnologia (tecnologia_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento aplicacao_capacidades
CREATE TABLE IF NOT EXISTS aplicacao_capacidades (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    capacidade_id VARCHAR(36) NOT NULL,
    grau_cobertura INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (capacidade_id) REFERENCES capacidades_negocio(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_capacidade (capacidade_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento aplicacao_processos
CREATE TABLE IF NOT EXISTS aplicacao_processos (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    processo_id VARCHAR(36) NOT NULL,
    tipo_suporte VARCHAR(50) NOT NULL,
    criticidade VARCHAR(20) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (processo_id) REFERENCES processos_negocio(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_processo (processo_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento aplicacao_integracoes
CREATE TABLE IF NOT EXISTS aplicacao_integracoes (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    aplicacao_destino_id VARCHAR(36) NOT NULL,
    tipo_integracao VARCHAR(50) NOT NULL,
    protocolo VARCHAR(50) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_destino_id) REFERENCES aplicacoes(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_destino (aplicacao_destino_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento aplicacao_slas
CREATE TABLE IF NOT EXISTS aplicacao_slas (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    sla_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (sla_id) REFERENCES slas(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_sla (sla_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
