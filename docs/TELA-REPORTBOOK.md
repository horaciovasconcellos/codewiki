# ReportBook - Sistema de Relatórios ADR

**Arquivo:** `src/components/reportbook/ReportBookView.tsx`  
**Rota:** `/reportbook`  
**Categoria:** Documentação / ADR

## 📋 Descrição

Sistema completo para criar, gerenciar e analisar relatórios ADR (Architecture Decision Records) com importação CSV, wizard de criação e análise de similaridade entre relatórios.

## 🎯 Objetivo

Facilitar a documentação de decisões arquiteturais:
- Criar relatórios estruturados com múltiplas colunas
- Importar dados via CSV
- Análise de similaridade entre relatórios
- Wizard guiado para criação
- Versionamento e histórico

## 👥 Público-Alvo

- Arquitetos de Software
- Tech Leads
- Product Owners
- Auditores

## ✨ Funcionalidades Principais

### 1. **Listagem de Relatórios**
- Tabela com todos os relatórios cadastrados
- Colunas: Nome, Descrição, Colunas, Data de Criação
- Ações: Editar, Deletar, Visualizar

### 2. **Wizard de Criação (3 Steps)**

#### **Step 1: Informações Básicas**
- Nome do relatório
- Descrição detalhada
- Tags e categorias

#### **Step 2: Definição de Colunas**
- Adicionar/remover colunas dinamicamente
- Nome da coluna
- Tipo de dado (texto, número, data, etc.)
- Obrigatoriedade
- Valores padrão

#### **Step 3: Importação de Dados (Opcional)**
- Upload de arquivo CSV
- Mapeamento automático de colunas
- Preview dos dados
- Validação antes de importar

### 3. **Analisador de Similaridade**
- Comparar relatórios existentes
- Algoritmos: Jaccard, Cosine Similarity
- Percentual de similaridade
- Sugestões de unificação
- Upload de CSV para comparação

### 4. **Edição de Relatórios**
- Modificar estrutura de colunas
- Adicionar/remover dados
- Manter histórico de versões

## 🔧 Modelo de Dados

```typescript
interface Report {
  id: string;
  name: string;
  description: string;
  columns: ReportColumn[];
  data: Record<string, any>[];
  dataCriacao: string;
  dataAtualizacao: string;
  versao: number;
}

interface ReportColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // para tipo 'select'
}
```

## 🔄 Integrações

### APIs Consumidas
- GET `/api/reportbook` - Listar relatórios
- GET `/api/reportbook/:id` - Buscar relatório específico
- POST `/api/reportbook` - Criar relatório
- PUT `/api/reportbook/:id` - Atualizar relatório
- DELETE `/api/reportbook/:id` - Excluir relatório
- POST `/api/reportbook/import-csv` - Importar CSV
- POST `/api/reportbook/analyze-similarity` - Analisar similaridade

## 🎨 Layout

### Modo Listagem
```
┌──────────────────────────────────────────────┐
│ ☰ ReportBook                   [+ Novo]      │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ Nome │ Descrição │ Colunas │ Ações    │  │
│ ├────────────────────────────────────────┤  │
│ │ ADR-001│ Decisão X│ 8 cols │ ✏️ 🗑️    │  │
│ │ ADR-002│ Decisão Y│ 6 cols │ ✏️ 🗑️    │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Modo Wizard
```
┌──────────────────────────────────────────────┐
│ Novo Relatório                  [X Fechar]   │
│                                              │
│ [1 Básico] → [2 Colunas] → [3 Dados]        │
│                                              │
│ ┌──────────────────────────────────────────┐│
│ │ Step 2: Definição de Colunas             ││
│ │                                          ││
│ │ [+ Adicionar Coluna]                     ││
│ │                                          ││
│ │ ┌──────────────────────────────────┐    ││
│ │ │ Nome: Decision Date              │    ││
│ │ │ Tipo: [Date ▼]  ☑ Obrigatório   │    ││
│ │ │ [🗑️ Remover]                     │    ││
│ │ └──────────────────────────────────┘    ││
│ └──────────────────────────────────────────┘│
│                                              │
│          [← Voltar]  [Próximo →]  [Salvar]  │
└──────────────────────────────────────────────┘
```

## 🚀 Fluxo de Uso

### Criar Relatório Vazio
1. Clicar em **"+ Novo Relatório"**
2. Preencher nome e descrição
3. Adicionar colunas necessárias
4. Pular importação (Step 3)
5. Salvar

### Criar Relatório com CSV
1. Clicar em **"+ Novo Relatório"**
2. Preencher informações básicas
3. Definir colunas ou deixar automático
4. Upload CSV no Step 3
5. Mapear colunas
6. Preview e salvar

### Analisar Similaridade
1. Acessar aba "Análise de Similaridade"
2. Selecionar 2 relatórios ou upload CSV
3. Escolher algoritmo (Jaccard/Cosine)
4. Ver resultado com percentual
5. Exportar análise

## 📱 Responsividade

- **Desktop:** Wizard em modal, tabela completa
- **Tablet:** Wizard em tela cheia
- **Mobile:** Steps empilhados verticalmente

## 🔐 Permissões

- **Visualização:** Todos
- **Criação:** Arquitetos, Tech Leads
- **Edição:** Criador + Arquitetos
- **Exclusão:** Apenas Arquitetos

## 📈 Métricas e Logging

Eventos registrados:
- `report_created` - Criação de relatório
- `report_updated` - Atualização
- `csv_imported` - Importação CSV
- `similarity_analyzed` - Análise executada
- `column_added` - Coluna adicionada
- `column_removed` - Coluna removida

## 🔍 Filtros e Buscas

- **Busca:** Por nome ou descrição
- **Filtro por Colunas:** Número de colunas
- **Filtro por Data:** Período de criação
- **Ordenação:** Nome, Data, Número de colunas

## ⚙️ Validações

- Nome: Obrigatório, único
- Descrição: Obrigatória
- Colunas: Mínimo 1 coluna
- Nome de coluna: Único dentro do relatório
- CSV: Formato válido, encoding UTF-8

## 📝 Observações

- Suporta até 50 colunas por relatório
- CSV limitado a 10MB
- Algoritmo Jaccard para dados categóricos
- Algoritmo Cosine para dados textuais
- Versionamento automático a cada edição
- Export para CSV, JSON, Excel

## 🐛 Problemas Conhecidos

- Importação de CSV muito grandes (>5000 linhas) pode demorar
- Análise de similaridade limitada a 2 relatórios por vez

## 🔄 Atualizações Recentes

- **29/12/2024:** Logging completo implementado
- **20/12/2024:** Adicionado suporte a Excel export
- **15/12/2024:** Melhorias no wizard de importação
