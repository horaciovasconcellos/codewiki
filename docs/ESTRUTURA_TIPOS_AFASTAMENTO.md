# Estrutura de Dados: Tipos de Afastamento

## Estrutura da Tabela no Banco de Dados

```sql
CREATE TABLE tipos_afastamento (
    id                  VARCHAR(36) PRIMARY KEY,    -- UUID gerado automaticamente
    sigla               VARCHAR(10) NOT NULL UNIQUE, -- Código/sigla do tipo (ex: FER, ATM)
    descricao           VARCHAR(50) NOT NULL,        -- Nome do tipo de afastamento
    argumentacao_legal  VARCHAR(60) NOT NULL,        -- Base legal (CLT, lei, etc)
    numero_dias         INT NOT NULL,                -- Quantidade de dias permitidos
    tipo_tempo          CHAR(1) NOT NULL,            -- 'D' = Dias, 'M' = Meses, 'A' = Anos
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## JSON Esperado pela API

### POST /api/tipos-afastamento (Criar novo)

```json
{
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacao_legal": "Art. 129 da CLT",
  "numero_dias": 30,
  "tipo_tempo": "D"
}
```

### PUT /api/tipos-afastamento/:id (Atualizar existente)

```json
{
  "sigla": "FER",
  "descricao": "Férias Anuais",
  "argumentacao_legal": "Art. 129 da CLT",
  "numero_dias": 30,
  "tipo_tempo": "D"
}
```

### Resposta da API (GET/POST/PUT)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacao_legal": "Art. 129 da CLT",
  "numero_dias": 30,
  "tipo_tempo": "D",
  "createdAt": "2025-11-23T12:00:00.000Z",
  "updatedAt": "2025-11-23T12:00:00.000Z"
}
```

## Campos Detalhados

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| **id** | UUID | Auto | Identificador único (gerado pelo sistema) | `"a1b2c3d4-..."` |
| **sigla** | String(10) | ✅ Sim | Código/sigla único do tipo de afastamento | `"FER"`, `"ATM"`, `"LM"` |
| **descricao** | String(50) | ✅ Sim | Nome descritivo do tipo de afastamento | `"Férias"`, `"Atestado Médico"` |
| **argumentacao_legal** | String(60) | ✅ Sim | Base legal (artigo de lei, CLT, etc) | `"Art. 129 da CLT"` |
| **numero_dias** | Integer | ✅ Sim | Quantidade de dias/meses/anos permitidos | `30`, `120`, `1` |
| **tipo_tempo** | Char(1) | ✅ Sim | Unidade de tempo: `'D'` = Dias, `'M'` = Meses, `'A'` = Anos | `"D"`, `"M"`, `"A"` |
| **createdAt** | Timestamp | Auto | Data/hora de criação (retornado pela API) | `"2025-11-23T12:00:00.000Z"` |
| **updatedAt** | Timestamp | Auto | Data/hora da última atualização | `"2025-11-23T12:00:00.000Z"` |

## Exemplos Completos

### 1. Férias (30 dias)
```json
{
  "sigla": "FER",
  "descricao": "Férias",
  "argumentacao_legal": "Art. 129 da CLT",
  "numero_dias": 30,
  "tipo_tempo": "D"
}
```

### 2. Licença Maternidade (4 meses)
```json
{
  "sigla": "LM",
  "descricao": "Licença Maternidade",
  "argumentacao_legal": "Art. 392 da CLT",
  "numero_dias": 4,
  "tipo_tempo": "M"
}
```

### 3. Licença Paternidade (5 dias)
```json
{
  "sigla": "LP",
  "descricao": "Licença Paternidade",
  "argumentacao_legal": "Art. 473, III da CLT e Art. 10 ADCT CF",
  "numero_dias": 5,
  "tipo_tempo": "D"
}
```

### 4. Atestado Médico (até 15 dias)
```json
{
  "sigla": "ATM",
  "descricao": "Atestado Médico",
  "argumentacao_legal": "Art. 60 da Lei 8.213/91",
  "numero_dias": 15,
  "tipo_tempo": "D"
}
```

### 5. Luto (3 dias)
```json
{
  "sigla": "LUT",
  "descricao": "Luto/Falecimento",
  "argumentacao_legal": "Art. 473, I da CLT",
  "numero_dias": 3,
  "tipo_tempo": "D"
}
```

### 6. Casamento (3 dias)
```json
{
  "sigla": "CAS",
  "descricao": "Licença Casamento",
  "argumentacao_legal": "Art. 473, II da CLT",
  "numero_dias": 3,
  "tipo_tempo": "D"
}
```

### 7. Doação de Sangue (1 dia)
```json
{
  "sigla": "DSG",
  "descricao": "Doação de Sangue",
  "argumentacao_legal": "Art. 473, IV da CLT",
  "numero_dias": 1,
  "tipo_tempo": "D"
}
```

## Validações

### Regras de Negócio:
- ✅ **sigla**: Deve ser única, máximo 10 caracteres, letras maiúsculas
- ✅ **descricao**: Mínimo 3 caracteres, máximo 50 caracteres
- ✅ **argumentacao_legal**: Obrigatório, máximo 60 caracteres
- ✅ **numero_dias**: Deve ser número inteiro positivo > 0
- ✅ **tipo_tempo**: Deve ser exatamente 'D', 'M' ou 'A'

### Códigos de Erro:

```json
// Campos obrigatórios faltando
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["sigla", "descricao"]
}

// Sigla duplicada
{
  "error": "Tipo de afastamento já existe",
  "code": "DUPLICATE"
}

// Registro não encontrado
{
  "error": "Tipo de afastamento não encontrado",
  "code": "NOT_FOUND"
}
```

## Arquivo de Carga em Lote (JSON Array)

Para carga em lote usando o script `load-tipos-afastamento.sh`:

```json
[
  {
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacao_legal": "Art. 129 da CLT",
    "numero_dias": 30,
    "tipo_tempo": "D"
  },
  {
    "sigla": "ATM",
    "descricao": "Atestado Médico",
    "argumentacao_legal": "Art. 60 da Lei 8.213/91",
    "numero_dias": 15,
    "tipo_tempo": "D"
  },
  {
    "sigla": "LM",
    "descricao": "Licença Maternidade",
    "argumentacao_legal": "Art. 392 da CLT",
    "numero_dias": 4,
    "tipo_tempo": "M"
  }
]
```

## Exemplos de Uso da API

### cURL - Criar novo tipo
```bash
curl -X POST http://localhost:3000/api/tipos-afastamento \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "FER",
    "descricao": "Férias",
    "argumentacao_legal": "Art. 129 da CLT",
    "numero_dias": 30,
    "tipo_tempo": "D"
  }'
```

### cURL - Atualizar existente
```bash
curl -X PUT http://localhost:3000/api/tipos-afastamento/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "sigla": "FER",
    "descricao": "Férias Anuais",
    "argumentacao_legal": "Art. 129 da CLT",
    "numero_dias": 30,
    "tipo_tempo": "D"
  }'
```

### JavaScript/Fetch - Criar novo tipo
```javascript
const novoTipo = {
  sigla: "FER",
  descricao: "Férias",
  argumentacao_legal: "Art. 129 da CLT",
  numero_dias: 30,
  tipo_tempo: "D"
};

const response = await fetch('http://localhost:3000/api/tipos-afastamento', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoTipo)
});

const resultado = await response.json();
console.log(resultado);
```
