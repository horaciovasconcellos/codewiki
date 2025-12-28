# Pipeline Database - Sistema de Auditoria

## 📋 Visão Geral

O **Pipeline Database** é um módulo completo para gerenciamento de pipelines de CI/CD, permitindo documentar e rastrear configurações de pipelines, seus stages associados e todas as configurações de triggers, recursos e schedules.

## 🏗️ Estrutura

### Tabelas do Banco de Dados

#### 1. `pipelines`
Tabela principal que armazena as configurações das pipelines.

**Campos:**
- `id` (UUID, PK): Identificador único da pipeline
- `nome` (VARCHAR 100): Nome da pipeline
- `status` (ENUM): Status atual
  - `'Ativa'`
  - `'Em avaliação'`
  - `'Obsoleta'`
  - `'Descontinuada'`
- `data_inicio` (DATE): Data de início da pipeline
- `data_termino` (DATE): Data de término/desativação

**Grupo Trigger:**
- `trigger_branches` (TEXT): Branches que acionam a pipeline
- `trigger_paths` (TEXT): Paths monitorados para triggers

**Grupo PR:**
- `pr_branches` (TEXT): Branches alvo para Pull Requests

**Variables:**
- `variables` (TEXT): Variáveis de ambiente e configurações

**Grupo Resources:**
- `resources_repositories` (TEXT): Repositórios utilizados
- `resources_pipelines` (TEXT): Pipelines referenciadas
- `resources_containers` (TEXT): Containers utilizados

**Grupo Schedules:**
- `schedules` (TEXT): Agendamentos (cron expressions, etc.)

**Metadados:**
- `created_at` (TIMESTAMP): Data de criação do registro
- `updated_at` (TIMESTAMP): Data da última atualização

#### 2. `pipeline_stages`
Tabela de associação entre pipelines e stages, com informações adicionais de execução.

**Campos:**
- `id` (UUID, PK): Identificador único da associação
- `pipeline_id` (UUID, FK): Referência à pipeline
- `stage_id` (UUID, FK): Referência ao stage
- `status` (ENUM): Status do stage na pipeline
  - `'Ativa'`
  - `'Em avaliação'`
  - `'Obsoleta'`
  - `'Descontinuada'`
- `data_inicio` (DATE, NOT NULL): Data de início do stage (default: hoje)
- `data_termino` (DATE): Data de término do stage
- `ordem` (INT): Ordem de execução do stage na pipeline
- `created_at` (TIMESTAMP): Data de criação do registro
- `updated_at` (TIMESTAMP): Data da última atualização

**Constraints:**
- Foreign Key para `pipelines(id)` com `ON DELETE CASCADE`
- Foreign Key para `stages(id)` com `ON DELETE CASCADE`

## 🎨 Interface do Usuário

### 1. Tela Principal - DataTable

A primeira tela exibe uma tabela com todas as pipelines cadastradas:

**Colunas:**
- UUID
- Nome
- Status (com badges coloridos)
- Data de Início
- Data de Término
- Ações (Editar/Excluir)

**Features:**
- Botão "Nova Pipeline" para criar registros
- Busca e filtros
- Paginação
- Status com cores:
  - 🟢 **Verde**: Ativa
  - 🟡 **Amarelo**: Em avaliação
  - ⚫ **Cinza**: Obsoleta
  - 🔴 **Vermelho**: Descontinuada

### 2. Wizard de Criação/Edição

O wizard é dividido em **5 steps**:

#### **Step 1: Informações Básicas**
- Nome (obrigatório, max 100 caracteres)
- Status (dropdown com 4 opções)
- Data de Início (date picker, default: hoje)
- Data de Término (date picker, opcional)

#### **Step 2: Trigger & PR**

**Grupo Trigger:**
- Branches (textarea) - Ex: `main, develop, feature/*`
- Paths (textarea) - Ex: `src/**, tests/**`

**Grupo PR:**
- Branches (textarea) - Ex: `main, develop`

#### **Step 3: Resources**

**Grupo Resources:**
- Repositories (textarea) - Ex: `self, repo1, repo2`
- Pipelines (textarea) - Ex: `pipeline1, pipeline2`
- Containers (textarea) - Ex: `container1:latest, container2:v1.0`

#### **Step 4: Schedules & Variables**
- Schedules (textarea) - Ex: `cron: '0 0 * * *'`
- Variables (textarea) - Ex: `VAR1=value1, VAR2=value2`

#### **Step 5: Stages**

DataTable interno para gerenciar stages da pipeline:

**Colunas:**
- Stage (lookup do stages cadastrados)
- Tipo (do stage selecionado)
- Status (dropdown: Ativa, Em avaliação, Obsoleta, Descontinuada)
- Data de Início (date picker, obrigatório, default: hoje)
- Data de Término (date picker, opcional)
- Ações (Remover)

**Funcionalidades:**
- Botão "Adicionar Stage" abre dialog
- Dialog permite selecionar stage existente
- Stages são ordenados automaticamente (campo `ordem`)
- Exclusão de stages individuais

## 🔌 API Endpoints

### Listar Pipelines
```http
GET /api/pipelines
```
Retorna array com todas as pipelines (sem stages).

### Buscar Pipeline por ID
```http
GET /api/pipelines/:id
```
Retorna pipeline específica com array de stages populado.

**Response:**
```json
{
  "id": "uuid",
  "nome": "Backend API Pipeline",
  "status": "Ativa",
  "dataInicio": "2024-01-01",
  "dataTermino": null,
  "triggerBranches": "main, develop",
  "triggerPaths": "src/**",
  "prBranches": "main",
  "variables": "NODE_ENV=production",
  "resourcesRepositories": "self",
  "resourcesPipelines": null,
  "resourcesContainers": "node:18-alpine",
  "schedules": "cron: '0 0 * * *'",
  "stages": [
    {
      "id": "stage-uuid",
      "pipelineId": "pipeline-uuid",
      "stageId": "stage-ref-uuid",
      "status": "Ativa",
      "dataInicio": "2024-01-01",
      "dataTermino": null,
      "ordem": 0,
      "stage": {
        "id": "stage-ref-uuid",
        "nome": "Build",
        "tipo": "Build",
        "descricao": "Compilação do código"
      }
    }
  ]
}
```

### Criar Pipeline
```http
POST /api/pipelines
Content-Type: application/json

{
  "nome": "Nova Pipeline",
  "status": "Em avaliação",
  "dataInicio": "2024-01-01",
  "dataTermino": null,
  "triggerBranches": "main",
  "triggerPaths": "src/**",
  "prBranches": "main",
  "variables": "ENV=prod",
  "resourcesRepositories": "self",
  "resourcesPipelines": null,
  "resourcesContainers": "node:18",
  "schedules": null,
  "stages": [
    {
      "stageId": "stage-uuid",
      "status": "Ativa",
      "dataInicio": "2024-01-01",
      "dataTermino": null,
      "ordem": 0
    }
  ]
}
```

**Response:** `201 Created` com objeto da pipeline criada.

### Atualizar Pipeline
```http
PUT /api/pipelines/:id
Content-Type: application/json
```
Payload igual ao POST. Remove e recria todos os stages.

**Response:** `200 OK` com objeto atualizado.

### Excluir Pipeline
```http
DELETE /api/pipelines/:id
```
Exclui pipeline e seus stages (cascade).

**Response:** `204 No Content`

## 📊 Componentes React

### Hierarquia de Componentes

```
PipelinesView (container principal)
├── PipelinesDataTable (listagem)
└── PipelineWizard (criação/edição)
    └── Dialog (adicionar stage)
```

### Arquivos Criados

1. **`src/components/pipelines/PipelinesView.tsx`**
   - Container principal
   - Gerencia estado e navegação
   - Dialog de confirmação de exclusão

2. **`src/components/pipelines/PipelinesDataTable.tsx`**
   - Tabela de listagem
   - Badges de status coloridos
   - Botões de ação

3. **`src/components/pipelines/PipelineWizard.tsx`**
   - Wizard multi-step (5 passos)
   - Formulários para cada grupo
   - DataTable interno para stages
   - Dialog para adicionar stages

## 🔍 Tipos TypeScript

Definidos em `src/lib/types.ts`:

```typescript
export type StatusPipeline = 'Ativa' | 'Em avaliação' | 'Obsoleta' | 'Descontinuada';

export interface Pipeline {
  id: string;
  nome: string;
  status: StatusPipeline;
  dataInicio?: string;
  dataTermino?: string;
  triggerBranches?: string;
  triggerPaths?: string;
  prBranches?: string;
  variables?: string;
  resourcesRepositories?: string;
  resourcesPipelines?: string;
  resourcesContainers?: string;
  schedules?: string;
  createdAt?: string;
  updatedAt?: string;
  stages?: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  stageId: string;
  status: StatusPipeline;
  dataInicio: string;
  dataTermino?: string;
  ordem: number;
  stage?: Stage;
}
```

## 🚀 Como Usar

### 1. Acessar o Menu
Navegue para **DevSecOps > Pipeline Database** no menu lateral.

### 2. Criar Nova Pipeline
1. Clique no botão "Nova Pipeline"
2. Preencha as informações básicas (Step 1)
3. Configure triggers e PRs (Step 2)
4. Defina resources (Step 3)
5. Configure schedules e variables (Step 4)
6. Adicione stages à pipeline (Step 5)
7. Clique em "Salvar Pipeline"

### 3. Editar Pipeline Existente
1. Na tabela principal, clique no ícone de edição
2. Modifique os campos necessários no wizard
3. Adicione/remova stages conforme necessário
4. Salve as alterações

### 4. Excluir Pipeline
1. Na tabela principal, clique no ícone de exclusão
2. Confirme a exclusão no dialog
3. A pipeline e seus stages serão removidos

## 📝 Notas Importantes

1. **Nome é obrigatório** - Único campo obrigatório além de status
2. **Data de início default** - Stages sempre iniciam com data_inicio = hoje
3. **Cascade delete** - Excluir pipeline remove automaticamente seus stages
4. **Status padronizado** - Mesmo enum usado em pipelines e pipeline_stages
5. **Ordem automática** - Stages são ordenados pela ordem de adição
6. **Campos TEXT** - Todos os campos de configuração (branches, paths, etc.) são TEXT para flexibilidade

## 🔗 Integração com Stages

O Pipeline Database está integrado com o módulo **Stages** existente:
- Stages devem ser cadastrados primeiro em **DevSecOps > Stages**
- No wizard de Pipeline, você seleciona stages já cadastrados
- Cada stage pode ser reutilizado em múltiplas pipelines
- A tabela `stages` não é modificada pelo Pipeline Database

## 📂 Arquivos do Sistema

### Banco de Dados
- `database/31-create-pipelines.sql` - Schema das tabelas

### Backend
- `server/api.js` - Endpoints (linhas após endpoints de Stages)

### Frontend
- `src/components/pipelines/PipelinesView.tsx`
- `src/components/pipelines/PipelinesDataTable.tsx`
- `src/components/pipelines/PipelineWizard.tsx`
- `src/lib/types.ts` - Tipos Pipeline e PipelineStage
- `src/App.tsx` - Roteamento e menu

## 🎯 Exemplo de Uso

### Pipeline de Backend Node.js

**Informações Básicas:**
- Nome: Backend API Pipeline
- Status: Ativa
- Data Início: 2024-01-01

**Trigger & PR:**
- Trigger Branches: `main, develop, feature/*`
- Trigger Paths: `src/**, package.json`
- PR Branches: `main, develop`

**Resources:**
- Repositories: `self`
- Containers: `node:18-alpine, postgres:15`

**Schedules & Variables:**
- Schedules: `cron: '0 2 * * *'`
- Variables: `NODE_ENV=production, PORT=3000`

**Stages:**
1. Build (Status: Ativa, Início: 2024-01-01)
2. Test (Status: Ativa, Início: 2024-01-01)
3. Security Scan (Status: Ativa, Início: 2024-01-15)
4. Deploy (Status: Ativa, Início: 2024-01-01)

---

**Última Atualização:** $(date '+%Y-%m-%d')
