# API de Carga em Lote - Aplicações

## Visão Geral

Esta documentação descreve a API para carga em lote (bulk load) de aplicações e todas as suas entidades relacionadas no sistema de auditoria.

## Endpoint Principal

### POST /api/aplicacoes/bulk

Cria múltiplas aplicações com todas as suas entidades relacionadas em uma única requisição.

**URL:** `http://localhost:3000/api/aplicacoes/bulk`

**Método:** `POST`

**Content-Type:** `application/json`

---

## Estrutura do JSON de Carga

### Objeto Completo de Aplicação

```json
{
  "aplicacoes": [
    {
      "sigla": "APP-001",
      "descricao": "Sistema de Gestão Financeira",
      "url_documentacao": "https://docs.empresa.com/sistema-financeiro",
      "fase_ciclo_vida": "Produção",
      "criticidade_negocio": "Crítica",
      "categoria_sistema": "ERP",
      "fornecedor": "Oracle Corporation",
      "tipo_hospedagem": "On-Premise",
      "custo_mensal": 50000.00,
      "numero_usuarios": 1500,
      "data_implantacao": "2020-03-15",
      "versao_atual": "12.2.1.4",
      "responsavel_tecnico": "João Silva",
      "responsavel_negocio": "Maria Santos",
      "status_operacional": "Operacional",
      "observacoes": "Sistema crítico para operações financeiras da empresa",
      
      "ambientes": [
        {
          "tipo_ambiente": "Produção",
          "url_ambiente": "https://erp-prod.empresa.com",
          "data_criacao": "2020-03-15",
          "tempo_liberacao": 60,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Homologação",
          "url_ambiente": "https://erp-hml.empresa.com",
          "data_criacao": "2020-03-10",
          "tempo_liberacao": 30,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Desenvolvimento",
          "url_ambiente": "https://erp-dev.empresa.com",
          "data_criacao": "2020-03-05",
          "tempo_liberacao": 15,
          "status": "Ativo"
        }
      ],
      
      "tecnologias": [
        {
          "tecnologia_id": "TECH-001",
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        },
        {
          "tecnologia_id": "TECH-002",
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        }
      ],
      
      "capacidades": [
        {
          "capacidade_id": "CAP-001",
          "grau_cobertura": 95,
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        },
        {
          "capacidade_id": "CAP-002",
          "grau_cobertura": 80,
          "data_inicio": "2020-06-01",
          "data_termino": null,
          "status": "Ativo"
        }
      ],
      
      "processos": [
        {
          "processo_id": "PROC-001",
          "tipo_suporte": "Automatizado",
          "criticidade": "Alta",
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        },
        {
          "processo_id": "PROC-002",
          "tipo_suporte": "Semi-automatizado",
          "criticidade": "Média",
          "data_inicio": "2020-04-01",
          "data_termino": null,
          "status": "Ativo"
        }
      ],
      
      "integracoes": [
        {
          "aplicacao_destino_id": "APP-002",
          "tipo_integracao": "Síncrona",
          "protocolo": "REST API",
          "frequencia": "Tempo Real",
          "descricao": "Integração com sistema de RH para dados de colaboradores",
          "status": "Ativo"
        },
        {
          "aplicacao_destino_id": "APP-003",
          "tipo_integracao": "Assíncrona",
          "protocolo": "Mensageria",
          "frequencia": "Diária",
          "descricao": "Envio de relatórios contábeis",
          "status": "Ativo"
        }
      ],
      
      "slas": [
        {
          "sla_id": "SLA-001",
          "descricao": "Disponibilidade de 99.9% durante horário comercial",
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        },
        {
          "sla_id": "SLA-002",
          "descricao": "Tempo de resposta médio de 2 segundos",
          "data_inicio": "2020-03-15",
          "data_termino": null,
          "status": "Ativo"
        }
      ]
    }
  ]
}
```

---

## Exemplo Completo com Múltiplas Aplicações

```json
{
  "aplicacoes": [
    {
      "sigla": "SAP-ERP",
      "descricao": "SAP ERP Central Component",
      "url_documentacao": "https://docs.sap.com/ecc",
      "fase_ciclo_vida": "Produção",
      "criticidade_negocio": "Crítica",
      "categoria_sistema": "ERP",
      "fornecedor": "SAP SE",
      "tipo_hospedagem": "On-Premise",
      "custo_mensal": 120000.00,
      "numero_usuarios": 3500,
      "data_implantacao": "2018-01-10",
      "versao_atual": "ECC 6.0 EHP8",
      "responsavel_tecnico": "Carlos Eduardo",
      "responsavel_negocio": "Ana Paula Oliveira",
      "status_operacional": "Operacional",
      "observacoes": "Sistema core da empresa",
      "ambientes": [
        {
          "tipo_ambiente": "Produção",
          "url_ambiente": "https://sap-prd.empresa.com.br",
          "data_criacao": "2018-01-10",
          "tempo_liberacao": 90,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Quality",
          "url_ambiente": "https://sap-qas.empresa.com.br",
          "data_criacao": "2017-12-15",
          "tempo_liberacao": 45,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Desenvolvimento",
          "url_ambiente": "https://sap-dev.empresa.com.br",
          "data_criacao": "2017-12-01",
          "tempo_liberacao": 20,
          "status": "Ativo"
        }
      ],
      "tecnologias": [
        {
          "tecnologia_id": "TECH-SAP-01",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        },
        {
          "tecnologia_id": "TECH-DB-01",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        }
      ],
      "capacidades": [
        {
          "capacidade_id": "CAP-FIN-001",
          "grau_cobertura": 100,
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        },
        {
          "capacidade_id": "CAP-LOG-001",
          "grau_cobertura": 95,
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        },
        {
          "capacidade_id": "CAP-RH-001",
          "grau_cobertura": 90,
          "data_inicio": "2018-02-01",
          "status": "Ativo"
        }
      ],
      "processos": [
        {
          "processo_id": "PROC-FIN-001",
          "tipo_suporte": "Automatizado",
          "criticidade": "Crítica",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        },
        {
          "processo_id": "PROC-FIN-002",
          "tipo_suporte": "Automatizado",
          "criticidade": "Alta",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        }
      ],
      "integracoes": [
        {
          "aplicacao_destino_id": "APP-CRM",
          "tipo_integracao": "Síncrona",
          "protocolo": "RFC",
          "frequencia": "Tempo Real",
          "descricao": "Integração bidirecionala com CRM Salesforce",
          "status": "Ativo"
        },
        {
          "aplicacao_destino_id": "APP-BI",
          "tipo_integracao": "Assíncrona",
          "protocolo": "ETL",
          "frequencia": "Horária",
          "descricao": "Extração de dados para BI",
          "status": "Ativo"
        }
      ],
      "slas": [
        {
          "sla_id": "SLA-HIGH-001",
          "descricao": "Disponibilidade 99.95% 24x7",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        },
        {
          "sla_id": "SLA-PERF-001",
          "descricao": "Tempo resposta transações < 3s",
          "data_inicio": "2018-01-10",
          "status": "Ativo"
        }
      ]
    },
    {
      "sigla": "APP-CRM",
      "descricao": "Salesforce CRM",
      "url_documentacao": "https://help.salesforce.com",
      "fase_ciclo_vida": "Produção",
      "criticidade_negocio": "Alta",
      "categoria_sistema": "CRM",
      "fornecedor": "Salesforce Inc",
      "tipo_hospedagem": "Cloud",
      "custo_mensal": 35000.00,
      "numero_usuarios": 850,
      "data_implantacao": "2019-06-10",
      "versao_atual": "Spring '24",
      "responsavel_tecnico": "Pedro Henrique",
      "responsavel_negocio": "Juliana Costa",
      "status_operacional": "Operacional",
      "observacoes": "Sistema de gestão de relacionamento com clientes",
      "ambientes": [
        {
          "tipo_ambiente": "Produção",
          "url_ambiente": "https://empresa.my.salesforce.com",
          "data_criacao": "2019-06-10",
          "tempo_liberacao": 60,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Sandbox",
          "url_ambiente": "https://empresa--uat.sandbox.my.salesforce.com",
          "data_criacao": "2019-06-01",
          "tempo_liberacao": 30,
          "status": "Ativo"
        }
      ],
      "tecnologias": [
        {
          "tecnologia_id": "TECH-SFDC-01",
          "data_inicio": "2019-06-10",
          "status": "Ativo"
        }
      ],
      "capacidades": [
        {
          "capacidade_id": "CAP-VEN-001",
          "grau_cobertura": 100,
          "data_inicio": "2019-06-10",
          "status": "Ativo"
        },
        {
          "capacidade_id": "CAP-MKT-001",
          "grau_cobertura": 85,
          "data_inicio": "2019-08-01",
          "status": "Ativo"
        }
      ],
      "processos": [
        {
          "processo_id": "PROC-VEN-001",
          "tipo_suporte": "Automatizado",
          "criticidade": "Alta",
          "data_inicio": "2019-06-10",
          "status": "Ativo"
        }
      ],
      "integracoes": [
        {
          "aplicacao_destino_id": "SAP-ERP",
          "tipo_integracao": "Síncrona",
          "protocolo": "REST API",
          "frequencia": "Tempo Real",
          "descricao": "Sincronização de clientes e pedidos",
          "status": "Ativo"
        },
        {
          "aplicacao_destino_id": "APP-EMAIL",
          "tipo_integracao": "Assíncrona",
          "protocolo": "Webhook",
          "frequencia": "Evento",
          "descricao": "Disparo de e-mails marketing",
          "status": "Ativo"
        }
      ],
      "slas": [
        {
          "sla_id": "SLA-MED-001",
          "descricao": "Disponibilidade 99.5% horário comercial",
          "data_inicio": "2019-06-10",
          "status": "Ativo"
        }
      ]
    },
    {
      "sigla": "APP-BI",
      "descricao": "Power BI Enterprise",
      "url_documentacao": "https://docs.microsoft.com/powerbi",
      "fase_ciclo_vida": "Produção",
      "criticidade_negocio": "Média",
      "categoria_sistema": "Business Intelligence",
      "fornecedor": "Microsoft Corporation",
      "tipo_hospedagem": "Cloud",
      "custo_mensal": 18000.00,
      "numero_usuarios": 450,
      "data_implantacao": "2020-11-05",
      "versao_atual": "Cloud - Auto Update",
      "responsavel_tecnico": "Fernanda Lima",
      "responsavel_negocio": "Roberto Almeida",
      "status_operacional": "Operacional",
      "observacoes": "Plataforma de BI corporativa",
      "ambientes": [
        {
          "tipo_ambiente": "Produção",
          "url_ambiente": "https://app.powerbi.com/empresa",
          "data_criacao": "2020-11-05",
          "tempo_liberacao": 45,
          "status": "Ativo"
        },
        {
          "tipo_ambiente": "Desenvolvimento",
          "url_ambiente": "https://app.powerbi.com/empresa-dev",
          "data_criacao": "2020-10-20",
          "tempo_liberacao": 20,
          "status": "Ativo"
        }
      ],
      "tecnologias": [
        {
          "tecnologia_id": "TECH-BI-01",
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        },
        {
          "tecnologia_id": "TECH-AZURE-01",
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        }
      ],
      "capacidades": [
        {
          "capacidade_id": "CAP-ANA-001",
          "grau_cobertura": 90,
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        },
        {
          "capacidade_id": "CAP-REP-001",
          "grau_cobertura": 100,
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        }
      ],
      "processos": [
        {
          "processo_id": "PROC-ANA-001",
          "tipo_suporte": "Semi-automatizado",
          "criticidade": "Média",
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        }
      ],
      "integracoes": [
        {
          "aplicacao_destino_id": "SAP-ERP",
          "tipo_integracao": "Assíncrona",
          "protocolo": "Direct Query",
          "frequencia": "Tempo Real",
          "descricao": "Consulta dados ERP em tempo real",
          "status": "Ativo"
        },
        {
          "aplicacao_destino_id": "APP-CRM",
          "tipo_integracao": "Assíncrona",
          "protocolo": "REST API",
          "frequencia": "Diária",
          "descricao": "Importação dados CRM",
          "status": "Ativo"
        }
      ],
      "slas": [
        {
          "sla_id": "SLA-LOW-001",
          "descricao": "Disponibilidade 99% horário comercial",
          "data_inicio": "2020-11-05",
          "status": "Ativo"
        }
      ]
    }
  ]
}
```

---

## Campos e Validações

### Tabela: aplicacoes

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| sigla | string | Sim | 10 | Único no sistema |
| descricao | string | Sim | 50 | - |
| url_documentacao | string | Sim | 500 | URL válida |
| fase_ciclo_vida | string | Sim | 20 | Planejamento, Desenvolvimento, Produção, Manutenção, Descontinuado |
| criticidade_negocio | string | Sim | 20 | Crítica, Alta, Média, Baixa |
| categoria_sistema | string | Não | 50 | - |
| fornecedor | string | Não | 200 | - |
| tipo_hospedagem | string | Não | 50 | On-Premise, Cloud, Híbrido |
| custo_mensal | decimal | Não | 12,2 | >= 0 |
| numero_usuarios | integer | Não | - | >= 0 |
| data_implantacao | date | Não | - | Formato: YYYY-MM-DD |
| versao_atual | string | Não | 50 | - |
| responsavel_tecnico | string | Não | 200 | - |
| responsavel_negocio | string | Não | 200 | - |
| status_operacional | string | Não | 50 | Operacional, Manutenção, Indisponível |
| observacoes | text | Não | - | - |

### Tabela: aplicacao_ambientes

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| tipo_ambiente | string | Sim | 50 | Produção, Homologação, Desenvolvimento, Testes, Quality, Sandbox |
| url_ambiente | string | Sim | 500 | URL válida |
| data_criacao | date | Sim | - | Formato: YYYY-MM-DD |
| tempo_liberacao | integer | Sim | - | Minutos >= 0 |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

### Tabela: aplicacao_tecnologias

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| tecnologia_id | string | Sim | 36 | UUID de tecnologia existente |
| data_inicio | date | Sim | - | Formato: YYYY-MM-DD |
| data_termino | date | Não | - | Formato: YYYY-MM-DD |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

### Tabela: aplicacao_capacidades

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| capacidade_id | string | Sim | 36 | UUID de capacidade existente |
| grau_cobertura | integer | Sim | - | 0 a 100 (percentual) |
| data_inicio | date | Sim | - | Formato: YYYY-MM-DD |
| data_termino | date | Não | - | Formato: YYYY-MM-DD |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

### Tabela: aplicacao_processos

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| processo_id | string | Sim | 36 | UUID de processo existente |
| tipo_suporte | string | Sim | 50 | Automatizado, Semi-automatizado, Manual |
| criticidade | string | Sim | 20 | Crítica, Alta, Média, Baixa |
| data_inicio | date | Sim | - | Formato: YYYY-MM-DD |
| data_termino | date | Não | - | Formato: YYYY-MM-DD |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

### Tabela: aplicacao_integracoes

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| aplicacao_destino_id | string | Sim | 36 | UUID de aplicação existente |
| tipo_integracao | string | Sim | 50 | Síncrona, Assíncrona |
| protocolo | string | Sim | 50 | REST API, SOAP, RFC, Mensageria, ETL, Webhook, Direct Query, etc |
| frequencia | string | Sim | 50 | Tempo Real, Horária, Diária, Semanal, Mensal, Evento |
| descricao | text | Não | - | - |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

### Tabela: aplicacao_slas

| Campo | Tipo | Obrigatório | Tamanho | Valores Válidos |
|-------|------|-------------|---------|-----------------|
| sla_id | string | Sim | 36 | UUID de SLA existente |
| descricao | string | Sim | 255 | - |
| data_inicio | date | Sim | - | Formato: YYYY-MM-DD |
| data_termino | date | Não | - | Formato: YYYY-MM-DD |
| status | string | Não | 20 | Ativo, Inativo (padrão: Ativo) |

---

## Resposta da API

### Sucesso (200 OK)

```json
{
  "message": "Carga em lote realizada com sucesso",
  "summary": {
    "total": 3,
    "sucesso": 3,
    "falhas": 0
  },
  "results": [
    {
      "sigla": "SAP-ERP",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "totals": {
        "ambientes": 3,
        "tecnologias": 2,
        "capacidades": 3,
        "processos": 2,
        "integracoes": 2,
        "slas": 2
      }
    },
    {
      "sigla": "APP-CRM",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "totals": {
        "ambientes": 2,
        "tecnologias": 1,
        "capacidades": 2,
        "processos": 1,
        "integracoes": 2,
        "slas": 1
      }
    },
    {
      "sigla": "APP-BI",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "totals": {
        "ambientes": 2,
        "tecnologias": 2,
        "capacidades": 2,
        "processos": 1,
        "integracoes": 2,
        "slas": 1
      }
    }
  ]
}
```

### Erro Parcial (200 OK com falhas)

```json
{
  "message": "Carga em lote concluída com erros",
  "summary": {
    "total": 3,
    "sucesso": 2,
    "falhas": 1
  },
  "results": [
    {
      "sigla": "SAP-ERP",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "totals": {
        "ambientes": 3,
        "tecnologias": 2,
        "capacidades": 3,
        "processos": 2,
        "integracoes": 2,
        "slas": 2
      }
    },
    {
      "sigla": "APP-CRM",
      "status": "error",
      "error": "Sigla já existe no sistema"
    },
    {
      "sigla": "APP-BI",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "totals": {
        "ambientes": 2,
        "tecnologias": 2,
        "capacidades": 2,
        "processos": 1,
        "integracoes": 2,
        "slas": 1
      }
    }
  ]
}
```

### Erro Geral (400 Bad Request)

```json
{
  "error": "Formato de dados inválido",
  "code": "INVALID_FORMAT",
  "details": "O campo 'aplicacoes' deve ser um array"
}
```

---

## Exemplo de Uso com cURL

```bash
curl -X POST http://localhost:3000/api/aplicacoes/bulk \
  -H "Content-Type: application/json" \
  -d @aplicacoes-bulk-load.json
```

## Exemplo de Uso com JavaScript/Fetch

```javascript
const data = {
  aplicacoes: [
    // ... seu array de aplicações
  ]
};

const response = await fetch('http://localhost:3000/api/aplicacoes/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});

const result = await response.json();
console.log(result);
```

---

## Notas Importantes

1. **IDs de Referência**: Todos os IDs referenciados (tecnologia_id, capacidade_id, processo_id, sla_id, aplicacao_destino_id) devem existir no banco de dados antes da carga.

2. **Transações**: Cada aplicação é processada em uma transação separada. Se uma falhar, as outras continuam.

3. **Validações**: O sistema valida:
   - Unicidade da sigla
   - Existência de IDs referenciados
   - Formatos de data (YYYY-MM-DD)
   - Valores numéricos (custo, usuários, cobertura)
   - Tamanhos de campos

4. **Campos JSON**: Os campos JSON nas colunas `tecnologias`, `ambientes`, `capacidades`, `processos`, `integracoes` e `slas` da tabela `aplicacoes` são atualizados automaticamente após a inserção nas tabelas relacionadas.

5. **Performance**: Para cargas muito grandes (>100 aplicações), considere dividir em múltiplas requisições.

6. **Rollback**: Se ocorrer erro em alguma entidade relacionada, toda a transação daquela aplicação é revertida.

---

## Ordem de Dependência das Tabelas

Para garantir integridade referencial, siga esta ordem de carga:

1. **tecnologias** - Deve existir antes de aplicacoes
2. **capacidades** - Deve existir antes de aplicacoes
3. **processos** - Deve existir antes de aplicacoes
4. **slas** - Deve existir antes de aplicacoes
5. **aplicacoes** - Tabela principal
6. **aplicacao_ambientes** - Depende de aplicacoes
7. **aplicacao_tecnologias** - Depende de aplicacoes e tecnologias
8. **aplicacao_capacidades** - Depende de aplicacoes e capacidades
9. **aplicacao_processos** - Depende de aplicacoes e processos
10. **aplicacao_integracoes** - Depende de aplicacoes (ambas)
11. **aplicacao_slas** - Depende de aplicacoes e slas

---

## Arquivo de Exemplo Completo

Salve o JSON de exemplo acima em um arquivo `aplicacoes-bulk-load.json` e execute:

```bash
curl -X POST http://localhost:3000/api/aplicacoes/bulk \
  -H "Content-Type: application/json" \
  -d @aplicacoes-bulk-load.json | jq
```

O comando `| jq` no final formata a resposta JSON de forma legível.
