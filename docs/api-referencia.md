# Referência de API

Documentação completa das APIs REST do Sistema de Auditoria.

## Informações Gerais

### Base URL

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3000/api` |
| Produção | `https://seu-dominio.com/api` |

### Portas

- Frontend (Vite): `http://localhost:5173`
- Backend (API): `http://localhost:3000`
- MySQL Master: `localhost:3306`
- MySQL Slave: `localhost:3307`

### Formato

Todas as requisições e respostas utilizam JSON.

### Headers

```http
Content-Type: application/json
Authorization: Bearer {token}  # Quando autenticação configurada
```

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 204 | No Content - Sucesso sem corpo de resposta |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Autenticação necessária |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito de dados (duplicação) |
| 422 | Unprocessable Entity - Validação falhou |
| 500 | Internal Server Error - Erro no servidor |

---

## Tipos de Afastamento

### Listar Todos

```http
GET /api/tipos-afastamento
```

**Resposta (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  }
]
```

### Obter por ID

```http
GET /api/tipos-afastamento/:id
```

### Criar

```http
POST /api/tipos-afastamento
```

**Payload:**

```json
{
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 20,
  "tipoTempo": "C"
}
```

**Validações:**

- `sigla`: Regex `^[A-Za-z0-9-]{2,10}$`, única
- `descricao`: Máximo 50 caracteres
- `argumentacaoLegal`: Máximo 60 caracteres
- `numeroDias`: Entre 1 e 99
- `tipoTempo`: "C" (Consecutivo) ou "N" (Não consecutivo)

### Atualizar

```http
PUT /api/tipos-afastamento/:id
```

### Excluir

```http
DELETE /api/tipos-afastamento/:id
```

---

## Colaboradores

### Listar Todos

```http
GET /api/colaboradores
```

**Resposta (200):**

```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440001",
    "matricula": "5664",
    "nome": "João Silva",
    "setor": "TI",
    "dataAdmissao": "2020-01-15",
    "dataDemissao": null,
    "status": "Ativo",
    "habilidades": [],
    "afastamentos": []
  }
]
```

### Obter por ID (com detalhes)

```http
GET /api/colaboradores/:id
```

**Resposta (200):**

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440001",
  "matricula": "5664",
  "nome": "João Silva",
  "setor": "TI",
  "dataAdmissao": "2020-01-15",
  "dataDemissao": null,
  "status": "Ativo",
  "habilidades": [
    {
      "id": "hab-001",
      "habilidadeId": "770e8400-e29b-41d4-a716-446655440001",
      "nivelDeclarado": "Avançado",
      "nivelAvaliado": "Intermediário",
      "dataInicio": "2023-01-01",
      "dataTermino": null
    }
  ],
  "afastamentos": [
    {
      "id": "afa-001",
      "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
      "dataInicialProvavel": "2025-01-15",
      "dataFinalProvavel": "2025-02-15",
      "dataInicialEfetiva": "2025-01-15",
      "dataFinalEfetiva": "2025-02-10"
    }
  ]
}
```

### Criar

```http
POST /api/colaboradores
```

**Payload:**

```json
{
  "matricula": "9876",
  "nome": "Maria Santos",
  "setor": "RH",
  "dataAdmissao": "2025-01-01",
  "dataDemissao": null,
  "habilidades": [
    {
      "habilidadeId": "770e8400-e29b-41d4-a716-446655440001",
      "nivelDeclarado": "Avançado",
      "nivelAvaliado": "Avançado",
      "dataInicio": "2025-01-01",
      "dataTermino": null
    }
  ],
  "afastamentos": [
    {
      "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
      "dataInicialProvavel": "2025-07-01",
      "dataFinalProvavel": "2025-07-30"
    }
  ]
}
```

**Validações:**

- `matricula`: Única, obrigatória
- `dataAdmissao`: Obrigatória, formato ISO (YYYY-MM-DD)
- `dataDemissao`: Opcional, posterior à admissão
- `habilidades`: Não duplicadas para mesmo colaborador
- `afastamentos`: Data final posterior à inicial

### Atualizar

```http
PUT /api/colaboradores/:id
```

### Excluir

```http
DELETE /api/colaboradores/:id
```

---

## Habilidades

### Listar Todas

```http
GET /api/habilidades
```

**Resposta (200):**

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "sigla": "JAVA-DEV",
    "descricao": "Desenvolvimento Java",
    "dominio": "Técnica",
    "subcategoria": "Backend"
  }
]
```

### Criar

```http
POST /api/habilidades
```

**Payload:**

```json
{
  "sigla": "REACT-DEV",
  "descricao": "Desenvolvimento React",
  "dominio": "Técnica",
  "subcategoria": "Frontend"
}
```

**Domínios válidos:**
- `Técnica`
- `Comportamental`
- `Gestão`
- `Negócio`
- `Segurança`
- `DevOps`

---

## Aplicações

### Listar Todas

```http
GET /api/aplicacoes
```

**Resposta (200):**

```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440001",
    "sigla": "SISAUD",
    "descricao": "Sistema de Auditoria",
    "criticidade": "Alta",
    "custoMensal": 5000.00,
    "capacidades": [],
    "slas": []
  }
]
```

### Criar

```http
POST /api/aplicacoes
```

**Payload:**

```json
{
  "sigla": "PORTAL",
  "descricao": "Portal Corporativo",
  "criticidade": "Alta",
  "custoMensal": 8000.00,
  "capacidades": ["660e8400-e29b-41d4-a716-446655440001"],
  "slas": ["cc0e8400-e29b-41d4-a716-446655440001"]
}
```

**Criticidades válidas:**
- `Baixa`
- `Média`
- `Alta`
- `Crítica`

---

## Tecnologias

### Listar Todas

```http
GET /api/tecnologias
```

**Resposta (200):**

```json
[
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440001",
    "nome": "Oracle Database",
    "versao": "19c",
    "responsavelTecnico": "João Silva",
    "responsavelNegocio": "Maria Santos",
    "tipoContrato": "Licenciamento",
    "custoMensal": 15000.00,
    "dataRenovacao": "2025-12-31"
  }
]
```

### Criar

```http
POST /api/tecnologias
```

**Payload:**

```json
{
  "nome": "PostgreSQL",
  "versao": "15",
  "responsavelTecnico": "Pedro Costa",
  "responsavelNegocio": "Ana Lima",
  "tipoContrato": "Open Source",
  "custoMensal": 0,
  "dataRenovacao": null,
  "documentacao": "https://wiki.empresa.com/postgres"
}
```

---

## Processos de Negócio

### Listar Todos

```http
GET /api/processos-negocio
```

**Resposta (200):**

```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440001",
    "nome": "Onboarding de Colaboradores",
    "descricao": "Processo de integração de novos funcionários",
    "normativas": "ISO 9001, Política Interna RH-001",
    "responsavel": "Departamento de RH",
    "criticidade": "Alta",
    "complexidade": "Média"
  }
]
```

### Criar

```http
POST /api/processos-negocio
```

**Criticidades:**
- `Baixa`, `Média`, `Alta`, `Crítica`

**Complexidades:**
- `Baixa`, `Média`, `Alta`

---

## SLAs

### Listar Todos

```http
GET /api/slas
```

**Resposta (200):**

```json
[
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440001",
    "nome": "SLA Disponibilidade 99.9%",
    "descricao": "Garantia de 99.9% de uptime",
    "metricas": {
      "disponibilidade": 99.9,
      "tempoResposta": 200
    },
    "penalidades": "Crédito de 10% por hora de indisponibilidade",
    "dataInicio": "2025-01-01",
    "dataTermino": "2025-12-31"
  }
]
```

### Criar

```http
POST /api/slas
```

**Payload:**

```json
{
  "nome": "SLA Performance",
  "descricao": "Tempo de resposta máximo de 500ms",
  "metricas": {
    "tempoResposta": 500,
    "disponibilidade": 99.5
  },
  "penalidades": "Multa de R$ 1000 por violação",
  "bonificacoes": "Bônus de R$ 500 por mês sem violações",
  "dataInicio": "2025-01-01",
  "dataTermino": "2026-01-01"
}
```

---

## Capacidades de Negócio

### Listar Todas

```http
GET /api/capacidades-negocio
```

### Criar

```http
POST /api/capacidades-negocio
```

**Payload:**

```json
{
  "sigla": "CAP-FIN-001",
  "nome": "Gestão Financeira",
  "descricao": "Capacidade de gestão e controle financeiro",
  "nivel": "Nível 1",
  "categoria": "Financeiro",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinhamento com estratégia de redução de custos",
    "beneficiosEsperados": "Redução de 15% nos custos operacionais",
    "estadoFuturoDesejado": "Sistema integrado de gestão financeira",
    "gapEstadoAtualFuturo": "Sistema atual fragmentado e manual"
  }
}
```

**Níveis:**
- `Nível 1`, `Nível 2`, `Nível 3`

**Categorias:**
- `Financeiro`, `RH`, `Logística`, `Atendimento`, `Produção`, `Comercial`

---

## Runbooks

### Listar Todos

```http
GET /api/runbooks
```

### Criar

```http
POST /api/runbooks
```

**Payload:**

```json
{
  "titulo": "Troubleshooting Database Connection",
  "descricao": "Procedimento para resolver problemas de conexão",
  "procedimentos": "1. Verificar status do serviço\n2. Checar credenciais\n3. Validar rede",
  "tecnologiaId": "dd0e8400-e29b-41d4-a716-446655440001",
  "versao": "1.0"
}
```

---

## Gerador de Estruturas de Projeto

### Gerar Estrutura

```http
POST /api/estruturas-projeto/gerar
```

**Payload:**

```json
{
  "produto": "SISAUD",
  "projeto": "Modernização Backend",
  "dataInicial": "2025-01-15",
  "iteracao": 1,
  "shareQueries": true,
  "configurarMaven": true,
  "configurarLiquibase": false,
  "repositorios": [
    {
      "produto": "SISAUD",
      "categoria": "backend",
      "tecnologia": "java"
    },
    {
      "produto": "SISAUD",
      "categoria": "frontend",
      "tecnologia": "react"
    }
  ]
}
```

**Resposta (201):**

```json
{
  "id": "proj-001",
  "estruturasCriadas": [
    "SISAUD-backend-java",
    "SISAUD-frontend-react"
  ],
  "componentesGerados": [
    "Share Queries configurado",
    "Maven configurado"
  ],
  "scriptExecutado": "git-azcesuc",
  "dataGeracao": "2025-01-15T10:30:00Z"
}
```

---

## Integração Azure DevOps

### Listar Work Items

```http
GET /api/azure-devops/work-items
```

**Query Parameters:**

- `project` (string): Nome do projeto
- `type` (string): Tipo de Work Item (Bug, Task, User Story)
- `state` (string): Estado (New, Active, Resolved, Closed)

**Resposta (200):**

```json
[
  {
    "id": 12345,
    "type": "User Story",
    "title": "Implementar tela de colaboradores",
    "state": "Active",
    "assignedTo": "João Silva",
    "createdDate": "2025-01-01T00:00:00Z"
  }
]
```

### Criar Work Item

```http
POST /api/azure-devops/work-items
```

**Payload:**

```json
{
  "project": "Sistema Auditoria",
  "type": "Task",
  "title": "Configurar replicação MySQL",
  "description": "Configurar ambiente de replicação Master-Slave",
  "assignedTo": "maria.santos@empresa.com",
  "iteration": "Sprint 1"
}
```

---

## Logs de Auditoria

### Listar Logs

```http
GET /api/logs
```

**Query Parameters:**

- `entity` (string): Entidade (colaboradores, tecnologias, etc.)
- `operation` (string): Operação (CREATE, UPDATE, DELETE)
- `userId` (string): ID do usuário
- `startDate` (string): Data inicial (ISO 8601)
- `endDate` (string): Data final (ISO 8601)
- `limit` (number): Limite de registros (padrão: 100)
- `offset` (number): Offset para paginação

**Resposta (200):**

```json
{
  "total": 250,
  "limit": 100,
  "offset": 0,
  "logs": [
    {
      "id": "log-001",
      "timestamp": "2025-01-15T10:30:00Z",
      "userId": "user-123",
      "operation": "CREATE",
      "entity": "colaboradores",
      "entityId": "aa0e8400-e29b-41d4-a716-446655440001",
      "changes": {
        "before": null,
        "after": {
          "matricula": "9876",
          "nome": "Maria Santos"
        }
      },
      "ipAddress": "192.168.1.10",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

---

## Tokens de Acesso

### Listar Tokens

```http
GET /api/tokens
```

### Criar Token

```http
POST /api/tokens
```

**Payload:**

```json
{
  "nome": "Token Integração Azure",
  "escopos": ["read:colaboradores", "write:work-items"],
  "dataExpiracao": "2026-01-15T00:00:00Z"
}
```

**Resposta (201):**

```json
{
  "id": "token-001",
  "nome": "Token Integração Azure",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "escopos": ["read:colaboradores", "write:work-items"],
  "dataCriacao": "2025-01-15T10:30:00Z",
  "dataExpiracao": "2026-01-15T00:00:00Z",
  "status": "Ativo"
}
```

### Revogar Token

```http
DELETE /api/tokens/:id
```

---

## Exemplos Completos

### Criar Colaborador com Habilidades e Afastamentos

```javascript
const response = await fetch('http://localhost:3000/api/colaboradores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGci...'
  },
  body: JSON.stringify({
    matricula: '9876',
    nome: 'Carlos Souza',
    setor: 'Desenvolvimento',
    dataAdmissao: '2025-01-15',
    habilidades: [
      {
        habilidadeId: 'java-dev-id',
        nivelDeclarado: 'Avançado',
        nivelAvaliado: 'Intermediário',
        dataInicio: '2025-01-15'
      },
      {
        habilidadeId: 'react-dev-id',
        nivelDeclarado: 'Intermediário',
        nivelAvaliado: 'Intermediário',
        dataInicio: '2025-01-15'
      }
    ],
    afastamentos: [
      {
        tipoAfastamentoId: 'ferias-id',
        dataInicialProvavel: '2025-07-01',
        dataFinalProvavel: '2025-07-30'
      }
    ]
  })
});

const colaborador = await response.json();
console.log('Colaborador criado:', colaborador.id);
```

### Gerar Estrutura de Projeto Completa

```bash
curl -X POST http://localhost:3000/api/estruturas-projeto/gerar \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGci...' \
  -d '{
    "produto": "PORTAL",
    "projeto": "Nova Versão",
    "dataInicial": "2025-02-01",
    "iteracao": 1,
    "shareQueries": true,
    "configurarMaven": true,
    "configurarLiquibase": true,
    "repositorios": [
      {
        "produto": "PORTAL",
        "categoria": "frontend",
        "tecnologia": "angular"
      },
      {
        "produto": "PORTAL",
        "categoria": "api",
        "tecnologia": "java"
      },
      {
        "produto": "PORTAL",
        "categoria": "etl",
        "tecnologia": "python"
      }
    ]
  }'
```

---

## Convenções de Nomenclatura

### Campos

API aceita **camelCase** ou **snake_case**:

```json
{
  "numeroDias": 30,       // ✅ camelCase
  "numero_dias": 30,      // ✅ snake_case
  "argumentacaoLegal": "...",  // ✅ camelCase
  "argumentacao_legal": "..."  // ✅ snake_case
}
```

### Datas

Sempre formato **ISO 8601**:

```
2025-01-15             // ✅ Data
2025-01-15T10:30:00Z   // ✅ Data e hora UTC
2025-01-15T10:30:00-03:00  // ✅ Data e hora com timezone
```

### IDs

UUIDs versão 4:

```
550e8400-e29b-41d4-a716-446655440001
```

---

## Tratamento de Erros

### Estrutura de Erro Padrão

```json
{
  "error": "Mensagem legível",
  "code": "CODIGO_ERRO",
  "details": [
    {
      "field": "campo",
      "message": "Descrição do erro"
    }
  ],
  "timestamp": "2025-01-15T10:30:00Z",
  "path": "/api/colaboradores"
}
```

### Códigos Comuns

| Código | Significado |
|--------|-------------|
| `VALIDATION_ERROR` | Dados inválidos |
| `NOT_FOUND` | Recurso não encontrado |
| `DUPLICATE_KEY` | Chave duplicada (sigla, matrícula) |
| `FOREIGN_KEY_VIOLATION` | Violação de integridade referencial |
| `UNAUTHORIZED` | Token inválido ou expirado |
| `FORBIDDEN` | Sem permissão para operação |
| `INTERNAL_ERROR` | Erro interno do servidor |

---

## Paginação

Endpoints de listagem suportam paginação:

```http
GET /api/colaboradores?limit=50&offset=100
```

**Resposta:**

```json
{
  "total": 250,
  "limit": 50,
  "offset": 100,
  "data": [...]
}
```

---

## Rate Limiting

| Plano | Requisições/minuto |
|-------|-------------------|
| Desenvolvimento | 100 |
| Produção | 1000 |

**Headers de resposta:**

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1642512000
```

---

## Próximos Passos

- 📖 Consulte as [funcionalidades detalhadas](funcionalidades.md)
- 🚀 Veja o [guia de primeiros passos](primeiros-passos.md)
- 🔌 Configure [integrações com Azure DevOps](integracao-azure-devops.md)
