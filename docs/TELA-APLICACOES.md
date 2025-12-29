# Aplicações - Gestão de Aplicações

**Arquivo:** `src/components/aplicacoes/AplicacoesView.tsx`  
**Rota:** `/aplicacoes`  
**Categoria:** Core / Cadastro

## 📋 Descrição

Tela de gestão completa de aplicações do portfólio da organização. Permite cadastrar, editar, visualizar e gerenciar todas as aplicações de software, incluindo informações técnicas, estrutura de projeto, equipe, comunicações e documentação.

## 🎯 Objetivo

Centralizar o gerenciamento de aplicações com todas as informações relacionadas:
- Dados básicos (nome, sigla, descrição)
- Equipe responsável (Product Owner, Tech Lead, Squad)
- Stack tecnológico e dependências
- Estrutura de projeto no Azure DevOps
- Comunicações entre aplicações
- Documentação e ADRs

## 👥 Público-Alvo

- Arquitetos de Software
- Tech Leads
- Product Owners
- Gerentes de TI
- Auditores

## ✨ Funcionalidades

### 1. **Listagem de Aplicações**
- Tabela com todas as aplicações cadastradas
- Colunas: Sigla, Nome, Descrição, Product Owner, Tech Lead, Squad
- Ordenação e busca
- Paginação automática

### 2. **Wizard de Cadastro/Edição** (7 Steps)

#### **Step 1: Informações Básicas**
- Sigla da aplicação (identificador único)
- Nome completo
- Descrição detalhada
- Status (Ativo/Inativo)
- Criticidade (Baixa/Média/Alta/Crítica)

#### **Step 2: Equipe**
- Product Owner (seleção de colaborador)
- Tech Lead (seleção de colaborador)
- Squad (seleção de colaborador)
- Arquiteto (opcional)
- Gerente (opcional)

#### **Step 3: Stack Tecnológico**
- Tecnologias utilizadas (multi-seleção)
- Linguagens de programação
- Frameworks
- Bibliotecas
- Ferramentas

#### **Step 4: Comunicações**
- Aplicações com as quais se comunica
- Tipo de comunicação (API REST, Mensageria, etc.)
- Direção (Entrada/Saída/Bidirecional)
- Endpoints e protocolos

#### **Step 5: Projetos e Estruturas**
- Visualização de projetos no Azure DevOps
- Estruturas de projeto geradas
- Repositórios associados
- Pipelines de CI/CD

#### **Step 6: ADRs**
- Architecture Decision Records
- Decisões arquiteturais documentadas
- Histórico de mudanças

#### **Step 7: Resumo**
- Revisão de todas as informações
- Validação antes de salvar
- Indicadores de completude

### 3. **Ações da Tabela**
- ✏️ **Editar:** Abrir wizard com dados preenchidos
- 🗑️ **Deletar:** Excluir aplicação (com confirmação)
- 👁️ **Visualizar:** Ver detalhes em modal
- 📊 **Análise:** Ver métricas e dashboards

## 🔧 Componentes Utilizados

- `Card`, `CardContent`, `CardHeader` - Container principal
- `Button` - Ações (Novo, Editar, Deletar)
- `Dialog` - Modais de confirmação
- `Wizard` - Navegação entre steps
- `Select`, `Input`, `Textarea` - Formulários
- `DataTable` - Listagem
- `Badge` - Status e tags
- `Tabs` - Navegação entre seções

## 📊 Modelo de Dados

```typescript
interface Aplicacao {
  id: string;
  sigla: string;
  nome: string;
  descricao: string;
  status: 'Ativo' | 'Inativo';
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  productOwner: string;
  techLead: string;
  squad: string;
  arquiteto?: string;
  gerente?: string;
  tecnologias: string[];
  comunicacoes: Comunicacao[];
  projetos: ProjetoGerado[];
  adrs: ADR[];
  dataCriacao: string;
  dataAtualizacao: string;
}
```

## 🔄 Integrações

### APIs Consumidas
- GET `/api/aplicacoes` - Listar todas aplicações
- GET `/api/aplicacoes/:id` - Buscar aplicação específica
- POST `/api/aplicacoes` - Criar nova aplicação
- PUT `/api/aplicacoes/:id` - Atualizar aplicação
- DELETE `/api/aplicacoes/:id` - Excluir aplicação
- GET `/api/colaboradores` - Listar colaboradores (para seleção)
- GET `/api/tecnologias` - Listar tecnologias (para seleção)
- GET `/api/comunicacoes` - Listar comunicações da aplicação
- GET `/api/estruturas-projeto` - Listar projetos da aplicação
- GET `/api/adrs` - Listar ADRs da aplicação

## 🎨 Layout

### Modo Listagem
```
┌──────────────────────────────────────────────┐
│ ☰ Aplicações                    [+ Nova]     │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Sigla │ Nome │ Descrição │ PO │ Actions│  │
│ ├────────────────────────────────────────┤  │
│ │ SISAUD│ Sistema...│ Desc...│ João│ ⚙️  │  │
│ │ PORTAL│ Portal...│ Desc...│ Maria│ ⚙️  │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Modo Wizard
```
┌──────────────────────────────────────────────┐
│ Nova Aplicação                    [X Fechar] │
│                                              │
│ [1] [2] [3] [4] [5] [6] [7]  ← Steps         │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ [Conteúdo do Step Atual]                 ││
│ │                                          ││
│ │ Campos de formulário...                  ││
│ └──────────────────────────────────────────┘│
│                                              │
│          [Voltar]  [Próximo]  [Salvar]       │
└──────────────────────────────────────────────┘
```

## 🚀 Fluxo de Uso

### Criar Nova Aplicação
1. Clicar em botão **"+ Nova Aplicação"**
2. Wizard abre no Step 1
3. Preencher informações básicas → **Próximo**
4. Selecionar equipe → **Próximo**
5. Escolher tecnologias → **Próximo**
6. Configurar comunicações → **Próximo**
7. Revisar projetos → **Próximo**
8. Adicionar ADRs (opcional) → **Próximo**
9. Revisar resumo → **Salvar**

### Editar Aplicação
1. Na tabela, clicar em **✏️ Editar**
2. Wizard abre com dados preenchidos
3. Navegar pelos steps e modificar
4. Clicar em **Salvar** em qualquer step

### Deletar Aplicação
1. Na tabela, clicar em **🗑️ Deletar**
2. Confirmar exclusão no dialog
3. Aplicação removida com sucesso

## 📱 Responsividade

- **Desktop:** Wizard em modal grande, tabela completa
- **Tablet:** Wizard em tela cheia, colunas adaptadas
- **Mobile:** Wizard responsivo, tabela em cards

## 🔐 Permissões

- **Visualização:** Todos os usuários
- **Criação:** Tech Leads, Arquitetos, Gestores
- **Edição:** Tech Leads, Arquitetos, Gestores
- **Exclusão:** Apenas Gestores e Arquitetos

## 📈 Métricas e Logging

Eventos registrados:
- `aplicacao_created` - Criação de aplicação
- `aplicacao_updated` - Atualização de aplicação
- `aplicacao_deleted` - Exclusão de aplicação
- `wizard_step_changed` - Mudança de step no wizard
- `filter_applied` - Filtro aplicado na tabela
- `search_performed` - Busca realizada

## 🔍 Filtros e Buscas

- **Busca:** Por sigla, nome ou descrição
- **Filtro por Status:** Ativo/Inativo
- **Filtro por Criticidade:** Baixa, Média, Alta, Crítica
- **Filtro por Tech Lead:** Seleção de colaborador
- **Filtro por Tecnologia:** Seleção múltipla

## ⚙️ Validações

- Sigla: Obrigatória, única, apenas letras maiúsculas
- Nome: Obrigatório, mínimo 3 caracteres
- Descrição: Obrigatória, mínimo 10 caracteres
- Product Owner: Obrigatório (seleção)
- Tech Lead: Obrigatório (seleção)
- Squad: Obrigatório (seleção)

## 📝 Observações

- Aplicações com projetos associados exigem confirmação adicional para exclusão
- ADRs são versionados e mantém histórico
- Comunicações são bidirecionais (ao criar, atualiza ambas aplicações)
- Wizard salva progresso em localStorage
- Suporta importação em massa via CSV

## 🐛 Problemas Conhecidos

- Wizard pode apresentar lag em aplicações com muitas tecnologias (>100)
- Busca não suporta caracteres especiais

## 🔄 Atualizações Recentes

- **29/12/2024:** Adicionado logging completo em todos os steps
- **15/12/2024:** Wizard refatorado para 7 steps
- **10/12/2024:** Adicionado suporte a ADRs
