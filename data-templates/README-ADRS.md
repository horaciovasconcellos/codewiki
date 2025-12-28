# Carga de Dados - ADRs (Architectural Decision Records)

## Visão Geral

Este diretório contém templates e exemplos para carga de Decisões Arquitetônicas (ADRs) no sistema.

## Estrutura de Dados

### Campos do ADR

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | String(500) | Sim | Descrição resumida da decisão arquitetônica |
| `status` | Enum | Sim | Status da decisão: Proposto, Aceito, Rejeitado, Substituído, Obsoleto, Adiado/Retirado |
| `contexto` | Text | Não | Contexto que levou à necessidade da decisão |
| `decisao` | Text | Não | Descrição detalhada da decisão tomada |
| `justificativa` | Text | Não | Justificativa e raciocínio por trás da decisão |
| `consequencias_positivas` | Text | Não | Consequências positivas esperadas |
| `consequencias_negativas` | Text | Não | Trade-offs e consequências negativas |
| `riscos` | Text | Não | Riscos identificados na implementação |
| `alternativas_consideradas` | Text | Não | Alternativas que foram avaliadas |
| `compliance_constitution` | Text | Não | Como a decisão está alinhada com a Constitution |
| `adr_substituta_sequencia` | Integer | Não* | Sequência do ADR que substitui este (obrigatório se status = Substituído) |
| `referencias` | Text | Não | Links e referências relacionadas |

*Obrigatório apenas quando `status = "Substituído"`

### Campos de Aplicação Associada

Cada ADR pode ter múltiplas aplicações associadas:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `aplicacao_sigla` | String | Sim | Sigla da aplicação (deve existir na tabela aplicacoes) |
| `data_inicio` | Date | Não | Data de início da aplicação desta decisão |
| `data_termino` | Date | Não | Data de término (se aplicável) |
| `status` | Enum | Sim | Status: Ativo, Inativo, Planejado, Descontinuado |
| `observacoes` | Text | Não | Observações sobre a associação |

## Arquivos Disponíveis

### 1. `adrs.csv`
Arquivo CSV com 10 exemplos de ADRs completos cobrindo decisões típicas:
- Arquitetura de Microsserviços
- Escolha de Banco de Dados (MySQL)
- Docker e Kubernetes
- Framework Frontend (React + TypeScript)
- API REST (Node.js + Express)
- Autenticação (JWT + OAuth 2.0)
- Logging (ELK Stack)
- CI/CD (GitHub Actions)
- Monitoramento (Prometheus + Grafana)
- Cache (Redis)

**Uso:**
```bash
# Importar via interface web
# Ou usando script de carga
node scripts/carga-adrs.js --file data-templates/adrs.csv
```

### 2. `adrs-carga.json`
Arquivo JSON com 5 ADRs detalhados incluindo formatação Markdown:
- Uso de Arquitetura de Microsserviços
- Banco de Dados MySQL
- React com TypeScript
- Autenticação JWT
- CI/CD com GitHub Actions

**Uso:**
```bash
# Carga via API
curl -X POST http://localhost:3000/api/adrs/bulk \
  -H "Content-Type: application/json" \
  -d @data-templates/adrs-carga.json
```

## Formato CSV

### Exemplo de Linha CSV
```csv
descricao,status,contexto,decisao,justificativa,consequencias_positivas,consequencias_negativas,riscos,alternativas_consideradas,compliance_constitution,adr_substituta_sequencia,referencias
"Uso de Microsserviços",Aceito,"Sistema monolítico com problemas","Migrar para microsserviços","Melhor escalabilidade","Deploy independente, escalabilidade","Complexidade operacional","Monitoramento complexo","Monolito modular, SOA","Alinhado com principles",,"https://microservices.io/"
```

### Regras CSV
- **Separador:** Vírgula (`,`)
- **Texto com vírgulas:** Entre aspas duplas (`"texto com, vírgula"`)
- **Quebras de linha:** Usar `\n` dentro de campos entre aspas
- **Campos vazios:** Deixar em branco ou usar aspas vazias (`""`)
- **Encoding:** UTF-8

## Formato JSON

### Exemplo de ADR JSON
```json
{
  "descricao": "Uso de Arquitetura de Microsserviços",
  "status": "Aceito",
  "contexto": "Sistema monolítico atual apresenta dificuldades...",
  "decisao": "Migrar gradualmente para arquitetura de microsserviços...",
  "justificativa": "Microsserviços permitem melhor escalabilidade...",
  "consequencias_positivas": "- Escalabilidade horizontal\n- Deploy independente...",
  "consequencias_negativas": "- Complexidade operacional\n- Overhead de comunicação...",
  "riscos": "- Maior complexidade no monitoramento...",
  "alternativas_consideradas": "1. **Monolito modular**\n2. **SOA**...",
  "compliance_constitution": "Alinhado com princípios de escalabilidade...",
  "referencias": "- [Microservices Pattern](https://microservices.io/)\n- [Martin Fowler]..."
}
```

### Array de ADRs
```json
[
  {
    "descricao": "ADR 1",
    "status": "Aceito",
    ...
  },
  {
    "descricao": "ADR 2",
    "status": "Proposto",
    ...
  }
]
```

## Carga com Aplicações Associadas

### Formato Estendido JSON
```json
{
  "descricao": "Uso de React",
  "status": "Aceito",
  "contexto": "...",
  "aplicacoes": [
    {
      "aplicacao_sigla": "PORTAL-WEB",
      "data_inicio": "2024-01-15",
      "status": "Ativo",
      "observacoes": "Implementação completa"
    },
    {
      "aplicacao_sigla": "ADMIN-PANEL",
      "data_inicio": "2024-02-01",
      "status": "Planejado",
      "observacoes": "Migração em andamento"
    }
  ]
}
```

## Status Válidos

### Status de ADR
1. **Proposto** - Decisão em análise, aguardando aprovação
2. **Aceito** - Decisão aprovada e em implementação/uso
3. **Rejeitado** - Decisão rejeitada após análise
4. **Substituído** - Decisão substituída por outra (requer adr_substituta_sequencia)
5. **Obsoleto** - Decisão não mais aplicável ao contexto atual
6. **Adiado/Retirado** - Decisão adiada ou retirada por mudança de contexto

### Status de Aplicação
1. **Ativo** - Aplicação está usando esta decisão atualmente
2. **Inativo** - Aplicação parou de usar esta decisão
3. **Planejado** - Planejado implementar esta decisão na aplicação
4. **Descontinuado** - Uso descontinuado na aplicação

## Validações

### Validações Automáticas
- ✅ `descricao` não pode ser vazio (max 500 caracteres)
- ✅ `status` deve ser um dos valores válidos
- ✅ Se `status = "Substituído"`, `adr_substituta_sequencia` é obrigatório
- ✅ `adr_substituta_sequencia` deve referenciar um ADR existente
- ✅ `aplicacao_sigla` deve existir na tabela aplicacoes
- ✅ `data_inicio` deve ser anterior a `data_termino` (se ambos preenchidos)

### Validações Recomendadas
- ⚠️ ADRs importantes devem ter `contexto`, `decisao` e `justificativa` preenchidos
- ⚠️ ADRs aceitos devem documentar `consequencias_positivas` e `consequencias_negativas`
- ⚠️ `referencias` devem incluir links válidos

## Scripts de Carga

### Via Interface Web
1. Acessar **DevSecOps > Decisões Arquitetônicas**
2. Clicar em **"Novo ADR"**
3. Preencher wizard de 3 etapas
4. Salvar

### Via API REST
```bash
# Criar ADR único
curl -X POST http://localhost:3000/api/adrs \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "Minha Decisão",
    "status": "Proposto",
    "contexto": "...",
    "aplicacoes": [
      {
        "aplicacaoId": "uuid-da-aplicacao",
        "status": "Ativo"
      }
    ]
  }'

# Carga em lote (bulk)
curl -X POST http://localhost:3000/api/adrs/bulk \
  -H "Content-Type: application/json" \
  -d @data-templates/adrs-carga.json
```

### Via Script Node.js
```bash
# Criar script de carga personalizado
node scripts/carga-adrs.js \
  --file data-templates/adrs.csv \
  --format csv \
  --dry-run
```

## Exemplos de Uso

### Exemplo 1: ADR Simples
```json
{
  "descricao": "Uso de PostgreSQL no lugar de MySQL",
  "status": "Proposto",
  "contexto": "Necessidade de features avançadas de JSON",
  "decisao": "Migrar para PostgreSQL 15",
  "justificativa": "Melhor suporte a JSONB e full-text search"
}
```

### Exemplo 2: ADR com Aplicações
```json
{
  "descricao": "Implementação de GraphQL",
  "status": "Aceito",
  "contexto": "APIs REST com over-fetching",
  "decisao": "Implementar GraphQL como camada sobre REST",
  "aplicacoes": [
    {
      "aplicacao_sigla": "MOBILE-APP",
      "data_inicio": "2024-03-01",
      "status": "Ativo"
    }
  ]
}
```

### Exemplo 3: ADR Substituído
```json
{
  "descricao": "Uso de Vue.js (DEPRECADO)",
  "status": "Substituído",
  "adr_substituta_sequencia": 5,
  "contexto": "Framework inicial escolhido",
  "decisao": "Foi substituído por React conforme ADR-005"
}
```

## Boas Práticas

### Estruturação de Conteúdo
1. **Descrição:** Clara, concisa, máximo 500 caracteres
2. **Contexto:** Explique o problema ou necessidade
3. **Decisão:** Seja específico sobre o que foi decidido
4. **Justificativa:** Explique o raciocínio
5. **Consequências:** Liste prós e contras honestamente
6. **Alternativas:** Documente o que foi considerado e por que rejeitado

### Formatação Markdown
```markdown
# Use markdown para estruturar texto longo

## Subtítulos ajudam na legibilidade

- Listas para consequências
- Cada item em uma linha

**Negrito** para destacar pontos importantes

`Code snippets` quando relevante

[Links para referências](https://example.com)
```

### Referências
- Sempre inclua links para documentação oficial
- Cite artigos técnicos respeitados
- Referencie RFCs quando aplicável
- Link para ADRs relacionados

## Troubleshooting

### Erro: "ADR Substituta não encontrado"
**Causa:** Sequência de ADR substituta não existe  
**Solução:** Verifique que o ADR referenciado já foi criado ou use ID correto

### Erro: "Aplicação não encontrada"
**Causa:** Sigla de aplicação não existe na base  
**Solução:** Crie a aplicação primeiro ou verifique a sigla correta

### Erro: "Descrição muito longa"
**Causa:** Descrição excede 500 caracteres  
**Solução:** Reduza o texto ou mova detalhes para campo `contexto` ou `decisao`

### Erro: "Status inválido"
**Causa:** Status não está na lista de valores permitidos  
**Solução:** Use um dos 6 status válidos (veja lista acima)

## Migração de Dados Existentes

Se você tem ADRs em outros formatos (Markdown files, Confluence, etc.):

1. Extrair dados para JSON ou CSV
2. Mapear campos para estrutura do sistema
3. Importar usando endpoint bulk
4. Validar dados importados
5. Associar aplicações manualmente se necessário

## Relacionado

- [Documentação Completa do Sistema ADR](../docs/SISTEMA-ADR.md)
- [Guia de Componentes React](../src/components/adr/README.md)
- [API Reference](../docs/DOCUMENTACAO_API.md)
- [Constitution - Decisões Arquitetônicas](../.specify/memory/constitution.md)
