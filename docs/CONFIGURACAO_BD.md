# Configuração do Banco de Dados MySQL com Replicação

## Arquitetura

```
┌─────────────────┐
│   Aplicação     │
│   (Node.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      Replicação      ┌─────────────────┐
│  MySQL Master   │ ──────────────────▶  │  MySQL Slave    │
│   (Porta 3306)  │      Assíncrona      │   (Porta 3307)  │
│   Read/Write    │                      │   Read Only     │
└─────────────────┘                      └─────────────────┘
```

## Modelo de Dados

### Tabela: colaboradores
- **id**: VARCHAR(36) - Chave primária
- **matricula**: VARCHAR(20) - Único, indexado
- **nome**: VARCHAR(255)
- **setor**: VARCHAR(100) - Indexado
- **data_admissao**: DATE
- **data_demissao**: DATE (nullable)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### Tabela: tipos_afastamento
- **id**: VARCHAR(36) - Chave primária
- **sigla**: VARCHAR(3) - Único, indexado
- **descricao**: VARCHAR(50)
- **argumentacao_legal**: VARCHAR(60)
- **numero_dias**: INT (1-99)
- **tipo_tempo**: ENUM('Consecutivo', 'Não Consecutivo')
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### Tabela: afastamentos
- **id**: VARCHAR(36) - Chave primária
- **colaborador_id**: VARCHAR(36) - FK para colaboradores
- **tipo_id**: VARCHAR(36) - FK para tipos_afastamento
- **inicial_provavel**: DATE
- **final_provavel**: DATE
- **inicial_efetivo**: DATE (nullable)
- **final_efetivo**: DATE (nullable)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### Tabela: habilidades
- **id**: VARCHAR(36) - Chave primária
- **nome**: VARCHAR(100) - Único
- **tipo**: ENUM('Técnica', 'Comportamental')
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

### Tabela: colaborador_habilidades
- **id**: VARCHAR(36) - Chave primária
- **colaborador_id**: VARCHAR(36) - FK para colaboradores
- **habilidade_id**: VARCHAR(36) - FK para habilidades
- **nivel_declarado**: ENUM('Básico', 'Intermediário', 'Avançado', 'Expert')
- **nivel_avaliado**: ENUM('Básico', 'Intermediário', 'Avançado', 'Expert')
- **data_inicio**: DATE
- **data_termino**: DATE (nullable)
- **created_at**: TIMESTAMP
- **updated_at**: TIMESTAMP

## Replicação Master-Slave

### Configuração do Master

**Arquivo**: `database/master.cnf`

```ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_do_db = auditoria_db
binlog_format = ROW
```

- **server-id**: Identificador único do servidor Master
- **log_bin**: Ativa o binary log para replicação
- **binlog_do_db**: Especifica qual banco será replicado
- **binlog_format**: ROW garante replicação precisa de cada linha

### Configuração do Slave

**Arquivo**: `database/slave.cnf`

```ini
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
log_bin = mysql-bin
binlog_do_db = auditoria_db
read_only = 1
```

- **server-id**: Identificador único do servidor Slave (diferente do Master)
- **relay-log**: Log de relay para processar replicação
- **read_only**: Previne escritas acidentais no Slave

### Processo de Replicação

1. **Master**: Grava todas as mudanças no binary log
2. **Slave I/O Thread**: Lê o binary log do Master e grava no relay log
3. **Slave SQL Thread**: Executa as mudanças do relay log no banco Slave

## Usuários e Permissões

### root
- Senha: `rootpass123`
- Acesso: Todas as operações
- Uso: Administração

### app_user
- Senha: `apppass123`
- Acesso: auditoria_db (SELECT, INSERT, UPDATE, DELETE)
- Uso: Aplicação

### replicator
- Senha: `replicator123`
- Acesso: REPLICATION SLAVE
- Uso: Replicação Master → Slave

## Volumes Persistentes

- **mysql-master-data**: Dados do MySQL Master
- **mysql-slave-data**: Dados do MySQL Slave

Os volumes garantem que os dados persistam mesmo se os containers forem removidos.

## Health Checks

Ambos os containers têm health checks configurados:

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Isso garante que a aplicação só inicie quando o banco estiver pronto.

## Performance e Otimização

### Índices Criados

- `idx_matricula` em colaboradores.matricula
- `idx_setor` em colaboradores.setor
- `idx_sigla` em tipos_afastamento.sigla
- `idx_colaborador` em afastamentos.colaborador_id
- `idx_tipo` em afastamentos.tipo_id
- `idx_datas` em afastamentos (inicial_provavel, final_provavel)

### Engine InnoDB

Todas as tabelas usam InnoDB para:
- Suporte a transações ACID
- Integridade referencial (Foreign Keys)
- Melhor performance em operações concorrentes

### Charset UTF-8

```sql
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

Suporta caracteres especiais e emojis.

## Monitoramento

### Verificar Status da Replicação

```sql
SHOW SLAVE STATUS\G
```

Campos importantes:
- **Slave_IO_Running**: Yes (I/O thread ativa)
- **Slave_SQL_Running**: Yes (SQL thread ativa)
- **Seconds_Behind_Master**: 0 ou próximo de 0 (lag da replicação)
- **Last_Error**: Vazio (sem erros)

### Verificar Binary Log no Master

```sql
SHOW MASTER STATUS;
```

Mostra o arquivo de log atual e a posição.

### Verificar Processos

```sql
SHOW PROCESSLIST;
```

Lista todas as conexões e queries ativas.

## Backup e Recuperação

### Backup Completo

```bash
docker exec mysql-master mysqldump -uroot -prootpass123 \
  --single-transaction \
  --master-data=2 \
  auditoria_db > backup_$(date +%Y%m%d).sql
```

### Restauração

```bash
docker exec -i mysql-master mysql -uroot -prootpass123 \
  auditoria_db < backup_20240101.sql
```

## Escalabilidade

### Adicionar Novo Slave

1. Edite `docker-compose.yml`:

```yaml
mysql-slave2:
  image: mysql:8.0
  container_name: mysql-slave2
  environment:
    MYSQL_ROOT_PASSWORD: rootpass123
  ports:
    - "3308:3306"
  volumes:
    - mysql-slave2-data:/var/lib/mysql
    - ./database/slave2.cnf:/etc/mysql/conf.d/slave.cnf
```

2. Crie `database/slave2.cnf` com `server-id = 3`

3. Execute o script de replicação adaptado para o novo slave

## Segurança

### Recomendações para Produção

1. **Alterar senhas**: Usar senhas fortes e únicas
2. **SSL/TLS**: Criptografar conexões MySQL
3. **Firewall**: Limitar acesso às portas MySQL
4. **Backups**: Automatizar backups diários
5. **Monitoramento**: Implementar alertas de falhas
6. **Logs**: Centralizar logs para auditoria
