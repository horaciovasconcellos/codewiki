-- Tabela de Comunicações
CREATE TABLE IF NOT EXISTS comunicacoes (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(50) NOT NULL UNIQUE,
  tecnologias JSON NOT NULL,
  tipo ENUM('Sincrono', 'Assincrono', 'Ambos') NOT NULL,
  uso_tipico VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_comunicacoes_sigla ON comunicacoes(sigla);
CREATE INDEX idx_comunicacoes_tipo ON comunicacoes(tipo);

-- Inserir dados iniciais
INSERT INTO comunicacoes (id, sigla, tecnologias, tipo, uso_tipico) VALUES
(UUID(), 'REST-API', '["HTTP/JSON", "HTTP"]', 'Sincrono', 'APIs RESTful para comunicação entre serviços web com resposta imediata'),
(UUID(), 'SOAP-WS', '["WS", "XML"]', 'Sincrono', 'Web Services SOAP para integrações enterprise legadas'),
(UUID(), 'GRPC', '["Protobuf", "HTTP"]', 'Sincrono', 'Comunicação de alto desempenho entre microserviços'),
(UUID(), 'MSG-QUEUE', '["SNS/SQS", "Kafka/Kinesis"]', 'Assincrono', 'Filas de mensagens para processamento assíncrono e desacoplamento'),
(UUID(), 'EVENT-BUS', '["EventBridge", "Pub/Sub", "SAP Event Mesh"]', 'Assincrono', 'Event-driven architecture para notificações e reações a eventos'),
(UUID(), 'FILE-TRANSFER', '["S3/Blob/GCS", "SFTP cloud"]', 'Assincrono', 'Transferência de arquivos em lote para ETL e integração de dados'),
(UUID(), 'ESB', '["Mulesoft", "SIS", "Boomi"]', 'Ambos', 'Enterprise Service Bus para orquestração e transformação de integrações'),
(UUID(), 'WEBHOOK', '["HTTP POST", "HTTP/JSON"]', 'Assincrono', 'Notificações push baseadas em eventos via callbacks HTTP'),
(UUID(), 'STREAM', '["Kafka/Kinesis"]', 'Assincrono', 'Streaming de dados em tempo real para analytics e processamento'),
(UUID(), 'RPC', '["Protobuf", "HTTP"]', 'Sincrono', 'Remote Procedure Call para chamadas de função distribuídas'),
(UUID(), 'BATCH-ETL', '["S3/Blob/GCS", "SFTP cloud"]', 'Assincrono', 'Processamento em lote de grandes volumes de dados'),
(UUID(), 'HYBRID-API', '["HTTP/JSON", "Kafka/Kinesis", "SNS/SQS"]', 'Ambos', 'APIs com suporte síncrono e assíncrono conforme necessidade');

-- Verificar dados inseridos
SELECT COUNT(*) as total_comunicacoes FROM comunicacoes;
SELECT * FROM comunicacoes ORDER BY sigla;
