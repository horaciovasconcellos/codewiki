-- Migration: Criar tabela scripts
-- Data: 2024-12-29
-- Descrição: Cria tabela para armazenar scripts de automação, administração e infraestrutura

-- Criar tabela scripts
CREATE TABLE IF NOT EXISTS scripts (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE,
  tipo_script VARCHAR(50) NOT NULL,
  arquivo VARCHAR(255),
  arquivo_url VARCHAR(500),
  arquivo_tamanho INT,
  arquivo_tipo VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_scripts_sigla (sigla),
  INDEX idx_scripts_tipo (tipo_script),
  INDEX idx_scripts_data_inicio (data_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Tabela de scripts de automação, administração e infraestrutura';

-- Criar diretório de uploads se não existir (será criado pela aplicação)
-- mkdir -p uploads/scripts/

COMMIT;
