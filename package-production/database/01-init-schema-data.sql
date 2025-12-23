-- Inicialização do banco de dados Master
CREATE DATABASE IF NOT EXISTS auditoria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE auditoria_db;

-- Tabela de Tipos de Afastamento
CREATE TABLE IF NOT EXISTS tipos_afastamento (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(10) UNIQUE NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    argumentacao_legal VARCHAR(60) NOT NULL,
    numero_dias INT NOT NULL CHECK (numero_dias BETWEEN 1 AND 99),
    tipo_tempo CHAR(1) NOT NULL CHECK (tipo_tempo IN ('C', 'N')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Colaboradores
CREATE TABLE IF NOT EXISTS colaboradores (
    id VARCHAR(36) PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(100) NOT NULL,
    data_admissao DATE NOT NULL,
    data_demissao DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_matricula (matricula),
    INDEX idx_setor (setor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Afastamentos
CREATE TABLE IF NOT EXISTS afastamentos (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    tipo_afastamento_id VARCHAR(36) NOT NULL,
    inicial_provavel DATE NOT NULL,
    final_provavel DATE NOT NULL,
    inicial_efetivo DATE DEFAULT NULL,
    final_efetivo DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_afastamento_id) REFERENCES tipos_afastamento(id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_tipo (tipo_afastamento_id),
    INDEX idx_datas (inicial_provavel, final_provavel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Habilidades
CREATE TABLE IF NOT EXISTS habilidades (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) UNIQUE NOT NULL,
    tipo ENUM('Tecnica', 'Comportamental', 'Gestao') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Tabela de Tecnologias
CREATE TABLE IF NOT EXISTS tecnologias (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    versao_release VARCHAR(50),
    categoria VARCHAR(50),
    status VARCHAR(20),
    fornecedor_fabricante VARCHAR(100),
    tipo_licenciamento VARCHAR(50),
    maturidade_interna VARCHAR(50),
    nivel_suporte_interno VARCHAR(50),
    ambiente_dev BOOLEAN DEFAULT FALSE,
    ambiente_qa BOOLEAN DEFAULT FALSE,
    ambiente_prod BOOLEAN DEFAULT FALSE,
    ambiente_cloud BOOLEAN DEFAULT FALSE,
    ambiente_on_premise BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Capacidades de Negócio
CREATE TABLE IF NOT EXISTS capacidades_negocio (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Processos de Negócio
CREATE TABLE IF NOT EXISTS processos_negocio (
    id VARCHAR(36) PRIMARY KEY,
    identificacao VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_maturidade VARCHAR(50) NOT NULL,
    area_responsavel VARCHAR(200) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    duracao_media DECIMAL(10,2),
    complexidade VARCHAR(50) NOT NULL,
    normas JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_processos_identificacao (identificacao),
    INDEX idx_processos_area (area_responsavel),
    INDEX idx_processos_complexidade (complexidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar usuário de replicação
CREATE USER IF NOT EXISTS 'replicator'@'%' IDENTIFIED BY 'replicator123';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;

-- Inserir dados iniciais de Tipos de Afastamento
-- INSERT IGNORE INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo)
-- VALUES 
--     ('550e8400-e29b-41d4-a716-446655440001', 'FER', 'Férias', 'Lei 5.452/1943 (CLT) Art. 129', 30, 'C'),
--     ('550e8400-e29b-41d4-a716-446655440002', 'LIC-MED', 'Licença Médica', 'Lei 8.213/1991 Art. 60', 15, 'C'),
--     ('550e8400-e29b-41d4-a716-446655440003', 'LIC-MAT', 'Licença Maternidade', 'Lei 11.770/2008 Art. 1º', 180, 'C'),
--     ('550e8400-e29b-41d4-a716-446655440004', 'LIC-PAT', 'Licença Paternidade', 'Lei 13.257/2016 Art. 38', 20, 'C');

-- Inserir dados iniciais de Habilidades
-- INSERT IGNORE INTO habilidades (id, nome, tipo)
-- VALUES 
--     ('hab-001', 'Java', 'Tecnica'),
--     ('hab-002', 'Python', 'Tecnica'),
--     ('hab-003', 'React', 'Tecnica'),
--     ('hab-004', 'Angular', 'Tecnica'),
--     ('hab-005', 'Docker', 'Tecnica'),
--     ('hab-006', 'Kubernetes', 'Tecnica'),
--     ('hab-007', 'Liderança', 'Comportamental'),
--     ('hab-008', 'Comunicação', 'Comportamental'),
--     ('hab-009', 'Scrum', 'Gestao'),
--     ('hab-010', 'Kanban', 'Gestao');

-- Inserir dados iniciais de Tecnologias
-- INSERT IGNORE INTO tecnologias (id, sigla, nome, versao_release, categoria, status, fornecedor_fabricante, tipo_licenciamento, maturidade_interna, nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod, ambiente_cloud, ambiente_on_premise)
-- VALUES 
--     ('tec-001', 'JAVA17', 'Java Development Kit', '17.0.8', 'Backend', 'Ativa', 'Oracle Corporation', 'Open Source', 'Padronizada', 'Suporte Completo', TRUE, TRUE, TRUE, TRUE, TRUE),
--     ('tec-002', 'REACT18', 'React Framework', '18.2.0', 'Frontend', 'Ativa', 'Meta', 'Open Source', 'Padronizada', 'Suporte Avançado', TRUE, TRUE, TRUE, TRUE, FALSE),
--     ('tec-003', 'MYSQL8', 'MySQL Database', '8.0', 'Banco de Dados', 'Ativa', 'Oracle Corporation', 'Open Source', 'Padronizada', 'Suporte Completo', TRUE, TRUE, TRUE, TRUE, TRUE),
--     ('tec-004', 'PYTHON311', 'Python', '3.11.5', 'Backend', 'Ativa', 'Python Software Foundation', 'Open Source', 'Adotada', 'Suporte Intermediário', TRUE, TRUE, TRUE, TRUE, TRUE),
--     ('tec-005', 'DOCKER', 'Docker Engine', '24.0', 'Infraestrutura', 'Ativa', 'Docker Inc', 'Open Source', 'Padronizada', 'Suporte Completo', TRUE, TRUE, TRUE, TRUE, TRUE);

-- Inserir dados iniciais de Capacidades de Negócio
-- INSERT IGNORE INTO capacidades_negocio (id, nome, descricao)
-- VALUES 
--     ('cap-001', 'Gestão Financeira', 'Capacidade de gerenciar recursos financeiros da organização'),
--     ('cap-002', 'Gestão de Pessoas', 'Capacidade de gerenciar colaboradores e equipes'),
--     ('cap-003', 'Gestão de Processos', 'Capacidade de gerenciar e otimizar processos de negócio'),
--     ('cap-004', 'Gestão de TI', 'Capacidade de gerenciar infraestrutura e aplicações de TI'),
--     ('cap-005', 'Gestão de Projetos', 'Capacidade de planejar e executar projetos');

-- Inserir colaborador de exemplo
-- INSERT IGNORE INTO colaboradores (id, matricula, nome, setor, data_admissao)
-- VALUES 
--     ('colab-001', '5664', 'João Silva Santos', 'Tecnologia da Informação', '2020-03-15');

-- Estatísticas de carga
SELECT 'Tabelas criadas - Sistema inicializado sem dados' AS status;
