-- Criar tabela para armazenar registros de Opt-In/Out de colaboradores
CREATE TABLE IF NOT EXISTS colaborador_opt_in_out (
  id VARCHAR(36) PRIMARY KEY,
  colaborador_id VARCHAR(36) NOT NULL,
  aplicacao_id VARCHAR(36) NOT NULL,
  data_inicio DATE NOT NULL,
  data_revogacao DATE NULL,
  arquivo_pdf LONGTEXT NULL,
  assinatura_eletronica VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
  FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
  INDEX idx_colaborador (colaborador_id),
  INDEX idx_aplicacao (aplicacao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
