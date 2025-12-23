-- Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS configuracoes (
    id VARCHAR(36) PRIMARY KEY,
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chave (chave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais (comentados - sistema inicia sem dados)
-- INSERT IGNORE INTO configuracoes (id, chave, valor, tipo) VALUES
-- ('conf-001', 'system-name', 'Sistema de Auditoria', 'string'),
-- ('conf-002', 'company-logo', NULL, 'string'),
-- ('conf-003', 'integration-config', '{"azureDevOps":{"urlOrganizacao":"https://dev.azure.com/{organization}/","apiVersion":"7.1-preview.1","timeoutSeconds":30,"pageSize":200,"personalAccessToken":""},"sysAid":{"urlOrganizacao":"","usuarioAutenticado":"","personalAccessToken":""}}', 'json'),
-- ('conf-004', 'theme-colors', '{"primary":"oklch(0.264 0.126 276)","secondary":"oklch(0.35 0.08 265)","accent":"oklch(0.30 0.08 265)","background":"oklch(0.988 0.018 105)","foreground":"oklch(0.264 0.126 276)","muted":"oklch(0.92 0.08 95)","border":"oklch(0.85 0.08 95)","sidebar":"oklch(0.970 0.139 106)","sidebarForeground":"oklch(0.264 0.126 276)"}', 'json');
