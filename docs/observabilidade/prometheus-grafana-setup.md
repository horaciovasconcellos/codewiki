# 📊 Observabilidade com Prometheus + Grafana

## 🎯 Visão Geral

Sistema de observabilidade completo para monitoramento da aplicação Auditoria App, utilizando:
- **Prometheus**: Coleta e armazenamento de métricas time-series
- **Grafana**: Visualização de dashboards e alertas
- **prom-client**: Instrumentação do Node.js

---

## 🚀 Quick Start

### 1. Iniciar Stack de Monitoramento

```bash
# Subir todos os serviços (incluindo Prometheus e Grafana)
docker-compose up -d prometheus grafana

# Verificar status
docker-compose ps prometheus grafana
```

### 2. Acessar Interfaces

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **API Metrics** | http://localhost:3000/metrics | - |
| **API Health** | http://localhost:3000/health | - |

---

## 📈 Métricas Disponíveis

### Métricas Padrão Node.js
- `nodejs_heap_size_used_bytes` - Uso de memória heap
- `nodejs_heap_size_total_bytes` - Total de memória heap
- `nodejs_external_memory_bytes` - Memória externa
- `nodejs_eventloop_lag_seconds` - Latência do event loop
- `nodejs_gc_duration_seconds` - Duração do garbage collector
- `nodejs_version_info` - Versão do Node.js

### Métricas HTTP
- `http_requests_total` - Total de requisições HTTP (labels: method, route, status)
- `http_request_duration_seconds` - Duração das requisições (histograma P50, P95, P99)

### Métricas de Cache
- `cache_hits_total` - Hits de cache (label: cache_name)
- `cache_misses_total` - Misses de cache (label: cache_name)

### Métricas de Banco de Dados
- `db_pool_connections_active` - Conexões ativas no pool

### Métricas Azure DevOps
- `azure_api_calls_total` - Chamadas à API Azure (labels: operation, status)

---

## 🎨 Dashboards do Grafana

### Dashboard Principal: "Auditoria App - Overview"

**Painéis disponíveis:**

1. **Application Status** - Status da aplicação (UP/DOWN)
2. **HTTP Requests Rate** - Taxa de requisições por segundo
3. **Response Time (P50, P95)** - Latência de resposta
4. **Node.js Memory Usage** - Uso de memória
5. **Database & Cache Metrics** - Conexões DB e cache hit/miss
6. **Azure DevOps API Calls** - Chamadas à API Azure

**Acesso:**
1. Login no Grafana: http://localhost:3001
2. Dashboard → Browse → "Auditoria App - Overview"

---

## 🔔 Alertas Configurados

### Alertas Críticos

| Alerta | Condição | Duração | Ação |
|--------|----------|---------|------|
| **AuditoriaAppDown** | `up == 0` | 1min | Aplicação indisponível |
| **DatabaseConnectionFailed** | `mysql_up == 0` | 2min | BD inacessível |

### Alertas de Warning

| Alerta | Condição | Duração | Ação |
|--------|----------|---------|------|
| **HighErrorRate** | Erros 5xx > 5% | 5min | Taxa de erros alta |
| **HighLatency** | P95 > 2s | 10min | Latência alta |
| **HighMemoryUsage** | Heap > 90% | 5min | Memória crítica |
| **TooManyDatabaseConnections** | Pool > 80 | 10min | Pool saturado |

**Visualizar alertas:**
- Prometheus: http://localhost:9090/alerts
- Grafana: Alerting → Alert Rules

---

## 📂 Estrutura de Arquivos

```
codewiki/
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml      # Configuração do Prometheus
│   │   └── alerts.yml          # Regras de alerta
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/
│       │   │   └── prometheus.yml  # Datasource automático
│       │   └── dashboards/
│       │       └── default.yml     # Provider de dashboards
│       └── dashboards/
│           └── auditoria-overview.json  # Dashboard principal
├── docker-compose.yml           # Configuração dos containers
└── server/api.js                # Instrumentação prom-client
```

---

## 🔧 Configuração Avançada

### Adicionar Novas Métricas

**No código (server/api.js):**

```javascript
// Criar métrica customizada
const myCustomMetric = new promClient.Counter({
  name: 'my_custom_metric_total',
  help: 'Description of my metric',
  labelNames: ['label1', 'label2']
});
register.registerMetric(myCustomMetric);

// Incrementar métrica
myCustomMetric.inc({ label1: 'value1', label2: 'value2' });
```

### Modificar Intervalo de Scrape

**monitoring/prometheus/prometheus.yml:**
```yaml
scrape_configs:
  - job_name: 'auditoria-backend'
    scrape_interval: 5s  # Alterar de 10s para 5s
```

### Criar Novo Dashboard

1. Acesse Grafana → Create → Dashboard
2. Add Panel → Configure query:
   ```promql
   rate(http_requests_total[5m])
   ```
3. Save Dashboard → Export JSON
4. Salve em `monitoring/grafana/dashboards/`

---

## 🐛 Troubleshooting

### Problema: Prometheus não coleta métricas

**Verificar:**
```bash
# Testar endpoint de métricas
curl http://localhost:3000/metrics

# Verificar targets no Prometheus
# Acessar: http://localhost:9090/targets
```

**Solução:**
- Verificar se aplicação expõe `/metrics`
- Verificar network do Docker (`auditoria-network`)
- Verificar logs: `docker logs auditoria-prometheus`

### Problema: Grafana não conecta ao Prometheus

**Verificar:**
```bash
# Testar conectividade
docker exec auditoria-grafana ping prometheus

# Verificar datasource
# Grafana → Configuration → Data Sources → Prometheus
```

**Solução:**
- URL deve ser: `http://prometheus:9090`
- Verificar se ambos estão na mesma network

### Problema: Dashboard não mostra dados

**Verificar:**
```bash
# Query direta no Prometheus
curl 'http://localhost:9090/api/v1/query?query=up'

# Verificar se job_name está correto
# monitoring/prometheus/prometheus.yml
```

---

## 📊 Queries PromQL Úteis

### Performance da API
```promql
# Taxa de requisições por endpoint
rate(http_requests_total[5m])

# Latência média por endpoint
rate(http_request_duration_seconds_sum[5m]) 
/ 
rate(http_request_duration_seconds_count[5m])

# Taxa de erro (status 5xx)
rate(http_requests_total{status=~"5.."}[5m])
```

### Recursos do Sistema
```promql
# Uso de memória heap (percentual)
(nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) * 100

# Event loop lag
nodejs_eventloop_lag_seconds

# Conexões ativas no pool
db_pool_connections_active
```

### Cache
```promql
# Taxa de hit do cache
rate(cache_hits_total[5m]) 
/ 
(rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))
```

---

## 🔐 Segurança

### Credenciais Padrão
- **Grafana**: admin / admin123 (alterar em produção)
- **Prometheus**: Sem autenticação (configurar reverse proxy com auth)

### Recomendações para Produção

1. **Alterar senha do Grafana:**
   ```bash
   docker exec -it auditoria-grafana grafana-cli admin reset-admin-password <nova-senha>
   ```

2. **Habilitar autenticação no Prometheus:**
   - Usar Nginx/Traefik como reverse proxy
   - Configurar basic auth

3. **Restringir acesso às portas:**
   - Expor apenas via reverse proxy
   - Não expor 9090 e 3001 publicamente

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [prom-client](https://github.com/siimon/prom-client)

### Dashboards da Comunidade
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- Node.js Dashboard ID: 11159
- MySQL Dashboard ID: 7362

### Exporters Adicionais
- **MySQL Exporter**: Métricas detalhadas do MySQL
- **Node Exporter**: Métricas do SO (CPU, disco, rede)
- **cAdvisor**: Métricas de containers Docker

---

## 🎯 Próximos Passos

1. **Adicionar MySQL Exporter** para métricas detalhadas do banco
2. **Configurar Alertmanager** para notificações (Slack, email, PagerDuty)
3. **Adicionar Node Exporter** para métricas de sistema operacional
4. **Implementar distributed tracing** com Jaeger ou Zipkin
5. **Criar dashboards específicos** por funcionalidade (Azure, Logs, etc)

---

**Documentação criada em:** 17/01/2026  
**Versão:** 1.0.0  
**Última atualização:** 17/01/2026
