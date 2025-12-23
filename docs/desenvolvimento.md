# Guia de Desenvolvimento

Este documento fornece informações técnicas para desenvolvedores que trabalham no Sistema de Auditoria.

## Estrutura do Projeto

```
sistema-de-auditoria/
├── src/                          # Código-fonte frontend
│   ├── components/               # Componentes React
│   │   ├── colaboradores/        # Módulo colaboradores
│   │   ├── tecnologias/          # Módulo tecnologias
│   │   ├── aplicacoes/           # Módulo aplicações
│   │   ├── processos/            # Módulo processos
│   │   ├── habilidades/          # Módulo habilidades
│   │   ├── slas/                 # Módulo SLAs
│   │   ├── runbooks/             # Módulo runbooks
│   │   ├── tokens/               # Módulo tokens
│   │   ├── gerador-projetos/     # Gerador de projetos
│   │   └── ui/                   # Componentes UI compartilhados
│   ├── hooks/                    # Custom hooks
│   │   ├── use-local-storage.ts  # Hook de persistência local
│   │   ├── use-logging.ts        # Hook de logging
│   │   └── use-mobile.ts         # Hook de detecção mobile
│   ├── lib/                      # Utilitários e serviços
│   │   ├── types.ts              # Definições de tipos
│   │   ├── utils.ts              # Funções auxiliares
│   │   ├── logging-service.ts    # Serviço de logging
│   │   └── logging-types.ts      # Tipos de logging
│   └── styles/                   # Estilos globais
├── database/                     # Configurações de banco
│   ├── init-master.sql           # Script inicial Master
│   ├── master.cnf                # Config MySQL Master
│   ├── slave.cnf                 # Config MySQL Slave
│   └── setup-replication.sh      # Script de replicação
├── scripts/                      # Scripts SQL
│   ├── create-tables.sql         # DDL completo
│   ├── load-data.sql             # Carga inicial
│   └── export-data.sh            # Exportação de dados
├── data-templates/               # Templates de dados
├── docs/                         # Documentação MkDocs
├── docker-compose.yml            # Orquestração containers
├── Dockerfile                    # Imagem da aplicação
├── vite.config.ts                # Configuração Vite
├── tailwind.config.js            # Configuração Tailwind
└── tsconfig.json                 # Configuração TypeScript
```

---

## Stack Tecnológico

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19 | Framework UI |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool e dev server |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui | Latest | Componentes UI |
| Phosphor Icons | 2.x | Ícones |
| Recharts | 2.x | Gráficos e dashboards |

### Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| Express | 4.x | Framework web |
| MySQL | 8.0 | Banco de dados relacional |
| Multer | 1.x | Upload de arquivos |

### Infraestrutura

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Docker | 20.10+ | Containerização |
| Docker Compose | 2.0+ | Orquestração |
| MySQL Replication | Master-Slave | Alta disponibilidade |

---

## Padrões de Código

### Nomenclatura de Componentes

```typescript
// ✅ Componentes: PascalCase
export function ColaboradorForm() { ... }
export function TecnologiasDataTable() { ... }

// ✅ Arquivos de componente: PascalCase.tsx
// ColaboradorForm.tsx
// TecnologiasDataTable.tsx

// ✅ Hooks: camelCase com prefixo 'use'
export function useLocalStorage() { ... }
export function useLogging() { ... }

// ✅ Utilitários: camelCase
export function formatDate() { ... }
export function validateCPF() { ... }

// ✅ Tipos/Interfaces: PascalCase
export interface Colaborador { ... }
export type TipoAfastamento = { ... }
```

### Estrutura de Módulos

Cada módulo segue padrão consistente:

```
colaboradores/
├── ColaboradoresView.tsx         # View principal (listagem)
├── ColaboradoresDataTable.tsx    # Tabela de dados
├── ColaboradorForm.tsx           # Formulário (criar/editar)
├── ColaboradorDetails.tsx        # Visualização detalhada
└── types.ts                      # Tipos específicos
```

### Componentes de View

```typescript
// ✅ Padrão de View
export function ColaboradoresView() {
  const [data, setData] = useLocalStorage<Colaborador[]>('colaboradores', []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Colaborador | null>(null);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Colaboradores</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      <ColaboradoresDataTable
        data={data}
        onEdit={(item) => {
          setSelectedItem(item);
          setIsFormOpen(true);
        }}
        onView={(item) => setSelectedItem(item)}
        onDelete={(id) => handleDelete(id)}
      />

      <ColaboradorForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        colaborador={selectedItem}
        onSave={(colaborador) => handleSave(colaborador)}
      />
    </div>
  );
}
```

---

## Persistência de Dados

### Hook useLocalStorage

Substitui o antigo `useKV` do GitHub Spark:

```typescript
// src/hooks/use-local-storage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Lê do localStorage
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Salva no localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

**Uso:**

```typescript
// ✅ Simples
const [colaboradores, setColaboradores] = useLocalStorage<Colaborador[]>(
  'colaboradores',
  []
);

// ✅ Com callback
setColaboradores((prev) => [...prev, novoColaborador]);

// ✅ Substituição completa
setColaboradores(novosColaboradores);
```

---

## Sistema de Logging

### Hook useLogging

```typescript
import { useLogging } from '@/hooks/use-logging';

export function MeuComponente() {
  const { logInfo, logError, logWarning } = useLogging();

  const handleSave = async (data) => {
    try {
      logInfo('Salvando colaborador', { matricula: data.matricula });
      await api.post('/colaboradores', data);
      logInfo('Colaborador salvo com sucesso');
    } catch (error) {
      logError('Erro ao salvar colaborador', error);
    }
  };

  return <div>...</div>;
}
```

### Níveis de Log

| Nível | Método | Uso |
|-------|--------|-----|
| INFO | `logInfo()` | Operações normais |
| WARNING | `logWarning()` | Situações atípicas |
| ERROR | `logError()` | Erros e exceções |
| DEBUG | `logDebug()` | Debugging detalhado |

---

## Validações

### Validação de Formulários

```typescript
// ✅ Validação inline
const validateSigla = (value: string): string | null => {
  if (!/^[A-Za-z0-9-]{2,15}$/.test(value)) {
    return 'Sigla deve ter entre 2 e 15 caracteres alfanuméricos';
  }
  if (siglaJaExiste(value)) {
    return 'Sigla já cadastrada';
  }
  return null;
};

// ✅ Uso no componente
const [siglaError, setSiglaError] = useState<string | null>(null);

<Input
  value={sigla}
  onChange={(e) => {
    setSigla(e.target.value);
    setSiglaError(validateSigla(e.target.value));
  }}
  error={siglaError}
/>
```

### Validações Comuns

```typescript
// src/lib/validators.ts

export const validators = {
  matricula: (value: string) => /^\d+$/.test(value) && value.length > 0,
  
  cpf: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 11 && validarDigitosCPF(cleaned);
  },
  
  email: (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  data: (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)),
  
  dateRange: (inicio: string, fim: string) =>
    new Date(fim) > new Date(inicio),
};
```

---

## Integração com API

### Client HTTP

```typescript
// src/lib/api-client.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  post: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  put: async <T>(endpoint: string, data: unknown): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  delete: async (endpoint: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  },
};
```

### Uso

```typescript
import { api } from '@/lib/api-client';

// ✅ GET
const colaboradores = await api.get<Colaborador[]>('/colaboradores');

// ✅ POST
const novo = await api.post<Colaborador>('/colaboradores', {
  matricula: '5664',
  nome: 'João Silva',
});

// ✅ PUT
const atualizado = await api.put<Colaborador>('/colaboradores/123', {
  nome: 'João Silva Santos',
});

// ✅ DELETE
await api.delete('/colaboradores/123');
```

---

## Componentes shadcn/ui

### Componentes Instalados

- `Button` - Botões com variantes
- `Dialog` - Modais e dialogs
- `Input` - Campos de texto
- `Select` - Dropdowns
- `Table` - Tabelas de dados
- `Card` - Containers de conteúdo
- `Badge` - Tags e status
- `Alert` - Alertas e notificações
- `Tabs` - Navegação por abas
- `Separator` - Divisores visuais
- `Checkbox` - Checkboxes
- `RadioGroup` - Radio buttons
- `Label` - Labels de formulário

### Customizações

```typescript
// ✅ Button variants
<Button variant="default">Salvar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="ghost">Fechar</Button>

// ✅ Sizes
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>

// ✅ Badge variants
<Badge variant="default">Ativo</Badge>
<Badge variant="destructive">Demitido</Badge>
<Badge variant="outline">Pendente</Badge>
```

---

## Banco de Dados

### Estrutura de Tabelas

#### tipos_afastamento

```sql
CREATE TABLE tipos_afastamento (
    id VARCHAR(36) PRIMARY KEY,
    sigla VARCHAR(10) UNIQUE NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    argumentacao_legal VARCHAR(60) NOT NULL,
    numero_dias INT NOT NULL CHECK (numero_dias BETWEEN 1 AND 99),
    tipo_tempo CHAR(1) NOT NULL CHECK (tipo_tempo IN ('C', 'N'))
);
```

#### colaboradores

```sql
CREATE TABLE colaboradores (
    id VARCHAR(36) PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    setor VARCHAR(50) NOT NULL,
    data_admissao DATE NOT NULL,
    data_demissao DATE,
    CONSTRAINT chk_demissao CHECK (data_demissao IS NULL OR data_demissao > data_admissao)
);
```

#### afastamentos

```sql
CREATE TABLE afastamentos (
    id VARCHAR(36) PRIMARY KEY,
    colaborador_id VARCHAR(36) NOT NULL,
    tipo_afastamento_id VARCHAR(36) NOT NULL,
    data_inicial_provavel DATE NOT NULL,
    data_final_provavel DATE NOT NULL,
    data_inicial_efetiva DATE,
    data_final_efetiva DATE,
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_afastamento_id) REFERENCES tipos_afastamento(id),
    CONSTRAINT chk_provavel CHECK (data_final_provavel > data_inicial_provavel),
    CONSTRAINT chk_efetiva CHECK (data_final_efetiva IS NULL OR data_final_efetiva > data_inicial_efetiva)
);
```

### Scripts de Carga

Localização: `/scripts`

```bash
# Criar todas as tabelas
mysql -h localhost -u root -p auditoria_db < scripts/create-tables.sql

# Carregar dados iniciais
mysql -h localhost -u root -p auditoria_db < scripts/load-data.sql

# Exportar dados
./scripts/export-data.sh
```

---

## Docker

### Containers

```yaml
services:
  mysql-master:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: auditoria_db

  mysql-slave:
    image: mysql:8.0
    ports:
      - "3307:3306"
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123

  auditoria-app:
    build: .
    ports:
      - "5173:5173"  # Frontend Vite
      - "3000:3000"  # Backend API
    depends_on:
      - mysql-master
    environment:
      DB_HOST: mysql-master
      DB_PORT: 3306
```

### Comandos Úteis

```bash
# Build e start
docker compose up -d --build

# Ver logs
docker compose logs -f auditoria-app

# Executar comando no container
docker exec -it auditoria-app sh

# Parar containers
docker compose down

# Parar e remover volumes (CUIDADO)
docker compose down -v

# Conectar ao MySQL
docker exec -it mysql-master mysql -uroot -prootpass123 auditoria_db
```

---

## Testes

### Estrutura de Testes

```typescript
// ✅ Teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { ColaboradorForm } from './ColaboradorForm';

describe('ColaboradorForm', () => {
  it('deve renderizar campos obrigatórios', () => {
    render(<ColaboradorForm open={true} onSave={() => {}} />);
    
    expect(screen.getByLabelText('Matrícula')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Setor')).toBeInTheDocument();
  });

  it('deve validar matrícula vazia', async () => {
    render(<ColaboradorForm open={true} onSave={() => {}} />);
    
    const salvarBtn = screen.getByText('Salvar');
    fireEvent.click(salvarBtn);
    
    expect(await screen.findByText('Matrícula é obrigatória')).toBeInTheDocument();
  });
});
```

### Executar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Build e Deploy

### Build de Produção

```bash
# Instalar dependências
npm install

# Build frontend
npm run build

# Preview build
npm run preview
```

### Variáveis de Ambiente

Criar `.env.production`:

```env
VITE_API_URL=https://api.empresa.com.br
DB_HOST=mysql-prod.empresa.com.br
DB_PORT=3306
DB_USER=auditoria_app
DB_PASSWORD=senha_segura
DB_NAME=auditoria_db
```

---

## Troubleshooting

### Problema: Containers não iniciam

**Solução:**

```bash
# Ver logs detalhados
docker compose logs

# Verificar portas em uso
lsof -i :3306
lsof -i :5173

# Limpar volumes e reconstruir
docker compose down -v
docker compose up -d --build
```

### Problema: Replicação quebrada

**Solução:**

```bash
# Parar replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "STOP SLAVE;"

# Reconc igurar
./database/setup-replication.sh

# Iniciar replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "START SLAVE;"
```

### Problema: Hook useLocalStorage não persiste

**Solução:**

Verificar se localStorage está habilitado:

```javascript
// Testar localStorage
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage funcionando');
} catch (e) {
  console.error('localStorage bloqueado:', e);
}
```

---

## Contribuindo

### Workflow Git

```bash
# Criar branch de feature
git checkout -b feature/nome-da-feature

# Fazer commits semânticos
git commit -m "feat: adiciona gestão de runbooks"
git commit -m "fix: corrige validação de CPF"
git commit -m "docs: atualiza documentação de API"

# Push e criar PR
git push origin feature/nome-da-feature
```

### Commit Conventions

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de manutenção

---

## Próximos Passos

- 📖 Explore as [funcionalidades](funcionalidades.md)
- 🔌 Consulte a [referência de API](api-referencia.md)
- 🚀 Veja o [guia de instalação](primeiros-passos.md)
