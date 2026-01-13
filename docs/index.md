# 📚 Documentação CodeWiki

Bem-vindo à documentação completa do projeto CodeWiki - Sistema de Gerenciamento de Conhecimento Técnico e Documentação de Arquitetura.

!!! info "Navegação"
    Use o menu lateral para navegar pelas seções ou consulte o [**Índice Completo**](INDEX.md) para visão geral.

---

## 🎯 Visão Geral

O CodeWiki é uma plataforma completa para:

- 📊 **Gestão de Tecnologias** - Catálogo de tecnologias e ferramentas
- 👥 **Colaboradores** - Cadastro e gestão de habilidades
- 🏗️ **Aplicações** - Documentação de arquitetura e projetos
- 📝 **ADRs** - Architecture Decision Records
- 🔄 **Integrações** - Azure DevOps, Git, APIs
- 🔐 **Segurança** - Autenticação JWT, LGPD
- 📈 **Métricas** - Dashboards DORA, FinOps

---

## 📂 Estrutura de Pastas

```
docs/
├── deployment/          # 🚀 Deploy e produção
├── guides/              # 📖 Guias e tutoriais
├── issues/              # 🐛 Problemas e soluções
├── setup/               # ⚙️ Configuração e instalação
├── api-catalog/         # 🔌 Catálogo de APIs
├── data-templates/      # 📦 Templates de dados
├── runbooks/            # 📚 Runbooks operacionais
└── *.md                 # 📄 Documentos gerais
```

---

## 🚀 Início Rápido

### Visualizar esta Documentação

```bash
# Iniciar servidor MkDocs
docker-compose up mkdocs

# Acessar em http://localhost:8082
```

### Contribuir com a Documentação

1. Crie arquivos `.md` na pasta apropriada de `docs/`
2. Adicione ao `mkdocs.yml` na seção `nav:`
3. Teste localmente: `docker-compose up mkdocs`
4. Commit e push

!!! tip "Convenções"
    Consulte [**PROJECT-CONVENTIONS.md**](PROJECT-CONVENTIONS.md) para regras completas de organização.

---

## 🚀 [Deployment](deployment/)
Documentação sobre deploy, produção e infraestrutura.

- [**DEPLOY-GUIDE.md**](deployment/DEPLOY-GUIDE.md) - Guia completo de deployment
- [**DEPLOY-SUMMARY.md**](deployment/DEPLOY-SUMMARY.md) - Resumo dos procedimentos de deploy
- [**DOCKER-PRODUCTION-SETUP.md**](deployment/DOCKER-PRODUCTION-SETUP.md) - Configuração Docker para produção
- [**TEST-PRODUCTION.md**](deployment/TEST-PRODUCTION.md) - Testes de ambiente de produção

---

## 📖 [Guides](guides/)
Guias e tutoriais do sistema.

- [**GUIA-TESTE-PBIS-AZURE.md**](guides/GUIA-TESTE-PBIS-AZURE.md) - Guia de testes PBIS no Azure

---

## 🐛 [Issues](issues/)
Documentação de problemas conhecidos e suas soluções.

- [**ISSUE-COLABORADOR-WIZARD.md**](issues/ISSUE-COLABORADOR-WIZARD.md) - Issue do wizard de colaboradores

---

## ⚙️ [Setup](setup/)
Instruções de configuração e instalação.

- [**LGPD-IMPLEMENTATION.md**](setup/LGPD-IMPLEMENTATION.md) - Implementação do sistema LGPD
- [**LGPD-SETUP-INSTRUCTIONS.md**](setup/LGPD-SETUP-INSTRUCTIONS.md) - Instruções de setup LGPD
- [**MYSQL-REPLICATION-FIX.md**](setup/MYSQL-REPLICATION-FIX.md) - Correção de replicação MySQL

---

## 📋 Documentação Geral

### Referências Técnicas
- [**API-REFERENCIA-COMPLETA.md**](API-REFERENCIA-COMPLETA.md) - Referência completa das APIs
- [**CATALOGO-APIS-AUTO-UPDATE.md**](CATALOGO-APIS-AUTO-UPDATE.md) - Atualização automática do catálogo
- [**azure-devops-workitems-sync.md**](azure-devops-workitems-sync.md) - Sincronização com Azure DevOps

### Dashboards e Métricas
- [**DASHBOARD-DORA.md**](DASHBOARD-DORA.md) - Dashboard de métricas DORA
- [**FINOPS-INGESTION-GUIDE.md**](FINOPS-INGESTION-GUIDE.md) - Guia de ingestão FinOps

### Funcionalidades e Features
- [**FEATURE-STATUS-REPOSITORIO.md**](FEATURE-STATUS-REPOSITORIO.md) - Status de features do repositório
- [**FIX-COLABORADORES-HABILIDADES-AVALIACOES.md**](FIX-COLABORADORES-HABILIDADES-AVALIACOES.md) - Correções de colaboradores

### Guias de Execução
- [**EXECUTION-GUIDE.md**](EXECUTION-GUIDE.md) - Guia completo de execução do sistema

### Histórico e Correções
- [**CORRECOES-APLICADAS.md**](CORRECOES-APLICADAS.md) - Histórico de correções aplicadas
- [**IMPLEMENTATION-SUMMARY.md**](IMPLEMENTATION-SUMMARY.md) - Resumo de implementações

### Documentação MkDocs
- [**MKDOCS-README.md**](MKDOCS-README.md) - Documentação do MkDocs

### Telas e UI
- [**ENTREGA-DOCUMENTACAO-TELAS.md**](ENTREGA-DOCUMENTACAO-TELAS.md) - Documentação de telas

### Convenções
- [**PROJECT-CONVENTIONS.md**](PROJECT-CONVENTIONS.md) - ⭐ **Convenções e padrões do projeto**
- [**constitution.md**](constitution.md) - Constituição do projeto

---

## 🔍 Navegação Rápida por Tópico

### 🗄️ LGPD
- [Implementação](setup/LGPD-IMPLEMENTATION.md)
- [Setup](setup/LGPD-SETUP-INSTRUCTIONS.md)

### 🗃️ MySQL
- [Correção de Replicação](setup/MYSQL-REPLICATION-FIX.md)

### 🚢 Deploy
- [Guia Completo](deployment/DEPLOY-GUIDE.md)
- [Docker Produção](deployment/DOCKER-PRODUCTION-SETUP.md)
- [Testes](deployment/TEST-PRODUCTION.md)

### ☁️ Azure
- [Testes PBIS](guides/GUIA-TESTE-PBIS-AZURE.md)
- [Azure DevOps Sync](azure-devops-workitems-sync.md)

### 📊 FinOps
- [Guia de Ingestão](FINOPS-INGESTION-GUIDE.md)

### 🔌 APIs
- [Referência Completa](API-REFERENCIA-COMPLETA.md)
- [Catálogo Auto-Update](CATALOGO-APIS-AUTO-UPDATE.md)

### 📈 Métricas
- [Dashboard DORA](DASHBOARD-DORA.md)

---

## 📐 Convenções de Documentação

### ⚠️ REGRA IMPORTANTE

**Todos os arquivos Markdown (`.md`) devem estar na pasta `docs/`.**

Exceções:
- `README.md` - Permanece na raiz do projeto
- `data-templates/*.md` - Documentação específica de templates

### Estrutura Recomendada

| Categoria | Pasta | Conteúdo |
|-----------|-------|----------|
| 🚀 Deploy | `docs/deployment/` | Deploy, produção, Docker, testes |
| 📖 Guias | `docs/guides/` | Tutoriais, HOWTOs |
| 🐛 Issues | `docs/issues/` | Problemas, troubleshooting |
| ⚙️ Setup | `docs/setup/` | Configuração, instalação, migrations |
| 📋 Geral | `docs/` | Documentação geral, APIs, dashboards |

### Nomenclatura

- Formato: `NOME-DO-ARQUIVO.md` (UPPER-KEBAB-CASE)
- Prefixos: `GUIDE-`, `SETUP-`, `DEPLOY-`, `ISSUE-`, `README-`

Consulte [**PROJECT-CONVENTIONS.md**](PROJECT-CONVENTIONS.md) para detalhes completos.

---

## 🔧 Ferramentas

### Verificar arquivos fora de lugar

```bash
# Listar arquivos MD na raiz (exceto README.md)
ls -1 *.md 2>/dev/null | grep -v "^README.md$"
```

### Ver estrutura de docs

```bash
tree docs/ -L 2
```

---

**Última atualização**: 12 de Janeiro de 2026  
**Convenção ativa desde**: 12 de Janeiro de 2026



