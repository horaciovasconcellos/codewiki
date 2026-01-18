# 🔐 Sistema de Autenticação - Documentação

## Visão Geral

Sistema completo de autenticação implementado com as seguintes funcionalidades:

### ✅ Funcionalidades Implementadas

1. **Tela de Login**
   - Layout responsivo e moderno
   - Validação de e-mail e senha no frontend
   - Checkbox "Manter conectado"
   - Botão "Esqueci minha senha" (preparado para futura implementação)
   - Indicador de carregamento durante autenticação
   - Mensagens de erro contextualizadas
   - Timeout de 30 segundos para requisições

2. **Backend de Autenticação**
   - Endpoint `POST /api/auth/login`
   - Endpoint `POST /api/auth/logout`
   - Endpoint `POST /api/auth/refresh` (renovação de token)
   - Validação de credenciais com hash SHA256
   - Verificação de status do usuário (ATIVO/INATIVO)
   - Verificação de data de vigência
   - Sistema de logs de acesso

3. **Segurança**
   - Senhas criptografadas com SHA256 + SALT
   - Token de sessão gerado com crypto.randomBytes
   - Refresh token para renovação
   - Logs de acesso com IP e User-Agent
   - Validação de data de vigência inicial/final

## 🚀 Como Testar

### Pré-requisitos
- Containers Docker rodando (auditoria-app, mysql-master)
- Porta 5173 (frontend) e 3000 (backend) disponíveis

### Credenciais de Teste

```
📧 E-mail: admin@empresa.com
🔑 Senha: 123456
```

### Passo a Passo

1. **Acessar a Aplicação**
   ```
   http://localhost:5173
   ```

2. **Realizar Login**
   - Digite o e-mail: `admin@empresa.com`
   - Digite a senha: `123456`
   - (Opcional) Marque "Manter conectado"
   - Clique em "Entrar"

3. **Verificar Autenticação**
   - Após login bem-sucedido, você será redirecionado para o sistema
   - Token será salvo no localStorage
   - Dados do usuário serão carregados no contexto

4. **Fazer Logout**
   - (Implementar botão de logout na interface)
   - Token será removido e você retornará à tela de login

## 📊 Estrutura do Banco de Dados

### Tabela: `usuarios_seguranca`

```sql
CREATE TABLE usuarios_seguranca (
  id VARCHAR(36) PRIMARY KEY,
  login VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt_usado VARCHAR(32) NOT NULL,
  status ENUM('ATIVO','INATIVO','BLOQUEADO','AGUARDANDO_ATIVACAO'),
  data_vigencia_inicial DATETIME,
  data_vigencia_termino DATETIME,
  colaborador_id VARCHAR(36),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Tabela: `logs_acesso`

```sql
CREATE TABLE logs_acesso (
  id VARCHAR(36) PRIMARY KEY,
  usuario_id VARCHAR(36),
  email VARCHAR(255) NOT NULL,
  tipo_evento ENUM('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'BLOCKED'),
  ip_origem VARCHAR(45),
  user_agent TEXT,
  sucesso TINYINT(1),
  created_at TIMESTAMP
);
```

### Tabela: `configuracoes`

```sql
-- SALT para criptografia
INSERT INTO configuracoes (chave, valor, tipo) 
VALUES ('PASSWORD_SALT', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'string');
```

## 🔧 API Endpoints

### POST /api/auth/login

**Request:**
```json
{
  "email": "admin@empresa.com",
  "senha": "123456"
}
```

**Response (Sucesso - 200):**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6g7h8...",
  "refreshToken": "x9y8z7w6v5u4t3s2...",
  "user": {
    "id": "092f69df-f3d9-11f0...",
    "email": "admin@empresa.com",
    "nome": "Admin User",
    "matricula": "12345",
    "setor": "TI",
    "role": "admin"
  },
  "permissions": [],
  "permissionsByResource": {}
}
```

**Response (Erro - 401):**
```json
{
  "error": "E-mail ou senha inválidos",
  "code": "INVALID_CREDENTIALS"
}
```

**Response (Erro - 403):**
```json
{
  "error": "Usuário inativo. Entre em contato com o administrador",
  "code": "USER_INACTIVE"
}
```

### POST /api/auth/logout

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

### POST /api/auth/refresh

**Request:**
```json
{
  "refreshToken": "x9y8z7w6v5u4t3s2..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "new_token_here..."
}
```

## 🎨 Componentes Frontend

### LoginPage.tsx
- Componente principal da tela de login
- Validações de formulário
- Integração com API
- Gerenciamento de estados (loading, errors)
- Logs de interação do usuário

### App.tsx
- Wrapper com verificação de autenticação
- Redirecionamento automático para login
- Loading state durante verificação
- Integração com sistema de permissões

## 📝 Validações Implementadas

### Frontend
- ✅ E-mail obrigatório e formato válido
- ✅ Senha obrigatória e mínimo 6 caracteres
- ✅ Timeout de 30 segundos
- ✅ Desabilitar botão durante processamento

### Backend
- ✅ Credenciais obrigatórias
- ✅ Usuário deve existir
- ✅ Status deve ser ATIVO
- ✅ Data de vigência válida
- ✅ Senha deve corresponder ao hash

## 🔐 Fluxo de Autenticação

```
1. Usuário preenche credenciais
   ↓
2. Frontend valida formato dos dados
   ↓
3. Request para /api/auth/login
   ↓
4. Backend verifica se usuário existe
   ↓
5. Backend verifica status (ATIVO?)
   ↓
6. Backend verifica data de vigência
   ↓
7. Backend valida hash da senha
   ↓
8. Backend gera tokens (access + refresh)
   ↓
9. Backend registra log de acesso
   ↓
10. Backend retorna dados do usuário
   ↓
11. Frontend salva token no localStorage
   ↓
12. Frontend atualiza contexto de permissões
   ↓
13. Usuário é redirecionado para o sistema
```

## 🛠️ Comandos Úteis

### Criar Novo Usuário

```bash
# 1. Gerar hash da senha
node -e "
const crypto = require('crypto');
const email = 'novo@empresa.com';
const senha = 'suasenha';
const SALT = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const combined = \`\${email}:\${senha}:\${SALT}\`;
const hash = crypto.createHash('sha256').update(combined).digest('hex');
console.log('Hash:', hash);
"

# 2. Inserir no banco
docker exec mysql-master mysql -u root -prootpass123 auditoria_db --execute="
INSERT INTO usuarios_seguranca (id, login, password_hash, salt_usado, status, data_vigencia_inicial) 
VALUES (UUID(), 'novo@empresa.com', 'HASH_AQUI', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'ATIVO', NOW());
"
```

### Visualizar Logs de Acesso

```sql
SELECT 
  email, 
  tipo_evento, 
  ip_origem, 
  sucesso, 
  created_at 
FROM logs_acesso 
ORDER BY created_at DESC 
LIMIT 10;
```

### Resetar Senha de Usuário

```bash
# Gerar novo hash
node -e "
const crypto = require('crypto');
const hash = crypto.createHash('sha256')
  .update('email@empresa.com:novasenha:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6')
  .digest('hex');
console.log(hash);
"

# Atualizar no banco
docker exec mysql-master mysql -u root -prootpass123 auditoria_db --execute="
UPDATE usuarios_seguranca 
SET password_hash='NOVO_HASH' 
WHERE login='email@empresa.com';
"
```

## 📋 Checklist de Implementação

- [x] Tela de login responsiva
- [x] Validações frontend
- [x] Endpoint de login
- [x] Endpoint de logout
- [x] Endpoint de refresh token
- [x] Criptografia de senhas
- [x] Geração de tokens
- [x] Verificação de status do usuário
- [x] Verificação de vigência
- [x] Logs de acesso
- [x] Tabela de logs criada automaticamente
- [x] Integração com sistema de permissões
- [x] LocalStorage para persistência
- [ ] Recuperação de senha
- [ ] Bloqueio por tentativas falhas
- [ ] 2FA (autenticação de dois fatores)
- [ ] Histórico de sessões
- [ ] Notificação de login em novo dispositivo

## 🐛 Troubleshooting

### Erro: "E-mail ou senha inválidos"
- Verificar se o usuário existe no banco
- Verificar se o hash da senha está correto
- Verificar se o SALT está configurado

### Erro: "Usuário inativo"
- Verificar coluna `status` na tabela
- Deve estar como 'ATIVO'

### Erro: "Erro de configuração do sistema"
- SALT não está configurado no banco
- Inserir SALT na tabela `configuracoes`

### Container não inicia
```bash
docker logs auditoria-app
docker restart auditoria-app
```

## 📚 Próximos Passos

1. **Implementar Recuperação de Senha**
   - Link "Esqueci minha senha"
   - Envio de e-mail com token
   - Página de reset de senha

2. **Melhorar Segurança**
   - Implementar bloqueio por tentativas falhas
   - Adicionar CAPTCHA após X tentativas
   - Implementar 2FA opcional

3. **Auditoria Avançada**
   - Dashboard de acessos
   - Alertas de login suspeito
   - Relatórios de uso

4. **UX Melhorias**
   - Animações na transição
   - Feedback visual melhorado
   - Dark mode

---

✅ **Sistema de Login Completo e Funcionando!**

Acesse: http://localhost:5173
Login: admin@empresa.com
Senha: 123456
