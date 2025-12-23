# Manual de Instalação e Testes - Sistema de Auditoria

## Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)
- Git

## Instalação Local

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd spark-template
```

### 2. Inicie os Containers

```bash
docker compose up -d
```

Este comando irá:
- Criar e iniciar o container MySQL Master (porta 3306)
- Criar e iniciar o container MySQL Slave (porta 3307)
- Criar e iniciar o container da aplicação (porta 5173)

### 3. Configure a Replicação

```bash
chmod +x database/setup-replication.sh
./database/setup-replication.sh
```

### 4. Verifique o Status dos Containers

```bash
docker compose ps
```

Todos os containers devem estar com status "Up (healthy)".

## Testes

### Teste 1: Verificar Banco de Dados

```bash
# Conectar ao Master
docker exec -it mysql-master mysql -uroot -prootpass123 auditoria_db

# Listar tabelas
SHOW TABLES;

# Sair
exit
```

### Teste 2: Verificar Replicação

```bash
# Verificar status da replicação no Slave
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" | grep Running

# Deve mostrar:
# Slave_IO_Running: Yes
# Slave_SQL_Running: Yes
```

### Teste 3: Testar Replicação de Dados

```bash
# Inserir dados no Master
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo) VALUES ('abc-123', 'FER', 'Ferias', 'Lei 123/2023', 30, 'Consecutivo');"

# Aguardar 2 segundos
sleep 2

# Verificar no Slave
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e "SELECT * FROM tipos_afastamento WHERE id='abc-123';"
```

Se o registro aparecer no Slave, a replicação está funcionando!

### Teste 4: Acessar a Aplicação

Abra o navegador e acesse:
```
http://localhost:5173
```

### Teste 5: Verificar Logs

```bash
# Logs do Master
docker compose logs mysql-master

# Logs do Slave
docker compose logs mysql-slave

# Logs da Aplicação
docker compose logs app
```

## Comandos Úteis

### Parar todos os containers

```bash
docker compose down
```

### Parar e remover volumes (apaga dados)

```bash
docker compose down -v
```

### Reiniciar containers

```bash
docker compose restart
```

### Ver logs em tempo real

```bash
docker compose logs -f
```

### Conectar ao MySQL Master

```bash
docker exec -it mysql-master mysql -uapp_user -papppass123 auditoria_db
```

### Conectar ao MySQL Slave

```bash
docker exec -it mysql-slave mysql -uroot -prootpass123 auditoria_db
```

### Backup do Banco de Dados

```bash
docker exec mysql-master mysqldump -uroot -prootpass123 auditoria_db > backup.sql
```

### Restaurar Backup

```bash
docker exec -i mysql-master mysql -uroot -prootpass123 auditoria_db < backup.sql
```

## Troubleshooting

### Container não inicia

```bash
docker compose logs <nome-do-container>
docker inspect <nome-do-container>
```

### Replicação não funciona

```bash
# Verificar status detalhado
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G"

# Reconfigurar replicação
./database/setup-replication.sh
```

### Porta já em uso

Edite o `docker-compose.yml` e altere as portas mapeadas:
```yaml
ports:
  - "3308:3306"  # Master na porta 3308
  - "3309:3306"  # Slave na porta 3309
```

## Estrutura de Arquivos

```
.
├── docker-compose.yml           # Orquestração dos containers
├── Dockerfile                   # Imagem da aplicação
├── database/
│   ├── init-master.sql         # Script de criação do banco
│   ├── master.cnf              # Configuração do Master
│   ├── slave.cnf               # Configuração do Slave
│   └── setup-replication.sh    # Script de configuração da replicação
├── .github/
│   └── workflows/
│       └── docker-deploy.yml   # GitHub Action
└── MANUAL_INSTALACAO.md        # Este arquivo
```

## Credenciais

### MySQL Root
- Usuário: `root`
- Senha: `rootpass123`

### MySQL Application User
- Usuário: `app_user`
- Senha: `apppass123`
- Banco: `auditoria_db`

### MySQL Replicator
- Usuário: `replicator`
- Senha: `replicator123`

## Portas

- **3306**: MySQL Master
- **3307**: MySQL Slave
- **5173**: Aplicação Web

## Próximos Passos

1. Altere as senhas padrão em ambiente de produção
2. Configure SSL/TLS para conexões MySQL
3. Implemente backup automático
4. Configure monitoramento
5. Adicione mais slaves conforme necessário
