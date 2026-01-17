-- =====================================================
-- SISTEMA DE CONTROLE DE ACESSO HÍBRIDO (RBAC + ABAC + ACL)
-- =====================================================

-- Tabela de Papéis (Roles) - RBAC
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    nivel_hierarquia INT DEFAULT 0, -- Hierarquia de roles (0 = mais baixo)
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    INDEX idx_nivel (nivel_hierarquia),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Recursos (Telas/Módulos)
CREATE TABLE IF NOT EXISTS recursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE, -- Ex: 'documentacao-projetos', 'usuarios', 'aplicacoes'
    descricao TEXT,
    tipo ENUM('tela', 'api', 'relatorio', 'funcionalidade') DEFAULT 'tela',
    modulo VARCHAR(100), -- Agrupamento lógico
    path VARCHAR(255), -- Caminho da rota
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    INDEX idx_tipo (tipo),
    INDEX idx_modulo (modulo),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Permissões (Actions)
CREATE TABLE IF NOT EXISTS permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recurso_id INT NOT NULL,
    acao ENUM('create', 'read', 'update', 'delete', 'execute', 'export', 'import', 'approve') NOT NULL,
    codigo VARCHAR(150) NOT NULL UNIQUE, -- Ex: 'documentacao-projetos.create'
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (recurso_id) REFERENCES recursos(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_recurso_acao (recurso_id, acao),
    INDEX idx_codigo (codigo),
    INDEX idx_acao (acao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Atributos - ABAC
CREATE TABLE IF NOT EXISTS atributos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('usuario', 'recurso', 'ambiente', 'contexto') NOT NULL,
    tipo_dado ENUM('string', 'number', 'boolean', 'date', 'json') DEFAULT 'string',
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    INDEX idx_tipo (tipo),
    INDEX idx_tipo_dado (tipo_dado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Políticas de Acesso - ABAC
CREATE TABLE IF NOT EXISTS politicas_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    permissao_id INT NOT NULL,
    condicao JSON NOT NULL, -- Condições ABAC em formato JSON
    prioridade INT DEFAULT 0, -- Ordem de avaliação
    efeito ENUM('allow', 'deny') DEFAULT 'allow',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    INDEX idx_permissao (permissao_id),
    INDEX idx_prioridade (prioridade),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação: Role -> Permissões (RBAC)
CREATE TABLE IF NOT EXISTS role_permissoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permissao_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_role_permissao (role_id, permissao_id),
    INDEX idx_role (role_id),
    INDEX idx_permissao (permissao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação: Usuário -> Roles
CREATE TABLE IF NOT EXISTS usuario_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    role_id INT NOT NULL,
    data_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    data_fim DATE, -- NULL = indefinido
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_usuario_role (usuario_id, role_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_role (role_id),
    INDEX idx_ativo (ativo),
    INDEX idx_datas (data_inicio, data_fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de ACL - Permissões Específicas por Usuário (sobrescreve RBAC)
CREATE TABLE IF NOT EXISTS usuario_permissoes_acl (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    permissao_id INT NOT NULL,
    tipo ENUM('allow', 'deny') NOT NULL DEFAULT 'allow',
    condicao JSON, -- Condições adicionais
    data_inicio DATE NOT NULL DEFAULT (CURRENT_DATE),
    data_fim DATE,
    motivo TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (permissao_id) REFERENCES permissoes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_usuario_permissao (usuario_id, permissao_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_permissao (permissao_id),
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Sessões de Usuário
CREATE TABLE IF NOT EXISTS sessoes_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    dispositivo VARCHAR(200),
    localizacao VARCHAR(200),
    data_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_logout TIMESTAMP NULL,
    data_expiracao TIMESTAMP NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    impersonated_by INT NULL, -- ID do usuário que está fazendo impersonation
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (impersonated_by) REFERENCES usuarios(id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token),
    INDEX idx_ativa (ativa),
    INDEX idx_data_expiracao (data_expiracao),
    INDEX idx_impersonated (impersonated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Auditoria de Acesso
CREATE TABLE IF NOT EXISTS auditoria_acesso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    acao ENUM('login', 'logout', 'login_failed', 'permission_denied', 'impersonation_start', 'impersonation_end') NOT NULL,
    recurso VARCHAR(200),
    permissao_tentada VARCHAR(150),
    resultado ENUM('success', 'denied', 'error') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    detalhes JSON,
    sessao_id INT,
    impersonated_by INT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (sessao_id) REFERENCES sessoes_usuario(id),
    FOREIGN KEY (impersonated_by) REFERENCES usuarios(id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_resultado (resultado),
    INDEX idx_timestamp (timestamp),
    INDEX idx_recurso (recurso),
    INDEX idx_impersonated (impersonated_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Auditoria de Dados (Tracking de Mudanças)
CREATE TABLE IF NOT EXISTS auditoria_dados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL,
    registro_id VARCHAR(100) NOT NULL,
    operacao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    usuario_id INT NOT NULL,
    dados_anteriores JSON,
    dados_novos JSON,
    campos_alterados JSON, -- Array de campos que mudaram
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    INDEX idx_tabela (tabela),
    INDEX idx_registro (registro_id),
    INDEX idx_operacao (operacao),
    INDEX idx_usuario (usuario_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_tabela_registro (tabela, registro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Grupos (para organização de usuários)
CREATE TABLE IF NOT EXISTS grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    grupo_pai_id INT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (grupo_pai_id) REFERENCES grupos(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    FOREIGN KEY (updated_by) REFERENCES usuarios(id),
    INDEX idx_grupo_pai (grupo_pai_id),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação: Usuário -> Grupos
CREATE TABLE IF NOT EXISTS usuario_grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    grupo_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_usuario_grupo (usuario_id, grupo_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_grupo (grupo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Associação: Grupo -> Roles
CREATE TABLE IF NOT EXISTS grupo_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grupo_id INT NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES usuarios(id),
    UNIQUE KEY uk_grupo_role (grupo_id, role_id),
    INDEX idx_grupo (grupo_id),
    INDEX idx_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Roles padrão
INSERT INTO roles (nome, descricao, nivel_hierarquia, created_by) VALUES
('Super Admin', 'Acesso total ao sistema', 100, 1),
('Administrador', 'Administrador do sistema', 90, 1),
('Gestor', 'Gestor de equipe', 70, 1),
('Desenvolvedor', 'Desenvolvedor do sistema', 50, 1),
('Analista', 'Analista de sistemas', 40, 1),
('Usuário', 'Usuário padrão do sistema', 10, 1),
('Visitante', 'Acesso somente leitura', 5, 1);

-- Recursos padrão (telas principais)
INSERT INTO recursos (nome, descricao, tipo, modulo, path, created_by) VALUES
('dashboard', 'Dashboard principal', 'tela', 'core', '/dashboard', 1),
('usuarios', 'Gestão de usuários', 'tela', 'admin', '/usuarios', 1),
('roles', 'Gestão de papéis', 'tela', 'admin', '/roles', 1),
('permissoes', 'Gestão de permissões', 'tela', 'admin', '/permissoes', 1),
('auditoria', 'Auditoria do sistema', 'tela', 'admin', '/auditoria', 1),
('aplicacoes', 'Gestão de aplicações', 'tela', 'projetos', '/aplicacoes', 1),
('documentacao-projetos', 'Documentação de Projetos', 'tela', 'projetos', '/documentacao-projetos', 1),
('servidores', 'Gestão de servidores', 'tela', 'infraestrutura', '/servidores', 1),
('colaboradores', 'Gestão de colaboradores', 'tela', 'rh', '/colaboradores', 1);

-- Permissões padrão (CRUD para cada recurso)
INSERT INTO permissoes (recurso_id, acao, codigo, descricao, created_by)
SELECT 
    r.id,
    a.acao,
    CONCAT(r.nome, '.', a.acao),
    CONCAT(a.descricao, ' em ', r.descricao),
    1
FROM recursos r
CROSS JOIN (
    SELECT 'create' as acao, 'Criar' as descricao UNION ALL
    SELECT 'read', 'Ler' UNION ALL
    SELECT 'update', 'Atualizar' UNION ALL
    SELECT 'delete', 'Excluir'
) a;

-- Atributos ABAC padrão
INSERT INTO atributos (nome, tipo, tipo_dado, descricao, created_by) VALUES
('departamento', 'usuario', 'string', 'Departamento do usuário', 1),
('nivel_acesso', 'usuario', 'number', 'Nível de acesso numérico', 1),
('ip_rede', 'ambiente', 'string', 'Faixa de IP permitida', 1),
('horario_acesso', 'ambiente', 'string', 'Horário permitido de acesso', 1),
('data_contratacao', 'usuario', 'date', 'Data de contratação do usuário', 1),
('projeto_id', 'contexto', 'number', 'ID do projeto em contexto', 1),
('aplicacao_id', 'contexto', 'number', 'ID da aplicação em contexto', 1);

-- Associar todas as permissões ao Super Admin
INSERT INTO role_permissoes (role_id, permissao_id, created_by)
SELECT 
    (SELECT id FROM roles WHERE nome = 'Super Admin'),
    id,
    1
FROM permissoes;

-- Associar permissões de leitura ao Visitante
INSERT INTO role_permissoes (role_id, permissao_id, created_by)
SELECT 
    (SELECT id FROM roles WHERE nome = 'Visitante'),
    id,
    1
FROM permissoes
WHERE acao = 'read';

-- =====================================================
-- VIEWS E PROCEDURES
-- =====================================================

-- View: Permissões efetivas de usuário (RBAC + ACL)
CREATE OR REPLACE VIEW vw_usuario_permissoes_efetivas AS
SELECT DISTINCT
    u.id as usuario_id,
    u.nome as usuario_nome,
    p.id as permissao_id,
    p.codigo as permissao_codigo,
    p.acao,
    r.nome as recurso_nome,
    r.tipo as recurso_tipo,
    'role' as origem,
    ro.nome as role_nome
FROM usuarios u
INNER JOIN usuario_roles ur ON u.id = ur.usuario_id AND ur.ativo = TRUE 
    AND (ur.data_fim IS NULL OR ur.data_fim >= CURDATE())
INNER JOIN roles ro ON ur.role_id = ro.id AND ro.ativo = TRUE
INNER JOIN role_permissoes rp ON ro.id = rp.role_id
INNER JOIN permissoes p ON rp.permissao_id = p.id
INNER JOIN recursos r ON p.recurso_id = r.id AND r.ativo = TRUE

UNION

SELECT DISTINCT
    u.id as usuario_id,
    u.nome as usuario_nome,
    p.id as permissao_id,
    p.codigo as permissao_codigo,
    p.acao,
    r.nome as recurso_nome,
    r.tipo as recurso_tipo,
    'acl' as origem,
    NULL as role_nome
FROM usuarios u
INNER JOIN usuario_permissoes_acl acl ON u.id = acl.usuario_id 
    AND acl.ativo = TRUE 
    AND acl.tipo = 'allow'
    AND (acl.data_fim IS NULL OR acl.data_fim >= CURDATE())
INNER JOIN permissoes p ON acl.permissao_id = p.id
INNER JOIN recursos r ON p.recurso_id = r.id AND r.ativo = TRUE;

-- Procedure: Verificar permissão de usuário
DELIMITER $$

CREATE PROCEDURE sp_verificar_permissao(
    IN p_usuario_id INT,
    IN p_codigo_permissao VARCHAR(150),
    OUT p_tem_permissao BOOLEAN
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_deny_count INT;
    
    -- Verificar se há negação explícita (ACL deny)
    SELECT COUNT(*) INTO v_deny_count
    FROM usuario_permissoes_acl acl
    INNER JOIN permissoes p ON acl.permissao_id = p.id
    WHERE acl.usuario_id = p_usuario_id
        AND p.codigo = p_codigo_permissao
        AND acl.tipo = 'deny'
        AND acl.ativo = TRUE
        AND (acl.data_fim IS NULL OR acl.data_fim >= CURDATE());
    
    IF v_deny_count > 0 THEN
        SET p_tem_permissao = FALSE;
    ELSE
        -- Verificar permissões (RBAC ou ACL allow)
        SELECT COUNT(*) INTO v_count
        FROM vw_usuario_permissoes_efetivas
        WHERE usuario_id = p_usuario_id
            AND permissao_codigo = p_codigo_permissao;
        
        SET p_tem_permissao = (v_count > 0);
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Exemplo de trigger para documentacao_projetos
DELIMITER $$

CREATE TRIGGER trg_documentacao_projetos_audit_insert
AFTER INSERT ON documentacao_projetos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_dados (
        tabela, registro_id, operacao, usuario_id,
        dados_novos, ip_address
    ) VALUES (
        'documentacao_projetos',
        NEW.id,
        'INSERT',
        COALESCE(NEW.created_by, 1),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'categoria', NEW.categoria,
            'status', NEW.status,
            'aplicacao', NEW.aplicacao
        ),
        '127.0.0.1'
    );
END$$

CREATE TRIGGER trg_documentacao_projetos_audit_update
AFTER UPDATE ON documentacao_projetos
FOR EACH ROW
BEGIN
    DECLARE v_campos JSON;
    
    SET v_campos = JSON_ARRAY();
    
    IF OLD.titulo != NEW.titulo THEN
        SET v_campos = JSON_ARRAY_APPEND(v_campos, '$', 'titulo');
    END IF;
    IF OLD.categoria != NEW.categoria THEN
        SET v_campos = JSON_ARRAY_APPEND(v_campos, '$', 'categoria');
    END IF;
    IF OLD.status != NEW.status THEN
        SET v_campos = JSON_ARRAY_APPEND(v_campos, '$', 'status');
    END IF;
    
    INSERT INTO auditoria_dados (
        tabela, registro_id, operacao, usuario_id,
        dados_anteriores, dados_novos, campos_alterados,
        ip_address
    ) VALUES (
        'documentacao_projetos',
        NEW.id,
        'UPDATE',
        COALESCE(NEW.updated_by, OLD.created_by, 1),
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'categoria', OLD.categoria,
            'status', OLD.status
        ),
        JSON_OBJECT(
            'titulo', NEW.titulo,
            'categoria', NEW.categoria,
            'status', NEW.status
        ),
        v_campos,
        '127.0.0.1'
    );
END$$

CREATE TRIGGER trg_documentacao_projetos_audit_delete
BEFORE DELETE ON documentacao_projetos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria_dados (
        tabela, registro_id, operacao, usuario_id,
        dados_anteriores, ip_address
    ) VALUES (
        'documentacao_projetos',
        OLD.id,
        'DELETE',
        COALESCE(OLD.updated_by, OLD.created_by, 1),
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'categoria', OLD.categoria,
            'status', OLD.status
        ),
        '127.0.0.1'
    );
END$$

DELIMITER ;
