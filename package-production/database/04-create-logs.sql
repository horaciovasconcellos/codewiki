-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id VARCHAR(36) PRIMARY KEY,
  log_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  trace_id VARCHAR(36),
  span_id VARCHAR(36),
  user_id VARCHAR(100) DEFAULT 'system',
  user_login VARCHAR(100) DEFAULT 'system',
  operation_type VARCHAR(20) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(36),
  method VARCHAR(10),
  route VARCHAR(255),
  status_code INT,
  duration_ms INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  payload JSON,
  old_values JSON,
  new_values JSON,
  error_message TEXT,
  severity VARCHAR(10) DEFAULT 'info'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_log_timestamp ON logs_auditoria(log_timestamp);
CREATE INDEX idx_user_id ON logs_auditoria(user_id);
CREATE INDEX idx_operation_type ON logs_auditoria(operation_type);
CREATE INDEX idx_entity_type ON logs_auditoria(entity_type);
CREATE INDEX idx_entity_id ON logs_auditoria(entity_id);
CREATE INDEX idx_trace_id ON logs_auditoria(trace_id);

