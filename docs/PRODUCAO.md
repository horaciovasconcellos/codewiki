# 🚀 Deploy em Produção - Sistema de Auditoria

## 📦 Arquivos Criados para Produção

### Arquivos Principais
- **docker-compose.production.yml** - Configuração Docker otimizada para produção
- **Dockerfile.production** - Build multi-stage otimizado
- **nginx.prod.conf** - Configuração Nginx com cache, compressão e segurança
- **.env.production** - Variáveis de ambiente (configure as senhas!)
- **deploy-production.sh** - Script automatizado de deploy

## ⚙️ Características de Produção

### ✨ Otimizações Implementadas

#### Docker
- ✅ Multi-stage build (imagem final menor)
- ✅ Usuário não-root para segurança
- ✅ Health checks em todos os serviços
- ✅ Resource limits (CPU/Memória)
- ✅ Restart automático
- ✅ Volumes persistentes

#### Nginx
- ✅ Reverse proxy otimizado
- ✅ Compressão Gzip
- ✅ Cache de assets estáticos
- ✅ Rate limiting
- ✅ Security headers
- ✅ Logs estruturados
- ✅ SSL/HTTPS ready

#### MySQL
- ✅ Configurações de performance
- ✅ Buffer pool otimizado
- ✅ Max connections aumentado
- ✅ Backup volume
- ✅ Health check robusto

## 🔧 Pré-requisitos

```bash
# Sistema
- Docker 20.x+
- Docker Compose 2.x+
- 4GB RAM (mínimo)
- 10GB disco livre

# Portas necessárias
- 80 (HTTP)
- 443 (HTTPS)
- 3306 (MySQL)
```

## 🚀 Deploy Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Edite o arquivo .env.production
nano .env.production
```

**⚠️ IMPORTANTE:** Altere TODAS as senhas padrão!

```env
MYSQL_ROOT_PASSWORD=SuaSenhaRootSegura@2025!
MYSQL_PASSWORD=SuaSenhaUserSegura@2025!
```

### 2. Executar Deploy

```bash
# Dar permissão ao script
chmod +x deploy-production.sh

# Executar deploy
./deploy-production.sh
```

O script irá:
1. ✅ Verificar pré-requisitos
2. ✅ Parar containers antigos
3. ✅ Limpar recursos
4. ✅ Construir imagens
5. ✅ Iniciar banco de dados
6. ✅ Iniciar aplicação
7. ✅ Iniciar Nginx
8. ✅ Executar health checks

### 3. Verificar Status

```bash
# Ver containers rodando
docker-compose -f docker-compose.production.yml ps

# Ver logs em tempo real
docker-compose -f docker-compose.production.yml logs -f

# Ver logs de serviço específico
docker-compose -f docker-compose.production.yml logs -f app
docker-compose -f docker-compose.production.yml logs -f mysql-master
docker-compose -f docker-compose.production.yml logs -f nginx
```

## 🌐 Acessar Aplicação

Após o deploy:

- **Frontend:** http://seu-servidor
- **API:** http://seu-servidor/api
- **Health Check:** http://seu-servidor/health

## 🔒 Configuração SSL/HTTPS

### Usando Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com

# Renovação automática já configurada
```

### Certificado Manual

1. Coloque os certificados em:
```
./ssl/cert.pem
./ssl/key.pem
```

2. Descomente no `docker-compose.production.yml`:
```yaml
volumes:
  - ./ssl/cert.pem:/etc/ssl/certs/cert.pem:ro
  - ./ssl/key.pem:/etc/ssl/private/key.pem:ro
```

3. Descomente no `nginx.prod.conf` o bloco HTTPS

4. Reinicie:
```bash
docker-compose -f docker-compose.production.yml restart nginx
```

## 💾 Backup e Restore

### Volumes do MySQL

Os dados do MySQL estão armazenados em:
- **Dados:** `/home/imagem/docker/auditoriadb/mysql`
- **Logs:** `/home/imagem/docker/auditoriadb/mysql-logs`
- **Backups:** `/home/imagem/docker/auditoriadb/mysql-backup`

⚠️ **Importante:** Certifique-se de que o diretório `/home/imagem/docker/auditoriadb` existe e tem as permissões corretas antes de iniciar os containers.

```bash
# Criar diretórios necessários
sudo mkdir -p /home/imagem/docker/auditoriadb/{mysql,mysql-logs,mysql-backup}
sudo chown -R 999:999 /home/imagem/docker/auditoriadb/mysql
sudo chmod -R 755 /home/imagem/docker/auditoriadb
```

### Backup do Banco de Dados

```bash
# Backup completo
docker-compose -f docker-compose.production.yml exec mysql-master \
  mysqldump -uauditoria_user -p auditoria_db > backup-$(date +%Y%m%d).sql

# Backup automático (adicionar no cron)
0 2 * * * cd /caminho/do/projeto && docker-compose -f docker-compose.production.yml exec -T mysql-master mysqldump -uauditoria_user -pSUASENHA auditoria_db > /backups/db-$(date +\%Y\%m\%d).sql
```

### Restore do Banco de Dados

```bash
# Restore
docker-compose -f docker-compose.production.yml exec -T mysql-master \
  mysql -uauditoria_user -p auditoria_db < backup.sql
```

## 🔄 Operações Comuns

### Atualizar Aplicação

```bash
# 1. Puxar últimas mudanças
git pull origin main

# 2. Rebuild e restart
docker-compose -f docker-compose.production.yml up -d --build app

# 3. Verificar logs
docker-compose -f docker-compose.production.yml logs -f app
```

### Reiniciar Serviços

```bash
# Todos os serviços
docker-compose -f docker-compose.production.yml restart

# Serviço específico
docker-compose -f docker-compose.production.yml restart app
docker-compose -f docker-compose.production.yml restart nginx
docker-compose -f docker-compose.production.yml restart mysql-master
```

### Parar Aplicação

```bash
# Parar mantendo dados
docker-compose -f docker-compose.production.yml down

# Parar e remover volumes (⚠️ PERDE DADOS!)
docker-compose -f docker-compose.production.yml down -v
```

### Ver Uso de Recursos

```bash
# Uso de CPU/Memória
docker stats

# Espaço em disco dos volumes
docker system df -v
```

## 📊 Monitoramento

### Logs

```bash
# Todos os logs
docker-compose -f docker-compose.production.yml logs -f

# Últimas 100 linhas
docker-compose -f docker-compose.production.yml logs --tail=100

# Logs de erro do Nginx
docker-compose -f docker-compose.production.yml exec nginx tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Status dos containers
docker-compose -f docker-compose.production.yml ps

# Health check manual
curl http://localhost/health
curl http://localhost:3000/health
```

## 🔧 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs completos
docker-compose -f docker-compose.production.yml logs app

# Verificar variáveis de ambiente
docker-compose -f docker-compose.production.yml exec app env

# Entrar no container
docker-compose -f docker-compose.production.yml exec app sh
```

### Banco de dados não conecta

```bash
# Verificar se MySQL está rodando
docker-compose -f docker-compose.production.yml ps mysql-master

# Testar conexão
docker-compose -f docker-compose.production.yml exec mysql-master \
  mysql -uauditoria_user -p -e "SELECT 1"

# Ver logs do MySQL
docker-compose -f docker-compose.production.yml logs mysql-master
```

### Nginx retorna 502/504

```bash
# Verificar se app está rodando
curl http://localhost:3000/health

# Ver logs do Nginx
docker-compose -f docker-compose.production.yml logs nginx

# Testar configuração do Nginx
docker-compose -f docker-compose.production.yml exec nginx nginx -t
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] Alterar todas as senhas padrão em `.env.production`
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall (apenas portas 80, 443)
- [ ] Habilitar backups automáticos
- [ ] Configurar monitoramento
- [ ] Limitar acesso SSH
- [ ] Atualizar sistema operacional regularmente
- [ ] Revisar logs periodicamente

### Firewall (UFW)

```bash
# Permitir apenas HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📈 Performance

### Otimizações Aplicadas

- ✅ Gzip compression
- ✅ Static file caching (1 ano)
- ✅ Nginx keepalive
- ✅ MySQL buffer pool (1GB)
- ✅ Rate limiting
- ✅ Resource limits
- ✅ Multi-stage Docker build

### Recomendações Adicionais

```bash
# Aumentar limites do sistema (se necessário)
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Aplicar
sudo sysctl -p
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose -f docker-compose.production.yml logs`
2. Verificar documentação completa em `/docs`
3. Abrir issue no repositório

---

**✅ Sistema pronto para produção!**

