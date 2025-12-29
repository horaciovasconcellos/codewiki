# Documentação Resumida das Telas - Sistema de Auditoria

Este documento consolida a documentação resumida de todas as telas do sistema.

---

## 📊 DORA Dashboard

**Arquivo:** `DoraDashboardView.tsx` | **Rota:** `/dora`

### Descrição
Dashboard de métricas DevOps baseadas no framework DORA (DevOps Research and Assessment).

### Funcionalidades
- **Deployment Frequency:** Frequência de deployments
- **Lead Time for Changes:** Tempo desde commit até produção
- **Change Failure Rate:** Taxa de falha em mudanças
- **Time to Restore Service:** Tempo para restaurar serviço

### Visualizações
- Gráficos de tendência
- Comparativo com benchmarks da indústria
- Distribuição por aplicação/time
- Evolução histórica

### APIs
- GET `/api/dora/metrics`
- GET `/api/dora/deployments`
- GET `/api/dora/incidents`

---

## 👥 Colaboradores

**Arquivo:** `ColaboradoresView.tsx` | **Rota:** `/colaboradores`

### Descrição
Gestão completa de colaboradores, times, habilidades e afastamentos.

### Funcionalidades
- Cadastro de colaboradores (nome, email, cargo, time)
- Associação de habilidades técnicas
- Gestão de afastamentos (férias, licenças)
- Alocação em projetos
- Visualização de disponibilidade

### Dados
- Informações pessoais
- Habilidades e níveis
- Histórico de alocação
- Calendário de afastamentos

### APIs
- CRUD completo `/api/colaboradores`
- GET `/api/colaboradores/:id/habilidades`
- GET `/api/colaboradores/:id/afastamentos`

---

## 💾 Servidores

**Arquivo:** `ServidoresView.tsx` | **Rota:** `/servidores`

### Descrição
Inventário de servidores e infraestrutura.

### Funcionalidades
- Cadastro de servidores (nome, IP, tipo, ambiente)
- Associação com aplicações
- Monitoramento de status
- Gestão de configurações

### Dados
- Nome e identificação
- Endereço IP/Hostname
- Sistema operacional
- Ambiente (Dev/QA/Prod)
- Aplicações hospedadas
- Recursos (CPU, RAM, Disco)

---

## 🔧 Tecnologias

**Arquivo:** `TecnologiasView.tsx` | **Rota:** `/tecnologias`

### Descrição
Catálogo de tecnologias utilizadas na organização.

### Funcionalidades
- Cadastro de tecnologias (nome, versão, categoria)
- Associação com aplicações
- Tracking de dependências
- Análise de obsolescência

### Categorias
- Linguagens de programação
- Frameworks
- Bibliotecas
- Ferramentas
- Bancos de dados
- Plataformas

---

## 🎯 Habilidades

**Arquivo:** `HabilidadesView.tsx` | **Rota:** `/habilidades`

### Descrição
Catálogo de competências técnicas e gestão de knowledge base.

### Funcionalidades
- Cadastro de habilidades
- Níveis de proficiência (Básico/Intermediário/Avançado/Expert)
- Associação com colaboradores
- Matriz de competências por time
- Gap analysis

---

## 📊 Capacidades de Negócio

**Arquivo:** `CapacidadesView.tsx` | **Rota:** `/capacidades`

### Descrição
Mapeamento de capacidades de negócio da organização.

### Funcionalidades
- Cadastro de capacidades (nome, descrição, categoria)
- Associação com aplicações
- Mapa de capacidades
- Análise de cobertura
- Priorização

---

## 🔄 Processos de Negócio

**Arquivo:** `ProcessosView.tsx` | **Rota:** `/processos`

### Descrição
Gestão de processos de negócio e fluxos.

### Funcionalidades
- Cadastro de processos
- Mapeamento de fluxos
- Associação com aplicações
- Documentação de procedimentos

---

## 🏗️ Pipelines

**Arquivo:** `PipelinesView.tsx` | **Rota:** `/pipelines`

### Descrição
Gestão de pipelines CI/CD e automação de deployment.

### Funcionalidades
- Cadastro de pipelines
- Configuração de stages
- Visualização de execuções
- Logs de build/deployment
- Métricas de sucesso

---

## 📝 Stages

**Arquivo:** `StagesView.tsx` | **Rota:** `/stages`

### Descrição
Configuração de estágios de pipeline (build, test, deploy).

### Funcionalidades
- Cadastro de stages
- Ordem de execução
- Condições e gates
- Templates reutilizáveis

---

## ☁️ Azure DevOps

**Arquivo:** `AzureDevOpsView.tsx` | **Rota:** `/azure-devops`

### Descrição
Integração e gestão de templates do Azure DevOps.

### Funcionalidades
- Upload de templates (YAML, JSON)
- Gestão de build/release templates
- Configuração de políticas
- Sincronização com Azure

### Templates
- Build pipelines
- Release pipelines
- Work item templates
- Repository policies
- Branch policies

---

## 📋 Azure Work Items

**Arquivo:** `AzureWorkItemsView.tsx` | **Rota:** `/azure-work-items`

### Descrição
Sincronização e gestão de work items do Azure DevOps.

### Funcionalidades
- Visualização de work items
- Sincronização bidirecional
- Filtros por tipo/estado
- Criação direta no Azure

---

## ⚙️ Configuração de Integrações

**Arquivo:** `ConfiguracaoIntegracoesView.tsx` | **Rota:** `/configuracoes`

### Descrição
Central de configuração de integrações externas.

### Integrações Suportadas
- **Azure DevOps:** URL organização, PAT token
- **Git:** Repositórios, credenciais
- **Slack:** Webhooks, notificações
- **Elasticsearch:** Logs, indexação
- **Jira:** Issues, sincronização

---

## 🔑 Tokens de Acesso

**Arquivo:** `TokensView.tsx` | **Rota:** `/tokens`

### Descrição
Gestão de tokens de API e controle de acesso.

### Funcionalidades
- Geração de tokens
- Definição de escopos
- Origens permitidas (CORS)
- Expiração automática
- Rotação de tokens
- Auditoria de uso

---

## 📡 Tipos de Comunicação

**Arquivo:** `TiposComunicacaoView.tsx` | **Rota:** `/tipos-comunicacao`

### Descrição
Catálogo de tipos de comunicação entre sistemas.

### Tipos
- API REST
- GraphQL
- SOAP
- Mensageria (Kafka, RabbitMQ)
- gRPC
- WebSocket
- Batch/Arquivo

---

## 🏖️ Tipos de Afastamento

**Arquivo:** `TiposAfastamentoView.tsx` | **Rota:** `/tipos-afastamento`

### Descrição
Catálogo de tipos de ausência de colaboradores.

### Tipos
- Férias
- Licença médica
- Licença maternidade/paternidade
- Folga compensatória
- Treinamento
- Outros

---

## 📚 Documentação de APIs

**Arquivo:** `DocumentacaoAPIsView.tsx` | **Rota:** `/documentacao-apis`

### Descrição
Catálogo centralizado de APIs da organização.

### Funcionalidades
- Lista de APIs
- Documentação OpenAPI/Swagger
- Endpoints e métodos
- Autenticação e exemplos
- Testes interativos

---

## 🤖 Gerador de Catálogo de APIs

**Arquivo:** `ApiCatalogGeneratorView.tsx` | **Rota:** `/api-catalog-generator`

### Descrição
Automação de geração de documentação de APIs.

### Funcionalidades
- Scan de repositórios
- Extração de anotações (@ApiOperation, etc.)
- Geração de Markdown
- Publicação automática no MkDocs
- Versionamento

---

## 📖 Runbooks

**Arquivo:** `RunbooksView.tsx` | **Rota:** `/runbooks`

### Descrição
Procedimentos operacionais e troubleshooting.

### Funcionalidades
- Cadastro de runbooks
- Steps detalhados
- Screenshots e diagramas
- Busca por keyword
- Templates reutilizáveis

---

## 📥 Carga de Dados

**Arquivo:** `CargaDadosView.tsx` | **Rota:** `/carga-dados`

### Descrição
Importação em massa de dados via CSV/JSON.

### Suportado
- Aplicações
- Colaboradores
- Tecnologias
- Habilidades
- Servidores

### Funcionalidades
- Upload de arquivo
- Validação de formato
- Preview antes de importar
- Mapeamento de colunas
- Relatório de erros

---

## 🔒 Carga de Lockfiles

**Arquivo:** `CargaLockfilesView.tsx` | **Rota:** `/carga-lockfiles`

### Descrição
Análise de dependências a partir de lockfiles.

### Suportado
- package-lock.json (npm)
- yarn.lock
- pom.xml (Maven)
- build.gradle (Gradle)
- requirements.txt (Python)
- Gemfile.lock (Ruby)

### Funcionalidades
- Upload de lockfile
- Extração de dependências
- Análise de versões
- Detecção de vulnerabilidades
- Recomendações de atualização

---

## 📦 Payloads

**Arquivo:** `PayloadsView.tsx` | **Rota:** `/payloads`

### Descrição
Gestão de cargas de dados e templates de importação.

### Funcionalidades
- Criar templates de carga
- Agendar importações
- Histórico de cargas
- Validação de schemas
- Rollback de dados

---

## 🔔 Notificações

**Arquivo:** `NotificacoesView.tsx` | **Rota:** `/notificacoes`

### Descrição
Centro de notificações e alertas.

### Funcionalidades
- Lista de notificações
- Filtro por tipo/status
- Marcar como lida
- Configurar preferências
- Integração com email/Slack

---

## 🔗 Integrações

**Arquivo:** `IntegracaoView.tsx` | **Rota:** `/integracoes`

### Descrição
Gestão de integrações entre aplicações.

### Funcionalidades
- Mapeamento de integrações
- Endpoints e contratos
- Monitoramento de health
- Logs de chamadas
- Rate limiting

---

## 🔗 Comunicações

**Arquivo:** `ComunicacaoView.tsx` | **Rota:** `/comunicacoes`

### Descrição
Visualização de comunicações entre aplicações.

### Funcionalidades
- Grafo de comunicações
- Fluxo de dados
- Dependências
- Análise de impacto

---

## 📋 ADR (Visualização)

**Arquivo:** `ADRView.tsx` | **Rota:** `/adr/:id`

### Descrição
Visualização de Architecture Decision Record específico.

### Funcionalidades
- Visualização formatada
- Histórico de versões
- Comentários e discussões
- Export para PDF

---

## 📚 ADRs (Listagem)

**Arquivo:** `ADRsView.tsx` | **Rota:** `/adrs`

### Descrição
Lista de todos os ADRs da organização.

### Funcionalidades
- Listagem paginada
- Filtros por status/aplicação
- Busca por keyword
- Criação de novo ADR
- Templates

---

## 📊 SLAs

**Arquivo:** `SLAsView.tsx` | **Rota:** `/slas`

### Descrição
Gestão de SLAs (Service Level Agreements).

### Funcionalidades
- Cadastro de SLAs
- Métricas de cumprimento
- Alertas de violação
- Relatórios de performance
- Dashboards por aplicação

---

## 🔄 Última Atualização

**Data:** 29/12/2024  
**Total de Telas Documentadas:** 32  
**Status:** ✅ Completo
