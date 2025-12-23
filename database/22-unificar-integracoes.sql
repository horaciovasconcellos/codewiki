-- Migration: Unifica todas as integrações em uma única tabela
-- Data: 2025-12-15
-- Descrição: Adiciona todos os campos necessários na tabela integracoes para unificar os tipos de integração

ALTER TABLE integracoes
ADD COLUMN tipo_integracao ENUM('User-to-Cloud', 'User-to-OnPremise', 'Cloud-to-Cloud', 'OnPremise-to-Cloud', 'OnPremise-to-OnPremise') NULL AFTER nome,
ADD COLUMN tipo_dispositivo ENUM('Web', 'Mobile', 'Desktop', 'Máquinas Industriais', 'Equipamentos', 'IoT', 'Outros') NULL AFTER tipo_integracao,
ADD COLUMN nome_dispositivo VARCHAR(80) NULL AFTER tipo_dispositivo,
ADD COLUMN aplicacao_origem_id VARCHAR(36) NULL AFTER nome_dispositivo,
ADD COLUMN aplicacao_destino_id VARCHAR(36) NULL AFTER aplicacao_origem_id,
ADD COLUMN comunicacao_id VARCHAR(36) NULL AFTER aplicacao_destino_id,
ADD COLUMN tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NULL AFTER comunicacao_id,
ADD COLUMN periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NULL AFTER tipo_autenticacao,
ADD COLUMN frequencia_uso ENUM('sob demanda', 'evento', 'batch') NULL AFTER periodicidade;

-- Adiciona foreign keys
ALTER TABLE integracoes
ADD CONSTRAINT fk_integracao_app_origem FOREIGN KEY (aplicacao_origem_id) REFERENCES aplicacoes(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_integracao_app_destino FOREIGN KEY (aplicacao_destino_id) REFERENCES aplicacoes(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_integracao_comunicacao FOREIGN KEY (comunicacao_id) REFERENCES comunicacoes(id) ON DELETE SET NULL;

-- Adiciona índices para performance
CREATE INDEX idx_tipo_integracao ON integracoes(tipo_integracao);
CREATE INDEX idx_aplicacao_origem ON integracoes(aplicacao_origem_id);
CREATE INDEX idx_aplicacao_destino ON integracoes(aplicacao_destino_id);

-- Verificação
DESCRIBE integracoes;
