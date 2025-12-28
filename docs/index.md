# 🚀 Guia de Execução - Sistema de Auditoria

**Versão:** 1.0.0  
**Data:** 24 de Dezembro de 2025  
**Autor:** Horacio Vasconcellos

---

## 📋 Visão Geral

O Sistema de Auditoria é uma aplicação web completa para gestão de aplicações, tecnologias, processos de negócio, colaboradores e contratos. Este guia descreve como executar o sistema em ambientes de **Desenvolvimento (Dev)** e **Produção (Prod)**.

---

## 🎯 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│           Vite + TypeScript + TailwindCSS            │
│                  Porta: 3000 / 5173                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Node.js/Express)               │
│              API REST + Logging                      │
│                  Porta: 3000                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 MYSQL MASTER                         │
│            Banco de Dados Principal                  │
│                  Porta: 3306                         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 MYSQL SLAVE                          │
│            Réplica (Leitura)                         │
│                  Porta: 3307                         │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Requisitos do Sistema

### Hardware Mínimo
- **CPU:** 2 cores (recomendado 4 cores)
- **RAM:** 4GB (recomendado 8GB)
- **Disco:** 20GB de espaço livre

### Software Obrigatório
- **Docker:** versão 20.10 ou superior
- **Docker Compose:** versão 2.0 ou superior
- **Git:** para clonar o repositório

### Sistema Operacional
- **Linux:** Ubuntu 20.04+, CentOS 8+, Debian 11+
- **macOS:** 11.0 (Big Sur) ou superior
- **Windows:** 10/11 com WSL2

---

## 🛠️ Instalação do Docker

### Linux (Ubuntu/Debian)

```bash
# Remover versões antigas
sudo apt-get remove docker docker-engine docker.io containerd runc

# Instalar dependências
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Configurar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### macOS

```bash
# Baixar Docker Desktop
# https://www.docker.com/products/docker-desktop

# Ou usando Homebrew
brew install --cask docker

# Iniciar Docker Desktop
open -a Docker

# Verificar instalação
docker --version
docker compose version
```

### Windows (WSL2)

```powershell
# 1. Habilitar WSL2
wsl --install

# 2. Baixar e instalar Docker Desktop
# https://www.docker.com/products/docker-desktop

# 3. Configurar Docker para usar WSL2

# 4. Verificar instalação no WSL2
docker --version
docker compose version
```

---

## 📥 Clonando o Repositório

```bash
# Clonar o repositório
git clone https://github.com/horaciovasconcellos/sistema-de-auditoria.git

# Acessar o diretório
cd sistema-de-auditoria

# Verificar a branch
git branch
```

---

## 🗄️ Configuração do Banco de Dados Persistente

### Diretórios de Persistência

O sistema utiliza volumes Docker montados em diretórios do host para garantir a persistência dos dados:

```bash
# Estrutura de diretórios (criados automaticamente)
~/docker/mysql/
├── master/
│   ├── data/          # Dados do MySQL Master
│   ├── logs/          # Logs do MySQL Master
│   ├── backup/        # Backups do MySQL Master
│   └── config/        # Configurações customizadas
│       └── master.cnf
└── slave/
    ├── data/          # Dados do MySQL Slave
    ├── logs/          # Logs do MySQL Slave
    ├── backup/        # Backups do MySQL Slave
    └── config/        # Configurações customizadas
        └── slave.cnf
```

### Criar Estrutura de Diretórios

```bash
# Criar diretórios para MySQL Master
mkdir -p ~/docker/mysql/master/{data,logs,backup,config}

# Criar diretórios para MySQL Slave
mkdir -p ~/docker/mysql/slave/{data,logs,backup,config}

# Definir permissões (Linux)
sudo chown -R $USER:$USER ~/docker/mysql
chmod -R 755 ~/docker/mysql
```

### Configuração do MySQL Master

Criar arquivo de configuração:

```bash
cat > ~/docker/mysql/master/config/master.cnf << 'EOF'
[mysqld]
# Configurações de Replicação
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
binlog_do_db = auditoria_db

# Performance
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
EOF
```

### Configuração do MySQL Slave

Criar arquivo de configuração:

```bash
cat > ~/docker/mysql/slave/config/slave.cnf << 'EOF'
[mysqld]
# Configurações de Replicação
server-id = 2
relay-log = relay-bin
read_only = 1
log_bin = mysql-bin
binlog_format = ROW

# Performance
max_connections = 200
innodb_buffer_pool_size = 512M

# Logs
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
EOF
```

---

## 🔧 Configuração de Variáveis de Ambiente

### Arquivo .env (Desenvolvimento)

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

Conteúdo do `.env`:

```env
# Banco de Dados
MYSQL_ROOT_PASSWORD=rootpass123
MYSQL_DATABASE=auditoria_db
MYSQL_USER=app_user
MYSQL_PASSWORD=apppass123

# API
NODE_ENV=development
API_PORT=3000

# Aplicação
VITE_API_URL=http://localhost:3000
```

### Arquivo .env.production (Produção)

```env
# Banco de Dados
MYSQL_ROOT_PASSWORD=<SENHA_FORTE_ROOT>
MYSQL_DATABASE=auditoria_db
MYSQL_USER=app_user
MYSQL_PASSWORD=<SENHA_FORTE_APP>

# API
NODE_ENV=production
API_PORT=3000

# Aplicação
VITE_API_URL=https://seu-dominio.com
```

**⚠️ IMPORTANTE:** Sempre altere as senhas padrão em produção!

### Gerar Senhas Seguras

```bash
# Gerar senha aleatória
openssl rand -base64 32

# Exemplo de saída:
# xK8pQ2mN5vL9wR7tY3nJ6bH4cF1dG8sA
```

---

## 🚀 Ambiente de Desenvolvimento (Dev)

### 1. Iniciar Containers

```bash
# Acessar diretório do projeto
cd sistema-de-auditoria

# Iniciar todos os containers
docker compose up -d

# Verificar status
docker compose ps
```

### 2. Verificar Logs

```bash
# Logs de todos os containers
docker compose logs -f

# Logs da aplicação
docker compose logs -f app

# Logs do MySQL Master
docker compose logs -f mysql-master

# Logs do MySQL Slave
docker compose logs -f mysql-slave

# Logs do MkDocs
docker compose logs -f mkdocs
```

### 3. Acessar a Aplicação

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **API** | http://localhost:3000/api | API REST |
| **Vite Dev** | http://localhost:5173 | Hot reload (dev) |
| **Docs** | http://localhost:8000 | Documentação MkDocs |
| **MySQL Master** | localhost:3306 | Banco principal |
| **MySQL Slave** | localhost:3307 | Banco réplica |

### 4. Verificar Health Checks

```bash
# Health check da aplicação
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"healthy","timestamp":"...","database":"connected"}

# Health check do MySQL Master
docker exec mysql-master mysqladmin ping -h localhost -uroot -prootpass123

# Resposta esperada:
# mysqld is alive
```

### 5. Modo de Desenvolvimento com Hot Reload

O ambiente de desenvolvimento está configurado com volumes montados para permitir alterações em tempo real:

```yaml
volumes:
  - ./src:/app/src              # Frontend
  - ./server:/app/server        # Backend
  - ./public:/app/public        # Assets públicos
  - ./database:/app/database    # Scripts SQL
```

**Fluxo de trabalho:**
1. Edite arquivos em `src/` ou `server/`
2. As alterações são detectadas automaticamente
3. Frontend recarrega via Vite (Hot Module Replacement)
4. Backend recarrega via Nodemon

### 6. Executar Comandos Dentro dos Containers

```bash
# Acessar shell do container da aplicação
docker exec -it auditoria-app sh

# Acessar MySQL Master
docker exec -it mysql-master mysql -uroot -prootpass123 auditoria_db

# Acessar MySQL Slave
docker exec -it mysql-slave mysql -uroot -prootpass123 auditoria_db
```

### 7. Parar Containers

```bash
# Parar containers (mantém dados)
docker compose stop

# Parar e remover containers (mantém volumes)
docker compose down

# Parar, remover containers e volumes (⚠️ PERDE DADOS)
docker compose down -v
```

---

## 🏭 Ambiente de Produção (Prod)

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl git

# Instalar Docker (veja seção anterior)

# Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 2. Clonar e Configurar

```bash
# Clonar repositório
git clone https://github.com/horaciovasconcellos/sistema-de-auditoria.git
cd sistema-de-auditoria

# Criar .env de produção
cp .env.example .env.production

# Editar configurações
nano .env.production

# Gerar senhas seguras
echo "MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)" >> .env.production
echo "MYSQL_PASSWORD=$(openssl rand -base64 32)" >> .env.production
```

### 3. Build de Produção

```bash
# Usar docker-compose de produção
docker compose -f docker-compose.prod.yml build

# Iniciar containers
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

### 4. Configurar Nginx (Opcional - para HTTPS)

```bash
# Instalar Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/auditoria
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/auditoria /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx

# Configurar SSL (Let's Encrypt)
sudo certbot --nginx -d seu-dominio.com
```

### 5. Backup Automatizado

Criar script de backup:

```bash
sudo nano /usr/local/bin/backup-auditoria.sh
```

Conteúdo:

```bash
#!/bin/bash
BACKUP_DIR=~/docker/mysql/master/backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="auditoria_backup_${DATE}.sql"

# Criar backup
docker exec mysql-master mysqldump -uroot -prootpass123 \
  --single-transaction \
  --routines \
  --triggers \
  auditoria_db > ${BACKUP_DIR}/${BACKUP_FILE}

# Comprimir backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Manter apenas últimos 30 dias
find ${BACKUP_DIR} -name "auditoria_backup_*.sql.gz" -mtime +30 -delete

echo "Backup criado: ${BACKUP_FILE}.gz"
```

```bash
# Dar permissão de execução
sudo chmod +x /usr/local/bin/backup-auditoria.sh

# Configurar cron para backup diário às 2h
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-auditoria.sh") | crontab -
```

### 6. Monitoramento

```bash
# Verificar uso de recursos
docker stats

# Verificar logs em tempo real
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Verificar espaço em disco
df -h ~/docker/mysql

# Verificar tamanho do banco
docker exec mysql-master mysql -uroot -prootpass123 -e \
  "SELECT table_schema AS 'Database', 
   ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' 
   FROM information_schema.tables 
   WHERE table_schema = 'auditoria_db';"
```

---

## 🔄 Manutenção e Operação

### Atualizar Aplicação

```bash
# Parar containers
docker compose down

# Atualizar código
git pull origin main

# Reconstruir imagens
docker compose build --no-cache

# Iniciar containers
docker compose up -d

# Verificar logs
docker compose logs -f
```

### Resetar Banco de Dados (Dev)

```bash
# ⚠️ ATENÇÃO: Isso apaga TODOS os dados!
docker compose down -v

# Remover diretórios de dados
rm -rf ~/docker/mysql/master/data/*
rm -rf ~/docker/mysql/slave/data/*

# Reiniciar containers (irá recriar o banco)
docker compose up -d

# Aguardar inicialização (30-60 segundos)
docker compose logs -f mysql-master
```

### Restaurar Backup

```bash
# Parar aplicação
docker compose stop app

# Restaurar backup
gunzip < ~/docker/mysql/master/backup/auditoria_backup_20251224.sql.gz | \
  docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db

# Reiniciar aplicação
docker compose start app
```

### Replicação Master-Slave

Verificar status da replicação:

```bash
# No Master - verificar binlog
docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW MASTER STATUS;"

# No Slave - verificar replicação
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G"
```

Saída esperada no Slave:
```
Slave_IO_Running: Yes
Slave_SQL_Running: Yes
Seconds_Behind_Master: 0
```

---

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker compose logs mysql-master

# Verificar permissões
ls -la ~/docker/mysql/master/data

# Verificar espaço em disco
df -h

# Limpar volumes órfãos
docker volume prune
```

### Erro de conexão com banco

```bash
# Verificar se MySQL está rodando
docker compose ps mysql-master

# Testar conexão
docker exec mysql-master mysqladmin ping -uroot -prootpass123

# Verificar porta
netstat -tulpn | grep 3306

# Verificar health check
docker inspect mysql-master | grep Health -A 10
```

### Aplicação lenta

```bash
# Verificar uso de recursos
docker stats

# Verificar queries lentas
docker exec mysql-master tail -n 50 /var/log/mysql/slow-query.log

# Otimizar banco (dev)
docker exec mysql-master mysqlcheck -uroot -prootpass123 --optimize --all-databases
```

### Porta já em uso

```bash
# Verificar quem está usando a porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou alterar porta no docker-compose.yml
```

---

## 📊 Estrutura de Dados

### Tabelas Principais

- **aplicacoes** - Cadastro de aplicações
- **tecnologias** - Tecnologias utilizadas
- **colaboradores** - Gestão de colaboradores
- **capacidades_negocio** - Capacidades de negócio
- **processos_negocio** - Processos de negócio
- **contratos** - Contratos e SLAs
- **runbooks** - Procedimentos operacionais
- **logs_auditoria** - Logs de auditoria do sistema

### Scripts de Inicialização

Os scripts SQL são executados automaticamente na primeira inicialização:

1. `01-init-schema-data.sql` - Cria esquema e tabelas principais
2. `03-create-configuracoes.sql` - Tabelas de configuração
3. `04-create-logs.sql` - Sistema de logging
4. `15-create-avaliacoes-colaborador.sql` - Avaliações
5. `16-create-colaborador-habilidades.sql` - Habilidades

---

## 🔐 Segurança

### Checklist de Segurança (Produção)

- [ ] Alterar todas as senhas padrão
- [ ] Configurar firewall (UFW/iptables)
- [ ] Habilitar HTTPS com Let's Encrypt
- [ ] Limitar acesso ao MySQL (bind localhost)
- [ ] Configurar backups automáticos
- [ ] Monitorar logs de acesso
- [ ] Atualizar sistema operacional regularmente
- [ ] Implementar política de senha forte
- [ ] Configurar fail2ban para proteção contra brute force
- [ ] Desabilitar acesso root via SSH

### Limitar Acesso ao MySQL

Editar `docker-compose.yml`:

```yaml
mysql-master:
  ports:
    - "127.0.0.1:3306:3306"  # Apenas localhost
```

---

## 📚 Recursos Adicionais

### Documentação

- **API:** http://localhost:8000/api-catalog/
- **Runbooks:** http://localhost:8000/runbooks/
- **Este Guia:** http://localhost:8000

### Comandos Úteis

```bash
# Visualizar todos os containers
docker ps -a

# Visualizar volumes
docker volume ls

# Visualizar uso de espaço
docker system df

# Limpar sistema Docker
docker system prune -a

# Exportar banco de dados
docker exec mysql-master mysqldump -uroot -prootpass123 auditoria_db > backup.sql

# Importar banco de dados
docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db < backup.sql
```

---

## 📞 Suporte

### Logs e Diagnóstico

Antes de reportar problemas, colete as seguintes informações:

```bash
# Versão do Docker
docker --version

# Versão do Docker Compose
docker compose version

# Status dos containers
docker compose ps

# Logs da aplicação (últimas 100 linhas)
docker compose logs --tail=100 > logs.txt

# Uso de recursos
docker stats --no-stream > stats.txt
```

### Contato

- **GitHub:** https://github.com/horaciovasconcellos/sistema-de-auditoria
- **Issues:** https://github.com/horaciovasconcellos/sistema-de-auditoria/issues
- **Email:** horaciovasconcellos@example.com

---

## 📝 Changelog

### v1.0.0 - 24/12/2025
- ✅ Release inicial
- ✅ Suporte a Docker Compose
- ✅ Replicação Master-Slave
- ✅ Sistema de logging completo
- ✅ Ambiente Dev e Prod

---

**Última atualização:** 24 de Dezembro de 2025  
**Autor:** Horacio Vasconcellos  
**Licença:** MIT
