# Documentação de APIs - Sistema de Auditoria

## Visão Geral

Este documento descreve todas as APIs REST disponíveis no Sistema de Auditoria para gerenciamento de colaboradores, tecnologias, processos de negócio, aplicações, SLAs, capacidades de negócio, habilidades, tipos de afastamento e integração com Azure DevOps.

**Base URL**: `http://localhost:3000/api` (desenvolvimento) ou `https://seu-dominio.com/api` (produção)

**Portas**:
- Frontend (Vite): `http://localhost:5173`
- Backend (API): `http://localhost:3000`

**Formato**: JSON

**Autenticação**: Bearer Token (quando configurado)

---

## Índice

1. [Tipos de Afastamento](#tipos-de-afastamento)
2. [Capacidades de Negócio](#capacidades-de-negócio)
3. [Habilidades](#habilidades)
4. [Processos de Negócio](#processos-de-negócio)
5. [Tecnologias](#tecnologias)
6. [SLAs](#slas)
7. [Colaboradores](#colaboradores)
8. [Aplicações](#aplicações)
9. [Runbooks](#runbooks)
10. [Estruturas de Projeto](#estruturas-de-projeto)
11. [Integrador de Projetos](#integrador-de-projetos)
12. [Configurações](#configurações)
13. [Logs de Auditoria](#logs-de-auditoria)
14. [Integração Azure DevOps](#integração-azure-devops)
15. [Scripts de Carga](#scripts-de-carga)
16. [Códigos de Status HTTP](#códigos-de-status-http)
17. [Exemplos de Uso](#exemplos-de-uso)

---

## Tipos de Afastamento

### Listar Todos os Tipos de Afastamento

Retorna todos os tipos de afastamento cadastrados no sistema.

**Endpoint**: `GET /api/tipos-afastamento`

**Headers**:
```
Content-Type: application/json
```

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "sigla": "LIC-MED",
    "descricao": "Licença Médica",
    "argumentacaoLegal": "Lei 8.213/1991 Art. 60",
    "numeroDias": 15,
    "tipoTempo": "C"
  }
]
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X GET \
  http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json'
```

---

### Obter Tipo de Afastamento por ID

Retorna um tipo de afastamento específico.

**Endpoint**: `GET /api/tipos-afastamento/:id`

**Parâmetros de URL**:
- `id` (string, obrigatório): UUID do tipo de afastamento

**Resposta de Sucesso** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
  "numeroDias": 30,
  "tipoTempo": "C"
}
```

**Resposta de Erro** (404 Not Found):
```json
{
  "error": "Tipo de afastamento não encontrado",
  "code": "NOT_FOUND"
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X GET \
  http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001 \
  -H 'Content-Type: application/json'
```

---

### Criar Tipo de Afastamento

Cria um novo tipo de afastamento.

**Endpoint**: `POST /api/tipos-afastamento`

**Headers**:
```
Content-Type: application/json
```

**Corpo da Requisição** (aceita camelCase ou snake_case):
```json
{
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 20,
  "tipoTempo": "C"
}
```

**OU** (formato snake_case):
```json
{
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade",
  "argumentacao_legal": "Lei 13.257/2016 Art. 38",
  "numero_dias": 20,
  "tipo_tempo": "C"
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla identificadora (2-15 caracteres alfanuméricos ou hífens)
- `descricao` (string, obrigatório): Descrição do tipo de afastamento (máx 50 caracteres)
- `argumentacaoLegal` ou `argumentacao_legal` (string, obrigatório): Base legal (máx 60 caracteres)
- `numeroDias` ou `numero_dias` (number, obrigatório): Número de dias do afastamento (1-99)
- `tipoTempo` ou `tipo_tempo` (string, obrigatório): Tipo de tempo - "C" (Corrido) ou "N" (Não corrido)

**Validações**:
- Sigla: Regex `/^[A-Za-z0-9-]{2,10}$/`
- Descrição: Máximo 50 caracteres
- Argumentação Legal: Máximo 60 caracteres
- Número de Dias: Entre 1 e 99
- Tipo Tempo: Apenas "C" ou "N"

**Resposta de Sucesso** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 20,
  "tipoTempo": "C"
}
```

**Resposta de Erro** (400 Bad Request):
```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "sigla",
      "message": "Sigla é obrigatória"
    }
  ]
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X POST \
  http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "LIC-PAT",
    "descricao": "Licença Paternidade",
    "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
    "numeroDias": 20,
    "tipoTempo": "C"
  }'
```

**Exemplo de Requisição (JavaScript/Fetch)**:
```javascript
const response = await fetch('http://localhost:5173/api/tipos-afastamento', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sigla: 'LIC-PAT',
    descricao: 'Licença Paternidade',
    argumentacaoLegal: 'Lei 13.257/2016 Art. 38',
    numeroDias: 20,
    tipoTempo: 'C'
  })
});

const data = await response.json();
console.log(data);
```

---

### Atualizar Tipo de Afastamento

Atualiza um tipo de afastamento existente.

**Endpoint**: `PUT /api/tipos-afastamento/:id`

**Parâmetros de URL**:
- `id` (string, obrigatório): UUID do tipo de afastamento

**Corpo da Requisição**:
```json
{
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade Estendida",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 25,
  "tipoTempo": "C"
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "sigla": "LIC-PAT",
  "descricao": "Licença Paternidade Estendida",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 25,
  "tipoTempo": "C"
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X PUT \
  http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440004 \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "LIC-PAT",
    "descricao": "Licença Paternidade Estendida",
    "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
    "numeroDias": 25,
    "tipoTempo": "C"
  }'
```

---

### Excluir Tipo de Afastamento

Exclui um tipo de afastamento.

**Endpoint**: `DELETE /api/tipos-afastamento/:id`

**Parâmetros de URL**:
- `id` (string, obrigatório): UUID do tipo de afastamento

**Resposta de Sucesso** (204 No Content)

**Resposta de Erro** (404 Not Found):
```json
{
  "error": "Tipo de afastamento não encontrado",
  "code": "NOT_FOUND"
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X DELETE \
  http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440004 \
  -H 'Content-Type: application/json'
```

---

## Capacidades de Negócio

### Listar Todas as Capacidades de Negócio

**Endpoint**: `GET /api/capacidades-negocio`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
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
]
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X GET \
  http://localhost:5173/api/capacidades-negocio \
  -H 'Content-Type: application/json'
```

---

### Criar Capacidade de Negócio

**Endpoint**: `POST /api/capacidades-negocio`

**Corpo da Requisição**:
```json
{
  "sigla": "CAP-RH-001",
  "nome": "Gestão de Talentos",
  "descricao": "Capacidade de recrutar e desenvolver colaboradores",
  "nivel": "Nível 1",
  "categoria": "RH",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinhamento com estratégia de retenção de talentos",
    "beneficiosEsperados": "Aumento de 20% na retenção",
    "estadoFuturoDesejado": "Plataforma digital de gestão de talentos",
    "gapEstadoAtualFuturo": "Processos manuais e descentralizados"
  }
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla identificadora
- `nome` (string, obrigatório): Nome da capacidade
- `descricao` (string, obrigatório): Descrição
- `nivel` (string, obrigatório): "Nível 1", "Nível 2" ou "Nível 3"
- `categoria` (string, obrigatório): "Financeiro", "RH", "Logística", "Atendimento", "Produção" ou "Comercial"
- `coberturaEstrategica` (object, obrigatório): Objeto com cobertura estratégica
  - `alinhamentoObjetivos` (string): Alinhamento com objetivos estratégicos
  - `beneficiosEsperados` (string): Benefícios esperados
  - `estadoFuturoDesejado` (string): Estado futuro desejado
  - `gapEstadoAtualFuturo` (string): Gap entre estado atual e futuro

**Resposta de Sucesso** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "sigla": "CAP-RH-001",
  "nome": "Gestão de Talentos",
  "descricao": "Capacidade de recrutar e desenvolver colaboradores",
  "nivel": "Nível 1",
  "categoria": "RH",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinhamento com estratégia de retenção de talentos",
    "beneficiosEsperados": "Aumento de 20% na retenção",
    "estadoFuturoDesejado": "Plataforma digital de gestão de talentos",
    "gapEstadoAtualFuturo": "Processos manuais e descentralizados"
  }
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X POST \
  http://localhost:5173/api/capacidades-negocio \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "CAP-RH-001",
    "nome": "Gestão de Talentos",
    "descricao": "Capacidade de recrutar e desenvolver colaboradores",
    "nivel": "Nível 1",
    "categoria": "RH",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "Alinhamento com estratégia de retenção de talentos",
      "beneficiosEsperados": "Aumento de 20% na retenção",
      "estadoFuturoDesejado": "Plataforma digital de gestão de talentos",
      "gapEstadoAtualFuturo": "Processos manuais e descentralizados"
    }
  }'
```

---

### Atualizar Capacidade de Negócio

**Endpoint**: `PUT /api/capacidades-negocio/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK): Mesmo formato da criação

---

## Habilidades

### Listar Todas as Habilidades

**Endpoint**: `GET /api/habilidades`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "sigla": "JAVA-DEV",
    "descricao": "Desenvolvimento Java",
    "dominio": "Técnica",
    "subcategoria": "Backend",
    "certificacoes": [
      {
        "id": "cert-001",
        "nomeCertificacao": "Oracle Certified Professional Java SE",
        "tempoValidadeDias": 1095
      }
    ]
  }
]
```

---

### Criar Habilidade

**Endpoint**: `POST /api/habilidades`

**Corpo da Requisição**:
```json
{
  "sigla": "REACT-DEV",
  "descricao": "Desenvolvimento React",
  "dominio": "Técnica",
  "subcategoria": "Frontend",
  "certificacoes": [
    {
      "id": "cert-002",
      "nomeCertificacao": "Meta Front-End Developer",
      "tempoValidadeDias": 730
    }
  ]
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla identificadora
- `descricao` (string, obrigatório): Descrição da habilidade
- `dominio` (string, obrigatório): "Técnica", "Comportamental", "Gestão", "Negócio", "Segurança" ou "DevOps"
- `subcategoria` (string, obrigatório): Categoria tecnológica
- `certificacoes` (array, opcional): Lista de certificações relacionadas
  - `id` (string): ID da certificação
  - `nomeCertificacao` (string): Nome da certificação
  - `tempoValidadeDias` (number): Validade em dias

**Resposta de Sucesso** (201 Created):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "sigla": "REACT-DEV",
  "descricao": "Desenvolvimento React",
  "dominio": "Técnica",
  "subcategoria": "Frontend",
  "certificacoes": [
    {
      "id": "cert-002",
      "nomeCertificacao": "Meta Front-End Developer",
      "tempoValidadeDias": 730
    }
  ]
}
```

**Exemplo de Requisição (JavaScript/Fetch)**:
```javascript
const novaHabilidade = {
  sigla: 'REACT-DEV',
  descricao: 'Desenvolvimento React',
  dominio: 'Técnica',
  subcategoria: 'Frontend',
  certificacoes: [
    {
      id: 'cert-002',
      nomeCertificacao: 'Meta Front-End Developer',
      tempoValidadeDias: 730
    }
  ]
};

const response = await fetch('http://localhost:5173/api/habilidades', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(novaHabilidade)
});

const habilidade = await response.json();
console.log('Habilidade criada:', habilidade);
```

---

### Atualizar Habilidade

**Endpoint**: `PUT /api/habilidades/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK): Mesmo formato da criação

---

## Processos de Negócio

### Listar Todos os Processos de Negócio

**Endpoint**: `GET /api/processos-negocio`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440001",
    "identificacao": "PROC-FIN-001",
    "descricao": "Conciliação Bancária",
    "nivelMaturidade": "Gerenciado",
    "areaResponsavel": "Financeiro",
    "frequencia": "Diário",
    "duracaoMedia": 120,
    "complexidade": "Média",
    "normas": [
      {
        "id": "norma-001",
        "tipoNorma": "Norma Legal",
        "obrigatoriedade": "Obrigatório",
        "itemNorma": "Lei 6.404/1976 Art. 177",
        "dataInicio": "2024-01-01",
        "status": "Ativo"
      }
    ]
  }
]
```

---

### Criar Processo de Negócio

**Endpoint**: `POST /api/processos-negocio`

**Corpo da Requisição**:
```json
{
  "identificacao": "PROC-VEN-001",
  "descricao": "Processamento de Pedidos",
  "nivelMaturidade": "Repetível",
  "areaResponsavel": "Comercial",
  "frequencia": "Diário",
  "duracaoMedia": 60,
  "complexidade": "Baixa",
  "normas": []
}
```

**Campos**:
- `identificacao` (string, obrigatório): Identificação única do processo
- `descricao` (string, obrigatório): Descrição do processo
- `nivelMaturidade` (string, obrigatório): "Inicial", "Repetível", "Definido", "Gerenciado" ou "Otimizado"
- `areaResponsavel` (string, obrigatório): Área responsável pelo processo
- `frequencia` (string, obrigatório): "Diário", "Semanal", "Quinzenal", "Mensal", "Trimestral", "Ad-Hoc", "Anual" ou "Bi-Anual"
- `duracaoMedia` (number, obrigatório): Duração média em minutos
- `complexidade` (string, obrigatório): "Muito Baixa", "Baixa", "Média", "Alta" ou "Muito Alta"
- `normas` (array, opcional): Lista de normas aplicáveis

**Resposta de Sucesso** (201 Created): Mesmo formato da listagem

---

### Atualizar Processo de Negócio

**Endpoint**: `PUT /api/processos-negocio/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK)

---

## Tecnologias

### Listar Todas as Tecnologias

**Endpoint**: `GET /api/tecnologias`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "sigla": "REACT",
    "nome": "React",
    "versaoRelease": "18.2.0",
    "categoria": "Frontend",
    "status": "Ativa",
    "fornecedorFabricante": "Meta",
    "tipoLicenciamento": "Open Source",
    "ambientes": {
      "dev": true,
      "qa": true,
      "prod": true,
      "cloud": true,
      "onPremise": false
    },
    "maturidadeInterna": "Padronizada",
    "nivelSuporteInterno": "Suporte Completo / Especializado",
    "documentacaoOficial": "https://react.dev",
    "repositorioInterno": "https://github.com/interno/react-docs",
    "contratos": [],
    "contratosAMS": [],
    "responsaveis": [],
    "custosSaaS": [],
    "manutencoesSaaS": []
  }
]
```

---

### Criar Tecnologia

**Endpoint**: `POST /api/tecnologias`

**Corpo da Requisição**:
```json
{
  "sigla": "POSTGRES",
  "nome": "PostgreSQL",
  "versaoRelease": "16.1",
  "categoria": "Banco de Dados",
  "status": "Ativa",
  "fornecedorFabricante": "PostgreSQL Global Development Group",
  "tipoLicenciamento": "Open Source",
  "ambientes": {
    "dev": true,
    "qa": true,
    "prod": true,
    "cloud": true,
    "onPremise": true
  },
  "maturidadeInterna": "Padronizada",
  "nivelSuporteInterno": "AMS",
  "documentacaoOficial": "https://www.postgresql.org/docs",
  "repositorioInterno": "https://github.com/interno/postgres-docs",
  "contratos": [],
  "contratosAMS": [],
  "responsaveis": [],
  "custosSaaS": [],
  "manutencoesSaaS": []
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla identificadora
- `nome` (string, obrigatório): Nome completo da tecnologia
- `versaoRelease` (string, obrigatório): Versão atual
- `categoria` (string, obrigatório): Categoria da tecnologia
- `status` (string, obrigatório): "Ativa", "Em avaliação", "Obsoleta" ou "Descontinuada"
- `fornecedorFabricante` (string, obrigatório): Nome do fornecedor
- `tipoLicenciamento` (string, obrigatório): "Open Source", "Proprietária", "SaaS" ou "Subscription"
- `ambientes` (object, obrigatório): Ambientes onde a tecnologia está presente
- `maturidadeInterna` (string, obrigatório): "Experimental", "Adotada", "Padronizada" ou "Restrita"
- `nivelSuporteInterno` (string, obrigatório): Nível de suporte disponível

**Resposta de Sucesso** (201 Created): Mesmo formato da listagem

---

### Atualizar Tecnologia

**Endpoint**: `PUT /api/tecnologias/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK)

---

## SLAs

### Listar Todos os SLAs

**Endpoint**: `GET /api/slas`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440001",
    "sigla": "SLA-DISP-001",
    "descricao": "SLA de Disponibilidade Sistema Crítico",
    "tipoSLA": "SLA de Disponibilidade",
    "dataInicio": "2024-01-01",
    "dataTermino": "2024-12-31",
    "status": "Ativo",
    "disponibilidade": {
      "percentualUptime": 99.9
    },
    "servico": {
      "disponibilidadeSistema": "99.9%",
      "backupDiario": "Sim",
      "tempoRespostaAPIs": "<200ms",
      "rpoRtoDR": "RPO 1h / RTO 4h",
      "clonagem": "Sim",
      "dataAlvoClonagem": "Última sexta do mês"
    }
  }
]
```

---

### Criar SLA

**Endpoint**: `POST /api/slas`

**Corpo da Requisição**:
```json
{
  "sigla": "SLA-PERF-001",
  "descricao": "SLA de Performance API",
  "tipoSLA": "SLA de Performance",
  "dataInicio": "2024-01-01",
  "dataTermino": "2024-12-31",
  "status": "Ativo",
  "performance": {
    "latenciaMaxima": 150,
    "throughput": 1000,
    "iopsStorage": 5000,
    "errosPorMinuto": 5
  },
  "disponibilidade": {
    "percentualUptime": 99.5
  }
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla identificadora
- `descricao` (string, obrigatório): Descrição do SLA
- `tipoSLA` (string, obrigatório): Tipo do SLA
- `dataInicio` (string, obrigatório): Data de início (formato ISO)
- `dataTermino` (string, opcional): Data de término (formato ISO)
- `status` (string, obrigatório): "Ativo" ou "Inativo"
- Campos específicos por tipo (opcional): `performance`, `disponibilidade`, `seguranca`, etc.

**Resposta de Sucesso** (201 Created): Mesmo formato da listagem

---

### Atualizar SLA

**Endpoint**: `PUT /api/slas/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK)

---

## Colaboradores

### Listar Todos os Colaboradores

**Endpoint**: `GET /api/colaboradores`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440001",
    "matricula": "5664",
    "nome": "João Silva",
    "setor": "Tecnologia da Informação",
    "dataAdmissao": "2020-01-15",
    "afastamentos": [
      {
        "id": "af-001",
        "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
        "inicialProvavel": "2024-12-20",
        "finalProvavel": "2025-01-19"
      }
    ],
    "habilidades": [
      {
        "id": "hab-001",
        "habilidadeId": "770e8400-e29b-41d4-a716-446655440001",
        "nivelDeclarado": "Avançado",
        "nivelAvaliado": "Avançado",
        "dataInicio": "2020-01-15"
      }
    ]
  }
]
```

---

### Obter Colaborador por ID

**Endpoint**: `GET /api/colaboradores/:id`

**Resposta de Sucesso** (200 OK): Mesmo formato da listagem (objeto único)

---

### Criar Colaborador

**Endpoint**: `POST /api/colaboradores`

**Corpo da Requisição**:
```json
{
  "matricula": "5667",
  "nome": "Ana Costa",
  "setor": "Financeiro",
  "dataAdmissao": "2024-01-15",
  "afastamentos": [],
  "habilidades": [
    {
      "habilidadeId": "770e8400-e29b-41d4-a716-446655440004",
      "nivelDeclarado": "Intermediário",
      "nivelAvaliado": "Básico",
      "dataInicio": "2024-01-15"
    }
  ]
}
```

**Campos**:
- `matricula` (string, obrigatório): Matrícula do colaborador
- `nome` (string, obrigatório): Nome completo
- `setor` (string, obrigatório): Setor de atuação
- `dataAdmissao` (string, obrigatório): Data de admissão (formato ISO)
- `dataDemissao` (string, opcional): Data de demissão (formato ISO)
- `afastamentos` (array, opcional): Lista de afastamentos
- `habilidades` (array, opcional): Lista de habilidades do colaborador

**Resposta de Sucesso** (201 Created):
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440004",
  "matricula": "5667",
  "nome": "Ana Costa",
  "setor": "Financeiro",
  "dataAdmissao": "2024-01-15",
  "afastamentos": [],
  "habilidades": [
    {
      "id": "hab-005",
      "habilidadeId": "770e8400-e29b-41d4-a716-446655440004",
      "nivelDeclarado": "Intermediário",
      "nivelAvaliado": "Básico",
      "dataInicio": "2024-01-15"
    }
  ]
}
```

**Exemplo de Requisição (JavaScript/Fetch)**:
```javascript
const novoColaborador = {
  matricula: '5667',
  nome: 'Ana Costa',
  setor: 'Financeiro',
  dataAdmissao: '2024-01-15',
  afastamentos: [],
  habilidades: [
    {
      habilidadeId: '770e8400-e29b-41d4-a716-446655440004',
      nivelDeclarado: 'Intermediário',
      nivelAvaliado: 'Básico',
      dataInicio: '2024-01-15'
    }
  ]
};

const response = await fetch('http://localhost:5173/api/colaboradores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(novoColaborador)
});

const colaborador = await response.json();
console.log('Colaborador criado:', colaborador);
```

---

### Atualizar Colaborador

**Endpoint**: `PUT /api/colaboradores/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK)

**Exemplo de Requisição (cURL)**:
```bash
curl -X PUT \
  http://localhost:5173/api/colaboradores/bb0e8400-e29b-41d4-a716-446655440004 \
  -H 'Content-Type: application/json' \
  -d '{
    "matricula": "5667",
    "nome": "Ana Costa Silva",
    "setor": "Financeiro - Controladoria",
    "dataAdmissao": "2024-01-15",
    "afastamentos": [],
    "habilidades": [
      {
        "id": "hab-005",
        "habilidadeId": "770e8400-e29b-41d4-a716-446655440004",
        "nivelDeclarado": "Avançado",
        "nivelAvaliado": "Intermediário",
        "dataInicio": "2024-01-15"
      }
    ]
  }'
```

---

### Adicionar Afastamento a Colaborador

**Endpoint**: `POST /api/colaboradores/:id/afastamentos`

**Corpo da Requisição**:
```json
{
  "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
  "inicialProvavel": "2024-12-20",
  "finalProvavel": "2025-01-19"
}
```

**Resposta de Sucesso** (201 Created):
```json
{
  "id": "af-002",
  "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
  "inicialProvavel": "2024-12-20",
  "finalProvavel": "2025-01-19"
}
```

---

### Atualizar Período Efetivo de Afastamento

**Endpoint**: `PUT /api/colaboradores/:colaboradorId/afastamentos/:afastamentoId/periodo-efetivo`

**Corpo da Requisição**:
```json
{
  "inicialEfetivo": "2024-12-20",
  "finalEfetivo": "2025-01-10"
}
```

**Resposta de Sucesso** (200 OK):
```json
{
  "id": "af-002",
  "tipoAfastamentoId": "550e8400-e29b-41d4-a716-446655440001",
  "inicialProvavel": "2024-12-20",
  "finalProvavel": "2025-01-19",
  "inicialEfetivo": "2024-12-20",
  "finalEfetivo": "2025-01-10"
}
```

---

## Aplicações

### Listar Todas as Aplicações

**Endpoint**: `GET /api/aplicacoes`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440001",
    "sigla": "SISFIN",
    "descricao": "Sistema Financeiro",
    "urlDocumentacao": "https://docs.interno/sisfin",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Muito Alta",
    "tecnologias": [
      {
        "id": "tec-001",
        "tecnologiaId": "990e8400-e29b-41d4-a716-446655440001",
        "dataInicio": "2023-01-01",
        "status": "Ativo"
      }
    ],
    "ambientes": [
      {
        "id": "amb-001",
        "tipoAmbiente": "Prod",
        "urlAmbiente": "https://sisfin.empresa.com",
        "dataCriacao": "2023-01-01",
        "tempoLiberacao": 30,
        "status": "Ativo"
      }
    ],
    "capacidades": [
      {
        "id": "cap-001",
        "capacidadeId": "660e8400-e29b-41d4-a716-446655440001",
        "dataInicio": "2023-01-01",
        "status": "Ativo"
      }
    ],
    "processos": [
      {
        "id": "proc-001",
        "processoId": "880e8400-e29b-41d4-a716-446655440001",
        "dataInicio": "2023-01-01",
        "status": "Ativo"
      }
    ],
    "integracoes": [],
    "slas": [
      {
        "id": "sla-assoc-001",
        "slaId": "aa0e8400-e29b-41d4-a716-446655440001",
        "descricao": "SLA de disponibilidade para sistema financeiro",
        "dataInicio": "2024-01-01",
        "status": "Ativo"
      }
    ]
  }
]
```

---

### Criar Aplicação

**Endpoint**: `POST /api/aplicacoes`

**Corpo da Requisição**:
```json
{
  "sigla": "SISLOG",
  "descricao": "Sistema de Logística",
  "urlDocumentacao": "https://docs.interno/sislog",
  "faseCicloVida": "Desenvolvimento",
  "criticidadeNegocio": "Alta",
  "tecnologias": [],
  "ambientes": [
    {
      "tipoAmbiente": "Dev",
      "urlAmbiente": "https://sislog-dev.empresa.com",
      "dataCriacao": "2024-01-01",
      "tempoLiberacao": 15,
      "status": "Ativo"
    }
  ],
  "capacidades": [],
  "processos": [],
  "integracoes": [],
  "slas": []
}
```

**Campos**:
- `sigla` (string, obrigatório): Sigla da aplicação
- `descricao` (string, obrigatório): Descrição da aplicação
- `urlDocumentacao` (string, obrigatório): URL da documentação
- `faseCicloVida` (string, obrigatório): "Planejamento", "Desenvolvimento" ou "Produção"
- `criticidadeNegocio` (string, obrigatório): "Muito Baixa", "Baixa", "Média", "Alta" ou "Muito Alta"
- `tecnologias` (array, opcional): Tecnologias utilizadas
- `ambientes` (array, opcional): Ambientes da aplicação
- `capacidades` (array, opcional): Capacidades de negócio suportadas
- `processos` (array, opcional): Processos de negócio suportados
- `integracoes` (array, opcional): Integrações com outras aplicações
- `slas` (array, opcional): SLAs associados

**Resposta de Sucesso** (201 Created): Mesmo formato da listagem

---

### Atualizar Aplicação

**Endpoint**: `PUT /api/aplicacoes/:id`

**Corpo da Requisição**: Mesmo formato do POST

**Resposta de Sucesso** (200 OK)

---

## Runbooks

### Listar Todos os Runbooks

**Endpoint**: `GET /api/runbooks`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440001",
    "sigla": "RB-DEPLOY-001",
    "descricao": "Deploy de Aplicação em Produção",
    "categoria": "Deployment",
    "status": "Ativo",
    "versao": "1.0",
    "tecnologias": [],
    "aplicacoes": [],
    "etapas": [
      {
        "ordem": 1,
        "descricao": "Backup do banco de dados",
        "comando": "./backup-db.sh",
        "tempoEstimado": 5
      }
    ]
  }
]
```

### Criar Runbook

**Endpoint**: `POST /api/runbooks`

**Corpo da Requisição**:
```json
{
  "sigla": "RB-ROLLBACK-001",
  "descricao": "Rollback de Deploy",
  "categoria": "Recovery",
  "status": "Ativo",
  "versao": "1.0",
  "tecnologias": [],
  "aplicacoes": [],
  "etapas": [
    {
      "ordem": 1,
      "descricao": "Restaurar backup",
      "comando": "./restore-db.sh",
      "tempoEstimado": 10
    }
  ]
}
```

---

## Estruturas de Projeto

### Listar Todas as Estruturas

**Endpoint**: `GET /api/estruturas-projeto`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440001",
    "nome": "Microserviço Backend Java",
    "descricao": "Estrutura padrão para microserviços",
    "tipo": "backend",
    "tecnologia": "java",
    "estrutura": {
      "pastas": ["src", "test", "config"],
      "arquivos": ["pom.xml", "README.md"]
    }
  }
]
```

### Criar Estrutura

**Endpoint**: `POST /api/estruturas-projeto`

---

## Integrador de Projetos

### Listar Projetos do Integrador

**Endpoint**: `GET /api/integrador-projetos`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440001",
    "projeto": "SISTEMA-VENDAS",
    "workItemProcess": "Scrum",
    "teamName": "Squad Dev",
    "dataInicial": "2025-01-01",
    "iteracao": 10,
    "sustentacao": false,
    "repositorios": [
      {
        "name": "vendas-frontend-react",
        "produto": "vendas",
        "categoria": "frontend",
        "tecnologia": "react"
      }
    ],
    "status": "Pendente"
  }
]
```

### Criar Projeto no Integrador

**Endpoint**: `POST /api/integrador-projetos`

**Corpo da Requisição**:
```json
{
  "projeto": "SISTEMA-VENDAS",
  "workItemProcess": "Scrum",
  "teamName": "Squad Dev",
  "dataInicial": "2025-01-01",
  "iteracao": 10,
  "sustentacao": false,
  "repositorios": []
}
```

---

## Configurações

### Listar Todas as Configurações

**Endpoint**: `GET /api/configuracoes`

**Resposta de Sucesso** (200 OK):
```json
[
  {
    "chave": "azure_organization",
    "valor": "horaciovasconcellos",
    "descricao": "Organização do Azure DevOps"
  },
  {
    "chave": "azure_pat",
    "valor": "***",
    "descricao": "Personal Access Token (oculto)"
  }
]
```

### Obter Configuração Específica

**Endpoint**: `GET /api/configuracoes/:chave`

### Atualizar Configuração

**Endpoint**: `PUT /api/configuracoes/:chave`

**Corpo da Requisição**:
```json
{
  "valor": "novo-valor",
  "descricao": "Descrição atualizada"
}
```

---

## Logs de Auditoria

### Listar Logs

**Endpoint**: `GET /api/logs-auditoria`

**Query Parameters**:
- `limit` (number, opcional): Limite de registros (padrão: 100, máx: 1000)
- `offset` (number, opcional): Offset para paginação (padrão: 0)
- `startDate` (string, opcional): Data inicial (formato ISO)
- `endDate` (string, opcional): Data final (formato ISO)
- `entityType` (string, opcional): Filtrar por tipo de entidade
- `operationType` (string, opcional): Filtrar por tipo de operação
- `severity` (string, opcional): Filtrar por severidade (info, warning, error)

**Exemplo**:
```
GET /api/logs-auditoria?limit=50&entityType=tipos-afastamento&severity=info
```

**Resposta de Sucesso** (200 OK):
```json
{
  "logs": [
    {
      "id": "01HZQK3M7N8P9Q2R3S4T5V6W7X",
      "logTimestamp": "2025-11-25T10:30:00.000Z",
      "userId": "system",
      "operationType": "CREATE",
      "entityType": "tipos-afastamento",
      "entityId": "550e8400-e29b-41d4-a716-446655440001",
      "method": "POST",
      "route": "/api/tipos-afastamento",
      "statusCode": 201,
      "durationMs": 45,
      "severity": "info"
    }
  ],
  "total": 1250,
  "limit": 50,
  "offset": 0
}
```

### Estatísticas de Logs

**Endpoint**: `GET /api/logs-auditoria/stats`

**Query Parameters**:
- `startDate` (string, opcional): Data inicial
- `endDate` (string, opcional): Data final
- `groupBy` (string, opcional): Agrupar por (entityType, operationType, severity, method)

**Resposta de Sucesso** (200 OK):
```json
{
  "totalLogs": 15432,
  "byEntityType": {
    "tipos-afastamento": 1234,
    "colaboradores": 2345,
    "habilidades": 3456
  },
  "byOperationType": {
    "CREATE": 5000,
    "READ": 8000,
    "UPDATE": 2000,
    "DELETE": 432
  },
  "bySeverity": {
    "info": 14000,
    "warning": 1200,
    "error": 232
  },
  "avgDurationMs": 67.5,
  "timeRange": {
    "start": "2025-11-01T00:00:00.000Z",
    "end": "2025-11-25T23:59:59.999Z"
  }
}
```

---

## Integração Azure DevOps

### Criar Projeto Completo no Azure DevOps

Cria um projeto completo no Azure DevOps com todas as configurações automatizadas: times, iterações, áreas, boards, cards, styles, colunas e swimlanes.

**Endpoint**: `POST /api/azure-devops/setup-project`

**Headers**:
```
Content-Type: application/json
```

**Corpo da Requisição**:
```json
{
  "organization": "horaciovasconcellos",
  "pat": "seu-personal-access-token",
  "projectName": "MEUPROJETO-EXEMPLO",
  "workItemProcess": "Scrum",
  "teamName": "Squad Desenvolvimento",
  "startDate": "2025-01-01",
  "criarTimeSustentacao": false,
  "iteracao": 10,
  "areas": [
    {
      "name": "produto-frontend-react",
      "produto": "produto",
      "categoria": "frontend",
      "tecnologia": "react"
    },
    {
      "name": "produto-backend-java",
      "produto": "produto",
      "categoria": "backend",
      "tecnologia": "java"
    }
  ]
}
```

**Campos**:
- `organization` (string, obrigatório): Nome da organização no Azure DevOps
- `pat` (string, obrigatório): Personal Access Token com permissões de administrador
- `projectName` (string, obrigatório): Nome do projeto a criar
- `workItemProcess` (string, obrigatório): Template de processo ("Agile", "Scrum", "CMMI", "Basic")
- `teamName` (string, obrigatório): Nome do time principal (ex: "Squad Dev")
- `startDate` (string, obrigatório): Data de início das sprints (formato ISO: YYYY-MM-DD)
- `criarTimeSustentacao` (boolean, opcional): Criar time "SUSTENTACAO" adicional (padrão: false)
- `iteracao` (number, opcional): Número de sprints a criar (padrão: 26, máximo: 104)
- `areas` (array, opcional): Lista de áreas/repositórios a criar

**Processo de Criação (12 Passos)**:

1. **Criar Projeto** - Cria projeto no Azure DevOps com Git e template selecionado
2. **Renomear Time Default** - Aguarda criação e renomeia time "projectName Team" para `teamName`
3. **Eliminar Iterações Padrão** - Remove iterações automáticas (Sprint 1, 2, 3)
4. **Criar Iteração Filha** - Cria iteração raiz com nome do time
5. **Criar Sprints** - Cria N sprints (SPRINT-001, SPRINT-002, etc.) com 5 dias úteis cada
6. **Criar Área Filha** - Cria área raiz com nome do time
7. **Configurar Iteração Default** - Define iteração padrão para o time
8. **Configurar Backlogs** - Habilita Epics, Features e Product Backlog Items
9. **Configurar Cards** - Adiciona campos aos cards: Area Path, Iteration Path, Created By, Assigned To, State, Tags
10. **Configurar Styles** - Aplica cores por prioridade (1=vermelho, 2=laranja, 3=amarelo) + 11 tag colors
11. **Configurar Colunas** - Define 7 colunas: New, Ready2Dev, Desenvolvimento, Developer, QA, Validated, Done
12. **Configurar Swimlanes** - Cria 3 swimlanes: Bug (vermelho), Demanda Expressa (verde), Projeto (azul claro)

**Configurações Automáticas de Board**:

**Backlogs**:
- ✅ Epics habilitados
- ✅ Features habilitados
- ✅ Product Backlog Items habilitados

**Cards (Campos Adicionais)**:
- Area Path
- Iteration Path
- Created By
- Assigned To
- State
- Tags

**Styles (Prioridades)**:
- Prioridade 1: Vermelho (#CC293D)
- Prioridade 2: Laranja (#FF6600)
- Prioridade 3: Amarelo (#FFCC00)

**Styles (Tag Colors)**:
1. Bloqueado: Cinza (#808080)
2. Angular: Vermelho (#CC293D)
3. C++: Amarelo (#FFCC00)
4. Kotlin: Verde Escuro (#006600)
5. RPA: Verde Claro (#90EE90)
6. REPORTS: Azul Escuro (#003366)
7. FORMS: Azul Claro (#87CEEB)
8. QUARKUS: Roxo (#800080)
9. JAVA: Vermelho Claro (#FF6B6B)
10. PL_SQL: Cinza Escuro (#404040)
11. PHP: Cinza Claro (#D3D3D3)

**Colunas do Board**:
1. Backlog/New (incoming)
2. Ready2Dev
3. Desenvolvimento
4. Developer
5. QA
6. Validated
7. Done (outgoing)

**Swimlanes**:
1. Bug - Vermelho (#CC293D)
2. Demanda Expressa - Verde (#339933)
3. Projeto - Azul Claro (#87CEEB)

**Resposta de Sucesso** (200 OK):
```json
{
  "success": true,
  "project": {
    "id": "abc-123-def",
    "name": "MEUPROJETO-EXEMPLO",
    "description": "Projeto criado em 25/11/2025 10:30:00 pelo programa github-spark",
    "url": "https://dev.azure.com/horaciovasconcellos/MEUPROJETO-EXEMPLO"
  },
  "teams": [
    {
      "id": "team-123",
      "name": "Squad Desenvolvimento"
    }
  ],
  "iterations": [
    {
      "id": "iter-001",
      "name": "SPRINT-001",
      "path": "\\MEUPROJETO-EXEMPLO\\Iteration\\Squad Desenvolvimento\\SPRINT-001",
      "attributes": {
        "startDate": "2025-01-01T00:00:00Z",
        "finishDate": "2025-01-07T23:59:59Z"
      }
    }
  ],
  "areas": [
    {
      "id": "area-001",
      "name": "produto-frontend-react",
      "path": "\\MEUPROJETO-EXEMPLO\\Area\\Squad Desenvolvimento\\produto-frontend-react"
    }
  ],
  "configurations": [
    "Backlogs configurados",
    "Cards configurados",
    "Styles configurados",
    "Colunas configuradas",
    "Swimlanes configuradas"
  ]
}
```

**Resposta de Erro** (400 Bad Request):
```json
{
  "error": "Personal Access Token inválido ou sem permissões",
  "code": "INVALID_PAT"
}
```

**Resposta de Erro** (500 Internal Server Error):
```json
{
  "error": "Erro ao criar projeto no Azure DevOps",
  "details": "TF400734: The work item type 'Epic' does not exist."
}
```

**Exemplo de Requisição (cURL)**:
```bash
curl -X POST \
  http://localhost:3000/api/azure-devops/setup-project \
  -H 'Content-Type: application/json' \
  -d '{
    "organization": "horaciovasconcellos",
    "pat": "seu-pat-aqui",
    "projectName": "MEUPROJETO-TESTE",
    "workItemProcess": "Scrum",
    "teamName": "Squad Dev",
    "startDate": "2025-01-01",
    "criarTimeSustentacao": false,
    "iteracao": 10,
    "areas": []
  }'
```

**Exemplo de Requisição (JavaScript/Fetch)**:
```javascript
const setupAzureProject = async () => {
  const payload = {
    organization: 'horaciovasconcellos',
    pat: 'seu-personal-access-token',
    projectName: 'MEUPROJETO-TESTE',
    workItemProcess: 'Scrum',
    teamName: 'Squad Dev',
    startDate: '2025-01-01',
    criarTimeSustentacao: false,
    iteracao: 10,
    areas: [
      {
        name: 'app-frontend-react',
        produto: 'app',
        categoria: 'frontend',
        tecnologia: 'react'
      }
    ]
  };

  const response = await fetch('http://localhost:3000/api/azure-devops/setup-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  console.log('Projeto criado:', result);
};
```

**Tempo Estimado de Execução**:
- Projeto pequeno (10 sprints, 2 áreas): 30-45 segundos
- Projeto médio (26 sprints, 5 áreas): 60-90 segundos
- Projeto grande (52 sprints, 10 áreas): 120-180 segundos

**Observações Importantes**:

1. **PAT Permissions**: O Personal Access Token precisa ter permissões:
   - Project and Team: Read, Write & Manage
   - Work Items: Read, Write & Manage
   - Code: Read & Write (para Git)

2. **Nome do Projeto**: Use MAIÚSCULAS e hífens (ex: "MEUPROJETO-2025") para seguir convenções

3. **Sprints**: São criadas automaticamente com 5 dias úteis (segunda a sexta-feira)

4. **Áreas**: São organizadas hierarquicamente: Projeto → Time → Área

5. **Board**: Configurações aplicadas apenas no board "Backlog items" (padrão do Scrum)

6. **Error Handling**: O processo é resiliente - se uma configuração específica falhar (ex: styles), o processo continua

7. **Time SUSTENTACAO**: Se `criarTimeSustentacao=true`, cria time adicional "SUSTENTACAO" (caixa alta) com iterações mensais formato MMM-YYYY

8. **Iteração Máxima**: Máximo de 104 sprints (2 anos). Se passar, será ajustado automaticamente

---

## Scripts de Carga

O sistema inclui scripts shell para carga em lote de dados via API REST.

### Scripts Disponíveis

Todos os scripts seguem o padrão `load-{entidade}.sh` e estão localizados em `/scripts`:

| Script | Entidade | Arquivo Template |
|--------|----------|------------------|
| `load-tipos-afastamento.sh` | Tipos de Afastamento | `data-templates/tipos-afastamento.json` |
| `load-habilidades.sh` | Habilidades | `data-templates/habilidades.json` |
| `load-capacidades-negocio.sh` | Capacidades de Negócio | `data-templates/capacidades-negocio.json` |
| `load-colaboradores.sh` | Colaboradores | `data-templates/colaboradores.json` |
| `load-tecnologias.sh` | Tecnologias | `data-templates/tecnologias.json` |
| `load-processos.sh` | Processos de Negócio | `data-templates/processos-negocio.json` |
| `load-slas.sh` | SLAs | `data-templates/slas.json` |
| `load-aplicacoes.sh` | Aplicações | `data-templates/aplicacoes.json` |

### Uso dos Scripts

**Pré-requisitos**:
1. `jq` instalado: `brew install jq` (macOS) ou `sudo apt-get install jq` (Linux)
2. Servidor rodando: `docker-compose up` ou `npm run dev`
3. Arquivo JSON em `data-templates/`

**Executar Script**:
```bash
# Tornar executável (primeira vez)
chmod +x scripts/load-tipos-afastamento.sh

# Executar com arquivo padrão
./scripts/load-tipos-afastamento.sh

# Executar com arquivo customizado
./scripts/load-tipos-afastamento.sh meu-arquivo.json
```

**Processo**:
1. Valida arquivo JSON
2. Verifica servidor (porta 3000)
3. Mostra total de registros
4. Pede confirmação
5. Para cada registro:
   - Verifica se existe (GET)
   - Se existe: atualiza (PUT)
   - Se não existe: cria (POST)
6. Exibe resumo: criados, atualizados, duplicados, erros

**Exemplo de Saída**:
```
==========================================
CARGA DE TIPOS DE AFASTAMENTO
==========================================

📄 Arquivo: data-templates/tipos-afastamento.json

🔍 Verificando servidor...
✓ Servidor OK

🔍 Validando arquivo JSON...
✓ JSON válido

📊 Total de tipos de afastamento a processar: 12

Deseja continuar com a carga? (s/N) s

==========================================
PROCESSANDO REGISTROS
==========================================

Processando: FER - Férias
  ✓ Criado (ID: 550e8400-e29b-41d4-a716-446655440001)

Processando: LIC-MED - Licença Médica
  ↻ Atualizado (ID: 550e8400-e29b-41d4-a716-446655440002)

==========================================
RESUMO DA CARGA
==========================================
✓ Criados:      8
↻ Atualizados:  3
⚠ Duplicados:   1
✗ Erros:        0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total:        12

🔍 Verificando registros no banco...
✓ Total de tipos de afastamento no banco: 12

✓ Carga concluída!
```

### Ordem Recomendada de Carga

Para popular o banco de dados do zero:

```bash
# 1. Dados base (sem dependências)
./scripts/load-tipos-afastamento.sh
./scripts/load-habilidades.sh
./scripts/load-capacidades-negocio.sh
./scripts/load-tecnologias.sh
./scripts/load-processos.sh
./scripts/load-slas.sh

# 2. Dados dependentes
./scripts/load-colaboradores.sh    # Depende: tipos-afastamento, habilidades
./scripts/load-aplicacoes.sh       # Depende: tecnologias, capacidades, processos, slas
```

### Logs de Carga

Cada execução gera um arquivo de log:
```
scripts/load-tipos-afastamento-20251125_103045.log
```

Conteúdo do log:
```
Iniciando carga em Mon Nov 25 10:30:45 BRT 2025
ERRO - LIC-XYZ: Campos obrigatórios faltando
ERRO - ABC-123: Dados inválidos
```

### Formato dos Arquivos JSON

**Tipos de Afastamento** (`tipos-afastamento.json`):
```json
[
  {
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  }
]
```

**Habilidades** (`habilidades.json`):
```json
[
  {
    "sigla": "JAVA-DEV",
    "descricao": "Desenvolvimento Java",
    "dominio": "Técnica",
    "subcategoria": "Backend",
    "certificacoes": []
  }
]
```

**Capacidades de Negócio** (`capacidades-negocio.json`):
```json
[
  {
    "sigla": "CAP-FIN-001",
    "nome": "Gestão Financeira",
    "descricao": "Capacidade de gestão financeira",
    "nivel": "Nível 1",
    "categoria": "Financeiro",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "Redução de custos",
      "beneficiosEsperados": "15% redução",
      "estadoFuturoDesejado": "Sistema integrado",
      "gapEstadoAtualFuturo": "Sistema fragmentado"
    }
  }
]
```

### Troubleshooting Scripts

**Erro: "jq não está instalado"**
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

**Erro: "Servidor não está respondendo"**
```bash
# Verificar se servidor está rodando
curl http://localhost:3000/health

# Iniciar servidor
docker-compose up
# OU
npm run dev
```

**Erro: "Arquivo JSON inválido"**
```bash
# Validar JSON manualmente
jq empty data-templates/tipos-afastamento.json
```

**Erro: "Permission denied"**
```bash
# Tornar script executável
chmod +x scripts/load-tipos-afastamento.sh
```

### API Usada pelos Scripts

Todos os scripts usam as APIs REST documentadas neste documento:

- `GET /api/{entidade}` - Listar existentes
- `POST /api/{entidade}` - Criar novo
- `PUT /api/{entidade}/:id` - Atualizar existente

Detalhes em: [Scripts README](../scripts/README.md)

---

## Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Requisição bem-sucedida (GET, PUT) |
| 201 | Created | Recurso criado com sucesso (POST) |
| 204 | No Content | Recurso deletado com sucesso (DELETE) |
| 400 | Bad Request | Dados inválidos na requisição |
| 401 | Unauthorized | Autenticação necessária ou falhou |
| 403 | Forbidden | Sem permissão para acessar o recurso |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: registro duplicado) |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Exemplos de Uso

### Exemplo Completo: Criar Colaborador com Habilidades

```javascript
// 1. Primeiro, criar as habilidades necessárias
const habilidadeJava = await fetch('http://localhost:5173/api/habilidades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sigla: 'JAVA-DEV',
    descricao: 'Desenvolvimento Java',
    dominio: 'Técnica',
    subcategoria: 'Backend',
    certificacoes: []
  })
}).then(res => res.json());

// 2. Criar o colaborador com a habilidade
const colaborador = await fetch('http://localhost:5173/api/colaboradores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matricula: '5668',
    nome: 'Carlos Mendes',
    setor: 'Tecnologia da Informação',
    dataAdmissao: '2024-01-15',
    afastamentos: [],
    habilidades: [
      {
        habilidadeId: habilidadeJava.id,
        nivelDeclarado: 'Avançado',
        nivelAvaliado: 'Avançado',
        dataInicio: '2024-01-15'
      }
    ]
  })
}).then(res => res.json());

console.log('Colaborador criado:', colaborador);
```

---

### Exemplo: Adicionar Afastamento a Colaborador Existente

```bash
# 1. Criar tipo de afastamento
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  }'

# Resposta (guarde o ID retornado)
# { "id": "tipo-afastamento-id-aqui", ... }

# 2. Adicionar afastamento ao colaborador
curl -X POST http://localhost:5173/api/colaboradores/colaborador-id-aqui/afastamentos \
  -H 'Content-Type: application/json' \
  -d '{
    "tipoAfastamentoId": "tipo-afastamento-id-aqui",
    "inicialProvavel": "2024-12-20",
    "finalProvavel": "2025-01-19"
  }'
```

---

### Exemplo: Atualizar Período Efetivo via API (Integração Externa)

```python
import requests
import json

# Configuração
base_url = "http://localhost:5173/api"
colaborador_id = "bb0e8400-e29b-41d4-a716-446655440001"
afastamento_id = "af-001"

# Dados do período efetivo
periodo_efetivo = {
    "inicialEfetivo": "2024-12-20",
    "finalEfetivo": "2025-01-10"
}

# Fazer requisição
url = f"{base_url}/colaboradores/{colaborador_id}/afastamentos/{afastamento_id}/periodo-efetivo"
response = requests.put(url, json=periodo_efetivo)

if response.status_code == 200:
    print("Período efetivo atualizado com sucesso!")
    print(json.dumps(response.json(), indent=2))
else:
    print(f"Erro: {response.status_code}")
    print(response.text)
```

---

### Exemplo: Carregar Múltiplos Registros em Lote

```javascript
// Função helper para criar múltiplos registros
async function criarEmLote(endpoint, registros) {
  const resultados = [];
  
  for (const registro of registros) {
    try {
      const response = await fetch(`http://localhost:5173/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });
      
      if (response.ok) {
        const dados = await response.json();
        resultados.push({ sucesso: true, dados });
        console.log(`✓ ${endpoint} criado:`, dados.id);
      } else {
        resultados.push({ sucesso: false, erro: await response.text() });
        console.error(`✗ Erro ao criar ${endpoint}`);
      }
    } catch (erro) {
      resultados.push({ sucesso: false, erro: erro.message });
      console.error(`✗ Exceção ao criar ${endpoint}:`, erro);
    }
  }
  
  return resultados;
}

// Uso
const tiposAfastamento = [
  {
    sigla: 'FER',
    descricao: 'Férias',
    argumentacaoLegal: 'Lei 5.452/1943 (CLT) Art. 129',
    numeroDias: 30,
    tipoTempo: 'C'
  },
  {
    sigla: 'LIC-MED',
    descricao: 'Licença Médica',
    argumentacaoLegal: 'Lei 8.213/1991 Art. 60',
    numeroDias: 15,
    tipoTempo: 'C'
  }
];

const resultados = await criarEmLote('tipos-afastamento', tiposAfastamento);
console.log(`Total: ${resultados.filter(r => r.sucesso).length} sucesso(s)`);
```

---

## Observações Importantes

1. **IDs**: Todos os IDs são UUIDs v4. Ao criar novos registros, não é necessário fornecer o ID (será gerado automaticamente).

2. **Datas**: Todas as datas devem estar no formato ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ).

3. **Validação**: O sistema valida todos os campos obrigatórios e tipos de dados. Erros de validação retornam status 400 com detalhes.

4. **Relacionamentos**: Ao referenciar entidades relacionadas (ex: `tipoAfastamentoId`), certifique-se de que o ID existe no sistema.

5. **Arrays Vazios**: Arrays opcionais podem ser enviados como `[]` se não houver dados.

6. **CORS**: A API suporta CORS para permitir chamadas de domínios diferentes em desenvolvimento.

7. **Rate Limiting**: Em produção, pode haver limitação de taxa de requisições. Consulte a documentação específica do ambiente.

---

## Suporte

Para questões ou problemas com a API, consulte:
- Documentação interna: `https://docs.interno/api`
- Logs e rastreamento: Acesse a seção "Logs e Traces" no sistema
- Suporte técnico: suporte@empresa.com
