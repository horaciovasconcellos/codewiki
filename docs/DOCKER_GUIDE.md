# 🐳 Ambiente Docker Completo

Este projeto está completamente containerizado usando Docker Compose. Todos os serviços rodam em containers isolados.

## 📦 Arquitetura de Containers

```
┌─────────────────────────────────────────┐
│         auditoria-app                   │
│  ┌──────────────┐  ┌─────────────┐    │
│  │   Frontend   │  │   Backend   │    │
│  │  Vite:5173   │  │  Node:3000  │    │
│  └──────────────┘  └─────────────┘    │
└─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│         mysql-master (3306)             │
│         ┌─────────┐                     │
│         │  MySQL  │  ← Replicação →    │
│         └─────────┘                     │
│                                         │
│         mysql-slave (3307)              │
│         ┌─────────┐                     │
│         │  MySQL  │                     │
│         └─────────┘                     │
└─────────────────────────────────────────┘
```

## 🚀 Início Rápido

### Pré-requisitos
- Docker Desktop instalado e rodando
- Porta 3000, 3306, 3307 e 5173 disponíveis

### Comandos Básicos

```bash
# Iniciar toda a aplicação
./docker-manager.sh start

# Parar a aplicação
./docker-manager.sh stop

# Reiniciar
./docker-manager.sh restart

# Ver logs
./docker-manager.sh logs

# Verificar saúde dos serviços
./docker-manager.sh health

# Ver status
./docker-manager.sh status
```

## 📝 Gerenciamento com docker-manager.sh

O script `docker-manager.sh` fornece comandos convenientes para gerenciar o ambiente:

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `build` | Constrói/reconstrói as imagens Docker |
| `start` | Inicia todos os containers |
| `stop` | Para todos os containers |
| `restart` | Reinicia todos os containers |
| `logs [serviço]` | Exibe logs em tempo real |
| `status` | Mostra status e uso de recursos |
| `health` | Verifica saúde de todos os serviços |
| `shell [serviço]` | Abre shell interativo no container |
| `clean` | Remove containers, volumes e imagens |
| `help` | Exibe ajuda completa |

### Exemplos de Uso

```bash
# Ver logs da aplicação
./docker-manager.sh logs app

# Ver logs do MySQL
./docker-manager.sh logs mysql-master

# Abrir shell no container da aplicação
./docker-manager.sh shell app

# Limpar tudo e começar do zero
./docker-manager.sh clean
./docker-manager.sh build
./docker-manager.sh start
```

## 🔧 Usando Docker Compose Diretamente

Se preferir usar comandos Docker Compose nativos:

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs
docker-compose logs -f app

# Reconstruir imagens
docker-compose build --no-cache

# Ver status
docker-compose ps

# Executar comando em container
docker-compose exec app sh
```

## 🌐 Acessando os Serviços

Após iniciar com `./docker-manager.sh start`:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **MySQL Master**: `localhost:3306`
- **MySQL Slave**: `localhost:3307`

### Credenciais MySQL

```
Host: localhost
Port: 3306 (master) / 3307 (slave)
Database: auditoria_db
User: app_user
Password: apppass123
Root Password: rootpass123
```

## 🔍 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Verificar se portas estão em uso
lsof -i :3000
lsof -i :5173
lsof -i :3306
```

### Rebuild completo

```bash
# Parar tudo
docker-compose down -v

# Rebuild sem cache
docker-compose build --no-cache

# Iniciar novamente
docker-compose up -d
```

### Hot Reload não funciona

O Vite está configurado com `usePolling: true` para funcionar com volumes Docker. Se mesmo assim não funcionar:

1. Verifique se os volumes estão montados corretamente:
   ```bash
   docker-compose exec app ls -la /app/src
   ```

2. Restart do container:
   ```bash
   docker-compose restart app
   ```

### MySQL não conecta

```bash
# Verificar se MySQL está rodando
docker-compose exec mysql-master mysqladmin ping -h localhost -uroot -prootpass123

# Ver logs do MySQL
docker-compose logs mysql-master

# Entrar no MySQL
docker-compose exec mysql-master mysql -uroot -prootpass123 auditoria_db
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
# Com o script
./docker-manager.sh status

# Diretamente com Docker
docker stats $(docker-compose ps -q)
```

### Verificar saúde

```bash
# Com o script
./docker-manager.sh health

# Verificar health check do Docker
docker-compose ps
```

## 🔄 Desenvolvimento

### Volumes Montados

Os seguintes diretórios estão montados como volumes para hot reload:

- `./src` → `/app/src` (código frontend)
- `./server` → `/app/server` (código backend)
- `./public` → `/app/public` (assets públicos)
- `./database` → `/app/database` (scripts SQL)
- `./data-templates` → `/app/data-templates` (templates de dados)

### Alterações refletem automaticamente

Mudanças nesses diretórios são detectadas automaticamente:
- **Frontend**: Vite faz hot reload
- **Backend**: Precisa restart manual do Node (ou use nodemon)

### Adicionar nova dependência

```bash
# Entrar no container
docker-compose exec app sh

# Instalar dependência
npm install <pacote>

# Ou rebuild do container
docker-compose build app
docker-compose restart app
```

## 🧹 Limpeza

### Limpar volumes e dados

```bash
# Usar o script (recomendado)
./docker-manager.sh clean

# Ou manualmente
docker-compose down -v
docker-compose rm -f
```

### Limpar imagens não usadas

```bash
# Limpar imagens Docker órfãs
docker image prune -a

# Limpar tudo (cuidado!)
docker system prune -a --volumes
```

## 🏗️ Estrutura de Arquivos Docker

```
.
├── Dockerfile              # Imagem da aplicação (frontend + backend)
├── docker-compose.yml      # Orquestração de todos os serviços
├── docker-manager.sh       # Script de gerenciamento
├── .dockerignore          # Arquivos ignorados no build
└── database/
    ├── 01-init-schema-data.sql
    ├── 02-setup-replication.sh
    ├── 03-create-configuracoes.sql
    └── 04-create-logs.sql
```

## 🔐 Segurança

### Produção

Para ambiente de produção, altere:

1. Senhas do MySQL no `docker-compose.yml`
2. Use secrets do Docker Swarm ou Kubernetes
3. Configure HTTPS/TLS
4. Use imagens multi-stage para reduzir tamanho
5. Execute como usuário não-root

### Variáveis de Ambiente

Variáveis sensíveis devem ser movidas para arquivo `.env`:

```bash
# .env
MYSQL_ROOT_PASSWORD=sua_senha_segura
MYSQL_PASSWORD=sua_senha_app
```

Referência no `docker-compose.yml`:
```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
```

## 📚 Recursos Adicionais

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Vite in Docker](https://vitejs.dev/guide/static-deploy.html)

## ❓ Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `./docker-manager.sh logs`
2. Verifique saúde: `./docker-manager.sh health`
3. Consulte a seção Troubleshooting acima
4. Abra uma issue no repositório
