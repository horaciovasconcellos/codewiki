# 🚀 Guia Rápido: Observabilidade com Prometheus + Grafana

## ✅ O que foi implementado

### 1. **Docker Compose**
- ✅ Prometheus (porta 9090)
- ✅ Grafana (porta 3001)
- ✅ Volumes persistentes configurados
- ✅ Health checks implementados

### 2. **Backend (Node.js)**
- ✅ prom-client instalado
- ✅ Métricas customizadas criadas
- ✅ Endpoint `/metrics` implementado
- ✅ Endpoint `/health` implementado  
- ✅ Middleware de coleta automática

### 3. **Configurações**
- ✅ prometheus.yml com scrape configs
- ✅ alerts.yml com 8 regras de alerta
- ✅ Datasource do Grafana provisionado
- ✅ Dashboard "Auditoria App - Overview" criado

### 4. **Documentação**
- ✅ Guia completo em `docs/observabilidade/prometheus-grafana-setup.md`

---

## 🎯 Comandos Principais

### Iniciar Monitoramento
```bash
# Subir Prometheus + Grafana
docker-compose up -d prometheus grafana

# Rebuild da aplicação (com novas dependências)
docker-compose build --no-cache app
docker-compose up -d app
```

### Acessar Interfaces
```bash
# Grafana
open http://localhost:3001
# Login: admin / admin123

# Prometheus  
open http://localhost:9090

# Métricas da API
curl http://localhost:3000/metrics

# Health Check
curl http://localhost:3000/health | jq
```

### Verificar Status
```bash
# Status dos containers
docker-compose ps prometheus grafana app

# Logs
docker logs auditoria-prometheus --tail 50
docker logs auditoria-grafana --tail 50
docker logs auditoria-app --tail 50

# Teste de conectividade
docker exec auditoria-grafana ping prometheus
```

---

## 📊 Métricas Disponíveis

| Categoria | Métrica | Descrição |
|-----------|---------|-----------|
| **HTTP** | `http_requests_total` | Total de requisições |
| **HTTP** | `http_request_duration_seconds` | Latência (P50, P95) |
| **Node.js** | `nodejs_heap_size_used_bytes` | Memória heap |
| **Node.js** | `nodejs_eventloop_lag_seconds` | Event loop lag |
| **Cache** | `cache_hits_total` | Acertos de cache |
| **Cache** | `cache_misses_total` | Falhas de cache |
| **Database** | `db_pool_connections_active` | Conexões ativas |
| **Azure** | `azure_api_calls_total` | Chamadas API Azure |

---

## 🔔 Alertas Configurados

### Críticos
- **AuditoriaAppDown**: App indisponível por 1min
- **DatabaseConnectionFailed**: BD inacessível por 2min

### Warnings
- **HighErrorRate**: Erros 5xx > 5% por 5min
- **HighLatency**: P95 > 2s por 10min  
- **HighMemoryUsage**: Heap > 90% por 5min
- **TooManyDatabaseConnections**: Pool > 80 por 10min

---

## 🎨 Dashboard Grafana

**"Auditoria App - Overview"** inclui:

1. Application Status (UP/DOWN)
2. HTTP Requests Rate (req/s)
3. Response Time P50 e P95
4. Node.js Memory Usage
5. Database & Cache Metrics
6. Azure DevOps API Calls

**UID:** `auditoria-overview`  
**Tags:** auditoria, nodejs, api  
**Refresh:** 10s

---

## 🐛 Troubleshooting

### Problema: Métricas não aparecem no Prometheus

**Solução:**
```bash
# 1. Verificar se endpoint funciona
curl http://localhost:3000/metrics

# 2. Verificar targets no Prometheus
open http://localhost:9090/targets

# 3. Verificar logs
docker logs auditoria-app
docker logs auditoria-prometheus
```

### Problema: Grafana não conecta ao Prometheus

**Solução:**
```bash
# Verificar network
docker exec auditoria-grafana ping prometheus

# Verificar datasource no Grafana
# Configuration → Data Sources → Prometheus
# URL deve ser: http://prometheus:9090
```

### Problema: Container reiniciando

**Solução:**
```bash
# Ver erro específico
docker logs auditoria-app --tail 100

# Rebuild sem cache
docker-compose build --no-cache app
docker-compose up -d app
```

---

## 📁 Arquivos Criados

```
monitoring/
├── prometheus/
│   ├── prometheus.yml          # Config Prometheus
│   └── alerts.yml              # 8 regras de alerta
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── prometheus.yml  # Auto-config datasource
    │   └── dashboards/
    │       └── default.yml     # Provider de dashboards
    └── dashboards/
        └── auditoria-overview.json  # Dashboard principal

docs/observabilidade/
└── prometheus-grafana-setup.md  # Documentação completa

server/
└── api.js                       # Instrumentação prom-client
```

---

## 🎯 Próximos Passos

1. ✅ Testar endpoints após rebuild
2. ✅ Validar métricas no Prometheus
3. ✅ Configurar alertas no Grafana
4. 🔄 Adicionar MySQL Exporter
5. 🔄 Adicionar Node Exporter
6. 🔄 Configurar Alertmanager

---

**Status:** � **Sistema Funcionando!**  
**Última atualização:** 17/01/2026 22:42  
**Versão:** 1.0.0

## ✅ Sistema Validado

```bash
# Todos os serviços UP e funcionando:
✅ Application:  http://localhost:5173 (UP - healthy)
✅ API Backend:  http://localhost:3000 (UP - healthy)  
✅ Prometheus:   http://localhost:9090 (UP - healthy)
✅ Grafana:      http://localhost:3001 (UP - healthy)

# Métricas funcionando:
✅ 231 linhas de métricas expostas em /metrics
✅ Prometheus coletando dados (health: up)
✅ Métricas customizadas ativas:
   - http_requests_total (49 requests registrados)
   - http_request_duration_seconds (histograma P50/P95)
   - cache_hits_total / cache_misses_total
   - db_pool_connections_active
   - azure_api_calls_total

# Dashboards:
✅ Grafana datasource configurado
✅ Dashboard "Auditoria App - Overview" disponível
```
