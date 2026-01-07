# Documentação SDD (Spec-Driven Development)

Sistema completo de documentação estruturada e rastreável para projetos de desenvolvimento, integrado com ferramentas de IA e Azure DevOps.

## Características Principais

### 1. **Gestão de Projetos SDD**
- Associação com aplicações existentes
- Seleção de IA (Claude, Gemini, Copilot, Cursor Agent, etc.)
- Constituição com suporte a Markdown
- Integração com Gerador de Projetos

### 2. **Requisitos / Histórias de Usuário**
- Numeração automática (REQ-001, REQ-002, etc.)
- Nome com limite de 150 caracteres
- Descrição com suporte a Markdown e sem limite
- Fluxo de status com regras de transição:
  - **Fluxo Normal**: BACKLOG → REFINAMENTO → PRONTO P/DEV → DONE
  - **Status Especiais**: BLOQUEADO, EM RETRABALHO, SPIKE TÉCNICO, PAUSADO, CANCELADO, ROLLBACK
- Rastreamento de status anterior
- Botão "Restaurar Status Anterior" para status especiais

#### Regras de Transição de Status
- **BACKLOG**: Pode avançar apenas para REFINAMENTO
- **REFINAMENTO**: Pode avançar para PRONTO P/DEV ou retornar para BACKLOG
- **PRONTO P/DEV**: Pode retornar para REFINAMENTO ou BACKLOG, ou avançar para DONE
- **Status Especiais**: Podem ser aplicados a qualquer momento e registram o status anterior

### 3. **Tarefas**
- Vinculadas a requisitos específicos
- Descrição com suporte a Markdown
- Data de início auto-preenchida e não editável
- Data de término opcional
- Status: TO DO, IN PROGRESS, DONE
- Cálculo automático de dias decorridos
- Alerta visual para tarefas em IN PROGRESS por mais de 30 dias

#### Regras de Negócio
- Tarefas só podem ser criadas para requisitos com status "PRONTO P/DEV"
- Data de término não pode ser anterior à data de início
- Ao marcar como DONE, data de término é preenchida automaticamente
- Quando todas as tarefas de um requisito são concluídas, o requisito é automaticamente marcado como DONE
- Requisitos não podem ser excluídos se possuem tarefas não finalizadas

### 4. **Decisões Arquiteturais (ADRs)**
- Associação com ADRs pré-existentes
- Data de início auto-preenchida
- Data de término opcional
- Status: Proposta, Aceita, Supersedida, Depreciada

## Estrutura do Banco de Dados

### Tabelas

#### `projetos_sdd`
- `id` (VARCHAR 36): PK
- `aplicacao_id` (VARCHAR 36): FK para aplicacoes
- `nome_projeto` (VARCHAR 255): Nome do projeto
- `ia_selecionada` (VARCHAR 50): IA selecionada
- `constituicao` (TEXT): Constituição do projeto (Markdown)
- `gerador_projetos` (BOOLEAN): Incluir no gerador de projetos
- `created_at`, `updated_at`: Timestamps

#### `requisitos_sdd`
- `id` (VARCHAR 36): PK
- `projeto_id` (VARCHAR 36): FK para projetos_sdd
- `sequencia` (VARCHAR 20): REQ-XXX
- `nome` (VARCHAR 150): Nome do requisito
- `descricao` (TEXT): Descrição com Markdown
- `status` (VARCHAR 50): Status atual
- `status_anterior` (VARCHAR 50): Status anterior (para restauração)
- `created_at`, `updated_at`: Timestamps

#### `tarefas_sdd`
- `id` (VARCHAR 36): PK
- `requisito_id` (VARCHAR 36): FK para requisitos_sdd
- `descricao` (TEXT): Descrição da tarefa
- `data_inicio` (DATE): Data de início (não editável)
- `data_termino` (DATE): Data de término
- `status` (VARCHAR 50): TO DO, IN PROGRESS, DONE
- `created_at`, `updated_at`: Timestamps

#### `decisoes_arquiteturais_sdd`
- `id` (VARCHAR 36): PK
- `projeto_id` (VARCHAR 36): FK para projetos_sdd
- `adr_id` (VARCHAR 36): FK para adrs
- `data_inicio` (DATE): Data de início
- `data_termino` (DATE): Data de término
- `status` (VARCHAR 50): Status da decisão
- `created_at`, `updated_at`: Timestamps

## API Endpoints

### Projetos
- `GET /api/sdd/projetos` - Listar todos os projetos
- `GET /api/sdd/projetos/:id` - Buscar projeto específico
- `POST /api/sdd/projetos` - Criar novo projeto
- `PUT /api/sdd/projetos/:id` - Atualizar projeto
- `DELETE /api/sdd/projetos/:id` - Deletar projeto

### Requisitos
- `GET /api/sdd/requisitos/:projetoId` - Listar requisitos do projeto
- `POST /api/sdd/requisitos` - Criar novo requisito
- `PUT /api/sdd/requisitos/:id` - Atualizar requisito
- `PUT /api/sdd/requisitos/:id/restaurar-status` - Restaurar status anterior
- `DELETE /api/sdd/requisitos/:id` - Deletar requisito

### Tarefas
- `GET /api/sdd/tarefas/:requisitoId` - Listar tarefas do requisito
- `POST /api/sdd/tarefas` - Criar nova tarefa
- `PUT /api/sdd/tarefas/:id` - Atualizar tarefa
- `DELETE /api/sdd/tarefas/:id` - Deletar tarefa

### Decisões Arquiteturais
- `GET /api/sdd/decisoes/:projetoId` - Listar decisões do projeto
- `POST /api/sdd/decisoes` - Criar nova decisão
- `PUT /api/sdd/decisoes/:id` - Atualizar decisão
- `DELETE /api/sdd/decisoes/:id` - Deletar decisão

## Componentes React

### Principais
- `DocumentacaoSDDView` - View principal com lista de projetos
- `ProjetoSDDForm` - Formulário de criação/edição de projetos
- `ProjetoSDDDetail` - Visualização detalhada do projeto com abas

### Requisitos
- `RequisitosList` - Lista de requisitos com expansão para tarefas
- `RequisitoForm` - Formulário de criação/edição de requisitos

### Tarefas
- `TarefasList` - Lista de tarefas de um requisito
- `TarefaForm` - Formulário de criação/edição de tarefas

### Decisões Arquiteturais
- `DecisoesArquiteturaisList` - Lista de ADRs associados
- `DecisaoADRForm` - Formulário de associação de ADRs

## Tipos TypeScript

Todos os tipos estão definidos em `src/types/sdd.ts`:
- `IAType` - Tipos de IA suportadas
- `StatusRequisito` - Status possíveis dos requisitos
- `StatusTarefa` - Status das tarefas
- `StatusADR` - Status das decisões arquiteturais
- `ProjetoSDD`, `RequisitoSDD`, `TarefaSDD`, `DecisaoArquiteturalSDD` - Interfaces principais

## Validações e Regras

### Requisitos
- Nome obrigatório (máximo 150 caracteres)
- Transições de status validadas
- Status anterior registrado para restauração
- Não podem ser excluídos com tarefas não finalizadas

### Tarefas
- Descrição obrigatória
- Data de término não pode ser anterior à data de início
- Auto-conclusão de requisito quando todas as tarefas estão DONE
- Alerta para tarefas em progresso por mais de 30 dias
- Só podem ser criadas para requisitos em "PRONTO P/DEV"

### Decisões Arquiteturais
- ADR obrigatório
- Data de início auto-preenchida
- Status com fluxo próprio

## Integração com Azure DevOps

O sistema está preparado para integração com Azure DevOps, permitindo sincronização de work items e rastreamento de desenvolvimento.

## Suporte a Markdown

Os seguintes campos suportam Markdown:
- Constituição do projeto
- Descrição de requisitos
- Descrição de tarefas

Isso permite documentação rica com formatação, listas, código, links, etc.
