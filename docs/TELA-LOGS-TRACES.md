# Logs and Traces - Sistema de Observabilidade

**Arquivo:** `src/components/LogsAndTracesView.tsx`  
**Rota:** `/logs-traces`  
**Categoria:** Observabilidade / Monitoramento

## 📋 Descrição

Sistema completo de observabilidade que centraliza logs, traces e métricas de toda a aplicação, permitindo análise, troubleshooting e auditoria de eventos.

## 🎯 Objetivo

- Centralizar todos os logs da aplicação
- Rastrear traces de execução
- Análise de eventos por tipo, usuário, componente
- Troubleshooting de problemas
- Auditoria de ações
- Visualização de métricas em tempo real

## 👥 Público-Alvo

- DevOps Engineers
- Desenvolvedores
- Suporte Técnico
- Auditores
- Gestores (métricas executivas)

## ✨ Funcionalidades Principais

### 1. **Visão Geral (Overview)**
- **Cards de Métricas:**
  - Total de eventos
  - Taxa de eventos/hora
  - Top componentes
  - Top usuários
  - Distribuição por tipo de evento

### 2. **Filtros Avançados**
- **Por Tipo de Evento:**
  - Click
  - Navigation
  - Load
  - Error
  - Input
  - API Call
  - API Response
  
- **Por Componente:**
  - Dropdown com todos os componentes
  - Filtro múltiplo
  
- **Por Usuário:**
  - Filtro por username
  
- **Por Período:**
  - Última hora
  - Últimas 24 horas
  - Últimos 7 dias
  - Últimos 30 dias
  - Personalizado (date range)

### 3. **Tabela de Logs**
- **Colunas:**
  - Timestamp
  - Tipo de evento
  - Componente
  - Usuário
  - Ação/Descrição
  - Trace ID
  - Detalhes (JSON)
  
- **Ações:**
  - 👁️ Ver detalhes
  - 🔗 Ver trace completo
  - 📋 Copiar log
  - 💾 Export

### 4. **Visualização de Trace**
- Timeline de eventos relacionados
- Trace ID unifica eventos
- Duração total
- Eventos em ordem cronológica
- Profundidade de chamadas

### 5. **Análise de Erros**
- Lista de erros recentes
- Stack traces
- Frequência de erro
- Componente/Usuário afetado
- Link para contexto

### 6. **Gráficos e Visualizações**
- **Timeline:** Eventos ao longo do tempo
- **Heatmap:** Eventos por hora do dia
- **Distribuição:** Por tipo de evento (pie chart)
- **Top 10:** Componentes mais ativos
- **Funil:** Jornada do usuário

### 7. **Export e Relatórios**
- Export CSV
- Export JSON
- Export para Elasticsearch
- Relatório de auditoria
- Relatório de performance

## 🔧 Modelo de Dados

```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  trace_id: string;
  component: string;
  event_type: 'click' | 'navigation' | 'load' | 'error' | 'input' | 'api_call' | 'api_response';
  event_name: string;
  username: string;
  session_id: string;
  metadata: Record<string, any>;
  error_message?: string;
  stack_trace?: string;
  duration_ms?: number;
  url?: string;
  user_agent?: string;
}

interface Trace {
  trace_id: string;
  start_time: string;
  end_time: string;
  duration_ms: number;
  events: LogEntry[];
  status: 'success' | 'error';
}
```

## 🔄 Integrações

### APIs Consumidas
- GET `/api/logs` - Buscar logs (com filtros)
- GET `/api/logs/:id` - Buscar log específico
- GET `/api/logs/trace/:traceId` - Buscar trace completo
- GET `/api/logs/stats` - Estatísticas e métricas
- GET `/api/logs/errors` - Listar erros recentes
- POST `/api/logs` - Criar log (usado internamente)
- DELETE `/api/logs/cleanup` - Limpar logs antigos

### Integração com useLogging Hook
```typescript
const { logClick, logEvent, logError } = useLogging('component-name');

// Registra evento
logClick('button_name', { param: 'value' });
logEvent('api_call', 'custom_event', { data: 'info' });
logError(error, 'operation_context');
```

## 🎨 Layout

```
┌──────────────────────────────────────────────┐
│ ☰ Logs and Traces                            │
│                                              │
│ [Visão Geral] [Logs] [Traces] [Erros]       │
│                                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│ │Total │ │/Hora │ │Compon│ │Usuár│        │
│ │15.2k │ │ 850  │ │  45  │ │  12 │        │
│ └──────┘ └──────┘ └──────┘ └──────┘        │
│                                              │
│ Filtros: [Tipo▼] [Comp▼] [Período▼] [🔍]   │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │Time│Tipo│Componente│Usuário│Ação│👁️  │  │
│ ├────────────────────────────────────────┤  │
│ │12:30│Click│App│john│save│ 👁️         │  │
│ │12:29│API│Backend│jane│fetch│ 👁️       │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ [📊 Gráficos]  [📥 Export]                  │
└──────────────────────────────────────────────┘
```

## 🚀 Fluxos Principais

### Troubleshooting de Erro
1. Acessar aba **"Erros"**
2. Ver lista de erros recentes
3. Clicar em erro específico
4. Ver stack trace e contexto
5. Clicar em **"Ver Trace"**
6. Analisar sequência de eventos
7. Identificar causa raiz

### Auditoria de Ações de Usuário
1. Filtrar por **usuário específico**
2. Selecionar **período**
3. Ver todas as ações
4. Export para relatório
5. Entregar para auditoria

### Análise de Performance
1. Acessar **Visão Geral**
2. Ver gráfico de eventos/hora
3. Identificar picos
4. Filtrar por período do pico
5. Analisar componentes mais ativos
6. Identificar gargalos

## 📱 Responsividade

- **Desktop:** Layout completo com gráficos
- **Tablet:** Tabela adaptada, gráficos simplificados
- **Mobile:** Cards empilhados, filtros em modal

## 🔐 Permissões

- **Visualização Básica:** Todos (somente seus logs)
- **Visualização Completa:** DevOps, Suporte
- **Export:** DevOps, Gestores
- **Cleanup:** Apenas Administradores

## 📈 Métricas e Logging

Auto-logging ativado:
- `logs_viewed` - Visualização da tela
- `filter_applied` - Filtro aplicado
- `trace_viewed` - Trace visualizado
- `export_performed` - Export executado

## 🔍 Filtros Disponíveis

| Filtro | Opções | Default |
|--------|--------|---------|
| **Tipo** | 7 tipos de evento | Todos |
| **Componente** | Lista dinâmica | Todos |
| **Usuário** | Texto livre | Vazio |
| **Período** | Últimas 24h / 7d / 30d / Custom | 24h |
| **Apenas Erros** | Sim/Não | Não |
| **Trace ID** | Texto livre | Vazio |

## ⚙️ Configurações

- **Retenção de Logs:** 90 dias (configurável)
- **Sampling:** 100% (produção: 10%)
- **Batch Size:** 1000 logs por request
- **Auto-refresh:** 30 segundos

## 📝 Observações

- Logs mais antigos que 90 dias são arquivados
- Erros críticos enviam alerta para Slack
- Trace ID gerado automaticamente (UUID)
- Session ID persiste durante navegação
- Suporta export até 10.000 registros por vez
- Integrado com Elasticsearch (opcional)

## 🐛 Problemas Conhecidos

- Filtro de usuário case-sensitive
- Export de muitos logs (>5000) pode demorar
- Gráficos não atualizam em real-time (precisa refresh)

## 🔄 Atualizações Recentes

- **29/12/2024:** Implementado em 25+ componentes
- **28/12/2024:** Adicionado suporte a trace ID
- **20/12/2024:** Melhorias no filtro por período
- **15/12/2024:** Export para JSON adicionado
