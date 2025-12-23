# Changelog - Sistema de Auditoria

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.7.0] - 2024-12-XX

### ✨ Adicionado
- **Módulo de Comunicações**
  - Nova tela "Comunicação" no menu Gerenciamento (após Tecnologias)
  - Gerenciamento completo de padrões de comunicação e integração
  - Campos:
    - Sigla (identificador único)
    - Tecnologias (seleção múltipla com 16 opções)
    - Tipo (Síncrono, Assíncrono, Ambos)
    - Uso Típico (texto até 120 caracteres com contador visual)
  - 16 tecnologias de comunicação suportadas:
    - HTTP/JSON, HTTP, Protobuf, XML, WS
    - SNS/SQS, Pub/Sub, EventBridge, SAP Event Mesh
    - S3/Blob/GCS, SFTP cloud
    - Mulesoft, SIS, Boomi
    - HTTP POST, Kafka/Kinesis
  - 12 registros pré-carregados cobrindo principais padrões:
    - REST-API, SOAP-WS, GRPC, MSG-QUEUE
    - EVENT-BUS, FILE-TRANSFER, ESB
    - WEBHOOK, STREAM, RPC, BATCH-ETL, HYBRID-API
  - Interface com busca, filtros e badges coloridos por tipo
  - Chips visuais para tecnologias
  - Validações completas no frontend e backend

- **API REST Completa**
  - `GET /api/comunicacoes` - Listar todas comunicações
  - `GET /api/comunicacoes/:id` - Buscar comunicação por ID
  - `POST /api/comunicacoes` - Criar nova comunicação
  - `PUT /api/comunicacoes/:id` - Atualizar comunicação
  - `DELETE /api/comunicacoes/:id` - Excluir comunicação
  - Validações:
    - Campos obrigatórios (sigla, tecnologias, tipo, usoTipico)
    - Mínimo 1 tecnologia selecionada
    - usoTipico limitado a 120 caracteres
    - Sigla única (check de duplicidade)
  - Tecnologias armazenadas como JSON

- **Banco de Dados**
  - Nova tabela `comunicacoes`
  - Colunas: id, sigla, tecnologias (JSON), tipo (ENUM), uso_tipico (VARCHAR 120)
  - Índices em sigla e tipo para performance
  - Timestamps automáticos (created_at, updated_at)
  - Script SQL: `database/09-create-comunicacoes.sql`

- **Scripts e Ferramentas**
  - `scripts/carga-comunicacoes.sh` - Script bash para carga automática
  - `data-templates/comunicacoes-carga.json` - 12 registros de exemplo
  - Script verifica API, detecta duplicados, exibe resumo colorido
  - Suporte a variável de ambiente API_URL

- **Documentação**
  - `data-templates/README-COMUNICACOES.md` - Documentação completa do módulo
  - Guia de uso da interface
  - Referência completa da API
  - Exemplos de registros JSON
  - Casos de uso detalhados
  - Seção de troubleshooting
  - Guia de manutenção e extensão

- **Componentes React**
  - `src/components/comunicacao/ComunicacaoView.tsx` - Componente principal
  - `src/components/comunicacao/ComunicacaoForm.tsx` - Formulário com validações
  - `src/components/comunicacao/ComunicacaoDataTable.tsx` - Tabela com busca e ações
  - Integração completa com App.tsx (routing e menu)
  - Ícone ShareNetwork no menu
  - Reuso de hooks existentes (useApi)

### 📝 Alterado
- README.md atualizado com módulo de Comunicações na lista de features
- Adicionado endpoint `/api/comunicacoes` na documentação de APIs

## [1.6.1] - 2024-12-11

### ✨ Adicionado
- **Módulo de Tipos de Comunicação**
  - Nova tela "Tipos de Comunicação" no menu Gerenciamento
  - Gerenciamento de protocolos e tecnologias de comunicação entre sistemas
  - Estrutura simplificada com 4 campos:
    - Sigla (2-10 caracteres)
    - Tecnologias (seleção múltipla com 16 opções)
    - Tipo (Síncrono, Assíncrono, Ambos)
    - Uso Típico (descrição)
  - 16 tecnologias disponíveis:
    - HTTP/JSON, HTTP, Protobuf, XML, WS
    - SNS/SQS, Pub/Sub, EventBridge, SAP Event Mesh
    - S3/Blob/GCS, SFTP cloud
    - Mulesoft, SIS, Boomi
    - HTTP POST, Kafka/Kinesis
  - 11 tipos pré-carregados (REST, gRPC, SOAP, WebSockets, etc.)
  - Filtros por tipo e busca por texto
  - Ordenação por sigla e tipo
  - Paginação com 10/25/50/100 registros
  - Validações de formulário
  - Logs de auditoria completos

- **API REST Completa**
  - `GET /api/tipos-comunicacao` - Listar todos
  - `GET /api/tipos-comunicacao/:id` - Buscar por ID
  - `POST /api/tipos-comunicacao` - Criar novo
  - `PUT /api/tipos-comunicacao/:id` - Atualizar
  - `DELETE /api/tipos-comunicacao/:id` - Excluir
  - Validações de duplicidade de sigla
  - Logs de auditoria para todas operações

- **Banco de Dados**
  - Nova tabela `tipos_comunicacao`
  - Campos: id, sigla, tecnologias (JSON), tipo, uso_tipico
  - Índices em sigla e tipo
  - Script de criação: `database/08-create-tipos-comunicacao.sql`
  - 12 registros iniciais pré-carregados

- **Dashboard Atualizado**
  - Novo card "Tipos de Comunicação" com ícone ShareNetwork
  - Contador de tipos cadastrados
  - Cor laranja (orange-600) para o tema

- **Arquivos Criados**
  - `src/lib/types.ts` - Types TipoComunicacao, TipoComunicacaoEnum, TecnologiaComunicacao
  - `src/components/tipos-comunicacao/TiposComunicacaoView.tsx` - Tela principal
  - `src/components/tipos-comunicacao/TiposComunicacaoDataTable.tsx` - Tabela com filtros
  - `src/components/tipos-comunicacao/TipoComunicacaoForm.tsx` - Formulário com checkboxes
  - `server/api.js` - 5 novos endpoints (200+ linhas)
  - `database/08-create-tipos-comunicacao.sql` - Script de criação
  - `data-templates/tipos-comunicacao.json` - Dados iniciais
  - `data-templates/README-TIPOS-COMUNICACAO.md` - Documentação

### 🔧 Modificado
- `src/App.tsx`:
  - Adicionado import `TipoComunicacao` e `TiposComunicacaoView`
  - Novo tipo `tipos-comunicacao` no `ViewType`
  - Hook `useApi` para buscar tipos-comunicacao
  - Passagem de `tiposComunicacao` para DashboardView
  - Novo item no menu Gerenciamento com ícone GitBranch
- `src/components/DashboardView.tsx`:
  - Adicionado prop `tiposComunicacao`
  - Novo card no dashboard
  - Import de ícone `ShareNetwork`
- `README.md`:
  - Adicionada funcionalidade "Tipos de Comunicação"
  - Link para documentação específica
  - Exemplo de uso da API
  - Template tipos-comunicacao.json na lista

### 📚 Documentação
- Atualizado `README.md` com nova funcionalidade
- Criado `README-TIPOS-COMUNICACAO.md` com guia completo
- Exemplos de curl para API
- Listagem dos 11 tipos pré-carregados

## [1.5.1] - 2024-12-08

### ✨ Adicionado
- **Módulo de Carga de Dados**
  - Nova tela "Carga de Dados" no menu Ferramentas
  - Upload múltiplo de arquivos CSV e JSON
  - Detecção automática de tipo de entidade pelo nome do arquivo
  - Parser de CSV com suporte a cabeçalhos
  - Parser de JSON para arrays ou objetos únicos
  - Processamento individual ou em lote
  - Fila de importação com status visual
  - Logs em tempo real de cada operação
  - Tratamento de erros por registro
  - Suporte a 8 tipos de entidades:
    - Tipos de Afastamento
    - Colaboradores
    - Tecnologias
    - Processos de Negócio
    - Aplicações
    - Capacidades de Negócio
    - Habilidades
    - SLAs
  - Guia de uso integrado na interface

- **Arquivos de Exemplo**
  - `exemplo-tipos-afastamento.csv` - 7 tipos de afastamento
  - `exemplo-tecnologias.csv` - 8 tecnologias comuns
  - `exemplo-habilidades.csv` - 12 habilidades técnicas e comportamentais
  - `exemplo-aplicacoes.csv` - 6 aplicações exemplo
  - `exemplo-capacidades-negocio.json` - 5 capacidades em JSON
  - `README-CARGA.md` - Guia completo de uso

- **Arquivos Criados**
  - `src/components/carga/CargaDadosView.tsx` - Componente principal (600 linhas)
  - `data-templates/README-CARGA.md` - Documentação de carga
  - `data-templates/exemplo-*.{csv,json}` - 5 arquivos de exemplo

### 🔧 Modificado
- `src/App.tsx`:
  - Adicionado import do `CargaDadosView`
  - Novo tipo `carga-dados` no `ViewType`
  - Novo item no menu "Ferramentas" com ícone Database
  - Case no `renderMainContent` para exibir componente

### 🔐 Auditoria
- Todas operações de carga logadas via `useLogging`
- Eventos: arquivos_carregados, arquivo_processado, lote_concluido
- Metadados: tipo de entidade, quantidade de registros, erros

### 📋 Detecção Automática
Sistema detecta tipo de entidade por palavras-chave no nome do arquivo:
- `tipo-afastamento` → Tipos de Afastamento
- `tecnologia` → Tecnologias  
- `habilidade` → Habilidades
- `aplicacao` → Aplicações
- `capacidade` → Capacidades de Negócio
- E mais...

### 🚀 Fluxo de Carga
1. Upload de arquivo(s) CSV ou JSON
2. Detecção automática do tipo
3. Parsing do conteúdo
4. Importação via API REST (POST)
5. Logs detalhados de sucesso/erro
6. Resumo final com estatísticas

## [1.5.0] - 2024-12-08

### ✨ Adicionado
- **Identificador Automático de Tecnologias**
  - Nova ferramenta para identificação automática de tecnologias/bibliotecas
  - Suporte a 10+ formatos de arquivos de dependências:
    - Maven (`pom.xml`)
    - Gradle (`build.gradle`, `build.gradle.kts`)
    - Go (`go.mod`)
    - Python (`requirements.txt`, `pyproject.toml`)
    - Node.js (`package.json`)
    - .NET (`*.csproj`)
    - PHP (`composer.json`)
    - Ruby (`Gemfile`, `*.gemspec`)
    - Rust (`Cargo.toml`)
  - Parser automático de dependências com extração de nome, versão e escopo
  - Verificação automática de tecnologias existentes via API
  - Cadastro automático de tecnologias inexistentes
  - Cadastro de aplicações com relacionamento automático
  - Interface visual com logs em tempo real
  - Tabela de status de tecnologias (Cadastrada, Existe, Nova, Erro)
  - Resumo final com estatísticas completas
  - Sistema de auditoria completo (todas operações logadas)
  - Documentação completa em `IDENTIFICADOR_TECNOLOGIAS.md`

- **Arquivos Criados**
  - `src/lib/dependency-parser.ts` - Serviço de parsing de arquivos
  - `src/components/aplicacoes/IdentificadorTecnologias.tsx` - Componente principal
  - `docs/IDENTIFICADOR_TECNOLOGIAS.md` - Documentação técnica e funcional

### 🔧 Modificado
- `src/App.tsx`:
  - Adicionado import do `IdentificadorTecnologias`
  - Novo tipo `identificador-tecnologias` no `ViewType`
  - Novo item no menu "Ferramentas" com ícone Download
  - Case no `renderMainContent` para exibir componente

### 📋 Requisitos Implementados
- **RF01**: Ler e interpretar arquivos de dependências
- **RF02**: Identificar stack automaticamente
- **RF03**: Integrar com API de Tecnologias
- **RF04**: Criar tecnologias inexistentes
- **RF05**: Criar aplicação
- **RF06**: Relacionar aplicação e tecnologias
- **RF07**: Exibir logs de processamento em tempo real
- **RF08**: Exibir resumo final com estatísticas

### 🔐 Auditoria e Compliance
- **RN04**: Todas operações auditadas via `useLogging`
- Eventos registrados: upload, análise, cadastro, relacionamento, erros
- Metadados completos: aplicação, arquivo, tecnologia, versão, plataforma
- Categorias: `identificacao_tecnologias`
- Actions: `analise_concluida`, `tecnologia_cadastrada`, `aplicacao_cadastrada`, `processo_concluido`

### 🚀 Fluxo Implementado
1. Upload de arquivo de dependências
2. Detecção automática de tecnologia
3. Parsing e extração de dependências
4. Verificação de existência via API (`GET /api/tecnologias?nome={nome}`)
5. Cadastro de novas tecnologias (`POST /api/tecnologias`)
6. Cadastro de aplicação (`POST /api/aplicacoes`)
7. Relacionamento automático (`POST /api/aplicacoes/{id}/tecnologias`)
8. Log de auditoria completo

## [1.4.0] - 2025-12-06

### ✨ Adicionado
- **Container MkDocs para Documentação**
  - Novo serviço Docker `mkdocs` na porta 8082
  - `Dockerfile.mkdocs` com Python 3.11 e MkDocs Material 9.5.3
  - Volumes read-only para segurança
  - Script helper `mkdocs-helper.sh` para gerenciamento
  - Documentação completa em `MKDOCS_CONTAINER.md`

- **Integração MkDocs na Interface**
  - Botão "Documentação Completa (MkDocs)" na tela de APIs
  - Ícone `BookOpen` do Phosphor Icons
  - Link direto para http://localhost:8082
  - Abre em nova aba

- **Atualização da Navegação MkDocs**
  - Nova seção "Produção" com PRODUCTION_CLEANUP.md e PRODUCTION_DEPLOY.md
  - Nova seção "Database" com guias Liquibase
  - Inclusão de CHANGELOG.md na navegação
  - Todos os novos documentos integrados

### 🔧 Modificado
- `docker-compose.yml`: Adicionado serviço `mkdocs` com restart automático
- `mkdocs.yml`: Reorganizado navegação com novas seções
- `README.md`: Adicionada referência ao MkDocs (porta 8082)
- `QUICKSTART.md`: Nova seção de comandos MkDocs
- `DocumentacaoAPIsView.tsx`: Import do ícone BookOpen e botão MkDocs

### 📦 Dependências Python (MkDocs)
- `mkdocs==1.5.3` - Core do MkDocs
- `mkdocs-material==9.5.3` - Tema Material Design
- `pymdown-extensions==10.7` - Extensões Markdown
- `mkdocs-minify-plugin==0.7.2` - Minificação
- `mkdocs-git-revision-date-localized-plugin==1.2.2` - Data de revisão

### 🌐 Portas
- **8082**: MkDocs - Documentação técnica (NOVO)
- 5173: Frontend React
- 3000: Backend API
- 3306: MySQL Master
- 3307: MySQL Slave

## [1.3.0] - 2025-12-06

### ✨ Adicionado
- **Database Migrations com Liquibase + Maven**
  - Arquivo `pom.xml` com configuração Maven e Liquibase 4.25.1
  - Changelogs XML em `src/main/resources/db/changelog/`
  - Script helper `liquibase-manager.sh` para facilitar uso
  - 3 profiles Maven: dev, ci, prod
  - Workflow GitHub Actions para CI/CD de migrations
  - Documentação completa em `LIQUIBASE_QUICKSTART.md` e `docs/LIQUIBASE_DATABASE_MIGRATION.md`

- **Gráficos de Pizza na Integração de WITs**
  - 2 gráficos de pizza usando Recharts
  - Distribuição por Tipo de WIT (Bug, PBI, Task, Spike, Feature)
  - Distribuição por Idade (Hoje, Semana, 1 Mês, Mais de 1 Mês)
  - Cores hexadecimais customizadas para cada categoria
  - Tooltips e legendas interativas

- **Correção do Sistema de Logging Frontend**
  - Migração de `window.spark.kv` para `localStorage`
  - Hook `useLocalStorage` com polling automático (1 segundo)
  - Sincronização entre abas via `storage` event
  - Logs frontend agora aparecem corretamente na interface

- **Script de Importação de Tecnologias Maven**
  - `scripts/import-tecnologias-pom.sh` para importar dependências de pom.xml
  - Parsing automático de XML com xmllint
  - Categorização automática (Framework, ORM, Database, Testing, Build)
  - Cadastro via POST na API `/api/tecnologias`

### 🔧 Modificado
- Atualizado `README.md` com novas features e seções reorganizadas
- Atualizado `QUICKSTART.md` com comandos Liquibase e troubleshooting expandido
- `.gitignore` atualizado com exclusões Maven e Liquibase
- `logging-service.ts` migrado para localStorage
- `LogsAndTracesView.tsx` corrigido para usar dados do backend (auditStats)

### 📚 Documentação
- Criado `LIQUIBASE_QUICKSTART.md` - Guia rápido de migrations
- Criado `docs/LIQUIBASE_DATABASE_MIGRATION.md` - Documentação completa (60+ seções)
- Criado `CHANGELOG.md` - Este arquivo
- Atualizado links e referências em toda documentação

### 🐛 Corrigido
- Logs frontend não apareciam na interface (incompatibilidade spark.kv vs localStorage)
- Visão Geral de Logs mostrava dados incorretos (traceStats vs auditStats)
- Faltava botão "Buscar Logs" na aba Auditoria
- Checksums de Liquibase com sintaxe SQL incorreta

---

## [1.2.0] - 2025-11-25

### ✨ Adicionado
- **Sistema Completo de Logs e Auditoria**
  - Tabela `logs_auditoria` com 20 campos
  - 8 índices para performance otimizada
  - 4 views para análise: `v_logs_erro`, `v_logs_por_usuario`, `v_logs_performance`, `v_logs_atividade_recente`
  - Stored procedure `sp_limpar_logs_antigos()` para retenção configurável
  - Endpoints `/api/logs-auditoria` e `/api/logs-auditoria/stats`

- **Interface de Visualização de Logs**
  - Componente `LogsAndTracesView.tsx` com 3 abas:
    - Visão Geral: Estatísticas consolidadas
    - Auditoria: Logs de operações backend
    - Logs Frontend: Eventos do navegador
  - Filtros avançados por data, usuário, severidade, tipo
  - Sistema de rastreamento distribuído (trace_id, span_id)

- **Logging Implementado em APIs**
  - Tipos de Afastamento: POST, PUT, DELETE (3 endpoints)
  - Colaboradores: POST, PUT, DELETE (3 endpoints)
  - Função `logAuditoria()` centralizada
  - Captura de oldValues, newValues, requestInfo
  - Total: 6/63 endpoints (9.5% de cobertura)

- **Documentação de Status de Logging**
  - Arquivo `docs/STATUS_LOGGING.md` com mapeamento completo
  - 63 endpoints catalogados
  - Plano de implementação em 4 fases
  - Templates de código e queries úteis

### 🔧 Modificado
- `server/api.js` expandido com funções de logging
- Estrutura de banco atualizada com tabela de logs

### 📚 Documentação
- Criado `docs/STATUS_LOGGING.md`
- Atualizado `docs/ATUALIZACOES_DOCUMENTACAO.md`

---

## [1.1.0] - 2025-11-23

### ✨ Adicionado
- **Integração Completa com Azure DevOps**
  - APIs REST oficiais da Microsoft (v7.1)
  - Criação automática de projetos, times, sprints, áreas, boards
  - Time de SUSTENTACAO com iterações mensais
  - Componente `GerarProjetoView.tsx` na interface

- **Scripts de Carga de Dados**
  - `scripts/load-data.sh` para CSV/JSON
  - Scripts específicos para cada entidade
  - Suporte a carga em lote e individual

- **Banco de Dados Replicado**
  - MySQL 8.0 com replicação Master-Slave
  - Scripts de inicialização e setup
  - Docker Compose com 3 containers

### 📚 Documentação
- Criado `docs/APIS_MICROSOFT_AZURE_DEVOPS.md`
- Criado `docs/CONFIGURACOES_BOARD_AZURE.md`
- Criado `docs/FLUXO_CRIACAO_PROJETO.md`
- Criado `docs/DEBUG_AZURE_DEVOPS.md`

---

## [1.0.0] - 2025-11-15

### ✨ Inicial
- **Frontend React 19 + TypeScript**
  - Componentes shadcn/ui
  - Tailwind CSS
  - Vite como build tool

- **Backend Express.js**
  - APIs REST completas para:
    - Tipos de Afastamento
    - Colaboradores
    - Tecnologias
    - Aplicações
    - Capacidades de Negócio
    - Habilidades
    - Processos de Negócio
    - SLAs
    - Runbooks

- **Banco de Dados MySQL**
  - Schema completo com 15+ tabelas
  - Relacionamentos e constraints
  - Índices otimizados

- **Containerização Docker**
  - Dockerfile multi-stage
  - docker-compose.yml
  - Volumes persistentes

### 📚 Documentação
- Criado `README.md`
- Criado `QUICKSTART.md`
- Criado `docs/MANUAL_INSTALACAO.md`
- Criado `docs/DOCUMENTACAO_API.md`

---

## Formato

### Tipos de Mudanças
- `✨ Adicionado` - Novas features
- `🔧 Modificado` - Mudanças em features existentes
- `🗑️ Depreciado` - Features que serão removidas
- `🐛 Corrigido` - Bug fixes
- `🔒 Segurança` - Vulnerabilidades corrigidas
- `📚 Documentação` - Mudanças apenas em documentação
- `⚡ Performance` - Melhorias de performance

---

**Nota:** As datas seguem o formato ISO 8601 (YYYY-MM-DD).
