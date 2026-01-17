-- Migration: Create usuarios table
-- Description: Tabela para gerenciar usuários do sistema com controle de acesso
-- Dependencies: Requires colaboradores table to exist

-- ============================================================================
-- Tabela: usuarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role ENUM('Administrador', 'Back-office', 'Usuário', 'Consulta') NOT NULL DEFAULT 'Usuário',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Dados denormalizados do colaborador (cache para performance)
    colaborador_nome VARCHAR(255),
    colaborador_matricula VARCHAR(50),
    colaborador_setor VARCHAR(255),
    
    -- Permissões customizadas por setor (JSON)
    -- Estrutura: [{"setor": "TI", "permissoes": [{"tela": "dashboard", "create": true, "read": true, "update": true, "delete": false}]}]
    permissoes_por_setor JSON,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    -- Foreign Keys
    CONSTRAINT fk_usuario_colaborador FOREIGN KEY (colaborador_id) 
        REFERENCES colaboradores(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_ativo (ativo),
    INDEX idx_colaborador_setor (colaborador_setor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Trigger: Atualizar dados do colaborador automaticamente
-- ============================================================================
DROP TRIGGER IF EXISTS trg_usuarios_before_insert;
DROP TRIGGER IF EXISTS trg_usuarios_before_update;

DELIMITER $$

CREATE TRIGGER trg_usuarios_before_insert
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    DECLARE v_nome VARCHAR(255);
    DECLARE v_matricula VARCHAR(50);
    DECLARE v_setor VARCHAR(255);
    
    -- Buscar dados do colaborador
    SELECT nome, matricula, setor 
    INTO v_nome, v_matricula, v_setor
    FROM colaboradores 
    WHERE id = NEW.colaborador_id;
    
    -- Atualizar campos denormalizados
    SET NEW.colaborador_nome = v_nome;
    SET NEW.colaborador_matricula = v_matricula;
    SET NEW.colaborador_setor = v_setor;
    
    -- Inicializar permissoes_por_setor como array vazio se NULL
    IF NEW.permissoes_por_setor IS NULL THEN
        SET NEW.permissoes_por_setor = JSON_ARRAY();
    END IF;
END$$

CREATE TRIGGER trg_usuarios_before_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    DECLARE v_nome VARCHAR(255);
    DECLARE v_matricula VARCHAR(50);
    DECLARE v_setor VARCHAR(255);
    
    -- Se o colaborador_id mudou, atualizar dados denormalizados
    IF NEW.colaborador_id != OLD.colaborador_id THEN
        SELECT nome, matricula, setor 
        INTO v_nome, v_matricula, v_setor
        FROM colaboradores 
        WHERE id = NEW.colaborador_id;
        
        SET NEW.colaborador_nome = v_nome;
        SET NEW.colaborador_matricula = v_matricula;
        SET NEW.colaborador_setor = v_setor;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- View: Usuarios com dados completos do colaborador
-- ============================================================================
DROP VIEW IF EXISTS vw_usuarios_completo;

CREATE OR REPLACE VIEW vw_usuarios_completo AS
SELECT 
    u.id,
    u.colaborador_id,
    u.email,
    u.role,
    u.ativo,
    u.colaborador_nome,
    u.colaborador_matricula,
    u.colaborador_setor,
    u.permissoes_por_setor,
    u.created_at,
    u.updated_at,
    c.data_admissao AS colaborador_data_admissao,
    c.data_demissao AS colaborador_data_demissao,
    -- Contar permissões configuradas
    (
        SELECT COUNT(*)
        FROM JSON_TABLE(
            u.permissoes_por_setor,
            '$[*]' COLUMNS(
                setor VARCHAR(255) PATH '$.setor'
            )
        ) AS jt
    ) AS total_setores_configurados
FROM usuarios u
INNER JOIN colaboradores c ON u.colaborador_id = c.id;

-- ============================================================================
-- Stored Procedure: Verificar se email está disponível
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_usuario_email_disponivel;

DELIMITER $$

CREATE PROCEDURE sp_usuario_email_disponivel(
    IN p_email VARCHAR(255),
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_count INT;
    
    IF p_usuario_id IS NULL THEN
        -- Criação: verificar se email existe
        SELECT COUNT(*) INTO v_count
        FROM usuarios
        WHERE email = p_email;
    ELSE
        -- Edição: verificar se email existe para outro usuário
        SELECT COUNT(*) INTO v_count
        FROM usuarios
        WHERE email = p_email AND id != p_usuario_id;
    END IF;
    
    SELECT v_count AS email_em_uso;
END$$

DELIMITER ;

-- ============================================================================
-- Stored Procedure: Verificar se colaborador está disponível
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_usuario_colaborador_disponivel;

DELIMITER $$

CREATE PROCEDURE sp_usuario_colaborador_disponivel(
    IN p_colaborador_id VARCHAR(36),
    IN p_usuario_id INT
)
BEGIN
    DECLARE v_count INT;
    
    IF p_usuario_id IS NULL THEN
        -- Criação: verificar se colaborador já tem usuário
        SELECT COUNT(*) INTO v_count
        FROM usuarios
        WHERE colaborador_id = p_colaborador_id;
    ELSE
        -- Edição: verificar se colaborador está em uso por outro usuário
        SELECT COUNT(*) INTO v_count
        FROM usuarios
        WHERE colaborador_id = p_colaborador_id AND id != p_usuario_id;
    END IF;
    
    SELECT v_count AS colaborador_em_uso;
END$$

DELIMITER ;

-- ============================================================================
-- Stored Procedure: Sincronizar dados do colaborador
-- ============================================================================
DROP PROCEDURE IF EXISTS sp_sincronizar_dados_colaborador;

DELIMITER $$

CREATE PROCEDURE sp_sincronizar_dados_colaborador(
    IN p_colaborador_id VARCHAR(36)
)
BEGIN
    UPDATE usuarios u
    INNER JOIN colaboradores c ON u.colaborador_id = c.id
    SET 
        u.colaborador_nome = c.nome,
        u.colaborador_matricula = c.matricula,
        u.colaborador_setor = c.setor
    WHERE u.colaborador_id = p_colaborador_id;
    
    SELECT ROW_COUNT() AS usuarios_atualizados;
END$$

DELIMITER ;

-- ============================================================================
-- Seed Data: Usuário Administrador Padrão (apenas se não existir)
-- ============================================================================
-- Senha: admin123 (hash bcrypt com salt rounds = 10)
INSERT INTO usuarios (
    colaborador_id,
    email,
    senha_hash,
    role,
    ativo,
    created_by
)
SELECT 
    c.id,
    'admin@codewiki.com',
    '$2b$10$rMvQkGpPQXYqfMCiYYlAKuO7FZO7PsV0y8JvqZVxZxZvQXYqfMCiY',
    'Administrador',
    TRUE,
    'SYSTEM'
FROM colaboradores c
WHERE c.nome LIKE '%Administrador%' OR c.matricula = '00001' -- Buscar colaborador admin
AND NOT EXISTS (
    SELECT 1 FROM usuarios WHERE email = 'admin@codewiki.com'
)
LIMIT 1;

-- ============================================================================
-- Comentários nas Colunas
-- ============================================================================
ALTER TABLE usuarios 
    MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE 
        COMMENT 'Email único para login do usuário',
    MODIFY COLUMN senha_hash VARCHAR(255) NOT NULL 
        COMMENT 'Hash bcrypt da senha do usuário',
    MODIFY COLUMN role ENUM('Administrador', 'Back-office', 'Usuário', 'Consulta') NOT NULL 
        COMMENT 'Perfil de acesso: Administrador (acesso total), Back-office (CRUD completo), Usuário (limitado), Consulta (somente leitura)',
    MODIFY COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Se FALSE, o usuário não pode fazer login',
    MODIFY COLUMN permissoes_por_setor JSON 
        COMMENT 'Array de objetos: [{setor, permissoes: [{tela, create, read, update, delete}]}]';

-- ============================================================================
-- Verificação Final
-- ============================================================================
SELECT 
    'usuarios table created successfully' AS status,
    COUNT(*) AS total_usuarios
FROM usuarios;
