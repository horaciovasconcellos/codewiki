# Gerador de Projetos - Azure DevOps Project Generator

**Arquivo:** `src/components/gerador-projetos/GeradorProjetosView.tsx`  
**Rota:** `/gerador-projetos`  
**Categoria:** DevOps / Automação

## 📋 Descrição

Ferramenta automatizada para criar e gerenciar projetos no Azure DevOps com estrutura completa incluindo times, sprints, queries compartilhadas e repositórios Git com templates pré-configurados.

## 🎯 Objetivo

Padronizar e automatizar a criação de projetos Azure DevOps:
- Criar projetos com configurações padronizadas
- Gerar estrutura de times e sprints
- Criar repositórios Git com estrutura inicial
- Aplicar templates de arquivos (Maven, Liquibase, etc.)
- Configurar branch policies e pull request policies

## 👥 Público-Alvo

- DevOps Engineers
- Tech Leads
- Arquitetos de Software
- Gestores de Projeto

## ✨ Funcionalidades Principais

### 1. **Cadastro de Projeto**
- Seleção de aplicação base
- Nome do projeto
- Work Item Process (Scrum/Agile/CMMI)
- Nome do time
- Configurações de sprint (data inicial, semanas, iteração)
- Opções: Shared Queries, Maven, Liquibase
- Time de sustentação (opcional)
- Iteração mensal

### 2. **Repositórios**
- Adicionar múltiplos repositórios
- Nomenclatura: `produto-categoria-tecnologia`
- Grupos: Frontend, Backend, Mobile, Data, Infra
- Tipos: API, Web, Mobile, ETL, IaC, etc.
- Linguagens: Java, TypeScript, Python, etc.

### 3. **Geração no Azure DevOps**
- Botão "Gerar Projeto" cria estrutura no Azure
- URL do projeto gerado é armazenada
- Status muda de "Pendente" para "Processado"

### 4. **Criação de Repositórios**
- Botão "Criar Repositórios" disponível após gerar projeto
- Cria todos os repos configurados
- Aplica templates (README, .gitignore, estrutura de pastas)
- Configura branch policies
- Marca `status_repositorio = 'Y'` após criação

### 5. **Ações da Tabela**
- 👁️ **Visualizar:** Ver detalhes completos do projeto
- ✏️ **Editar:** Modificar projeto (apenas se Pendente)
- 🗑️ **Deletar:** Excluir projeto
- ☁️ **Integrar Azure:** Gerar projeto no Azure DevOps
- 🌿 **Criar Repositórios:** Criar repos Git (apenas se Processado)

## 🔧 Modelo de Dados

```typescript
interface ProjetoGerado {
  id: string;
  produto: string;
  workItemProcess: 'Scrum' | 'Agile' | 'CMMI' | 'Basic';
  projeto: string;
  nomeTime: string;
  dataInicial: string;
  numeroSemanas: number;
  iteracao: number;
  incluirQuery: boolean;
  incluirMaven: boolean;
  incluirLiquibase: boolean;
  criarTimeSustentacao: boolean;
  iteracaoMensal: boolean;
  repositorios: RepositorioProjeto[];
  patToken?: string;
  dataCriacao: string;
  estruturasGeradas: string[];
  status: 'Pendente' | 'Processado';
  statusRepositorio: 'N' | 'Y';
  urlProjeto?: string;
  aplicacaoBaseId?: string;
}
```

## 🔄 Integrações

### APIs Consumidas
- GET `/api/estruturas-projeto` - Listar projetos
- POST `/api/estruturas-projeto` - Criar projeto
- PUT `/api/estruturas-projeto/:id` - Atualizar projeto
- DELETE `/api/estruturas-projeto/:id` - Excluir projeto
- POST `/api/azure-devops/criar-repositorios` - Criar repos
- GET `/api/aplicacoes` - Listar aplicações base

### Azure DevOps APIs
- Criar projeto
- Criar times
- Criar sprints
- Criar shared queries
- Criar repositórios
- Aplicar branch policies
- Aplicar repository policies

## 🎨 Layout

```
┌──────────────────────────────────────────────┐
│ ☰ Gerador de Projetos         [+ Novo]      │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ App│Projeto│Processo│Repos│Status│Ações│  │
│ ├────────────────────────────────────────┤  │
│ │SISAUD│Vendas│Scrum│ 3 │✓Proc│ 👁️✏️🌿  │  │
│ │PORTAL│Admin │Agile│ 2 │Pend│ 👁️✏️☁️  │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## 🚀 Fluxo Completo

### 1. Criar Configuração
1. Clicar em **"+ Novo Projeto"**
2. Selecionar aplicação base
3. Preencher dados do projeto
4. Adicionar repositórios
5. Salvar como Pendente

### 2. Gerar no Azure
1. Na tabela, clicar em ☁️ **"Integrar Azure"**
2. Confirmar criação
3. Sistema cria projeto no Azure DevOps
4. Status muda para "Processado"
5. URL do projeto é registrada

### 3. Criar Repositórios
1. Com projeto Processado, clicar em 🌿 **"Criar Repositórios"**
2. Confirmar criação
3. Sistema cria repos com estrutura
4. Botão fica desabilitado (cinza)
5. `statusRepositorio` = 'Y'

## 📱 Responsividade

- **Desktop:** Tabela completa com todas as colunas
- **Tablet:** Colunas essenciais visíveis
- **Mobile:** Cards empilhados

## 🔐 Permissões

- **Visualização:** Todos os usuários
- **Criação:** Tech Leads, DevOps, Gestores
- **Geração Azure:** Requer PAT token configurado
- **Criação Repos:** Requer integração Azure ativa

## 📈 Métricas e Logging

Eventos registrados:
- `projeto_created` - Projeto cadastrado
- `projeto_generated` - Projeto gerado no Azure
- `repository_created` - Repositórios criados
- `botao_criar_repositorios` - Clique no botão
- `wizard_step_changed` - Navegação no formulário

## 🔍 Filtros e Buscas

- **Busca:** Por nome do projeto ou aplicação
- **Filtro por Status:** Pendente/Processado
- **Filtro por Repos:** Com/Sem repositórios criados

## ⚙️ Validações

- Aplicação base: Obrigatória
- Nome do projeto: Obrigatório, único no Azure
- Data inicial: Deve ser segunda-feira
- Número de semanas: Entre 1 e 52
- Iteração: Mínimo 1
- Repositórios: Mínimo 1 repositório

## 📝 Observações

- Projetos Processados não podem ser editados
- Exclusão de projetos Processados requer confirmação adicional
- Criação de repositórios é idempotente (não duplica)
- Status `statusRepositorio` persiste no banco de dados
- Templates de arquivos vêm de `azure_devops_templates`
- Suporta time de sustentação com iteração separada

## 🐛 Problemas Conhecidos

- Criação de muitos repositórios (>10) pode demorar
- Branch policies só aplicadas após primeiro commit

## 🔄 Atualizações Recentes

- **29/12/2024:** Implementado `statusRepositorio` persistido no banco
- **29/12/2024:** Botão de criar repos desabilita após uso
- **15/12/2024:** Adicionado suporte a templates customizados
