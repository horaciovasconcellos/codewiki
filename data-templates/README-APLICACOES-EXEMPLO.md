# Exemplo de Aplicações Completas com Relacionamentos

## 📄 Arquivo: `aplicacoes-completas-exemplo.json`

Este arquivo demonstra como criar aplicações com **todos os relacionamentos** suportados pelo sistema.

## ⚠️ IMPORTANTE - Antes de Usar

Os IDs (UUIDs) nos relacionamentos são **placeholders** e devem ser substituídos por IDs reais das respectivas tabelas:

### 1. Obter IDs de Tecnologias
```bash
curl -s http://localhost:3000/api/tecnologias | jq '.[] | {id, sigla, nome}'
```

### 2. Obter IDs de Capacidades
```bash
curl -s http://localhost:3000/api/capacidades-negocio | jq '.[] | {id, nome}'
```

### 3. Obter IDs de Processos
```bash
curl -s http://localhost:3000/api/processos-negocio | jq '.[] | {id, identificacao, descricao}'
```

### 4. Obter IDs de SLAs
```bash
curl -s http://localhost:3000/api/slas | jq '.[] | {id, sigla, descricao}'
```

### 5. Obter IDs de Aplicações (para integrações)
```bash
curl -s http://localhost:3000/api/aplicacoes | jq '.[] | {id, sigla, descricao}'
```

## 🔧 Como Preparar o Arquivo

### Opção 1: Edição Manual
1. Copie `aplicacoes-completas-exemplo.json`
2. Substitua cada `"NOTA: Substitua por UUID..."` pelos IDs reais
3. Execute: `./scripts/load-aplicacoes.sh seu-arquivo.json`

### Opção 2: Script de Substituição (Recomendado)

Crie um script auxiliar:

```bash
#!/bin/bash
# prepare-aplicacoes.sh

set -e

API_URL="http://localhost:3000"
INPUT="aplicacoes-completas-exemplo.json"
OUTPUT="aplicacoes-prontas.json"

echo "🔍 Buscando IDs..."

# Obter primeiro ID de cada entidade
TEC_ID=$(curl -s "$API_URL/api/tecnologias" | jq -r '.[0].id')
CAP_ID=$(curl -s "$API_URL/api/capacidades-negocio" | jq -r '.[0].id')
PROC_ID=$(curl -s "$API_URL/api/processos-negocio" | jq -r '.[0].id')
SLA_ID=$(curl -s "$API_URL/api/slas" | jq -r '.[0].id')
APP_ID=$(curl -s "$API_URL/api/aplicacoes" | jq -r '.[0].id')

echo "✓ Tecnologia ID: $TEC_ID"
echo "✓ Capacidade ID: $CAP_ID"
echo "✓ Processo ID: $PROC_ID"
echo "✓ SLA ID: $SLA_ID"
echo "✓ Aplicação ID (destino): $APP_ID"

# Substituir IDs
cp "$INPUT" "$OUTPUT"
sed -i.bak "s/\"tecnologiaId\": \"NOTA[^\"]*\"/\"tecnologiaId\": \"$TEC_ID\"/g" "$OUTPUT"
sed -i.bak "s/\"capacidadeId\": \"NOTA[^\"]*\"/\"capacidadeId\": \"$CAP_ID\"/g" "$OUTPUT"
sed -i.bak "s/\"processoId\": \"NOTA[^\"]*\"/\"processoId\": \"$PROC_ID\"/g" "$OUTPUT"
sed -i.bak "s/\"slaId\": \"NOTA[^\"]*\"/\"slaId\": \"$SLA_ID\"/g" "$OUTPUT"
sed -i.bak "s/\"aplicacaoDestinoId\": \"NOTA[^\"]*\"/\"aplicacaoDestinoId\": \"$APP_ID\"/g" "$OUTPUT"

rm -f "$OUTPUT.bak"

echo "✓ Arquivo preparado: $OUTPUT"
echo ""
echo "Execute: ./scripts/load-aplicacoes.sh data-templates/$OUTPUT"
```

Uso:
```bash
chmod +x prepare-aplicacoes.sh
./prepare-aplicacoes.sh
./scripts/load-aplicacoes.sh data-templates/aplicacoes-prontas.json
```

## 📋 Estrutura dos Relacionamentos

### Tecnologias
```json
"tecnologias": [
  {
    "tecnologiaId": "uuid-tecnologia",
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

### Ambientes
```json
"ambientes": [
  {
    "identificadorAplicacao": "portal",
    "tipoAmbiente": "PROD",
    "localizacaoRegiao": "sa-east-1",
    "urlAmbiente": "https://app.prod.com",
    "dataCriacao": "2024-01-15",
    "tempoLiberacao": 30,
    "status": "Ativo"
  }
]
```

**Campos obrigatórios:**
- `identificadorAplicacao`: Tipo de aplicação - valores: `portal`, `api`, `auth`, `erp`, `crm`, `etl`, `dw`, `mobile`, `batch`
- `tipoAmbiente`: Tipo de ambiente - valores: `DEV`, `QA`, `LAB`, `POC`, `SANDBOX`, `PROD`
- `localizacaoRegiao`: Localização ou região do ambiente (ex: us-east-1, sa-east-1) - texto livre até 20 caracteres
- `urlAmbiente`: URL do ambiente
- `dataCriacao`: Data de criação (YYYY-MM-DD)
- `tempoLiberacao`: Tempo de liberação em dias
- `status`: `Ativo` ou `Inativo`

### Capacidades de Negócio
```json
"capacidades": [
  {
    "capacidadeId": "uuid-capacidade",
    "grauCobertura": 85,
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

**grauCobertura**: Percentual de cobertura (0-100)

### Processos de Negócio
```json
"processos": [
  {
    "processoId": "uuid-processo",
    "tipoSuporte": "Operacional",
    "criticidade": "Alta",
    "dataInicio": "2024-01-15",
    "dataTermino": null,
    "status": "Ativo"
  }
]
```

**tipoSuporte**: `Operacional`, `Tático`, `Estratégico`
**criticidade**: `Muito Baixa`, `Baixa`, `Média`, `Alta`, `Muito Alta`

### Integrações
```json
"integracoes": [
  {
    "aplicacaoDestinoId": "uuid-outra-aplicacao",
    "tipoIntegracao": "API REST",
    "protocolo": "HTTPS",
    "frequencia": "Real-time",
    "descricao": "Sincronização de dados",
    "status": "Ativo"
  }
]
```

### SLAs
```json
"slas": [
  {
    "slaId": "uuid-sla",
    "descricao": "Disponibilidade 99.9%",
    "dataInicio": "2024-01-15",
    "dataTermino": "2024-12-31",
    "status": "Ativo"
  }
]
```

## ✅ Validação

Antes de executar a carga, valide o JSON:
```bash
jq empty seu-arquivo.json && echo "✓ JSON válido" || echo "✗ JSON inválido"
```

## 🚀 Execução

```bash
cd scripts
./load-aplicacoes.sh ../data-templates/aplicacoes-prontas.json
```

O script irá:
1. ✅ Validar o JSON
2. ✅ Verificar se o servidor está rodando
3. ✅ Mostrar contador de relacionamentos
4. ✅ Criar ou atualizar cada aplicação
5. ✅ Salvar todos os relacionamentos
6. ✅ Gerar log detalhado

## 📊 Verificação

Após a carga, verifique:

```bash
# Ver aplicação com relacionamentos
curl -s http://localhost:3000/api/aplicacoes/{id} | jq '{
  sigla,
  descricao,
  total_tecnologias: (.tecnologias | length),
  total_ambientes: (.ambientes | length),
  total_capacidades: (.capacidades | length),
  total_processos: (.processos | length),
  total_integracoes: (.integracoes | length),
  total_slas: (.slas | length)
}'
```

## 💡 Dicas

1. **Comece simples**: Teste primeiro com aplicação sem relacionamentos
2. **Um por vez**: Adicione um tipo de relacionamento por vez
3. **IDs válidos**: Sempre use IDs que existem nas tabelas referenciadas
4. **Datas**: Use formato ISO 8601 (YYYY-MM-DD)
5. **Status**: Sempre inicie com `"Ativo"`

## 🔗 Referências

- [Guia Completo de Aplicações](README-APLICACOES.md)
- [Script de Carga](../scripts/load-aplicacoes.sh)
- [API de Aplicações](../server/api.js)
