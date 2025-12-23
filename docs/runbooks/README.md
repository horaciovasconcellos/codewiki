# Runbook MySQL 02 - Performance Tuning

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | MySQL/MariaDB 5.7, 8.0, 8.1 |
| **Tipo** | Performance Tuning |
| **Tempo Estimado** | 30-60 minutos |

## 🔧 Procedimentos Principais

### 1. Análise de Queries Lentas

```bash
# Habilitar slow query log (my.cnf)
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/mysql-slow.log
long_query_time = 2
log_queries_not_using_indexes = 1

# Analisar com pt-query-digest
pt-query-digest /var/log/mysql/mysql-slow.log > /tmp/slow_query_report.txt

# Top queries
mysql -u root -p << EOF
SELECT query_time, lock_time, rows_examined, rows_sent, 
       LEFT(sql_text, 100) as query
FROM mysql.slow_log
ORDER BY query_time DESC LIMIT 20;
EOF
```

### 2. Otimização de Índices

```sql
-- Identificar tabelas sem PK
SELECT t.table_schema, t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.key_column_usage k
  ON t.table_schema = k.table_schema AND t.table_name = k.table_name AND k.constraint_name = 'PRIMARY'
WHERE t.table_schema NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
  AND k.column_name IS NULL
  AND t.table_type = 'BASE TABLE';

-- Índices não utilizados
SELECT * FROM sys.schema_unused_indexes;

-- Criar índice
CREATE INDEX idx_customer_email ON customers(email);
ALTER TABLE orders ADD INDEX idx_order_date (order_date);
```

### 3. Ajuste de Parâmetros

```ini
# my.cnf - Configuração para servidor com 16GB RAM
[mysqld]
# InnoDB Buffer Pool (70-80% da RAM para workload InnoDB)
innodb_buffer_pool_size = 12G
innodb_buffer_pool_instances = 8
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Conexões
max_connections = 500
thread_cache_size = 100

# Query Cache (MySQL 5.7, deprecated em 8.0)
query_cache_type = 1
query_cache_size = 256M

# Temp tables
tmp_table_size = 256M
max_heap_table_size = 256M

# Aplicar sem restart (quando possível)
SET GLOBAL innodb_buffer_pool_size = 12884901888;
```

### 4. Monitoramento

```sql
-- Processos ativos
SHOW PROCESSLIST;
SELECT * FROM information_schema.processlist WHERE command != 'Sleep' ORDER BY time DESC;

-- Status do servidor
SHOW GLOBAL STATUS LIKE '%connect%';
SHOW GLOBAL STATUS LIKE '%thread%';
SHOW GLOBAL STATUS LIKE '%buffer_pool%';

-- InnoDB Status
SHOW ENGINE INNODB STATUS\G

-- Métricas importantes
SELECT * FROM sys.metrics;
SELECT * FROM sys.memory_global_total;
```

##Vou criar um documento INDEX para facilitar navegação nos runbooks:

<function_calls>
<invoke name="create_file">
<parameter name="content"># 📚 Índice de Runbooks - Sistema de Auditoria

## 🗂️ Estrutura de Runbooks

Este diretório contém runbooks operacionais para gerenciamento de bancos de dados e sistemas operacionais.

---

## 🔷 Oracle Database

### [RB-ORACLE-01: Backup e Recovery](database/oracle-01-backup-recovery.md)
**Criticidade:** Alta | **Tempo:** 30-120 min
- RMAN Backups (Full, Incremental)
- Recovery Completo e Point-in-Time
- Flashback Database
- Backup/Recovery de Controlfile
- Troubleshooting de backup

### [RB-ORACLE-02: Performance Tuning](database/oracle-02-performance-tuning.md)
**Criticidade:** Alta | **Tempo:** 15-60 min
- Análise de SQL Lento
- Resolução de Locks e Bloqueios
- Otimização de Memória (SGA/PGA)
- Análise de I/O
- AWR Reports
- Otimização de Redo Logs

### [RB-ORACLE-03: Instalação e Configuração](database/oracle-03-installation.md)
**Criticidade:** Alta | **Tempo:** 2-4 horas
- Preparação do Sistema Operacional
- Instalação do Software Oracle
- Criação de Banco de Dados
- Configuração de Listener
- Archive Log Mode
- Automatic Startup

### [RB-ORACLE-04: Patching e Upgrade](database/oracle-04-patching-upgrade.md)
**Criticidade:** Alta | **Tempo:** 1-4 horas
- Aplicação de Release Updates (RU/PSU)
- Upgrade de Versão
- Rollback de Patch
- Downgrade de Versão
- Atualização de Timezone Data
- Bundle Patches

### [RB-ORACLE-05: Segurança e Auditoria](database/oracle-05-security-audit.md)
**Criticidade:** Alta | **Tempo:** 30-90 min
- Gerenciamento de Usuários e Privilégios
- Unified Auditing e FGA
- Transparent Data Encryption (TDE)
- Data Redaction
- Virtual Private Database (VPD)
- Hardening de Segurança

### [RB-ORACLE-06: Data Guard e High Availability](database/oracle-06-data-guard-ha.md)
**Criticidade:** Alta | **Tempo:** 2-4 horas
- Configuração de Data Guard Standby
- Monitoramento de Replicação
- Switchover e Failover
- Active Data Guard
- Broker Configuration

---

## 🔶 MySQL / MariaDB

### [RB-MYSQL-01: Backup e Recovery](database/mysql-01-backup-recovery.md)
**Criticidade:** Alta | **Tempo:** 30-90 min
- Backup Lógico (mysqldump, mydumper)
- Backup Físico (Percona XtraBackup)
- Point-in-Time Recovery (PITR)
- Automação de Backup
- Recovery Completo

### [RB-MYSQL-02: Performance Tuning](database/mysql-02-performance-tuning.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- Análise de Queries Lentas
- Otimização de Índices
- Ajuste de Parâmetros (Buffer Pool, Connections)
- Monitoramento de Performance

### [RB-MYSQL-03: Instalação e Replicação](database/mysql-03-installation-replication.md)
**Criticidade:** Alta | **Tempo:** 1-3 horas
- Instalação do MySQL/MariaDB
- Configuração de Replicação Master-Slave
- Configuração de Replicação Multi-Master
- Group Replication

### [RB-MYSQL-04: Segurança](database/mysql-04-security.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- Gerenciamento de Usuários
- SSL/TLS Configuration
- Audit Plugin
- Firewall e Hardening

### [RB-MYSQL-05: Manutenção](database/mysql-05-maintenance.md)
**Criticidade:** Média | **Tempo:** 30-90 min
- ANALYZE e OPTIMIZE Tables
- Purge de Binary Logs
- Verificação de Integridade
- Upgrade de Versão

### [RB-MYSQL-06: Troubleshooting](database/mysql-06-troubleshooting.md)
**Criticidade:** Alta | **Tempo:** 15-60 min
- Resolução de Deadlocks
- Conexões Excessivas
- Replicação Quebrada
- Tabelas Corrompidas

---

## 🔵 PostgreSQL

### [RB-POSTGRES-01: Backup e Recovery](database/postgres-01-backup-recovery.md)
**Criticidade:** Alta | **Tempo:** 30-90 min
- pg_dump e pg_basebackup
- Point-in-Time Recovery (PITR)
- WAL Archiving
- Continuous Archiving

### [RB-POSTGRES-02: Performance Tuning](database/postgres-02-performance-tuning.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- EXPLAIN ANALYZE
- Tuning de postgresql.conf
- VACUUM e ANALYZE
- Índices GIN, GiST, BRIN

### [RB-POSTGRES-03: Instalação e Replicação](database/postgres-03-installation-replication.md)
**Criticidade:** Alta | **Tempo:** 1-3 horas
- Instalação do PostgreSQL
- Streaming Replication
- Logical Replication
- Connection Pooling (PgBouncer)

### [RB-POSTGRES-04: Segurança](database/postgres-04-security.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- pg_hba.conf Configuration
- Role Management
- Row Level Security (RLS)
- Audit com pgAudit

### [RB-POSTGRES-05: Manutenção](database/postgres-05-maintenance.md)
**Criticidade:** Média | **Tempo:** 30-90 min
- VACUUM Full vs Auto Vacuum
- REINDEX
- pg_upgrade
- Monitoring com pg_stat

### [RB-POSTGRES-06: Troubleshooting](database/postgres-06-troubleshooting.md)
**Criticidade:** Alta | **Tempo:** 15-60 min
- Long Running Queries
- Bloat Tables
- Connection Limits
- Replication Lag

---

## 💻 Windows Server

### [RB-WINDOWS-01: Gerenciamento de Serviços e Processos](operating-system/windows-01-services-processes.md)
**Criticidade:** Alta | **Tempo:** 15-30 min
- Gerenciamento de Serviços do Windows
- Monitoramento de Processos
- Task Scheduler
- Event Viewer

### [RB-WINDOWS-02: Gerenciamento de Disco e Storage](operating-system/windows-02-disk-storage.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- Disk Management
- Storage Spaces
- Desfragmentação
- Shadow Copies (VSS)

### [RB-WINDOWS-03: Active Directory e GPO](operating-system/windows-03-active-directory.md)
**Criticidade:** Alta | **Tempo:** 30-90 min
- Gerenciamento de Usuários e Grupos
- Group Policy Objects (GPO)
- DNS e DHCP
- Troubleshooting AD

### [RB-WINDOWS-04: Segurança e Hardening](operating-system/windows-04-security-hardening.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- Windows Firewall
- BitLocker Encryption
- Windows Defender
- Security Policies
- Patch Management

---

## 🐧 Linux

### [RB-LINUX-01: Gerenciamento de Processos e Serviços](operating-system/linux-01-processes-services.md)
**Criticidade:** Alta | **Tempo:** 15-30 min
- systemd/systemctl
- Process Management (ps, top, htop)
- cron e systemd timers
- Log Analysis (journalctl, syslog)

### [RB-LINUX-02: Gerenciamento de Disco e Filesystem](operating-system/linux-02-disk-filesystem.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- LVM (Logical Volume Manager)
- Filesystem Operations (ext4, xfs, btrfs)
- Mount e fstab
- Disk Quotas

### [RB-LINUX-03: Rede e Firewall](operating-system/linux-03-network-firewall.md)
**Criticidade:** Alta | **Tempo:** 30-60 min
- Network Configuration (Ubuntu/Debian/RHEL/Fedora)
- iptables e firewalld
- Network Troubleshooting
- SSH Hardening

### [RB-LINUX-04: Segurança e Hardening](operating-system/linux-04-security-hardening.md)
**Criticidade:** Alta | **Tempo:** 30-90 min
- SELinux e AppArmor
- User Management
- sudo Configuration
- Fail2ban
- Security Updates
- Compliance (CIS Benchmarks)

---

## 📋 Uso dos Runbooks

### Convenções

- **Criticidade Alta**: Procedimentos que afetam disponibilidade ou integridade de dados
- **Criticidade Média**: Procedimentos de manutenção preventiva
- **Tempo Estimado**: Tempo médio para executar o procedimento completo

### Estrutura Padrão

Cada runbook contém:
1. **Informações Gerais**: Metadados do procedimento
2. **Objetivo**: Propósito do runbook
3. **Pré-requisitos**: Verificações antes da execução
4. **Procedimentos**: Passos detalhados com comandos
5. **Verificação**: Validação pós-procedimento
6. **Troubleshooting**: Resolução de problemas comuns
7. **Contatos**: Escalação de suporte

### Como Usar

1. Leia completamente o runbook antes de iniciar
2. Verifique todos os pré-requisitos
3. Execute os procedimentos na ordem apresentada
4. Documente desvios ou problemas encontrados
5. Valide o resultado final
6. Atualize o runbook se necessário

---

## 🔄 Manutenção dos Runbooks

- **Revisão Periódica**: Trimestral
- **Atualização**: Após mudanças significativas nos procedimentos
- **Feedback**: Reportar melhorias para equipe-dba@empresa.com

---

## 📞 Contatos e Suporte

| Nível | Área | Contato |
|-------|------|---------|
| N1 | Suporte Geral | suporte@empresa.com |
| N2 | DBA Oracle | dba-oracle@empresa.com |
| N2 | DBA MySQL | dba-mysql@empresa.com |
| N2 | DBA PostgreSQL | dba-postgres@empresa.com |
| N2 | SysAdmin Windows | sysadmin-windows@empresa.com |
| N2 | SysAdmin Linux | sysadmin-linux@empresa.com |
| N3 | Arquitetura | arquitetura@empresa.com |

---

## 📅 Histórico de Atualizações

| Data | Versão | Descrição |
|------|--------|-----------|
| 19/12/2025 | 1.0 | Criação inicial dos runbooks |

---

**Nota**: Este é um documento vivo. Contribua com melhorias e correções através do repositório do projeto.
