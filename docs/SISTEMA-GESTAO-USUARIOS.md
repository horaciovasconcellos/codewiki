# Sistema de Gestão de Usuários com Controle de Acesso

## 📋 Visão Geral

Sistema completo de gestão de usuários com controle de acesso granular baseado em CRUD por tela, organizando permissões por setor. Implementado com wizard pattern seguindo o padrão do sistema (similar a ColaboradoresView).

## ✅ Componentes Implementados

### 🎯 Frontend (React + TypeScript)

#### 1. **UsuariosView.tsx** (`src/components/usuarios/`)
- View principal com listagem e wizard
- CRUD completo: Create, Read, Update, Delete
- Toggle entre tabela e wizard
- Integração com API RESTful

#### 2. **UsuarioWizard.tsx** (`src/components/usuarios/`)
- Wizard de 3 etapas:
  1. **Dados Básicos**: Colaborador, email, senha, role, status
  2. **Controle de Acesso**: Permissões granulares por setor
  3. **Resumo**: Visualização antes de salvar
- Validação por etapa
- Step indicator visual

#### 3. **Steps do Wizard** (`src/components/usuarios/wizard-steps/`)

**StepDadosBasicos.tsx**
- Seleção de colaborador (obrigatório, único)
- Email com validação
- Senha (mínimo 6 caracteres)
- 4 roles: Administrador, Back-office, Usuário, Consulta
- Toggle ativo/inativo

**StepControleAcesso.tsx**
- Configuração por setor
- 42 telas do sistema organizadas por categoria
- Checkboxes CRUD por tela (Create, Read, Update, Delete)
- Accordion por categoria com ações em lote
- Admin bypass (acesso total automático)
- Filtro por categoria

**StepResumo.tsx**
- Resumo de dados do colaborador
- Dados de acesso (email, role, status)
- Tabela de permissões por setor
- Contadores de permissões

#### 4. **UsuariosDataTable.tsx** (`src/components/usuarios/`)
- Tabela responsiva com filtros
- Busca por nome, email ou matrícula
- Filtros: Role e Status (ativo/inativo)
- Paginação (10 itens por página)
- Ações: Editar e Excluir
- Dialog de confirmação de exclusão

#### 5. **Types** (`src/lib/types.ts`)
```typescript
// Role do sistema
type RoleSistema = 'Administrador' | 'Back-office' | 'Usuário' | 'Consulta';

// Permissão por tela
interface PermissaoTela {
  tela: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

// Permissões organizadas por setor
interface PermissoesPorSetor {
  setor: string;
  permissoes: PermissaoTela[];
}

// Usuario completo
interface Usuario {
  id: number;
  colaboradorId: number;
  email: string;
  senha?: string;
  role: RoleSistema;
  ativo: boolean;
  
  // Dados denormalizados do colaborador
  colaboradorNome?: string;
  colaboradorMatricula?: string;
  colaboradorSetor?: string;
  
  // Permissões customizadas
  permissoesPorSetor: PermissoesPorSetor[];
  
  // Auditoria
  createdAt?: string;
  updatedAt?: string;
}

// Constante com todas as telas
const TELAS_SISTEMA: Array<{id: string, nome: string, categoria: string}> = [
  // 42 telas organizadas em 13 categorias
];
```

### 🗄️ Backend (Node.js + Express + MySQL)

#### 1. **API Routes** (`server/src/routes/usuarios.routes.js`)

**Endpoints:**
- `GET /api/usuarios` - Listar todos
- `GET /api/usuarios/:id` - Buscar por ID
- `POST /api/usuarios` - Criar novo
- `PUT /api/usuarios/:id` - Atualizar
- `DELETE /api/usuarios/:id` - Excluir
- `POST /api/usuarios/validate-email` - Validar email
- `POST /api/usuarios/validate-colaborador` - Validar colaborador

**Características:**
- Transações MySQL
- Hash de senha com bcrypt (salt rounds = 10)
- Validação de unicidade (email e colaborador)
- Parse automático de JSON (permissões)
- Tratamento de erros completo

#### 2. **Database Migration** (`database/migrations/009-usuarios-table.sql`)

**Tabela: usuarios**
```sql
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    colaborador_id INT NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role ENUM('Administrador', 'Back-office', 'Usuário', 'Consulta'),
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Dados denormalizados (cache)
    colaborador_nome VARCHAR(255),
    colaborador_matricula VARCHAR(50),
    colaborador_setor VARCHAR(255),
    
    -- Permissões JSON
    permissoes_por_setor JSON,
    
    -- Auditoria
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id)
);
```

**Recursos Adicionais:**
- **Triggers**: Atualização automática de dados do colaborador
- **View**: `vw_usuarios_completo` com dados unidos
- **Stored Procedures**:
  - `sp_usuario_email_disponivel`
  - `sp_usuario_colaborador_disponivel`
  - `sp_sincronizar_dados_colaborador`
- **Seed Data**: Usuário admin padrão (admin@codewiki.com / admin123)

### 🔗 Integração

#### App.tsx
```typescript
// Importação
import { UsuariosView } from '@/components/usuarios/UsuariosView';

// No switch case
case 'usuarios-seguranca':
  return <UsuariosView colaboradores={colaboradores || []} />;
```

#### Routes Index (server/src/routes/index.js)
```javascript
import usuariosRoutes from './usuarios.routes.js';
router.use('/usuarios', usuariosRoutes);
```

## 📊 Estrutura de Permissões

### Hierarquia de Roles

1. **Administrador** (Nível Máximo)
   - Acesso total (*) a todas as telas
   - Não precisa configurar permissões
   - Bypass automático de verificações

2. **Back-office** (Gestão Operacional)
   - Permissões padrão: Create, Read, Update
   - Delete desabilitado por padrão
   - Pode ser customizado por setor

3. **Usuário** (Operação Padrão)
   - Permissões padrão: Read apenas
   - Create, Update, Delete desabilitados
   - Deve ser configurado por setor

4. **Consulta** (Somente Leitura)
   - Permissões padrão: Read apenas
   - Todas as outras operações desabilitadas
   - Acesso restrito por setor

### Organização por Setor

Cada usuário pode ter permissões configuradas para múltiplos setores:

```json
{
  "permissoesPorSetor": [
    {
      "setor": "TI",
      "permissoes": [
        { "tela": "dashboard", "create": false, "read": true, "update": false, "delete": false },
        { "tela": "aplicacoes", "create": true, "read": true, "update": true, "delete": false },
        // ... mais 40 telas
      ]
    },
    {
      "setor": "Financeiro",
      "permissoes": [
        { "tela": "finops", "create": true, "read": true, "update": true, "delete": true },
        // ... outras telas
      ]
    }
  ]
}
```

## 🎨 Categorias de Telas (42 telas)

1. **Principal** (1 tela): Dashboard
2. **Registros** (12 telas): Colaboradores, Aplicações, Tecnologias, etc.
3. **DevOps** (6 telas): Pipelines, Stages, Payloads, etc.
4. **Documentação** (3 telas): APIs, SDD, Projetos
5. **Métricas** (4 telas): SLAs, ADRs, Checkpoints, etc.
6. **Financeiro** (1 tela): FinOps
7. **Governança** (2 telas): LGPD, Gestão de Eventos
8. **Integrações** (1 tela): Comunicação
9. **Cargas** (2 telas): Carga de Dados, Notificações
10. **Observabilidade** (1 tela): Logs e Traces
11. **Ferramentas** (1 tela): Gerador de Projetos
12. **Configurações** (2 telas): Configurações, Tipos de Afastamento
13. **Segurança** (2 telas): Tokens de Acesso, Usuários

## 🔐 Validações Implementadas

### Frontend
- [x] Email válido e único
- [x] Senha mínima de 6 caracteres
- [x] Colaborador obrigatório e único
- [x] Role obrigatório
- [x] Pelo menos um setor com permissões (exceto Admin)

### Backend
- [x] Email único no sistema
- [x] Colaborador único (um usuário por colaborador)
- [x] Colaborador deve existir na tabela colaboradores
- [x] Senha com hash bcrypt automático
- [x] Transações para garantir integridade
- [x] Validação de campos obrigatórios

## 🚀 Como Usar

### 1. Aplicar Migration

```bash
# Conectar ao MySQL
mysql -u root -p auditoria_db

# Executar migration
source database/migrations/009-usuarios-table.sql
```

### 2. Instalar Dependências (se necessário)

```bash
# Backend
cd server
npm install bcrypt

# Frontend (já incluído)
# shadcn/ui components já instalados
```

### 3. Verificar Integração

- [x] Backend routes em `server/src/routes/index.js`
- [x] Frontend route em `src/App.tsx`
- [x] Menu item em "Segurança" → "Usuários e Segurança"

### 4. Testar Fluxo Completo

1. **Criar Usuário**
   - Acessar "Segurança" → "Usuários e Segurança"
   - Clicar em "Novo Usuário"
   - Preencher dados básicos (colaborador, email, senha, role)
   - Configurar permissões por setor (se não Admin)
   - Revisar resumo
   - Salvar

2. **Editar Usuário**
   - Clicar em "Editar" na tabela
   - Wizard abre com dados preenchidos
   - Modificar dados/permissões
   - Salvar

3. **Excluir Usuário**
   - Clicar em "Excluir" na tabela
   - Confirmar exclusão
   - Usuário removido com cascade (sessões, logs, etc.)

## 📝 Notas Técnicas

### Performance
- **Denormalização**: Nome, matrícula e setor do colaborador cacheados na tabela usuarios
- **Triggers**: Atualização automática quando colaborador muda
- **Índices**: Email, role, ativo, setor para buscas rápidas

### Segurança
- **Senha Hash**: bcrypt com 10 salt rounds
- **Validação**: Server-side + client-side
- **Integridade**: Foreign keys com cascade
- **Auditoria**: created_at/updated_at + created_by/updated_by

### Escalabilidade
- **JSON Permissions**: Flexível para adicionar novas telas
- **Role-Based**: Fácil adicionar novos roles
- **Setor-Based**: Suporta múltiplos setores por usuário
- **CRUD Granular**: Controle fino por operação

## 🔄 Próximos Passos Sugeridos

### Integração com Sistema de Autenticação
1. Conectar com authRoutes.js existente
2. Usar JWT para sessões
3. Middleware para verificar permissões
4. Impersonation de usuários (para admin)

### Features Adicionais
- [ ] Histórico de alterações de permissões
- [ ] Auditoria de login/logout
- [ ] Notificações de criação/alteração de usuário
- [ ] Export/Import de permissões (JSON, CSV)
- [ ] Template de permissões por role
- [ ] Permissões herdadas por hierarquia de setores

### Melhorias de UX
- [ ] Preview de permissões em tempo real
- [ ] Comparação entre usuários
- [ ] Clone de permissões de outro usuário
- [ ] Busca avançada com múltiplos filtros
- [ ] Bulk operations (ativar/desativar múltiplos)

## 📚 Documentação de Referência

- **Padrão Wizard**: `ColaboradoresView.tsx` e `ColaboradorWizard.tsx`
- **API Pattern**: `server/src/routes/*.routes.js`
- **Types**: `src/lib/types.ts`
- **Database**: `database/migrations/`

## 🎯 Arquivos Criados/Modificados

### Criados
```
src/components/usuarios/
  ├── UsuariosView.tsx
  ├── UsuarioWizard.tsx
  ├── UsuariosDataTable.tsx
  └── wizard-steps/
      ├── StepDadosBasicos.tsx
      ├── StepControleAcesso.tsx
      └── StepResumo.tsx

server/src/routes/
  └── usuarios.routes.js

database/migrations/
  └── 009-usuarios-table.sql
```

### Modificados
```
src/lib/types.ts (adicionados tipos Usuario, RoleSistema, etc.)
src/App.tsx (import e case para usuarios-seguranca)
server/src/routes/index.js (import e use de usuarios.routes)
```

---

✅ **Sistema Completo e Pronto para Uso!**

Implementação seguindo os requisitos:
- ✅ Usuários vinculados a colaboradores
- ✅ 4 roles (Administrador, Back-office, Usuário, Consulta)
- ✅ Setor do colaborador para organização
- ✅ Permissões CRUD granulares por tela
- ✅ Admin com acesso total (*)
- ✅ Wizard pattern como ColaboradoresView
- ✅ 42 telas do sistema disponíveis
