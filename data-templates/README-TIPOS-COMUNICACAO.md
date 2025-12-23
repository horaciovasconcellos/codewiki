# Tipos de Comunicação

Módulo para gerenciar tipos de comunicação entre aplicações e sistemas.

## Estrutura

### Campos

- **Sigla**: Identificador curto (2-10 caracteres)
- **Tecnologias**: Array de tecnologias suportadas
  - HTTP/JSON
  - HTTP
  - Protobuf
  - XML
  - WS (WebSockets)
  - SNS/SQS
  - Pub/Sub
  - EventBridge
  - SAP Event Mesh
  - S3/Blob/GCS
  - SFTP cloud
  - Mulesoft
  - SIS
  - Boomi
  - HTTP POST
  - Kafka/Kinesis
- **Tipo**: Síncrono, Assíncrono ou Ambos
- **Uso Típico**: Descrição dos casos de uso

## Instalação

1. Execute o script SQL para criar a tabela:
```bash
mysql -u root -p auditoria_db < database/08-create-tipos-comunicacao.sql
```

2. A tabela será criada com 12 tipos de comunicação pré-carregados.

## API Endpoints

### GET /api/tipos-comunicacao
Lista todos os tipos de comunicação

### GET /api/tipos-comunicacao/:id
Busca um tipo específico por ID

### POST /api/tipos-comunicacao
Cria um novo tipo de comunicação

```json
{
  "sigla": "REST",
  "tecnologias": ["HTTP/JSON", "HTTP"],
  "tipo": "Síncrono",
  "usoTipico": "APIs REST para integrações..."
}
```

### PUT /api/tipos-comunicacao/:id
Atualiza um tipo existente

### DELETE /api/tipos-comunicacao/:id
Remove um tipo de comunicação

## Tipos Pré-carregados

1. **REST** - HTTP/JSON - Síncrono - Integrações modernas
2. **GRAPHQL** - HTTP - Síncrono - APIs flexíveis
3. **GRPC** - Protobuf - Síncrono - Alta performance
4. **SOAP** - XML - Síncrono - Sistemas legados
5. **WS** - WS - Síncrono - Tempo real
6. **MSGQUEUE** - SNS/SQS, Pub/Sub - Assíncrono - Processos desacoplados
7. **EVTMESH** - EventBridge, SAP Event Mesh - Assíncrono - Arquitetura orientada a eventos
8. **FILETRF** - S3/Blob/GCS - Assíncrono - Batch
9. **SFTP** - SFTP cloud - Assíncrono - Legados
10. **IPAAS** - Mulesoft, SIS, Boomi - Ambos - Orquestração
11. **WEBHOOK** - HTTP POST - Assíncrono - Notificações
12. **STREAMING** - Kafka/Kinesis - Assíncrono - Big Data/IoT
