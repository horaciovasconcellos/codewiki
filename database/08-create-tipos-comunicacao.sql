-- Criar tabela de tipos de comunicação
CREATE TABLE IF NOT EXISTS tipos_comunicacao (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(10) NOT NULL UNIQUE,
  tecnologias JSON NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Sincrono', 'Assincrono', 'Ambos')),
  uso_tipico TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sigla (sigla),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
INSERT INTO tipos_comunicacao (id, sigla, tecnologias, tipo, uso_tipico) VALUES
('1', 'REST', '["HTTP/JSON"]', 'Sincrono', 'Integrações modernas'),
('2', 'GRAPHQL', '["HTTP"]', 'Sincrono', 'APIs flexíveis'),
('3', 'GRPC', '["Protobuf"]', 'Sincrono', 'Alta performance'),
('4', 'SOAP', '["XML"]', 'Sincrono', 'Sistemas legados'),
('5', 'WS', '["WS"]', 'Sincrono', 'Tempo real'),
('6', 'MSGQUEUE', '["SNS/SQS", "Pub/Sub"]', 'Assincrono', 'Processos desacoplados'),
('7', 'EVTMESH', '["EventBridge", "SAP Event Mesh"]', 'Assincrono', 'Arquitetura orientada a eventos'),
('8', 'FILETRF', '["S3/Blob/GCS"]', 'Assincrono', 'Batch'),
('9', 'SFTP', '["SFTP cloud"]', 'Assincrono', 'Legados'),
('10', 'IPAAS', '["Mulesoft", "SIS", "Boomi"]', 'Ambos', 'Orquestração'),
('11', 'WEBHOOK', '["HTTP POST"]', 'Assincrono', 'Notificações'),
('12', 'STREAMING', '["Kafka/Kinesis"]', 'Assincrono', 'Big Data/IoT')
ON DUPLICATE KEY UPDATE sigla = VALUES(sigla);
