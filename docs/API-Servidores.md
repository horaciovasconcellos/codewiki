# API de Servidores

Documentação completa da API REST para gestão de servidores físicos, virtuais e cloud.

## Informações Gerais

### Base URL

```
http://localhost:3000/api
```

### Formato

Todas as requisições e respostas utilizam JSON.

### Headers

```http
Content-Type: application/json
```

---

## Endpoints

### 1. Listar Todos os Servidores

Lista todos os servidores cadastrados.

```http
GET /api/servidores
```

**Resposta (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "sigla": "SRV-WEB-01",
    "hostname": "web-server-01.domain.com",
    "tipo": "Virtual",
    "ambiente": "Produção",
    "finalidade": "Aplicação",
    "status": "Ativo",
    "provedor": "AWS",
    "datacenterRegiao": "us-east-1",
    "zonaAvailability": "us-east-1a",
    "clusterHost": null,
    "virtualizador": "VMware",
    "sistemaOperacional": "Ubuntu",
    "distribuicaoVersao": "22.04 LTS",
    "arquitetura": "x86_64",
    "ferramentaMonitoramento": "Zabbix",
    "backupDiario": true,
    "backupSemanal": true,
    "backupMensal": false,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Exemplo cURL:**

```bash
curl -X GET http://localhost:3000/api/servidores \
  -H "Content-Type: application/json"
```

**Exemplo JavaScript:**

```javascript
const response = await fetch('http://localhost:3000/api/servidores');
const servidores = await response.json();
console.log(servidores);
```

---

### 2. Obter Servidor por ID

Retorna os detalhes de um servidor específico.

```http
GET /api/servidores/:id
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| id | UUID | ID único do servidor |

**Resposta (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "sigla": "SRV-WEB-01",
  "hostname": "web-server-01.domain.com",
  "tipo": "Virtual",
  "ambiente": "Produção",
  "finalidade": "Aplicação",
  "status": "Ativo",
  "provedor": "AWS",
  "datacenterRegiao": "us-east-1",
  "zonaAvailability": "us-east-1a",
  "clusterHost": null,
  "virtualizador": "VMware",
  "sistemaOperacional": "Ubuntu",
  "distribuicaoVersao": "22.04 LTS",
  "arquitetura": "x86_64",
  "ferramentaMonitoramento": "Zabbix",
  "backupDiario": true,
  "backupSemanal": true,
  "backupMensal": false,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Resposta (404):**

```json
{
  "error": "Servidor não encontrado",
  "code": "NOT_FOUND"
}
```

**Exemplo cURL:**

```bash
curl -X GET http://localhost:3000/api/servidores/550e8400-e29b-41d4-a716-446655440001 \
  -H "Content-Type: application/json"
```

---

### 3. Criar Novo Servidor

Cria um novo servidor no sistema.

```http
POST /api/servidores
```

**Payload:**

```json
{
  "sigla": "SRV-DB-01",
  "hostname": "db-server-01.domain.com",
  "tipo": "Virtual",
  "ambiente": "Produção",
  "finalidade": "Banco de Dados",
  "status": "Ativo",
  "provedor": "Azure",
  "datacenterRegiao": "eastus",
  "zonaAvailability": "zone-1",
  "clusterHost": "cluster-prod-01",
  "virtualizador": "Hyper-V",
  "sistemaOperacional": "Windows Server",
  "distribuicaoVersao": "2022 Standard",
  "arquitetura": "x86_64",
  "ferramentaMonitoramento": "Prometheus",
  "backupDiario": true,
  "backupSemanal": true,
  "backupMensal": true
}
```

**Campos Obrigatórios:**

| Campo | Tipo | Descrição | Valores Aceitos |
|-------|------|-----------|-----------------|
| sigla | String(20) | Identificador único do servidor | Alfanumérico com hífen |
| hostname | String(50) | Nome completo do host | FQDN ou nome local |
| tipo | String | Tipo do servidor | "Físico", "Virtual", "Cloud" |
| ambiente | String | Ambiente de execução | "Desenvolvimento", "Homologação", "Produção", "Teste" |
| finalidade | String | Propósito do servidor | "Aplicação", "Banco de Dados", "Proxy", "Load Balancer", etc. |
| provedor | String | Provedor de infraestrutura | "On-Premise", "AWS", "Azure", "GCP", "Oracle Cloud" |
| sistemaOperacional | String | Sistema operacional | "Ubuntu", "CentOS", "Red Hat", "Windows Server", etc. |

**Campos Opcionais:**

| Campo | Tipo | Descrição | Padrão |
|-------|------|-----------|--------|
| status | String | Status operacional | "Ativo" |
| datacenterRegiao | String | Região do datacenter | null |
| zonaAvailability | String | Zona de disponibilidade | null |
| clusterHost | String | Cluster ou host físico | null |
| virtualizador | String | Tecnologia de virtualização | null |
| distribuicaoVersao | String | Versão da distribuição/SO | null |
| arquitetura | String | Arquitetura do processador | null |
| ferramentaMonitoramento | String | Ferramenta de monitoramento | null |
| backupDiario | Boolean | Backup diário habilitado | false |
| backupSemanal | Boolean | Backup semanal habilitado | false |
| backupMensal | Boolean | Backup mensal habilitado | false |

**Resposta (201):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "SRV-DB-01",
  "hostname": "db-server-01.domain.com",
  "tipo": "Virtual",
  "ambiente": "Produção",
  "finalidade": "Banco de Dados",
  "status": "Ativo",
  "provedor": "Azure",
  "datacenterRegiao": "eastus",
  "zonaAvailability": "zone-1",
  "clusterHost": "cluster-prod-01",
  "virtualizador": "Hyper-V",
  "sistemaOperacional": "Windows Server",
  "distribuicaoVersao": "2022 Standard",
  "arquitetura": "x86_64",
  "ferramentaMonitoramento": "Prometheus",
  "backupDiario": true,
  "backupSemanal": true,
  "backupMensal": true,
  "created_at": "2024-12-22T14:30:00.000Z",
  "updated_at": "2024-12-22T14:30:00.000Z"
}
```

**Resposta (400) - Campos faltando:**

```json
{
  "error": "Campos obrigatórios: sigla, hostname, tipo, ambiente, finalidade, provedor, sistemaOperacional",
  "code": "MISSING_FIELDS"
}
```

**Resposta (409) - Sigla duplicada:**

```json
{
  "error": "Servidor com esta sigla já existe",
  "code": "DUPLICATE_SIGLA"
}
```

**Exemplo cURL:**

```bash
curl -X POST http://localhost:3000/api/servidores \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "SRV-DB-01",
    "hostname": "db-server-01.domain.com",
    "tipo": "Virtual",
    "ambiente": "Produção",
    "finalidade": "Banco de Dados",
    "provedor": "Azure",
    "sistemaOperacional": "Windows Server",
    "backupDiario": true
  }'
```

**Exemplo JavaScript:**

```javascript
const novoServidor = {
  sigla: 'SRV-DB-01',
  hostname: 'db-server-01.domain.com',
  tipo: 'Virtual',
  ambiente: 'Produção',
  finalidade: 'Banco de Dados',
  provedor: 'Azure',
  sistemaOperacional: 'Windows Server',
  backupDiario: true
};

const response = await fetch('http://localhost:3000/api/servidores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoServidor)
});

const servidor = await response.json();
console.log(servidor);
```

---

### 4. Atualizar Servidor

Atualiza as informações de um servidor existente.

```http
PUT /api/servidores/:id
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| id | UUID | ID único do servidor |

**Payload:**

```json
{
  "sigla": "SRV-DB-01",
  "hostname": "db-server-01-updated.domain.com",
  "tipo": "Virtual",
  "ambiente": "Produção",
  "finalidade": "Banco de Dados",
  "status": "Manutenção",
  "provedor": "Azure",
  "datacenterRegiao": "eastus2",
  "zonaAvailability": "zone-2",
  "clusterHost": "cluster-prod-02",
  "virtualizador": "Hyper-V",
  "sistemaOperacional": "Windows Server",
  "distribuicaoVersao": "2022 Datacenter",
  "arquitetura": "x86_64",
  "ferramentaMonitoramento": "Zabbix",
  "backupDiario": true,
  "backupSemanal": true,
  "backupMensal": true
}
```

**Resposta (200):**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "SRV-DB-01",
  "hostname": "db-server-01-updated.domain.com",
  "tipo": "Virtual",
  "ambiente": "Produção",
  "finalidade": "Banco de Dados",
  "status": "Manutenção",
  "provedor": "Azure",
  "datacenterRegiao": "eastus2",
  "zonaAvailability": "zone-2",
  "clusterHost": "cluster-prod-02",
  "virtualizador": "Hyper-V",
  "sistemaOperacional": "Windows Server",
  "distribuicaoVersao": "2022 Datacenter",
  "arquitetura": "x86_64",
  "ferramentaMonitoramento": "Zabbix",
  "backupDiario": true,
  "backupSemanal": true,
  "backupMensal": true,
  "created_at": "2024-12-22T14:30:00.000Z",
  "updated_at": "2024-12-22T15:45:00.000Z"
}
```

**Resposta (404):**

```json
{
  "error": "Servidor não encontrado",
  "code": "NOT_FOUND"
}
```

**Exemplo cURL:**

```bash
curl -X PUT http://localhost:3000/api/servidores/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "SRV-DB-01",
    "hostname": "db-server-01-updated.domain.com",
    "tipo": "Virtual",
    "ambiente": "Produção",
    "finalidade": "Banco de Dados",
    "status": "Manutenção",
    "provedor": "Azure",
    "sistemaOperacional": "Windows Server"
  }'
```

---

### 5. Excluir Servidor

Remove um servidor do sistema.

```http
DELETE /api/servidores/:id
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| id | UUID | ID único do servidor |

**Resposta (204):**

Sem conteúdo (sucesso).

**Resposta (404):**

```json
{
  "error": "Servidor não encontrado",
  "code": "NOT_FOUND"
}
```

**Exemplo cURL:**

```bash
curl -X DELETE http://localhost:3000/api/servidores/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json"
```

---

## Aplicações do Servidor

### 6. Listar Aplicações de um Servidor

Lista todas as aplicações hospedadas em um servidor específico.

```http
GET /api/servidores/:servidorId/aplicacoes
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| servidorId | UUID | ID único do servidor |

**Resposta (200):**

```json
[
  {
    "id": "app-serv-001",
    "servidorId": "550e8400-e29b-41d4-a716-446655440001",
    "aplicacaoId": "app-123",
    "siglaAplicacao": "PORTAL",
    "nomeAplicacao": "Portal Institucional",
    "porta": 8080,
    "caminho": "/var/www/portal",
    "usuario": "www-data",
    "serviceName": "portal.service",
    "startCommand": "npm start",
    "stopCommand": "npm stop",
    "observacoes": "Aplicação principal do portal",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

**Exemplo cURL:**

```bash
curl -X GET http://localhost:3000/api/servidores/550e8400-e29b-41d4-a716-446655440001/aplicacoes \
  -H "Content-Type: application/json"
```

---

### 7. Adicionar Aplicação ao Servidor

Associa uma aplicação a um servidor.

```http
POST /api/servidores/:servidorId/aplicacoes
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| servidorId | UUID | ID único do servidor |

**Payload:**

```json
{
  "aplicacaoId": "app-456",
  "porta": 3000,
  "caminho": "/opt/app",
  "usuario": "appuser",
  "serviceName": "myapp.service",
  "startCommand": "npm start",
  "stopCommand": "npm stop",
  "observacoes": "API REST principal"
}
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| aplicacaoId | UUID | Sim | ID da aplicação |
| porta | Integer | Não | Porta de execução |
| caminho | String | Não | Caminho no servidor |
| usuario | String | Não | Usuário de execução |
| serviceName | String | Não | Nome do serviço |
| startCommand | String | Não | Comando de inicialização |
| stopCommand | String | Não | Comando de parada |
| observacoes | String | Não | Observações adicionais |

**Resposta (201):**

```json
{
  "id": "app-serv-002",
  "servidorId": "550e8400-e29b-41d4-a716-446655440001",
  "aplicacaoId": "app-456",
  "porta": 3000,
  "caminho": "/opt/app",
  "usuario": "appuser",
  "serviceName": "myapp.service",
  "startCommand": "npm start",
  "stopCommand": "npm stop",
  "observacoes": "API REST principal",
  "created_at": "2024-12-22T16:00:00.000Z"
}
```

**Exemplo cURL:**

```bash
curl -X POST http://localhost:3000/api/servidores/550e8400-e29b-41d4-a716-446655440001/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "aplicacaoId": "app-456",
    "porta": 3000,
    "caminho": "/opt/app",
    "usuario": "appuser",
    "serviceName": "myapp.service"
  }'
```

---

### 8. Remover Todas as Aplicações de um Servidor

Remove todas as aplicações associadas a um servidor.

```http
DELETE /api/servidores/:servidorId/aplicacoes
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| servidorId | UUID | ID único do servidor |

**Resposta (204):**

Sem conteúdo (sucesso).

**Exemplo cURL:**

```bash
curl -X DELETE http://localhost:3000/api/servidores/550e8400-e29b-41d4-a716-446655440001/aplicacoes \
  -H "Content-Type: application/json"
```

---

### 9. Remover uma Aplicação Específica do Servidor

Remove uma aplicação específica de um servidor.

```http
DELETE /api/servidores/:servidorId/aplicacoes/:id
```

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| servidorId | UUID | ID único do servidor |
| id | UUID | ID da aplicação no servidor |

**Resposta (204):**

Sem conteúdo (sucesso).

**Exemplo cURL:**

```bash
curl -X DELETE http://localhost:3000/api/servidores/550e8400-e29b-41d4-a716-446655440001/aplicacoes/app-serv-002 \
  -H "Content-Type: application/json"
```

---

## Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| 400 | MISSING_FIELDS | Campos obrigatórios faltando |
| 404 | NOT_FOUND | Servidor não encontrado |
| 409 | DUPLICATE_SIGLA | Sigla já existe |
| 500 | DATABASE_ERROR | Erro no banco de dados |

---

## Valores Aceitos

### Tipo de Servidor

- **Físico** - Servidor físico dedicado
- **Virtual** - Máquina virtual
- **Cloud** - Instância cloud

### Ambiente

- **Desenvolvimento** - Ambiente de desenvolvimento
- **Teste** - Ambiente de testes
- **Homologação** - Ambiente de homologação
- **Produção** - Ambiente de produção

### Finalidade

- **Aplicação** - Hospedagem de aplicações
- **Banco de Dados** - Servidor de banco de dados
- **Proxy** - Servidor proxy
- **Load Balancer** - Balanceador de carga
- **File Server** - Servidor de arquivos
- **DNS** - Servidor DNS
- **DHCP** - Servidor DHCP
- **Web** - Servidor web
- **API** - Servidor de APIs

### Status

- **Ativo** - Servidor em operação
- **Inativo** - Servidor desligado
- **Manutenção** - Em manutenção
- **Descomissionado** - Servidor desativado

### Provedor

- **On-Premise** - Infraestrutura própria
- **AWS** - Amazon Web Services
- **Azure** - Microsoft Azure
- **GCP** - Google Cloud Platform
- **Oracle Cloud** - Oracle Cloud Infrastructure
- **IBM Cloud** - IBM Cloud
- **DigitalOcean** - DigitalOcean

### Virtualizador

- **VMware** - VMware vSphere/ESXi
- **Hyper-V** - Microsoft Hyper-V
- **KVM** - Kernel-based Virtual Machine
- **Xen** - Xen Hypervisor
- **VirtualBox** - Oracle VirtualBox
- **Docker** - Docker Containers
- **Kubernetes** - Kubernetes Orchestrator

### Sistema Operacional

- **Ubuntu** - Ubuntu Linux
- **CentOS** - CentOS Linux
- **Red Hat** - Red Hat Enterprise Linux
- **Debian** - Debian Linux
- **Windows Server** - Microsoft Windows Server
- **Alpine** - Alpine Linux
- **Oracle Linux** - Oracle Linux

### Ferramenta de Monitoramento

- **Zabbix** - Zabbix Monitoring
- **Prometheus** - Prometheus + Grafana
- **Nagios** - Nagios Core
- **Datadog** - Datadog APM
- **New Relic** - New Relic Infrastructure
- **AWS CloudWatch** - Amazon CloudWatch
- **Azure Monitor** - Azure Monitor

---

## Exemplos Completos

### Exemplo 1: Criar Servidor Cloud AWS

```javascript
const servidorAWS = {
  sigla: 'EC2-PROD-01',
  hostname: 'ec2-52-201-123-45.compute-1.amazonaws.com',
  tipo: 'Cloud',
  ambiente: 'Produção',
  finalidade: 'Aplicação',
  status: 'Ativo',
  provedor: 'AWS',
  datacenterRegiao: 'us-east-1',
  zonaAvailability: 'us-east-1a',
  sistemaOperacional: 'Ubuntu',
  distribuicaoVersao: '22.04 LTS',
  arquitetura: 'x86_64',
  ferramentaMonitoramento: 'AWS CloudWatch',
  backupDiario: true,
  backupSemanal: true,
  backupMensal: false
};

const response = await fetch('http://localhost:3000/api/servidores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(servidorAWS)
});

const servidor = await response.json();
console.log('Servidor criado:', servidor);
```

### Exemplo 2: Listar e Filtrar Servidores por Ambiente

```javascript
const response = await fetch('http://localhost:3000/api/servidores');
const servidores = await response.json();

// Filtrar por ambiente de produção
const servidoresProducao = servidores.filter(s => s.ambiente === 'Produção');
console.log(`Total de servidores em produção: ${servidoresProducao.length}`);

// Filtrar por provedor
const servidoresAWS = servidores.filter(s => s.provedor === 'AWS');
console.log(`Servidores AWS: ${servidoresAWS.length}`);

// Filtrar por tipo
const servidoresVirtuais = servidores.filter(s => s.tipo === 'Virtual');
console.log(`Servidores virtuais: ${servidoresVirtuais.length}`);
```

### Exemplo 3: Associar Aplicação ao Servidor

```javascript
const servidorId = '550e8400-e29b-41d4-a716-446655440001';
const aplicacaoServidor = {
  aplicacaoId: 'app-123',
  porta: 8080,
  caminho: '/var/www/app',
  usuario: 'www-data',
  serviceName: 'myapp.service',
  startCommand: 'systemctl start myapp',
  stopCommand: 'systemctl stop myapp',
  observacoes: 'Aplicação principal do sistema'
};

const response = await fetch(
  `http://localhost:3000/api/servidores/${servidorId}/aplicacoes`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aplicacaoServidor)
  }
);

const resultado = await response.json();
console.log('Aplicação associada:', resultado);
```

---

## Scripts de Teste

### Script 1: Teste Completo CRUD

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"

echo "=== Teste CRUD de Servidores ==="

# 1. Criar servidor
echo -e "\n1. Criando servidor..."
SERVIDOR_ID=$(curl -s -X POST "$API_URL/servidores" \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "TEST-SRV-01",
    "hostname": "test-server.local",
    "tipo": "Virtual",
    "ambiente": "Teste",
    "finalidade": "Aplicação",
    "provedor": "On-Premise",
    "sistemaOperacional": "Ubuntu"
  }' | jq -r '.id')

echo "Servidor criado com ID: $SERVIDOR_ID"

# 2. Listar todos
echo -e "\n2. Listando todos os servidores..."
curl -s -X GET "$API_URL/servidores" | jq '.[] | {sigla, hostname, ambiente}'

# 3. Buscar por ID
echo -e "\n3. Buscando servidor por ID..."
curl -s -X GET "$API_URL/servidores/$SERVIDOR_ID" | jq '.'

# 4. Atualizar
echo -e "\n4. Atualizando servidor..."
curl -s -X PUT "$API_URL/servidores/$SERVIDOR_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "TEST-SRV-01",
    "hostname": "test-server-updated.local",
    "tipo": "Virtual",
    "ambiente": "Homologação",
    "finalidade": "Aplicação",
    "status": "Manutenção",
    "provedor": "On-Premise",
    "sistemaOperacional": "Ubuntu"
  }' | jq '.'

# 5. Excluir
echo -e "\n5. Excluindo servidor..."
curl -s -X DELETE "$API_URL/servidores/$SERVIDOR_ID"
echo "Servidor excluído"

echo -e "\n=== Teste completo ==="
```

### Script 2: Teste de Aplicações no Servidor

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
SERVIDOR_ID="seu-servidor-id-aqui"

echo "=== Teste de Aplicações no Servidor ==="

# 1. Adicionar aplicação
echo -e "\n1. Adicionando aplicação ao servidor..."
curl -X POST "$API_URL/servidores/$SERVIDOR_ID/aplicacoes" \
  -H "Content-Type: application/json" \
  -d '{
    "aplicacaoId": "app-test-001",
    "porta": 3000,
    "caminho": "/opt/test-app",
    "usuario": "appuser",
    "serviceName": "test-app.service"
  }'

# 2. Listar aplicações do servidor
echo -e "\n2. Listando aplicações do servidor..."
curl -s -X GET "$API_URL/servidores/$SERVIDOR_ID/aplicacoes" | jq '.'

# 3. Remover aplicações
echo -e "\n3. Removendo todas as aplicações..."
curl -X DELETE "$API_URL/servidores/$SERVIDOR_ID/aplicacoes"
echo "Aplicações removidas"

echo -e "\n=== Teste completo ==="
```

---

## Notas Importantes

1. **IDs**: Todos os IDs são gerados automaticamente no formato UUID v4
2. **Timestamps**: `created_at` e `updated_at` são gerenciados automaticamente pelo banco
3. **Validação**: A sigla do servidor deve ser única no sistema
4. **Backup**: Os campos de backup (`backupDiario`, `backupSemanal`, `backupMensal`) são booleanos
5. **Relacionamentos**: Um servidor pode ter múltiplas aplicações associadas
6. **Soft Delete**: Não há soft delete - a exclusão é permanente
7. **Ordenação**: Por padrão, servidores são ordenados por sigla

---

## Versionamento

- **Versão atual**: 1.0
- **Última atualização**: 22 de dezembro de 2025
- **Compatibilidade**: Node.js 18+, MySQL 8.0+

---

## Suporte

Para questões ou problemas relacionados à API, consulte:

- [Documentação Geral](./api-referencia.md)
- [Guia de Desenvolvimento](./desenvolvimento.md)
- [Exemplos de Uso](./API-Bulk-Load-Aplicacoes.md)
