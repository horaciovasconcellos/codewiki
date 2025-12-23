# API REST - Habilidades

## Endpoint POST - Criar Nova Habilidade

### URL
```
POST http://localhost:3000/api/habilidades
```

### Headers
```
Content-Type: application/json
x-user-id: usuario-123
x-user-login: joao.silva
x-trace-id: trace-abc-123
```

### Corpo da Requisição (JSON)

```json
{
  "descricao": "React 18",
  "dominio": "Técnica",
  "subcategoria": "Frontend"
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `descricao` | string | ✅ Sim | Nome/descrição da habilidade |
| `dominio` | string | ❌ Não | Domínio da habilidade (Técnica, Comportamental, Gestão) |
| `subcategoria` | string | ✅ Sim | Subcategoria (Frontend, Backend, Comportamental, Gestão) |

### Mapeamento de Subcategorias

O servidor mapeia automaticamente as subcategorias para o tipo correto:

- **Técnica**: Frontend, Backend, Tecnica, ou domínio = "Tecnologia"
- **Comportamental**: Comportamental, ou domínio = "Soft Skills"  
- **Gestão**: Gestao, ou outros valores

### Resposta de Sucesso (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "sigla": "REACT-18",
  "descricao": "React 18",
  "dominio": "Tecnologia",
  "subcategoria": "Tecnica",
  "certificacoes": [],
  "createdAt": "2025-11-23T10:30:45.000Z",
  "updatedAt": "2025-11-23T10:30:45.000Z"
}
```

### Respostas de Erro

#### 400 Bad Request - Campos Faltando
```json
{
  "error": "Campos obrigatórios faltando",
  "code": "MISSING_FIELDS",
  "missing": ["descricao", "subcategoria"]
}
```

#### 409 Conflict - Habilidade Duplicada
```json
{
  "error": "Habilidade já existe",
  "code": "DUPLICATE"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Erro ao salvar dados",
  "code": "DATABASE_ERROR"
}
```

---

## Exemplos de Uso

### 1. Usando cURL

```bash
curl -X POST http://localhost:3000/api/habilidades \
  -H "Content-Type: application/json" \
  -H "x-user-login: joao.silva" \
  -d '{
    "descricao": "React 18",
    "dominio": "Técnica",
    "subcategoria": "Frontend"
  }'
```

### 2. Usando JavaScript (fetch)

```javascript
async function criarHabilidade() {
  const response = await fetch('http://localhost:3000/api/habilidades', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-login': 'joao.silva'
    },
    body: JSON.stringify({
      descricao: 'React 18',
      dominio: 'Técnica',
      subcategoria: 'Frontend'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro:', error);
    return;
  }

  const habilidade = await response.json();
  console.log('Habilidade criada:', habilidade);
  return habilidade;
}

criarHabilidade();
```

### 3. Usando Axios

```javascript
import axios from 'axios';

async function criarHabilidade() {
  try {
    const response = await axios.post('http://localhost:3000/api/habilidades', {
      descricao: 'React 18',
      dominio: 'Técnica',
      subcategoria: 'Frontend'
    }, {
      headers: {
        'x-user-login': 'joao.silva'
      }
    });

    console.log('Habilidade criada:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Erro:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

criarHabilidade();
```

### 4. Criar Múltiplas Habilidades

```javascript
const habilidades = [
  { descricao: 'React 18', dominio: 'Técnica', subcategoria: 'Frontend' },
  { descricao: 'Node.js', dominio: 'Técnica', subcategoria: 'Backend' },
  { descricao: 'Comunicação', dominio: 'Comportamental', subcategoria: 'Comportamental' },
  { descricao: 'Liderança', dominio: 'Gestão', subcategoria: 'Gestão' }
];

async function criarHabilidades(lista) {
  const resultados = [];
  
  for (const hab of lista) {
    try {
      const response = await fetch('http://localhost:3000/api/habilidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-login': 'sistema'
        },
        body: JSON.stringify(hab)
      });

      if (response.ok) {
        const data = await response.json();
        resultados.push({ sucesso: true, habilidade: data });
        console.log('✓ Criada:', hab.descricao);
      } else {
        const error = await response.json();
        resultados.push({ sucesso: false, erro: error, habilidade: hab });
        console.error('✗ Erro ao criar:', hab.descricao, error);
      }
    } catch (error) {
      resultados.push({ sucesso: false, erro: error.message, habilidade: hab });
      console.error('✗ Erro de conexão:', hab.descricao, error.message);
    }
  }

  return resultados;
}

criarHabilidades(habilidades).then(resultados => {
  const sucessos = resultados.filter(r => r.sucesso).length;
  const falhas = resultados.filter(r => !r.sucesso).length;
  console.log(`\nResumo: ${sucessos} criadas, ${falhas} falhas`);
});
```

### 5. React Component Example

```tsx
import { useState } from 'react';
import { toast } from 'sonner';

interface NovaHabilidadeForm {
  descricao: string;
  dominio: string;
  subcategoria: string;
}

export function CriarHabilidadeForm() {
  const [formData, setFormData] = useState<NovaHabilidadeForm>({
    descricao: '',
    dominio: 'Técnica',
    subcategoria: 'Frontend'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/habilidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-login': 'usuario-atual'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar habilidade');
        return;
      }

      const habilidade = await response.json();
      toast.success(`Habilidade "${habilidade.descricao}" criada com sucesso!`);
      
      // Limpar formulário
      setFormData({ descricao: '', dominio: 'Técnica', subcategoria: 'Frontend' });
    } catch (error) {
      toast.error('Erro de conexão com o servidor');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Descrição</label>
        <input
          type="text"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Ex: React 18"
          required
        />
      </div>

      <div>
        <label>Domínio</label>
        <select
          value={formData.dominio}
          onChange={(e) => setFormData({ ...formData, dominio: e.target.value })}
        >
          <option value="Técnica">Técnica</option>
          <option value="Comportamental">Comportamental</option>
          <option value="Gestão">Gestão</option>
        </select>
      </div>

      <div>
        <label>Subcategoria</label>
        <select
          value={formData.subcategoria}
          onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
          required
        >
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Comportamental">Comportamental</option>
          <option value="Gestão">Gestão</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Criando...' : 'Criar Habilidade'}
      </button>
    </form>
  );
}
```

---

## Outros Endpoints Relacionados

### GET - Listar Todas as Habilidades
```bash
curl http://localhost:3000/api/habilidades
```

### GET - Buscar Habilidade por ID
```bash
curl http://localhost:3000/api/habilidades/550e8400-e29b-41d4-a716-446655440000
```

### PUT - Atualizar Habilidade
```bash
curl -X PUT http://localhost:3000/api/habilidades/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "descricao": "React 19",
    "subcategoria": "Frontend"
  }'
```

### DELETE - Excluir Habilidade
```bash
curl -X DELETE http://localhost:3000/api/habilidades/550e8400-e29b-41d4-a716-446655440000
```

---

## Estrutura do Banco de Dados

```sql
CREATE TABLE habilidades (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo ENUM('Tecnica', 'Comportamental', 'Gestao') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_nome (nome)
);
```

---

## Logs de Auditoria

Todas as operações POST são registradas na tabela `logs_auditoria`:

```javascript
{
  "id": "01HQXYZ...",
  "log_timestamp": "2025-11-23T10:30:45.123Z",
  "user_login": "joao.silva",
  "operation_type": "INSERT",
  "entity_type": "habilidades",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "route": "/api/habilidades",
  "status_code": 201,
  "duration_ms": 45,
  "payload": { "descricao": "React 18", "subcategoria": "Frontend" },
  "new_values": { "id": "...", "descricao": "React 18", ... }
}
```

Consultar logs:
```bash
curl "http://localhost:3000/api/logs-auditoria?entityType=habilidades&operationType=INSERT"
```


curl -X POST \
  -F "arquivo=@/caminho/do/arquivo.pdf" \
  https://api.servidor.com/upload