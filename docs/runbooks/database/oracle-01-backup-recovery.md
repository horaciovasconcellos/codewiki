# Runbook Oracle 01 - Backup e Recovery

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 11g, 12c, 18c, 19c, 21c, 23c |
| **Tipo** | Backup e Recovery |
| **Criticidade** | Alta |
| **Tempo Estimado** | 30-120 minutos |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Este runbook descreve os procedimentos para realizar backup e recovery de bancos de dados Oracle, incluindo RMAN backups, flashback e recuperação point-in-time.

## 📚 Pré-requisitos

- [ ] Acesso ao servidor com usuário Oracle
- [ ] Permissões de DBA no banco de dados
- [ ] Espaço suficiente no destino de backup
- [ ] RMAN configurado e operacional
- [ ] Archive log habilitado (para backup online)

## 🔍 Verificações Iniciais

### 1. Verificar Status do Banco

```sql
-- Conectar como SYSDBA
sqlplus / as sysdba

-- Verificar status do banco
SELECT instance_name, status, database_status 
FROM v$instance;

-- Verificar modo de archive log
SELECT log_mode FROM v$database;

-- Verificar espaço disponível
SELECT tablespace_name, 
       ROUND(SUM(bytes)/1024/1024/1024, 2) AS size_gb,
       ROUND(SUM(bytes - NVL(free_space, 0))/1024/1024/1024, 2) AS used_gb,
       ROUND(SUM(NVL(free_space, 0))/1024/1024/1024, 2) AS free_gb
FROM (
  SELECT tablespace_name, bytes, 0 AS free_space
  FROM dba_data_files
  UNION ALL
  SELECT tablespace_name, 0 AS bytes, bytes AS free_space
  FROM dba_free_space
)
GROUP BY tablespace_name;
```

### 2. Verificar Configuração RMAN

```bash
# Conectar ao RMAN
rman target /

# Verificar configuração atual
RMAN> SHOW ALL;

# Verificar backups existentes
RMAN> LIST BACKUP SUMMARY;

# Verificar espaço na área de backup
df -h /backup/oracle
```

## 🔧 Procedimentos

### Procedimento 1: Backup Completo do Banco de Dados

#### 1.1. Configurar RMAN (se necessário)

```bash
rman target /

# Configurar retenção de backup (7 dias)
RMAN> CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;

# Configurar paralelismo
RMAN> CONFIGURE DEVICE TYPE DISK PARALLELISM 4;

# Configurar compressão
RMAN> CONFIGURE COMPRESSION ALGORITHM 'MEDIUM';

# Configurar formato de backup
RMAN> CONFIGURE CHANNEL DEVICE TYPE DISK FORMAT '/backup/oracle/%U';

# Habilitar autobackup do controlfile
RMAN> CONFIGURE CONTROLFILE AUTOBACKUP ON;
RMAN> CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO '/backup/oracle/cf_%F';
```

#### 1.2. Executar Backup Completo

```bash
# Script de backup completo
rman target / <<EOF
RUN {
  ALLOCATE CHANNEL ch1 DEVICE TYPE DISK;
  ALLOCATE CHANNEL ch2 DEVICE TYPE DISK;
  ALLOCATE CHANNEL ch3 DEVICE TYPE DISK;
  ALLOCATE CHANNEL ch4 DEVICE TYPE DISK;
  
  BACKUP AS COMPRESSED BACKUPSET
    DATABASE 
    PLUS ARCHIVELOG DELETE INPUT
    TAG 'FULL_BACKUP_$(date +%Y%m%d)';
  
  BACKUP CURRENT CONTROLFILE TAG 'CONTROLFILE_BACKUP';
  BACKUP SPFILE TAG 'SPFILE_BACKUP';
  
  RELEASE CHANNEL ch1;
  RELEASE CHANNEL ch2;
  RELEASE CHANNEL ch3;
  RELEASE CHANNEL ch4;
}

DELETE NOPROMPT OBSOLETE;
LIST BACKUP SUMMARY;
EXIT;
EOF
```

#### 1.3. Validar Backup

```bash
rman target /

# Validar o backup
RMAN> RESTORE DATABASE VALIDATE;

# Verificar integridade
RMAN> VALIDATE BACKUPSET <backup_key>;

# Gerar relatório
RMAN> LIST BACKUP OF DATABASE COMPLETED AFTER 'SYSDATE-1';
```

### Procedimento 2: Backup Incremental

#### 2.1. Backup Incremental Nível 0 (Base)

```bash
rman target / <<EOF
RUN {
  BACKUP AS COMPRESSED BACKUPSET 
    INCREMENTAL LEVEL 0 
    DATABASE 
    TAG 'INCR_LEVEL0_$(date +%Y%m%d)';
  
  BACKUP ARCHIVELOG ALL DELETE INPUT;
  DELETE NOPROMPT OBSOLETE;
}
EXIT;
EOF
```

#### 2.2. Backup Incremental Nível 1 (Diferencial)

```bash
rman target / <<EOF
RUN {
  BACKUP AS COMPRESSED BACKUPSET 
    INCREMENTAL LEVEL 1 
    DATABASE 
    TAG 'INCR_LEVEL1_$(date +%Y%m%d_%H%M)';
  
  BACKUP ARCHIVELOG ALL DELETE INPUT;
  DELETE NOPROMPT OBSOLETE;
}
EXIT;
EOF
```

### Procedimento 3: Recovery Completo do Banco de Dados

#### 3.1. Recovery com Banco Online (Complete Recovery)

```bash
# 1. Conectar ao RMAN
rman target /

# 2. Restaurar e recuperar
RMAN> RUN {
  RESTORE DATABASE;
  RECOVER DATABASE;
  ALTER DATABASE OPEN;
}
```

#### 3.2. Recovery Point-in-Time

```bash
rman target /

# Recuperar até um ponto específico no tempo
RMAN> RUN {
  SET UNTIL TIME "TO_DATE('2025-12-19 14:30:00', 'YYYY-MM-DD HH24:MI:SS')";
  RESTORE DATABASE;
  RECOVER DATABASE;
}

# Abrir banco com RESETLOGS
RMAN> ALTER DATABASE OPEN RESETLOGS;
```

#### 3.3. Recovery de Tablespace

```bash
sqlplus / as sysdba

-- Colocar tablespace offline
ALTER TABLESPACE users OFFLINE IMMEDIATE;

-- Usar RMAN para restaurar
rman target /

RMAN> RESTORE TABLESPACE users;
RMAN> RECOVER TABLESPACE users;

-- Voltar para SQL*Plus
sqlplus / as sysdba
ALTER TABLESPACE users ONLINE;
```

### Procedimento 4: Recovery de Datafile

```bash
# 1. Identificar datafile corrompido
sqlplus / as sysdba

SELECT file_name, status 
FROM dba_data_files 
WHERE tablespace_name = 'USERS';

# 2. Colocar datafile offline
ALTER DATABASE DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf' OFFLINE;

# 3. Restaurar e recuperar com RMAN
rman target /

RMAN> RESTORE DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf';
RMAN> RECOVER DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf';

# 4. Colocar datafile online
sqlplus / as sysdba
ALTER DATABASE DATAFILE '/u01/app/oracle/oradata/ORCL/users01.dbf' ONLINE;
```

### Procedimento 5: Flashback Database

#### 5.1. Habilitar Flashback (se não estiver habilitado)

```sql
-- Verificar se flashback está habilitado
SELECT flashback_on FROM v$database;

-- Habilitar flashback
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE FLASHBACK ON;
ALTER DATABASE OPEN;

-- Configurar área de recuperação rápida
ALTER SYSTEM SET db_recovery_file_dest_size = 50G SCOPE=BOTH;
ALTER SYSTEM SET db_recovery_file_dest = '/u01/fra' SCOPE=BOTH;
```

#### 5.2. Executar Flashback

```sql
-- Verificar pontos de restore disponíveis
SELECT oldest_flashback_time, retention_target 
FROM v$flashback_database_log;

-- Realizar flashback
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;

FLASHBACK DATABASE TO TIMESTAMP 
  TO_TIMESTAMP('2025-12-19 14:00:00', 'YYYY-MM-DD HH24:MI:SS');

ALTER DATABASE OPEN RESETLOGS;
```

### Procedimento 6: Backup e Recovery de Controlfile

#### 6.1. Backup de Controlfile

```sql
-- Backup binário
ALTER DATABASE BACKUP CONTROLFILE TO '/backup/control.bkp';

-- Backup em formato texto (trace)
ALTER DATABASE BACKUP CONTROLFILE TO TRACE AS '/backup/control.sql';

-- Via RMAN
rman target /
RMAN> BACKUP CURRENT CONTROLFILE FORMAT '/backup/cf_%U';
```

#### 6.2. Recovery de Controlfile

```bash
# Método 1: Restaurar de backup RMAN
rman target /

RMAN> STARTUP NOMOUNT;
RMAN> RESTORE CONTROLFILE FROM '/backup/oracle/cf_c-123456789-20251219-00';
RMAN> ALTER DATABASE MOUNT;
RMAN> RECOVER DATABASE;
RMAN> ALTER DATABASE OPEN RESETLOGS;

# Método 2: Recriar controlfile manualmente
sqlplus / as sysdba

STARTUP NOMOUNT;

-- Executar script gerado pelo backup trace
@/backup/control.sql

RECOVER DATABASE USING BACKUP CONTROLFILE;
ALTER DATABASE OPEN RESETLOGS;
```

## 📊 Verificação Pós-Procedimento

```sql
-- Verificar status do banco
SELECT instance_name, status FROM v$instance;
SELECT open_mode FROM v$database;

-- Verificar último backup
SELECT max(completion_time) AS last_backup 
FROM v$backup_set;

-- Verificar erros no alert log
SELECT originating_timestamp, message_text 
FROM v$diag_alert_ext 
WHERE originating_timestamp > SYSDATE - 1
  AND message_level = 1
ORDER BY originating_timestamp DESC;

-- Verificar tablespaces
SELECT tablespace_name, status FROM dba_tablespaces;

-- Verificar datafiles
SELECT file_name, status FROM dba_data_files;
```

## 🚨 Troubleshooting

### Problema 1: Backup Falha por Falta de Espaço

**Sintomas:**
- Erro ORA-19809: limite de recovery file dest excedido
- Erro RMAN-03009: falha ao escrever arquivo

**Solução:**
```bash
# Aumentar área de recuperação
sqlplus / as sysdba

ALTER SYSTEM SET db_recovery_file_dest_size = 100G;

# Ou limpar backups obsoletos
rman target /
RMAN> DELETE NOPROMPT OBSOLETE;
RMAN> DELETE NOPROMPT EXPIRED BACKUP;
```

### Problema 2: Archive Log Não Disponível

**Sintomas:**
- ORA-00308: não pode abrir archived log
- Recovery para com erro de missing log

**Solução:**
```bash
# Verificar logs disponíveis
rman target /
RMAN> LIST ARCHIVELOG ALL;

# Recovery até último log disponível
sqlplus / as sysdba
RECOVER DATABASE UNTIL CANCEL;
# Digite CANCEL quando faltar log

ALTER DATABASE OPEN RESETLOGS;
```

### Problema 3: Controlfile Corrompido

**Sintomas:**
- ORA-00205: erro ao identificar control file
- Banco não inicia

**Solução:**
```bash
# Copiar controlfile bom de outro multiplexado
cp /u01/app/oracle/oradata/ORCL/control02.ctl /u01/app/oracle/oradata/ORCL/control01.ctl

# Ou restaurar de backup
rman target /
RMAN> STARTUP NOMOUNT;
RMAN> RESTORE CONTROLFILE FROM AUTOBACKUP;
RMAN> ALTER DATABASE MOUNT;
```

## 📝 Scripts Úteis

### Script de Monitoramento de Backup

```bash
#!/bin/bash
# backup_monitor.sh

ORACLE_SID=ORCL
export ORACLE_SID

rman target / <<EOF
LIST BACKUP SUMMARY COMPLETED AFTER 'SYSDATE-7';

SELECT TO_CHAR(start_time, 'DD-MON-YYYY HH24:MI') AS backup_start,
       TO_CHAR(end_time, 'DD-MON-YYYY HH24:MI') AS backup_end,
       ROUND((end_time - start_time) * 24 * 60, 2) AS duration_minutes,
       input_bytes_display AS input_size,
       output_bytes_display AS output_size,
       status
FROM v\$rman_backup_job_details
WHERE start_time > SYSDATE - 7
ORDER BY start_time DESC;

EXIT;
EOF
```

### Script de Validação de Backup

```bash
#!/bin/bash
# validate_backup.sh

rman target / <<EOF
RESTORE DATABASE VALIDATE;
RESTORE CONTROLFILE VALIDATE;
RESTORE SPFILE VALIDATE;
EXIT;
EOF

if [ $? -eq 0 ]; then
    echo "$(date): Backup validation successful" >> /var/log/oracle/backup_validation.log
else
    echo "$(date): Backup validation FAILED!" >> /var/log/oracle/backup_validation.log
    # Enviar alerta
    mail -s "ALERT: Oracle Backup Validation Failed" dba@empresa.com < /var/log/oracle/backup_validation.log
fi
```

## 📞 Contatos e Escalação

| Nível | Contato | Telefone | Email |
|-------|---------|----------|-------|
| N1 - Suporte | Equipe DBA | (11) 9999-0001 | dba-support@empresa.com |
| N2 - Sênior | DBA Sênior | (11) 9999-0002 | dba-senior@empresa.com |
| N3 - Especialista | Arquiteto Oracle | (11) 9999-0003 | oracle-architect@empresa.com |

## 📚 Referências

- Oracle Database Backup and Recovery User's Guide
- Oracle RMAN Documentation
- MOS Note: Best Practices for RMAN Backups (ID 388422.1)
- MOS Note: RMAN Performance Tuning (ID 360443.1)

## 📅 Histórico de Revisões

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 19/12/2025 | Sistema de Auditoria | Versão inicial |
