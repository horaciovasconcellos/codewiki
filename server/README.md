# API Server - Sistema de Auditoria

## 📋 Visão Geral

Servidor Express.js que fornece API REST para o Sistema de Auditoria.

## 🚀 Como Executar

### Desenvolvimento Local (fora do Docker)

```bash
# Instalar dependências
npm install

# Executar apenas a API
npm run dev:api

# Executar API + Frontend juntos
npm run dev:all
```

### Docker

```bash
# Iniciar tudo (já configurado)
docker-compose up -d

# Logs da API
docker logs auditoria-app | grep "\[1\]"
```

## 🔌 Endpoints Disponíveis

### Tipos de Afastamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/tipos-afastamento` | Listar todos |
| `GET` | `/api/tipos-afastamento/:id` | Buscar por ID |
| `POST` | `/api/tipos-afastamento` | Criar novo |
| `PUT` | `/api/tipos-afastamento/:id` | Atualizar |
| `DELETE` | `/api/tipos-afastamento/:id` | Excluir |

### Colaboradores

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/colaboradores` | Listar todos |
| `POST` | `/api/colaboradores` | Criar novo |

### Habilidades

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/habilidades` | Listar todos |
| `POST` | `/api/habilidades` | Criar novo |

### Capacidades de Negócio

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/capacidades-negocio` | Listar todos |
| `POST` | `/api/capacidades-negocio` | Criar novo |

### Tecnologias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/tecnologias` | Listar todos |
| `POST` | `/api/tecnologias` | Criar novo |

### Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Status do servidor |

## 📊 Dados Iniciais

O servidor inicia com 4 tipos de afastamento pré-cadastrados:

1. **FER** - Férias (30 dias, Consecutivo)
2. **LIC-MED** - Licença Médica (15 dias, Consecutivo)
3. **LIC-MAT** - Licença Maternidade (180 dias, Consecutivo)
4. **LIC-PAT** - Licença Paternidade (20 dias, Consecutivo)

## 🔧 Configuração

### Portas

- **API Server**: 3000 (porta interna)
- **Acesso via proxy**: http://localhost:5173/api/...

### Proxy Vite

O `vite.config.ts` está configurado para fazer proxy de todas as requisições `/api/*` para `http://localhost:3000`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

## 💾 Armazenamento

**Importante**: Os dados são armazenados **em memória**. Quando o servidor reinicia, todos os dados criados são perdidos (exceto os dados iniciais).

Para persistência real, conecte ao banco MySQL:
- Host: `mysql-master` (no Docker) ou `localhost:3306` (local)
- Database: `auditoria_db`
- User: `app_user`
- Password: `apppass123`

## 🧪 Testando a API

### cURL

```bash
# Listar tipos
curl http://localhost:5173/api/tipos-afastamento | jq

# Criar novo tipo
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "BH",
    "descricao": "Banco de Horas",
    "argumentacaoLegal": "CCT 2024/2025 Cláusula 22",
    "numeroDias": 10,
    "tipoTempo": "N"
  }' | jq

# Buscar por ID
curl http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001 | jq

# Health check
curl http://localhost:3000/health | jq
```

### Postman

Importe a collection ou configure manualmente:

**Base URL**: `http://localhost:5173`

## 🔒 CORS

CORS está habilitado para todas as origens em desenvolvimento. Para produção, configure adequadamente:

```javascript
app.use(cors({
  origin: 'https://seu-dominio.com',
  credentials: true
}));
```

## 📝 Validações Implementadas

### Tipos de Afastamento

- **Sigla**: 2-15 caracteres alfanuméricos ou hífens, única no sistema
- **Descrição**: Obrigatória, máximo 50 caracteres
- **Argumentação Legal**: Obrigatória, máximo 60 caracteres
- **Número de Dias**: Obrigatório, entre 1 e 99
- **Tipo de Tempo**: Obrigatório, apenas 'C' ou 'N'

## 🐛 Troubleshooting

### Porta 3000 em uso

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou mude a porta no server/api.js
const PORT = 3001;
```

### API não responde

```bash
# Verificar se está rodando
docker logs auditoria-app

# Reiniciar container
docker-compose restart app

# Verificar conectividade
curl http://localhost:3000/health
```

### Proxy não funciona

Verifique o `vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  }
}
```

## 📚 Próximos Passos

- [ ] Conectar ao MySQL (substituir armazenamento em memória)
- [ ] Implementar autenticação/autorização
- [ ] Adicionar paginação nos endpoints
- [ ] Implementar filtros e ordenação
- [ ] Adicionar testes unitários
- [ ] Documentação Swagger/OpenAPI
- [ ] Rate limiting
- [ ] Logging estruturado

## 📖 Documentação Relacionada

- [Exemplo POST Tipo Afastamento](../docs/EXEMPLO_POST_TIPO_AFASTAMENTO.md)
- [Documentação API Completa](../docs/DOCUMENTACAO_API.md)
- [Quick Start](../QUICKSTART.md)
