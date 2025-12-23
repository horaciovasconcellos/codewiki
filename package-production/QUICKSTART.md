# Quick Start - Sistema de Auditoria

## ✅ Sistema Configurado e Funcionando!

### Problemas Resolvidos
- ✅ Erro `MODULE_NOT_FOUND` do Rollup (incompatibilidade Alpine + ARM64)
- ✅ HTTP 404 - falta do arquivo `index.html`
- ✅ Dependência `ulid` não instalada
- ✅ Configuração de portas e volumes
- ✅ **API Backend implementada** (Express.js na porta 3000)

### Acessar a Aplicação
🌐 **Frontend:** http://localhost:5173  
🔌 **API:** http://localhost:5173/api/... (proxy para porta 3000)

### Serviços Disponíveis
- **Aplicação React/Vite:** porta 5173 (host) → 5000 (container)
- **API Express:** porta 3000 (acessível via proxy do Vite)
- **MySQL Master:** porta 3306
- **MySQL Slave:** porta 3307

### Comandos Úteis

#### Iniciar tudo
```bash
docker-compose up -d
```

#### Parar tudo
```bash
docker-compose down
```

#### Ver logs
```bash
# App
docker logs -f auditoria-app

# MySQL Master
docker logs -f mysql-master

# Todos os serviços
docker-compose logs -f
```

#### Reconstruir do zero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

#### Verificar status
```bash
docker-compose ps
```

#### Executar comandos no container
```bash
# Instalar pacote
docker exec auditoria-app npm install <pacote>

# Shell interativo
docker exec -it auditoria-app sh
```

### Credenciais do Banco de Dados
```
Host: mysql-master (ou localhost:3306)
Database: auditoria_db
User: app_user
Password: apppass123
Root Password: rootpass123
```

### Arquivos Importantes Criados/Modificados
- ✏️ `Dockerfile` - Mudança de Alpine para Debian Slim, expõe portas 5173 e 3000
- ✏️ `docker-compose.yml` - Plataforma, volumes e mapeamento de portas
- ✏️ `vite.config.ts` - Configuração de servidor com proxy para API
- ✏️ `package.json` - Adicionado `ulid@^2.3.0`, `express`, `cors`, `concurrently`
- ➕ `index.html` - Arquivo HTML principal (estava faltando)
- ➕ `.dockerignore` - Otimização de build
- ➕ `server/api.js` - **Servidor Express com API REST completa**
- ➕ `server/README.md` - Documentação do servidor API

### Estrutura de Volumes
```yaml
volumes:
  - ./src:/app/src          # Hot-reload para código fonte
  - ./public:/app/public    # Arquivos públicos
  - /app/node_modules       # Isolado do host
```

### Troubleshooting

#### Porta 5173 em uso?
Altere no `docker-compose.yml`:
```yaml
ports:
  - "OUTRA_PORTA:5000"  # Ex: "8080:5000"
```

#### Aplicação não carrega?
```bash
# 1. Verificar logs
docker logs auditoria-app

# 2. Verificar se está rodando
docker-compose ps

# 3. Testar conectividade
curl http://localhost:5173
```

#### Erro de dependências?
```bash
# Reconstruir sem cache
docker-compose build --no-cache app
docker-compose up -d app
```

#### Hot-reload não funciona?
Certifique-se de que os volumes estão montados corretamente:
```bash
docker inspect auditoria-app | grep -A 10 Mounts
```

### Documentação Completa
Ver: `DOCKER_SETUP.md`

---

## 🧪 Testando a API

### Criar Tipo de Afastamento

```bash
curl -X POST http://localhost:5173/api/tipos-afastamento \
  -H 'Content-Type: application/json' \
  -d '{
    "sigla": "BH",
    "descricao": "Banco de Horas",
    "argumentacaoLegal": "CCT 2024/2025 Cláusula 22",
    "numeroDias": 10,
    "tipoTempo": "N"
  }' | jq
```

### Listar Todos os Tipos

```bash
curl http://localhost:5173/api/tipos-afastamento | jq
```

### Buscar por ID

```bash
curl http://localhost:5173/api/tipos-afastamento/550e8400-e29b-41d4-a716-446655440001 | jq
```

### Health Check

```bash
curl http://localhost:3000/health | jq
```

**Mais exemplos**: Ver `docs/EXEMPLO_POST_TIPO_AFASTAMENTO.md`
