# Comunicações - Documentação

## Visão Geral

O módulo de **Comunicações** permite gerenciar e categorizar os diferentes padrões e tecnologias de comunicação utilizados na arquitetura de integração da organização.

## Campos

### Sigla
- **Tipo**: String
- **Obrigatório**: Sim
- **Descrição**: Identificador único e curto para o tipo de comunicação
- **Exemplo**: `REST-API`, `MSG-QUEUE`, `ESB`

### Tecnologias
- **Tipo**: Array de strings (múltipla escolha)
- **Obrigatório**: Sim (mínimo 1)
- **Opções disponíveis**:
  - `HTTP/JSON` - REST APIs com JSON
  - `HTTP` - HTTP puro
  - `Protobuf` - Protocol Buffers
  - `XML` - XML/SOAP
  - `WS` - Web Services
  - `SNS/SQS` - AWS SNS/SQS
  - `Pub/Sub` - Google Pub/Sub
  - `EventBridge` - AWS EventBridge
  - `SAP Event Mesh` - SAP Event Mesh
  - `S3/Blob/GCS` - Object Storage (AWS S3, Azure Blob, GCS)
  - `SFTP cloud` - SFTP em nuvem
  - `Mulesoft` - Mulesoft ESB
  - `SIS` - SAP Integration Suite
  - `Boomi` - Dell Boomi
  - `HTTP POST` - Webhooks/HTTP POST
  - `Kafka/Kinesis` - Apache Kafka ou AWS Kinesis

### Tipo
- **Tipo**: Enum
- **Obrigatório**: Sim
- **Opções**:
  - `Sincrono` - Comunicação síncrona (request-response imediato)
  - `Assincrono` - Comunicação assíncrona (mensagens, eventos)
  - `Ambos` - Suporta ambos os modos

### Uso Típico
- **Tipo**: String (texto)
- **Obrigatório**: Sim
- **Limite**: 120 caracteres
- **Descrição**: Descrição curta do caso de uso típico desse padrão de comunicação

## Exemplos de Registros

### REST API Síncrona
```json
{
  "sigla": "REST-API",
  "tecnologias": ["HTTP/JSON", "HTTP"],
  "tipo": "Sincrono",
  "usoTipico": "APIs RESTful para comunicação entre serviços web com resposta imediata"
}
```

### Mensageria Assíncrona
```json
{
  "sigla": "MSG-QUEUE",
  "tecnologias": ["SNS/SQS", "Kafka/Kinesis"],
  "tipo": "Assincrono",
  "usoTipico": "Filas de mensagens para processamento assíncrono e desacoplamento"
}
```

### ESB Híbrido
```json
{
  "sigla": "ESB",
  "tecnologias": ["Mulesoft", "SIS", "Boomi"],
  "tipo": "Ambos",
  "usoTipico": "Enterprise Service Bus para orquestração e transformação de integrações"
}
```

## Endpoints da API

### Listar todas as comunicações
```
GET /api/comunicacoes
```

**Resposta**: Array de objetos Comunicacao

### Obter uma comunicação específica
```
GET /api/comunicacoes/:id
```

**Resposta**: Objeto Comunicacao ou 404 se não encontrado

### Criar nova comunicação
```
POST /api/comunicacoes
Content-Type: application/json

{
  "sigla": "WEBHOOK",
  "tecnologias": ["HTTP POST", "HTTP/JSON"],
  "tipo": "Assincrono",
  "usoTipico": "Notificações push baseadas em eventos via callbacks HTTP"
}
```

**Resposta**: 201 Created com objeto criado

**Validações**:
- Todos os campos são obrigatórios
- `tecnologias` deve ter pelo menos 1 item
- `usoTipico` não pode exceder 120 caracteres
- `sigla` deve ser única

### Atualizar comunicação existente
```
PUT /api/comunicacoes/:id
Content-Type: application/json

{
  "sigla": "WEBHOOK",
  "tecnologias": ["HTTP POST", "HTTP/JSON"],
  "tipo": "Assincrono",
  "usoTipico": "Notificações push para callbacks HTTP"
}
```

**Resposta**: 200 OK com objeto atualizado ou 404 se não encontrado

### Deletar comunicação
```
DELETE /api/comunicacoes/:id
```

**Resposta**: 204 No Content ou 404 se não encontrado

## Estrutura do Banco de Dados

```sql
CREATE TABLE comunicacoes (
  id VARCHAR(36) PRIMARY KEY,
  sigla VARCHAR(50) NOT NULL UNIQUE,
  tecnologias JSON NOT NULL,
  tipo ENUM('Sincrono', 'Assincrono', 'Ambos') NOT NULL,
  uso_tipico VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Índices
- `idx_comunicacoes_sigla` - Índice na coluna sigla
- `idx_comunicacoes_tipo` - Índice na coluna tipo

## Carga Inicial de Dados

### Via Script
```bash
# A partir da raiz do projeto
./scripts/carga-comunicacoes.sh
```

O script irá:
1. Verificar se a API está acessível
2. Carregar os dados do arquivo `data-templates/comunicacoes-carga.json`
3. Criar os registros via API
4. Exibir um resumo da operação

### Via SQL
```bash
# Conectar ao banco de dados e executar
mysql -u app_user -p auditoria_db < database/09-create-comunicacoes.sql
```

## Interface de Usuário

A interface de gerenciamento de comunicações está disponível no menu principal:

**Menu** → **Gerenciamento** → **Comunicação**

### Funcionalidades
- ✅ Visualização em tabela com busca
- ✅ Criação de novos registros
- ✅ Edição inline
- ✅ Exclusão
- ✅ Filtros por tipo
- ✅ Badges coloridos por tipo (Síncrono/Assíncrono/Ambos)
- ✅ Chips de tecnologias

### Validações da UI
- Campo sigla obrigatório
- Pelo menos 1 tecnologia deve ser selecionada
- Tipo obrigatório
- Uso Típico obrigatório e limitado a 120 caracteres (contador visual)

## Casos de Uso

### 1. Inventário de Padrões de Integração
Manter registro de todos os padrões de comunicação utilizados na organização para:
- Padronização arquitetural
- Governança de integrações
- Onboarding de novos desenvolvedores

### 2. Análise de Tecnologias
Identificar quais tecnologias são mais utilizadas em cada tipo de comunicação:
- Mapear dependências de tecnologias específicas
- Planejar migrações tecnológicas
- Avaliar obsolescência

### 3. Documentação de Arquitetura
Documentar os padrões disponíveis e recomendados para:
- Novos projetos de integração
- Modernização de integrações legadas
- Decisões arquiteturais

### 4. Governança de Integrações
Estabelecer guidelines sobre quando usar cada padrão:
- Comunicação síncrona vs assíncrona
- Escolha de tecnologias
- Trade-offs de desempenho e complexidade

## Manutenção

### Adicionar Nova Tecnologia
Para adicionar uma nova opção de tecnologia:

1. Atualizar `src/lib/types.ts`:
```typescript
export type TecnologiaComunicacao = 
  | 'HTTP/JSON' 
  | 'HTTP'
  | ... 
  | 'NOVA_TECNOLOGIA';
```

2. Atualizar `src/components/comunicacao/ComunicacaoForm.tsx`:
```typescript
const tecnologiasDisponiveis: TecnologiaComunicacao[] = [
  'HTTP/JSON', 'HTTP', ..., 'NOVA_TECNOLOGIA'
];
```

### Adicionar Novo Tipo
Para adicionar um novo tipo de comunicação:

1. Atualizar `src/lib/types.ts`:
```typescript
export type TipoComunicacao = 
  | 'Sincrono' 
  | 'Assincrono' 
  | 'Ambos'
  | 'NOVO_TIPO';
```

2. Atualizar enum no banco de dados:
```sql
ALTER TABLE comunicacoes 
MODIFY COLUMN tipo ENUM('Sincrono', 'Assincrono', 'Ambos', 'NOVO_TIPO');
```

## Troubleshooting

### Erro ao criar: "Comunicação já existe"
- **Causa**: Já existe uma comunicação com a mesma sigla
- **Solução**: Use uma sigla diferente ou edite a comunicação existente

### Erro: "Campo usoTipico não pode ter mais de 120 caracteres"
- **Causa**: Texto do uso típico excede o limite
- **Solução**: Reduza a descrição para no máximo 120 caracteres

### Script de carga falha: "API não está acessível"
- **Causa**: Servidor não está rodando ou está em porta diferente
- **Solução**: 
  - Verifique se o servidor está rodando: `docker-compose ps`
  - Configure a variável de ambiente: `export API_URL=http://localhost:3000`

## Histórico de Versões

### v1.0.0 - 2024-01-XX
- ✨ Implementação inicial do módulo de Comunicações
- ✅ CRUD completo (API + UI)
- ✅ 16 tecnologias suportadas
- ✅ 3 tipos de comunicação (Síncrono, Assíncrono, Ambos)
- ✅ Carga inicial com 12 registros padrão
- ✅ Documentação completa
