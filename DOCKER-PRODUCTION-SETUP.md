# 🐳 Configuração Docker para Produção

## ✅ Correções Aplicadas

### 1. **Dockerfile de Produção**
- ✅ Configurado para usar `Dockerfile.production` (multi-stage build otimizado)
- ✅ Imagem final minimalista com apenas dependências de produção
- ✅ Usuário não-root (`appuser`) para segurança
- ✅ Healthcheck integrado

### 2. **Docker Compose Produção**
- ✅ Atualizado para referenciar `Dockerfile.production`
- ✅ Configurado com `nginx.prod.conf` otimizado
- ✅ Healthchecks configurados para app e MySQL
- ✅ Networks isoladas
- ✅ Volumes persistentes para dados

### 3. **API Server**
- ✅ Endpoint `/health` adicionado para healthchecks
- ✅ Verifica conexão com banco de dados
- ✅ Retorna status detalhado (ok/error)

### 4. **Nginx**
- ✅ Configuração otimizada com cache
- ✅ Compressão gzip
- ✅ Security headers
- ✅ Rate limiting
- ✅ Proxy reverso para API

---

## 🚀 Como Subir em Produção

### **Passo 1: Preparar Variáveis de Ambiente**

Crie ou edite o arquivo `.env` na raiz do projeto:

```bash
# Copiar exemplo
cp .env.production .env

# Editar com suas credenciais
nano .env
```

⚠️ **IMPORTANTE**: Altere TODAS as senhas padrão!

```env
# Senhas de Produção (ALTERAR!)
MYSQL_ROOT_PASSWORD=SuaSenhaRootMuitoForte@2025!
MYSQL_PASSWORD=SuaSenhaUserMuitoForte@2025!
MYSQL_USER=auditoria_user
MYSQL_DATABASE=auditoria_db

# Aplicação
NODE_ENV=production
API_PORT=3000

# Domínio (se aplicável)
APP_URL=https://seu-dominio.com
```

### **Passo 2: Build da Aplicação**

```bash
# Build das imagens Docker
docker-compose -f docker-compose.prod.yml build

# Verificar imagens criadas
docker images | grep auditoria
```

### **Passo 3: Subir os Serviços**

**Opção A: Sem Nginx (usar proxy reverso externo)**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Opção B: Com Nginx incluído**
```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### **Passo 4: Verificar Status**

```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f app

# Verificar containers
docker-compose -f docker-compose.prod.yml ps

# Testar healthcheck
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"ok","database":"connected","timestamp":"2025-01-09T..."}
```

### **Passo 5: Inicializar Banco de Dados**

Na primeira execução, as tabelas serão criadas automaticamente pelos scripts em `./database/`.

Para verificar:
```bash
# Conectar ao MySQL
docker exec -it mysql-master-prod mysql -u root -p

# Dentro do MySQL
USE auditoria_db;
SHOW TABLES;
EXIT;
```

---

## 📊 Arquitetura de Produção

```
┌─────────────────────────────────────────────┐
│  Nginx (Porta 80/443) - Opcional            │
│  - Proxy Reverso                             │
│  - SSL/TLS                                   │
│  - Cache & Compressão                        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  App (Node.js - Porta 3000)                 │
│  - API Backend                               │
│  - Frontend Estático (dist/)                │
│  - Healthcheck em /health                    │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  MySQL Master (Porta 3307)                  │
│  - Banco Principal                           │
│  - Healthcheck automático                    │
└─────────────────────────────────────────────┘
```

---

## 🔧 Comandos Úteis

### **Gerenciamento**
```bash
# Parar serviços
docker-compose -f docker-compose.prod.yml down

# Parar e remover volumes (⚠️ PERDE DADOS!)
docker-compose -f docker-compose.prod.yml down -v

# Reiniciar apenas a aplicação
docker-compose -f docker-compose.prod.yml restart app

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs -f mysql-master-prod

# Executar comando no container
docker-compose -f docker-compose.prod.yml exec app sh
```

### **Monitoramento**
```bash
# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Healthcheck da aplicação
curl -f http://localhost:3000/health || echo "Falhou!"

# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

### **Backup do Banco**
```bash
# Fazer backup
docker exec mysql-master-prod mysqldump -u root -p'SUA_SENHA' \
  auditoria_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i mysql-master-prod mysql -u root -p'SUA_SENHA' \
  auditoria_db < backup_20250109_120000.sql
```

---

## 🔒 Checklist de Segurança

Antes de colocar em produção:

- [ ] Alterar todas as senhas padrão no `.env`
- [ ] Usar senhas fortes (mínimo 16 caracteres)
- [ ] Não commitar `.env` no Git (já está no .gitignore)
- [ ] Configurar SSL/TLS no Nginx
- [ ] Revisar permissões de volumes
- [ ] Habilitar firewall (permitir apenas portas necessárias)
- [ ] Configurar backup automático do banco
- [ ] Monitoramento de logs
- [ ] Limite de recursos (CPU/memória) se necessário

---

## 🐛 Troubleshooting

### **App não conecta ao MySQL**
```bash
# Verificar se MySQL está saudável
docker-compose -f docker-compose.prod.yml ps

# Ver logs do MySQL
docker-compose -f docker-compose.prod.yml logs mysql-master-prod

# Testar conexão manualmente
docker exec mysql-master-prod mysql -u root -p -e "SELECT 1"
```

### **Healthcheck falha**
```bash
# Verificar endpoint
curl -v http://localhost:3000/health

# Ver logs da aplicação
docker-compose -f docker-compose.prod.yml logs app | tail -50

# Entrar no container
docker-compose -f docker-compose.prod.yml exec app sh
wget -qO- http://localhost:3000/health
```

### **Nginx não consegue proxy para app**
```bash
# Verificar network
docker network inspect codewiki_app-network

# Testar comunicação entre containers
docker-compose -f docker-compose.prod.yml exec nginx ping app
docker-compose -f docker-compose.prod.yml exec nginx wget -qO- http://app:3000/health
```

### **Aplicação reinicia constantemente**
```bash
# Ver motivo das reinicializações
docker-compose -f docker-compose.prod.yml logs app | grep -i error

# Verificar recursos
docker stats auditoria-app-prod

# Desabilitar healthcheck temporariamente (editar docker-compose.prod.yml)
```

---

## 📈 Otimizações Aplicadas

### **Docker**
- ✅ Multi-stage build (reduz tamanho da imagem final)
- ✅ Apenas dependências de produção
- ✅ Cache de layers otimizado
- ✅ Usuário não-root

### **Nginx**
- ✅ Gzip compression
- ✅ Cache de assets estáticos
- ✅ Security headers
- ✅ Rate limiting
- ✅ Keepalive connections

### **Aplicação**
- ✅ Healthcheck com verificação de DB
- ✅ Pool de conexões MySQL otimizado
- ✅ Logs estruturados
- ✅ Graceful shutdown

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs`
2. Consulte este guia
3. Verifique [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md) para mais detalhes

---

**Última atualização**: 09/01/2025
**Versão**: 1.0
