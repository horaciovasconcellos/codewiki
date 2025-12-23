# 🚀 Guia de Deployment - Sistema de Auditoria

**Versão:** 1.0.0  
**Data:** 14 de Dezembro de 2025  
**Ambiente:** Produção

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação](#preparação)
3. [Build e Empacotamento](#build-e-empacotamento)
4. [Deploy](#deploy)
5. [Configuração](#configuração)
6. [Verificação](#verificação)
7. [Manutenção](#manutenção)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Servidor de Produção

- **Sistema Operacional:** Linux (Ubuntu 20.04+ ou CentOS 8+)
- **RAM:** Mínimo 4GB (recomendado 8GB)
- **Disco:** Mínimo 20GB livre
- **CPU:** 2 cores (recomendado 4)

### Software Necessário

```bash
# Docker
docker --version  # >= 20.10

# Docker Compose
docker-compose --version  # >= 2.0

# Git (opcional)
git --version

# Node.js (para build local)
node --version  # >= 18.0
npm --version   # >= 9.0
```

### Instalação do Docker (se necessário)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalação
docker run hello-world
```

### Portas Necessárias

- **80** - HTTP (Nginx, opcional)
- **443** - HTTPS (Nginx, opcional)
- **3000** - API/Aplicação
- **3307** - MySQL Master (externo)
- **3308** - MySQL Slave (externo, opcional)

---

## 🎯 Preparação

### 1. Clone ou baixe o repositório

```bash
# Opção A: Git
git clone https://github.com/seu-usuario/sistema-de-auditoria.git
cd sistema-de-auditoria

# Opção B: Download do pacote
wget https://releases.example.com/sistema-auditoria-v1.0.0.tar.gz
tar -xzf sistema-auditoria-v1.0.0.tar.gz
cd sistema-auditoria
```

### 2. Estrutura de diretórios

```
sistema-auditoria/
├── dist/                  # Frontend build
├── server/               # Backend Node.js
├── database/            # SQL scripts
├── scripts/             # Utilitários
├── docker-compose.yml   # Desenvolvimento
├── docker-compose.prod.yml  # Produção
├── Dockerfile
├── .env.example
└── build-production.sh
```

---

## 🏗️ Build e Empacotamento

### Build Local (desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Build do frontend
npm run build

# 3. Testar localmente
npm run preview
```

### Build para Produção

```bash
# Executar script de build
./build-production.sh
```

Isso irá:
- ✅ Limpar builds anteriores
- ✅ Instalar dependências
- ✅ Fazer build do frontend
- ✅ Preparar estrutura de produção
- ✅ Criar pacote compactado
- ✅ Gerar documentação de deploy

**Output:**
```
sistema-auditoria-v1.0.0-20251214_131400.tar.gz
```

---

## 🚀 Deploy

### Método 1: Deploy com Docker Compose (Recomendado)

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # ou vim .env

# 2. Build das imagens
docker-compose -f docker-compose.prod.yml build

# 3. Iniciar serviços
docker-compose -f docker-compose.prod.yml up -d

# 4. Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### Método 2: Deploy Manual com Scripts

```bash
# Usar o script de gerenciamento
./scripts/docker-manager.sh start
```

### Método 3: Deploy com Nginx

```bash
# Iniciar com perfil Nginx
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# === Banco de Dados ===
MYSQL_HOST=mysql-master
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=CHANGE_ME_STRONG_PASSWORD
MYSQL_DATABASE=auditoria_db
MYSQL_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD

# === API ===
API_PORT=3000
NODE_ENV=production

# === Segurança ===
JWT_SECRET=CHANGE_ME_RANDOM_SECRET_KEY
SESSION_SECRET=CHANGE_ME_SESSION_SECRET

# === Opcional ===
TZ=America/Sao_Paulo
LOG_LEVEL=info
```

⚠️ **IMPORTANTE:** Altere todas as senhas padrão!

### Gerar Senhas Seguras

```bash
# Gerar senha aleatória
openssl rand -base64 32

# Gerar múltiplas senhas
for i in {1..3}; do openssl rand -base64 32; done
```

### Configuração do Nginx (se usar)

```bash
# Editar configuração
nano nginx.conf

# Alterar:
# - server_name para seu domínio
# - Configurar SSL se tiver certificado
# - Ajustar timeouts se necessário
```

---

## ✅ Verificação

### 1. Verificar Containers

```bash
docker ps

# Deve mostrar:
# - auditoria-app-prod (UP)
# - mysql-master-prod (healthy)
# - mysql-slave-prod (healthy, opcional)
# - nginx-prod (UP, se ativado)
```

### 2. Verificar Logs

```bash
# Logs da aplicação
docker logs auditoria-app-prod -f

# Logs do MySQL
docker logs mysql-master-prod --tail 50

# Logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Testar Conectividade

```bash
# Health check
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"ok","timestamp":"..."}

# Testar API
curl http://localhost:3000/api/aplicacoes
```

### 4. Testar Interface Web

Abra no navegador:
```
http://seu-servidor:3000
```

ou

```
http://seu-dominio.com (se usar Nginx)
```

### 5. Verificar Banco de Dados

```bash
# Conectar no MySQL
docker exec -it mysql-master-prod mysql -u root -p

# Verificar database
SHOW DATABASES;
USE auditoria_db;
SHOW TABLES;
SELECT COUNT(*) FROM aplicacoes;
```

---

## 🔄 Manutenção

### Backup do Banco de Dados

```bash
# Backup completo
docker exec mysql-master-prod mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup apenas do banco de auditoria
docker exec mysql-master-prod mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  auditoria_db \
  > backup_auditoria_$(date +%Y%m%d_%H%M%S).sql

# Compactar backup
gzip backup_*.sql
```

### Restaurar Backup

```bash
# Restaurar backup
docker exec -i mysql-master-prod mysql \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  auditoria_db < backup_auditoria.sql

# Ou se estiver compactado
gunzip < backup_auditoria.sql.gz | \
  docker exec -i mysql-master-prod mysql \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  auditoria_db
```

### Atualização da Aplicação

```bash
# 1. Backup antes de atualizar
./scripts/docker-manager.sh backup

# 2. Parar serviços
docker-compose -f docker-compose.prod.yml down

# 3. Atualizar código
git pull origin main
# ou extrair novo pacote

# 4. Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# 5. Reiniciar
docker-compose -f docker-compose.prod.yml up -d

# 6. Verificar
docker-compose -f docker-compose.prod.yml logs -f
```

### Limpeza de Logs

```bash
# Limpar logs antigos do Docker
docker system prune -a --volumes --filter "until=168h"

# Limpar logs da aplicação
find ./logs -name "*.log" -mtime +7 -delete
```

### Monitoramento

```bash
# Uso de recursos
docker stats

# Espaço em disco
docker system df

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

---

## 🔍 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar logs
docker logs auditoria-app-prod --tail 100

# Causas comuns:
# - Banco de dados não está pronto
# - Variáveis de ambiente incorretas
# - Porta 3000 já em uso

# Solução:
docker-compose -f docker-compose.prod.yml restart app
```

### Problema: Erro de conexão com banco

```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Testar conexão
docker exec -it mysql-master-prod mysql -u root -p

# Se não conectar:
docker-compose -f docker-compose.prod.yml restart mysql-master
```

### Problema: Porta 3000 já em uso

```bash
# Identificar processo
sudo lsof -i :3000

# Parar processo
sudo kill -9 <PID>

# Ou alterar porta no .env
# API_PORT=3001
```

### Problema: Frontend não carrega

```bash
# Verificar build
ls -la dist/

# Rebuild se necessário
npm run build
docker-compose -f docker-compose.prod.yml restart app
```

### Problema: Lentidão no banco

```bash
# Verificar uso de recursos
docker stats mysql-master-prod

# Otimizar banco
docker exec -it mysql-master-prod mysql -u root -p
ANALYZE TABLE aplicacoes;
OPTIMIZE TABLE aplicacoes;
```

### Logs Importantes

```bash
# Aplicação
docker logs auditoria-app-prod --tail 200

# MySQL
docker logs mysql-master-prod --tail 100

# Nginx (se usar)
docker exec nginx-prod cat /var/log/nginx/error.log
```

---

## 📊 Métricas e Monitoramento

### Comandos Úteis

```bash
# Status dos serviços
./scripts/docker-manager.sh status

# Uso de CPU e memória
docker stats --no-stream

# Tamanho dos volumes
docker volume ls -q | xargs docker volume inspect \
  --format '{{ .Name }}: {{ .Mountpoint }}' | \
  xargs -I {} du -sh {}
```

### Health Checks

```bash
# Application
curl http://localhost:3000/health

# MySQL
docker exec mysql-master-prod mysqladmin ping -h localhost

# Todos os containers
docker inspect --format='{{.Name}}: {{.State.Health.Status}}' \
  $(docker ps -q)
```

---

## 🔐 Segurança

### Checklist de Segurança

- [ ] Alterar todas as senhas padrão
- [ ] Configurar firewall (UFW, iptables)
- [ ] Habilitar HTTPS (Let's Encrypt)
- [ ] Limitar acesso às portas do MySQL
- [ ] Configurar backups automáticos
- [ ] Atualizar regularmente
- [ ] Monitorar logs de erro
- [ ] Implementar rate limiting

### Configurar Firewall (UFW)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # API (se necessário)

# Verificar status
sudo ufw status
```

### Configurar SSL (Let's Encrypt)

```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Auto-renovação
sudo certbot renew --dry-run
```

---

## 📞 Suporte

### Documentação Adicional

- `README.md` - Visão geral do projeto
- `QUICKSTART.md` - Guia rápido
- `CHANGELOG.md` - Histórico de versões
- `docs/` - Documentação completa

### Logs e Debugging

```bash
# Debug mode
NODE_ENV=development docker-compose up

# Verbose logging
LOG_LEVEL=debug docker-compose up
```

### Contatos

- **Issues:** https://github.com/seu-usuario/sistema-auditoria/issues
- **Email:** suporte@example.com
- **Docs:** https://docs.example.com

---

## ✨ Checklist Final

Antes de considerar o deploy completo:

- [ ] Build executado com sucesso
- [ ] Containers rodando e saudáveis
- [ ] Banco de dados inicializado
- [ ] Variáveis de ambiente configuradas
- [ ] Senhas alteradas
- [ ] Interface web acessível
- [ ] APIs respondendo
- [ ] Health checks passando
- [ ] Logs sem erros críticos
- [ ] Backup configurado
- [ ] Firewall configurado
- [ ] Monitoramento ativo
- [ ] Documentação revisada

---

**🎉 Deploy Completo! Sistema pronto para produção.**

Data do deploy: _____________  
Responsável: _____________  
Versão: _____________
