-- =====================================================
-- ADR (ARCHITECTURAL DECISION RECORDS) SCHEMA
-- Sistema de Gestão de Decisões Arquitetônicas
-- =====================================================

-- Tabela principal de ADRs
CREATE TABLE IF NOT EXISTS adrs (
    id VARCHAR(36) PRIMARY KEY,
    sequencia INT AUTO_INCREMENT UNIQUE NOT NULL,
    descricao VARCHAR(500) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Proposto', 'Aceito', 'Rejeitado', 'Substituido', 'Obsoleto', 'Adiado/Retirado') DEFAULT 'Proposto',
    contexto TEXT,
    decisao TEXT,
    justificativa TEXT,
    consequencias_positivas TEXT,
    consequencias_negativas TEXT,
    riscos TEXT,
    alternativas_consideradas TEXT,
    compliance_constitution TEXT,
    adr_substituta_id VARCHAR(36),
    referencias TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (adr_substituta_id) REFERENCES adrs(id) ON DELETE SET NULL,
    INDEX idx_adr_sequencia (sequencia),
    INDEX idx_adr_status (status),
    INDEX idx_adr_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela associativa ADR <-> Aplicações
CREATE TABLE IF NOT EXISTS adr_aplicacoes (
    id VARCHAR(36) PRIMARY KEY,
    adr_id VARCHAR(36) NOT NULL,
    aplicacao_id VARCHAR(36) NOT NULL,
    data_inicio DATE,
    data_termino DATE,
    status ENUM('Ativo', 'Inativo', 'Planejado', 'Descontinuado') DEFAULT 'Ativo',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (adr_id) REFERENCES adrs(id) ON DELETE CASCADE,
    FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
    INDEX idx_adr_app_adr (adr_id),
    INDEX idx_adr_app_aplicacao (aplicacao_id),
    INDEX idx_adr_app_status (status),
    UNIQUE KEY uk_adr_aplicacao (adr_id, aplicacao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados de exemplo
INSERT INTO adrs (id, descricao, status, contexto, decisao, justificativa) VALUES
(UUID(), 'Adoção de Arquitetura em Microsserviços', 'Aceito', 
 'O sistema atual é monolítico e dificulta escalabilidade e deployment independente de funcionalidades.',
 'Migrar gradualmente para uma arquitetura baseada em microsserviços.',
 'Permitir escalabilidade horizontal, deployment independente, e facilitar manutenção.'),
 
(UUID(), 'Uso de Docker e Kubernetes para Orquestração', 'Aceito',
 'Necessidade de padronizar ambientes e facilitar deployment em múltiplos ambientes.',
 'Adotar Docker para containerização e Kubernetes para orquestração.',
 'Garantir consistência entre ambientes e facilitar CI/CD.'),
 
(UUID(), 'Framework Frontend: React vs Vue', 'Substituído',
 'Precisamos escolher um framework frontend moderno para o projeto.',
 'Inicialmente escolhemos Vue.js, mas decidimos migrar para React.',
 'React tem ecossistema mais maduro e maior comunidade.');
