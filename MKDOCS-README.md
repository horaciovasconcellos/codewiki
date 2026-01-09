# 📚 MkDocs - Documentação do Sistema de Auditoria

## 🚀 Como Usar

### Sincronizar Documentações

Antes de subir o container, sincronize as documentações do `data-templates` para `docs`:

```bash
./sync-docs.sh
```

### Subir o Container

```bash
docker-compose up -d mkdocs
```

Ou reiniciar:

```bash
docker-compose restart mkdocs
```

### Acessar a Documentação

Abra seu navegador em: **http://localhost:8000**

## 📋 Estrutura da Documentação

### 🏠 Início
- Bem-vindo
- Constituição

### 📚 Documentação de Telas
- Índice Geral, Resumo Completo, Sumário Executivo
- **Core**: Dashboard, Logs and Traces
- **Cadastros**: Aplicações
- **DevOps**: Gerador de Projetos
- **Análise**: ReportBook
- **InnerSource**: Visão Geral

### 📊 Métricas e Dashboards
- DORA Dashboard

### 🔧 Features Implementadas
- Status de Repositório
- Fix Colaboradores/Habilidades

### 🤖 Sistema ADR
- Visão Geral
- Resumo de Implementação
- Guia de Carga
- Melhorias de UI

### ⚙️ Pipelines
- Pipeline Database
- Pipeline Wizard Stages
- Stages YAML Import

### ☁️ Azure DevOps
- Templates
- Quick Start
- Troubleshooting
- Work Items Sync

### 📜 Scripts
- Documentação
- Testes

### 📝 Logging e Auditoria
- Quick Reference
- Implementação Completa
- Relatório de Auditoria
- Resumo de Sucesso

### 🔗 API
- Referência Completa (210+ endpoints)
- Catálogo de APIs
- Payloads

### 📦 Data Templates ⭐ **NOVO**
Documentação completa dos templates de dados e exemplos:

#### Carga de Dados
- **Guia de Carga CSV** - Tutorial completo para importação
- **README Carga** - Visão geral do sistema de carga

#### Entidades
- **Tecnologias** - Catálogo de tecnologias e ferramentas
- **Colaboradores** - Gestão de pessoas e habilidades (com Quick Reference)
- **Aplicações** - Aplicações corporativas e relacionamentos
- **ADRs** - Architecture Decision Records
- **Spec-Kit (SDD)** - Software Design Documents
- **InnerSource** - Projetos InnerSource e identificadores
- **Comunicações** - Tipos de comunicação e estrutura
- **Infraestrutura** - Servidores e estruturas de projeto
- **Processos** - Processos de negócio
- **Scripts** - Automações e scripts
- **Payloads** - Templates de payloads

### 📚 Runbooks
Mais de 10 runbooks de banco de dados (MySQL e Oracle):
- Backup e Recovery
- Performance Tuning
- Instalação
- Patching e Upgrade
- Segurança e Auditoria
- Data Guard e HA

## 🔄 Sincronização Automática

O arquivo `sync-docs.sh` automatiza a sincronização de:
- Todos os arquivos `README-*.md` de `data-templates/`
- `GUIA-CARGA-CSV.md`
- `HABILIDADES-QUICK-REF.md`

## 📝 Adicionando Nova Documentação

### 1. Criar o arquivo markdown
Crie o arquivo em `docs/` ou `data-templates/`:

```bash
# Documentação geral
docs/MINHA-DOC.md

# Template de dados
data-templates/README-MINHA-ENTIDADE.md
```

### 2. Atualizar mkdocs.yml
Adicione a entrada no arquivo `mkdocs.yml`:

```yaml
nav:
  - "Minha Seção":
      - "Título": "MINHA-DOC.md"
```

### 3. Sincronizar (se for data-template)
```bash
./sync-docs.sh
```

### 4. Reiniciar o MkDocs
```bash
docker-compose restart mkdocs
```

## 🛠️ Troubleshooting

### Container não sobe
```bash
# Ver logs
docker-compose logs mkdocs

# Reconstruir imagem
docker-compose build mkdocs
docker-compose up -d mkdocs
```

### Warnings sobre links quebrados
Os warnings sobre links relativos são normais para arquivos que referenciam código-fonte (não incluído no MkDocs). A documentação funcionará corretamente.

### Porta 8000 em uso
Altere a porta no `docker-compose.yml`:
```yaml
ports:
  - "8001:8082"  # Mudando para 8001
```

## 📦 Plugins Instalados

- **mkdocs-material**: Theme moderno e responsivo
- **mkdocs-awesome-pages-plugin**: Organização automática
- **mkdocs-swagger-ui-tag**: Documentação de APIs
- **pymdown-extensions**: Extensões Markdown avançadas
- **markdown-include**: Inclusão de arquivos
- Suporte a **Mermaid** para diagramas

## 🎨 Personalização

### Theme
O theme Material Design está configurado com:
- Paleta de cores: Deep Purple
- Modo escuro/claro automático
- Navegação instantânea
- Busca avançada

### Extensões Markdown
Suporte para:
- Diagramas Mermaid
- Admonitions (blocos de aviso)
- Tabelas avançadas
- Code highlighting
- Task lists
- Footnotes

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `docker-compose logs mkdocs`
2. Sincronize os docs: `./sync-docs.sh`
3. Reinicie o container: `docker-compose restart mkdocs`
4. Reconstrua se necessário: `docker-compose build mkdocs`
