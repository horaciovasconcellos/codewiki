-- Migration: Criar tabela de servidores
-- Data: 2025-12-17
-- Descrição: Tabela para gerenciar informações de servidores físicos, virtuais e cloud

USE auditoria_db;

CREATE TABLE IF NOT EXISTS servidores (
    id VARCHAR(36) PRIMARY KEY,
    
    -- Identificação
    sigla VARCHAR(20) UNIQUE NOT NULL,
    hostname VARCHAR(50) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    ambiente VARCHAR(30) NOT NULL,
    finalidade VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo',
    
    -- Plataforma
    provedor VARCHAR(20) NOT NULL,
    datacenter_regiao VARCHAR(60),
    zona_availability VARCHAR(60),
    cluster_host VARCHAR(60),
    virtualizador VARCHAR(20),
    
    -- Sistema Operacional
    sistema_operacional VARCHAR(30) NOT NULL,
    distribuicao_versao VARCHAR(20),
    arquitetura VARCHAR(20),
    
    -- Operação e Monitoramento
    ferramenta_monitoramento VARCHAR(20),
    backup_diario BOOLEAN DEFAULT FALSE,
    backup_semanal BOOLEAN DEFAULT FALSE,
    backup_mensal BOOLEAN DEFAULT FALSE,
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sigla (sigla),
    INDEX idx_tipo (tipo),
    INDEX idx_ambiente (ambiente),
    INDEX idx_status (status),
    INDEX idx_provedor (provedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
