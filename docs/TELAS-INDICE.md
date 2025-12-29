# Documentação das Telas - Sistema de Auditoria

Este documento consolida todas as telas do sistema de auditoria com links para suas documentações detalhadas.

## 📂 Estrutura de Documentação

Cada tela possui um documento individual com:
- Descrição e objetivo
- Público-alvo
- Funcionalidades detalhadas
- Modelo de dados
- Integrações (APIs)
- Layout e UX
- Fluxos de uso
- Permissões
- Métricas e logging

## 🗂️ Categorias de Telas

### 📊 Core / Visão Geral
- [Dashboard](./TELA-DASHBOARD.md) - Visão executiva do sistema
- [Logs and Traces](./TELA-LOGS-TRACES.md) - Observabilidade e monitoramento

### 🏢 Cadastros Básicos
- [Aplicações](./TELA-APLICACOES.md) - Gestão do portfólio de aplicações
- [Colaboradores](./TELA-COLABORADORES.md) - Gestão de pessoas e equipes
- [Servidores](./TELA-SERVIDORES.md) - Inventário de infraestrutura
- [Tecnologias](./TELA-TECNOLOGIAS.md) - Catálogo de tecnologias
- [Habilidades](./TELA-HABILIDADES.md) - Competências técnicas

### 🏗️ Arquitetura e Negócio
- [Capacidades de Negócio](./TELA-CAPACIDADES.md) - Mapeamento de capacidades
- [Processos de Negócio](./TELA-PROCESSOS.md) - Gestão de processos
- [ADRs](./TELA-ADRS.md) - Architecture Decision Records
- [Comunicações](./TELA-COMUNICACOES.md) - Integração entre sistemas

### ⚙️ DevOps e Automação
- [Gerador de Projetos](./TELA-GERADOR-PROJETOS.md) - Criação automatizada Azure DevOps
- [Pipelines](./TELA-PIPELINES.md) - CI/CD e deployment
- [Stages](./TELA-STAGES.md) - Configuração de estágios
- [Azure DevOps](./TELA-AZURE-DEVOPS.md) - Integração e templates
- [Azure Work Items](./TELA-AZURE-WORK-ITEMS.md) - Sincronização de work items

### 📊 Métricas e Qualidade
- [DORA Dashboard](./TELA-DORA.md) - Métricas DevOps (DORA)
- [SLAs](./TELA-SLAS.md) - Gestão de acordos de nível de serviço
- [ReportBook](./TELA-REPORTBOOK.md) - Sistema de relatórios

### 🔧 Configurações e Integrações
- [Configuração de Integrações](./TELA-CONFIGURACAO-INTEGRACOES.md) - Setup Azure, Git, etc.
- [Tokens de Acesso](./TELA-TOKENS.md) - Gestão de tokens API
- [Tipos de Comunicação](./TELA-TIPOS-COMUNICACAO.md) - Tipos de integração
- [Tipos de Afastamento](./TELA-TIPOS-AFASTAMENTO.md) - Gestão de ausências

### 📚 Documentação
- [Documentação de APIs](./TELA-DOCUMENTACAO-APIS.md) - Catálogo de APIs
- [Gerador de Catálogo](./TELA-API-CATALOG-GENERATOR.md) - Automação de docs
- [Runbooks](./TELA-RUNBOOKS.md) - Procedimentos operacionais

### 📥 Carga e Importação
- [Carga de Dados](./TELA-CARGA-DADOS.md) - Importação em massa
- [Carga de Lockfiles](./TELA-CARGA-LOCKFILES.md) - Análise de dependências
- [Payloads](./TELA-PAYLOADS.md) - Gestão de cargas de dados

### 🔔 Notificações e Comunicação
- [Notificações](./TELA-NOTIFICACOES.md) - Centro de notificações
- [Integrações](./TELA-INTEGRACOES.md) - Gestão de integrações externas

## 📋 Lista Completa de Telas

### Core (2)
1. **DashboardView** - Visão geral e métricas executivas
2. **LogsAndTracesView** - Logs de auditoria e traces de execução

### Cadastros (7)
3. **AplicacoesView** - Gestão de aplicações (Wizard 7 steps)
4. **ColaboradoresView** - Gestão de colaboradores e times
5. **ServidoresView** - Inventário de servidores
6. **TecnologiasView** - Catálogo de tecnologias
7. **HabilidadesView** - Competências técnicas
8. **TiposAfastamentoView** - Tipos de ausência
9. **TiposComunicacaoView** - Tipos de integração

### Arquitetura (4)
10. **CapacidadesView** - Capacidades de negócio
11. **ProcessosView** - Processos de negócio
12. **ADRView** - Visualização de ADR
13. **ADRsView** - Lista de ADRs
14. **ComunicacaoView** - Comunicações entre sistemas

### DevOps (5)
15. **GeradorProjetosView** - Geração de projetos Azure DevOps
16. **PipelinesView** - Gestão de pipelines CI/CD
17. **StagesView** - Configuração de stages
18. **AzureDevOpsView** - Templates e configurações Azure
19. **AzureWorkItemsView** - Sincronização de work items

### Métricas (3)
20. **DoraDashboardView** - Métricas DORA
21. **SLAsView** - Gestão de SLAs
22. **ReportBookView** - Relatórios personalizados

### Configurações (2)
23. **ConfiguracaoIntegracoesView** - Setup de integrações
24. **TokensView** - Tokens de API

### Documentação (3)
25. **DocumentacaoAPIsView** - Catálogo de APIs
26. **ApiCatalogGeneratorView** - Gerador automático de docs
27. **RunbooksView** - Procedimentos operacionais

### Carga de Dados (2)
28. **CargaDadosView** - Importação em massa
29. **CargaLockfilesView** - Análise de dependências
30. **PayloadsView** - Gestão de payloads

### Comunicação (2)
31. **NotificacoesView** - Centro de notificações
32. **IntegracaoView** - Gestão de integrações

## 🔗 Navegação Entre Telas

```
Dashboard (/)
├── Aplicações (/aplicacoes)
│   ├── ADRs (/adrs)
│   └── Comunicações (/comunicacoes)
├── Colaboradores (/colaboradores)
│   └── Habilidades (/habilidades)
├── DevOps
│   ├── Gerador de Projetos (/gerador-projetos)
│   ├── Pipelines (/pipelines)
│   ├── Stages (/stages)
│   └── Azure DevOps (/azure-devops)
├── Métricas
│   ├── DORA Dashboard (/dora)
│   ├── SLAs (/slas)
│   └── ReportBook (/reportbook)
├── Configurações
│   ├── Integrações (/configuracoes)
│   └── Tokens (/tokens)
└── Documentação
    ├── APIs (/documentacao-apis)
    └── Runbooks (/runbooks)
```

## 🎯 Telas Mais Utilizadas

1. **Dashboard** - Ponto de entrada
2. **Aplicações** - Gestão central
3. **Gerador de Projetos** - Automação DevOps
4. **Logs and Traces** - Troubleshooting
5. **DORA Dashboard** - Métricas de performance

## 📱 Responsividade

Todas as telas são responsivas e suportam:
- **Desktop:** > 1024px - Layout completo
- **Tablet:** 768px - 1024px - Layout adaptado
- **Mobile:** < 768px - Layout empilhado

## 🔐 Controle de Acesso

- **Público:** Visualização básica
- **Usuário:** CRUD limitado
- **Tech Lead:** CRUD completo em sua área
- **Administrador:** Acesso total

## 📈 Métricas Globais

Todos os componentes registram:
- `page_load` - Carregamento da tela
- `action_performed` - Ações do usuário
- `api_call` - Chamadas de API
- `error_occurred` - Erros encontrados

## 🔄 Última Atualização

**Data:** 29/12/2024  
**Versão:** 1.0  
**Documentadas:** 32 telas
