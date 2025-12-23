-- Tabela de contratos associados a aplicações
-- Criado em 17/12/2025

CREATE TABLE IF NOT EXISTS contratos (
  id VARCHAR(36) PRIMARY KEY,
  aplicacao_id VARCHAR(36) NOT NULL,
  numero_contrato VARCHAR(100) NOT NULL,
  data_vigencia_inicial DATE NOT NULL,
  data_vigencia_final DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Vigente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_contrato_aplicacao FOREIGN KEY (aplicacao_id) REFERENCES aplicacoes(id) ON DELETE CASCADE,
  INDEX idx_aplicacao_id (aplicacao_id),
  INDEX idx_status (status),
  INDEX idx_vigencia (data_vigencia_inicial, data_vigencia_final)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
