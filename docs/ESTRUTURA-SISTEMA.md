# Estrutura do Sistema de Auditoria

## 📁 Organização de Componentes

### 🎯 Views Principais (src/components/)

#### Dashboard e Visualizações
- `DashboardView.tsx` - Dashboard principal com métricas
- `LogsAndTracesView.tsx` - Visualização de logs e traces W3C
- `DocumentacaoAPIsView.tsx` - Documentação interativa de APIs

### 📦 Módulos por Funcionalidade (src/components/[modulo]/)

#### 🔗 Integrações (integracoes/)
- `IntegracaoView.tsx` - View principal de listagem
- `IntegracaoForm.tsx` - Formulário unificado (todos os tipos)
- `IntegracaoDataTable.tsx` - Tabela de dados com filtros

**Tipos de Integração Suportados:**
- User-to-Cloud
- User-to-OnPremise
- Cloud-to-Cloud
- OnPremise-to-Cloud
- OnPremise-to-OnPremise

#### 👥 Colaboradores (colaboradores/)
- `ColaboradoresView.tsx` - Gestão de colaboradores
- `ColaboradorForm.tsx` - Formulário de cadastro/edição
- `ColaboradoresTable.tsx` - Tabela de listagem
- `AfastamentosTable.tsx` - Gestão de afastamentos

#### 💻 Tecnologias (tecnologias/)
- `TecnologiasView.tsx` - Gestão de tecnologias
- `TecnologiaForm.tsx` - Formulário de cadastro
- `TecnologiasTable.tsx` - Tabela de listagem
- `ContratosTecnologiaTable.tsx` - Contratos relacionados
- `CustosSaaSTable.tsx` - Custos de SaaS
- `ManutencoesSaaSTable.tsx` - Manutenções
- `ContratosAMSTable.tsx` - Contratos AMS

#### 📋 Processos de Negócio (processos/)
- `ProcessosView.tsx` - Gestão de processos
- `ProcessoNegocioForm.tsx` - Formulário de cadastro
- `ProcessosNegocioTable.tsx` - Tabela de listagem
- `NormasProcessoTable.tsx` - Normas e compliance

#### 📱 Aplicações (aplicacoes/)
- `AplicacoesView.tsx` - Gestão de aplicações
- `AplicacaoForm.tsx` - Formulário de cadastro
- `AplicacaoDataTable.tsx` - Tabela de dados
- `AplicacoesDashboard.tsx` - Dashboard específico

#### 📞 Comunicação (comunicacao/)
- `ComunicacaoView.tsx` - Gestão de comunicações
- `ComunicacaoForm.tsx` - Formulário de cadastro
- `ComunicacaoDataTable.tsx` - Tabela de dados

#### 🔐 Tipos de Comunicação (tipos-comunicacao/)
- `TiposComunicacaoView.tsx` - Gestão de tipos
- `TipoComunicacaoForm.tsx` - Formulário
- `TipoComunicacaoDataTable.tsx` - Tabela

#### 📚 Runbooks (runbooks/)
- `RunbooksView.tsx` - Gestão de runbooks
- `RunbookForm.tsx` - Formulário de cadastro
- `RunbookDataTable.tsx` - Tabela de dados

#### 🎯 Capacidades de Negócio (capacidades/)
- `CapacidadesView.tsx` - Gestão de capacidades
- `CapacidadeForm.tsx` - Formulário
- `CapacidadeDataTable.tsx` - Tabela

#### ⚡ Habilidades (habilidades/)
- `HabilidadesView.tsx` - Gestão de habilidades
- `HabilidadeForm.tsx` - Formulário
- `HabilidadeDataTable.tsx` - Tabela

#### 📊 SLAs (slas/)
- `SLAsView.tsx` - Gestão de SLAs
- `SLAForm.tsx` - Formulário
- `SLADataTable.tsx` - Tabela
- `ResponsaveisTable.tsx` - Responsáveis por SLA

#### 🚫 Tipos de Afastamento (tipos-afastamento/)
- `TiposAfastamentoView.tsx` - Gestão de tipos
- `TipoAfastamentoForm.tsx` - Formulário
- `TiposAfastamentoTable.tsx` - Tabela

#### 🔑 Tokens (tokens/)
- `TokensView.tsx` - Gestão de tokens de acesso
- `TokenIntegracaoManager.tsx` - Gerenciamento de tokens

#### 🏗️ Ferramentas (gerador-projetos/)
- `GeradorProjetosView.tsx` - Gerador de projetos
- `ProjectForm.tsx` - Configuração de projetos

#### 📥 Carga de Dados (carga/)
- `CargaDadosView.tsx` - Importação/exportação
- `CargaLockfilesView.tsx` - Carga de lockfiles

#### 🔌 Azure DevOps (azure-devops/)
- `AzureDevOpsView.tsx` - Integração com Azure DevOps

### 🧩 Componentes Reutilizáveis (ui/)

Baseados em shadcn/ui:
- `button.tsx` - Botões
- `input.tsx` - Campos de entrada
- `select.tsx` - Seleção dropdown
- `table.tsx` - Tabelas
- `dialog.tsx` - Modais
- `card.tsx` - Cards
- `form.tsx` - Formulários
- `toast.tsx` - Notificações
- `sidebar.tsx` - Menu lateral
- E muitos outros...

## 🔌 Backend (server/)

### API REST (server/api.js)

#### Endpoints Principais

**Colaboradores**
- `GET /api/colaboradores` - Listar todos
- `GET /api/colaboradores/:id` - Buscar por ID
- `POST /api/colaboradores` - Criar
- `PUT /api/colaboradores/:id` - Atualizar
- `DELETE /api/colaboradores/:id` - Excluir

**Tecnologias**
- `GET /api/tecnologias`
- `POST /api/tecnologias`
- `PUT /api/tecnologias/:id`
- `DELETE /api/tecnologias/:id`

**Processos de Negócio**
- `GET /api/processos-negocio`
- `POST /api/processos-negocio`
- `PUT /api/processos-negocio/:id`
- `DELETE /api/processos-negocio/:id`

**Aplicações**
- `GET /api/aplicacoes`
- `POST /api/aplicacoes`
- `PUT /api/aplicacoes/:id`
- `DELETE /api/aplicacoes/:id`

**Integrações**
- `GET /api/integracoes` - Listar todas
- `GET /api/integracoes/:id` - Buscar por ID
- `POST /api/integracoes` - Criar (com FormData para upload)
- `PUT /api/integracoes/:id` - Atualizar (com FormData)
- `DELETE /api/integracoes/:id` - Excluir

**Comunicações**
- `GET /api/comunicacoes`
- `POST /api/comunicacoes`
- `PUT /api/comunicacoes/:id`
- `DELETE /api/comunicacoes/:id`

**Tipos de Comunicação**
- `GET /api/tipos-comunicacao`
- `POST /api/tipos-comunicacao`
- `PUT /api/tipos-comunicacao/:id`
- `DELETE /api/tipos-comunicacao/:id`

**Runbooks**
- `GET /api/runbooks`
- `POST /api/runbooks`
- `PUT /api/runbooks/:id`
- `DELETE /api/runbooks/:id`

**Capacidades de Negócio**
- `GET /api/capacidades-negocio`
- `POST /api/capacidades-negocio`
- `PUT /api/capacidades-negocio/:id`
- `DELETE /api/capacidades-negocio/:id`

**Habilidades**
- `GET /api/habilidades`
- `POST /api/habilidades`
- `PUT /api/habilidades/:id`
- `DELETE /api/habilidades/:id`

**SLAs**
- `GET /api/slas`
- `POST /api/slas`
- `PUT /api/slas/:id`
- `DELETE /api/slas/:id`

**Tipos de Afastamento**
- `GET /api/tipos-afastamento`
- `POST /api/tipos-afastamento`
- `PUT /api/tipos-afastamento/:id`
- `DELETE /api/tipos-afastamento/:id`

**Logs e Traces**
- `GET /api/logs` - Buscar logs com filtros
- `POST /api/logs` - Criar log
- `GET /api/traces/:traceId` - Buscar trace completo

**Configurações**
- `GET /api/configuracoes` - Buscar todas
- `POST /api/configuracoes` - Salvar configuração

**Arquivos**
- `POST /api/upload` - Upload de arquivos
- `GET /uploads/:filename` - Download de arquivos

## 🗄️ Banco de Dados (database/)

### Estrutura MySQL

#### Tabelas Principais

**colaboradores**
- id, nome, email, cargo, senioridade
- data_admissao, status, etc.

**tecnologias**
- id, nome, tipo, versao, fornecedor
- linguagem, framework, etc.

**processos_negocio**
- id, identificacao, nome, descricao
- nivel_maturidade, frequencia, etc.

**aplicacoes**
- id, nome, sigla, descricao
- tipo, ambiente, status, etc.

**integracoes**
- id, sigla, nome
- tipo_integracao, estilo_integracao
- padrao_caso_uso, integracao_tecnologica
- tipo_dispositivo, nome_dispositivo
- aplicacao_origem_id, aplicacao_destino_id
- comunicacao_id, tipo_autenticacao
- periodicidade, frequencia_uso
- especificacao_path, etc.

**comunicacoes**
- id, sigla, nome, tipo_comunicacao_id
- endereco, porta, protocolo, etc.

**tipos_comunicacao**
- id, nome, descricao, icone

**runbooks**
- id, titulo, descricao, aplicacao_id
- conteudo, tags, etc.

**capacidades_negocio**
- id, nome, descricao, nivel

**habilidades**
- id, nome, categoria, nivel

**slas**
- id, nome, descricao, aplicacao_id
- tempo_resposta, disponibilidade, etc.

**tipos_afastamento**
- id, nome, remunerado, dias_maximo

**logs**
- id, trace_id, span_id, parent_span_id
- timestamp, level, message
- component, user_id, ip_address
- metadata, etc.

**configuracoes**
- key, value, updated_at

### Scripts de Migração

Arquivos em `database/`:
- `01-init-schema-data.sql` - Schema inicial
- `02-setup-replication.sh` - Replicação master-slave
- `03-create-configuracoes.sql` - Tabela de configurações
- `04-create-logs.sql` - Sistema de logs
- `05-migrate-processos.sql` - Migração de processos
- `06-migrate-aplicacoes.sql` - Migração de aplicações
- `07-carga-runbooks.sql` - Carga de runbooks
- `08-create-tipos-comunicacao.sql` - Tipos de comunicação
- `09-create-comunicacoes.sql` - Comunicações
- `10-create-integracoes.sql` - Integrações
- `25-fix-processos-negocio-structure.sql` - Correção de estrutura

## 🐳 Docker

### Containers

**mysql-master** (porta 3306)
- MySQL 8.0 Master
- Volume: mysql-master-data
- Health check ativo

**mysql-slave** (porta 3307)
- MySQL 8.0 Slave (replicação)
- Volume: mysql-slave-data
- Health check ativo

**auditoria-app** (porta 3000)
- Node.js + Express + Vite
- Frontend + Backend integrados
- Hot reload em desenvolvimento

**auditoria-mkdocs** (porta 8000)
- MkDocs Material
- Documentação do sistema

### Volumes Persistentes

- `mysql-master-data` - Dados do MySQL Master
- `mysql-slave-data` - Dados do MySQL Slave

## 📚 Documentação (docs/)

### Arquivos Principais

- `README.md` - Visão geral
- `QUICKSTART.md` - Início rápido
- `DEPLOYMENT_GUIDE.md` - Deploy
- `DOCKER_GUIDE.md` - Docker
- `API_GUIDE.md` - APIs
- `INTEGRACOES.md` - Sistema de integrações
- `CHANGELOG.md` - Histórico de versões
- `SECURITY.md` - Segurança

## 🛠️ Scripts Utilitários

- `docker-manager.sh` - Gerenciamento Docker
- `liquibase-manager.sh` - Migrações Liquibase
- `build-production.sh` - Build de produção
- `mkdocs-helper.sh` - Utilitários MkDocs
- `test-*.sh` - Scripts de teste

## 📊 Fluxo de Dados

```
Frontend (React)
    ↓
API REST (Express)
    ↓
MySQL Master
    ↓ (replicação)
MySQL Slave (leitura)
```

## 🔐 Autenticação e Segurança

- Tokens de API (gestão via interface)
- CORS configurado
- Validação de entrada
- Logs de auditoria
- Health checks

## 📈 Monitoramento

- Logs centralizados (W3C Trace Context)
- Traces distribuídos
- Health checks automáticos
- Métricas no dashboard

## 🚀 Deploy

### Desenvolvimento
```bash
docker-compose up -d
```

### Produção
```bash
./build-production.sh
docker-compose -f docker-compose.prod.yml up -d
```

---

**Última Atualização:** 15 de Dezembro de 2025  
**Versão do Sistema:** 1.0.0  
**Status:** ✅ Produção
