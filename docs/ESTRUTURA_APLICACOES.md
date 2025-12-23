# Estrutura de Dados: Aplicações

## Estrutura da Tabela no Banco de Dados

```sql
CREATE TABLE aplicacoes (
    id                          VARCHAR(36) PRIMARY KEY,    -- UUID gerado automaticamente
    sigla                       VARCHAR(15) UNIQUE NOT NULL, -- Código da aplicação (ex: CRM, ERP)
    descricao                   VARCHAR(50) NOT NULL,        -- Descrição curta da aplicação
    url_documentacao            VARCHAR(500) NOT NULL,       -- URL da documentação
    fase_ciclo_vida             VARCHAR(20) NOT NULL,        -- Planejamento, Desenvolvimento, Produção
    criticidade_negocio         VARCHAR(20) NOT NULL,        -- Muito Baixa, Baixa, Média, Alta, Muito Alta
    categoria_sistema           VARCHAR(50),                 -- Categoria do sistema
    fornecedor                  VARCHAR(200),                -- Fornecedor da aplicação
    tipo_hospedagem             VARCHAR(50),                 -- On-Premise, Cloud, Híbrido
    cloud_provider              ENUM(...),                   -- AWS, Microsoft Azure, Google Cloud, etc.
    custo_mensal                DECIMAL(12,2),               -- Custo mensal da aplicação
    numero_usuarios             INT,                         -- Número de usuários
    data_implantacao            DATE,                        -- Data de implantação
    versao_atual                VARCHAR(50),                 -- Versão atual
    responsavel_tecnico         VARCHAR(200),                -- Responsável técnico
    responsavel_negocio         VARCHAR(200),                -- Responsável de negócio
    status_operacional          VARCHAR(50),                 -- Ativo, Inativo, Manutenção, Descontinuado
    observacoes                 TEXT,                        -- Observações gerais
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## JSON Esperado pela API

### POST /api/aplicacoes (Criar nova aplicação)

```json
{
  "sigla": "CRM",
  "descricao": "Sistema de Gestão de Clientes",
  "urlDocumentacao": "https://docs.empresa.com/crm",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "CRM",
  "fornecedor": "Salesforce",
  "tipoHospedagem": "Cloud",
  "custoMensal": 15000.00,
  "numeroUsuarios": 150,
  "dataImplantacao": "2023-03-15",
  "versaoAtual": "2024.1",
  "responsavelTecnico": "João Silva",
  "responsavelNegocio": "Maria Santos",
  "statusOperacional": "Ativo",
  "observacoes": "Sistema crítico para vendas"
}
```

### PUT /api/aplicacoes/:id (Atualizar existente)

```json
{
  "sigla": "CRM",
  "descricao": "Sistema CRM Corporativo",
  "urlDocumentacao": "https://docs.empresa.com/crm/v2",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "versaoAtual": "2024.2",
  "numeroUsuarios": 180,
  "observacoes": "Atualizado para nova versão"
}
```

### Resposta da API (GET/POST/PUT)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "CRM",
  "descricao": "Sistema de Gestão de Clientes",
  "urlDocumentacao": "https://docs.empresa.com/crm",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "CRM",
  "fornecedor": "Salesforce",
  "tipoHospedagem": "Cloud",
  "custoMensal": 15000.00,
  "numeroUsuarios": 150,
  "dataImplantacao": "2023-03-15",
  "versaoAtual": "2024.1",
  "responsavelTecnico": "João Silva",
  "responsavelNegocio": "Maria Santos",
  "statusOperacional": "Ativo",
  "observacoes": "Sistema crítico para vendas",
  "createdAt": "2025-11-23T12:00:00.000Z",
  "updatedAt": "2025-11-23T12:00:00.000Z"
}
```

## Campos Detalhados

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| **id** | UUID | Auto | Identificador único (gerado pelo sistema) | `"a1b2c3d4-..."` |
| **sigla** | String(10) | ✅ Sim | Sigla única da aplicação | `"CRM"`, `"ERP"`, `"PORTAL"` |
| **descricao** | String(50) | ✅ Sim | Descrição curta da aplicação | `"Sistema de Gestão de Clientes"` |
| **urlDocumentacao** | String(500) | ✅ Sim | URL da documentação técnica | `"https://docs.empresa.com/crm"` |
| **faseCicloVida** | String(20) | ✅ Sim | Fase atual do ciclo de vida | `"Produção"` |
| **criticidadeNegocio** | String(20) | ✅ Sim | Criticidade para o negócio | `"Muito Alta"` |
| **categoriaSistema** | String(50) | Não | Categoria do sistema | `"CRM"`, `"ERP"`, `"BI"` |
| **fornecedor** | String(200) | Não | Fornecedor da solução | `"Salesforce"`, `"SAP"` |
| **tipoHospedagem** | String(50) | Não | Tipo de hospedagem | `"Cloud"`, `"On-Premise"` |
| **custoMensal** | Decimal | Não | Custo mensal em R$ | `15000.00` |
| **numeroUsuarios** | Integer | Não | Número de usuários ativos | `150` |
| **dataImplantacao** | Date | Não | Data de implantação | `"2023-03-15"` |
| **versaoAtual** | String(50) | Não | Versão atual instalada | `"2024.1"` |
| **responsavelTecnico** | String(200) | Não | Responsável técnico | `"João Silva"` |
| **responsavelNegocio** | String(200) | Não | Responsável de negócio | `"Maria Santos"` |
| **statusOperacional** | String(50) | Não | Status operacional atual | `"Ativo"` |
| **observacoes** | Text | Não | Observações gerais | `"Sistema crítico"` |

## Valores Permitidos

### Fase do Ciclo de Vida
- **Planejamento**: Sistema em fase de planejamento
- **Desenvolvimento**: Em desenvolvimento ou customização
- **Produção**: Em produção e uso operacional

### Criticidade de Negócio
- **Muito Baixa**: Impacto mínimo no negócio
- **Baixa**: Impacto limitado
- **Média**: Impacto moderado
- **Alta**: Impacto significativo
- **Muito Alta**: Impacto crítico para o negócio

### Categoria de Sistema
- **CRM**: Customer Relationship Management
- **ERP**: Enterprise Resource Planning
- **BI**: Business Intelligence
- **Portal**: Portais corporativos
- **E-commerce**: Comércio eletrônico
- **SCM**: Supply Chain Management
- **HCM**: Human Capital Management
- **Financeiro**: Sistemas financeiros
- **Analytics**: Plataformas de análise de dados
- **Colaboração**: Ferramentas de colaboração

### Tipo de Hospedagem
- **On-Premise**: Hospedado internamente
- **Cloud**: Hospedado em nuvem
- **Híbrido**: Combinação de on-premise e cloud

### Status Operacional
- **Ativo**: Em operação normal
- **Inativo**: Temporariamente inativo
- **Manutenção**: Em manutenção
- **Descontinuado**: Descontinuado ou em fase de sunset

## Exemplos Completos

### 1. Sistema CRM Cloud
```json
{
  "sigla": "CRM",
  "descricao": "Salesforce CRM",
  "urlDocumentacao": "https://docs.empresa.com/salesforce",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "CRM",
  "fornecedor": "Salesforce",
  "tipoHospedagem": "Cloud",
  "custoMensal": 25000.00,
  "numeroUsuarios": 200,
  "dataImplantacao": "2022-01-15",
  "versaoAtual": "Spring 2024",
  "responsavelTecnico": "Carlos Mendes",
  "responsavelNegocio": "Ana Paula Costa",
  "statusOperacional": "Ativo",
  "observacoes": "Integrado com ERP e sistema de Marketing"
}
```

### 2. ERP Corporativo
```json
{
  "sigla": "SAP-ERP",
  "descricao": "SAP S/4HANA",
  "urlDocumentacao": "https://docs.empresa.com/sap",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "ERP",
  "fornecedor": "SAP",
  "tipoHospedagem": "Híbrido",
  "custoMensal": 150000.00,
  "numeroUsuarios": 800,
  "dataImplantacao": "2020-06-01",
  "versaoAtual": "S/4HANA 2023",
  "responsavelTecnico": "Roberto Silva",
  "responsavelNegocio": "Márcia Oliveira",
  "statusOperacional": "Ativo",
  "observacoes": "Core do negócio - inclui módulos FI, CO, MM, SD, PP"
}
```

### 3. Portal Corporativo
```json
{
  "sigla": "PORTAL",
  "descricao": "Portal Colaborativo Interno",
  "urlDocumentacao": "https://wiki.empresa.com/portal",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Alta",
  "categoriaSistema": "Portal",
  "fornecedor": "Desenvolvimento Interno",
  "tipoHospedagem": "On-Premise",
  "custoMensal": 5000.00,
  "numeroUsuarios": 1500,
  "dataImplantacao": "2021-03-10",
  "versaoAtual": "3.2.1",
  "responsavelTecnico": "Equipe TI Interna",
  "responsavelNegocio": "Diretoria de TI",
  "statusOperacional": "Ativo",
  "observacoes": "Desenvolvido em React + Node.js"
}
```

### 4. Plataforma BI
```json
{
  "sigla": "POWERBI",
  "descricao": "Microsoft Power BI Enterprise",
  "urlDocumentacao": "https://docs.empresa.com/powerbi",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Alta",
  "categoriaSistema": "BI",
  "fornecedor": "Microsoft",
  "tipoHospedagem": "Cloud",
  "custoMensal": 18000.00,
  "numeroUsuarios": 300,
  "dataImplantacao": "2023-09-01",
  "versaoAtual": "2024.10",
  "responsavelTecnico": "Time de Analytics",
  "responsavelNegocio": "Diretoria de Dados",
  "statusOperacional": "Ativo",
  "observacoes": "Dashboards executivos e operacionais"
}
```

### 5. Sistema Financeiro
```json
{
  "sigla": "FINANCE",
  "descricao": "Sistema Financeiro Corporativo",
  "urlDocumentacao": "https://docs.empresa.com/finance",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "Financeiro",
  "fornecedor": "TOTVS",
  "tipoHospedagem": "On-Premise",
  "custoMensal": 35000.00,
  "numeroUsuarios": 120,
  "dataImplantacao": "2019-08-20",
  "versaoAtual": "12.1.33",
  "responsavelTecnico": "Gerência de TI Financeiro",
  "responsavelNegocio": "Diretoria Financeira",
  "statusOperacional": "Ativo",
  "observacoes": "Integrado com bancos e sistema contábil"
}
```

### 6. Sistema RH
```json
{
  "sigla": "RHUMANO",
  "descricao": "Gestão de Recursos Humanos",
  "urlDocumentacao": "https://docs.empresa.com/rh",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Alta",
  "categoriaSistema": "HCM",
  "fornecedor": "Oracle HCM",
  "tipoHospedagem": "Cloud",
  "custoMensal": 22000.00,
  "numeroUsuarios": 250,
  "dataImplantacao": "2022-05-15",
  "versaoAtual": "24B",
  "responsavelTecnico": "Time de Aplicações Corporativas",
  "responsavelNegocio": "Diretoria de RH",
  "statusOperacional": "Ativo",
  "observacoes": "Inclui folha, ponto, benefícios e recrutamento"
}
```

### 7. E-commerce
```json
{
  "sigla": "ECOMM",
  "descricao": "Plataforma de E-commerce B2C",
  "urlDocumentacao": "https://docs.empresa.com/ecommerce",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Muito Alta",
  "categoriaSistema": "E-commerce",
  "fornecedor": "VTEX",
  "tipoHospedagem": "Cloud",
  "custoMensal": 45000.00,
  "numeroUsuarios": 50,
  "dataImplantacao": "2023-02-01",
  "versaoAtual": "2024",
  "responsavelTecnico": "Time de E-commerce",
  "responsavelNegocio": "Diretoria Comercial",
  "statusOperacional": "Ativo",
  "observacoes": "Canal principal de vendas online"
}
```

### 8. Analytics Avançado
```json
{
  "sigla": "ANALITICA",
  "descricao": "Plataforma de Analytics e ML",
  "urlDocumentacao": "https://docs.empresa.com/analytics",
  "faseCicloVida": "Desenvolvimento",
  "criticidadeNegocio": "Média",
  "categoriaSistema": "Analytics",
  "fornecedor": "Databricks",
  "tipoHospedagem": "Cloud",
  "custoMensal": 28000.00,
  "numeroUsuarios": 35,
  "dataImplantacao": "2024-11-01",
  "versaoAtual": "14.3",
  "responsavelTecnico": "Time de Data Science",
  "responsavelNegocio": "Chief Data Officer",
  "statusOperacional": "Ativo",
  "observacoes": "Em fase de implantação de novos modelos ML"
}
```

### 9. Sistema Legado em Manutenção
```json
{
  "sigla": "LEGACY",
  "descricao": "Sistema Legado de Contratos",
  "urlDocumentacao": "https://wiki.empresa.com/legacy",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Baixa",
  "categoriaSistema": "Contratos",
  "fornecedor": "Desenvolvimento Interno (Descontinuado)",
  "tipoHospedagem": "On-Premise",
  "custoMensal": 2000.00,
  "numeroUsuarios": 15,
  "dataImplantacao": "2015-01-10",
  "versaoAtual": "1.0.5",
  "responsavelTecnico": "Manutenção TI",
  "responsavelNegocio": "Jurídico",
  "statusOperacional": "Manutenção",
  "observacoes": "Em processo de migração para novo sistema"
}
```

### 10. Sistema em Planejamento
```json
{
  "sigla": "IOTSYS",
  "descricao": "Plataforma IoT Industrial",
  "urlDocumentacao": "https://docs.empresa.com/iot/rfc",
  "faseCicloVida": "Planejamento",
  "criticidadeNegocio": "Alta",
  "categoriaSistema": "IoT",
  "fornecedor": "A definir",
  "tipoHospedagem": "Cloud",
  "custoMensal": null,
  "numeroUsuarios": null,
  "dataImplantacao": "2025-06-01",
  "versaoAtual": null,
  "responsavelTecnico": "Arquitetura de Soluções",
  "responsavelNegocio": "Diretoria Industrial",
  "statusOperacional": "Planejamento",
  "observacoes": "Projeto aprovado - em fase de seleção de fornecedor"
}
```

## Validações

### Regras de Negócio:
- ✅ **sigla**: Obrigatória, única, máximo 15 caracteres, alfanumérica, sem espaços
- ✅ **descricao**: Obrigatória, máximo 50 caracteres
- ✅ **urlDocumentacao**: Obrigatória, formato URL válido
- ✅ **faseCicloVida**: Obrigatória, valores: "Planejamento", "Desenvolvimento", "Produção"
- ✅ **criticidadeNegocio**: Obrigatória, valores: "Muito Baixa", "Baixa", "Média", "Alta", "Muito Alta"
- ✅ **custoMensal**: Opcional, decimal positivo com 2 casas decimais
- ✅ **numeroUsuarios**: Opcional, inteiro positivo
- ✅ **dataImplantacao**: Opcional, formato data válido (YYYY-MM-DD)

### Códigos de Erro:

```json
// Campos obrigatórios faltando
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["sigla", "descricao"]
}

// Sigla duplicada
{
  "error": "Aplicação com esta sigla já existe",
  "code": "DUPLICATE_SIGLA"
}

// Sigla inválida
{
  "error": "Sigla inválida - máximo 15 caracteres alfanuméricos sem espaços",
  "code": "INVALID_SIGLA"
}

// Descrição muito longa
{
  "error": "Descrição deve ter no máximo 50 caracteres",
  "code": "INVALID_DESCRIPTION_LENGTH"
}

// URL inválida
{
  "error": "URL de documentação inválida",
  "code": "INVALID_URL"
}

// Registro não encontrado
{
  "error": "Aplicação não encontrada",
  "code": "NOT_FOUND"
}
```

## Arquivo de Carga em Lote (JSON Array)

Para carga em lote usando o script `load-aplicacoes.sh`:

```json
[
  {
    "sigla": "CRM",
    "descricao": "Salesforce CRM",
    "urlDocumentacao": "https://docs.empresa.com/salesforce",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Muito Alta",
    "categoriaSistema": "CRM",
    "fornecedor": "Salesforce",
    "tipoHospedagem": "Cloud",
    "custoMensal": 25000.00,
    "numeroUsuarios": 200,
    "dataImplantacao": "2022-01-15",
    "versaoAtual": "Spring 2024",
    "responsavelTecnico": "Carlos Mendes",
    "responsavelNegocio": "Ana Paula Costa",
    "statusOperacional": "Ativo",
    "observacoes": "Integrado com ERP e sistema de Marketing"
  },
  {
    "sigla": "SAP-ERP",
    "descricao": "SAP S/4HANA",
    "urlDocumentacao": "https://docs.empresa.com/sap",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Muito Alta",
    "categoriaSistema": "ERP",
    "fornecedor": "SAP",
    "tipoHospedagem": "Híbrido",
    "custoMensal": 150000.00,
    "numeroUsuarios": 800,
    "dataImplantacao": "2020-06-01",
    "versaoAtual": "S/4HANA 2023",
    "responsavelTecnico": "Roberto Silva",
    "responsavelNegocio": "Márcia Oliveira",
    "statusOperacional": "Ativo",
    "observacoes": "Core do negócio - inclui módulos FI, CO, MM, SD, PP"
  }
]
```

## Exemplos de Uso da API

### cURL - Criar nova aplicação
```bash
curl -X POST http://localhost:3000/api/aplicacoes \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "CRM",
    "descricao": "Salesforce CRM",
    "urlDocumentacao": "https://docs.empresa.com/salesforce",
    "faseCicloVida": "Produção",
    "criticidadeNegocio": "Muito Alta",
    "categoriaSistema": "CRM",
    "fornecedor": "Salesforce",
    "tipoHospedagem": "Cloud",
    "custoMensal": 25000.00,
    "numeroUsuarios": 200
  }'
```

### cURL - Atualizar existente
```bash
curl -X PUT http://localhost:3000/api/aplicacoes/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "versaoAtual": "Spring 2025",
    "numeroUsuarios": 250,
    "observacoes": "Atualizado para nova versão"
  }'
```

### cURL - Listar todas
```bash
curl -X GET http://localhost:3000/api/aplicacoes
```

### cURL - Obter por ID
```bash
curl -X GET http://localhost:3000/api/aplicacoes/{id}
```

### cURL - Excluir
```bash
curl -X DELETE http://localhost:3000/api/aplicacoes/{id}
```

### JavaScript/Fetch - Criar nova aplicação
```javascript
const novaAplicacao = {
  sigla: "CRM",
  descricao: "Salesforce CRM",
  urlDocumentacao: "https://docs.empresa.com/salesforce",
  faseCicloVida: "Produção",
  criticidadeNegocio: "Muito Alta",
  categoriaSistema: "CRM",
  fornecedor: "Salesforce",
  tipoHospedagem: "Cloud",
  custoMensal: 25000.00,
  numeroUsuarios: 200,
  dataImplantacao: "2022-01-15",
  versaoAtual: "Spring 2024",
  responsavelTecnico: "Carlos Mendes",
  responsavelNegocio: "Ana Paula Costa",
  statusOperacional: "Ativo",
  observacoes: "Sistema crítico"
};

const response = await fetch('http://localhost:3000/api/aplicacoes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novaAplicacao)
});

const resultado = await response.json();
console.log(resultado);
```

## Mapeamento de Dados: Frontend ↔ Backend

### Frontend → Backend (POST/PUT)
```javascript
// Frontend (camelCase)
{
  sigla: "CRM",
  descricao: "Salesforce CRM",
  urlDocumentacao: "https://...",
  faseCicloVida: "Produção",
  criticidadeNegocio: "Muito Alta",
  categoriaSistema: "CRM",
  tipoHospedagem: "Cloud",
  custoMensal: 25000.00,
  numeroUsuarios: 200,
  dataImplantacao: "2022-01-15",
  versaoAtual: "Spring 2024",
  responsavelTecnico: "Carlos Mendes",
  responsavelNegocio: "Ana Paula Costa",
  statusOperacional: "Ativo"
}

// Backend converte para (snake_case)
{
  sigla: "CRM",
  descricao: "Salesforce CRM",
  url_documentacao: "https://...",
  fase_ciclo_vida: "Produção",
  criticidade_negocio: "Muito Alta",
  categoria_sistema: "CRM",
  tipo_hospedagem: "Cloud",
  custo_mensal: 25000.00,
  numero_usuarios: 200,
  data_implantacao: "2022-01-15",
  versao_atual: "Spring 2024",
  responsavel_tecnico: "Carlos Mendes",
  responsavel_negocio: "Ana Paula Costa",
  status_operacional: "Ativo"
}
```

### Backend → Frontend (GET)
```javascript
// Backend (snake_case)
{
  id: "uuid...",
  sigla: "CRM",
  url_documentacao: "https://...",
  fase_ciclo_vida: "Produção",
  criticidade_negocio: "Muito Alta",
  categoria_sistema: "CRM",
  tipo_hospedagem: "Cloud",
  custo_mensal: 25000.00,
  numero_usuarios: 200,
  data_implantacao: "2022-01-15",
  versao_atual: "Spring 2024",
  responsavel_tecnico: "Carlos Mendes",
  responsavel_negocio: "Ana Paula Costa",
  status_operacional: "Ativo",
  created_at: "...",
  updated_at: "..."
}

// Frontend converte para (camelCase)
{
  id: "uuid...",
  sigla: "CRM",
  urlDocumentacao: "https://...",
  faseCicloVida: "Produção",
  criticidadeNegocio: "Muito Alta",
  categoriaSistema: "CRM",
  tipoHospedagem: "Cloud",
  custoMensal: 25000.00,
  numeroUsuarios: 200,
  dataImplantacao: "2022-01-15",
  versaoAtual: "Spring 2024",
  responsavelTecnico: "Carlos Mendes",
  responsavelNegocio: "Ana Paula Costa",
  statusOperacional: "Ativo",
  createdAt: "...",
  updatedAt: "..."
}
```
