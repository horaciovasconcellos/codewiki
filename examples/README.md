# Exemplos de Uso - API de Carga em Lote

Este diretório contém exemplos práticos de uso da API de carga em lote (bulk load) do Sistema de Auditoria.

## 📁 Arquivos Disponíveis

### `bulk-load-aplicacoes-example.json`

Arquivo JSON de exemplo contendo 2 aplicações completas com todas as suas entidades relacionadas:

1. **SAP-ERP**: Sistema ERP da SAP com:
   - 3 ambientes (Produção, Quality, Desenvolvimento)
   - 2 tecnologias
   - 2 capacidades de negócio
   - 2 processos
   - 1 integração
   - 1 SLA

2. **CRM-SFDC**: Salesforce CRM com:
   - 1 ambiente (Produção)
   - 1 tecnologia
   - 1 capacidade de negócio
   - 1 processo
   - 0 integrações
   - 1 SLA

## 🚀 Como Usar

### Método 1: Script Automatizado

Execute o script de teste fornecido na raiz do projeto:

```bash
./test-bulk-load.sh
```

Este script irá:
1. Verificar se o servidor está rodando
2. Carregar o arquivo de exemplo
3. Enviar para a API
4. Exibir os resultados formatados

### Método 2: cURL Manual

```bash
curl -X POST http://localhost:3000/api/aplicacoes/bulk \
  -H "Content-Type: application/json" \
  -d @examples/bulk-load-aplicacoes-example.json | jq
```

### Método 3: JavaScript/Node.js

```javascript
const fs = require('fs');
const fetch = require('node-fetch');

const data = JSON.parse(fs.readFileSync('examples/bulk-load-aplicacoes-example.json', 'utf8'));

fetch('http://localhost:3000/api/aplicacoes/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => console.error('Erro:', error));
```

### Método 4: Python

```python
import json
import requests

with open('examples/bulk-load-aplicacoes-example.json', 'r') as f:
    data = json.load(f)

response = requests.post(
    'http://localhost:3000/api/aplicacoes/bulk',
    json=data
)

print(json.dumps(response.json(), indent=2))
```

## 📝 Estrutura do JSON

### Aplicação Completa

Cada aplicação no array deve conter:

```json
{
  "sigla": "SIGLA-APP",           // Obrigatório - Identificador único (max 10 chars)
  "descricao": "Descrição",       // Obrigatório - Nome descritivo (max 50 chars)
  "url_documentacao": "https://", // Obrigatório - URL da documentação
  "fase_ciclo_vida": "Produção",  // Obrigatório - Fase atual do sistema
  "criticidade_negocio": "Alta",  // Obrigatório - Criticidade para o negócio
  
  // Campos opcionais
  "categoria_sistema": "ERP",
  "fornecedor": "Nome do Fornecedor",
  "tipo_hospedagem": "Cloud",
  "custo_mensal": 10000.00,
  "numero_usuarios": 500,
  "data_implantacao": "2020-01-15",
  "versao_atual": "1.0.0",
  "responsavel_tecnico": "Nome Responsável",
  "responsavel_negocio": "Nome Gestor",
  "status_operacional": "Operacional",
  "observacoes": "Observações relevantes",
  
  // Entidades relacionadas (arrays opcionais)
  "ambientes": [...],
  "tecnologias": [...],
  "capacidades": [...],
  "processos": [...],
  "integracoes": [...],
  "slas": [...]
}
```

## ⚠️ Pré-requisitos Importantes

Antes de executar a carga em lote, **OBRIGATORIAMENTE** você deve ter cadastrado:

1. **Tecnologias** - IDs referenciados em `tecnologias[].tecnologia_id`
2. **Capacidades** - IDs referenciados em `capacidades[].capacidade_id`
3. **Processos** - IDs referenciados em `processos[].processo_id`
4. **SLAs** - IDs referenciados em `slas[].sla_id`
5. **Aplicações Destino** - IDs referenciados em `integracoes[].aplicacao_destino_id`

### Exemplo de Preparação

```bash
# 1. Cadastrar tecnologias necessárias
curl -X POST http://localhost:3000/api/tecnologias \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tech-001",
    "nome": "SAP ECC",
    "categoria": "ERP"
  }'

# 2. Cadastrar capacidades
curl -X POST http://localhost:3000/api/capacidades \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cap-001",
    "nome": "Gestão Financeira",
    "dominio": "Financeiro"
  }'

# 3. Depois executar a carga em lote
./test-bulk-load.sh
```

## 📊 Formato da Resposta

### Sucesso Total

```json
{
  "message": "Carga em lote realizada com sucesso",
  "summary": {
    "total": 2,
    "sucesso": 2,
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
        "capacidades": 2,
        "processos": 2,
        "integracoes": 1,
        "slas": 1
      }
    },
    {
      "sigla": "CRM-SFDC",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "totals": {
        "ambientes": 1,
        "tecnologias": 1,
        "capacidades": 1,
        "processos": 1,
        "integracoes": 0,
        "slas": 1
      }
    }
  ]
}
```

### Sucesso Parcial (com erros)

```json
{
  "message": "Carga em lote concluída com erros",
  "summary": {
    "total": 2,
    "sucesso": 1,
    "falhas": 1
  },
  "results": [
    {
      "sigla": "SAP-ERP",
      "status": "success",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "totals": { ... }
    },
    {
      "sigla": "CRM-SFDC",
      "status": "error",
      "error": "Sigla já existe no sistema"
    }
  ]
}
```

## 🔍 Validações Realizadas

A API valida automaticamente:

- ✅ Unicidade da sigla de aplicação
- ✅ Existência de IDs referenciados (tecnologias, capacidades, processos, SLAs)
- ✅ Formatos de data (YYYY-MM-DD)
- ✅ Valores numéricos válidos
- ✅ Tamanhos máximos de campos
- ✅ Campos obrigatórios preenchidos

## 💡 Dicas e Boas Práticas

1. **Teste com Dados Pequenos**: Comece com 1-2 aplicações para validar
2. **Verifique IDs**: Certifique-se que todos os IDs referenciados existem
3. **Use Transações**: Cada aplicação é uma transação independente
4. **Monitore Logs**: Acompanhe os logs do servidor para debugging
5. **Valide JSON**: Use um validador JSON antes de enviar
6. **Backup**: Faça backup do banco antes de cargas grandes

## 🛠️ Troubleshooting

### Erro: "Campos obrigatórios faltando"
**Solução**: Verifique se todos os campos obrigatórios estão preenchidos.

### Erro: "Sigla já existe no sistema"
**Solução**: Use uma sigla diferente ou delete a aplicação existente.

### Erro: "Foreign key constraint fails"
**Solução**: Cadastre as entidades referenciadas (tecnologias, capacidades, etc.) antes.

### Erro de conexão
**Solução**: Verifique se o servidor está rodando com `docker-compose ps`.

## 📚 Documentação Completa

Para documentação detalhada da API, consulte:
- `docs/API-Bulk-Load-Aplicacoes.md` - Documentação completa da API
- `docs/CONFIGURACAO_BD.md` - Estrutura do banco de dados

## 🤝 Contribuindo

Para adicionar novos exemplos, siga o padrão:
1. Crie um arquivo JSON válido
2. Documente o propósito do exemplo
3. Adicione instruções de uso neste README
4. Teste o exemplo antes de commitar

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Consulte a documentação em `docs/`
2. Verifique os logs do servidor
3. Abra uma issue no repositório do projeto
