# Funcionalidades do Sistema

Este documento descreve detalhadamente todas as funcionalidades do Sistema de Auditoria, incluindo propósito, fluxo de uso e critérios de sucesso.

## Visão Geral

O sistema oferece **15 funcionalidades essenciais** organizadas em módulos:

- **Gestão de Colaboradores**: Cadastro, habilidades, afastamentos
- **Gestão de Tipos**: Tipos de afastamento personalizáveis
- **Gestão de Tecnologias**: Inventário e responsáveis
- **Gestão de Aplicações**: Catálogo corporativo
- **Gestão de Processos**: Processos de negócio e normativas
- **Geração de Projetos**: Automação de estruturas padronizadas

---

## 1. Cadastro de Tipos de Afastamento

### Descrição
Criar, visualizar, editar e excluir tipos de afastamento personalizados que serão utilizados em toda organização.

### Campos

| Campo | Tipo | Tamanho | Validação |
|-------|------|---------|-----------|
| Sigla | Alfanumérico | 3 | Regex: `^[A-Za-z0-9]{3}$` |
| Descrição | Texto | 50 | Obrigatório |
| Argumentação Legal | Texto | 60 | Obrigatório |
| Número de Dias | Numérico | 1-99 | Regex: `^\d{1,2}$` |
| Tipo de Tempo | Select | - | Consecutivo / Não Consecutivo |

### Fluxo de Uso

1. Menu lateral → **"Tipos de Afastamento"**
2. Clique em **"Novo Tipo de Afastamento"**
3. Preencha formulário com validações em tempo real
4. Sistema valida sigla única (case-insensitive)
5. Clique em **"Salvar"**
6. Confirmação de sucesso
7. Tabela atualizada automaticamente

### Validações

- ✅ Sigla única no sistema
- ✅ Formato alfanumérico de 3 caracteres
- ✅ Número de dias entre 1 e 99
- ✅ Todos os campos obrigatórios preenchidos

### Critérios de Sucesso

- Tipo criado com sigla única
- Dados persistidos no banco
- Disponível imediatamente para uso em afastamentos

---

## 2. Cadastro de Colaboradores

### Descrição
Criar e gerenciar registros completos de colaboradores usando wizard multi-etapa com dados básicos, afastamentos e habilidades.

### Wizard de Cadastro

#### Etapa 1: Dados Básicos

| Campo | Tipo | Validação |
|-------|------|-----------|
| Matrícula | Texto | Única, obrigatória |
| Nome | Texto | Obrigatório |
| Setor | Texto | Obrigatório |
| Data Admissão | Data | Obrigatória |
| Data Demissão | Data | Opcional |

#### Etapa 2: Afastamentos

- Seleção de tipo via combobox (tipos cadastrados)
- Data inicial provável
- Data final provável
- Data inicial efetiva (opcional)
- Data final efetiva (opcional)
- Suporte a múltiplos afastamentos

#### Etapa 3: Habilidades

- Seleção de habilidade (catálogo pré-cadastrado)
- Nível declarado (Básico/Intermediário/Avançado/Expert)
- Nível avaliado (Básico/Intermediário/Avançado/Expert)
- Data início
- Data término (opcional)

### Fluxo de Uso

1. **"Colaboradores"** → **"Novo Colaborador"**
2. Wizard etapa 1: Preencher dados básicos
3. Wizard etapa 2: Adicionar afastamentos (opcional)
4. Wizard etapa 3: Adicionar habilidades (opcional)
5. Revisar informações
6. **"Salvar"**

### Validações

- ✅ Matrícula única
- ✅ Data demissão posterior à admissão
- ✅ Datas de afastamento válidas
- ✅ Habilidades não duplicadas para mesmo colaborador
- ✅ Data término de habilidade posterior ao início

### Critérios de Sucesso

- Colaborador criado com matrícula única
- Habilidades e afastamentos vinculados
- Aparece na listagem com contadores
- Detalhes acessíveis em abas organizadas

---

## 3. Gestão de Habilidades

### Descrição
Mapear competências técnicas e comportamentais da equipe para alocação em projetos e planejamento de treinamentos.

### Diferencial: Níveis Declarado vs Avaliado

| Nível Declarado | Nível Avaliado | Interpretação |
|----------------|----------------|---------------|
| Avançado | Intermediário | Gap de competência |
| Básico | Básico | Alinhado |
| Expert | Expert | Alta senioridade |

### Habilidades Pré-cadastradas

**Técnicas:**
- Java, Python, React, Angular
- Oracle, PostgreSQL
- Docker, Kubernetes

**Comportamentais:**
- Scrum, Liderança

### Fluxo de Uso

1. Durante cadastro/edição de colaborador
2. Etapa **"Habilidades"** no wizard
3. Selecionar habilidade do catálogo
4. Definir nível declarado
5. Definir nível avaliado
6. Informar período de vigência
7. Adicionar à lista
8. Repetir para múltiplas habilidades

### Critérios de Sucesso

- Habilidades vinculadas com níveis diferenciados
- Períodos de vigência registrados
- Visível em tabela detalhada na visualização do colaborador

---

## 4. Controle de Status (Ativo/Demitido)

### Descrição
Bloquear automaticamente edição e alocação de colaboradores demitidos para garantir integridade de dados.

### Comportamento

| Status | Data Demissão | Edição | Badge | Alocação |
|--------|---------------|--------|-------|----------|
| Ativo | Vazio | ✅ Permitida | Verde | ✅ Permitida |
| Demitido | Preenchida | ❌ Bloqueada | Vermelho | ❌ Bloqueada |

### Fluxo de Uso

1. Editar colaborador
2. Preencher **"Data de Demissão"**
3. Sistema automaticamente:
   - Bloqueia edições futuras
   - Exibe badge visual "Demitido"
   - Impede alocação em projetos
   - Mantém histórico disponível para leitura

### Critérios de Sucesso

- Colaboradores demitidos são **somente leitura**
- Claramente identificados visualmente
- Histórico preservado para auditoria

---

## 5. Gestão de Afastamentos

### Descrição
Registrar afastamentos planejados (prováveis) e efetivos usando tipos padronizados, com validações de consecutividade.

### Tipos de Período

| Tipo | Provável | Efetivo |
|------|----------|---------|
| Planejado | ✅ Preenchido | ⚪ Vazio |
| Executado | ✅ Preenchido | ✅ Preenchido |

### Fluxo de Uso

**Durante Cadastro:**
1. Wizard etapa **"Afastamentos"**
2. Selecionar tipo (combobox de tipos cadastrados)
3. Inserir datas inicial/final prováveis
4. Opcionalmente inserir datas efetivas
5. Sistema valida consecutividade
6. Adicionar à tabela
7. Repetir para múltiplos afastamentos

**API Externa (Períodos Efetivos):**
1. Sistema externo envia POST para endpoint
2. Validação de dados
3. Persistência automática
4. Atualização da UI
5. Períodos efetivos **não editáveis** pelo usuário

### Validações

- ✅ Tipo obrigatoriamente cadastrado
- ✅ Data final posterior à inicial
- ✅ Compatibilidade com tipo de tempo (Consecutivo/Não Consecutivo)
- ✅ Restrição a ano corrente e próximo ano

### Critérios de Sucesso

- Afastamentos salvos com tipos válidos
- Datas validadas
- Distinção visual entre planejado e executado
- Comparação provável vs efetivo facilitada

---

## 6. Visualização Detalhada de Colaboradores

### Descrição
Interface organizada em abas para navegação eficiente entre dados básicos, afastamentos e habilidades.

### Estrutura de Abas

```
┌─────────────────────────────────────────────────┐
│  Colaborador: João Silva (5664)          [Editar]│
├─────────────────────────────────────────────────┤
│  [Dados Básicos] [Afastamentos] [Habilidades]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Conteúdo da aba selecionada                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Aba: Dados Básicos

- Matrícula
- Nome completo
- Setor
- Data de admissão
- Data de demissão (se aplicável)
- Status visual (Ativo/Demitido)

### Aba: Afastamentos

Tabela com colunas:

| Tipo | Provável Inicial | Provável Final | Efetivo Inicial | Efetivo Final | Ações |
|------|------------------|----------------|-----------------|---------------|-------|
| FER | 2025-01-15 | 2025-02-15 | 2025-01-15 | 2025-02-10 | ✏️ 🗑️ |

### Aba: Habilidades

| Habilidade | Nível Declarado | Nível Avaliado | Data Início | Data Término | Ações |
|------------|-----------------|----------------|-------------|--------------|-------|
| Java | Avançado | Intermediário | 2023-01-01 | - | ✏️ 🗑️ |

### Fluxo de Uso

1. Lista de colaboradores
2. Clique no ícone de visualização
3. Tela fullscreen
4. Navegação entre abas
5. Botões de ação no header (Editar/Excluir)

### Critérios de Sucesso

- Informações organizadas logicamente
- Navegação fluida entre seções
- Padrão visual consistente com outras telas
- Ações acessíveis em cada contexto

---

## 7. Gerador de Estruturas de Projeto

### Descrição
Interface CLI interativa para criação automatizada de estruturas padronizadas de projeto com integração Azure DevOps.

### Parâmetros Obrigatórios

| Campo | Tipo | Origem |
|-------|------|--------|
| Produto | Select | Aplicações cadastradas (sigla + descrição) |
| Projeto | Texto | Livre |
| Data Inicial | Data | ISO (YYYY-MM-DD) |
| Iteração | Numérico | Inteiro positivo |

### Parâmetros Opcionais

- ☑️ Share Queries
- ☑️ Configuração Maven
- ☑️ Scripts Liquibase

### Cadastro de Repositórios

Tabela parametrizada com campos:

| Produto | Categoria | Tecnologia | Nome do Repositório |
|---------|-----------|------------|---------------------|
| SISAUD ▼ | backend ▼ | java ▼ | `SISAUD-backend-java` (auto) |

#### Categorias Disponíveis

- `analiticos`, `api`, `app`, `batch`, `dashboard`
- `etl`, `frontend`, `backend`, `integracao`, `portal`, `svc`

#### Tecnologias Disponíveis

- `airflow`, `angular`, `databricks`, `go`, `java`, `kotlin`
- `mulesoft`, `node`, `php`, `plsql`, `powerbi`, `python`
- `react`, `spark`, `ords`

### Nomenclatura Automática

O sistema **concatena automaticamente**:

```
nome_repositorio = produto + "-" + categoria + "-" + tecnologia
```

**Exemplos:**
- `PORTAL-frontend-react`
- `FINANCE-api-java`
- `RHUMANO-etl-python`

### Fluxo de Uso

1. Menu **"Gerador de Estruturas"**
2. Selecionar **Produto** (Select de aplicações)
3. Preencher **Projeto**, **Data**, **Iteração**
4. Cadastrar repositórios:
   - Select produto (aplicações)
   - Select categoria
   - Select tecnologia
   - Nome gerado automaticamente
5. Marcar componentes opcionais (checkboxes)
6. Validar campos obrigatórios
7. **"Gerar Estrutura"**
8. Sistema executa script `git-azcesuc`
9. Exibir resultado com estruturas criadas

### Validações

- ✅ Produto obrigatório (aplicação cadastrada)
- ✅ Data em formato ISO válido
- ✅ Iteração numérica positiva
- ✅ Repositórios sem siglas duplicadas
- ✅ Sigla do repositório entre 3-10 caracteres

### Critérios de Sucesso

- Estruturas criadas conforme especificação
- Repositórios com nomenclatura padronizada
- Componentes selecionados gerados
- Script final executado com sucesso
- Feedback visual claro incluindo nomes completos

---

## 8. Gestão de Aplicações

### Descrição
Catálogo corporativo de aplicações com vinculação a capacidades de negócio, SLAs e métricas.

### Campos Principais

- Sigla (identificador único)
- Descrição
- Capacidades de negócio vinculadas
- SLAs associados
- Criticidade (Baixa/Média/Alta/Crítica)
- Custo estimado
- Ciclo de vida

### Funcionalidades

- ✅ CRUD completo
- ✅ Vinculação com capacidades
- ✅ Associação de SLAs
- ✅ Métricas de criticidade
- ✅ Visualização detalhada

---

## 9. Gestão de Tecnologias

### Descrição
Inventário de tecnologias utilizadas com responsáveis, contratos, custos e documentação técnica.

### Campos Principais

- Nome da tecnologia
- Versão
- Responsável técnico
- Responsável de negócio
- Tipo de contrato
- Custo mensal
- Data de renovação
- Documentação

### Funcionalidades

- ✅ CRUD completo
- ✅ Controle de contratos
- ✅ Gestão de responsáveis
- ✅ Tracking de custos
- ✅ Gestão de manutenções
- ✅ Documentação técnica

---

## 10. Gestão de Processos de Negócio

### Descrição
Mapeamento de processos corporativos com normativas, responsáveis e métricas de criticidade.

### Campos Principais

- Nome do processo
- Descrição
- Normativas aplicáveis
- Responsável
- Criticidade
- Complexidade
- Status

### Funcionalidades

- ✅ CRUD completo
- ✅ Vinculação com normativas
- ✅ Definição de responsáveis
- ✅ Métricas de criticidade/complexidade

---

## 11. Gestão de SLAs

### Descrição
Definição e controle de acordos de nível de serviço com métricas, penalidades e bonificações.

### Campos Principais

- Nome do SLA
- Descrição
- Métricas (disponibilidade, tempo de resposta)
- Indicadores
- Penalidades
- Bonificações
- Período de vigência

### Funcionalidades

- ✅ CRUD completo
- ✅ Definição de métricas
- ✅ Controle de indicadores
- ✅ Vinculação com aplicações

---

## 12. Gestão de Runbooks

### Descrição
Documentação de procedimentos operacionais e guias de troubleshooting.

### Campos Principais

- Título do runbook
- Descrição
- Procedimentos passo-a-passo
- Tecnologias relacionadas
- Versão
- Última atualização

### Funcionalidades

- ✅ CRUD completo
- ✅ Controle de versões
- ✅ Vinculação com tecnologias
- ✅ Guias de troubleshooting

---

## 13. Integração com Azure DevOps

### Descrição
Sincronização bidirecional de Work Items do Azure DevOps com o sistema.

### Funcionalidades

- ✅ Importação de Work Items
- ✅ Sincronização de status
- ✅ Atualização automática
- ✅ Mapping de campos personalizados
- ✅ Webhooks para eventos

---

## 14. Logs e Auditoria

### Descrição
Registro completo de todas as operações realizadas no sistema para rastreamento e compliance.

### Informações Capturadas

- Timestamp da operação
- Usuário responsável
- Tipo de operação (CREATE/UPDATE/DELETE)
- Entidade afetada
- Valores antes/depois (diff)
- IP de origem
- User Agent

### Funcionalidades

- ✅ Log de todas as operações
- ✅ Rastreamento de mudanças
- ✅ Análise de uso
- ✅ Dashboard de métricas
- ✅ Exportação de logs

---

## 15. Gestão de Tokens de Acesso

### Descrição
Controle de tokens para integrações via API com gerenciamento de permissões e expiração.

### Campos Principais

- Nome do token
- Escopo de permissões
- Data de criação
- Data de expiração
- Último uso
- Status (Ativo/Revogado)

### Funcionalidades

- ✅ Geração de tokens
- ✅ Revogação imediata
- ✅ Controle de expiração
- ✅ Auditoria de uso
- ✅ Permissões granulares

---

## Casos Especiais e Edge Cases

### 1. Sigla Duplicada
- **Comportamento**: Validação impede criação
- **Mensagem**: "Sigla já existe no sistema"
- **Ação**: Escolher outra sigla

### 2. Exclusão de Tipo em Uso
- **Comportamento**: Sistema permite mas avisa
- **Mensagem**: "Este tipo está em uso em X afastamentos"
- **Ação**: Confirmação explícita necessária

### 3. Sem Tipos Cadastrados
- **Comportamento**: Estado vazio amigável
- **Mensagem**: "Nenhum tipo cadastrado. Cadastre tipos antes de adicionar afastamentos"
- **Ação**: Link direto para cadastro

### 4. Matrícula Duplicada
- **Comportamento**: Validação impede criação
- **Mensagem**: "Matrícula já cadastrada para outro colaborador"
- **Ação**: Verificar matrícula correta

### 5. Edição de Colaborador Demitido
- **Comportamento**: Wizard abre normalmente
- **Status**: Campos de demissão preenchidos
- **Restrição**: Bloqueio de edição de dados básicos

### 6. Afastamentos Sobrepostos
- **Comportamento**: Sistema permite cadastro
- **Alerta**: Visual sobre períodos coincidentes
- **Ação**: Revisar datas ou confirmar sobreposição

### 7. Campos Obrigatórios Vazios (Gerador)
- **Comportamento**: Validação impede geração
- **Mensagem**: Específica para cada campo
- **Ação**: Preencher campos obrigatórios

### 8. Repositórios com Siglas Duplicadas
- **Comportamento**: Validação impede cadastro
- **Mensagem**: "Repositório com esta combinação já existe"
- **Ação**: Alterar categoria ou tecnologia

---

## Qualidades da Experiência

### Profissional
- Interface corporativa limpa
- Hierarquia clara de informações
- Fluxos de trabalho bem definidos

### Precisa
- Validações rigorosas em tempo real
- Integridade de dados garantida
- Prevenção de inconsistências

### Eficiente
- Acesso rápido a informações críticas
- Tabelas organizadas
- Formulários otimizados

---

## Próximos Passos

- 📖 Explore a [API de integração](api-referencia.md)
- ⚙️ Configure [integrações](integracao-azure-devops.md)
- 👨‍💻 Consulte o [guia de desenvolvimento](desenvolvimento.md)
