# Índice Geral da Documentação

## 📚 Guia de Navegação da Documentação

Este documento serve como índice central para toda a documentação do Sistema de Auditoria.

---

## 🚀 Por Onde Começar?

### Sou Novo no Projeto
1. 📖 [README.md](../README.md) - Visão geral do projeto
2. 🏃 [Quick Start](QUICKSTART.md) - Início rápido
3. 🔧 [Manual de Instalação](MANUAL_INSTALACAO.md) - Instalação passo a passo

### Quero Usar as APIs
1. 📡 [Documentação de APIs](DOCUMENTACAO_API.md) - Referência completa (porta 3000)
2. 📋 [Estruturas de Dados](#estruturas-de-dados) - Formatos JSON
3. 🔍 [Exemplos Práticos](#exemplos-práticos) - Códigos prontos

### Quero Integrar com Azure DevOps
1. 🔷 [APIs Microsoft Azure DevOps](APIS_MICROSOFT_AZURE_DEVOPS.md) - Overview
2. ⚙️ [Configurações de Board](CONFIGURACOES_BOARD_AZURE.md) - Board setup detalhado
3. 📊 [Fluxo de Criação](FLUXO_CRIACAO_PROJETO.md) - Processo simplificado
4. 🐛 [Debug Azure DevOps](DEBUG_AZURE_DEVOPS.md) - Troubleshooting

### Quero Carregar Dados
1. 📥 [Scripts de Carga](../scripts/README.md) - Guia completo
2. 🎯 [Ordem de Carga](#ordem-de-carga) - Sequência recomendada
3. 🔧 [Troubleshooting Scripts](#troubleshooting) - Problemas comuns

---

## 📂 Organização da Documentação

### `/docs` - Documentação Principal

```
docs/
├── INDICE_GERAL.md                    ← Você está aqui
├── README.md                          → Overview geral
├── ATUALIZACOES_DOCUMENTACAO.md       → Changelog (25/11/2025)
│
├── 📖 Guias de Início
│   ├── QUICKSTART.md                  → Início rápido
│   ├── MANUAL_INSTALACAO.md           → Instalação completa
│   └── CONFIGURACAO_BD.md             → Setup MySQL
│
├── 📡 APIs e Integrações
│   ├── DOCUMENTACAO_API.md            → Referência completa das APIs REST
│   ├── APIS_MICROSOFT_AZURE_DEVOPS.md → Integração Azure DevOps
│   ├── CONFIGURACOES_BOARD_AZURE.md   → Board setup detalhado (NOVO)
│   ├── FLUXO_CRIACAO_PROJETO.md       → Processo de criação
│   ├── MUDANCAS_CRIACAO_PROJETO.md    → Histórico de mudanças
│   └── DEBUG_AZURE_DEVOPS.md          → Troubleshooting
│
├── 📋 Estruturas de Dados
│   ├── ESTRUTURA_TIPOS_AFASTAMENTO.md → Tipos de afastamento
│   ├── ESTRUTURA_CAPACIDADES_NEGOCIO.md → Capacidades de negócio
│   └── EXEMPLO_POST_TIPO_AFASTAMENTO.md → Exemplos práticos
│
├── 🔧 Operações e Troubleshooting
│   ├── TROUBLESHOOTING_RUNBOOK.md     → Runbooks
│   └── PRD.md                         → Product Requirements
│
└── 📚 MkDocs (Site de Documentação)
    ├── index.md
    ├── LEIAME.md
    ├── LICENSE.md
    ├── SECURITY.md
    ├── versions.json
    ├── javascripts/
    └── styles/
```

### `/scripts` - Scripts e Automação

```
scripts/
├── README.md                          → Guia completo de scripts
├── README-CARGA-HABILIDADES.md        → Carga específica
├── README_MIGRACAO_HABILIDADES.md     → Migração
│
├── 🗄️ Scripts SQL
│   ├── create-tables.sql              → Criação de tabelas
│   ├── create-contratos-tables.sql    → Tabelas de contratos
│   ├── load-data.sql                  → Carga inicial (legado)
│   └── update-*.sql                   → Atualizações
│
├── 📥 Scripts de Carga (Bash)
│   ├── load-tipos-afastamento.sh      → Tipos de afastamento
│   ├── load-habilidades.sh            → Habilidades
│   ├── load-capacidades-negocio.sh    → Capacidades
│   ├── load-colaboradores.sh          → Colaboradores
│   ├── load-tecnologias.sh            → Tecnologias
│   ├── load-processos.sh              → Processos
│   ├── load-slas.sh                   → SLAs
│   └── load-aplicacoes.sh             → Aplicações
│
├── 🔄 Manutenção
│   ├── backup-mysql.sh                → Backup
│   ├── restore-mysql.sh               → Restore
│   └── diagnose-server.sh             → Diagnóstico
│
└── 🧪 Testes
    ├── test-criar-tipo-afastamento.sh
    ├── test-habilidades.sh
    └── test-single-habilidade.sh
```

---

## 📖 Documentos por Categoria

### 1️⃣ Instalação e Setup

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [MANUAL_INSTALACAO.md](MANUAL_INSTALACAO.md) | Instalação completa do sistema | Desenvolvedores, DevOps |
| [CONFIGURACAO_BD.md](CONFIGURACAO_BD.md) | Setup MySQL com replicação | DBAs, DevOps |
| [QUICKSTART.md](QUICKSTART.md) | Início rápido em 5 minutos | Todos |

### 2️⃣ APIs e Endpoints

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md) | Referência completa das APIs REST (porta 3000) | Desenvolvedores |
| [APIS_MICROSOFT_AZURE_DEVOPS.md](APIS_MICROSOFT_AZURE_DEVOPS.md) | Integração com Azure DevOps | Desenvolvedores, Arquitetos |
| [CONFIGURACOES_BOARD_AZURE.md](CONFIGURACOES_BOARD_AZURE.md) | Setup detalhado de Board | Desenvolvedores, POs |

### 3️⃣ Azure DevOps

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [CONFIGURACOES_BOARD_AZURE.md](CONFIGURACOES_BOARD_AZURE.md) | 12 passos de configuração de Board | Desenvolvedores |
| [FLUXO_CRIACAO_PROJETO.md](FLUXO_CRIACAO_PROJETO.md) | Processo simplificado de criação | Todos |
| [MUDANCAS_CRIACAO_PROJETO.md](MUDANCAS_CRIACAO_PROJETO.md) | Histórico de mudanças | Desenvolvedores |
| [DEBUG_AZURE_DEVOPS.md](DEBUG_AZURE_DEVOPS.md) | Troubleshooting e debug | Desenvolvedores, DevOps |

### 4️⃣ Estruturas de Dados

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [ESTRUTURA_TIPOS_AFASTAMENTO.md](ESTRUTURA_TIPOS_AFASTAMENTO.md) | Formato JSON de tipos de afastamento | Desenvolvedores |
| [ESTRUTURA_CAPACIDADES_NEGOCIO.md](ESTRUTURA_CAPACIDADES_NEGOCIO.md) | Formato JSON de capacidades | Desenvolvedores, Analistas |
| [EXEMPLO_POST_TIPO_AFASTAMENTO.md](EXEMPLO_POST_TIPO_AFASTAMENTO.md) | Exemplos práticos de API | Desenvolvedores |

### 5️⃣ Scripts e Automação

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [scripts/README.md](../scripts/README.md) | Guia completo de scripts de carga | DevOps, Operações |
| [scripts/README-CARGA-HABILIDADES.md](../scripts/README-CARGA-HABILIDADES.md) | Carga específica de habilidades | DevOps |
| [scripts/README_MIGRACAO_HABILIDADES.md](../scripts/README_MIGRACAO_HABILIDADES.md) | Migração de estrutura | DevOps, DBAs |

### 6️⃣ Troubleshooting e Manutenção

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [DEBUG_AZURE_DEVOPS.md](DEBUG_AZURE_DEVOPS.md) | Debug de integração Azure | Desenvolvedores, DevOps |
| [TROUBLESHOOTING_RUNBOOK.md](TROUBLESHOOTING_RUNBOOK.md) | Solução de problemas com Runbooks | Operações |
| [scripts/README.md](../scripts/README.md) → Troubleshooting | Problemas com scripts | DevOps |

### 7️⃣ Planejamento e Requisitos

| Documento | Descrição | Público |
|-----------|-----------|---------|
| [PRD.md](PRD.md) | Product Requirements Document | POs, Stakeholders |
| [ATUALIZACOES_DOCUMENTACAO.md](ATUALIZACOES_DOCUMENTACAO.md) | Changelog da documentação | Todos |

---

## 🎯 Casos de Uso Comuns

### Criar um Projeto no Azure DevOps

1. Ler [CONFIGURACOES_BOARD_AZURE.md](CONFIGURACOES_BOARD_AZURE.md) - Entender o que será criado
2. Ver [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md) - Seção "Integração Azure DevOps"
3. Executar requisição POST com payload completo
4. Validar resultado conforme [Verificação Manual](CONFIGURACOES_BOARD_AZURE.md#verificação-manual)

### Carregar Dados no Sistema

1. Ler [scripts/README.md](../scripts/README.md) - Guia completo
2. Verificar [Ordem de Carga](#ordem-de-carga)
3. Executar scripts em sequência:
   ```bash
   ./load-tipos-afastamento.sh
   ./load-habilidades.sh
   ./load-capacidades-negocio.sh
   # ... etc
   ```
4. Verificar logs gerados

### Debugar Erro na API

1. Verificar porta correta: `http://localhost:3000/api` (não 5173)
2. Consultar [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md) - Endpoint específico
3. Verificar [Códigos de Status HTTP](DOCUMENTACAO_API.md#códigos-de-status-http)
4. Se Azure DevOps: [DEBUG_AZURE_DEVOPS.md](DEBUG_AZURE_DEVOPS.md)

### Entender Mudanças Recentes

1. Ler [ATUALIZACOES_DOCUMENTACAO.md](ATUALIZACOES_DOCUMENTACAO.md) - Changelog completo
2. Ver [MUDANCAS_CRIACAO_PROJETO.md](MUDANCAS_CRIACAO_PROJETO.md) - Mudanças Azure DevOps
3. Comparar "Antes vs Depois"

---

## 🔗 Links Rápidos

### APIs
- [GET /api/tipos-afastamento](DOCUMENTACAO_API.md#listar-todos-os-tipos-de-afastamento)
- [POST /api/tipos-afastamento](DOCUMENTACAO_API.md#criar-tipo-de-afastamento)
- [GET /api/habilidades](DOCUMENTACAO_API.md#listar-todas-as-habilidades)
- [POST /api/azure-devops/setup-project](DOCUMENTACAO_API.md#integração-azure-devops)

### Configurações
- [Backlogs](CONFIGURACOES_BOARD_AZURE.md#8-configurar-backlogs)
- [Cards](CONFIGURACOES_BOARD_AZURE.md#9-configurar-cards)
- [Styles](CONFIGURACOES_BOARD_AZURE.md#10-configurar-styles)
- [Colunas](CONFIGURACOES_BOARD_AZURE.md#11-configurar-colunas)
- [Swimlanes](CONFIGURACOES_BOARD_AZURE.md#12-configurar-swimlanes)

### Scripts
- [load-tipos-afastamento.sh](../scripts/load-tipos-afastamento.sh)
- [load-habilidades.sh](../scripts/load-habilidades.sh)
- [load-capacidades-negocio.sh](../scripts/load-capacidades-negocio.sh)

---

## 📊 Ordem de Carga

Para popular o banco de dados do zero:

```bash
# 1. Dados base (sem dependências)
./scripts/load-tipos-afastamento.sh
./scripts/load-habilidades.sh
./scripts/load-capacidades-negocio.sh
./scripts/load-tecnologias.sh
./scripts/load-processos.sh
./scripts/load-slas.sh

# 2. Dados dependentes
./scripts/load-colaboradores.sh          # Depende: tipos-afastamento, habilidades
./scripts/load-aplicacoes.sh             # Depende: tecnologias, capacidades, processos, slas
```

Detalhes em: [scripts/README.md](../scripts/README.md#ordem-recomendada-de-carga)

---

## ❓ FAQ - Perguntas Frequentes

### Qual a porta da API?
**Resposta:** `http://localhost:3000/api` (backend na porta 3000, frontend na 5173)

### Como criar um projeto no Azure DevOps?
**Resposta:** Ver seção [Integração Azure DevOps](DOCUMENTACAO_API.md#integração-azure-devops)

### Quais são os 12 passos de setup?
**Resposta:** Ver [CONFIGURACOES_BOARD_AZURE.md](CONFIGURACOES_BOARD_AZURE.md#fluxo-de-configuração)

### Como carregar dados via script?
**Resposta:** Ver [scripts/README.md](../scripts/README.md#como-usar-os-scripts-de-carga)

### Qual a diferença entre templates (Scrum, Agile, CMMI)?
**Resposta:** Ver [MUDANCAS_CRIACAO_PROJETO.md](MUDANCAS_CRIACAO_PROJETO.md#diferenças-entre-templates)

---

## 🔄 Última Atualização

**Data:** 25 de novembro de 2025

**Mudanças:**
- ✅ Criado índice geral de documentação
- ✅ Atualizada estrutura de navegação
- ✅ Adicionados links diretos para seções
- ✅ Organização por casos de uso

**Próxima revisão:** Conforme necessidade

---

## 📞 Suporte

- **Issues:** Criar issue no GitHub
- **Documentação:** Consultar este índice
- **Código:** Ver arquivos em `/src` e `/server`

---

**Navegação:**
- [⬆️ Voltar ao topo](#índice-geral-da-documentação)
- [📖 README Principal](../README.md)
- [🔷 Azure DevOps](APIS_MICROSOFT_AZURE_DEVOPS.md)
- [📡 APIs](DOCUMENTACAO_API.md)
