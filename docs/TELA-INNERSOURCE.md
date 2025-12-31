# Projetos InnerSource

Gerenciamento de projetos InnerSource da organização, permitindo catalogar, documentar e promover iniciativas de código aberto interno.

## 📋 Visão Geral

A tela de **Projetos InnerSource** permite registrar e gerenciar projetos que seguem a metodologia InnerSource, facilitando:
- 🔍 Descoberta de projetos internos reutilizáveis
- 📊 Acompanhamento de métricas de engajamento
- 📚 Documentação centralizada
- 🤝 Promoção da colaboração entre equipes

## 🎯 Funcionalidades

### 1. Cadastro de Projetos
- Formulário completo para registro de projetos InnerSource
- Busca automática de dados via API do GitHub
- Upload de imagens (logo do projeto e avatar do proprietário)
- Campos estruturados conforme padrão InnerSource

### 2. Informações Capturadas

#### Dados Básicos
| Campo | Descrição |
|-------|-----------|
| `id` | Identificador único do projeto |
| `nome` | Nome curto do repositório |
| `full_nome` | Nome completo com organização |
| `html_url` | URL pública do repositório |
| `descricao` | Descrição curta do projeto |
| `language` | Linguagem de programação principal |
| `license` | Licença do projeto |

#### Estatísticas
| Campo | Descrição |
|-------|-----------|
| `stargazers_count` | Quantidade de estrelas |
| `watchers_count` | Número de observadores |
| `forks_count` | Quantidade de forks |
| `open_issues_count` | Issues abertas |

#### Proprietário (Owner)
```json
{
  "login": "organizacao",
  "avatar_url": "https://...",
  "html_url": "https://github.com/organizacao",
  "type": "Organization"
}
```

#### Metadados InnerSource (_InnerSourceMetadata)
| Campo | Finalidade |
|-------|-----------|
| `logo` | Identidade visual do projeto (base64) |
| `topics` | Array de tópicos para classificação |
| `participation` | Métricas de engajamento (contribuidores, commits, PRs) |
| `description_extended` | Descrição detalhada do projeto |
| `documentation` | Link para documentação externa |
| `contribution_guidelines` | URL do guia de contribuição |
| `maturity` | Nível de maturidade InnerSource |
| `contact` | Canal de comunicação da equipe |
| `last_sync` | Data da última sincronização |

### 3. Níveis de Maturidade

Os projetos são classificados em quatro níveis:

- 🔵 **Emerging** - Projeto inicial, experimental
- 🟢 **Growing** - Projeto em crescimento, com adoção crescente
- 🟣 **Mature** - Projeto maduro, amplamente utilizado
- 🟡 **Graduated** - Projeto graduado, referência na organização

### 4. Buscar Dados do GitHub

Botão "Buscar Dados" que automaticamente:
1. Extrai informações da API do GitHub
2. Preenche campos básicos (nome, descrição, linguagem)
3. Carrega estatísticas (stars, forks, issues)
4. Importa dados do proprietário
5. Captura tópicos do repositório

### 5. Visualização em Tabela

Tabela rica com:
- Logo do projeto
- Nome e descrição
- Linguagem principal
- Badge de maturidade
- Estatísticas visuais (stars, forks, issues)
- Informações do proprietário
- Ações (editar/excluir)

## 🗄️ Estrutura de Dados

### Tabela: `innersource_projects`

```sql
CREATE TABLE innersource_projects (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  full_nome VARCHAR(500) NOT NULL,
  html_url TEXT NOT NULL,
  descricao TEXT,
  stargazers_count INT DEFAULT 0,
  watchers_count INT DEFAULT 0,
  language VARCHAR(100),
  forks_count INT DEFAULT 0,
  open_issues_count INT DEFAULT 0,
  license VARCHAR(100),
  owner JSON NOT NULL,
  metadata JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### GET /api/innersource-projects
Lista todos os projetos InnerSource

**Response:**
```json
[
  {
    "id": "uuid",
    "nome": "frontend-library",
    "full_nome": "org/frontend-library",
    "html_url": "https://github.com/org/frontend-library",
    "descricao": "Biblioteca de componentes React",
    "stargazers_count": 45,
    "watchers_count": 12,
    "language": "TypeScript",
    "forks_count": 8,
    "open_issues_count": 3,
    "license": "MIT",
    "owner": { ... },
    "_InnerSourceMetadata": { ... }
  }
]
```

### GET /api/innersource-projects/:id
Busca um projeto específico por ID

### POST /api/innersource-projects
Cria um novo projeto InnerSource

**Request Body:**
```json
{
  "nome": "nome-repo",
  "full_nome": "org/nome-repo",
  "html_url": "https://github.com/org/nome-repo",
  "descricao": "Descrição",
  "language": "JavaScript",
  "owner": {
    "login": "org",
    "avatar_url": "...",
    "html_url": "...",
    "type": "Organization"
  },
  "_InnerSourceMetadata": {
    "maturity": "growing",
    "topics": ["javascript", "library"],
    "participation": {
      "contributors_count": 10,
      "commits_last_year": 150,
      "pull_requests_count": 40
    }
  }
}
```

### PUT /api/innersource-projects/:id
Atualiza um projeto existente

### DELETE /api/innersource-projects/:id
Remove um projeto

## 📁 Componentes

### `/src/components/innersource/`

- **InnerSourceView.tsx** - Componente principal (listagem e navegação)
- **InnerSourceForm.tsx** - Formulário de cadastro/edição
- **InnerSourceDataTable.tsx** - Tabela de exibição dos projetos

## 🎨 Upload de Imagens

Suporte para upload de duas imagens:

1. **Logo do Projeto** - Identidade visual do projeto
2. **Avatar do Proprietário** - Foto da organização/usuário

As imagens são convertidas para base64 e armazenadas diretamente no banco de dados.

## 🔍 Integração com GitHub

A funcionalidade "Buscar Dados" integra com a GitHub API:

```javascript
const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
const response = await fetch(apiUrl);
const data = await response.json();
```

Campos preenchidos automaticamente:
- Nome e nome completo
- Descrição
- Estatísticas (stars, watchers, forks, issues)
- Linguagem principal
- Licença
- Dados do proprietário
- Tópicos (topics)

## 📊 Exemplo de Uso

1. **Cadastrar Novo Projeto**
   - Clicar em "Novo Projeto"
   - Informar URL do GitHub
   - Clicar em "Buscar Dados"
   - Ajustar informações conforme necessário
   - Adicionar tópicos e metadados InnerSource
   - Salvar

2. **Editar Projeto Existente**
   - Na tabela, clicar no botão "Editar"
   - Modificar campos desejados
   - Atualizar imagens se necessário
   - Salvar alterações

3. **Visualizar Projetos**
   - Lista ordenada por nome
   - Filtros por linguagem/maturidade (futuro)
   - Links diretos para GitHub
   - Estatísticas visíveis

## 🚀 Melhorias Futuras

- [ ] Filtros avançados (linguagem, maturidade, tópicos)
- [ ] Busca full-text
- [ ] Sincronização automática com GitHub
- [ ] Gráficos de evolução de métricas
- [ ] Exportação para JSON/CSV
- [ ] Integração com sistema de notificações
- [ ] Portal público de projetos InnerSource
- [ ] Badges e rankings
- [ ] Sistema de recomendação de projetos

## 📝 Referências

- [InnerSource Commons](https://innersourcecommons.org/)
- [InnerSource Patterns](https://patterns.innersourcecommons.org/)
- [GitHub API Documentation](https://docs.github.com/en/rest)

## 🔗 Navegação

Acesso pelo menu: **Azure DevOps** → **Projetos InnerSource**
