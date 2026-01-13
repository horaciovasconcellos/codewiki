# 📚 CodeWiki

> Sistema de gerenciamento de conhecimento técnico e documentação de arquitetura

[![CI](https://github.com/horaciovasconcellos/codewiki/workflows/CI/badge.svg)](https://github.com/horaciovasconcellos/codewiki/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📖 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

CodeWiki é uma plataforma completa para gerenciamento de conhecimento técnico, documentação de arquitetura e catálogo de tecnologias. O sistema permite:

- 📊 Gestão de tecnologias e ferramentas
- 👥 Cadastro de colaboradores e habilidades
- 🏗️ Documentação de aplicações e projetos
- 📝 ADRs (Architecture Decision Records)
- 🔄 Integração com Azure DevOps
- 🔐 Autenticação e autorização JWT
- 📈 Dashboards e relatórios

## ✨ Características

### Backend
- ✅ API RESTful com Express.js
- ✅ Autenticação JWT com refresh tokens
- ✅ Validação de dados com Joi
- ✅ Documentação automática com Swagger
- ✅ Pool de conexões MySQL otimizado
- ✅ Middleware de erro centralizado
- ✅ Logs estruturados
- ✅ Testes unitários com Jest

### Frontend
- ✅ React 19 com Vite
- ✅ TypeScript
- ✅ Tailwind CSS v4
- ✅ Componentes Radix UI
- ✅ React Query para gerenciamento de estado
- ✅ React Hook Form para formulários
- ✅ Visualizações com Recharts
- ✅ Modo escuro/claro

### Infraestrutura
- ✅ Docker e Docker Compose
- ✅ CI/CD com GitHub Actions
- ✅ Replicação MySQL (Master-Slave)
- ✅ Nginx como reverse proxy
- ✅ Scripts de migração automática
- ✅ Health checks e monitoring

## 🛠️ Tecnologias

### Backend
- **Node.js** 20.x
- **Express.js** 4.x
- **MySQL** 8.0
- **Joi** - Validação de dados
- **JWT** - Autenticação
- **Swagger** - Documentação API
- **Jest** - Testes

### Frontend
- **React** 19.x
- **TypeScript** 5.x
- **Vite** 6.x
- **Tailwind CSS** 4.x
- **Radix UI** - Componentes acessíveis
- **React Query** - Gerenciamento de estado

### DevOps
- **Docker** & Docker Compose
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy
- **MySQL Replication** - Alta disponibilidade

## 📋 Pré-requisitos

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MySQL** >= 8.0
- **Docker** (opcional, recomendado)
- **Git**

## 🚀 Instalação

### Método 1: Docker (Recomendado)

```bash
# Clone o repositório
git clone https://github.com/horaciovasconcellos/codewiki.git
cd codewiki

# Copie o arquivo de ambiente
cp .env.example .env

# Edite as variáveis de ambiente
nano .env

# Inicie os containers
docker-compose up -d

# Acesse a aplicação
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Swagger: http://localhost:3000/api-docs
```

### Método 2: Instalação Local

```bash
# Clone o repositório
git clone https://github.com/horaciovasconcellos/codewiki.git
cd codewiki

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
nano .env

# Execute as migrações do banco
mysql -u root -p < database/migrations/002-auth-tables.sql

# Inicie o backend
npm run dev:api:new

# Em outro terminal, inicie o frontend
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
# MySQL Database
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=auditoria_db

# API Configuration
API_PORT=3000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Configuração do Banco de Dados

1. Crie o banco de dados:
```sql
CREATE DATABASE auditoria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Execute as migrações:
```bash
# Execute cada migration na ordem
mysql -u root -p auditoria_db < database/migrations/002-auth-tables.sql
# ... outras migrations
```

## 💻 Uso

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento completo
npm run dev:all

# Apenas backend
npm run dev:api:new

# Apenas frontend
npm run dev
```

### Produção

```bash
# Build do frontend
npm run build

# Inicie o servidor de produção
npm start

# Ou use o script de produção
./scripts/production-start.sh
```

## 📜 Scripts Disponíveis

### Scripts NPM

```bash
npm run dev              # Inicia Vite dev server
npm run dev:api:new      # Inicia API backend
npm run dev:all          # Inicia frontend + backend
npm start                # Inicia em produção
npm run build            # Build do frontend
npm test                 # Executa testes
npm run test:watch       # Testes em modo watch
npm run test:coverage    # Testes com cobertura
npm run lint             # Executa ESLint
npm run migrate          # Script de migração interativo
npm run migrate:batch    # Migração em lote
```

### Scripts de Migração

#### Migração Automática Interativa

Gera automaticamente Model, Service, Controller, Routes e Tests para um novo domínio:

```bash
npm run migrate
# ou
node scripts/auto-migrate.js
```

O script irá perguntar:
1. Nome do domínio (ex: colaboradores)
2. Nome da tabela no banco (padrão: nome do domínio)

Arquivos gerados:
- `server/src/models/{dominio}.model.js`
- `server/src/services/{dominio}.service.js`
- `server/src/controllers/{dominio}.controller.js`
- `server/src/routes/{dominio}.routes.js`
- `server/src/tests/unit/services/{dominio}.service.test.js`

#### Migração em Lote

Para migrar múltiplos domínios de uma vez:

```bash
npm run migrate:batch
# ou
node scripts/batch-migrate.js
```

### Scripts de Produção

```bash
# Inicia aplicação em produção com health checks
./scripts/production-start.sh

# Para a aplicação
kill $(cat .app.pid)

# Ver logs em tempo real
tail -f logs/app.log
```

## 📁 Estrutura do Projeto

```
codewiki/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
│       ├── ci.yml
│       ├── pr-checks.yml
│       └── release.yml
├── database/
│   └── migrations/         # SQL migrations
├── docs/                   # Documentação MkDocs
├── public/                 # Assets públicos
├── scripts/               # Scripts utilitários
│   ├── auto-migrate.js    # Migração automática
│   ├── batch-migrate.js   # Migração em lote
│   └── production-start.sh
├── server/
│   └── src/
│       ├── config/        # Configurações
│       │   └── database.js
│       ├── controllers/   # Controllers
│       │   ├── auth.controller.js
│       │   └── tecnologias.controller.js
│       ├── middleware/    # Middlewares
│       │   ├── auth.middleware.js
│       │   └── error.middleware.js
│       ├── models/        # Models (Joi)
│       │   ├── tecnologia.model.js
│       │   └── user.model.js
│       ├── routes/        # Rotas
│       │   ├── index.js
│       │   ├── auth.routes.js
│       │   └── tecnologias.routes.js
│       ├── services/      # Lógica de negócio
│       │   ├── auth.service.js
│       │   ├── database.service.js
│       │   └── tecnologias.service.js
│       ├── tests/         # Testes
│       │   └── unit/
│       │       └── services/
│       ├── utils/         # Utilitários
│       │   ├── constants.js
│       │   └── response.js
│       └── app.js         # Entry point
├── src/                   # Frontend React
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── App.tsx
├── .env.example          # Exemplo de variáveis
├── docker-compose.yml    # Docker Compose
├── Dockerfile           # Dockerfile produção
├── jest.config.js       # Jest config
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔌 API

### Documentação

A documentação completa da API está disponível via Swagger:

```
http://localhost:3000/api-docs
```

### Endpoints Principais

#### Autenticação

```http
POST /api/auth/register     # Registrar usuário
POST /api/auth/login        # Login
POST /api/auth/refresh      # Renovar token
GET  /api/auth/me           # Perfil do usuário
POST /api/auth/logout       # Logout
```

#### Tecnologias

```http
GET    /api/tecnologias          # Listar todas
GET    /api/tecnologias/:id      # Buscar por ID
POST   /api/tecnologias          # Criar nova
PUT    /api/tecnologias/:id      # Atualizar
DELETE /api/tecnologias/:id      # Excluir
GET    /api/tecnologias/search   # Buscar
GET    /api/tecnologias/stats    # Estatísticas
```

### Autenticação

A API usa JWT Bearer tokens:

```http
Authorization: Bearer {token}
```

## 🔧 Desenvolvimento

### Padrões de Código

- **ESLint** para linting JavaScript/TypeScript
- **Prettier** para formatação (futuro)
- **Conventional Commits** para mensagens de commit
- **REST** para arquitetura de API
- **MVC** para organização do backend

### Estrutura de Commits

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
perf: melhoria de performance
test: adiciona ou corrige testes
build: mudanças no build
ci: mudanças no CI
chore: outras mudanças
```

### Adicionando Novo Domínio

1. Use o script de migração:
```bash
npm run migrate
```

2. Ajuste o modelo gerado se necessário:
```javascript
// server/src/models/seudominio.model.js
const suaEntidadeSchema = Joi.object({
  // Adicione/remova campos conforme sua necessidade
});
```

3. Crie a tabela no banco:
```sql
CREATE TABLE sua_tabela (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  -- outros campos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

4. Teste os endpoints no Swagger

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Estrutura de Testes

```javascript
describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('method', () => {
    it('deve fazer algo', async () => {
      // Arrange
      const mockData = { /* ... */ };
      
      // Act
      const result = await service.method();
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

## 🚢 Deploy

### Docker

```bash
# Build da imagem
docker build -t codewiki:latest .

# Run
docker run -d \
  -p 3000:3000 \
  -p 5173:5173 \
  --env-file .env \
  --name codewiki \
  codewiki:latest
```

### Docker Compose

```bash
# Produção
docker-compose -f docker-compose.prod.yml up -d

# Desenvolvimento
docker-compose up -d
```

### Manual

```bash
# Build
npm run build

# Iniciar
./scripts/production-start.sh
```

### Verificação de Deploy

O script `production-start.sh` inclui:
- ✅ Verificação de variáveis de ambiente
- ✅ Teste de conexão com banco
- ✅ Health checks automáticos
- ✅ Logs estruturados
- ✅ Gerenciamento de PID

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Diretrizes

- Siga os padrões de código estabelecidos
- Adicione testes para novas funcionalidades
- Atualize a documentação conforme necessário
- Use Conventional Commits
- Mantenha o PR focado em uma única feature/fix

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## � Documentação

Toda a documentação do projeto está organizada na pasta [`docs/`](docs/):

- 📋 [**Índice Completo**](docs/INDEX.md) - Navegação por toda documentação
- 📐 [**Convenções do Projeto**](docs/PROJECT-CONVENTIONS.md) - Padrões e regras de desenvolvimento
- 🚀 [**Guia de Deploy**](docs/deployment/DEPLOY-GUIDE.md) - Instruções de deployment
- ⚙️ [**Setup LGPD**](docs/setup/LGPD-SETUP-INSTRUCTIONS.md) - Configuração do sistema LGPD
- 🔧 [**Guia de Execução**](docs/EXECUTION-GUIDE.md) - Como executar o sistema
- 🔌 [**Referência de APIs**](docs/API-REFERENCIA-COMPLETA.md) - Documentação completa das APIs

### Regra Importante

⚠️ **Todos os arquivos Markdown (`.md`) devem estar na pasta `docs/`**, exceto o `README.md` na raiz.

Consulte [PROJECT-CONVENTIONS.md](docs/PROJECT-CONVENTIONS.md) para detalhes completos sobre organização e nomenclatura.

## �👥 Autores

- **Horacio Vasconcellos** - [@horaciovasconcellos](https://github.com/horaciovasconcellos)

## 🙏 Agradecimentos

- Comunidade Open Source
- Contribuidores do projeto
- Bibliotecas e frameworks utilizados

## 📞 Suporte

- 📧 Email: [criar email de suporte]
- 🐛 Issues: [GitHub Issues](https://github.com/horaciovasconcellos/codewiki/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/horaciovasconcellos/codewiki/discussions)

---

Feito com ❤️ e ☕
