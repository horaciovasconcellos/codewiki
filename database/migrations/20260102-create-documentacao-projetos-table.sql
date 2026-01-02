-- Migration: Criar tabela documentacao_projetos
-- Data: 2026-01-02
-- Descrição: Cria tabela para armazenar documentação de projetos com editor Markdown

CREATE TABLE IF NOT EXISTS documentacao_projetos (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  conteudo LONGTEXT NOT NULL,
  categoria ENUM('Arquitetura', 'Desenvolvimento', 'Infraestrutura', 'Segurança', 'Processos', 'API', 'Outros') NOT NULL DEFAULT 'Outros',
  tags JSON,
  versao VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  autor VARCHAR(255) NOT NULL,
  projeto VARCHAR(255),
  status ENUM('Rascunho', 'Em Revisão', 'Publicado', 'Arquivado') NOT NULL DEFAULT 'Rascunho',
  data_publicacao TIMESTAMP NULL,
  data_ultima_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_documentacao_slug (slug),
  INDEX idx_documentacao_categoria (categoria),
  INDEX idx_documentacao_status (status),
  INDEX idx_documentacao_autor (autor),
  FULLTEXT INDEX idx_documentacao_busca (titulo, descricao, conteudo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tabela de documentação de projetos com suporte a Markdown e Mermaid';

COMMIT;
