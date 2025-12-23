-- Tabela principal de Integrações
CREATE TABLE IF NOT EXISTS integracoes (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(30) NOT NULL UNIQUE,
  nome VARCHAR(30) NOT NULL,
  especificacao_filename VARCHAR(255),
  especificacao_mimetype VARCHAR(100),
  especificacao_data LONGBLOB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sigla (sigla)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela User-to-Cloud
CREATE TABLE IF NOT EXISTS user_to_cloud (
  id VARCHAR(36) PRIMARY KEY,
  integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_dispositivo ENUM('Web', 'Mobile', 'Desktop', 'Máquinas Industriais', 'Equipamentos', 'IoT', 'Outros') NOT NULL,
  nome_dispositivo VARCHAR(100) NOT NULL,
  comunicacao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NOT NULL,
  periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NOT NULL,
  frequencia_uso ENUM('sob demanda', 'evento', 'batch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integracao_id) REFERENCES integracoes(id) ON DELETE CASCADE,
  FOREIGN KEY (comunicacao_id) REFERENCES comunicacoes(id),
  INDEX idx_integracao_id (integracao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela User-to-On-Premise
CREATE TABLE IF NOT EXISTS user_to_onpremise (
  id VARCHAR(36) PRIMARY KEY,
  integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_dispositivo ENUM('Web', 'Mobile', 'Desktop', 'Máquinas Industriais', 'Equipamentos', 'IoT', 'Outros') NOT NULL,
  nome_dispositivo VARCHAR(100) NOT NULL,
  comunicacao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NOT NULL,
  periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NOT NULL,
  frequencia_uso ENUM('sob demanda', 'evento', 'batch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integracao_id) REFERENCES integracoes(id) ON DELETE CASCADE,
  FOREIGN KEY (comunicacao_id) REFERENCES comunicacoes(id),
  INDEX idx_integracao_id (integracao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela Cloud-to-Cloud
CREATE TABLE IF NOT EXISTS cloud_to_cloud (
  id VARCHAR(36) PRIMARY KEY,
  integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  aplicacao_origem_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  aplicacao_destino_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NOT NULL,
  periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NOT NULL,
  frequencia_uso ENUM('sob demanda', 'evento', 'batch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integracao_id) REFERENCES integracoes(id) ON DELETE CASCADE,
  FOREIGN KEY (aplicacao_origem_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (aplicacao_destino_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (tipo_integracao_id) REFERENCES comunicacoes(id),
  INDEX idx_integracao_id (integracao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela On-Premise-to-Cloud
CREATE TABLE IF NOT EXISTS onpremise_to_cloud (
  id VARCHAR(36) PRIMARY KEY,
  integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  aplicacao_origem_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  aplicacao_destino_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NOT NULL,
  periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NOT NULL,
  frequencia_uso ENUM('sob demanda', 'evento', 'batch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integracao_id) REFERENCES integracoes(id) ON DELETE CASCADE,
  FOREIGN KEY (aplicacao_origem_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (aplicacao_destino_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (tipo_integracao_id) REFERENCES comunicacoes(id),
  INDEX idx_integracao_id (integracao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela On-Premise-to-On-Premise
CREATE TABLE IF NOT EXISTS onpremise_to_onpremise (
  id VARCHAR(36) PRIMARY KEY,
  integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  aplicacao_origem_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  aplicacao_destino_id VARCHAR(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_integracao_id VARCHAR(36) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  tipo_autenticacao ENUM('API Key', 'OAuth 2.0', 'OIDC', 'SAML 2.0', 'LDAP', 'Kerberos', 'Basic Authentication', 'mTLS', 'JWT', 'Session-Based Authentication', 'MFA', 'Passkeys') NOT NULL,
  periodicidade ENUM('Real-Time', 'Near Real-Time', 'Batch', 'Event-Driven', 'On-Demand') NOT NULL,
  frequencia_uso ENUM('sob demanda', 'evento', 'batch') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integracao_id) REFERENCES integracoes(id) ON DELETE CASCADE,
  FOREIGN KEY (aplicacao_origem_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (aplicacao_destino_id) REFERENCES aplicacoes(id),
  FOREIGN KEY (tipo_integracao_id) REFERENCES comunicacoes(id),
  INDEX idx_integracao_id (integracao_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
