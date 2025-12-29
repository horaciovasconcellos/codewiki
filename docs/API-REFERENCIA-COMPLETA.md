# 📘 API - Referência Completa

Documentação abrangente de todos os endpoints da API REST do Sistema de Auditoria.

## 📑 Índice

- [Tipos de Afastamento](#tipos-de-afastamento)
- [Colaboradores](#colaboradores)
- [Avaliações de Colaboradores](#avaliacoes-de-colaboradores)
- [Afastamentos](#afastamentos)
- [Habilidades](#habilidades)
- [Capacidades de Negócio](#capacidades-de-negocio)
- [Tecnologias](#tecnologias)
- [Aplicações](#aplicacoes)
- [Processos de Negócio](#processos-de-negocio)
- [Comunicações](#comunicacoes)
- [Integrações](#integracoes)
- [SLAs](#slas)
- [Runbooks](#runbooks)
- [Estruturas de Projeto (Gerador)](#estruturas-de-projeto)
- [Azure DevOps](#azure-devops)
- [Servidores](#servidores)
- [Stages (Pipeline)](#stages)
- [Pipelines](#pipelines)
- [ADRs (Architecture Decision Records)](#adrs)
- [Contratos](#contratos)
- [Notificações](#notificacoes)
- [Work Items (Azure)](#work-items-azure)
- [Métricas DORA](#metricas-dora)
- [Reports (ReportBook)](#reports)
- [Payloads](#payloads)
- [Configurações](#configuracoes)
- [Logs de Auditoria](#logs-de-auditoria)
- [Dashboard](#dashboard)

---

## 🔹 Tipos de Afastamento

### Listagem e Consulta

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/tipos-afastamento` | Lista todos os tipos de afastamento | Array de tipos |
| `GET` | `/api/tipos-afastamento/:id` | Busca tipo específico por ID | Objeto tipo |

### Operações CRUD

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/tipos-afastamento` | Cria novo tipo | `{ sigla, descricao }` |
| `PUT` | `/api/tipos-afastamento/:id` | Atualiza tipo existente | `{ sigla, descricao }` |
| `DELETE` | `/api/tipos-afastamento/:id` | Remove tipo | - |

---

## 👥 Colaboradores

### Listagem e Consulta

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/colaboradores` | Lista todos colaboradores | Array com habilidades e afastamentos |
| `GET` | `/api/colaboradores/:id` | Busca colaborador específico | Objeto completo |

### Operações CRUD

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/colaboradores` | Cria novo colaborador | `{ matricula, nome, setor, dataAdmissao }` |
| `PUT` | `/api/colaboradores/:id` | Atualiza colaborador | `{ nome, setor, dataAdmissao, dataDemissao }` |
| `DELETE` | `/api/colaboradores/:id` | Remove colaborador | - |

---

## ⭐ Avaliações de Colaboradores

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/colaboradores/:id/avaliacoes` | Lista avaliações do colaborador | - |
| `POST` | `/api/colaboradores/:id/avaliacoes` | Cria avaliação | `{ dataAvaliacao, nota*, motivo }` |
| `PUT` | `/api/avaliacoes/:id` | Atualiza avaliação | `{ dataAvaliacao, nota*, motivo }` |
| `DELETE` | `/api/avaliacoes/:id` | Remove avaliação | - |

> **Notas**: `notaTecnica`, `notaColaboracao`, `notaProatividade`, `notaPontualidade`, `notaComunicacao`

---

## 🏖️ Afastamentos

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/colaboradores/:colaboradorId/afastamentos` | Adiciona afastamento | `{ tipoAfastamentoId, dataInicio, dataTermino, observacao }` |
| `DELETE` | `/api/afastamentos/:id` | Remove afastamento | - |

---

## 🎯 Habilidades

### Endpoints Principais

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/habilidades` | Lista todas habilidades com certificações | Array completo |
| `GET` | `/api/habilidades/:id` | Busca habilidade específica | Objeto com certificações |
| `GET` | `/api/habilidades/diagnostico` | Diagnóstico de habilidades | Estatísticas |

### Operações CRUD

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/habilidades` | Cria habilidade | `{ sigla, descricao, tipo, dominio, subcategoria, certificacoes[] }` |
| `PUT` | `/api/habilidades/:id` | Atualiza habilidade | `{ sigla, descricao, tipo, dominio, subcategoria, certificacoes[] }` |
| `DELETE` | `/api/habilidades/:id` | Remove habilidade | - |

### Associações com Colaboradores

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/colaboradores/:colaboradorId/habilidades` | Associa habilidade a colaborador | `{ habilidadeId, nivel, dataInicio }` |
| `DELETE` | `/api/colaborador-habilidades/:id` | Remove associação | - |

**Certificações**: Array de objetos `{ codigo, descricao, orgaoCertificador, urlDocumentacao }`

---

## 🎭 Capacidades de Negócio

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/capacidades-negocio` | Lista todas capacidades | Array |
| `GET` | `/api/capacidades-negocio/:id` | Busca capacidade específica | Objeto |
| `POST` | `/api/capacidades-negocio` | Cria capacidade | `{ sigla, nome, descricao, nivel, categoria, coberturaEstrategica }` |
| `PUT` | `/api/capacidades-negocio/:id` | Atualiza capacidade | Objeto completo |
| `DELETE` | `/api/capacidades-negocio/:id` | Remove capacidade | - |

---

## 🔧 Tecnologias

### Tecnologias - CRUD Principal

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias` | Lista todas tecnologias | Array |
| `GET` | `/api/tecnologias/:id` | Busca tecnologia específica | Objeto com relacionamentos |
| `POST` | `/api/tecnologias` | Cria tecnologia | `{ sigla, nome, versaoRelease, categoria, status, ... }` |
| `PUT` | `/api/tecnologias/:id` | Atualiza tecnologia | Objeto completo |
| `DELETE` | `/api/tecnologias/:id` | Remove tecnologia | - |

### Responsáveis pela Tecnologia

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias/:id/responsaveis` | Lista responsáveis | Array |
| `POST` | `/api/tecnologias/:id/responsaveis` | Adiciona responsável | `{ matriculaFuncionario, nomeFuncionario, dataInicio, perfil }` |
| `PUT` | `/api/tecnologias/:id/responsaveis/:respId` | Atualiza responsável | Objeto completo |
| `DELETE` | `/api/tecnologias/:id/responsaveis/:respId` | Remove responsável | - |

### Contratos de Tecnologia

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias/:id/contratos` | Lista contratos | Array |
| `POST` | `/api/tecnologias/:id/contratos` | Adiciona contrato | `{ numeroContrato, vigenciaInicial, vigenciaTermino, valorContrato }` |
| `PUT` | `/api/tecnologias/:id/contratos/:contratoId` | Atualiza contrato | Objeto completo |
| `DELETE` | `/api/tecnologias/:id/contratos/:contratoId` | Remove contrato | - |

### Contratos AMS

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias/:id/contratos-ams` | Lista contratos AMS | Array |
| `POST` | `/api/tecnologias/:id/contratos-ams` | Adiciona contrato AMS | `{ contrato, cnpjContratado, custoAnual, dataInicio, dataTermino }` |
| `PUT` | `/api/tecnologias/:id/contratos-ams/:contratoId` | Atualiza contrato AMS | Objeto completo |
| `DELETE` | `/api/tecnologias/:id/contratos-ams/:contratoId` | Remove contrato AMS | - |

### Custos SaaS

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias/:id/custos-saas` | Lista custos SaaS | Array |
| `POST` | `/api/tecnologias/:id/custos-saas` | Adiciona custo SaaS | `{ custoTotalSaaS, custoPorLicenca, numeroLicencasContratadas, ... }` |
| `PUT` | `/api/tecnologias/:id/custos-saas/:custoId` | Atualiza custo SaaS | Objeto completo |
| `DELETE` | `/api/tecnologias/:id/custos-saas/:custoId` | Remove custo SaaS | - |

### Manutenções SaaS

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/tecnologias/:id/manutencoes-saas` | Lista manutenções SaaS | Array |
| `POST` | `/api/tecnologias/:id/manutencoes-saas` | Adiciona manutenção | `{ dataHoraInicio, dataHoraTermino, tempoIndisponibilidadeHoras }` |
| `PUT` | `/api/tecnologias/:id/manutencoes-saas/:manutencaoId` | Atualiza manutenção | Objeto completo |
| `DELETE` | `/api/tecnologias/:id/manutencoes-saas/:manutencaoId` | Remove manutenção | - |

---

## 📱 Aplicações

### Aplicações - CRUD Principal

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/aplicacoes` | Lista todas aplicações | Array com relacionamentos |
| `GET` | `/api/aplicacoes/:id` | Busca aplicação específica | Objeto completo |
| `GET` | `/api/aplicacoes-stats` | Estatísticas de aplicações | Métricas agregadas |
| `POST` | `/api/aplicacoes` | Cria aplicação (wizard 7 steps) | Objeto completo wizard |
| `PUT` | `/api/aplicacoes/:id` | Atualiza aplicação | Objeto completo wizard |
| `DELETE` | `/api/aplicacoes/:id` | Remove aplicação | - |

### Aplicações - Carga em Lote

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/aplicacoes/bulk` | Carga em lote de aplicações | Array de aplicações |

### Tecnologias da Aplicação

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/aplicacoes/:id/tecnologias` | Lista tecnologias da aplicação | Array |
| `POST` | `/api/aplicacoes/:id/tecnologias` | Associa tecnologia | `{ tecnologiaId, dataInicio }` |
| `DELETE` | `/api/aplicacoes/:id/tecnologias/:tecnologiaId` | Remove associação | - |

### Servidores da Aplicação

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/aplicacoes/:aplicacaoId/servidores` | Lista servidores | Array com detalhes |

### ADRs da Aplicação

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/aplicacoes/:aplicacaoId/adrs` | Lista ADRs da aplicação | Array |

### Payloads da Aplicação

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `GET` | `/api/aplicacoes/:aplicacaoId/payloads` | Lista payloads | Array com detalhes |

### Contratos da Aplicação

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/aplicacoes/:aplicacaoId/contratos` | Lista contratos | Array |
| `POST` | `/api/aplicacoes/:aplicacaoId/contratos` | Adiciona contrato | `{ numeroContrato, fornecedor, valorTotal, ... }` |

---

## 📊 Processos de Negócio

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/processos-negocio` | Lista todos processos | Array |
| `GET` | `/api/processos-negocio/:id` | Busca processo específico | Objeto |
| `POST` | `/api/processos-negocio` | Cria processo | `{ identificacao, descricao, nivelMaturidade, areaResponsavel, ... }` |
| `PUT` | `/api/processos-negocio/:id` | Atualiza processo | Objeto completo |
| `DELETE` | `/api/processos-negocio/:id` | Remove processo | - |

---

## 🔌 Comunicações

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/comunicacoes` | Lista todas comunicações | Array |
| `GET` | `/api/comunicacoes/:id` | Busca comunicação específica | Objeto |
| `POST` | `/api/comunicacoes` | Cria comunicação | `{ identificacao, descricao, tipo, tecnologia, ... }` |
| `PUT` | `/api/comunicacoes/:id` | Atualiza comunicação | Objeto completo |
| `DELETE` | `/api/comunicacoes/:id` | Remove comunicação | - |

---

## 🔗 Integrações

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/integracoes` | Lista todas integrações | Array |
| `GET` | `/api/integracoes/:id` | Busca integração específica | Objeto |
| `GET` | `/api/integracoes/:id/especificacao` | Download da especificação | Arquivo |
| `POST` | `/api/integracoes` | Cria integração | Multipart form-data com arquivo |
| `PUT` | `/api/integracoes/:id` | Atualiza integração | Multipart form-data |
| `DELETE` | `/api/integracoes/:id` | Remove integração | - |

---

## 📋 SLAs

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/slas` | Lista todos SLAs | Array |
| `GET` | `/api/slas/:id` | Busca SLA específico | Objeto |
| `POST` | `/api/slas` | Cria SLA | `{ sigla, descricao, tipoSLA, dataInicio, ... }` |
| `PUT` | `/api/slas/:id` | Atualiza SLA | Objeto completo |
| `DELETE` | `/api/slas/:id` | Remove SLA | - |

---

## 📖 Runbooks

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/runbooks` | Lista todos runbooks | Array |
| `GET` | `/api/runbooks/:id` | Busca runbook específico | Objeto completo |
| `POST` | `/api/runbooks` | Cria runbook | `{ sigla, descricaoResumida, finalidade, tipoRunbook, ... }` |
| `PUT` | `/api/runbooks/:id` | Atualiza runbook | Objeto completo |
| `DELETE` | `/api/runbooks/:id` | Remove runbook | - |

---

## 🏗️ Estruturas de Projeto

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/estruturas-projeto` | Lista projetos gerados | Array |
| `GET` | `/api/estruturas-projeto/:id` | Busca projeto específico | Objeto |
| `POST` | `/api/estruturas-projeto` | Cria projeto | `{ produto, workItemProcess, projeto, repositorios[], ... }` |
| `PUT` | `/api/estruturas-projeto/:id` | Atualiza projeto | Objeto completo |
| `DELETE` | `/api/estruturas-projeto/:id` | Remove projeto | - |

---

## ☁️ Azure DevOps

### Criação e Configuração de Projetos

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/azure-devops/setup-project` | Setup completo de projeto | Configuração completa |
| `POST` | `/api/azure-devops/create-project` | Cria projeto no Azure | `{ projectName, description, process }` |
| `POST` | `/api/azure-devops/create-team` | Cria time no projeto | `{ projectName, teamName }` |
| `POST` | `/api/azure-devops/create-iterations` | Cria iterações/sprints | `{ projectName, teamName, iterations[] }` |
| `POST` | `/api/azure-devops/integrar-projeto` | Integração completa | Objeto completo |

### Repositórios

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/azure-devops/criar-repositorios` | Cria repositórios no Azure | `{ estruturaProjetoId, repositorios[] }` |

### Consultas

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|-----------|
| `GET` | `/api/azure-devops/consultar-projeto/:projectName/:teamName` | Consulta projeto e time | Path params |
| `GET` | `/api/azure-devops/project/:projectName` | Detalhes do projeto | Path param |

### Board e Templates

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `POST` | `/api/azure-devops/configure-board` | Configura board do projeto | Configurações |
| `POST` | `/api/azure-devops/templates` | Upload de template YAML | Multipart form-data |
| `GET` | `/api/azure-devops/templates` | Lista todos templates | - |
| `GET` | `/api/azure-devops/templates/:templateType` | Busca template específico | Path param |
| `DELETE` | `/api/azure-devops/templates/:templateType` | Remove template | Path param |

---

## 🖥️ Servidores

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/servidores` | Lista todos servidores | Array |
| `GET` | `/api/servidores/:id` | Busca servidor específico | Objeto |
| `POST` | `/api/servidores` | Cria servidor | `{ hostname, ipAddress, tipo, ambiente, ... }` |
| `PUT` | `/api/servidores/:id` | Atualiza servidor | Objeto completo |
| `DELETE` | `/api/servidores/:id` | Remove servidor | - |

### Aplicações do Servidor

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/servidores/:servidorId/aplicacoes` | Lista aplicações do servidor | - |
| `POST` | `/api/servidores/:servidorId/aplicacoes` | Associa aplicação | `{ aplicacaoId, tipoDeployment, ... }` |
| `DELETE` | `/api/servidores/:servidorId/aplicacoes` | Remove todas associações | - |
| `DELETE` | `/api/servidores/:servidorId/aplicacoes/:id` | Remove associação específica | - |

---

## 🔄 Stages

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/stages` | Lista todos stages | Array |
| `GET` | `/api/stages/:id` | Busca stage específico | Objeto |
| `POST` | `/api/stages` | Cria stage | `{ nome, descricao, ordem, conteudoYaml }` |
| `PUT` | `/api/stages/:id` | Atualiza stage | Objeto completo |
| `DELETE` | `/api/stages/:id` | Remove stage | - |

---

## 🚀 Pipelines

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/pipelines` | Lista todos pipelines | Array |
| `GET` | `/api/pipelines/:id` | Busca pipeline específico | Objeto com stages |
| `POST` | `/api/pipelines` | Cria pipeline | `{ nome, descricao, tipoRepositorio, stages[] }` |
| `PUT` | `/api/pipelines/:id` | Atualiza pipeline | Objeto completo |
| `DELETE` | `/api/pipelines/:id` | Remove pipeline | - |

---

## 📐 ADRs

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/adrs` | Lista todos ADRs | Array |
| `GET` | `/api/adrs/:id` | Busca ADR específico | Objeto |
| `POST` | `/api/adrs` | Cria ADR | `{ titulo, contexto, decisao, consequencias, ... }` |
| `PUT` | `/api/adrs/:id` | Atualiza ADR | Objeto completo |
| `DELETE` | `/api/adrs/:id` | Remove ADR | - |

---

## 📄 Contratos

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/contratos/:id` | Busca contrato específico | - |
| `PUT` | `/api/contratos/:id` | Atualiza contrato | Objeto completo |
| `DELETE` | `/api/contratos/:id` | Remove contrato | - |

---

## 🔔 Notificações

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/notificacoes` | Lista notificações | Query params: `?usuarioId=x` |
| `POST` | `/api/notificacoes/sync` | Sincroniza notificações | `{ usuarioId, email }` |
| `PUT` | `/api/notificacoes/:id/lida` | Marca como lida | - |
| `DELETE` | `/api/notificacoes/:id` | Remove notificação | - |
| `POST` | `/api/notificacoes/buscar-emails` | Busca emails do servidor | Configuração IMAP |

---

## 📋 Work Items (Azure)

| Método | Endpoint | Descrição | Payload/Params |
|--------|----------|-----------|----------------|
| `GET` | `/api/azure-work-items` | Lista work items | Query: `?projetoId=x&tipo=y&state=z` |
| `GET` | `/api/azure-work-items/:id/historico` | Histórico do work item | Path param |
| `POST` | `/api/azure-work-items/sync/:projetoId` | Sincroniza projeto específico | Path param |
| `POST` | `/api/azure-work-items/sync-all` | Sincroniza todos projetos | - |
| `GET` | `/api/azure-work-items/sync-logs` | Logs de sincronização | Query: `?limit=x` |
| `GET` | `/api/azure-work-items/projetos` | Lista projetos sincronizados | - |

---

## 📊 Métricas DORA

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|-----------|
| `GET` | `/api/dora-metrics/unified` | Métricas unificadas DORA | Query: `?projetoIds[]=x&startDate=y&endDate=z` |
| `GET` | `/api/dora-metrics/:projetoId` | Métricas de projeto específico | Path param + queries |

---

## 📖 Reports (ReportBook)

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/reports` | Lista todos reports | Array |
| `GET` | `/api/reports/:id` | Busca report específico | Objeto |
| `POST` | `/api/reports` | Cria report | `{ titulo, tipo, descricao, conteudo, ... }` |
| `PUT` | `/api/reports/:id` | Atualiza report | Objeto completo |
| `DELETE` | `/api/reports/:id` | Remove report | - |
| `POST` | `/api/reports/analyze-similarity` | Análise de similaridade | `{ titulo, descricao, conteudo }` |

---

## 📦 Payloads

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/payloads` | Lista todos payloads | Query: `?aplicacaoId=x` |
| `GET` | `/api/payloads/:id` | Busca payload específico | - |
| `POST` | `/api/payloads` | Cria payload | `{ nome, descricao, tipo, estrutura, aplicacaoId }` |
| `PUT` | `/api/payloads/:id` | Atualiza payload | Objeto completo |
| `DELETE` | `/api/payloads/:id` | Remove payload | - |
| `GET` | `/api/payloads/stats/summary` | Estatísticas de payloads | Agregações |

---

## ⚙️ Configurações

| Método | Endpoint | Descrição | Payload |
|--------|----------|-----------|---------|
| `GET` | `/api/configuracoes` | Lista todas configurações | Array |
| `PUT` | `/api/configuracoes/:chave` | Atualiza configuração | `{ valor }` |

---

## 📝 Logs de Auditoria

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|-----------|
| `GET` | `/api/logs-auditoria` | Lista logs de auditoria | Query: `?dataInicio=x&dataFim=y&tela=z&acao=w&limit=n` |
| `GET` | `/api/logs-auditoria/stats` | Estatísticas dos logs | Query: `?dataInicio=x&dataFim=y` |

---

## 📊 Dashboard

| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|-----------|
| `GET` | `/api/dashboard/aging-chart` | Aging chart de work items | Query: `?projetoId=x` |

---

## 🔍 Catálogo de APIs

| Método | Endpoint | Descrição | Resposta |
|--------|----------|-----------|----------|
| `POST` | `/api/catalog/generate` | Gera catálogo automático | Markdown completo |

---

## 📌 Notas Importantes

### Autenticação
Todos os endpoints requerem autenticação via PAT Token do Azure DevOps quando aplicável.

### Paginação
Endpoints de listagem suportam paginação via query parameters:
- `?page=1&limit=50`

### Filtros
Muitos endpoints suportam filtros via query string:
- `?status=ativo&categoria=backend`

### Formatos de Data
- **ISO 8601**: `2024-12-29T10:30:00Z`
- **Formato simples**: `2024-12-29`

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso - OK |
| `201` | Sucesso - Criado |
| `204` | Sucesso - Sem conteúdo |
| `400` | Erro - Requisição inválida |
| `404` | Erro - Não encontrado |
| `500` | Erro - Servidor interno |

### Headers Comuns

```http
Content-Type: application/json
Authorization: Bearer <PAT_TOKEN>
```

### Multipart Form-Data
Endpoints que aceitam upload de arquivos:
- `/api/integracoes` (especificação)
- `/api/azure-devops/templates` (YAML)
- `/api/notificacoes/buscar-emails` (anexos)

---

## 🚀 Exemplos de Uso

### Criar Habilidade com Certificações

```bash
POST /api/habilidades
Content-Type: application/json

{
  "sigla": "AWS",
  "descricao": "Amazon Web Services",
  "tipo": "Hard Skills",
  "dominio": "Desenvolvimento & Engenharia",
  "subcategoria": "Backend",
  "certificacoes": [
    {
      "codigo": "AWS-SAA",
      "descricao": "AWS Certified Solutions Architect - Associate",
      "orgaoCertificador": "Amazon Web Services",
      "urlDocumentacao": "https://aws.amazon.com/certification/"
    }
  ]
}
```

### Criar Aplicação Completa (Wizard 7 Steps)

```bash
POST /api/aplicacoes
Content-Type: application/json

{
  "sigla": "APP-001",
  "descricao": "Sistema de Vendas",
  "faseCicloVida": "Produção",
  "criticidadeNegocio": "Alta",
  "tecnologias": [
    { "tecnologiaId": "uuid-tech-1", "dataInicio": "2024-01-01" }
  ],
  "capacidades": [
    { "capacidadeId": "uuid-cap-1", "dataInicio": "2024-01-01" }
  ],
  "processos": [
    { "processoId": "uuid-proc-1", "dataInicio": "2024-01-01" }
  ],
  "ambientes": [
    { "tipoAmbiente": "Prod", "urlAmbiente": "https://app.com", "dataCriacao": "2024-01-01" }
  ],
  "integracoes": [],
  "slas": [],
  "runbooks": []
}
```

### Sincronizar Work Items do Azure

```bash
POST /api/azure-work-items/sync/projeto-uuid
```

### Buscar Logs com Filtros

```bash
GET /api/logs-auditoria?dataInicio=2024-12-01&dataFim=2024-12-31&tela=Aplicações&acao=criar&limit=100
```

---

## 📚 Recursos Adicionais

- [Guia de Instalação](MANUAL_INSTALACAO.md)
- [Documentação de Telas](TELAS-INDICE.md)
- [Guia de Deploy](DEPLOYMENT_GUIDE.md)
- [Troubleshooting](TROUBLESHOOTING-AZURE-TEMPLATES.md)

---

**Última atualização**: 29/12/2024  
**Total de Endpoints**: 185+  
**Versão da API**: 1.0
