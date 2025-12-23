# Deploy em Produção - Sistema de Auditoria

## 📦 Conteúdo do Pacote

O arquivo `sistema-auditoria-production.tar.gz` contém todos os recursos necessários para deploy em produção:

### Estrutura do Pacote

```
sistema-auditoria-production.tar.gz
├── dist/                          # Frontend compilado (build de produção)
├── server/                        # Backend Node.js/Express
├── database/                      # Scripts SQL de inicialização
├── data-templates/               # Templates para carga de dados
├── scripts/                      # Scripts utilitários
├── package.json                  # Dependências Node.js
├── package-lock.json            # Lock de dependências
├── docker-compose.prod.yml      # Configuração Docker para produção
├── Dockerfile                    # Imagem Docker da aplicação
├── nginx.conf                    # Configuração do servidor web
├── build-production.sh          # Script de build
├── docker-manager.sh            # Gerenciador Docker
├── liquibase-manager.sh         # Gerenciador de migrations
├── liquibase.properties         # Configuração Liquibase
├── README.md                     # Documentação principal
└── QUICK-START-BULK-LOAD.md    # Guia de carga em lote

```

## 🚀 Instruções de Deploy

### Pré-requisitos

- Docker 20.x ou superior
- Docker Compose 2.x ou superior
- 4GB RAM mínimo
- 10GB espaço em disco

### Passo 1: Extrair o Pacote

```bash
tar -xzf sistema-auditoria-production.tar.gz
cd sistema-de-auditoria
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Banco de Dados
MYSQL_ROOT_PASSWORD=sua_senha_segura_aqui
MYSQL_DATABASE=auditoria_db
MYSQL_USER=auditoria_user
MYSQL_PASSWORD=senha_usuario_aqui

# Replicação MySQL
MYSQL_REPLICATION_USER=repl_user
MYSQL_REPLICATION_PASSWORD=senha_replicacao_aqui

# Aplicação
NODE_ENV=production
VITE_API_URL=http://seu-dominio.com:3000

# Portas (opcional - já definidas no docker-compose)
APP_PORT=3000
MYSQL_MASTER_PORT=3306
MYSQL_SLAVE_PORT=3307
```

### Passo 3: Iniciar os Containers

```bash
# Dar permissão de execução aos scripts
chmod +x build-production.sh docker-manager.sh liquibase-manager.sh

# Subir os containers
docker-compose -f docker-compose.prod.yml up -d
```

### Passo 4: Verificar os Serviços

```bash
# Verificar status dos containers
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Passo 5: Acessar a Aplicação

- **Frontend**: http://localhost:5173 ou http://seu-dominio.com:5173
- **Backend API**: http://localhost:3000 ou http://seu-dominio.com:3000
- **MySQL Master**: localhost:3306
- **MySQL Slave**: localhost:3307

## 🔧 Configurações de Produção

### Nginx Reverso Proxy (Recomendado)

Para produção, recomenda-se configurar um Nginx como proxy reverso:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS (Recomendado)

Para habilitar HTTPS, use o Certbot:

```bash
sudo certbot --nginx -d seu-dominio.com
```

## 📊 Carga Inicial de Dados

### Carga Manual

Consulte o arquivo `QUICK-START-BULK-LOAD.md` para instruções sobre carga em lote de dados.

### Carga via API

```bash
# Exemplo: Carregar aplicações
curl -X POST http://localhost:3000/api/aplicacoes/bulk \
  -H "Content-Type: application/json" \
  -d @data-templates/aplicacoes-carga.json
```

## 🔄 Backup e Manutenção

### Backup do Banco de Dados

```bash
# Backup do MySQL Master
docker exec mysql-master mysqldump -u root -p auditoria_db > backup_$(date +%Y%m%d).sql
```

### Atualização da Aplicação

```bash
# Parar containers
docker-compose -f docker-compose.prod.yml down

# Extrair nova versão
tar -xzf sistema-auditoria-production-v2.tar.gz

# Subir novamente
docker-compose -f docker-compose.prod.yml up -d
```

### Logs

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f mysql-master
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs app

# Reiniciar container específico
docker-compose -f docker-compose.prod.yml restart app
```

### Banco de dados não conecta

```bash
# Verificar status do MySQL
docker-compose -f docker-compose.prod.yml exec mysql-master mysql -u root -p -e "SELECT 1"

# Verificar replicação
docker-compose -f docker-compose.prod.yml exec mysql-slave mysql -u root -p -e "SHOW SLAVE STATUS\G"
```

### Portas já em uso

Edite o arquivo `docker-compose.prod.yml` e altere as portas conforme necessário.

## 📋 Checklist de Deploy

- [ ] Extrair pacote tar.gz
- [ ] Configurar arquivo .env
- [ ] Verificar portas disponíveis
- [ ] Executar docker-compose up
- [ ] Verificar status dos containers
- [ ] Testar acesso ao frontend
- [ ] Testar acesso à API
- [ ] Configurar backup automático
- [ ] Configurar monitoramento
- [ ] Configurar SSL/TLS (produção)
- [ ] Realizar carga inicial de dados
- [ ] Testar funcionalidades principais

## 🔐 Segurança

### Recomendações

1. **Alterar senhas padrão**: Todas as senhas no `.env`
2. **Firewall**: Configurar firewall para permitir apenas portas necessárias
3. **SSL/TLS**: Sempre usar HTTPS em produção
4. **Backup**: Configurar backup automático diário
5. **Atualizações**: Manter sistema operacional e Docker atualizados
6. **Monitoramento**: Implementar monitoramento de logs e métricas

## 📞 Suporte

Para questões ou problemas:
- Consulte o `README.md` para documentação detalhada
- Verifique os logs dos containers
- Consulte a documentação do Docker e Docker Compose

## 📝 Versão

- **Sistema**: Sistema de Auditoria v1.0
- **Data do Pacote**: 18/12/2025
- **Node.js**: 18.x ou superior
- **MySQL**: 8.0
