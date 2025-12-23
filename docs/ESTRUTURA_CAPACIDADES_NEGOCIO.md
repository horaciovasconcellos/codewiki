# Estrutura de Dados: Capacidades de Negócio

## Estrutura da Tabela no Banco de Dados

```sql
CREATE TABLE capacidades_negocio (
    id                          VARCHAR(36) PRIMARY KEY,    -- UUID gerado automaticamente
    sigla                       VARCHAR(20) UNIQUE,         -- Código/sigla da capacidade (ex: FIN-01)
    nome                        VARCHAR(100) NOT NULL,      -- Nome da capacidade
    descricao                   TEXT,                       -- Descrição detalhada
    nivel                       VARCHAR(20),                -- Nível da capacidade (Nível 1, 2, 3)
    categoria                   VARCHAR(50),                -- Categoria (Financeiro, RH, Logística, etc)
    alinhamento_objetivos       TEXT,                       -- Alinhamento com objetivos estratégicos
    beneficios_esperados        TEXT,                       -- Benefícios esperados
    estado_futuro_desejado      TEXT,                       -- Estado futuro desejado (target state)
    gap_estado_atual_futuro     TEXT,                       -- Gap entre estado atual e futuro
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## JSON Esperado pela API

### POST /api/capacidades-negocio (Criar nova)

```json
{
  "sigla": "FIN-01",
  "nome": "Gestão Financeira",
  "descricao": "Capacidade de gerenciar recursos financeiros da organização",
  "nivel": "Nível 1",
  "categoria": "Financeiro",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinha-se com o objetivo de aumentar a eficiência operacional e reduzir custos em 15%",
    "beneficiosEsperados": "Redução de 20% no tempo de fechamento contábil, maior visibilidade financeira, decisões mais rápidas",
    "estadoFuturoDesejado": "Sistema integrado de gestão financeira com dashboards em tempo real e automação completa de processos",
    "gapEstadoAtualFuturo": "Falta de integração entre sistemas, processos manuais em Excel, ausência de dashboards gerenciais"
  }
}
```

### PUT /api/capacidades-negocio/:id (Atualizar existente)

```json
{
  "sigla": "FIN-01",
  "nome": "Gestão Financeira Integrada",
  "descricao": "Capacidade de gerenciar recursos financeiros com visão consolidada",
  "nivel": "Nível 2",
  "categoria": "Financeiro",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinha-se com o objetivo de aumentar a eficiência operacional e reduzir custos em 15%",
    "beneficiosEsperados": "Redução de 20% no tempo de fechamento contábil, maior visibilidade financeira",
    "estadoFuturoDesejado": "Sistema integrado de gestão financeira com dashboards em tempo real",
    "gapEstadoAtualFuturo": "Falta de integração entre sistemas, processos manuais em Excel"
  }
}
```

### Resposta da API (GET/POST/PUT)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "FIN-01",
  "nome": "Gestão Financeira",
  "descricao": "Capacidade de gerenciar recursos financeiros da organização",
  "nivel": "Nível 1",
  "categoria": "Financeiro",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinha-se com o objetivo de aumentar a eficiência operacional",
    "beneficiosEsperados": "Redução de 20% no tempo de fechamento contábil",
    "estadoFuturoDesejado": "Sistema integrado de gestão financeira",
    "gapEstadoAtualFuturo": "Falta de integração entre sistemas"
  },
  "createdAt": "2025-11-23T12:00:00.000Z",
  "updatedAt": "2025-11-23T12:00:00.000Z"
}
```

## Campos Detalhados

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| **id** | UUID | Auto | Identificador único (gerado pelo sistema) | `"a1b2c3d4-..."` |
| **sigla** | String(20) | Recomendado | Código/sigla único da capacidade | `"FIN-01"`, `"RH-01"`, `"LOG-01"` |
| **nome** | String(100) | ✅ Sim | Nome descritivo da capacidade | `"Gestão Financeira"` |
| **descricao** | Text | Não | Descrição detalhada da capacidade | `"Capacidade de gerenciar recursos..."` |
| **nivel** | String(20) | Não | Nível hierárquico da capacidade | `"Nível 1"`, `"Nível 2"`, `"Nível 3"` |
| **categoria** | String(50) | Não | Categoria funcional da capacidade | `"Financeiro"`, `"RH"`, `"Logística"` |
| **coberturaEstrategica** | Object | Não | Cobertura estratégica (objeto aninhado) | Ver abaixo |

### Cobertura Estratégica (Objeto aninhado)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **alinhamentoObjetivos** | Text | Como a capacidade se alinha aos objetivos estratégicos |
| **beneficiosEsperados** | Text | Benefícios esperados com o desenvolvimento desta capacidade |
| **estadoFuturoDesejado** | Text | Estado futuro desejado (target state) |
| **gapEstadoAtualFuturo** | Text | Lacunas entre estado atual e futuro |

## Exemplos Completos

### 1. Gestão Financeira (Nível 1)
```json
{
  "sigla": "FIN-01",
  "nome": "Gestão Financeira",
  "descricao": "Capacidade de planejar, executar e controlar recursos financeiros",
  "nivel": "Nível 1",
  "categoria": "Financeiro",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Alinha-se com o objetivo estratégico de aumentar eficiência operacional em 15% e reduzir custos administrativos",
    "beneficiosEsperados": "Redução de 20% no tempo de fechamento contábil, maior visibilidade financeira em tempo real, decisões mais rápidas e embasadas",
    "estadoFuturoDesejado": "Sistema ERP integrado com módulos financeiros automatizados, dashboards gerenciais em tempo real, processos paperless",
    "gapEstadoAtualFuturo": "Ausência de sistema integrado, uso intensivo de planilhas Excel, processos manuais de conciliação bancária, falta de dashboards gerenciais"
  }
}
```

### 2. Gestão de Talentos (RH)
```json
{
  "sigla": "RH-01",
  "nome": "Gestão de Talentos",
  "descricao": "Capacidade de recrutar, desenvolver e reter talentos alinhados à estratégia",
  "nivel": "Nível 1",
  "categoria": "RH",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Suporta objetivo de se tornar referência em inovação através de equipes de alta performance",
    "beneficiosEsperados": "Redução de 30% no turnover, aumento de 25% no engagement, time to hire reduzido em 40%",
    "estadoFuturoDesejado": "Plataforma integrada de gestão de pessoas com IA para recrutamento, trilhas de desenvolvimento personalizadas, cultura data-driven",
    "gapEstadoAtualFuturo": "Processos de recrutamento manuais, ausência de métricas de desempenho, falta de programas estruturados de desenvolvimento"
  }
}
```

### 3. Cadeia de Suprimentos (Logística)
```json
{
  "sigla": "LOG-01",
  "nome": "Gestão da Cadeia de Suprimentos",
  "descricao": "Capacidade de planejar e executar fluxo de materiais desde fornecedores até clientes",
  "nivel": "Nível 1",
  "categoria": "Logística",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Contribui para o objetivo de reduzir custos logísticos em 12% e melhorar o nível de serviço ao cliente",
    "beneficiosEsperados": "Redução de 15% nos custos de frete, diminuição de 50% no tempo de ciclo de pedido, inventário otimizado com 20% menos capital imobilizado",
    "estadoFuturoDesejado": "Supply chain 4.0 com visibilidade end-to-end, previsão de demanda com machine learning, parceria estratégica com fornecedores chave",
    "gapEstadoAtualFuturo": "Falta de integração com fornecedores, previsão de demanda baseada em histórico simples, ausência de KPIs de supply chain"
  }
}
```

### 4. Atendimento ao Cliente
```json
{
  "sigla": "ATE-01",
  "nome": "Atendimento e Relacionamento com Clientes",
  "descricao": "Capacidade de interagir e resolver demandas de clientes de forma eficaz",
  "nivel": "Nível 2",
  "categoria": "Atendimento",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Essencial para atingir NPS de 70+ e reduzir churn em 25%",
    "beneficiosEsperados": "Aumento de 35% na satisfação do cliente (CSAT), redução de 40% no tempo médio de atendimento, first call resolution de 85%",
    "estadoFuturoDesejado": "Atendimento omnichannel com IA para triagem, chatbots para dúvidas simples, CRM 360º com histórico completo do cliente",
    "gapEstadoAtualFuturo": "Atendimento fragmentado em canais não integrados, ausência de base de conhecimento, falta de visão unificada do cliente"
  }
}
```

### 5. Produção e Operações
```json
{
  "sigla": "PROD-01",
  "nome": "Gestão de Produção",
  "descricao": "Capacidade de planejar, executar e controlar processos produtivos",
  "nivel": "Nível 1",
  "categoria": "Produção",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Viabiliza meta de aumentar produtividade em 18% e reduzir defeitos em 60%",
    "beneficiosEsperados": "OEE (Overall Equipment Effectiveness) de 85%, redução de 50% em setup time, zero defeitos em produtos críticos",
    "estadoFuturoDesejado": "Manufatura enxuta com manutenção preditiva, IoT para monitoramento em tempo real, células de produção flexíveis",
    "gapEstadoAtualFuturo": "Manutenção reativa, falta de padronização de processos, ausência de indicadores de performance em tempo real"
  }
}
```

### 6. Gestão Comercial
```json
{
  "sigla": "COM-01",
  "nome": "Gestão de Vendas e Comercial",
  "descricao": "Capacidade de prospectar, negociar e converter oportunidades de venda",
  "nivel": "Nível 2",
  "categoria": "Comercial",
  "coberturaEstrategica": {
    "alinhamentoObjetivos": "Suporta meta de crescimento de receita em 25% a.a. e expansão para novos mercados",
    "beneficiosEsperados": "Aumento de 30% na taxa de conversão, ciclo de venda reduzido em 35%, ticket médio 20% maior",
    "estadoFuturoDesejado": "Sales intelligence com IA para lead scoring, automação de vendas, análise preditiva de churn e upsell",
    "gapEstadoAtualFuturo": "CRM subutilizado, falta de processo de vendas estruturado, ausência de análise de pipeline"
  }
}
```

## Níveis de Capacidade

| Nível | Descrição |
|-------|-----------|
| **Nível 1** | Capacidades estratégicas de alto nível (ex: Gestão Financeira) |
| **Nível 2** | Decomposição das capacidades de Nível 1 (ex: Planejamento Orçamentário) |
| **Nível 3** | Capacidades operacionais específicas (ex: Conciliação Bancária) |

## Categorias Disponíveis

- **Financeiro**: Gestão de recursos financeiros
- **RH**: Recursos Humanos e gestão de pessoas
- **Logística**: Supply chain e distribuição
- **Atendimento**: Relacionamento com clientes
- **Produção**: Processos produtivos e operações
- **Comercial**: Vendas e desenvolvimento de negócios

## Validações

### Regras de Negócio:
- ✅ **sigla**: Deve ser única, máximo 20 caracteres, formato recomendado: CAT-NN
- ✅ **nome**: Obrigatório, mínimo 3 caracteres, máximo 100 caracteres
- ✅ **nivel**: Valores permitidos: "Nível 1", "Nível 2", "Nível 3"
- ✅ **categoria**: Valores permitidos: "Financeiro", "RH", "Logística", "Atendimento", "Produção", "Comercial"

### Códigos de Erro:

```json
// Campos obrigatórios faltando
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["nome"]
}

// Sigla duplicada
{
  "error": "Capacidade de negócio já existe",
  "code": "DUPLICATE"
}

// Registro não encontrado
{
  "error": "Capacidade de negócio não encontrada",
  "code": "NOT_FOUND"
}
```

## Arquivo de Carga em Lote (JSON Array)

Para carga em lote usando o script `load-capacidades-negocio.sh`:

```json
[
  {
    "sigla": "FIN-01",
    "nome": "Gestão Financeira",
    "descricao": "Capacidade de planejar, executar e controlar recursos financeiros",
    "nivel": "Nível 1",
    "categoria": "Financeiro",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "Alinha-se com objetivo de aumentar eficiência operacional",
      "beneficiosEsperados": "Redução de custos e maior visibilidade",
      "estadoFuturoDesejado": "Sistema ERP integrado",
      "gapEstadoAtualFuturo": "Processos manuais e falta de integração"
    }
  },
  {
    "sigla": "RH-01",
    "nome": "Gestão de Talentos",
    "descricao": "Capacidade de recrutar, desenvolver e reter talentos",
    "nivel": "Nível 1",
    "categoria": "RH",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "Suporta objetivo de inovação",
      "beneficiosEsperados": "Redução de turnover e aumento de engagement",
      "estadoFuturoDesejado": "Plataforma integrada de gestão de pessoas",
      "gapEstadoAtualFuturo": "Processos manuais de recrutamento"
    }
  }
]
```

## Exemplos de Uso da API

### cURL - Criar nova capacidade
```bash
curl -X POST http://localhost:3000/api/capacidades-negocio \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "FIN-01",
    "nome": "Gestão Financeira",
    "descricao": "Capacidade de gerenciar recursos financeiros",
    "nivel": "Nível 1",
    "categoria": "Financeiro",
    "coberturaEstrategica": {
      "alinhamentoObjetivos": "Aumentar eficiência operacional",
      "beneficiosEsperados": "Redução de custos",
      "estadoFuturoDesejado": "Sistema integrado",
      "gapEstadoAtualFuturo": "Processos manuais"
    }
  }'
```

### cURL - Atualizar existente
```bash
curl -X PUT http://localhost:3000/api/capacidades-negocio/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "FIN-01",
    "nome": "Gestão Financeira Integrada",
    "nivel": "Nível 2"
  }'
```

### JavaScript/Fetch - Criar nova capacidade
```javascript
const novaCapacidade = {
  sigla: "FIN-01",
  nome: "Gestão Financeira",
  descricao: "Capacidade de gerenciar recursos financeiros da organização",
  nivel: "Nível 1",
  categoria: "Financeiro",
  coberturaEstrategica: {
    alinhamentoObjetivos: "Alinha-se com o objetivo de aumentar a eficiência",
    beneficiosEsperados: "Redução de custos e maior controle",
    estadoFuturoDesejado: "Sistema ERP integrado",
    gapEstadoAtualFuturo: "Falta de integração entre sistemas"
  }
};

const response = await fetch('http://localhost:3000/api/capacidades-negocio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novaCapacidade)
});

const resultado = await response.json();
console.log(resultado);
```

## Mapeamento de Dados: Frontend ↔ Backend

### Frontend → Backend (POST/PUT)
```javascript
// Frontend (camelCase)
{
  coberturaEstrategica: {
    alinhamentoObjetivos: "...",
    beneficiosEsperados: "...",
    estadoFuturoDesejado: "...",
    gapEstadoAtualFuturo: "..."
  }
}

// Backend converte para (snake_case)
{
  alinhamento_objetivos: "...",
  beneficios_esperados: "...",
  estado_futuro_desejado: "...",
  gap_estado_atual_futuro: "..."
}
```

### Backend → Frontend (GET)
```javascript
// Backend (snake_case)
{
  alinhamento_objetivos: "...",
  beneficios_esperados: "...",
  estado_futuro_desejado: "...",
  gap_estado_atual_futuro: "..."
}

// Frontend converte para (camelCase)
{
  coberturaEstrategica: {
    alinhamentoObjetivos: "...",
    beneficiosEsperados: "...",
    estadoFuturoDesejado: "...",
    gapEstadoAtualFuturo: "..."
  }
}
```
