# 🚀 GUIA COMPLETO DE DEPLOY EM PRODUÇÃO

## Sistema de Auditoria - Procedimento de Deploy

---

## 📋 Pré-requisitos

### Software Necessário
- **Docker**: 20.10+ ([instalar](https://docs.docker.com/get-docker/))
- **Docker Compose**: 2.0+ (geralmente incluído com Docker Desktop)
- **Node.js**: 20+ (apenas para build local)
- **npm**: 10+
- **Git**: Para versionamento

### Recursos Mínimos do Servidor
- **CPU**: 2 cores
- **RAM**: 4GB (mínimo), 8GB (recomendado)
- **Disco**: 20GB livres
- **Sistema Operacional**: Linux (Ubuntu 22.04 LTS recomendado)

### Portas Necessárias
- `80`: HTTP (Nginx)
- `443`: HTTPS (Nginx com SSL)
- `3000`: API Backend (interno)
- `3306`: MySQL (interno)
- `3307`: MySQL Master (opcional, acesso externo)
- `3308`: MySQL Slave (opcional, acesso externo)

---

## 📁 Estrutura de Arquivos

```
sistema-de-auditoria/
├── scripts/
│   ├── deploy-to-server.sh      ← Script principal de deploy
│   ├── pre-deploy-check.sh      ← Verificação pré-deploy
│   ├── rollback.sh               ← Script de rollback
│   └── run-migrations.sh         ← Migrações do banco
├── docker-compose.prod.yml       ← Configuração Docker produção
├── Dockerfile.production         ← Imagem Docker otimizada
├── nginx.prod.conf               ← Configuração Nginx
├── .env.production               ← Variáveis de ambiente produção
└── backups/                      ← Backups automáticos
```

---

## 🔧 PASSO 1: Configuração Inicial

### 1.1. Clone do Repositório

```bash
git clone <url-do-repositorio> sistema-de-auditoria
cd sistema-de-auditoria
```

### 1.2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env.production

# Editar com suas configurações
nano .env.production
```

**⚠️ IMPORTANTE:** Altere TODAS as senhas padrão:

```env
# .env.production
MYSQL_ROOT_PASSWORD=SuaSenhaRootMuitoSegura@2025!
MYSQL_DATABASE=auditoria_db
MYSQL_USER=auditoria_user
MYSQL_PASSWORD=SuaSenhaUserMuitoSegura@2025!

NODE_ENV=production
API_PORT=3000

# Ajuste para seu domínio
APP_URL=https://seu-dominio.com
API_URL=https://seu-dominio.com/api

TZ=America/Sao_Paulo
LOG_LEVEL=info
```

### 1.3. Configurar SSL/HTTPS (Recomendado)

Se você tem um domínio, configure SSL com Let's Encrypt:

```bash
# Instalar Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obter certificado (substitua seu-dominio.com)
sudo certbot --nginx -d seu-dominio.com
```

Edite [nginx.prod.conf](nginx.prod.conf) para usar seu domínio:

```nginx
server_name seu-dominio.com www.seu-dominio.com;
```

---

## ✅ PASSO 2: Pré-Verificação

Antes de fazer deploy, execute a verificação:

```bash
chmod +x scripts/pre-deploy-check.sh
./scripts/pre-deploy-check.sh
```

Este script verifica:
- ✓ Docker e Docker Compose instalados
- ✓ Node.js e npm disponíveis
- ✓ Arquivo .env.production configurado
- ✓ Portas necessárias disponíveis
- ✓ Espaço em disco suficiente
- ✓ Permissões adequadas

**Só prossiga se todos os checks passarem!**

---

## 🚀 PASSO 3: Deploy

### 3.1. Deploy Automático (Recomendado)

```bash
# Tornar script executável
chmod +x scripts/deploy-to-server.sh

# Executar deploy
./scripts/deploy-to-server.sh
```

O script executa automaticamente:
1. ✓ Verificação de pré-requisitos
2. ✓ Backup do banco de dados atual
3. ✓ Build da aplicação (frontend + backend)
4. ✓ Parada dos containers antigos
5. ✓ Deploy dos novos containers
6. ✓ Execução de migrações do banco
7. ✓ Verificação de saúde
8. ✓ Rollback automático em caso de falha

### 3.2. Deploy Manual (Avançado)

Se preferir controle total:

```bash
# 1. Build da aplicação
npm ci --production=false
npm run build

# 2. Build das imagens Docker
docker-compose -f docker-compose.prod.yml build --no-cache

# 3. Iniciar containers
docker-compose -f docker-compose.prod.yml up -d

# 4. Executar migrações
chmod +x scripts/run-migrations.sh
./scripts/run-migrations.sh

# 5. Verificar status
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔍 PASSO 4: Verificação Pós-Deploy

### 4.1. Verificar Containers

```bash
docker-compose -f docker-compose.prod.yml ps
```

Todos devem estar com status `Up`:
- `auditoria-app-prod`
- `mysql-master-prod`
- `mysql-slave-prod` (opcional)
- `nginx-prod`

### 4.2. Verificar Logs

```bash
# Logs gerais
docker-compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker logs auditoria-app-prod -f
docker logs mysql-master-prod -f
docker logs nginx-prod -f
```

### 4.3. Testar Endpoints

```bash
# Health check
curl http://localhost/health

# API
curl http://localhost/api/aplicacoes

# Frontend
curl http://localhost/
```

### 4.4. Acessar Aplicação

Abra no navegador:
- **Local**: http://localhost
- **Produção**: https://seu-dominio.com

---

## 🔄 PASSO 5: Operações Contínuas

### Atualizar Aplicação

```bash
# Pull das últimas mudanças
git pull origin main

# Executar deploy novamente
./scripts/deploy-to-server.sh
```

### Backup Manual

```bash
chmod +x scripts/backup-mysql.sh
./scripts/backup-mysql.sh
```

Backups automáticos são criados durante cada deploy em `backups/`.

### Rollback

Se algo der errado após deploy:

```bash
chmod +x scripts/rollback.sh
./scripts/rollback.sh
```

Este script:
1. Lista backups disponíveis
2. Restaura o backup mais recente
3. Reinicia a aplicação

### Ver Logs em Tempo Real

```bash
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### Reiniciar Aplicação

```bash
# Reiniciar tudo
docker-compose -f docker-compose.prod.yml restart

# Reiniciar apenas app
docker-compose -f docker-compose.prod.yml restart app

# Reiniciar apenas nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Parar Aplicação

```bash
docker-compose -f docker-compose.prod.yml stop
```

### Iniciar Aplicação

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🗄️ Gestão do Banco de Dados

### Acessar MySQL

```bash
# Via container
docker exec -it mysql-master-prod mysql -u root -p

# Da máquina host (se porta 3307 exposta)
mysql -h 127.0.0.1 -P 3307 -u root -p
```

### Backup Completo

```bash
docker exec mysql-master-prod mysqldump \
  -u root -p \
  --all-databases \
  --single-transaction \
  --routines \
  --triggers \
  > backup-completo-$(date +%Y%m%d).sql
```

### Restaurar Backup

```bash
cat backup-file.sql | docker exec -i mysql-master-prod mysql -u root -p auditoria_db
```

### Executar Migrações

```bash
./scripts/run-migrations.sh
```

---

## 🔒 Segurança

### Checklist de Segurança

- [ ] Todas as senhas padrão foram alteradas
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado (UFW, iptables)
- [ ] Backups automáticos configurados
- [ ] Logs sendo monitorados
- [ ] Rate limiting ativo no Nginx
- [ ] Apenas portas necessárias expostas

### Configurar Firewall (Ubuntu)

```bash
# Instalar UFW
sudo apt-get install ufw

# Configurar regras
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable

# Verificar status
sudo ufw status
```

### Atualizar Senhas

```bash
# Editar .env.production
nano .env.production

# Recriar containers com novas senhas
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoramento

### Verificar Uso de Recursos

```bash
# CPU e Memória dos containers
docker stats

# Espaço em disco
df -h

# Logs de erro do Nginx
docker exec nginx-prod tail -f /var/log/nginx/error.log
```

### Health Checks Automáticos

Os containers têm health checks configurados. Verifique:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Deve mostrar "healthy" para todos.

---

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs app

# Verificar erro específico
docker logs auditoria-app-prod --tail=50
```

### Erro de conexão com banco de dados

```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Ver logs do MySQL
docker logs mysql-master-prod --tail=50

# Reiniciar MySQL
docker-compose -f docker-compose.prod.yml restart mysql-master
```

### Erro 502 Bad Gateway (Nginx)

```bash
# Verificar se app está rodando
docker ps | grep auditoria-app-prod

# Ver logs do app
docker logs auditoria-app-prod

# Reiniciar app
docker-compose -f docker-compose.prod.yml restart app
```

### Porta em uso

```bash
# Encontrar processo usando porta
sudo lsof -i :80
sudo lsof -i :3000

# Parar processo
sudo kill -9 <PID>
```

### Limpar e Reiniciar Tudo

```bash
# ⚠️ CUIDADO: Remove todos os dados!
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Suporte

### Arquivos de Log

- Deploy: `deploy-YYYYMMDD_HHMMSS.log`
- Aplicação: `/app/logs/` (dentro do container)
- Nginx: Container `nginx-prod` em `/var/log/nginx/`
- MySQL: Container `mysql-master-prod` em `/var/log/mysql/`

### Comandos Úteis

```bash
# Status geral
docker-compose -f docker-compose.prod.yml ps

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Entrar no container
docker exec -it auditoria-app-prod /bin/sh

# Ver informações do container
docker inspect auditoria-app-prod

# Ver uso de recursos
docker stats auditoria-app-prod
```

---

## 🎯 Checklist de Deploy

Antes de cada deploy:

- [ ] Código testado em desenvolvimento
- [ ] Pré-verificação executada (`pre-deploy-check.sh`)
- [ ] Variáveis de ambiente configuradas
- [ ] Backup do banco existente
- [ ] Janela de manutenção comunicada (se aplicável)

Durante o deploy:

- [ ] Script de deploy executado
- [ ] Logs monitorados
- [ ] Nenhum erro crítico identificado

Após o deploy:

- [ ] Containers rodando corretamente
- [ ] Health checks passando
- [ ] Frontend acessível
- [ ] API respondendo
- [ ] Testes de fumaça executados
- [ ] Logs sem erros críticos
- [ ] Backup criado automaticamente

---

## 📚 Referências

- [Documentação Docker](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Versão**: 1.0  
**Última atualização**: Janeiro 2025  
**Autor**: Sistema de Auditoria Team
