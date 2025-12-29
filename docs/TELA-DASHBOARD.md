# Dashboard - Visão Geral

**Arquivo:** `src/components/DashboardView.tsx`  
**Rota:** `/` (página inicial)  
**Categoria:** Core

## 📋 Descrição

Tela principal da aplicação que apresenta uma visão consolidada e executiva de todas as métricas e informações importantes do sistema de auditoria. Serve como ponto de entrada para os usuários.

## 🎯 Objetivo

Fornecer uma visão panorâmica do estado atual do sistema, incluindo:
- Quantidade de aplicações cadastradas
- Total de colaboradores
- Métricas de capacidades de negócio
- Indicadores de pipelines e tecnologias
- Acesso rápido às principais funcionalidades

## 👥 Público-Alvo

- Gestores
- Tech Leads
- Arquitetos
- Auditores
- Todos os usuários do sistema (visão geral)

## ✨ Funcionalidades

### 1. **Cards de Métricas**
- **Aplicações:** Total de aplicações cadastradas no sistema
- **Colaboradores:** Quantidade de colaboradores ativos
- **Capacidades de Negócio:** Total de capacidades mapeadas
- **Pipelines:** Quantidade de pipelines configuradas
- **Tecnologias:** Total de tecnologias catalogadas
- **Servidores:** Número de servidores gerenciados

### 2. **Navegação Rápida**
- Links diretos para cada módulo através dos cards
- Indicadores visuais de status (cores, badges)

### 3. **Visualizações**
- Gráficos de distribuição
- Indicadores de performance
- Alertas e notificações importantes

## 🔧 Componentes Utilizados

- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Estrutura de cards
- `Badge` - Indicadores visuais
- `Button` - Ações rápidas
- `Separator` - Divisores de seção
- `SidebarTrigger` - Menu lateral

## 📊 Dados Exibidos

```typescript
interface DashboardData {
  totalAplicacoes: number;
  totalColaboradores: number;
  totalCapacidades: number;
  totalPipelines: number;
  totalTecnologias: number;
  totalServidores: number;
}
```

## 🔄 Integrações

- **APIs Consumidas:**
  - GET `/api/aplicacoes` - Lista aplicações
  - GET `/api/colaboradores` - Lista colaboradores
  - GET `/api/capacidades-negocio` - Lista capacidades
  - GET `/api/pipelines` - Lista pipelines
  - GET `/api/tecnologias` - Lista tecnologias
  - GET `/api/servidores` - Lista servidores

## 🎨 Layout

```
┌─────────────────────────────────────────┐
│ ☰ Dashboard                             │
│                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │ Apps │ │ Colab│ │ Cap. │             │
│ │  45  │ │  120 │ │  30  │             │
│ └──────┘ └──────┘ └──────┘             │
│                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │Pipeline│ Tech │ │Server│             │
│ │  25   │ │ 150 │ │  10  │             │
│ └──────┘ └──────┘ └──────┘             │
│                                         │
│ [Gráficos e Visualizações]              │
└─────────────────────────────────────────┘
```

## 🚀 Ações Principais

| Ação | Descrição | Destino |
|------|-----------|---------|
| **Ver Aplicações** | Clique no card Aplicações | `/aplicacoes` |
| **Ver Colaboradores** | Clique no card Colaboradores | `/colaboradores` |
| **Ver Capacidades** | Clique no card Capacidades | `/capacidades` |
| **Ver Pipelines** | Clique no card Pipelines | `/pipelines` |
| **Ver Tecnologias** | Clique no card Tecnologias | `/tecnologias` |
| **Ver Servidores** | Clique no card Servidores | `/servidores` |

## 📱 Responsividade

- **Desktop:** Grid de 3 colunas
- **Tablet:** Grid de 2 colunas
- **Mobile:** Grid de 1 coluna (empilhado)

## 🔐 Permissões

- **Visualização:** Todos os usuários autenticados
- **Edição:** N/A (tela somente leitura)

## 📈 Métricas e Logging

Eventos registrados:
- `dashboard_loaded` - Carregamento da tela
- `card_clicked` - Clique em card de métrica
- `navigation` - Navegação para outras telas

## 🔍 Filtros e Buscas

Não aplicável (tela de visão geral).

## ⚙️ Configurações

Nenhuma configuração específica necessária.

## 📝 Observações

- Dados são atualizados automaticamente ao carregar a página
- Cache de 5 minutos para métricas de performance
- Suporta dark mode
- Acessível via teclado (Tab navigation)

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 🔄 Atualizações Recentes

- **29/12/2024:** Documentação inicial criada
