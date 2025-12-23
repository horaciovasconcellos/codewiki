-- Script de criação de tabelas para o Sistema de Auditoria

-- Tabela de Tipos de Afastamento
CREATE TABLE tipos_afastamento (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(20) NOT NULL,
    descricao VARCHAR2(500) NOT NULL,
    argumentacao_legal VARCHAR2(2000),
    numero_dias NUMBER(5) NOT NULL,
    tipo_tempo CHAR(1) CHECK (tipo_tempo IN ('D', 'M', 'A')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tipos_afastamento_sigla UNIQUE (sigla)
);

CREATE INDEX idx_tipos_afastamento_tipo_tempo ON tipos_afastamento(tipo_tempo);

COMMENT ON TABLE tipos_afastamento IS 'Cadastro de tipos de afastamento disponíveis no sistema';
COMMENT ON COLUMN tipos_afastamento.tipo_tempo IS 'D = Dias, M = Meses, A = Anos';

-- Tabela de Colaboradores
CREATE TABLE colaboradores (
    id VARCHAR2(100) PRIMARY KEY,
    matricula VARCHAR2(20) NOT NULL,
    nome VARCHAR2(200) NOT NULL,
    setor VARCHAR2(100) NOT NULL,
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_colaboradores_matricula UNIQUE (matricula)
);

CREATE INDEX idx_colaboradores_setor ON colaboradores(setor);
CREATE INDEX idx_colaboradores_admissao ON colaboradores(data_admissao);

COMMENT ON TABLE colaboradores IS 'Cadastro de colaboradores do sistema';

-- Tabela de Afastamentos
CREATE TABLE afastamentos (
    id VARCHAR2(100) PRIMARY KEY,
    colaborador_id VARCHAR2(100) NOT NULL,
    tipo_afastamento_id VARCHAR2(100) NOT NULL,
    inicial_provavel DATE NOT NULL,
    final_provavel DATE NOT NULL,
    inicial_efetivo DATE,
    final_efetivo DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_afastamentos_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    CONSTRAINT fk_afastamentos_tipo FOREIGN KEY (tipo_afastamento_id) REFERENCES tipos_afastamento(id)
);

CREATE INDEX idx_afastamentos_colaborador ON afastamentos(colaborador_id);
CREATE INDEX idx_afastamentos_tipo ON afastamentos(tipo_afastamento_id);
CREATE INDEX idx_afastamentos_datas ON afastamentos(inicial_provavel, final_provavel);

COMMENT ON TABLE afastamentos IS 'Registro de afastamentos de colaboradores';

-- Tabela de Tecnologias
CREATE TABLE tecnologias (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(50) NOT NULL,
    nome VARCHAR2(200) NOT NULL,
    versao_release VARCHAR2(50) NOT NULL,
    categoria VARCHAR2(100) NOT NULL,
    status VARCHAR2(50) NOT NULL,
    fornecedor_fabricante VARCHAR2(200),
    tipo_licenciamento VARCHAR2(50),
    data_fim_suporte_eos DATE,
    maturidade_interna VARCHAR2(50),
    nivel_suporte_interno VARCHAR2(100),
    documentacao_oficial VARCHAR2(500),
    repositorio_interno VARCHAR2(500),
    ambiente_dev CHAR(1) DEFAULT '0' CHECK (ambiente_dev IN ('0', '1')),
    ambiente_qa CHAR(1) DEFAULT '0' CHECK (ambiente_qa IN ('0', '1')),
    ambiente_prod CHAR(1) DEFAULT '0' CHECK (ambiente_prod IN ('0', '1')),
    ambiente_cloud CHAR(1) DEFAULT '0' CHECK (ambiente_cloud IN ('0', '1')),
    ambiente_on_premise CHAR(1) DEFAULT '0' CHECK (ambiente_on_premise IN ('0', '1')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tecnologias_sigla UNIQUE (sigla)
);

CREATE INDEX idx_tecnologias_categoria ON tecnologias(categoria);
CREATE INDEX idx_tecnologias_status ON tecnologias(status);

COMMENT ON TABLE tecnologias IS 'Cadastro de tecnologias utilizadas';

-- Tabela de Processos de Negócio
CREATE TABLE processos_negocio (
    id VARCHAR2(100) PRIMARY KEY,
    identificacao VARCHAR2(100) NOT NULL,
    descricao VARCHAR2(1000) NOT NULL,
    nivel_maturidade VARCHAR2(50) NOT NULL,
    area_responsavel VARCHAR2(200) NOT NULL,
    frequencia VARCHAR2(50) NOT NULL,
    duracao_media NUMBER(10,2),
    complexidade VARCHAR2(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_processos_identificacao UNIQUE (identificacao)
);

CREATE INDEX idx_processos_negocio_area ON processos_negocio(area_responsavel);
CREATE INDEX idx_processos_negocio_complexidade ON processos_negocio(complexidade);

COMMENT ON TABLE processos_negocio IS 'Cadastro de processos de negócio';

-- Tabela de Aplicações
CREATE TABLE aplicacoes (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(15) NOT NULL,
    descricao VARCHAR2(1000) NOT NULL,
    url_documentacao VARCHAR2(500),
    fase_ciclo_vida VARCHAR2(50) NOT NULL,
    criticidade_negocio VARCHAR2(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_aplicacoes_sigla UNIQUE (sigla)
);

CREATE INDEX idx_aplicacoes_criticidade ON aplicacoes(criticidade_negocio);
CREATE INDEX idx_aplicacoes_fase ON aplicacoes(fase_ciclo_vida);

COMMENT ON TABLE aplicacoes IS 'Cadastro de aplicações do sistema';

-- Tabela de Capacidades de Negócio
CREATE TABLE capacidades_negocio (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(50) NOT NULL,
    nome VARCHAR2(200) NOT NULL,
    descricao VARCHAR2(1000) NOT NULL,
    nivel VARCHAR2(50) NOT NULL,
    categoria VARCHAR2(100) NOT NULL,
    alinhamento_objetivos CLOB,
    beneficios_esperados CLOB,
    estado_futuro_desejado CLOB,
    gap_estado_atual_futuro CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_capacidades_sigla UNIQUE (sigla)
);

CREATE INDEX idx_capacidades_nivel ON capacidades_negocio(nivel);
CREATE INDEX idx_capacidades_categoria ON capacidades_negocio(categoria);

COMMENT ON TABLE capacidades_negocio IS 'Cadastro de capacidades de negócio';

-- Tabela de SLAs
CREATE TABLE slas (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(50) NOT NULL,
    descricao VARCHAR2(1000) NOT NULL,
    tipo_sla VARCHAR2(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR2(20) NOT NULL CHECK (status IN ('Ativo', 'Inativo')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_slas_sigla UNIQUE (sigla)
);

CREATE INDEX idx_slas_status ON slas(status);
CREATE INDEX idx_slas_tipo ON slas(tipo_sla);

COMMENT ON TABLE slas IS 'Cadastro de SLAs (Service Level Agreements)';

-- Tabela de Runbooks
CREATE TABLE runbooks (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(50) NOT NULL,
    descricao_resumida VARCHAR2(500) NOT NULL,
    finalidade VARCHAR2(1000),
    tipo_runbook VARCHAR2(100) NOT NULL,
    CONSTRAINT uk_runbooks_sigla UNIQUE (sigla)
);

COMMENT ON TABLE runbooks IS 'Cadastro de runbooks operacionais';

-- Tabela de Habilidades
CREATE TABLE habilidades (
    id VARCHAR2(100) PRIMARY KEY,
    sigla VARCHAR2(50) NOT NULL,
    descricao VARCHAR2(500) NOT NULL,
    dominio VARCHAR2(50) NOT NULL,
    subcategoria VARCHAR2(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_habilidades_sigla UNIQUE (sigla)
);

CREATE INDEX idx_habilidades_dominio ON habilidades(dominio);
CREATE INDEX idx_habilidades_subcategoria ON habilidades(subcategoria);

COMMENT ON TABLE habilidades IS 'Cadastro de habilidades técnicas e comportamentais';
COMMENT ON COLUMN habilidades.sigla IS 'Identificador curto da habilidade (ex: REACT, NODEJS)';
COMMENT ON COLUMN habilidades.descricao IS 'Descrição completa da habilidade';
COMMENT ON COLUMN habilidades.dominio IS 'Domínio: Técnica, Comportamental, Gestão, Negócio, Segurança, DevOps';
COMMENT ON COLUMN habilidades.subcategoria IS 'Subcategoria: Frontend, Backend, Banco de Dados, Infraestrutura, etc';

-- Tabela de Habilidades dos Colaboradores
CREATE TABLE habilidades_colaboradores (
    id VARCHAR2(100) PRIMARY KEY,
    colaborador_id VARCHAR2(100) NOT NULL,
    habilidade_id VARCHAR2(100) NOT NULL,
    nivel_declarado VARCHAR2(50) NOT NULL,
    nivel_avaliado VARCHAR2(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    CONSTRAINT fk_hab_colab_colaborador FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    CONSTRAINT fk_hab_colab_habilidade FOREIGN KEY (habilidade_id) REFERENCES habilidades(id)
);

COMMENT ON TABLE habilidades_colaboradores IS 'Habilidades associadas aos colaboradores';

-- Tabela de Repositórios de Projetos
CREATE TABLE repositorios_projetos (
    id VARCHAR2(100) PRIMARY KEY,
    produto VARCHAR2(100) NOT NULL,
    categoria VARCHAR2(50) NOT NULL,
    tecnologia VARCHAR2(50) NOT NULL,
    nome_repositorio VARCHAR2(200) GENERATED ALWAYS AS (produto || '-' || categoria || '-' || tecnologia) VIRTUAL,
    CONSTRAINT uk_repos_produto_cat_tec UNIQUE (produto, categoria, tecnologia)
);

COMMENT ON TABLE repositorios_projetos IS 'Cadastro de repositórios de projetos';
COMMENT ON COLUMN repositorios_projetos.nome_repositorio IS 'Campo calculado: produto-categoria-tecnologia';

-- Tabela de Projetos Gerados
CREATE TABLE projetos_gerados (
    id VARCHAR2(100) PRIMARY KEY,
    produto VARCHAR2(100) NOT NULL,
    projeto VARCHAR2(100) NOT NULL,
    data_inicial DATE NOT NULL,
    iteracao NUMBER(5) NOT NULL,
    incluir_query CHAR(1) DEFAULT '0' CHECK (incluir_query IN ('0', '1')),
    incluir_maven CHAR(1) DEFAULT '0' CHECK (incluir_maven IN ('0', '1')),
    incluir_liquibase CHAR(1) DEFAULT '0' CHECK (incluir_liquibase IN ('0', '1')),
    data_criacao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL
);

COMMENT ON TABLE projetos_gerados IS 'Histórico de projetos gerados pelo sistema';

-- Tabela de Repositórios por Projeto
CREATE TABLE repos_por_projeto (
    id VARCHAR2(100) PRIMARY KEY,
    projeto_gerado_id VARCHAR2(100) NOT NULL,
    repositorio_id VARCHAR2(100) NOT NULL,
    CONSTRAINT fk_repos_proj_projeto FOREIGN KEY (projeto_gerado_id) REFERENCES projetos_gerados(id) ON DELETE CASCADE,
    CONSTRAINT fk_repos_proj_repositorio FOREIGN KEY (repositorio_id) REFERENCES repositorios_projetos(id)
);

COMMENT ON TABLE repos_por_projeto IS 'Associação de repositórios aos projetos gerados';

-- Tabela de Tokens de Acesso
CREATE TABLE tokens_acesso (
    id VARCHAR2(100) PRIMARY KEY,
    token_hash VARCHAR2(500) NOT NULL,
    tipo_entidade VARCHAR2(50) NOT NULL,
    identificador_entidade VARCHAR2(200) NOT NULL,
    nome_entidade VARCHAR2(200) NOT NULL,
    ambiente VARCHAR2(50) NOT NULL,
    data_geracao TIMESTAMP NOT NULL,
    data_inicio_validade TIMESTAMP NOT NULL,
    data_expiracao TIMESTAMP,
    token_temporario CHAR(1) DEFAULT '0' CHECK (token_temporario IN ('0', '1')),
    motivo_expiracao VARCHAR2(500),
    permitir_regeneracao CHAR(1) DEFAULT '1' CHECK (permitir_regeneracao IN ('0', '1')),
    rate_limit_por_hora NUMBER(10) DEFAULT 1000,
    requer_mfa CHAR(1) DEFAULT '0' CHECK (requer_mfa IN ('0', '1')),
    status VARCHAR2(20) NOT NULL CHECK (status IN ('Ativo', 'Revogado', 'Expirado', 'Pendente', 'Suspenso')),
    motivo_revogacao VARCHAR2(500),
    ultima_atualizacao TIMESTAMP,
    criado_por VARCHAR2(200),
    data_hora_criacao TIMESTAMP DEFAULT SYSTIMESTAMP,
    ultimo_uso TIMESTAMP,
    quantidade_acessos NUMBER(15) DEFAULT 0,
    origem_ultimo_acesso VARCHAR2(200),
    localizacao_ultimo_acesso VARCHAR2(200),
    CONSTRAINT uk_tokens_hash UNIQUE (token_hash)
);

COMMENT ON TABLE tokens_acesso IS 'Tokens de acesso para APIs e integrações';

-- Tabela de Escopos de Tokens
CREATE TABLE tokens_escopos (
    id VARCHAR2(100) PRIMARY KEY,
    token_id VARCHAR2(100) NOT NULL,
    escopo VARCHAR2(50) NOT NULL,
    CONSTRAINT fk_tokens_escopos_token FOREIGN KEY (token_id) REFERENCES tokens_acesso(id) ON DELETE CASCADE
);

COMMENT ON TABLE tokens_escopos IS 'Escopos associados aos tokens de acesso';

-- Tabela de Origens Permitidas dos Tokens
CREATE TABLE tokens_origens (
    id VARCHAR2(100) PRIMARY KEY,
    token_id VARCHAR2(100) NOT NULL,
    origem VARCHAR2(500) NOT NULL,
    CONSTRAINT fk_tokens_origens_token FOREIGN KEY (token_id) REFERENCES tokens_acesso(id) ON DELETE CASCADE
);

COMMENT ON TABLE tokens_origens IS 'Origens permitidas para os tokens de acesso';

-- Criar índices para performance
CREATE INDEX idx_afastamentos_colaborador ON afastamentos(colaborador_id);
CREATE INDEX idx_afastamentos_tipo ON afastamentos(tipo_afastamento_id);
CREATE INDEX idx_hab_colab_colaborador ON habilidades_colaboradores(colaborador_id);
CREATE INDEX idx_hab_colab_habilidade ON habilidades_colaboradores(habilidade_id);
CREATE INDEX idx_repos_proj_projeto ON repos_por_projeto(projeto_gerado_id);
CREATE INDEX idx_repos_proj_repositorio ON repos_por_projeto(repositorio_id);
CREATE INDEX idx_tokens_escopos_token ON tokens_escopos(token_id);
CREATE INDEX idx_tokens_origens_token ON tokens_origens(token_id);
CREATE INDEX idx_tokens_status ON tokens_acesso(status);
CREATE INDEX idx_tokens_entidade ON tokens_acesso(tipo_entidade, identificador_entidade);

COMMIT;
