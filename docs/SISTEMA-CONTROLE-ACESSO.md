# Sistema de Controle de Acesso Híbrido (RBAC + ABAC + ACL)

## 📋 Visão Geral

Sistema robusto de controle de acesso que combina três modelos complementares:

- **RBAC** (Role-Based Access Control): Permissões baseadas em papéis/roles
- **ABAC** (Attribute-Based Access Control): Permissões baseadas em atributos e políticas
- **ACL** (Access Control List): Permissões específicas por usuário

## 🏗️ Arquitetura

### Componentes Principais

1. **Database Schema** (`database/migrations/008-access-control-system.sql`)
   - Tabelas para roles, permissões, recursos, políticas ABAC
   - Views para permissões efetivas
   - Triggers para auditoria automática
   - Procedures para verificação de permissões

2. **Middleware de Autenticação** (`server/middleware/authMiddleware.js`)
   - Verificação de JWT
   - Validação de sessões
   - Avaliação de permissões RBAC/ABAC/ACL
   - Auditoria de acessos

3. **API de Autenticação** (`server/routes/authRoutes.js`)
   - Endpoints de login/logout
   - Impersonation segura
   - Verificação de permissões
   - Gestão de sessões

4. **Hook React** (`src/hooks/usePermissions.tsx`)
   - Context API para estado global de autenticação
   - Funções helper para verificação de permissões
   - Gestão de token JWT

5. **Componentes React** (`src/components/auth/ProtectedContent.tsx`)
   - Componentes declarativos para proteção de conteúdo
   - Alertas de acesso negado
   - Indicador de impersonation

## 🔑 Recursos Principais

### 1. Sistema de Permissões Granulares

Cada recurso (tela/módulo) pode ter as seguintes ações:

```typescript
{
  create: boolean,   // Criar novos registros
  read: boolean,     // Visualizar registros
  update: boolean,   // Editar registros
  delete: boolean,   // Excluir registros
  execute: boolean,  // Executar operações especiais
  export: boolean,   // Exportar dados
  import: boolean,   // Importar dados
  approve: boolean   // Aprovar registros
}
```

### 2. Auditoria Completa

#### Auditoria de Acesso
- Login/Logout com sucesso ou falha
- Tentativas de acesso negado
- Impersonation (início e fim)
- IP, User Agent, timestamp

#### Auditoria de Dados
- Tracking automático via triggers
- Campos: tabela, registro_id, operação (INSERT/UPDATE/DELETE)
- Dados anteriores e novos em JSON
- Campos alterados
- Usuário responsável

### 3. Impersonation Segura

Administradores com permissão podem "se passar" por outro usuário:

```typescript
// Iniciar impersonation
await impersonate(targetUserId);

// Parar impersonation
await stopImpersonate();
```

- Token de admin preservado
- Auditoria de todas as ações
- Indicador visual de impersonation ativo

### 4. Hierarquia de Roles

Roles possuem `nivel_hierarquia` (0-100):
- Super Admin: 100
- Administrador: 90
- Gestor: 70
- Desenvolvedor: 50
- Usuário: 10
- Visitante: 5

## 📖 Como Usar

### Backend - Proteger Endpoints

```javascript
const { authenticate, authorize, auditResponse } = require('../middleware/authMiddleware');

// Endpoint protegido com permissão específica
router.post('/documentacao-projetos',
  authenticate,                                    // 1. Verificar autenticação
  authorize('documentacao-projetos.create'),       // 2. Verificar permissão
  auditResponse('create_documentation'),           // 3. Auditar acesso
  async (req, res) => {
    // req.user contém informações do usuário autenticado
    const { id, nome, email, sessionId } = req.user;
    
    // Lógica do endpoint...
  }
);

// Endpoint com ABAC (condições contextuais)
router.put('/aplicacoes/:id',
  authenticate,
  authorize('aplicacoes.update', {
    aplicacao_id: req.params.id,  // Contexto da requisição
    departamento: 'TI'              // Condição adicional
  }),
  async (req, res) => {
    // ...
  }
);

// Endpoint restrito por role
router.delete('/usuarios/:id',
  authenticate,
  hasRole('Super Admin', 'Administrador'),
  async (req, res) => {
    // ...
  }
);
```

### Frontend - Componentes Protegidos

```tsx
import { useAuth } from '@/hooks/usePermissions';
import { RequirePermission, CanCreate, CanUpdate } from '@/components/auth/ProtectedContent';

function DocumentacaoView() {
  const { user, canCreate, canUpdate, canDelete } = useAuth();

  return (
    <div>
      {/* Mostrar botão apenas se tiver permissão */}
      <CanCreate resource="documentacao-projetos">
        <Button onClick={handleCreate}>
          Novo Documento
        </Button>
      </CanCreate>

      {/* Proteger área com fallback */}
      <RequirePermission 
        permission="documentacao-projetos.read"
        showAlert={true}
        fallback={<p>Você não tem acesso a esta seção</p>}
      >
        {/* Conteúdo protegido */}
        <DataTable data={docs} />
      </RequirePermission>

      {/* Condicionais inline */}
      {canUpdate('documentacao-projetos') && (
        <Button onClick={handleEdit}>Editar</Button>
      )}
      
      {canDelete('documentacao-projetos') && (
        <Button onClick={handleDelete} variant="destructive">Excluir</Button>
      )}
    </div>
  );
}
```

### Frontend - Hook de Permissões

```tsx
import { useAuth, useRequirePermission } from '@/hooks/usePermissions';

function ProtectedPage() {
  const { 
    user,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canCreate,
    canRead,
    canUpdate,
    canDelete
  } = useAuth();

  // Verificar permissão única
  if (!hasPermission('usuarios.read')) {
    return <AccessDenied />;
  }

  // Verificar pelo menos uma permissão
  const canManageUsers = hasAnyPermission('usuarios.create', 'usuarios.update', 'usuarios.delete');

  // Verificar todas as permissões
  const canFullAccess = hasAllPermissions('usuarios.create', 'usuarios.read', 'usuarios.update', 'usuarios.delete');

  // Verificar role
  if (hasRole('Super Admin')) {
    // Mostrar funcionalidades especiais
  }

  return <div>...</div>;
}
```

## 🔧 Configuração

### 1. Aplicar Migração do Banco de Dados

```bash
mysql -u root -p auditoria_db < database/migrations/008-access-control-system.sql
```

### 2. Configurar Variáveis de Ambiente

```bash
# .env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=8h
```

### 3. Integrar Middleware no Express

```javascript
// server/api.js ou server/index.js
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');

// Configurar pool de conexão
authMiddleware.setPool(pool);
authRoutes.setPool(pool);

// Registrar rotas de autenticação
app.use('/api/auth', authRoutes.router);

// Proteger todas as rotas após /api
app.use('/api/*', authMiddleware.authenticate);
```

### 4. Configurar Provider no React

```tsx
// App.tsx ou main.tsx
import { AuthProvider } from './hooks/usePermissions';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
```

## 📊 Exemplos de Políticas ABAC

### Exemplo 1: Acesso por Departamento

```sql
INSERT INTO politicas_acesso (nome, permissao_id, condicao, efeito, ativo) VALUES (
  'Apenas TI pode gerenciar servidores',
  (SELECT id FROM permissoes WHERE codigo = 'servidores.update'),
  '{"departamento": "TI"}',
  'allow',
  TRUE
);
```

### Exemplo 2: Acesso por Horário

```sql
INSERT INTO politicas_acesso (nome, permissao_id, condicao, efeito, ativo) VALUES (
  'Operações financeiras apenas em horário comercial',
  (SELECT id FROM permissoes WHERE codigo = 'financeiro.create'),
  '{"hora": {"$between": [8, 18]}, "dia_semana": {"$nin": [0, 6]}}',
  'allow',
  TRUE
);
```

### Exemplo 3: Acesso por Nível

```sql
INSERT INTO politicas_acesso (nome, permissao_id, condicao, efeito, ativo) VALUES (
  'Aprovação requer nível 5+',
  (SELECT id FROM permissoes WHERE codigo = 'documentacao-projetos.approve'),
  '{"nivel_acesso": {"$gte": 5}}',
  'allow',
  TRUE
);
```

## 🔐 Operadores ABAC Suportados

```javascript
$eq      // Igual a
$ne      // Diferente de
$gt      // Maior que
$gte     // Maior ou igual
$lt      // Menor que
$lte     // Menor ou igual
$in      // Está em array
$nin     // Não está em array
$regex   // Expressão regular
$between // Entre dois valores [min, max]
```

## 📈 Exemplos de Uso de ACL

### Conceder Permissão Específica a Usuário

```sql
-- Permitir que usuário 5 delete documentação (mesmo sem role)
INSERT INTO usuario_permissoes_acl (usuario_id, permissao_id, tipo) VALUES (
  5,
  (SELECT id FROM permissoes WHERE codigo = 'documentacao-projetos.delete'),
  'allow'
);
```

### Negar Permissão Específica a Usuário

```sql
-- Negar que usuário 8 exclua aplicações (mesmo com role que permite)
INSERT INTO usuario_permissoes_acl (usuario_id, permissao_id, tipo, motivo) VALUES (
  8,
  (SELECT id FROM permissoes WHERE codigo = 'aplicacoes.delete'),
  'deny',
  'Usuário em período probatório'
);
```

## 🔍 Consultas Úteis

### Ver Permissões de um Usuário

```sql
SELECT 
  permissao_codigo,
  acao,
  recurso_nome,
  origem,
  role_nome
FROM vw_usuario_permissoes_efetivas
WHERE usuario_id = 1
ORDER BY recurso_nome, acao;
```

### Ver Auditoria de um Usuário

```sql
SELECT 
  acao,
  recurso,
  resultado,
  ip_address,
  timestamp
FROM auditoria_acesso
WHERE usuario_id = 1
ORDER BY timestamp DESC
LIMIT 50;
```

### Ver Mudanças em uma Tabela

```sql
SELECT 
  u.nome as usuario,
  ad.operacao,
  ad.campos_alterados,
  ad.dados_anteriores,
  ad.dados_novos,
  ad.timestamp
FROM auditoria_dados ad
INNER JOIN usuarios u ON ad.usuario_id = u.id
WHERE ad.tabela = 'documentacao_projetos'
  AND ad.registro_id = '123'
ORDER BY ad.timestamp DESC;
```

## 🚀 Fluxo de Login Completo

1. **Usuário envia credenciais**
   ```javascript
   POST /api/auth/login
   { email, senha }
   ```

2. **Backend valida**
   - Verifica email/senha
   - Gera JWT token
   - Cria sessão no banco
   - Registra auditoria de login

3. **Frontend recebe**
   - Token JWT
   - Dados do usuário
   - Permissões
   - Roles

4. **Frontend armazena**
   - localStorage: auth_token
   - Context: user, permissions, permissionsByResource

5. **Requisições subsequentes**
   - Header: `Authorization: Bearer <token>`
   - Backend valida sessão
   - Verifica permissões
   - Registra auditoria

## 📝 Notas Importantes

1. **Ordem de Prioridade**:
   - ACL `deny` > ACL `allow` > RBAC > Negar por padrão

2. **Sessões**:
   - Expiração: 8 horas (configurável)
   - Refresh token: 7 dias
   - IP e User Agent registrados

3. **Triggers de Auditoria**:
   - Criar para cada tabela importante
   - Exemplo fornecido para `documentacao_projetos`

4. **Performance**:
   - View materializada para permissões efetivas
   - Índices em colunas críticas
   - Cache de permissões no frontend

## 🔗 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login de usuário |
| POST | `/api/auth/logout` | Logout de usuário |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Dados do usuário autenticado |
| POST | `/api/auth/impersonate/:userId` | Iniciar impersonation |
| POST | `/api/auth/stop-impersonate` | Parar impersonation |
| POST | `/api/auth/check-permission` | Verificar permissão |
| GET | `/api/auth/my-permissions` | Listar permissões |

## 🛡️ Segurança

- ✅ Senhas hasheadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Refresh tokens para renovação
- ✅ Auditoria completa de acessos
- ✅ Sessões rastreáveis por IP/User Agent
- ✅ Impersonation auditada
- ✅ Proteção contra força bruta (registrar falhas)
- ✅ CORS configurável
- ✅ Rate limiting (implementar se necessário)

## 📚 Referências

- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [XACML ABAC Standard](https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=xacml)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
