# FinOps-Focus: Exemplo de Ingestão de Dados

Este documento demonstra como enviar dados de custos dos provedores cloud para o sistema FinOps-Focus.

## Endpoint de Ingestão

```
POST http://localhost:3000/api/finops/ingest
Content-Type: application/json
```

## Estrutura dos Dados

### AWS (Amazon Web Services)

```json
{
  "provider": "AWS",
  "resources": [
    {
      "resource_id": "i-0abcd1234efgh5678",
      "resource_type": "EC2",
      "resource_name": "prod-web-server-01",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us-east-1",
      "tags": {
        "environment": "production",
        "team": "platform",
        "cost-center": "engineering"
      },
      "usage": {
        "cpu_hours": 720,
        "storage_gb": 100,
        "network_gb": 500,
        "memory_gb_hours": 1440,
        "requests_count": 1500000
      },
      "cost": {
        "cpu_cost": 144.00,
        "storage_cost": 10.00,
        "network_cost": 25.00,
        "memory_cost": 28.80,
        "other_cost": 5.20,
        "total_cost": 213.00
      },
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    },
    {
      "resource_id": "s3-bucket-data-lake",
      "resource_type": "S3",
      "resource_name": "company-data-lake",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us-west-2",
      "tags": {
        "environment": "production",
        "team": "data-engineering"
      },
      "usage": {
        "storage_gb": 5000,
        "network_gb": 2000,
        "requests_count": 5000000
      },
      "cost": {
        "storage_cost": 115.00,
        "network_cost": 180.00,
        "other_cost": 12.50,
        "total_cost": 307.50
      },
      "service_category": "Storage",
      "cost_date": "2026-01-10"
    }
  ]
}
```

### Azure (Microsoft Azure)

```json
{
  "provider": "Azure",
  "resources": [
    {
      "resource_id": "vm-prod-api-01",
      "resource_type": "Virtual Machine",
      "resource_name": "prod-api-server",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "eastus",
      "tags": {
        "environment": "production",
        "project": "api-gateway"
      },
      "usage": {
        "cpu_hours": 720,
        "storage_gb": 200,
        "network_gb": 800,
        "memory_gb_hours": 2880
      },
      "cost": {
        "cpu_cost": 180.00,
        "storage_cost": 20.00,
        "network_cost": 40.00,
        "memory_cost": 57.60,
        "total_cost": 297.60
      },
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    },
    {
      "resource_id": "sql-db-prod-001",
      "resource_type": "SQL Database",
      "resource_name": "production-database",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "eastus",
      "tags": {
        "environment": "production",
        "tier": "premium"
      },
      "usage": {
        "storage_gb": 500,
        "requests_count": 10000000
      },
      "cost": {
        "storage_cost": 125.00,
        "other_cost": 75.00,
        "total_cost": 200.00
      },
      "service_category": "Database",
      "cost_date": "2026-01-10"
    }
  ]
}
```

### GCP (Google Cloud Platform)

```json
{
  "provider": "GCP",
  "resources": [
    {
      "resource_id": "compute-engine-prod-web",
      "resource_type": "Compute Engine",
      "resource_name": "prod-web-instance",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us-central1",
      "tags": {
        "env": "prod",
        "app": "web-frontend"
      },
      "usage": {
        "cpu_hours": 720,
        "storage_gb": 150,
        "network_gb": 600,
        "memory_gb_hours": 2160
      },
      "cost": {
        "cpu_cost": 165.00,
        "storage_cost": 15.00,
        "network_cost": 30.00,
        "memory_cost": 43.20,
        "total_cost": 253.20
      },
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    },
    {
      "resource_id": "bigquery-analytics-01",
      "resource_type": "BigQuery",
      "resource_name": "analytics-dataset",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us",
      "tags": {
        "team": "analytics",
        "project": "business-intelligence"
      },
      "usage": {
        "storage_gb": 2000,
        "requests_count": 50000
      },
      "cost": {
        "storage_cost": 40.00,
        "other_cost": 150.00,
        "total_cost": 190.00
      },
      "service_category": "Analytics",
      "cost_date": "2026-01-10"
    }
  ]
}
```

### OCI (Oracle Cloud Infrastructure)

```json
{
  "provider": "OCI",
  "resources": [
    {
      "resource_id": "ocid1.instance.oc1.iad.example",
      "resource_type": "Compute Instance",
      "resource_name": "prod-app-server",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us-ashburn-1",
      "tags": {
        "environment": "production",
        "application": "erp"
      },
      "usage": {
        "cpu_hours": 720,
        "storage_gb": 300,
        "network_gb": 1000,
        "memory_gb_hours": 2880
      },
      "cost": {
        "cpu_cost": 200.00,
        "storage_cost": 30.00,
        "network_cost": 50.00,
        "memory_cost": 57.60,
        "total_cost": 337.60
      },
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    },
    {
      "resource_id": "ocid1.autonomousdatabase.oc1.iad.example",
      "resource_type": "Autonomous Database",
      "resource_name": "prod-autonomous-db",
      "aplicacao_id": "uuid-da-aplicacao",
      "region": "us-ashburn-1",
      "tags": {
        "environment": "production",
        "tier": "enterprise"
      },
      "usage": {
        "storage_gb": 1000,
        "requests_count": 20000000
      },
      "cost": {
        "storage_cost": 250.00,
        "other_cost": 450.00,
        "total_cost": 700.00
      },
      "service_category": "Database",
      "cost_date": "2026-01-10"
    }
  ]
}
```

## Teste via cURL

### AWS
```bash
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "AWS",
    "resources": [{
      "resource_id": "i-test001",
      "resource_type": "EC2",
      "usage": {"cpu_hours": 100},
      "cost": {"total_cost": 50.00},
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    }]
  }'
```

### Azure
```bash
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "Azure",
    "resources": [{
      "resource_id": "vm-test001",
      "resource_type": "Virtual Machine",
      "usage": {"cpu_hours": 120},
      "cost": {"total_cost": 60.00},
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    }]
  }'
```

### GCP
```bash
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "GCP",
    "resources": [{
      "resource_id": "compute-test001",
      "resource_type": "Compute Engine",
      "usage": {"cpu_hours": 110},
      "cost": {"total_cost": 55.00},
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    }]
  }'
```

### OCI
```bash
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "OCI",
    "resources": [{
      "resource_id": "ocid-test001",
      "resource_type": "Compute Instance",
      "usage": {"cpu_hours": 130},
      "cost": {"total_cost": 65.00},
      "service_category": "Compute",
      "cost_date": "2026-01-10"
    }]
  }'
```

## Campos Obrigatórios

- `provider`: Nome do provedor (AWS, Azure, GCP, OCI)
- `resources`: Array de recursos
  - `resource_id`: ID único do recurso no provedor
  - `resource_type`: Tipo do recurso (EC2, Virtual Machine, etc)
  - `cost.total_cost`: Custo total do recurso
  - `cost_date`: Data do custo no formato YYYY-MM-DD

## Campos Opcionais

- `resource_name`: Nome amigável do recurso
- `aplicacao_id`: UUID da aplicação interna (para alocação de custos)
- `region`: Região do provedor
- `tags`: Tags do recurso (objeto chave-valor)
- `usage`: Métricas de uso detalhadas
- `cost`: Breakdown detalhado dos custos
- `service_category`: Categoria do serviço (Compute, Storage, Network, Database, etc)

## Indicadores FinOps-Focus Calculados

O sistema calcula automaticamente:

1. **Total Daily Cost**: Soma de todos os custos diários
2. **Cost by Application**: Agrupamento por aplicação
3. **Cost by Provider**: Distribuição entre AWS, Azure, GCP, OCI
4. **Cost by Service**: Breakdown por categoria (Compute, Storage, etc)
5. **Unallocated Cost**: Recursos sem aplicação vinculada
6. **Tagged vs Untagged Cost**: Recursos com/sem tags adequadas
7. **Unit Cost**: Custo unitário (ex: custo por request)

## Consulta de Dados

### Dashboard
```bash
curl -s "http://localhost:3000/api/finops/dashboard?startDate=2026-01-01&endDate=2026-01-10" | jq '.'
```

### Provedores
```bash
curl -s http://localhost:3000/api/finops/providers | jq '.'
```

### Recursos
```bash
curl -s http://localhost:3000/api/finops/resources | jq '.'
```
