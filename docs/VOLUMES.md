# Estrutura de Volumes Persistentes

## Visão Geral

Os dados do MySQL agora são armazenados em volumes locais persistentes no diretório `~/docker/mysql/`, organizados da seguinte forma:

```
~/docker/mysql/
├── master/
│   ├── data/           # Dados do MySQL Master
│   ├── logs/           # Logs do MySQL Master
│   ├── config/         # Configurações customizadas
│   │   └── master.cnf
│   └── backup/         # Backups do Master
├── slave/
│   ├── data/           # Dados do MySQL Slave
│   ├── logs/           # Logs do MySQL Slave
│   ├── config/         # Configurações customizadas
│   │   └── slave.cnf
│   └── backup/         # Backups do Slave
└── scripts/            # Scripts SQL compartilhados
    ├── 01-init-schema-data.sql
    ├── 03-create-configuracoes.sql
    ├── 04-create-logs.sql
    └── 02-setup-replication.sh
```

## Vantagens

1. **Persistência**: Os dados não são perdidos ao reiniciar ou recriar containers
2. **Backup Facilitado**: Acesso direto aos arquivos de dados e backup
3. **Logs Acessíveis**: Logs do MySQL disponíveis no host
4. **Configuração Flexível**: Arquivos de configuração podem ser editados sem rebuild
5. **Isolamento**: Cada instância (master/slave) tem seus próprios volumes

## Operações Comuns

### Fazer Backup

#### Master:
```bash
./scripts/backup-mysql.sh master
```

#### Slave:
```bash
./scripts/backup-mysql.sh slave
```

### Restaurar Backup

```bash
./scripts/restore-mysql.sh ~/docker/mysql/master/backup/backup_auditoria_db_YYYYMMDD_HHMMSS.sql.gz master
```

### Visualizar Logs

#### Master:
```bash
tail -f ~/docker/mysql/master/logs/error.log
```

#### Slave:
```bash
tail -f ~/docker/mysql/slave/logs/error.log
```

### Editar Configurações

#### Master:
```bash
nano ~/docker/mysql/master/config/master.cnf
docker restart mysql-master
```

#### Slave:
```bash
nano ~/docker/mysql/slave/config/slave.cnf
docker restart mysql-slave
```

## Limpeza de Dados

### Remover TODOS os dados (CUIDADO!):

```bash
# Parar containers
docker-compose down

# Limpar volumes
rm -rf ~/docker/mysql/master/data/*
rm -rf ~/docker/mysql/slave/data/*

# Recriar
docker-compose up -d
```

### Manter apenas backups recentes:

Os scripts de backup mantêm automaticamente apenas os últimos 7 dias de backups.
Para alterar este comportamento, edite a linha no `backup-mysql.sh`:

```bash
find "${BACKUP_PATH}" -name "backup_*.sql.gz" -type f -mtime +7 -delete
```

Altere `+7` para o número de dias desejado.

## Permissões

Os diretórios têm permissão `755`, permitindo que:
- Proprietário: leitura, escrita, execução
- Grupo: leitura, execução
- Outros: leitura, execução

Se encontrar problemas de permissão, execute:

```bash
chmod -R 755 ~/docker/mysql
```

## Rede Interna

Os containers se comunicam através da rede `auditoria-network`:
- **mysql-master**: Acessível na rede como `mysql-master`
- **mysql-slave**: Acessível na rede como `mysql-slave`
- **auditoria-app**: Conecta-se ao `mysql-master`

Externamente:
- Master: `localhost:3306`
- Slave: `localhost:3307`
- App Frontend: `localhost:5173`
- App Backend: `localhost:3000`

## Troubleshooting

### Container não inicia

1. Verificar logs:
   ```bash
   docker logs mysql-master
   docker logs mysql-slave
   ```

2. Verificar permissões:
   ```bash
   ls -la ~/docker/mysql/master/data
   ```

3. Verificar espaço em disco:
   ```bash
   df -h ~
   ```

### Dados corrompidos

Se os dados estiverem corrompidos, restaure do backup mais recente:

```bash
# Parar containers
docker-compose down

# Limpar dados corrompidos
rm -rf ~/docker/mysql/master/data/*

# Iniciar apenas o master
docker-compose up -d mysql-master

# Aguardar inicialização
sleep 10

# Restaurar backup
./scripts/restore-mysql.sh ~/docker/mysql/master/backup/backup_auditoria_db_YYYYMMDD_HHMMSS.sql.gz master

# Reiniciar tudo
docker-compose down
docker-compose up -d
```

## Migração de Volumes Antigos

Se você tinha volumes Docker nomeados anteriormente:

```bash
# Backup dos dados antigos (se existirem)
docker run --rm -v sistema-de-auditoria_mysql-master-data:/source -v ~/docker/mysql/master/data:/dest alpine cp -a /source/. /dest/

# Remover volumes antigos
docker volume rm sistema-de-auditoria_mysql-master-data sistema-de-auditoria_mysql-slave-data
```
