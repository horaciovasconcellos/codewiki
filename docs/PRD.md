# Planning Guide

Sistema de auditoria corporativo para gestão de colaboradores, controle de afastamentos e geração automatizada de estruturas de projeto, permitindo cadastro de tipos de afastamento personalizados, rastreamento completo do ciclo de vida de funcionários e suas ausências planejadas e efetivas, além de padronização do setup inicial de projetos através de um gerador de estruturas CLI integrado.

**Experience Qualities**:
1. **Profissional** - Interface corporativa com hierarquia clara de informações e fluxos de trabalho bem definidos para operações de RH
2. **Precisa** - Validações rigorosas de siglas, datas e estados, garantindo integridade dos dados e prevenindo inconsistências no sistema
3. **Eficiente** - Acesso rápido a informações críticas com tabelas de dados organizadas e formulários otimizados para entrada de dados

**Complexity Level**: Light Application (multiple features with basic state)
  - Sistema com múltiplas funcionalidades incluindo CRUD de tipos de afastamento, CRUD de colaboradores, gestão de afastamentos com validações complexas, estados interdependentes e persistência de dados, mas sem necessidade de autenticação complexa ou backend externo

## Essential Features

### Cadastro de Tipos de Afastamento
- **Functionality**: Criar, visualizar, editar e excluir tipos de afastamento com sigla (3 caracteres alfanuméricos), descrição (50 caracteres), argumentação legal (60 caracteres), número de dias (1-99) e tipo de tempo (Consecutivo/Não Consecutivo)
- **Purpose**: Centralizar e padronizar os tipos de afastamento disponíveis no sistema para uso em toda a organização
- **Trigger**: Menu lateral "Tipos de Afastamento" → Botão "Novo Tipo de Afastamento"
- **Progression**: Clique no botão → Dialog com formulário → Preencher campos com validações específicas → Validação de sigla única e expressões regulares → Salvar → Atualização da tabela
- **Success criteria**: Tipo criado com sigla única em formato correto, todos os campos validados, dados persistidos e disponíveis para uso em afastamentos de colaboradores

### Validações de Tipos de Afastamento
- **Functionality**: Validar sigla com regex ^[A-Za-z0-9]{3}$, descrição até 50 caracteres, argumentação legal até 60 caracteres, número de dias com regex ^\d{1,2}$ e valor entre 1-99
- **Purpose**: Garantir qualidade e consistência dos dados de tipos de afastamento
- **Trigger**: Preenchimento de campos no formulário
- **Progression**: Usuário preenche campo → Validação em tempo real → Feedback visual imediato → Bloqueio de salvamento se inválido → Mensagem de erro específica
- **Success criteria**: Impossível salvar tipos com dados inválidos, mensagens de erro claras e específicas para cada campo

### Cadastro de Colaboradores
- **Functionality**: Criar, visualizar e editar registros de colaboradores com matrícula, nome, setor, data de admissão e data de demissão usando wizard com três etapas: Dados Básicos, Afastamentos e Habilidades
- **Purpose**: Manter base de dados centralizada de todos os funcionários com histórico completo incluindo habilidades técnicas e comportamentais
- **Trigger**: Botão "Novo Colaborador" na lista de colaboradores
- **Progression**: Clique no botão → Wizard multi-etapa → Passo 1: Dados Básicos (matrícula, nome, setor, datas) → Passo 2: Afastamentos (opcional) → Passo 3: Habilidades (opcional) → Salvar → Atualização da tabela
- **Success criteria**: Colaborador criado com matrícula única, dados persistidos, habilidades e afastamentos vinculados, aparece na lista principal com contadores

### Gestão de Habilidades de Colaboradores
- **Functionality**: Cadastrar habilidades do colaborador com seleção da habilidade (previamente cadastrada), nível declarado pelo recurso (Básico/Intermediário/Avançado/Expert), nível avaliado (Básico/Intermediário/Avançado/Expert), data de início e data de término (opcional)
- **Purpose**: Mapear competências técnicas e comportamentais da equipe para alocação em projetos e planejamento de treinamentos
- **Trigger**: Durante cadastro/edição de colaborador → Etapa "Habilidades" no wizard
- **Progression**: Selecionar habilidade disponível → Definir nível declarado → Definir nível avaliado → Informar data início → Informar data término (opcional) → Adicionar à lista → Repetir para múltiplas habilidades → Salvar
- **Success criteria**: Habilidades vinculadas ao colaborador com níveis diferenciados (declarado vs avaliado), períodos de vigência registrados, visível em tabela detalhada

### Controle de Status (Ativo/Demitido)
- **Functionality**: Bloquear edição e alocação de colaboradores demitidos
- **Purpose**: Garantir integridade dos dados e prevenir uso indevido de colaboradores inativos
- **Trigger**: Preenchimento da data de demissão
- **Progression**: Inserir data de demissão → Sistema bloqueia edição → Badge visual "Demitido" → Impedimento em alocações
- **Success criteria**: Colaboradores demitidos são somente leitura e claramente identificados visualmente

### Gestão de Afastamentos Prováveis
- **Functionality**: Registrar afastamentos planejados usando apenas tipos cadastrados no sistema para ano corrente e próximo ano, organizado em wizard separado da tela de detalhes
- **Purpose**: Planejar recursos e auditorias considerando ausências previstas da equipe com tipos padronizados
- **Trigger**: Durante cadastro/edição de colaborador → Etapa "Afastamentos" no wizard
- **Progression**: Wizard → Etapa de afastamentos → Selecionar tipo via combobox → Inserir datas inicial/final prováveis → Inserir datas inicial/final efetivas (opcional) → Validação de consecutividade → Adicionar à tabela → Repetir para múltiplos afastamentos → Próxima etapa
- **Success criteria**: Afastamentos salvos corretamente com tipos válidos cadastrados, datas válidas, organizados em seções separadas (Dados Básicos, Afastamentos, Habilidades) para melhor navegação

### Visualização Detalhada de Colaboradores
- **Functionality**: Tela de detalhes com abas separadas para Dados Básicos, Afastamentos e Habilidades, seguindo padrão visual similar à tela de Tecnologias
- **Purpose**: Facilitar navegação e compreensão das informações do colaborador de forma organizada e visual
- **Trigger**: Clicar no ícone de visualização na lista de colaboradores
- **Progression**: Clique no colaborador → Tela de detalhes fullscreen → Abas navegáveis (Dados Básicos/Afastamentos/Habilidades) → Visualização completa de cada seção → Botões de ação (Editar/Excluir) no header
- **Success criteria**: Informações bem organizadas em abas, fácil navegação entre seções, padrão visual consistente com outras telas do sistema

### Data Table de Afastamentos
- **Functionality**: Visualizar e editar afastamentos em formato tabular com colunas para tipo, períodos prováveis e efetivos
- **Purpose**: Facilitar visualização e comparação entre planejado vs executado
- **Trigger**: Visualização automática ao editar colaborador
- **Progression**: Abrir colaborador → Visualizar tabela → Ações inline (editar/excluir) → Modificações refletem imediatamente
- **Success criteria**: Tabela responsiva, ordenável, com ações claras e dados sempre atualizados

### Validação de Períodos Consecutivos
- **Functionality**: Garantir que data final seja posterior à data inicial em todos os períodos
- **Purpose**: Prevenir dados inconsistentes e garantir lógica temporal correta
- **Trigger**: Preenchimento de campos de data
- **Progression**: Usuário preenche data → Validação em tempo real → Feedback visual de erro → Bloqueio de salvamento se inválido
- **Success criteria**: Impossível salvar períodos com datas invertidas, mensagens de erro claras

### API REST para Períodos Efetivos
- **Functionality**: Endpoint simulado para sistemas externos registrarem períodos efetivos de afastamento
- **Purpose**: Permitir integração com sistemas de ponto/RH para registrar ausências reais
- **Trigger**: Chamada externa ao endpoint (simulado internamente para demonstração)
- **Progression**: POST com dados do afastamento → Validação → Persistência → Atualização automática na UI
- **Success criteria**: Períodos efetivos aparecem na tabela, não editáveis pelo usuário, diferenciados visualmente

### Gerador de Estruturas de Projeto (CLI)
- **Functionality**: Interface CLI interativa para criação padronizada de estruturas de projeto, com parâmetros obrigatórios (produto via Select das aplicações cadastradas usando sigla, projeto, data inicial, iteração) e opcionais (Share Queries, repositórios, Maven, Liquibase), incluindo tabela parametrizada para cadastro de repositórios seguindo o padrão <produto>-<categoria>-<tecnologia>, onde produto é a sigla da aplicação selecionada via Select (lista as aplicações cadastradas mostrando sigla e descrição), categoria é selecionada de lista predefinida (analiticos, api, app, batch, dashboard, etl, frontend, backend, integracao, portal, svc) e tecnologia é selecionada de lista predefinida (airflow, angular, databricks, go, java, kotlin, mulesoft, node, php, plsql, powerbi, python, react, spark, ords)
- **Purpose**: Padronizar setup inicial de projetos, facilitar onboarding de desenvolvedores, garantir consistência entre tecnologias e entregáveis através de nomenclatura uniforme, utilizando apenas aplicações previamente cadastradas no sistema
- **Trigger**: Menu "Gerador de Estruturas" na navegação principal
- **Progression**: Acessar menu → Selecionar Produto via Select (lista aplicações cadastradas) → Preencher demais campos do formulário → Cadastrar repositórios em tabela (Select de sigla da aplicação + Select categoria + Select tecnologia) → Sistema gera automaticamente coluna "Nome do Repositório" concatenando produto-categoria-tecnologia → Selecionar componentes via checkbox (Query, Maven, Liquibase) → Validar campos obrigatórios → Gerar estrutura → Executar script git-azcesuc → Exibir resultado com estruturas criadas mostrando nomes completos dos repositórios
- **Success criteria**: Estruturas de projeto criadas conforme especificação, campo Produto usando Select com aplicações cadastradas (exibindo sigla e descrição), campo Produto nos repositórios também usando Select, repositórios cadastrados corretamente com nomenclatura padrão <produto>-<categoria>-<tecnologia> exibida em coluna separada da tabela, componentes selecionados gerados, script final executado com sucesso, feedback visual claro sobre criação incluindo coluna com nome completo do repositório, scripts SQL disponíveis para criação de tabelas e carga de dados

## Edge Case Handling

- **Sigla duplicada**: Validação impede criação de tipos com siglas já existentes (case-insensitive), exibindo mensagem clara
- **Exclusão de tipo em uso**: Sistema permite exclusão mas pode criar inconsistências; aviso de confirmação antes de excluir
- **Sem tipos cadastrados**: Estado vazio amigável na etapa de afastamentos do wizard impedindo criação de afastamentos até que tipos sejam cadastrados
- **Sem habilidades cadastradas**: Estado vazio amigável na etapa de habilidades do wizard impedindo vinculação até que habilidades sejam cadastradas
- **Matrícula duplicada**: Validação impede criação de colaboradores com matrículas já existentes, exibindo mensagem clara
- **Edição de colaborador demitido**: Wizard abre normalmente mas campos de demissão permanecem preenchidos indicando status inativo
- **Habilidades duplicadas**: Sistema impede adicionar a mesma habilidade múltiplas vezes para o mesmo colaborador
- **Níveis de habilidade inconsistentes**: Sistema permite declaração diferente da avaliação para identificar gaps de competência
- **Afastamentos sobrepostos**: Sistema permite múltiplos afastamentos no wizard e tabela, alerta visual sobre períodos coincidentes na visualização
- **Datas de habilidade inválidas**: Data término não pode ser anterior à data início
- **Colaborador sem afastamentos ou habilidades**: Estados vazios amigáveis em cada aba da visualização detalhada
- **Exclusão de colaborador com afastamentos**: Confirmação explícita antes de remover dados relacionados
- **Campos obrigatórios do gerador vazios**: Validação impede geração até que produto, projeto, data e iteração estejam preenchidos com mensagens de erro específicas
- **Data de iteração inválida**: Sistema valida formato ISO (YYYY-MM-DD) antes de permitir geração
- **Iteração não numérica ou negativa**: Validação garante que iteração seja inteiro positivo
- **Repositórios com siglas duplicadas**: Sistema impede cadastro de repositórios com mesma sigla (case-insensitive)
- **Sigla de repositório fora do range**: Validação limita sigla entre 3-10 caracteres
- **Geração sem componentes selecionados**: Sistema permite geração apenas com repositórios ou apenas com componentes estruturais
- **Formulário parcialmente preenchido**: Botão "Limpar" permite reset completo do estado sem perda acidental

## Design Direction

O design deve transmitir confiabilidade corporativa e eficiência operacional, com interface limpa e organizada que prioriza legibilidade de dados tabulares e hierarquia clara entre colaboradores ativos e inativos; layout minimalista com densidade apropriada para aplicações de gestão de dados.

## Color Selection

**Triadic** - Cores equilibradas para diferenciar estados (ativo/inativo), tipos de períodos (provável/efetivo) e ações (criar/editar/excluir) mantendo harmonia visual e acessibilidade

- **Primary Color**: Azul corporativo profundo (oklch(0.45 0.15 250)) - transmite profissionalismo e confiança, usado em botões primários e cabeçalhos
- **Secondary Colors**: Cinza neutro (oklch(0.55 0.01 250)) para elementos secundários e backgrounds sutis, mantendo foco nos dados
- **Accent Color**: Verde vibrante (oklch(0.65 0.18 145)) para colaboradores ativos, ações positivas e confirmações de sucesso
- **Foreground/Background Pairings**:
  - Background (Branco oklch(0.99 0 0)): Texto primário (oklch(0.15 0 0)) - Ratio 16.5:1 ✓
  - Primary (Azul oklch(0.45 0.15 250)): Texto branco (oklch(0.99 0 0)) - Ratio 7.8:1 ✓
  - Card (Cinza claro oklch(0.98 0 0)): Texto primário (oklch(0.15 0 0)) - Ratio 15.2:1 ✓
  - Accent (Verde oklch(0.65 0.18 145)): Texto escuro (oklch(0.15 0 0)) - Ratio 8.1:1 ✓
  - Destructive (Vermelho oklch(0.55 0.22 25)): Texto branco (oklch(0.99 0 0)) - Ratio 5.2:1 ✓
  - Muted (Cinza médio oklch(0.94 0.01 250)): Texto muted (oklch(0.45 0.01 250)) - Ratio 6.5:1 ✓

## Font Selection

Tipografia corporativa com foco em legibilidade de dados tabulares e hierarquia clara entre títulos e conteúdo; utilização da fonte Inter para interface limpa e moderna com excelente desempenho em tamanhos pequenos.

- **Typographic Hierarchy**:
  - H1 (Título da Página): Inter Bold / 32px / tracking tight / leading snug
  - H2 (Seções): Inter Semibold / 24px / tracking tight / leading normal
  - H3 (Subtítulos): Inter Medium / 18px / tracking normal / leading relaxed
  - Body (Texto principal): Inter Regular / 14px / tracking normal / leading relaxed
  - Table Headers: Inter Medium / 13px / tracking wide / leading tight / uppercase
  - Table Data: Inter Regular / 14px / tracking normal / leading normal / tabular-nums
  - Labels: Inter Medium / 13px / tracking normal / leading normal
  - Captions: Inter Regular / 12px / tracking normal / leading normal / text-muted-foreground

## Animations

Animações sutis e funcionais que reforçam feedback de ações sem atrasar operações; transições suaves entre estados para orientar o usuário através de mudanças de dados e validações.

- **Purposeful Meaning**: Micro-animações em badges de status (ativo/demitido) para reforçar importância do estado; transições suaves em dialogs para manter contexto
- **Hierarchy of Movement**: Prioridade em feedback de validação (imediato), seguido de transições de tabela (suave), e animações de entrada de dialogs (discreta)

## Component Selection

- **Components**: 
  - Sidebar para navegação entre Colaboradores e Tipos de Afastamento com ícones e labels claros
  - SidebarTrigger para colapsar/expandir menu lateral
  - Dialog para formulários de criação/edição (max-w-5xl para colaboradores com afastamentos, max-w-2xl para tipos)
  - Table para listagem de colaboradores e tipos de afastamento
  - Card para containers de informações
  - Badge para status (ativo/demitido), siglas de tipos de afastamento e indicador de tipo de tempo (Consecutivo/Não Consecutivo)
  - Select (combobox) para tipo de afastamento (apenas tipos cadastrados)
  - RadioGroup para seleção de tipo de tempo (Consecutivo/Não Consecutivo)
  - Input com type="date" para campos de data
  - Input com maxLength e pattern para campos validados (sigla, descrição, etc.)
  - Button com variants (default, outline, destructive)
  - Alert para mensagens de validação e avisos
  - Separator para dividir seções visualmente dentro dos formulários
  - Checkbox para seleção de componentes do projeto (Query, Maven, Liquibase)
  - Grid layout responsivo para formulário do gerador em duas colunas (parâmetros + resultado)

- **Customizations**: 
  - Sidebar com navegação por ícones (Users, ListChecks) e estado ativo visual
  - Dialog de colaborador ampliado (max-w-5xl) para acomodar dados básicos e tabela de afastamentos na mesma tela
  - Formulário de colaborador dividido em seções com Separators (Dados Básicos / Afastamentos)
  - Tabela de tipos de afastamento com colunas específicas (sigla, descrição, argumentação legal, nº dias, tipo tempo)
  - Tabela customizada para afastamentos com colunas específicas (tipo, provável inicial, provável final, efetivo inicial, efetivo final)
  - Badge customizado com cores específicas para tipo de tempo e status
  - Input de sigla com uppercase automático e validação de 3 caracteres alfanuméricos
  - Input numérico com validação de range 1-99 para número de dias
  - Row de tabela com estado desabilitado visual para colaboradores demitidos

- **States**: 
  - Buttons: hover com elevação sutil, disabled com opacity reduzida, loading com spinner
  - Inputs: focus com ring azul, error com border vermelho e mensagem, disabled com background cinza
  - Table rows: hover com background cinza claro, selected com border azul, disabled com opacity e strikethrough
  - RadioGroup: selected com border e background primário, hover com background sutil

- **Icon Selection**: 
  - Users (menu colaboradores)
  - ListChecks (menu tipos de afastamento)
  - Plus (adicionar colaborador/afastamento/tipo)
  - PencilSimple (editar)
  - Trash (excluir)
  - UserCircle (colaborador)
  - Calendar (datas)
  - Warning (validações)
  - Check (confirmações e salvar)
  - X (fechar dialogs e cancelar)
  - Info (alertas informativos)
  - FolderPlus (gerador de estruturas de projeto)
  - Terminal (CLI e resultado da geração)

- **Spacing**: 
  - Container padding: p-6
  - Card padding: p-4
  - Form field spacing: space-y-4
  - Grid gaps: gap-4
  - Table cell padding: px-4 py-2
  - Button padding: px-4 py-2
  - Section gaps: gap-6
  - Inline elements: gap-2

- **Mobile**: 
  - Sidebar colapsável com trigger acessível
  - Navegação principal através do menu lateral otimizado para touch
  - Tabelas com scroll horizontal em telas pequenas
  - Dialog responsivo em mobile com max-height (95vh) e scroll vertical
  - Stack vertical de formulários com grid adaptativo
  - Seção de afastamentos empilhada abaixo dos dados básicos
  - Botões de ação em width full em telas pequenas
  - Cards empilhados verticalmente
  - Font-size aumentado para legibilidade touch
  - RadioGroup em layout vertical para melhor usabilidade

## Scripts SQL e Banco de Dados

O sistema inclui scripts SQL completos para criação de tabelas e carga de dados iniciais, localizados na pasta `/scripts`:

### create-tables.sql
Script de criação de todas as estruturas do banco de dados Oracle, incluindo:
- Tabelas principais (tipos_afastamento, colaboradores, afastamentos, tecnologias, aplicacoes, etc.)
- Constraints de chave primária e estrangeira
- Índices para otimização de performance
- Comentários em tabelas e colunas para documentação
- Campo calculado (VIRTUAL) `nome_repositorio` na tabela `repositorios_projetos` que concatena automaticamente: `produto || '-' || categoria || '-' || tecnologia`

### load-data.sql
Script de carga inicial de dados de exemplo, incluindo:
- 5 tipos de afastamento
- 10 habilidades (Java, Python, React, Angular, Oracle, PostgreSQL, Docker, Kubernetes, Scrum, Liderança)
- 3 capacidades de negócio
- 5 aplicações (SISAUD, PORTAL, FINANCE, RHUMANO, ANALITICA)
- 5 tecnologias
- 3 processos de negócio
- 3 SLAs
- 3 runbooks
- 1 colaborador de exemplo (matrícula 5664) com habilidades vinculadas
- 9 repositórios de exemplo com nomenclatura padrão
- 1 projeto gerado de exemplo
- 1 token de acesso de exemplo

### Campo Calculado - Nome do Repositório
A tabela `repositorios_projetos` possui um campo `nome_repositorio` do tipo VIRTUAL que é calculado automaticamente pela concatenação:
```sql
nome_repositorio = produto || '-' || categoria || '-' || tecnologia
```

Exemplos:
- Produto: `SISAUD`, Categoria: `backend`, Tecnologia: `java` → `SISAUD-backend-java`
- Produto: `PORTAL`, Categoria: `frontend`, Tecnologia: `angular` → `PORTAL-frontend-angular`
- Produto: `FINANCE`, Categoria: `api`, Tecnologia: `java` → `FINANCE-api-java`

Este campo é exibido automaticamente na tabela de repositórios do Gerador de Estruturas, eliminando a necessidade de digitação manual e garantindo consistência na nomenclatura.
