-- ============================================================================
-- Tabela de Logs e Auditoria
-- ============================================================================
-- 
-- Esta tabela armazena todos os logs de auditoria do sistema, incluindo:
-- - Operações CRUD (CREATE, UPDATE, DELETE)
-- - Informações de rastreamento (trace_id, span_id)
-- - Dados do usuário e requisição
-- - Payloads e mudanças de valores
-- - Métricas de performance
--
-- ============================================================================

CREATE TABLE IF NOT EXISTS logs_auditoria (
  -- Identificação
  id VARCHAR(26) PRIMARY KEY COMMENT 'ID único do log (ULID)',
  log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp do log',
  
  -- Rastreamento distribuído
  trace_id VARCHAR(26) COMMENT 'ID de rastreamento da requisição',
  span_id VARCHAR(26) COMMENT 'ID do span da operação',
  
  -- Informações do usuário
  user_id VARCHAR(50) COMMENT 'ID do usuário',
  user_login VARCHAR(100) COMMENT 'Login do usuário',
  
  -- Informações da operação
  operation_type VARCHAR(20) COMMENT 'Tipo: CREATE, UPDATE, DELETE, READ',
  entity_type VARCHAR(50) COMMENT 'Tipo da entidade afetada',
  entity_id VARCHAR(50) COMMENT 'ID da entidade afetada',
  
  -- Informações da requisição HTTP
  method VARCHAR(10) COMMENT 'Método HTTP: GET, POST, PUT, DELETE, PATCH',
  route VARCHAR(255) COMMENT 'Rota da API',
  status_code INT COMMENT 'Código de status HTTP da resposta',
  duration_ms INT COMMENT 'Duração da operação em milissegundos',
  
  -- Informações do cliente
  ip_address VARCHAR(50) COMMENT 'Endereço IP do cliente',
  user_agent TEXT COMMENT 'User-Agent do navegador/cliente',
  
  -- Dados da operação
  payload JSON COMMENT 'Payload da requisição (body)',
  old_values JSON COMMENT 'Valores antigos (UPDATE)',
  new_values JSON COMMENT 'Valores novos (UPDATE)',
  
  -- Informações de erro
  error_message TEXT COMMENT 'Mensagem de erro, se houver',
  severity VARCHAR(20) DEFAULT 'info' COMMENT 'Severidade: debug, info, warning, error, critical',
  
  -- Índices para performance
  INDEX idx_timestamp (log_timestamp),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_login),
  INDEX idx_operation (operation_type),
  INDEX idx_trace (trace_id),
  INDEX idx_severity (severity),
  INDEX idx_route (route),
  INDEX idx_status (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tabela de logs e auditoria do sistema';

-- ============================================================================
-- Índice composto para consultas complexas
-- ============================================================================

CREATE INDEX idx_audit_query ON logs_auditoria (
  log_timestamp DESC, 
  entity_type, 
  operation_type, 
  user_login
);

-- ============================================================================
-- Views para facilitar consultas
-- ============================================================================

-- View de logs de erro
CREATE OR REPLACE VIEW v_logs_erro AS
SELECT 
  id,
  log_timestamp,
  user_login,
  operation_type,
  entity_type,
  entity_id,
  method,
  route,
  status_code,
  duration_ms,
  error_message,
  severity
FROM logs_auditoria
WHERE severity IN ('error', 'critical') OR status_code >= 400
ORDER BY log_timestamp DESC;

-- View de operações por usuário
CREATE OR REPLACE VIEW v_logs_por_usuario AS
SELECT 
  user_login,
  operation_type,
  entity_type,
  COUNT(*) as total_operacoes,
  AVG(duration_ms) as media_duracao_ms,
  MAX(log_timestamp) as ultima_operacao
FROM logs_auditoria
GROUP BY user_login, operation_type, entity_type
ORDER BY total_operacoes DESC;

-- View de performance por rota
CREATE OR REPLACE VIEW v_logs_performance AS
SELECT 
  route,
  method,
  COUNT(*) as total_chamadas,
  AVG(duration_ms) as media_ms,
  MIN(duration_ms) as minimo_ms,
  MAX(duration_ms) as maximo_ms,
  SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as total_erros,
  (SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as taxa_erro_pct
FROM logs_auditoria
WHERE route IS NOT NULL
GROUP BY route, method
ORDER BY total_chamadas DESC;

-- View de atividade recente
CREATE OR REPLACE VIEW v_logs_atividade_recente AS
SELECT 
  log_timestamp,
  user_login,
  operation_type,
  entity_type,
  entity_id,
  status_code,
  duration_ms,
  CASE 
    WHEN severity = 'error' THEN '🔴'
    WHEN severity = 'warning' THEN '🟡'
    ELSE '🟢'
  END as status_emoji
FROM logs_auditoria
WHERE log_timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY log_timestamp DESC
LIMIT 100;

-- ============================================================================
-- Stored Procedures para limpeza de logs antigos
-- ============================================================================

DELIMITER $$

CREATE PROCEDURE sp_limpar_logs_antigos(IN dias_retencao INT)
BEGIN
  DELETE FROM logs_auditoria 
  WHERE log_timestamp < DATE_SUB(NOW(), INTERVAL dias_retencao DAY)
  AND severity NOT IN ('error', 'critical');
  
  SELECT ROW_COUNT() as registros_removidos;
END$$

DELIMITER ;

-- ============================================================================
-- Comentários finais
-- ============================================================================
-- 
-- Uso:
-- 1. Executar este script no banco de dados MySQL
-- 2. Verificar se as views foram criadas corretamente
-- 3. Testar inserção de log de teste
-- 4. Configurar rotina de limpeza (exemplo: manter 90 dias)
--
-- Exemplos de uso:
--
-- -- Limpar logs com mais de 90 dias (mantém erros)
-- CALL sp_limpar_logs_antigos(90);
--
-- -- Ver logs de erro
-- SELECT * FROM v_logs_erro LIMIT 50;
--
-- -- Ver performance das rotas
-- SELECT * FROM v_logs_performance;
--
-- -- Ver atividade de um usuário
-- SELECT * FROM logs_auditoria 
-- WHERE user_login = 'horacio.vasconcellos'
-- ORDER BY log_timestamp DESC 
-- LIMIT 50;
--
-- ============================================================================
