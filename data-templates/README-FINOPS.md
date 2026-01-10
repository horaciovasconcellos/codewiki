# Guia de Carga de Dados - FinOps-Focus

Este guia explica como carregar dados de custos cloud no módulo FinOps-Focus.

## Arquivos Disponíveis

### 1. Arquivos JSON por Provedor

- **`finops-carga.json`** - Dados AWS (4 recursos)
- **`finops-azure-carga.json`** - Dados Azure (4 recursos)
- **`finops-gcp-carga.json`** - Dados GCP (4 recursos)

### 2. Arquivo CSV Consolidado

- **`finops.csv`** - Todos os provedores em formato CSV (12 recursos)

## Estrutura dos Dados

### Recursos Incluídos

Cada provedor contém exemplos de:
1. **Compute** - Servidores/VMs (EC2, Virtual Machine, Compute Engine)
2. **Storage** - Armazenamento (S3, Storage Account, Cloud Storage)
3. **Database** - Bancos de dados (RDS, SQL Database, Cloud SQL)
4. **Serverless** - Funções serverless (Lambda, App Service, Cloud Functions)

### Campos Principais

#### Identificação
- `provider`: Nome do provedor (AWS, Azure, GCP, OCI)
- `resource_id`: ID único do recurso no provedor
- `resource_type`: Tipo do serviço
- `resource_name`: Nome amigável do recurso
- `region`: Região onde o recurso está

#### Métricas de Uso
- `cpu_hours`: Horas de CPU utilizadas
- `storage_gb`: GB de armazenamento
- `network_gb`: GB de tráfego de rede
- `memory_gb_hours`: GB-horas de memória
- `requests_count`: Número de requisições

#### Métricas de Custo (USD)
- `cpu_cost`: Custo de CPU
- `storage_cost`: Custo de armazenamento
- `network_cost`: Custo de rede
- `memory_cost`: Custo de memória
- `other_cost`: Outros custos
- `total_cost`: Custo total

#### Classificação
- `service_category`: Categoria (Compute, Storage, Database, Network)
- `cost_date`: Data do custo (YYYY-MM-DD)
- `tags`: Tags do recurso (environment, team, cost-center, application)

## Como Usar

### Opção 1: Via Interface Web

1. Acesse o menu **FinOps-Focus** no sistema
2. Vá para a aba **Ingerir Dados**
3. Use os botões de teste para cada provedor

### Opção 2: Via API (JSON)

```bash
# AWS
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d @data-templates/finops-carga.json

# Azure
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d @data-templates/finops-azure-carga.json

# GCP
curl -X POST http://localhost:3000/api/finops/ingest \
  -H "Content-Type: application/json" \
  -d @data-templates/finops-gcp-carga.json
```

### Opção 3: Processamento de CSV

Para processar o arquivo CSV, você pode criar um script Python:

```python
import csv
import json
import requests
from collections import defaultdict

def csv_to_finops_json(csv_file):
    data_by_provider = defaultdict(lambda: {'provider': '', 'resources': []})
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            provider = row['provider']
            data_by_provider[provider]['provider'] = provider
            
            resource = {
                'resource_id': row['resource_id'],
                'resource_type': row['resource_type'],
                'resource_name': row['resource_name'],
                'region': row['region'],
                'tags': {
                    'environment': row['environment'],
                    'team': row['team'],
                },
                'usage': {
                    'cpu_hours': float(row['cpu_hours']),
                    'storage_gb': float(row['storage_gb']),
                    'network_gb': float(row['network_gb']),
                    'memory_gb_hours': float(row['memory_gb_hours']),
                    'requests_count': int(row['requests_count']),
                },
                'cost': {
                    'cpu_cost': float(row['cpu_cost']),
                    'storage_cost': float(row['storage_cost']),
                    'network_cost': float(row['network_cost']),
                    'memory_cost': float(row['memory_cost']),
                    'other_cost': float(row['other_cost']),
                    'total_cost': float(row['total_cost']),
                },
                'service_category': row['service_category'],
                'cost_date': row['cost_date']
            }
            
            # Adiciona campos opcionais se existirem
            if row.get('cost_center'):
                resource['tags']['cost-center'] = row['cost_center']
            if row.get('application'):
                resource['tags']['application'] = row['application']
            
            data_by_provider[provider]['resources'].append(resource)
    
    return list(data_by_provider.values())

# Uso
providers_data = csv_to_finops_json('data-templates/finops.csv')

for data in providers_data:
    response = requests.post(
        'http://localhost:3000/api/finops/ingest',
        json=data
    )
    print(f"{data['provider']}: {response.status_code} - {response.json()}")
```

## Dados de Teste

Os dados incluídos são exemplos realistas com:

### Custos Totais por Provedor
- **AWS**: $883.00/dia
- **Azure**: $870.75/dia
- **GCP**: $871.50/dia
- **Total**: $2,625.25/dia (~$78,757.50/mês)

### Distribuição por Categoria
- **Compute**: ~35% ($918.90)
- **Database**: ~42% ($1,103.00)
- **Storage**: ~20% ($525.35)
- **Outros**: ~3% ($78.00)

### Recursos Marcados
- **Tagged**: 75% (9 de 12 recursos têm tags completas)
- **Untagged**: 25% (3 recursos com tags incompletas)

### Alocação a Aplicações
- **Allocated**: 25% (3 recursos com tag 'application')
- **Unallocated**: 75% (9 recursos sem aplicação definida)

## Personalização

Para adaptar os dados à sua realidade:

1. **Ajustar Custos**: Modifique os valores de custo conforme sua escala
2. **Adicionar Recursos**: Inclua mais linhas no CSV ou objetos no JSON
3. **Tags Personalizadas**: Adicione tags relevantes para sua organização
4. **Datas**: Altere `cost_date` para refletir períodos específicos
5. **Aplicações**: Associe recursos com `aplicacao_id` do seu sistema

## Automação

Para integração contínua, considere:

1. **Agendamento**: Use cron jobs para enviar dados periodicamente
2. **APIs de Provedores**: Integre com AWS Cost Explorer, Azure Cost Management, GCP Billing
3. **Transformação**: Adapte formatos nativos dos provedores para o formato FOCUS
4. **Validação**: Verifique dados antes do envio para evitar erros

## Suporte

Para mais informações sobre o formato de ingestão, consulte:
- `docs/FINOPS-INGESTION-GUIDE.md` - Guia completo da API
- `database/create-finops-tables.sql` - Estrutura das tabelas
- `src/lib/types.ts` - Tipos TypeScript para validação
