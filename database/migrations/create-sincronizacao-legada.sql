-- Tabela para controle de sincronização legada de aplicações com Azure DevOps
CREATE TABLE IF NOT EXISTS sincronizacao_legada (
  id VARCHAR(26) PRIMARY KEY COMMENT 'ULID',
  aplicacao_id VARCHAR(36) NOT NULL,
  url_projeto VARCHAR(500) NOT NULL,
  projeto_nome VARCHAR(255) DEFAULT NULL,
  repositorio_nome VARCHAR(255) DEFAULT NULL,
  status ENUM('Pendente', 'Sincronizado', 'Erro') NOT NULL DEFAULT 'Pendente',
  mensagem_erro TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
  INDEX idx_aplicacao (aplicacao_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Controle de sincronização legada de aplicações com repositórios Azure DevOps';
