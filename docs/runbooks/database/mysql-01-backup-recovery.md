# Runbook MySQL 01 - Backup e Recovery

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | MySQL/MariaDB |
| **Versões Suportadas** | MySQL 5.7, 8.0, 8.1 / MariaDB 10.x |
| **Tipo** | Backup e Recovery |
| **Criticidade** | Alta |
| **Tempo Estimado** | 30-90 minutos |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Procedimentos para backup e recuperação de bancos MySQL incluindo mysqldump, mydumper, Percona XtraBackup e binary logs.

## 📚 Pré-requisitos

- [ ] Acesso root ao MySQL
- [ ] Espaço suficiente para backup
- [ ] Binary log habilitado (para PITR)
- [ ] Ferramentas instaladas (mysqldump, xtrabackup)

## 🔧 Procedimentos

### Procedimento 1: Backup Lógico (mysqldump)

```bash
# Backup completo single transaction
mysqldump -u root -p --single-transaction --routines --triggers --events \
  --all-databases --master-data=2 > /backup/full_backup_$(date +%Y%m%d).sql

# Backup de database específico
mysqldump -u root -p --single-transaction --routines --triggers \
  --databases myapp > /backup/myapp_$(date +%Y%m%d).sql

# Backup compactado
mysqldump -u root -p --single-transaction --all-databases | \
  gzip > /backup/full_backup_$(date +%Y%m%d).sql.gz

# Backup por tabela (paralelo com mydumper)
mydumper -u root -p password -B myapp -o /backup/mydumper_$(date +%Y%m%d) -t 4 -c -e

# Verificar backup
ls -lh /backup/
zcat /backup/full_backup_*.sql.gz | head -50
```

### Procedimento 2: Backup Físico (Percona XtraBackup)

```bash
# Instalar XtraBackup
yum install -y percona-xtrabackup-80

# Backup completo
xtrabackup --backup --user=root --password=senha --target-dir=/backup/xtrabackup_full_$(date +%Y%m%d)

# Backup incremental
xtrabackup --backup --user=root --password=senha \
  --target-dir=/backup/xtrabackup_inc1_$(date +%Y%m%d) \
  --incremental-basedir=/backup/xtrabackup_full_20251219

# Preparar backup para restore
xtrabackup --prepare --target-dir=/backup/xtrabackup_full_20251219

# Preparar incremental
xtrabackup --prepare --apply-log-only --target-dir=/backup/xtrabackup_full_20251219
xtrabackup --prepare --apply-log-only --target-dir=/backup/xtrabackup_full_20251219 \
  --incremental-dir=/backup/xtrabackup_inc1_20251219
xtrabackup --prepare --target-dir=/backup/xtrabackup_full_20251219
```

### Procedimento 3: Recovery Completo

#### 3.1. Restore mysqldump

```bash
# Parar aplicação
systemctl stop myapp

# Restore
mysql -u root -p < /backup/full_backup_20251219.sql

# Ou compactado
zcat /backup/full_backup_20251219.sql.gz | mysql -u root -p

# Restore database específico
mysql -u root -p myapp < /backup/myapp_20251219.sql

# Restore mydumper
myloader -u root -p password -d /backup/mydumper_20251219 -o -t 4

# Verificar
mysql -u root -p -e "SHOW DATABASES;"
mysql -u root -p myapp -e "SHOW TABLES;"
```

#### 3.2. Restore XtraBackup

```bash
# Parar MySQL
systemctl stop mysql

# Backup datadir atual
mv /var/lib/mysql /var/lib/mysql.old

# Copiar backup preparado
xtrabackup --copy-back --target-dir=/backup/xtrabackup_full_20251219

# Ajustar permissões
chown -R mysql:mysql /var/lib/mysql

# Iniciar MySQL
systemctl start mysql

# Verificar
mysql -u root -p -e "SELECT @@version;"
```

### Procedimento 4: Point-in-Time Recovery (PITR)

```bash
# Habilitar binary log (my.cnf)
[mysqld]
log_bin = /var/log/mysql/mysql-bin
binlog_format = ROW
expire_logs_days = 7

# Listar binary logs
mysql -u root -p -e "SHOW BINARY LOGS;"

# Identificar posição do evento
mysqlbinlog /var/log/mysql/mysql-bin.000003 | grep -A 5 "DROP TABLE"

# Restore até posição específica
mysqlbinlog --stop-position=12345 /var/log/mysql/mysql-bin.000003 | mysql -u root -p

# Restore por intervalo de tempo
mysqlbinlog --start-datetime="2025-12-19 10:00:00" \
            --stop-datetime="2025-12-19 14:00:00" \
            /var/log/mysql/mysql-bin.000003 | mysql -u root -p

# Restore ignorando tabela dropada
mysqlbinlog --start-position=12346 /var/log/mysql/mysql-bin.000003 | mysql -u root -p
```

### Procedimento 5: Backup de Tabela Individual

```bash
# Backup
mysqldump -u root -p myapp customers > /backup/customers_$(date +%Y%m%d).sql

# Export para CSV
mysql -u root -p -e "SELECT * FROM myapp.customers INTO OUTFILE '/tmp/customers.csv' \
  FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n';"

# Restore
mysql -u root -p myapp < /backup/customers_20251219.sql

# Import CSV
LOAD DATA INFILE '/tmp/customers.csv' INTO TABLE myapp.customers
  FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\n';
```

### Procedimento 6: Automação de Backup

```bash
# Script de backup automático
cat << 'EOF' > /usr/local/bin/mysql_backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="/backup/mysql"
RETENTION_DAYS=7

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup
mysqldump -u root -p$(cat /root/.mysql_password) \
  --single-transaction --routines --triggers --events \
  --all-databases --master-data=2 | \
  gzip > $BACKUP_DIR/full_backup_$DATE.sql.gz

# Remover backups antigos
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completed - $BACKUP_DIR/full_backup_$DATE.sql.gz" >> /var/log/mysql_backup.log

# Validar backup
if [ $? -eq 0 ]; then
    echo "$(date): Backup validation OK" >> /var/log/mysql_backup.log
else
    echo "$(date): Backup validation FAILED!" >> /var/log/mysql_backup.log
    mail -s "MySQL Backup Failed" dba@empresa.com < /var/log/mysql_backup.log
fi
EOF

chmod +x /usr/local/bin/mysql_backup.sh

# Cron job (diário às 02:00)
echo "0 2 * * * /usr/local/bin/mysql_backup.sh" | crontab -
```

## 📊 Verificação

```sql
-- Verificar binary log
SHOW BINARY LOGS;
SHOW MASTER STATUS;

-- Tamanho dos databases
SELECT 
    table_schema AS database_name,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
GROUP BY table_schema
ORDER BY size_mb DESC;

-- Últimos backups (via script)
-- ls -lh /backup/mysql/ | tail -10
```

## 🚨 Troubleshooting

### Backup Falha por Lock

```sql
-- Usar --single-transaction para InnoDB
-- Adicionar --lock-tables=false se necessário

-- Verificar locks ativos
SHOW PROCESSLIST;
SHOW OPEN TABLES WHERE In_use > 0;
```

### Restore Lento

```bash
# Desabilitar constraints temporariamente
mysql -u root -p << EOF
SET foreign_key_checks = 0;
SET unique_checks = 0;
SET autocommit = 0;
SOURCE /backup/large_backup.sql;
COMMIT;
SET foreign_key_checks = 1;
SET unique_checks = 1;
EOF
```

### Binary Log Corrompido

```bash
# Verificar integridade
mysqlbinlog /var/log/mysql/mysql-bin.000003 > /tmp/test.sql

# Se corrompido, pular para próximo
-- Editar my.cnf e reiniciar
FLUSH LOGS;
```

## 📞 Contatos

| Nível | Contato | Email |
|-------|---------|-------|
| N1 | Equipe DBA | dba-support@empresa.com |
| N2 | DBA MySQL | dba-mysql@empresa.com |

## 📅 Histórico

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 19/12/2025 | Versão inicial |
