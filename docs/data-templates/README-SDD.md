# Documentação SDD (Spec-Driven Development)

Sistema completo de documentação estruturada e rastreável para projetos de desenvolvimento, integrado com ferramentas de IA e Azure DevOps.

## 📋 Características Principais

### 1. **Gestão de Projetos SDD**
- Associação com aplicações existentes (opcional)
- Seleção de IA: **claude**, **gemini**, **copilot**, **cursor-agent**, **windsurf**, **qwen**, **opencode**, **codex**, **kilocode**, **auggie**, **roo**, **codebuddy**, **amp**, **shai**, **q**, **bobouqoder**
- Constituição com suporte a Markdown (campo de 10 linhas com scrollbar)
- Upload de arquivo Markdown para constituição (limite: 500KB)
- Integração com Gerador de Projetos
- Campo `gerador_projetos` indica se foi gerado automaticamente

### 2. **Requisitos / Histórias de Usuário**
- Numeração automática (REQ-001, REQ-002, etc.)
- Nome com limite de 150 caracteres
- Descrição com suporte a Markdown (sem limite)
- Fluxo de status com regras de transição:
  - **Fluxo Normal**: BACKLOG → REFINAMENTO → PRONTO P/DEV → DONE
  - **Status Especiais**: BLOQUEADO, EM RETRABALHO, SPIKE TÉCNICO, PAUSADO, CANCELADO, ROLLBACK
- Status "PRONTO P/DEV" permite criação de tarefas e exportação como PBI no Azure
- Status especiais registram o status anterior para restauração
- Contador de tarefas (`tarefas_count` e `tarefas_done_count`)
- Visualização expansível de tarefas na lista

#### Regras de Transição de Status
- **BACKLOG**: Pode avançar para REFINAMENTO ou aplicar status especial
- **REFINAMENTO**: Pode avançar para PRONTO P/DEV ou voltar para BACKLOG
- **PRONTO P/DEV**: Permite criação de tarefas e exportação como PBI no Azure
- **Status Especiais**: Podem ser aplicados a qualquer momento e registram o status anterior
- **Restauração**: Botão "Restaurar Status Anterior" disponível para status especiais
- Requisitos fecham automaticamente ao abrir formulário de criação/edição

### 3. **Tarefas**
- Vinculadas a requisitos específicos (status "PRONTO P/DEV")
- Descrição com suporte a Markdown
- Numeração automática (TASK-001, TASK-002, etc.)
- Data de início (padrão: data atual)
- Data de término opcional
- Status: **TO DO**, **IN PROGRESS**, **DONE**
- Cálculo automático de dias decorridos
- Ordenação por `data_inicio` nas exportações

#### Regras de Negócio
- Tarefas só podem ser criadas para requisitos com status **"PRONTO P/DEV"**
- Data de término não pode ser anterior à data de início
- Status inicial sempre **"TO DO"**
- Tarefas com status "TO DO" são exportadas como Tasks no Azure DevOps
- Requisitos não podem ser excluídos se possuem tarefas não finalizadas

### 4. **Decisões Arquiteturais (ADRs)**
- Associação com ADRs pré-existentes no sistema
- Data de início auto-preenchida
- Data de término opcional
- Justificativa da associação (opcional)
- Permite vincular múltiplos ADRs ao mesmo projeto

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
  - **Regra**: Requisito deve estar em "PRONTO P/DEV"
  - **Payload**: `{ requisito_id, descricao, data_inicio? }`
  - **Resposta**: Retorna tarefa com status "TO DO" e sequência TASK-XXX
- `PUT /api/sdd/tarefas/:id` - Atualizar tarefa
- `DELETE /api/sdd/tarefas/:id` - Deletar tarefa

### Decisões Arquiteturais
- `GET /api/sdd/decisoes/:projetoId` - Listar decisões do projeto
- `POST /api/sdd/decisoes` - Criar nova decisão
- `PUT /api/sdd/decisoes/:id` - Atualizar decisão
- `DELETE /api/sdd/decisoes/:id` - Deletar decisão

## 🔄 Integração com Azure DevOps

O sistema possui integração automatizada com Azure DevOps para criação de Work Items:

### Criação de PBIs (Product Backlog Items)
- **Origem**: Requisitos com status **"PRONTO P/DEV"**
- **Formato do Título**: `{SEQUENCIA} - {NOME}` (ex: "REQ-001 - Implementar autenticação")
- **Truncamento**: Títulos >255 chars são truncados para 253 chars + "..."
- **Status no Azure**: "New"
- **Descrição**: Campo `descricao` do requisito

### Criação de Tasks
- **Origem**: Tarefas com status **"TO DO"**
- **Formato do Título**: `{REQ_SEQ} - {TASK_SEQ} : {DESCRICAO}` (ex: "REQ-001 - TASK-001 : Configurar JWT")
- **Truncamento**: Mesma regra dos PBIs
- **Status no Azure**: "To Do"
- **Ordenação**: Por `data_inicio` (crescente)
- **Vinculação**: Automaticamente vinculadas aos PBIs correspondentes

### Endpoint de Integração
```bash
POST /api/azure-devops/integrar-projeto
```

**Comportamento**:
1. Busca projeto SDD pelo `aplicacao_base_id`
2. Filtra requisitos por status "PRONTO P/DEV"
3. Para cada requisito, cria PBI no Azure
4. Filtra tarefas por status "TO DO"
5. Para cada tarefa, cria Task vinculada ao PBI
6. Retorna IDs dos Work Items criados

**Logs Detalhados**: O sistema registra cada etapa da criação no console do servidor para debug.

## 📊 Exportações e Impressão

- **Impressão**: Botão na tabela gera HTML completo formatado para impressão
- **Download JSON**: Exporta projeto completo com requisitos e tarefas aninhados
- **Backup**: Útil para backup e integração com outras ferramentas

## 🎨 Componentes React

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

## 📝 Validações e Regras

### Requisitos
- Nome obrigatório (máximo 150 caracteres)
- Fecham automaticamente quando abrir formulário de criação/edição
- Não podem ser excluídos com tarefas não finalizadas
- Retornam contadores de tarefas totais e concluídas

### Tarefas
- Descrição obrigatória
- Data de início não editável (auto-preenchida)
- Só podem ser criadas para requisitos em **"PRONTO P/DEV"**
- Numeração automática com sequencial único

### Decisões Arquiteturais
- ADR obrigatório (seleção de ADRs existentes)
- Justificativa opcional
- Permite múltiplas associações ao mesmo projeto

## 💾 Banco de Dados

### Tabelas Principais

#### `projetos_sdd`
Armazena os projetos do Spec-Kit com metadados e configurações.

**Campos principais**:
- `id`: UUID do projeto
- `aplicacao_id`: Vinculação opcional com aplicação existente
- `nome_projeto`: Nome descritivo do projeto
- `ia_selecionada`: IA utilizada (Copilot, Claude, Cursor, Windsurf, Gemini, Sem IA)
- `constituicao`: Documento Markdown com instruções e contexto
- `gerador_projetos`: Flag indicando se foi gerado automaticamente

#### `requisitos_sdd`
Armazena requisitos/histórias de usuário com numeração sequencial.

**Campos principais**:
- `projeto_id`: FK para o projeto
- `sequencia`: Numeração automática (REQ-001, REQ-002...)
- `nome`: Título do requisito (máx 150 chars)
- `descricao`: Descrição detalhada em Markdown
- `status`: Status atual (BACKLOG, EM DEV, PRONTO P/DEV, EM QA, PRONTO P/PROD, DONE)

**Joins**: A consulta retorna `tarefas_count` e `tarefas_done_count` agregados.

#### `tarefas_sdd`
Armazena tarefas vinculadas aos requisitos.

**Campos principais**:
- `requisito_id`: FK para o requisito
- `sequencia`: Numeração automática (TASK-001, TASK-002...)
- `descricao`: Descrição da tarefa em Markdown
- `data_inicio`: Data de início (não editável após criação)
- `data_termino`: Data de conclusão (opcional)
- `status`: TO DO, IN PROGRESS, DONE

**Cálculos**: A consulta retorna `dias_decorridos` calculado dinamicamente.

#### `decisoes_arquiteturais_sdd`
Associação entre projetos SDD e ADRs do sistema.

**Campos principais**:
- `projeto_id`: FK para projetos_sdd
- `adr_id`: FK para tabela adrs
- `justificativa`: Texto explicativo da associação (opcional)
- `data_inicio`, `data_termino`: Período de vigência

### Índices e Performance
- `idx_aplicacao` em `projetos_sdd.aplicacao_id`
- `idx_nome` em `projetos_sdd.nome_projeto`
- `idx_projeto` em `requisitos_sdd.projeto_id`
- `idx_requisito` em `tarefas_sdd.requisito_id`

## 🔗 Relacionamentos

Os seguintes campos suportam Markdown:
- Constituição do projeto
- Descrição de requisitos
- Descrição de tarefas

Isso permite documentação rica com formatação, listas, código, links, etc.
