# Exemplo: Criação de Tipo de Afastamento via API

## 📋 Endpoint

```
POST /api/tipos-afastamento
```

## 📝 Estrutura do Tipo de Afastamento

### Interface TypeScript
```typescript
interface TipoAfastamento {
  id: string;                    // UUID (gerado automaticamente pelo servidor)
  sigla: string;                 // 3 caracteres alfanuméricos
  descricao: string;             // Até 50 caracteres
  argumentacaoLegal: string;     // Até 60 caracteres
  numeroDias: number;            // Entre 1 e 99
  tipoTempo: 'C' | 'N';         // C = Consecutivo, N = Não Consecutivo
}
```

### Tipo de Tempo
- **`C` (Consecutivo)**: Dias corridos, sem interrupção
- **`N` (Não Consecutivo)**: Dias intercalados, podem ser usados separadamente

## 🔧 Validações

| Campo | Validação | Exemplo |
|-------|-----------|---------|
| `sigla` | Exatamente 3 caracteres alfanuméricos | `FER`, `LM1`, `LP2` |
| `descricao` | Máximo 50 caracteres | `Férias Anuais` |
| `argumentacaoLegal` | Máximo 60 caracteres | `Lei 5.452/1943 (CLT) Art. 129` |
| `numeroDias` | Número entre 1 e 99 | `30`, `15`, `180` |
| `tipoTempo` | Apenas `C` ou `N` | `C` |

> ⚠️ **Importante**: A sigla deve ser única no sistema.

---

## 💻 Exemplos de Requisição

### 1. cURL (Terminal)

```bash
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
    "numeroDias": 30,
    "tipoTempo": "C"
  }'
```

### 2. JavaScript/Fetch (Browser/Node.js)

```javascript
const criarTipoAfastamento = async () => {
  try {
    const response = await fetch('http://localhost:5173/api/tipos-afastamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sigla: 'LIC-MED',
        descricao: 'Licença Médica',
        argumentacaoLegal: 'Lei 8.213/1991 Art. 60',
        numeroDias: 15,
        tipoTempo: 'C'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Tipo criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro ao criar tipo:', error);
    throw error;
  }
};

// Executar
criarTipoAfastamento();
```

### 3. Axios (JavaScript/TypeScript)

```typescript
import axios from 'axios';

interface NovoTipoAfastamento {
  sigla: string;
  descricao: string;
  argumentacaoLegal: string;
  numeroDias: number;
  tipoTempo: 'C' | 'N';
}

const criarTipoAfastamento = async (dados: NovoTipoAfastamento) => {
  try {
    const response = await axios.post(
      'http://localhost:5173/api/tipos-afastamento',
      dados,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Tipo criado:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Erro na API:', error.response?.data);
      throw error.response?.data;
    }
    throw error;
  }
};

// Uso
criarTipoAfastamento({
  sigla: 'LIC-MAT',
  descricao: 'Licença Maternidade',
  argumentacaoLegal: 'Lei 11.770/2008 Art. 1º',
  numeroDias: 180,
  tipoTempo: 'C'
});
```

### 4. Python (requests)

```python
import requests
import json

def criar_tipo_afastamento():
    url = "http://localhost:5173/api/tipos-afastamento"
    
    payload = {
        "sigla": "LIC-PAT",
        "descricao": "Licença Paternidade",
        "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
        "numeroDias": 20,
        "tipoTempo": "C"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        print("Tipo criado com sucesso:")
        print(json.dumps(response.json(), indent=2))
        return response.json()
        
    except requests.exceptions.HTTPError as e:
        print(f"Erro HTTP: {e}")
        print(f"Resposta: {e.response.text}")
    except Exception as e:
        print(f"Erro: {e}")

# Executar
criar_tipo_afastamento()
```

### 5. Postman

**Método**: `POST`  
**URL**: `http://localhost:5173/api/tipos-afastamento`

**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "sigla": "LNR",
  "descricao": "Licença Não Remunerada",
  "argumentacaoLegal": "CCT 2024/2025 Cláusula 15",
  "numeroDias": 90,
  "tipoTempo": "N"
}
```

---

## ✅ Resposta de Sucesso (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
  "numeroDias": 30,
  "tipoTempo": "C"
}
```

> 💡 **Nota**: O campo `id` é gerado automaticamente pelo servidor (UUID v4).

---

## ❌ Possíveis Erros

### 1. Sigla Duplicada (409 Conflict)

```json
{
  "error": "Sigla já cadastrada",
  "code": "DUPLICATE_SIGLA",
  "field": "sigla"
}
```

### 2. Validação Falhou (400 Bad Request)

```json
{
  "error": "Dados inválidos",
  "code": "VALIDATION_ERROR",
  "details": {
    "sigla": "Sigla deve conter exatamente 3 caracteres alfanuméricos",
    "numeroDias": "Número de dias deve estar entre 1 e 99"
  }
}
```

### 3. Campos Obrigatórios Faltando (400 Bad Request)

```json
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["sigla", "descricao"]
}
```

---

## 📊 Exemplos Práticos

### Exemplo 1: Férias
```json
{
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacaoLegal": "Lei 5.452/1943 (CLT) Art. 129",
  "numeroDias": 30,
  "tipoTempo": "C"
}
```

### Exemplo 2: Licença Médica
```json
{
  "sigla": "LM",
  "descricao": "Licença Médica",
  "argumentacaoLegal": "Lei 8.213/1991 Art. 60",
  "numeroDias": 15,
  "tipoTempo": "C"
}
```

### Exemplo 3: Licença Maternidade
```json
{
  "sigla": "LMT",
  "descricao": "Licença Maternidade",
  "argumentacaoLegal": "Lei 11.770/2008 Art. 1º",
  "numeroDias": 180,
  "tipoTempo": "C"
}
```

### Exemplo 4: Licença Paternidade
```json
{
  "sigla": "LPT",
  "descricao": "Licença Paternidade",
  "argumentacaoLegal": "Lei 13.257/2016 Art. 38",
  "numeroDias": 20,
  "tipoTempo": "C"
}
```

### Exemplo 5: Banco de Horas (Não Consecutivo)
```json
{
  "sigla": "BH",
  "descricao": "Banco de Horas",
  "argumentacaoLegal": "CCT 2024/2025 Cláusula 22",
  "numeroDias": 10,
  "tipoTempo": "N"
}
```

---

## 🧪 Teste Completo (JavaScript)

```javascript
// Função auxiliar para criar tipo com validação
async function criarTipoComValidacao(dados) {
  // Validações locais antes do envio
  if (!dados.sigla || dados.sigla.length !== 3) {
    throw new Error('Sigla deve ter exatamente 3 caracteres');
  }
  
  if (!dados.descricao || dados.descricao.length > 50) {
    throw new Error('Descrição é obrigatória e deve ter até 50 caracteres');
  }
  
  if (!dados.argumentacaoLegal || dados.argumentacaoLegal.length > 60) {
    throw new Error('Argumentação Legal é obrigatória e deve ter até 60 caracteres');
  }
  
  if (!dados.numeroDias || dados.numeroDias < 1 || dados.numeroDias > 99) {
    throw new Error('Número de dias deve estar entre 1 e 99');
  }
  
  if (!['C', 'N'].includes(dados.tipoTempo)) {
    throw new Error('Tipo de tempo deve ser C ou N');
  }
  
  // Enviar para API
  const response = await fetch('http://localhost:5173/api/tipos-afastamento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar tipo');
  }
  
  return await response.json();
}

// Testes
const tiposParaTestar = [
  {
    sigla: 'FER',
    descricao: 'Férias',
    argumentacaoLegal: 'Lei 5.452/1943 (CLT) Art. 129',
    numeroDias: 30,
    tipoTempo: 'C'
  },
  {
    sigla: 'LM',
    descricao: 'Licença Médica',
    argumentacaoLegal: 'Lei 8.213/1991 Art. 60',
    numeroDias: 15,
    tipoTempo: 'C'
  }
];

// Executar testes em sequência
async function executarTestes() {
  for (const tipo of tiposParaTestar) {
    try {
      const resultado = await criarTipoComValidacao(tipo);
      console.log('✅ Sucesso:', resultado);
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  }
}

executarTestes();
```

---

## 🔗 Operações Relacionadas

Após criar o tipo de afastamento, você pode:

1. **Listar todos**: `GET /api/tipos-afastamento`
2. **Consultar específico**: `GET /api/tipos-afastamento/{id}`
3. **Atualizar**: `PUT /api/tipos-afastamento/{id}`
4. **Excluir**: `DELETE /api/tipos-afastamento/{id}`
5. **Usar em afastamento de colaborador**: `POST /api/colaboradores/{id}/afastamentos`

---

## 📚 Documentação Adicional

- [Documentação Completa da API](./DOCUMENTACAO_API.md)
- [Manual de Instalação](./MANUAL_INSTALACAO.md)
- [Quick Start](../QUICKSTART.md)

---

## 💡 Dicas

1. **Siglas Padronizadas**: Use siglas curtas e descritivas (ex: FER, LM, LMT)
2. **Argumentação Legal**: Sempre inclua a base legal específica
3. **Tipo Consecutivo**: Use para afastamentos que devem ser usados de uma vez
4. **Tipo Não Consecutivo**: Use para bancos de horas ou folgas intercaladas
5. **Número de Dias**: Considere a legislação e políticas internas

---

## 🚀 Execução Rápida

```bash
# Via cURL - Criar Férias
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{"sigla":"BH","descricao":"Banco de Horas","argumentacaoLegal":"CCT 2024/2025 Cláusula 22","numeroDias":10,"tipoTempo":"N"}'

# Listar todos
curl http://localhost:5173/api/tipos-afastamento | jq
```

**Portas do sistema**:
- **Frontend Vite**: 5173 (http://localhost:5173)
- **API Backend**: 3000 (proxy via frontend)
- **Acesso API**: Use sempre a porta 5173 (http://localhost:5173/api/...)

> ✅ **Status**: API funcionando! O servidor Express está rodando e o Vite faz proxy das requisições `/api/*` para o backend na porta 3000.
