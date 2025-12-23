CREATE DATABASE IF NOT EXISTS auditoria_db;
USE auditoria_db;

CREATE TABLE IF NOT EXISTS colaboradores (
    id VARCHAR(36) PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(100) NOT NULL,
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_matricula (matricula),
    INDEX idx_setor (setor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tipos_afastamento (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(10) UNIQUE NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    argumentacao_legal VARCHAR(60) NOT NULL,
    numero_dias INT NOT NULL CHECK (numero_dias BETWEEN 1 AND 99),
    tipo_tempo CHAR(1) NOT NULL CHECK (tipo_tempo IN ('D', 'M', 'A')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS afastamentos (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    tipo_id VARCHAR(36) NOT NULL,
    inicial_provavel DATE NOT NULL,
    final_provavel DATE NOT NULL,
    inicial_efetivo DATE,
    final_efetivo DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_id) REFERENCES tipos_afastamento(id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_tipo (tipo_id),
    INDEX idx_datas (inicial_provavel, final_provavel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS habilidades (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    dominio VARCHAR(50) NOT NULL,
    subcategoria VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_habilidades_sigla (sigla),
    INDEX idx_dominio (dominio),
    INDEX idx_subcategoria (subcategoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS colaborador_habilidades (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    habilidade_id VARCHAR(36) NOT NULL,
    nivel_declarado ENUM('Básico', 'Intermediário', 'Avançado', 'Expert') NOT NULL,
    nivel_avaliado ENUM('Básico', 'Intermediário', 'Avançado', 'Expert') NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (habilidade_id) REFERENCES habilidades(id),
    UNIQUE KEY unique_colaborador_habilidade (colaborador_id, habilidade_id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_habilidade (habilidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    documentacao_oficial VARCHAR(500),
    repositorio_interno VARCHAR(500),
    ambiente_dev TINYINT(1) DEFAULT 0,
    ambiente_qa TINYINT(1) DEFAULT 0,
    ambiente_prod TINYINT(1) DEFAULT 0,
    ambiente_cloud TINYINT(1) DEFAULT 0,
    ambiente_on_premise TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS capacidades_negocio (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(20) UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel VARCHAR(20),
    categoria VARCHAR(50),
    alinhamento_objetivos TEXT,
    beneficios_esperados TEXT,
    estado_futuro_desejado TEXT,
    gap_estado_atual_futuro TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla),
    INDEX idx_categoria (categoria),
    INDEX idx_nivel (nivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aplicacoes (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(20) UNIQUE NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    url_documentacao VARCHAR(500) NOT NULL,
    fase_ciclo_vida VARCHAR(20) NOT NULL,
    criticidade_negocio VARCHAR(20) NOT NULL,
    categoria_sistema VARCHAR(50),
    fornecedor VARCHAR(200),
    tipo_hospedagem VARCHAR(50),
    custo_mensal DECIMAL(12,2),
    numero_usuarios INT,
    data_implantacao DATE,
    versao_atual VARCHAR(50),
    responsavel_tecnico VARCHAR(200),
    responsavel_negocio VARCHAR(200),
    status_operacional VARCHAR(50),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla),
    INDEX idx_fase_ciclo_vida (fase_ciclo_vida),
    INDEX idx_criticidade (criticidade_negocio),
    INDEX idx_status (status_operacional)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelas de relacionamento de Aplicações
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

CREATE TABLE IF NOT EXISTS aplicacao_ambientes (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    tipo_ambiente VARCHAR(50) NOT NULL,
    url_ambiente VARCHAR(500) NOT NULL,
    data_criacao DATE NOT NULL,
    tempo_liberacao INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_tipo (tipo_ambiente),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS slas (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(50) NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    tipo_sla VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    -- Suporte e Atendimento
    tempo_resposta VARCHAR(100),
    tempo_solucao VARCHAR(100),
    hora_inicial_atendimento VARCHAR(20),
    hora_termino_atendimento VARCHAR(20),
    -- Segurança
    patching_mensal_obrigatorio BOOLEAN,
    mfa_todos_acessos BOOLEAN,
    tempo_correcao_vulnerabilidade_critical VARCHAR(50),
    -- Capacidade
    percentual_cpu_maxima DECIMAL(5,2),
    capacidade_storage_livre DECIMAL(10,2),
    escalabilidade_automatica BOOLEAN,
    -- Disponibilidade
    percentual_uptime DECIMAL(5,2),
    -- Performance
    latencia_maxima DECIMAL(10,2),
    throughput DECIMAL(10,2),
    iops_storage INT,
    erros_por_minuto INT,
    -- Prioridade
    prioridade_p1 VARCHAR(100),
    prioridade_p2 VARCHAR(100),
    prioridade_p3 VARCHAR(100),
    -- Apoio
    sla_empresa VARCHAR(500),
    sla_fornecedores VARCHAR(500),
    -- Operacional
    infraestrutura VARCHAR(500),
    servico VARCHAR(500),
    rede VARCHAR(500),
    -- Componentes
    sla_banco_dados VARCHAR(500),
    sla_rede VARCHAR(500),
    sla_storage VARCHAR(500),
    sla_microservico VARCHAR(500),
    -- Usuário
    suporte_prioritario_area_critica VARCHAR(500),
    atendimento_especial_usuarios_chave VARCHAR(500),
    -- Serviço
    disponibilidade_sistema VARCHAR(100),
    backup_diario VARCHAR(100),
    tempo_resposta_apis VARCHAR(100),
    rpo_rto_dr VARCHAR(100),
    clonagem VARCHAR(500),
    data_alvo_clonagem VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla),
    INDEX idx_tipo_sla (tipo_sla),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS runbooks (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(50) NOT NULL,
    descricao_resumida VARCHAR(200) NOT NULL,
    finalidade TEXT NOT NULL,
    tipo_runbook ENUM('Procedimento de Rotina', 'Contingência', 'Tratamento de Incidente', 'Startup / Shutdown', 'Deploy', 'Backup', 'Restore', 'Operação Programada') NOT NULL,
    -- Pré-requisitos
    acessos_necessarios TEXT,
    validacoes_antes_iniciar TEXT,
    ferramentas_necessarias TEXT,
    -- Procedimento Operacional
    comandos TEXT,
    pontos_atencao TEXT,
    checks_intermediarios TEXT,
    criterios_sucesso TEXT,
    criterios_falha TEXT,
    -- Pós-Execução
    validacoes_obrigatorias TEXT,
    verificacao_logs TEXT,
    status_esperado_aplicacao TEXT,
    notificacoes_necessarias TEXT,
    -- Execução Automatizada
    scripts_relacionados TEXT,
    jobs_associados TEXT,
    url_localizacao_scripts TEXT,
    condicoes_automacao TEXT,
    -- Evidências
    prints_logs_necessarios TEXT,
    arquivos_gerados TEXT,
    tempo_medio_execucao TEXT,
    -- Riscos e Mitigações
    principais_riscos TEXT,
    acoes_preventivas TEXT,
    acoes_corretivas_rapidas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sigla (sigla),
    INDEX idx_tipo_runbook (tipo_runbook)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela estruturas_projeto: Gerador de Estruturas de Projeto
CREATE TABLE IF NOT EXISTS estruturas_projeto (
    id VARCHAR(36) PRIMARY KEY,
    produto VARCHAR(50) NOT NULL,
    work_item_process VARCHAR(50) NOT NULL DEFAULT 'Scrum',
    projeto VARCHAR(100) NOT NULL,
    data_inicial DATE NOT NULL,
    iteracao INT NOT NULL,
    incluir_query BOOLEAN DEFAULT FALSE,
    incluir_maven BOOLEAN DEFAULT FALSE,
    incluir_liquibase BOOLEAN DEFAULT FALSE,
    criar_time_sustentacao BOOLEAN DEFAULT FALSE,
    repositorios JSON,
    pat_token VARCHAR(500),
    estruturas_geradas JSON,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_produto (produto),
    INDEX idx_projeto (projeto),
    INDEX idx_data_inicial (data_inicial)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela integrador_projetos: Integrador de Projetos Azure DevOps
CREATE TABLE IF NOT EXISTS integrador_projetos (
    id VARCHAR(36) PRIMARY KEY,
    produto VARCHAR(50) NOT NULL,
    projeto VARCHAR(100) NOT NULL,
    work_item_process VARCHAR(50) NOT NULL DEFAULT 'Scrum',
    team_name VARCHAR(100) NOT NULL,
    data_inicial DATE NOT NULL,
    iteracao INT NOT NULL,
    incluir_queries BOOLEAN DEFAULT FALSE,
    incluir_maven BOOLEAN DEFAULT FALSE,
    incluir_liquibase BOOLEAN DEFAULT FALSE,
    sustentacao BOOLEAN DEFAULT FALSE,
    repositorios JSON,
    pat_token VARCHAR(500),
    status ENUM('pendente', 'criando', 'sucesso', 'erro') DEFAULT 'pendente',
    azure_project_id VARCHAR(100),
    azure_project_url VARCHAR(500),
    teams_created JSON,
    iterations_count INT,
    areas_count INT,
    error_message TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_produto (produto),
    INDEX idx_projeto (projeto),
    INDEX idx_status (status),
    INDEX idx_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'replicator'@'%' IDENTIFIED BY 'replicator123';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;
