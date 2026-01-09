# 🧪 Teste Rápido de Produção

## ✅ Validação da Configuração Docker

Use este guia para validar rapidamente se a configuração de produção está funcionando.

---

## 🚀 Teste Rápido (5 minutos)

### 1. **Configuração Inicial**
```bash
# Copiar variáveis de ambiente
cp .env.production .env

# Editar senhas (IMPORTANTE!)
nano .env
```

### 2. **Build e Start**
```bash
# Dar permissão ao script
chmod +x deploy-production.sh

# Build das imagens
./deploy-production.sh build

# Iniciar serviços (sem Nginx)
./deploy-production.sh start
```

### 3. **Verificar Status**
```bash
# Ver status dos containers
./deploy-production.sh status

# Resultado esperado:
# ✅ auditoria-app-prod (healthy)
# ✅ mysql-master-prod (healthy)
```

### 4. **Testar Healthcheck**
```bash
# Verificar health da API
./deploy-production.sh health

# Resultado esperado:
# ✅ Aplicação está saudável!
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "2025-01-09T..."
# }
```

### 5. **Testar Endpoints**
```bash
# Teste básico da API
curl http://localhost:3000/api/tecnologias

# Health endpoint
curl http://localhost:3000/health

# Se estiver tudo OK, retorna JSON
```

---

## 🐛 Troubleshooting Rápido

### ❌ Container não inicia

```bash
# Ver logs
./deploy-production.sh logs app

# Verificar erros comuns:
# - Porta 3000 em uso
# - MySQL não conecta
# - Variáveis de ambiente erradas
```

### ❌ MySQL não conecta

```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Ver logs do MySQL
./deploy-production.sh logs mysql-master-prod

# Testar conexão
docker exec mysql-master-prod mysql -u root -p -e "SELECT 1"
```

### ❌ Healthcheck falha

```bash
# Verificar se app está escutando na porta
docker exec auditoria-app-prod netstat -tlnp | grep 3000

# Testar dentro do container
docker exec auditoria-app-prod wget -qO- http://localhost:3000/health

# Se falhar, verificar logs
./deploy-production.sh logs app | tail -50
```

---

## 📊 Checklist de Validação

Marque cada item após validação:

### Infraestrutura
- [ ] Containers estão rodando (`docker ps`)
- [ ] MySQL está healthy
- [ ] App está healthy
- [ ] Volumes foram criados

### API
- [ ] Endpoint `/health` responde 200 OK
- [ ] Endpoint `/api/tecnologias` retorna dados
- [ ] Healthcheck do Docker passa
- [ ] Logs não mostram erros

### Banco de Dados
- [ ] MySQL aceita conexões
- [ ] Tabelas foram criadas
- [ ] Pool de conexões funciona
- [ ] Queries executam com sucesso

### Performance
- [ ] App inicia em < 60 segundos
- [ ] Healthcheck responde em < 5 segundos
- [ ] Uso de memória < 500MB
- [ ] CPU < 20% em idle

---

## 🔧 Comandos Úteis para Debug

```bash
# Entrar no container da aplicação
docker exec -it auditoria-app-prod sh

# Dentro do container:
# - Ver variáveis de ambiente
env | grep MYSQL

# - Testar conexão com MySQL
ping mysql-master-prod

# - Ver processos
ps aux

# - Testar endpoint
wget -qO- http://localhost:3000/health

# Sair
exit
```

```bash
# Reiniciar apenas a aplicação
docker-compose -f docker-compose.prod.yml restart app

# Ver uso de recursos em tempo real
docker stats

# Verificar networks
docker network ls
docker network inspect codewiki_app-network

# Ver volumes
docker volume ls
```

---

## 📈 Próximos Passos

Após validação:

1. ✅ Configuração funciona localmente
2. 🔄 **Próximo**: Deploy em servidor de staging
3. 🔄 Configurar SSL/TLS
4. 🔄 Setup de monitoramento
5. 🔄 Backup automático
6. 🔄 Deploy em produção

---

## 🎯 Critérios de Sucesso

A configuração está pronta quando:

- ✅ Todos os containers estão healthy
- ✅ `/health` retorna `{"status":"ok"}`
- ✅ API responde em < 2 segundos
- ✅ Não há erros nos logs
- ✅ MySQL aceita conexões
- ✅ Reinicialização funciona corretamente

---

## 📞 Ajuda

Se encontrar problemas:

1. Consulte [DOCKER-PRODUCTION-SETUP.md](DOCKER-PRODUCTION-SETUP.md)
2. Verifique logs: `./deploy-production.sh logs`
3. Execute: `./deploy-production.sh health`

---

**Tempo estimado**: 5-10 minutos  
**Última atualização**: 09/01/2025
