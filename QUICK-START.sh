```bash
#!/bin/bash
# QUICK REFERENCE - Sistema de Auditoria

# ==================== PRIMEIRO DEPLOY ====================

# 1. Assistente Interativo (RECOMENDADO)
./scripts/quick-start-deploy.sh

# 2. Deploy Manual
./scripts/pre-deploy-check.sh          # Verificar ambiente
cp .env.example .env.production        # Configurar variáveis
nano .env.production                   # Editar senhas
./scripts/deploy-to-server.sh          # Deploy completo

# ==================== ATUALIZAÇÕES ====================

git pull origin main
./scripts/deploy-to-server.sh

# ==================== VERIFICAÇÕES ====================

# Health check completo
./scripts/health-check.sh

# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# ==================== OPERAÇÕES ====================

# Reiniciar aplicação
docker-compose -f docker-compose.prod.yml restart

# Parar aplicação
docker-compose -f docker-compose.prod.yml stop

# Iniciar aplicação
docker-compose -f docker-compose.prod.yml up -d

# ==================== BACKUP & ROLLBACK ====================

# Backup manual
./scripts/backup-mysql.sh

# Rollback
./scripts/rollback.sh

# ==================== BANCO DE DADOS ====================

# Acessar MySQL
docker exec -it mysql-master-prod mysql -u root -p

# Executar migrações
./scripts/run-migrations.sh

# Backup manual
docker exec mysql-master-prod mysqldump -u root -p auditoria_db > backup.sql

# ==================== MONITORAMENTO ====================

# Ver uso de recursos
docker stats

# Logs específicos
docker logs auditoria-app-prod -f
docker logs mysql-master-prod -f
docker logs nginx-prod -f

# ==================== TROUBLESHOOTING ====================

# Ver últimos erros
docker logs auditoria-app-prod --tail=50

# Limpar e reiniciar
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Rollback de emergência
./scripts/rollback.sh

# ==================== URLs ====================

# Local
http://localhost              # Frontend
http://localhost/api          # API
http://localhost/health       # Health Check

# Produção (substitua pelo seu domínio)
https://seu-dominio.com
https://seu-dominio.com/api
https://seu-dominio.com/health

# ==================== ARQUIVOS IMPORTANTES ====================

DEPLOY-GUIDE.md              # Guia completo de deploy
DEPLOY-SUMMARY.md            # Resumo da configuração
scripts/README.md            # Documentação dos scripts
.env.production              # Configuração de produção
docker-compose.prod.yml      # Configuração Docker

# ==================== SCRIPTS DISPONÍVEIS ====================

scripts/quick-start-deploy.sh     # Assistente interativo
scripts/deploy-to-server.sh       # Deploy automatizado
scripts/pre-deploy-check.sh       # Verificação pré-deploy
scripts/rollback.sh               # Rollback automático
scripts/run-migrations.sh         # Migrações do banco
scripts/health-check.sh           # Verificação de saúde
scripts/backup-mysql.sh           # Backup manual

# ==================== SEGURANÇA ====================

# Alterar senhas em .env.production
nano .env.production

# Configurar SSL (Let's Encrypt)
sudo certbot --nginx -d seu-dominio.com

# Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# ==================== AJUDA ====================

# Documentação completa
cat DEPLOY-GUIDE.md

# Ver este arquivo
cat QUICK-START.sh
```
