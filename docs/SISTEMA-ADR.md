# Sistema de ADR (Architectural Decision Records)

## Visão Geral

O Sistema de ADR foi implementado para gerenciar Decisões Arquitetônicas (Architectural Decision Records) de forma estruturada, permitindo documentar decisões importantes de arquitetura, suas justificativas, consequências e associações com aplicações.

## Estrutura do Banco de Dados

### Tabela `adrs`
Armazena as decisões arquitetônicas principais.

**Campos:**
- `id` (VARCHAR(36), PK): Identificador único UUID
- `sequencia` (INT, AUTO_INCREMENT, UNIQUE): Número sequencial do ADR
- `descricao` (VARCHAR(500), NOT NULL): Descrição resumida da decisão
- `data_criacao` (TIMESTAMP): Data de criação do registro
- `status` (ENUM): Status da decisão
  - Proposto
  - Aceito
  - Rejeitado
  - Substituído
  - Obsoleto
  - Adiado/Retirado
- `contexto` (TEXT): Contexto da decisão
- `decisao` (TEXT): Descrição detalhada da decisão tomada
- `justificativa` (TEXT): Justificativa da decisão
- `consequencias_positivas` (TEXT): Consequências positivas esperadas
- `consequencias_negativas` (TEXT): Consequências negativas ou trade-offs
- `riscos` (TEXT): Riscos associados à decisão
- `alternativas_consideradas` (TEXT): Alternativas que foram consideradas
- `compliance_constitution` (TEXT): Conformidade com a Constitution
- `adr_substituta_id` (VARCHAR(36), FK): Referência ao ADR que substitui este (quando status = Substituído)
- `referencias` (TEXT): Referências e links relacionados
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data da última atualização

**Índices:**
- `idx_adr_sequencia`: Índice na sequência
- `idx_adr_status`: Índice no status
- `idx_adr_data_criacao`: Índice na data de criação

### Tabela `adr_aplicacoes`
Associa ADRs com Aplicações, indicando quais aplicações utilizam cada decisão arquitetônica.

**Campos:**
- `id` (VARCHAR(36), PK): Identificador único UUID
- `adr_id` (VARCHAR(36), FK, NOT NULL): Referência ao ADR
- `aplicacao_id` (VARCHAR(36), FK, NOT NULL): Referência à Aplicação
- `data_inicio` (DATE): Data de início da aplicação desta decisão
- `data_termino` (DATE): Data de término (se aplicável)
- `status` (ENUM): Status da associação
  - Ativo
  - Inativo
  - Planejado
  - Descontinuado
- `observacoes` (TEXT): Observações sobre a associação
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data da última atualização

**Índices:**
- `idx_adr_aplicacao`: Índice composto em (adr_id, aplicacao_id)
- `idx_aplicacao_status`: Índice composto em (aplicacao_id, status)

## API Endpoints

### GET /api/adrs
Lista todos os ADRs com informações da ADR substituta (se aplicável).

**Response:**
```json
[
  {
    "id": "uuid",
    "sequencia": 1,
    "descricao": "Adoção de arquitetura de microsserviços",
    "dataCriacao": "2024-01-15T10:30:00Z",
    "status": "Aceito",
    "contexto": "...",
    "decisao": "...",
    "adrSubstitutaSequencia": null,
    "aplicacoes": [...]
  }
]
```

### GET /api/adrs/:id
Busca um ADR específico por ID, incluindo todas as aplicações associadas.

**Response:**
```json
{
  "id": "uuid",
  "sequencia": 1,
  "descricao": "Adoção de arquitetura de microsserviços",
  "dataCriacao": "2024-01-15T10:30:00Z",
  "dataAtualizacao": "2024-02-20T14:00:00Z",
  "status": "Aceito",
  "contexto": "Necessidade de escalar componentes independentemente",
  "decisao": "Migrar para arquitetura de microsserviços",
  "justificativa": "Melhor escalabilidade e manutenibilidade",
  "consequenciasPositivas": "Escalabilidade independente, deploy isolado",
  "consequenciasNegativas": "Maior complexidade operacional",
  "riscos": "Aumento na complexidade de monitoramento",
  "alternativasConsideradas": "Monolito modular, arquitetura em camadas",
  "complianceConstitution": "Conforme princípios de escalabilidade",
  "adrSubstitutaId": null,
  "adrSubstitutaSequencia": null,
  "referencias": "Links e documentos relacionados",
  "aplicacoes": [
    {
      "id": "uuid",
      "aplicacaoId": "uuid",
      "aplicacaoSigla": "API-CORE",
      "aplicacaoNome": "API Core",
      "aplicacaoDescricao": "API principal do sistema",
      "dataInicio": "2024-01-15",
      "dataTermino": null,
      "status": "Ativo",
      "observacoes": "Implementação completa"
    }
  ]
}
```

### POST /api/adrs
Cria um novo ADR com suas aplicações associadas.

**Request Body:**
```json
{
  "descricao": "Descrição da decisão",
  "status": "Proposto",
  "contexto": "Contexto da decisão",
  "decisao": "Decisão tomada",
  "justificativa": "Justificativa",
  "consequenciasPositivas": "Consequências positivas",
  "consequenciasNegativas": "Consequências negativas",
  "riscos": "Riscos identificados",
  "alternativasConsideradas": "Alternativas",
  "complianceConstitution": "Compliance",
  "adrSubstitutaId": null,
  "aplicacoes": [
    {
      "aplicacaoId": "uuid",
      "dataInicio": "2024-01-15",
      "dataTermino": null,
      "status": "Ativo",
      "observacoes": "Observações"
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid-gerado",
  "sequencia": 1,
  "...demais campos"
}
```

### PUT /api/adrs/:id
Atualiza um ADR existente e suas aplicações associadas (usa transação).

**Request Body:** Mesmo formato do POST

**Response:** ADR atualizado

### DELETE /api/adrs/:id
Exclui um ADR e todas as suas associações com aplicações.

**Response:** `{ "message": "ADR excluído com sucesso" }`

## Componentes React

### ADRWizard
Wizard de 3 etapas para criar/editar ADRs:

**Etapa 1 - Dados Básicos:**
- Descrição (obrigatório, máx. 500 caracteres)
- Status (com validação para "Substituído" exigir ADR Substituta)
- ListBox para selecionar ADR Substituta (quando status = Substituído)
- Contexto
- Decisão
- Justificativa

**Etapa 2 - Detalhes:**
- Consequências Positivas
- Consequências Negativas
- Riscos
- Alternativas Consideradas
- Compliance com Constitution

**Etapa 3 - Aplicações Associadas:**
- Lista de aplicações com:
  - Seleção da Aplicação (dropdown)
  - Data Início
  - Data Término
  - Status (Ativo, Inativo, Planejado, Descontinuado)
  - Observações
- Botões para adicionar/remover aplicações

**Validações:**
- Descrição é obrigatória
- ADR Substituta é obrigatória quando status = "Substituído"

### ADRDataTable
Tabela com filtros e pesquisa exibindo:
- Sequência (formato: ADR-001)
- Descrição
- Data Criação
- Status (com badges coloridos)
- ADR Substituta (se aplicável)
- Quantidade de Aplicações Associadas
- Ações (Visualizar, Editar, Excluir)

**Filtros:**
- Busca por descrição ou sequência
- Filtro por status

### ADRView
Modal de visualização detalhada mostrando:
- Cabeçalho com sequência e status
- Todas as informações do ADR formatadas
- Link para ADR substituta (se aplicável)
- Lista de aplicações associadas com:
  - Sigla e descrição
  - Período de vigência
  - Status
  - Observações

### ADRsView
Componente principal que:
- Lista todos os ADRs
- Gerencia abertura/fechamento do wizard
- Gerencia visualização de ADR
- Gerencia exclusão com confirmação
- Atualiza lista após operações

## Navegação

O sistema de ADR está disponível no menu lateral na seção **DevSecOps**, com o nome "Decisões Arquitetônicas".

## Características Especiais

### Sequência Auto-Incrementada
O campo `sequencia` é gerenciado automaticamente pelo banco de dados, sendo não editável pelo usuário. É exibido no formato `ADR-001`, `ADR-002`, etc.

### Status e Validações
- Quando status = "Substituído", o campo ADR Substituta torna-se obrigatório
- Badges coloridos indicam visualmente o status de cada ADR

### Associações com Aplicações
- Suporta múltiplas aplicações por ADR
- Cada associação tem período de vigência e status próprio
- Operações são atômicas (usa transações)

### Referências para ADR Substituta
- Relacionamento self-referencing permite criar cadeia de substituições
- A API retorna automaticamente a sequência da ADR substituta para facilitar exibição

## Integração com Constitution

O campo `compliance_constitution` permite documentar como a decisão arquitetônica está alinhada com os princípios e mandatos definidos na Constitution do projeto.

## Exemplos de Uso

### Criar ADR Proposto
1. Clicar em "Novo ADR"
2. Preencher descrição e contexto
3. Definir status como "Proposto"
4. Documentar justificativa e consequências
5. Associar aplicações que serão impactadas

### Aceitar ADR
1. Editar ADR existente
2. Atualizar status para "Aceito"
3. Adicionar informações finais sobre a decisão
4. Atualizar aplicações conforme necessário

### Substituir ADR
1. Criar novo ADR com a nova decisão
2. Editar o ADR antigo
3. Mudar status para "Substituído"
4. Selecionar o novo ADR no campo "ADR Substituta"
5. Sistema exibirá automaticamente o link entre eles

## Observações de Implementação

- **Transações:** Operações de CREATE e UPDATE usam transações para garantir consistência entre ADR e aplicações
- **UUID:** Todos os IDs são UUID v4 para garantir unicidade
- **Timestamps:** Campos created_at e updated_at são gerenciados automaticamente pelo MySQL
- **Cascata:** Exclusão de ADR remove automaticamente todas as associações com aplicações
- **Índices:** Criados para otimizar consultas por sequência, status e data

## Arquivos do Sistema

```
database/
  └── 40-create-adr-database.sql          # Schema SQL

src/
  ├── lib/
  │   └── types.ts                         # Tipos TypeScript (ADR, ADRAplicacao)
  ├── components/
  │   └── adr/
  │       ├── ADRWizard.tsx                # Wizard multi-etapas
  │       ├── ADRDataTable.tsx             # Tabela com filtros
  │       ├── ADRView.tsx                  # Visualização detalhada
  │       └── ADRsView.tsx                 # Container principal
  └── App.tsx                              # Registro de rota

server/
  └── api.js                               # Endpoints da API
```

## Melhorias Futuras

1. Exportação de ADR para formato Markdown
2. Histórico de mudanças de status
3. Notificações quando ADR é substituído
4. Dashboard com métricas de ADRs por status
5. Validação de conformidade automática com Constitution
6. Template de ADR customizável
7. Aprovação workflow para mudanças de status
8. Integração com sistema de versionamento (Git)
