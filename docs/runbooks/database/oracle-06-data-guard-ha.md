# Runbook Oracle 06 - Data Guard e High Availability

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 11g, 12c, 18c, 19c, 21c, 23c |
| **Tipo** | Alta Disponibilidade |
| **Criticidade** | Alta |
| **Tempo Estimado** | 2-4 horas |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Configurar e manter Oracle Data Guard para alta disponibilidade e disaster recovery.

## 🔧 Procedimentos

### Procedimento 1: Configurar Data Guard Standby

#### 1.1. Preparar Primary Database

```sql
-- Habilitar force logging
ALTER DATABASE FORCE LOGGING;

-- Habilitar archive log
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Configurar standby redo logs
ALTER DATABASE ADD STANDBY LOGFILE SIZE 100M;
ALTER DATABASE ADD STANDBY LOGFILE SIZE 100M;
ALTER DATABASE ADD STANDBY LOGFILE SIZE 100M;

-- Verificar
SELECT group#, bytes/1024/1024 AS size_mb FROM v$standby_log;
```

#### 1.2. Configurar Parâmetros

```sql
-- No Primary
ALTER SYSTEM SET log_archive_config='DG_CONFIG=(ORCL,ORCL_STB)' SCOPE=BOTH;
ALTER SYSTEM SET log_archive_dest_1='LOCATION=/u01/archive VALID_FOR=(ALL_LOGFILES,ALL_ROLES) DB_UNIQUE_NAME=ORCL' SCOPE=BOTH;
ALTER SYSTEM SET log_archive_dest_2='SERVICE=ORCL_STB ASYNC VALID_FOR=(ONLINE_LOGFILES,PRIMARY_ROLE) DB_UNIQUE_NAME=ORCL_STB' SCOPE=BOTH;
ALTER SYSTEM SET log_archive_dest_state_2='ENABLE' SCOPE=BOTH;
ALTER SYSTEM SET fal_server='ORCL_STB' SCOPE=BOTH;
ALTER SYSTEM SET db_file_name_convert='/oradata/ORCL_STB/','/oradata/ORCL/' SCOPE=SPFILE;
ALTER SYSTEM SET log_file_name_convert='/oradata/ORCL_STB/','/oradata/ORCL/' SCOPE=SPFILE;
ALTER SYSTEM SET standby_file_management='AUTO' SCOPE=BOTH;
```

#### 1.3. Criar Standby Database

```bash
# No servidor primário, criar backup
rman target / << EOF
BACKUP DATABASE PLUS ARCHIVELOG;
BACKUP CURRENT CONTROLFILE FOR STANDBY FORMAT '/backup/standby_control.ctl';
EXIT;
EOF

# Transferir backup para standby
scp /backup/* oracle@standby_host:/backup/

# No servidor standby, restaurar
export ORACLE_SID=ORCL_STB
rman target / << EOF
STARTUP NOMOUNT;
RESTORE CONTROLFILE FROM '/backup/standby_control.ctl';
ALTER DATABASE MOUNT;
RESTORE DATABASE;
EXIT;
EOF

# Iniciar MRP (Managed Recovery Process)
sqlplus / as sysdba << EOF
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;
EXIT;
EOF
```

### Procedimento 2: Monitorar Data Guard

```sql
-- Status do Data Guard
SELECT database_role, open_mode, switchover_status FROM v$database;

-- Verificar lag
SELECT name, value, unit FROM v$dataguard_stats;

-- Status de archive log shipping
SELECT dest_id, status, error FROM v$archive_dest_status;

-- Processos MRP
SELECT process, status, thread#, sequence#, block# FROM v$managed_standby;
```

### Procedimento 3: Switchover (Troca Planejada)

```sql
-- No Primary
ALTER DATABASE COMMIT TO SWITCHOVER TO PHYSICAL STANDBY WITH SESSION SHUTDOWN;
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;

-- No Standby (agora será Primary)
ALTER DATABASE COMMIT TO SWITCHOVER TO PRIMARY WITH SESSION SHUTDOWN;
SHUTDOWN IMMEDIATE;
STARTUP;
```

### Procedimento 4: Failover (Troca de Emergência)

```sql
-- No Standby (será novo Primary)
-- Parar recovery
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;

-- Finalizar logs pendentes (se possível)
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE FINISH;

-- Ativar standby como primary
ALTER DATABASE ACTIVATE PHYSICAL STANDBY DATABASE;
SHUTDOWN IMMEDIATE;
STARTUP;
```

### Procedimento 5: Active Data Guard (ADG)

```sql
-- Abrir standby em READ ONLY com apply ativo
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE OPEN READ ONLY;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;

-- Verificar
SELECT open_mode, database_role FROM v$database;
```

### Procedimento 6: Broker Configuration

```bash
# Habilitar broker
dgmgrl << EOF
CONNECT sys/Oracle123!@orcl
CREATE CONFIGURATION dg_config AS PRIMARY DATABASE IS orcl CONNECT IDENTIFIER IS orcl;
ADD DATABASE orcl_stb AS CONNECT IDENTIFIER IS orcl_stb MAINTAINED AS PHYSICAL;
ENABLE CONFIGURATION;
SHOW CONFIGURATION;
EXIT;
EOF
```

## 📊 Monitoramento

```sql
-- Dashboard Data Guard
SELECT 
    database_role,
    open_mode,
    protection_mode,
    protection_level,
    switchover_status
FROM v$database;

SELECT 
    dest_id,
    dest_name,
    status,
    type,
    destination,
    error
FROM v$archive_dest_status
WHERE status != 'INACTIVE';
```

## 🚨 Troubleshooting

### Gap de Archive Logs

```sql
-- Identificar gap
SELECT * FROM v$archive_gap;

-- Resolver gap manualmente
-- No primary, identificar logs faltantes
-- Copiar para standby e aplicar
```

### Standby não aplica logs

```bash
# Verificar alertlog
tail -f $ORACLE_BASE/diag/rdbms/orcl_stb/ORCL_STB/trace/alert_ORCL_STB.log

# Reiniciar recovery
sqlplus / as sysdba << EOF
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE CANCEL;
ALTER DATABASE RECOVER MANAGED STANDBY DATABASE DISCONNECT FROM SESSION;
EXIT;
EOF
```

## 📞 Contatos

| Nível | Contato | Email |
|-------|---------|-------|
| N1 | Equipe DBA | dba-support@empresa.com |
| N2 | DBA Sênior | dba-senior@empresa.com |

## 📅 Histórico

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 19/12/2025 | Versão inicial |
