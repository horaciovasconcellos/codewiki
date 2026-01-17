-- Criação da tabela de relacionamento aplicacao_squads
-- Esta tabela associa colaboradores a aplicações com perfis e squads específicos
USE auditoria_db;

-- Tabela de relacionamento aplicacao_squads
CREATE TABLE IF NOT EXISTS aplicacao_squads (
    id VARCHAR(36) PRIMARY KEY,
    aplicacao_id VARCHAR(36) NOT NULL,
    colaborador_id VARCHAR(36) NOT NULL,
    perfil VARCHAR(100) NOT NULL,
    squad VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
    INDEX idx_aplicacao (aplicacao_id),
    INDEX idx_colaborador (colaborador_id),
    INDEX idx_perfil (perfil),
    INDEX idx_squad (squad),
    INDEX idx_status (status),
    -- Constraint para garantir que não haja duplicatas:
    -- Um colaborador só pode estar associado uma vez com o mesmo perfil e squad na mesma aplicação
    UNIQUE KEY unique_colaborador_perfil_squad (aplicacao_id, colaborador_id, perfil, squad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentários da tabela
ALTER TABLE aplicacao_squads COMMENT = 'Tabela de associação entre aplicações e colaboradores com definição de perfil e squad';

-- Comentários das colunas
ALTER TABLE aplicacao_squads 
    MODIFY COLUMN perfil VARCHAR(100) NOT NULL COMMENT 'Perfil do colaborador: Analista Negocio, Product Owner, Scrum Master, Desenvolvedor Backend, Desenvolvedor Frontend, Desenvolvedor Mobile, QA/Test Engineer, DevOps / SRE, UX/UI Designer, Data Engineer, Stakeholder, Product Manager, Tech Lead, Agile Coach, Temporário, Gerente de Produto',
    MODIFY COLUMN squad VARCHAR(100) NOT NULL COMMENT 'Squad: Produto, Plataforma, DevOps Enablement / Coaching, Site Reliability Engineering, Segurança, Integração / APIs, DataOps / MLOps, Modernização';
