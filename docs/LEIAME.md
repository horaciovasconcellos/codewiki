# Sistema de Auditoria - Gestão de Colaboradores

Sistema completo de gestão de colaboradores, tecnologias, processos de negócio, aplicações e SLAs com suporte a banco de dados MySQL replicado, APIs REST completas e **integração oficial com Microsoft Azure DevOps**.

## 🚀 Características Principais

- **🐳 Ambiente Docker Completo**: Toda a aplicação roda em containers isolados
- **Gestão de Colaboradores**: Controle de colaboradores, afastamentos e habilidades
- **Tecnologias**: Catálogo completo de tecnologias com contratos, custos e responsáveis
- **Processos de Negócio**: Gerenciamento de processos com normas e níveis de maturidade
- **Aplicações**: Registro de aplicações com ambientes, integrações e SLAs
- **SLAs**: Definição e acompanhamento de Service Level Agreements
- **Capacidades de Negócio**: Mapeamento de capacidades estratégicas
- **Habilidades**: Catálogo de habilidades técnicas e comportamentais
- **Comunicações**: Gerenciamento de padrões e tecnologias de comunicação/integração
- **Runbooks**: Catálogo de procedimentos operacionais padronizados
- **🔷 Integração Azure DevOps**: Automação completa de criação de projetos usando **APIs REST oficiais da Microsoft** (v7.1)
- **Banco de Dados Replicado**: MySQL em containers com replicação Master-Slave
- **APIs REST Completas**: Endpoints GET, POST, PUT, DELETE para todas as entidades
- **Carga de Dados**: Scripts shell para importação CSV/JSON
- **Logs e Rastreamento**: Sistema completo de logging e telemetria

## 🐳 Início Rápido com Docker

### Pré-requisitos
- Docker Desktop instalado e rodando
- Portas 3000, 3306, 3307 e 5173 disponíveis

### Comandos Essenciais

```bash
# Iniciar toda a aplicação (frontend, backend e MySQL)
./docker-manager.sh start

# Parar a aplicação
./docker-manager.sh stop

# Ver logs
./docker-manager.sh logs

# Verificar saúde dos serviços
./docker-manager.sh health

# Ver status e uso de recursos
./docker-manager.sh status
```

### Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **MySQL Master**: localhost:3306
- **MySQL Slave**: localhost:3307

📖 **[Documentação Completa do Docker](DOCKER_GUIDE.md)**

## 📚 Documentação

### 📖 Guias Principais
- **[🐳 Guia Docker Completo](DOCKER_GUIDE.md)**: Documentação completa do ambiente containerizado
- **[Manual de Instalação](docs/MANUAL_INSTALACAO.md)**: Guia completo para instalação local e em containers
- **[Documentação de APIs](docs/DOCUMENTACAO_API.md)**: Referência completa de todos os endpoints REST (porta 3000)
- **[Quick Start](docs/QUICKSTART.md)**: Início rápido do sistema

### 🔷 Azure DevOps
- **[APIs Microsoft Azure DevOps](docs/APIS_MICROSOFT_AZURE_DEVOPS.md)**: Integração completa com Azure DevOps usando APIs REST v7.1
- **[Configurações de Board](docs/CONFIGURACOES_BOARD_AZURE.md)**: Detalhamento das configurações automáticas de Board
- **[Fluxo de Criação de Projeto](docs/FLUXO_CRIACAO_PROJETO.md)**: Processo simplificado de criação
- **[Mudanças na Criação](docs/MUDANCAS_CRIACAO_PROJETO.md)**: Histórico de mudanças e melhorias
- **[Debug Azure DevOps](docs/DEBUG_AZURE_DEVOPS.md)**: Troubleshooting e comandos de debug

### 💾 Banco de Dados e Scripts
- **[Configuração do Banco de Dados](docs/CONFIGURACAO_BD.md)**: Setup do MySQL com replicação
- **[Scripts de Carga](scripts/README.md)**: Guia completo dos scripts de carga via API REST
- **[Carga de Habilidades](scripts/README-CARGA-HABILIDADES.md)**: Específico para habilidades
- **[Migração de Habilidades](scripts/README_MIGRACAO_HABILIDADES.md)**: Guia de migração

### 📋 Estruturas de Dados
- **[Tipos de Afastamento](docs/ESTRUTURA_TIPOS_AFASTAMENTO.md)**: Estrutura e exemplos
- **[Capacidades de Negócio](docs/ESTRUTURA_CAPACIDADES_NEGOCIO.md)**: Estrutura e exemplos
- **[Exemplo POST Tipo Afastamento](docs/EXEMPLO_POST_TIPO_AFASTAMENTO.md)**: Exemplos práticos de API

### 🔧 Troubleshooting e Outros
- **[Troubleshooting Runbook](docs/TROUBLESHOOTING_RUNBOOK.md)**: Solução de problemas com Runbooks
- **[PRD](docs/PRD.md)**: Product Requirements Document
- **[Atualizações de Documentação](docs/ATUALIZACOES_DOCUMENTACAO.md)**: Changelog da documentação (25/11/2025)

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Componentes**: shadcn/ui v4
- **Backend**: Node.js + Express.js
- **Banco de Dados**: MySQL 8.0 com replicação Master-Slave
- **Containerização**: Docker + Docker Compose
- **APIs**: REST com suporte a JSON
- **Integração**: Microsoft Azure DevOps REST APIs v7.1
- **Logging**: Sistema customizado de logs e traces

## 🔷 Integração com Microsoft Azure DevOps

O sistema possui integração completa com as **APIs REST oficiais da Microsoft Azure DevOps** (versão 7.1) para automação de:

- ✅ **Criação de Projetos** (Core API)
- ✅ **Criação de Times** (principal e sustentação)
- ✅ **Estruturação de Iterações** (sprints quinzenais e mensais)
- ✅ **Organização de Áreas** por categoria/tecnologia
- ✅ **Configuração de Boards** (colunas, swimlanes, card styles)
- ✅ **Configuração de Backlogs** (Epic, Feature, User Story)

**Documentação completa:** [APIS_MICROSOFT_AZURE_DEVOPS.md](docs/APIS_MICROSOFT_AZURE_DEVOPS.md)

### APIs da Microsoft Utilizadas

| API | Endpoint | Função |
|-----|----------|--------|
| **Core API - Projects** | `POST /_apis/projects` | Criar projetos |
| **Core API - Teams** | `POST /_apis/projects/{project}/teams` | Criar times |
| **Work Item Tracking API** | `POST /{project}/_apis/wit/classificationnodes/iterations` | Criar sprints |
| **Work Item Tracking API** | `POST /{project}/_apis/wit/classificationnodes/areas` | Criar áreas |
| **Work API - Team Settings** | `PATCH /{project}/{team}/_apis/work/teamsettings` | Configurar backlog |
| **Work API - Boards** | `PUT /{project}/{team}/_apis/work/boards/{board}/columns` | Configurar board |

**Versão da API:** 7.1 (mais recente)

## ⚡ Quick Start

### Desenvolvimento Local (sem Docker)

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Abrir no navegador
# http://localhost:5173
```

### Desenvolvimento com Docker (Banco de Dados Replicado)

```bash
# Iniciar containers (MySQL Master + Slave + Aplicação)
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar containers
docker-compose down
```

## 📦 Carga de Dados

### Carregar Todos os Templates Padrão

```bash
# Dar permissão de execução
chmod +x scripts/load-data.sh

# Carregar dados de exemplo
./scripts/load-data.sh --all
```

### Carregar Arquivo Específico

```bash
# Carregar tipos de afastamento (JSON)
./scripts/load-data.sh \
  --file data-templates/tipos-afastamento.json \
  --type tipos-afastamento

# Carregar colaboradores (CSV)
./scripts/load-data.sh \
  --file data-templates/colaboradores.csv \
  --type colaboradores
```

### Exportar Dados

```bash
chmod +x scripts/export-data.sh

./scripts/export-data.sh \
  --type colaboradores \
  --output backup/colaboradores-backup.json
```

Consulte a [documentação completa dos scripts](scripts/README.md) para mais opções.

## 🔌 Exemplos de Uso da API

### Criar Tipo de Afastamento

```bash
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  }'
```

### Listar Colaboradores

```bash
curl -X GET http://localhost:5173/api/colaboradores \
  -H 'Content-Type: application/json'
```

### Atualizar Colaborador

```bash
curl -X PUT http://localhost:5173/api/colaboradores/{id} \
  -H 'Content-Type: application/json' \
  -d '{
    "matricula": "5664",
    "nome": "João Silva",
    "setor": "TI",
    "dataAdmissao": "2020-01-15"
  }'
```

Veja a [documentação completa da API](DOCUMENTACAO_API.md) para todos os endpoints disponíveis.

## 📊 Templates de Dados Disponíveis

Arquivos CSV e JSON de exemplo estão disponíveis em `data-templates/`:

- `tipos-afastamento.csv` / `.json`
- `capacidades-negocio.csv` / `.json`
- `habilidades.csv` / `.json`
- `processos-negocio.csv`
- `tecnologias.csv`
- `slas.csv`
- `colaboradores.csv` / `.json`
- `aplicacoes.csv`

## 🗄️ Estrutura do Projeto

```
.
├── data-templates/           # Templates CSV/JSON para carga de dados
├── database/                 # Scripts SQL e configuração MySQL
│   ├── init-master.sql      # Inicialização do banco Master
│   ├── master.cnf           # Configuração Master
│   ├── slave.cnf            # Configuração Slave
│   └── setup-replication.sh # Setup de replicação
├── scripts/                  # Scripts shell de carga/exportação
│   ├── load-data.sh         # Script de carga de dados
│   ├── export-data.sh       # Script de exportação
│   └── README.md            # Documentação dos scripts
├── src/
│   ├── components/          # Componentes React
│   ├── hooks/               # Hooks customizados
│   ├── lib/                 # Utilitários e tipos
│   └── App.tsx              # Componente principal
├── CONFIGURACAO_BD.md       # Documentação do banco de dados
├── DOCUMENTACAO_API.md      # Documentação completa das APIs
├── MANUAL_INSTALACAO.md     # Manual de instalação
├── docker-compose.yml       # Configuração Docker
└── README.md                # Este arquivo
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Build
npm run build            # Build para produção
npm run preview          # Preview do build

# Linting
npm run lint             # Verificar código

# Docker
docker-compose up        # Iniciar todos os containers
docker-compose down      # Parar containers
docker-compose ps        # Ver status dos containers
docker-compose logs -f   # Ver logs em tempo real

# Carga de Dados
./scripts/load-data.sh --all                    # Carregar todos os templates
./scripts/load-data.sh --file FILE --type TYPE  # Carregar arquivo específico
./scripts/export-data.sh --type TYPE --output FILE  # Exportar dados
```

## 🌐 Portas Utilizadas

- **5173**: Aplicação web (desenvolvimento)
- **3306**: MySQL Master
- **3307**: MySQL Slave
- **4000**: Aplicação (produção/container)

## 🔐 Credenciais Padrão (Desenvolvimento)

### Banco de Dados Master
- **Host**: localhost:3306
- **Usuário**: root
- **Senha**: rootpassword
- **Database**: auditoria_db

### Banco de Dados Slave
- **Host**: localhost:3307
- **Usuário**: root
- **Senha**: rootpassword
- **Database**: auditoria_db

⚠️ **Atenção**: Altere as credenciais em produção!

## 🧪 Testando a Aplicação

### 1. Verificar Containers

```bash
docker-compose ps
```

### 2. Testar Conectividade com MySQL

```bash
# Master
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword

# Slave
mysql -h 127.0.0.1 -P 3307 -u root -prootpassword
```

### 3. Verificar Replicação

```bash
# No container slave
docker-compose exec mysql-slave mysql -u root -prootpassword -e "SHOW SLAVE STATUS\G"
```

### 4. Testar APIs

```bash
# Health check
curl http://localhost:5173/api/health

# Listar tipos de afastamento
curl http://localhost:5173/api/tipos-afastamento
```

## 📝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.

## 🆘 Suporte

- **Documentação**: Consulte os arquivos `.md` na raiz do projeto
- **Issues**: Abra uma issue no repositório
- **Logs**: Acesse a seção "Logs e Traces" no sistema para debugging

## 🎯 Roadmap

- [x] Gestão de Colaboradores e Afastamentos
- [x] Catálogo de Tecnologias
- [x] Processos de Negócio
- [x] Aplicações e Integrações
- [x] SLAs
- [x] Banco de Dados Replicado (MySQL)
- [x] APIs REST Completas
- [x] Scripts de Carga de Dados (CSV/JSON)
- [x] Sistema de Logging e Rastreamento
- [ ] Autenticação e Autorização
- [ ] Dashboard Analytics Avançado
- [ ] Exportação de Relatórios (PDF/Excel)
- [ ] Notificações em Tempo Real
- [ ] Integração com Azure DevOps
- [ ] Integração com SysAid
