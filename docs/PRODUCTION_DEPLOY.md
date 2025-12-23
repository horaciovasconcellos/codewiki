# Guia de Deploy em Produção

## 📋 Pré-requisitos

### Infraestrutura
- [ ] Servidor Linux (Ubuntu 20.04+ ou RHEL 8+)
- [ ] Docker 24.0+ e Docker Compose 2.0+
- [ ] 4 GB RAM mínimo (recomendado 8 GB)
- [ ] 50 GB espaço em disco
- [ ] Portas disponíveis: 80, 443, 3000, 3306
- [ ] Certificado SSL (Let's Encrypt ou outro)

### Software
- [ ] Git instalado
- [ ] Java 17+ (para Liquibase/Maven)
- [ ] Maven 3.6+ (para migrations)
- [ ] Nginx (opcional, para proxy reverso)

---

## 🔐 Segurança

### 1. Variáveis de Ambiente

Criar arquivo `.env.production` (NÃO commitar):

```bash
# Database
DB_HOST=mysql-master
DB_PORT=3306
DB_NAME=auditoria_db
DB_USER=app_user
DB_PASSWORD=SENHA_FORTE_AQUI_min16_chars
DB_ROOT_PASSWORD=ROOT_SENHA_FORTE_AQUI_min16_chars

# Replicação MySQL
REPLICATION_USER=repl_user
REPLICATION_PASSWORD=REPL_SENHA_FORTE_min16_chars

# Azure DevOps
AZURE_DEVOPS_ORG=sua-organizacao
AZURE_DEVOPS_PAT=seu_personal_access_token_seguro

# Application
NODE_ENV=production
PORT=3000
VITE_API_URL=https://seudominio.com/api

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true
LOG_DIR=/var/log/auditoria
```

### 2. Gerar Senhas Seguras

```bash
# Gerar senhas aleatórias
openssl rand -base64 32
openssl rand -hex 16

# Ou usar pwgen
pwgen -s 32 1
```

### 3. Atualizar docker-compose.yml

**NÃO USE SENHAS PADRÃO EM PRODUÇÃO!**

```yaml
environment:
  MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
  MYSQL_DATABASE: ${DB_NAME}
  MYSQL_USER: ${DB_USER}
  MYSQL_PASSWORD: ${DB_PASSWORD}
```

---

## 📦 Preparação do Código

### 1. Limpeza de Arquivos

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/sistema-de-auditoria.git
cd sistema-de-auditoria

# Executar limpeza (ver PRODUCTION_CLEANUP.md)
# Logs
find scripts/ -name "*.log" -type f -delete

# Database - arquivos de teste
cd database/
rm -f afastamento.json capabilities_300_revised.json
rm -f habilidades*.json tipo_afastamento.json tecnologia*.json
rm -f 03-*.sql 04-*.sql 05-*.sql 06-*.sql peoplesoft.sql
cd ..

# Scripts obsoletos
cd scripts/
rm -f test-*.sh diagnose-*.sh full-diagnostic.sh
rm -f add-logging-to-apis.js exemplo-pom.xml
rm -f create-*.sql fix-*.sql update-*.sql migrate-*.sql load-data.sql
rm -f migrate-*.sh load-habilidades.js
rm -f README-CARGA-*.md README_MIGRACAO_*.md
cd ..

# Spark/Template
rm -f .spark-initial-sha spark.meta.json runtime.config.json theme.json
rm -rf theme/

# Cache
rm -rf .cache/ dist/ target/

# Copiar .env.production
cp .env.production .env
```

### 2. Build da Aplicação

```bash
# Instalar dependências (production)
npm ci --production=false

# Build do frontend
npm run build

# Verificar dist/
ls -lh dist/
```

---

## 🐳 Deploy com Docker

### 1. Build das Imagens

```bash
# Build sem cache
docker-compose build --no-cache

# Verificar imagens
docker images | grep auditoria
```

### 2. Subir Containers

```bash
# Subir em background
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

### 3. Aguardar Inicialização

```bash
# MySQL Master pode demorar ~30 segundos
docker-compose logs -f mysql-master | grep "ready for connections"

# MySQL Slave
docker-compose logs -f mysql-slave | grep "ready for connections"

# App
docker-compose logs -f auditoria-app
```

---

## 💾 Database Migrations

### 1. Verificar Conexão

```bash
# Testar conexão Maven
mvn liquibase:validate -Pprod \
  -Ddb.url="jdbc:mysql://localhost:3306/auditoria_db" \
  -Ddb.username="$DB_USER" \
  -Ddb.password="$DB_PASSWORD"
```

### 2. Aplicar Migrations

```bash
# Via Maven (recomendado)
mvn liquibase:update -Pprod \
  -Ddb.url="jdbc:mysql://localhost:3306/auditoria_db" \
  -Ddb.username="$DB_USER" \
  -Ddb.password="$DB_PASSWORD"

# Ou via script helper
./liquibase-manager.sh update -p prod
```

### 3. Verificar Migrations Aplicadas

```bash
./liquibase-manager.sh history -p prod

# Ou direto no MySQL
docker exec -it mysql-master mysql -u$DB_USER -p$DB_PASSWORD auditoria_db \
  -e "SELECT * FROM DATABASECHANGELOG ORDER BY DATEEXECUTED DESC LIMIT 10;"
```

### 4. Tag da Versão (opcional)

```bash
./liquibase-manager.sh tag -p prod -t "v1.3.0-prod"
```

---

## 🔄 Carga de Dados Iniciais

### 1. Tipos de Afastamento

```bash
docker exec -i auditoria-app node -e "
const fs = require('fs');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const data = JSON.parse(fs.readFileSync('/app/data-templates/tipos-afastamento.json'));
  
  for (const tipo of data) {
    await conn.query(
      'INSERT IGNORE INTO tipos_afastamento (codigo, descricao, remunerado) VALUES (?, ?, ?)',
      [tipo.codigo, tipo.descricao, tipo.remunerado]
    );
  }
  
  console.log('✅ Tipos de afastamento carregados');
  await conn.end();
})();
"
```

### 2. Tecnologias (via script existente)

```bash
./scripts/import-tecnologias-pom.sh
```

### 3. Colaboradores e Habilidades (via load-data.sh)

```bash
# Editar load-data.sh com credenciais corretas
./scripts/load-data.sh
```

---

## 🌐 Nginx Proxy Reverso (Recomendado)

### 1. Instalar Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Virtual Host

Criar `/etc/nginx/sites-available/auditoria`:

```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logs
    access_log /var/log/nginx/auditoria_access.log;
    error_log /var/log/nginx/auditoria_error.log;
}
```

### 3. Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/auditoria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL com Let's Encrypt

```bash
sudo certbot --nginx -d seudominio.com
```

---

## 📊 Monitoramento

### 1. Health Check

```bash
# API
curl http://localhost:3000/api/health

# Deve retornar:
# {"status":"ok","database":"connected","timestamp":"..."}
```

### 2. Logs da Aplicação

```bash
# Todos os containers
docker-compose logs -f

# Apenas app
docker-compose logs -f auditoria-app

# MySQL
docker-compose logs -f mysql-master

# Últimas 100 linhas
docker-compose logs --tail=100 auditoria-app
```

### 3. Monitorar Recursos

```bash
# Stats dos containers
docker stats

# Espaço em disco
docker system df

# Volumes
docker volume ls
```

---

## 🔄 Backup e Restore

### 1. Backup do Banco de Dados

```bash
# Backup completo
./scripts/backup-mysql.sh

# Backups ficam em:
# database/backups/backup-YYYYMMDD_HHMMSS.sql
```

### 2. Restore do Banco

```bash
# Restaurar backup específico
./scripts/restore-mysql.sh database/backups/backup-20250106_143022.sql
```

### 3. Backup Automatizado (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar (backup diário às 3h)
0 3 * * * cd /caminho/para/sistema-de-auditoria && ./scripts/backup-mysql.sh >> /var/log/auditoria-backup.log 2>&1

# Limpeza de backups antigos (manter 7 dias)
0 4 * * * find /caminho/para/sistema-de-auditoria/database/backups -name "*.sql" -mtime +7 -delete
```

---

## 🔧 Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs detalhados
docker-compose logs auditoria-app

# Verificar portas em uso
sudo netstat -tulpn | grep -E ':(3000|5173|3306)'

# Recriar containers
docker-compose down
docker-compose up -d --force-recreate
```

### Problema: Erro de conexão com MySQL

```bash
# Verificar MySQL está rodando
docker-compose ps mysql-master

# Testar conexão manual
docker exec -it mysql-master mysql -uroot -p$DB_ROOT_PASSWORD

# Ver logs do MySQL
docker-compose logs mysql-master | grep ERROR
```

### Problema: Migrations não aplicam

```bash
# Verificar status
./liquibase-manager.sh status -p prod

# Limpar checksums (se necessário)
./liquibase-manager.sh clear -p prod

# Retentar
./liquibase-manager.sh update -p prod
```

### Problema: Frontend não carrega

```bash
# Verificar build existe
ls -lh dist/

# Rebuild
npm run build

# Verificar variáveis de ambiente
grep VITE_API_URL .env

# Logs do container
docker-compose logs auditoria-app
```

---

## 📈 Performance

### 1. Otimizar MySQL

```bash
# Conectar ao MySQL
docker exec -it mysql-master mysql -uroot -p$DB_ROOT_PASSWORD

# Executar:
SET GLOBAL query_cache_size = 268435456;
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_buffer_pool_size = 2G;
```

### 2. Configurar PM2 (Opcional)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar app com PM2
pm2 start npm --name "auditoria-api" -- run start

# Auto-restart
pm2 startup
pm2 save

# Monitorar
pm2 monit
```

### 3. Nginx Caching

Adicionar ao bloco `location /`:

```nginx
location / {
    # ... configuração existente ...
    
    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## ✅ Checklist Final de Deploy

### Pré-Deploy
- [ ] Código limpo (sem arquivos de desenvolvimento)
- [ ] `.env.production` configurado com senhas fortes
- [ ] `docker-compose.yml` atualizado (sem senhas padrão)
- [ ] Build testado localmente
- [ ] Backup do banco de dados existente (se houver)
- [ ] Migrations testadas em ambiente de staging
- [ ] Certificado SSL configurado

### Deploy
- [ ] Clonar repositório no servidor
- [ ] Copiar `.env.production` para `.env`
- [ ] Build das imagens Docker
- [ ] Subir containers
- [ ] Aguardar MySQL inicializar (30s)
- [ ] Aplicar migrations com Liquibase
- [ ] Carregar dados iniciais
- [ ] Configurar Nginx (se aplicável)
- [ ] Configurar SSL
- [ ] Testar health check: `/api/health`
- [ ] Testar frontend: acessar URL

### Pós-Deploy
- [ ] Configurar backup automatizado (cron)
- [ ] Configurar monitoramento (logs, alertas)
- [ ] Documentar credenciais em local seguro
- [ ] Testar todas as funcionalidades principais
- [ ] Verificar logs por erros
- [ ] Configurar firewall (portas 80, 443 abertas)
- [ ] Testar rollback de migrations
- [ ] Atualizar DNS (se necessário)
- [ ] Notificar equipe do deploy
- [ ] Atualizar CHANGELOG.md com versão de produção

---

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `docker-compose logs -f`
2. Consultar [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. Verificar [Issues no GitHub](https://github.com/seu-usuario/sistema-de-auditoria/issues)
4. Contatar equipe de desenvolvimento

---

**Versão do Documento**: 1.0  
**Última Atualização**: Janeiro 2025  
**Sistema**: v1.3.0
