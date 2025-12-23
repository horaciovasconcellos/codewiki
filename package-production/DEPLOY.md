# Deploy do Sistema de Auditoria

## Requisitos
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- Porta 3000 disponível

## Instalação Rápida

1. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

2. **Inicie os containers:**
```bash
./scripts/docker-manager.sh start
```

3. **Acesse a aplicação:**
```
http://localhost:3000
```

## Estrutura de Diretórios

```
.
├── dist/               # Frontend (build)
├── server/            # Backend (Node.js)
├── database/          # Scripts SQL
├── scripts/           # Scripts auxiliares
├── docker-compose.yml # Orquestração Docker
└── Dockerfile         # Imagem da aplicação
```

## Comandos Úteis

```bash
# Iniciar aplicação
./scripts/docker-manager.sh start

# Parar aplicação
./scripts/docker-manager.sh stop

# Ver logs
./scripts/docker-manager.sh logs

# Restart completo
./scripts/docker-manager.sh restart

# Status dos containers
./scripts/docker-manager.sh status
```

## Backup do Banco de Dados

```bash
docker exec mysql-master mysqldump -u root -prootpass auditoria_db > backup.sql
```

## Restaurar Backup

```bash
docker exec -i mysql-master mysql -u root -prootpass auditoria_db < backup.sql
```

## Portas

- **3000**: Aplicação Web
- **3306**: MySQL (apenas interno)
- **3307**: MySQL Master (acesso externo)
- **3308**: MySQL Slave (acesso externo)

## Variáveis de Ambiente Importantes

```env
# Banco de Dados
MYSQL_HOST=mysql-master
MYSQL_PORT=3306
MYSQL_USER=app_user
MYSQL_PASSWORD=apppass123
MYSQL_DATABASE=auditoria_db

# API
API_PORT=3000
NODE_ENV=production
```

## Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
./scripts/docker-manager.sh logs

# Reiniciar containers
./scripts/docker-manager.sh restart
```

### Erro de conexão com banco
```bash
# Verificar se MySQL está rodando
docker ps | grep mysql

# Restart do MySQL
docker restart mysql-master
```

### Limpar e reiniciar tudo
```bash
./scripts/docker-manager.sh clean
./scripts/docker-manager.sh start
```

## Suporte

Para mais informações, consulte:
- README.md
- QUICKSTART.md
- docs/
