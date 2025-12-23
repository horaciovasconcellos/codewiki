# Runbook Oracle 02 - Performance Tuning e Troubleshooting

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 11g, 12c, 18c, 19c, 21c, 23c |
| **Tipo** | Performance Tuning |
| **Criticidade** | Alta |
| **Tempo Estimado** | 15-60 minutos |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Este runbook fornece procedimentos para diagnosticar e resolver problemas de performance em bancos de dados Oracle, incluindo análise de SQL lento, wait events, e otimização de recursos.

## 📚 Pré-requisitos

- [ ] Acesso ao servidor com usuário Oracle
- [ ] Permissões de DBA no banco de dados
- [ ] AWR (Automatic Workload Repository) habilitado
- [ ] Conhecimento básico de SQL tuning
- [ ] Ferramentas de monitoramento disponíveis

## 🔍 Diagnóstico Inicial

### 1. Verificar Status Geral do Sistema

```sql
-- Conectar como SYSDBA
sqlplus / as sysdba

-- Verificar carga do sistema
SELECT 
    inst_id,
    metric_name,
    value,
    metric_unit
FROM gv$sysmetric
WHERE metric_name IN (
    'Database CPU Time Ratio',
    'Database Wait Time Ratio',
    'Memory Sorts Ratio',
    'Buffer Cache Hit Ratio',
    'Library Cache Hit Ratio'
)
AND intsize_csec = (SELECT MAX(intsize_csec) FROM v$sysmetric)
ORDER BY inst_id, metric_name;

-- Top 5 Wait Events
SELECT 
    event,
    total_waits,
    ROUND(time_waited/100, 2) AS time_waited_sec,
    ROUND(average_wait * 10, 2) AS avg_wait_ms
FROM v$system_event
WHERE wait_class != 'Idle'
ORDER BY time_waited DESC
FETCH FIRST 5 ROWS ONLY;
```

### 2. Identificar Sessões Problemáticas

```sql
-- Sessões ativas consumindo CPU
SELECT 
    s.sid,
    s.serial#,
    s.username,
    s.program,
    s.machine,
    s.status,
    s.sql_id,
    ROUND(s.last_call_et/60, 2) AS minutes_running,
    s.blocking_session,
    sq.sql_text
FROM v$session s
LEFT JOIN v$sql sq ON s.sql_id = sq.sql_id
WHERE s.status = 'ACTIVE'
  AND s.username IS NOT NULL
ORDER BY s.last_call_et DESC;

-- Top sessões por uso de CPU
SELECT 
    ss.sid,
    se.serial#,
    se.username,
    se.program,
    ss.value AS cpu_used
FROM v$sesstat ss
JOIN v$statname sn ON ss.statistic# = sn.statistic#
JOIN v$session se ON ss.sid = se.sid
WHERE sn.name = 'CPU used by this session'
  AND se.username IS NOT NULL
ORDER BY ss.value DESC
FETCH FIRST 10 ROWS ONLY;
```

### 3. Análise de SQL Lento

```sql
-- Top SQL por tempo de execução
SELECT 
    sql_id,
    child_number,
    plan_hash_value,
    executions,
    ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
    ROUND(cpu_time/1000000, 2) AS cpu_sec,
    ROUND(disk_reads, 2) AS disk_reads,
    ROUND(buffer_gets, 2) AS buffer_gets,
    ROUND(elapsed_time/NULLIF(executions, 0)/1000000, 4) AS avg_elapsed_sec,
    sql_text
FROM v$sql
WHERE parsing_schema_name NOT IN ('SYS', 'SYSTEM')
  AND executions > 0
ORDER BY elapsed_time DESC
FETCH FIRST 20 ROWS ONLY;

-- SQL com mais buffer gets (I/O lógico)
SELECT 
    sql_id,
    executions,
    buffer_gets,
    ROUND(buffer_gets/NULLIF(executions, 0), 2) AS gets_per_exec,
    ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
    sql_text
FROM v$sql
WHERE executions > 10
ORDER BY buffer_gets DESC
FETCH FIRST 20 ROWS ONLY;
```

## 🔧 Procedimentos de Otimização

### Procedimento 1: Analisar e Otimizar SQL Lento

#### 1.1. Coletar Plano de Execução

```sql
-- Obter plano de execução atual
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('&sql_id', NULL, 'ALLSTATS LAST'));

-- Plano histórico do AWR
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_AWR('&sql_id'));

-- Gerar SQL Tuning Advisor Report
DECLARE
    l_sql_tune_task_id VARCHAR2(100);
BEGIN
    l_sql_tune_task_id := DBMS_SQLTUNE.CREATE_TUNING_TASK(
        sql_id => '&sql_id',
        scope => DBMS_SQLTUNE.SCOPE_COMPREHENSIVE,
        time_limit => 300,
        task_name => 'sql_tune_&sql_id',
        description => 'Tuning task for SQL_ID &sql_id'
    );
    
    DBMS_SQLTUNE.EXECUTE_TUNING_TASK(task_name => 'sql_tune_&sql_id');
END;
/

-- Ver recomendações
SELECT DBMS_SQLTUNE.REPORT_TUNING_TASK('sql_tune_&sql_id') FROM DUAL;
```

#### 1.2. Atualizar Estatísticas

```sql
-- Estatísticas de uma tabela específica
EXEC DBMS_STATS.GATHER_TABLE_STATS(
    ownname => 'SCHEMA_NAME',
    tabname => 'TABLE_NAME',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    method_opt => 'FOR ALL COLUMNS SIZE AUTO',
    degree => 4,
    cascade => TRUE
);

-- Estatísticas de um schema
EXEC DBMS_STATS.GATHER_SCHEMA_STATS(
    ownname => 'SCHEMA_NAME',
    estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
    method_opt => 'FOR ALL COLUMNS SIZE AUTO',
    degree => 4,
    cascade => TRUE
);

-- Verificar última atualização de estatísticas
SELECT 
    table_name,
    num_rows,
    blocks,
    last_analyzed,
    stale_stats
FROM dba_tab_statistics
WHERE owner = 'SCHEMA_NAME'
ORDER BY last_analyzed NULLS FIRST;
```

#### 1.3. Criar ou Rebuild Índices

```sql
-- Identificar índices missing (baseado em recomendação do SQL Tuning Advisor)
-- Criar índice
CREATE INDEX idx_table_column ON schema.table(column1, column2)
TABLESPACE indexes
PARALLEL 4 NOLOGGING;

ALTER INDEX idx_table_column NOPARALLEL LOGGING;

-- Rebuild índice fragmentado
ALTER INDEX schema.idx_name REBUILD ONLINE
TABLESPACE indexes
PARALLEL 4 NOLOGGING;

ALTER INDEX schema.idx_name NOPARALLEL LOGGING;

-- Verificar saúde dos índices
SELECT 
    index_name,
    blevel,
    leaf_blocks,
    num_rows,
    distinct_keys,
    clustering_factor,
    status
FROM dba_indexes
WHERE owner = 'SCHEMA_NAME'
  AND table_name = 'TABLE_NAME';
```

### Procedimento 2: Resolver Locks e Bloqueios

#### 2.1. Identificar Bloqueios

```sql
-- Visão geral de bloqueios
SELECT 
    blocking_session,
    sid,
    serial#,
    wait_class,
    seconds_in_wait
FROM v$session
WHERE blocking_session IS NOT NULL;

-- Detalhes da cadeia de bloqueio
SELECT 
    LPAD(' ', LEVEL * 2) || s.sid || ',' || s.serial# AS session_info,
    s.username,
    s.program,
    s.sql_id,
    s.event,
    s.seconds_in_wait,
    sq.sql_text
FROM v$session s
LEFT JOIN v$sql sq ON s.sql_id = sq.sql_id
START WITH blocking_session IS NULL
CONNECT BY PRIOR sid = blocking_session
ORDER SIBLINGS BY sid;

-- Locks ativos
SELECT 
    s.sid,
    s.serial#,
    s.username,
    l.type,
    l.lmode,
    l.request,
    o.object_name,
    s.program
FROM v$lock l
JOIN v$session s ON l.sid = s.sid
LEFT JOIN dba_objects o ON l.id1 = o.object_id
WHERE s.username IS NOT NULL
ORDER BY s.sid;
```

#### 2.2. Resolver Bloqueios

```sql
-- Matar sessão bloqueadora (USE COM CUIDADO!)
ALTER SYSTEM KILL SESSION 'sid,serial#' IMMEDIATE;

-- Exemplo:
ALTER SYSTEM KILL SESSION '123,45678' IMMEDIATE;

-- Se não funcionar, kill no nível do SO
-- Primeiro identifique o processo
SELECT 
    s.sid,
    s.serial#,
    p.spid AS os_process_id,
    s.username,
    s.program
FROM v$session s
JOIN v$process p ON s.paddr = p.addr
WHERE s.sid = &sid;

-- No servidor, como oracle user:
-- kill -9 <os_process_id>
```

### Procedimento 3: Otimizar Memória (SGA/PGA)

#### 3.1. Análise de Uso de Memória

```sql
-- Tamanho atual da SGA
SELECT 
    component,
    current_size/1024/1024 AS current_size_mb,
    min_size/1024/1024 AS min_size_mb,
    max_size/1024/1024 AS max_size_mb
FROM v$sga_dynamic_components
ORDER BY current_size DESC;

-- Estatísticas de PGA
SELECT 
    name,
    value/1024/1024 AS value_mb
FROM v$pgastat
WHERE name IN (
    'aggregate PGA target parameter',
    'aggregate PGA auto target',
    'total PGA inuse',
    'total PGA allocated',
    'maximum PGA allocated'
);

-- Buffer cache hit ratio
SELECT 
    name,
    value,
    ROUND(value * 100, 2) || '%' AS percentage
FROM v$sysstat
WHERE name IN (
    'db block gets',
    'consistent gets',
    'physical reads'
);

-- Calcular hit ratio
SELECT 
    ROUND((1 - (phy.value / (blk.value + con.value))) * 100, 2) || '%' AS buffer_cache_hit_ratio
FROM v$sysstat phy, v$sysstat blk, v$sysstat con
WHERE phy.name = 'physical reads'
  AND blk.name = 'db block gets'
  AND con.name = 'consistent gets';
```

#### 3.2. Ajustar Parâmetros de Memória

```sql
-- Aumentar SGA (com ASMM)
ALTER SYSTEM SET sga_target = 8G SCOPE=BOTH;
ALTER SYSTEM SET sga_max_size = 10G SCOPE=SPFILE;

-- Aumentar PGA
ALTER SYSTEM SET pga_aggregate_target = 4G SCOPE=BOTH;

-- Configurar Automatic Memory Management (AMM)
ALTER SYSTEM SET memory_target = 12G SCOPE=BOTH;
ALTER SYSTEM SET memory_max_target = 16G SCOPE=SPFILE;

-- Verificar parâmetros atuais
SHOW PARAMETER sga
SHOW PARAMETER pga
SHOW PARAMETER memory

-- Reiniciar para aplicar mudanças em SPFILE
SHUTDOWN IMMEDIATE;
STARTUP;
```

### Procedimento 4: Resolver Problemas de I/O

#### 4.1. Identificar I/O Bottlenecks

```sql
-- Top datafiles por I/O
SELECT 
    df.tablespace_name,
    df.file_name,
    fs.phyrds AS physical_reads,
    fs.phywrts AS physical_writes,
    fs.readtim AS read_time_cs,
    fs.writetim AS write_time_cs,
    ROUND(fs.readtim/NULLIF(fs.phyrds, 0), 2) AS avg_read_time_cs,
    ROUND(fs.writetim/NULLIF(fs.phywrts, 0), 2) AS avg_write_time_cs
FROM v$filestat fs
JOIN dba_data_files df ON fs.file# = df.file_id
ORDER BY (fs.phyrds + fs.phywrts) DESC;

-- Análise de tempfile
SELECT 
    tf.tablespace_name,
    tf.file_name,
    fs.phyrds,
    fs.phywrts,
    ROUND((fs.phyrds + fs.phywrts)/1024, 2) AS total_io_mb
FROM v$tempstat fs
JOIN dba_temp_files tf ON fs.file# = tf.file_id
ORDER BY (fs.phyrds + fs.phywrts) DESC;

-- Wait events de I/O
SELECT 
    event,
    total_waits,
    time_waited,
    average_wait
FROM v$system_event
WHERE wait_class = 'User I/O'
ORDER BY time_waited DESC;
```

#### 4.2. Otimizar I/O

```sql
-- Redistribuir datafiles em discos diferentes
-- (Executar no SO, exemplo)

-- Mover tablespace para novo datafile
ALTER TABLESPACE users ADD DATAFILE '/disk2/oradata/users02.dbf' SIZE 10G;

-- Mover objetos para novo datafile
ALTER TABLE schema.large_table MOVE TABLESPACE users;
ALTER INDEX schema.idx_large_table REBUILD ONLINE;

-- Remover datafile antigo (após mover todos os objetos)
ALTER TABLESPACE users DROP DATAFILE '/disk1/oradata/users01.dbf';

-- Aumentar DB_WRITER_PROCESSES para melhor throughput
ALTER SYSTEM SET db_writer_processes = 4 SCOPE=SPFILE;

-- Ajustar async I/O
ALTER SYSTEM SET disk_asynch_io = TRUE SCOPE=SPFILE;
```

### Procedimento 5: Análise de AWR Report

#### 5.1. Gerar AWR Report

```sql
-- Listar snapshots disponíveis
SELECT 
    snap_id,
    begin_interval_time,
    end_interval_time,
    snap_level
FROM dba_hist_snapshot
ORDER BY snap_id DESC
FETCH FIRST 50 ROWS ONLY;

-- Gerar relatório AWR (via SQL*Plus)
@$ORACLE_HOME/rdbms/admin/awrrpt.sql

-- Ou via PL/SQL
SET LONG 1000000 PAGESIZE 0 LINESIZE 200
SPOOL /tmp/awr_report.html

SELECT output 
FROM TABLE(DBMS_WORKLOAD_REPOSITORY.AWR_REPORT_HTML(
    l_dbid => (SELECT dbid FROM v$database),
    l_inst_num => 1,
    l_bid => &begin_snap_id,
    l_eid => &end_snap_id
));

SPOOL OFF
```

#### 5.2. Analisar Principais Métricas do AWR

Focar em:
- **Load Profile**: DB Time, execuções SQL/seg, transações/seg
- **Top 5 Wait Events**: Identificar gargalos
- **SQL Statistics**: Top SQL por elapsed time, CPU, I/O
- **Instance Efficiency**: Buffer hit %, library cache hit %
- **SGA Statistics**: Uso de memória
- **Latch Statistics**: Contenção de latches
- **Segment Statistics**: Top segments por I/O

### Procedimento 6: Otimização de Redo Logs

#### 6.1. Análise de Redo

```sql
-- Tamanho e status dos redo logs
SELECT 
    l.group#,
    l.thread#,
    l.sequence#,
    l.bytes/1024/1024 AS size_mb,
    l.members,
    l.status,
    l.archived,
    lf.member
FROM v$log l
JOIN v$logfile lf ON l.group# = lf.group#
ORDER BY l.group#;

-- Frequência de switch de redo log
SELECT 
    TO_CHAR(first_time, 'YYYY-MM-DD HH24') AS hour,
    COUNT(*) AS switches
FROM v$log_history
WHERE first_time > SYSDATE - 7
GROUP BY TO_CHAR(first_time, 'YYYY-MM-DD HH24')
ORDER BY hour DESC;

-- Log switch por hora (ideal: <= 4 switches/hora)
SELECT 
    TO_CHAR(first_time, 'HH24') AS hour,
    AVG(switches) AS avg_switches_per_hour
FROM (
    SELECT 
        TO_CHAR(first_time, 'YYYY-MM-DD HH24') AS day_hour,
        first_time,
        COUNT(*) AS switches
    FROM v$log_history
    WHERE first_time > SYSDATE - 7
    GROUP BY TO_CHAR(first_time, 'YYYY-MM-DD HH24'), first_time
)
GROUP BY TO_CHAR(first_time, 'HH24')
ORDER BY hour;
```

#### 6.2. Aumentar Tamanho dos Redo Logs

```sql
-- Adicionar novos grupos de redo maiores
ALTER DATABASE ADD LOGFILE GROUP 4 ('/u01/oradata/ORCL/redo04a.log', 
                                      '/u02/oradata/ORCL/redo04b.log') SIZE 1G;
ALTER DATABASE ADD LOGFILE GROUP 5 ('/u01/oradata/ORCL/redo05a.log', 
                                      '/u02/oradata/ORCL/redo05b.log') SIZE 1G;
ALTER DATABASE ADD LOGFILE GROUP 6 ('/u01/oradata/ORCL/redo06a.log', 
                                      '/u02/oradata/ORCL/redo06b.log') SIZE 1G;

-- Esperar até que os grupos antigos não estejam CURRENT ou ACTIVE
SELECT group#, status FROM v$log;

-- Quando status = INACTIVE, pode dropar
ALTER DATABASE DROP LOGFILE GROUP 1;
ALTER DATABASE DROP LOGFILE GROUP 2;
ALTER DATABASE DROP LOGFILE GROUP 3;

-- Remover arquivos físicos do SO
-- rm /u01/oradata/ORCL/redo01*.log
```

## 📊 Queries de Monitoramento

### Dashboard de Performance

```sql
-- Script de monitoramento completo
SET LINESIZE 200 PAGESIZE 100

PROMPT ========================================
PROMPT Database Performance Dashboard
PROMPT ========================================

PROMPT
PROMPT === Instance Information ===
SELECT instance_name, host_name, version, status, database_status
FROM v$instance;

PROMPT
PROMPT === Database Load ===
SELECT 
    metric_name,
    ROUND(value, 2) AS value,
    metric_unit
FROM v$sysmetric
WHERE metric_name IN (
    'CPU Usage Per Sec',
    'Host CPU Utilization (%)',
    'Database CPU Time Ratio',
    'Database Wait Time Ratio'
)
AND intsize_csec = (SELECT MAX(intsize_csec) FROM v$sysmetric);

PROMPT
PROMPT === Top 5 Wait Events ===
SELECT 
    event,
    total_waits,
    ROUND(time_waited/100, 2) AS time_waited_sec,
    ROUND(average_wait * 10, 2) AS avg_wait_ms
FROM v$system_event
WHERE wait_class != 'Idle'
ORDER BY time_waited DESC
FETCH FIRST 5 ROWS ONLY;

PROMPT
PROMPT === Active Sessions ===
SELECT COUNT(*) AS active_sessions
FROM v$session
WHERE status = 'ACTIVE'
  AND username IS NOT NULL;

PROMPT
PROMPT === Top SQL by Elapsed Time (Last Hour) ===
SELECT 
    sql_id,
    executions,
    ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
    ROUND(cpu_time/1000000, 2) AS cpu_sec,
    SUBSTR(sql_text, 1, 80) AS sql_text
FROM v$sql
WHERE last_active_time > SYSDATE - 1/24
  AND parsing_schema_name NOT IN ('SYS', 'SYSTEM')
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;
```

## 🚨 Alertas e Thresholds

### Configurar Alertas

```sql
-- Configurar threshold para tablespace
BEGIN
    DBMS_SERVER_ALERT.SET_THRESHOLD(
        metrics_id => DBMS_SERVER_ALERT.TABLESPACE_PCT_FULL,
        warning_operator => DBMS_SERVER_ALERT.OPERATOR_GE,
        warning_value => '85',
        critical_operator => DBMS_SERVER_ALERT.OPERATOR_GE,
        critical_value => '95',
        observation_period => 1,
        consecutive_occurrences => 1,
        instance_name => NULL,
        object_type => DBMS_SERVER_ALERT.OBJECT_TYPE_TABLESPACE,
        object_name => 'USERS'
    );
END;
/

-- Ver alertas ativos
SELECT 
    reason,
    creation_time,
    message_level,
    resolution
FROM dba_outstanding_alerts
ORDER BY creation_time DESC;
```

## 🚨 Troubleshooting

### Problema 1: Alto Uso de CPU

**Diagnóstico:**
```sql
-- Identificar sessões com alto CPU
SELECT 
    s.sid,
    s.serial#,
    s.username,
    s.program,
    s.sql_id,
    ss.value AS cpu_used,
    sq.sql_text
FROM v$sesstat ss
JOIN v$statname sn ON ss.statistic# = sn.statistic#
JOIN v$session s ON ss.sid = s.sid
LEFT JOIN v$sql sq ON s.sql_id = sq.sql_id
WHERE sn.name = 'CPU used by this session'
  AND s.username IS NOT NULL
ORDER BY ss.value DESC
FETCH FIRST 5 ROWS ONLY;
```

**Ação:**
- Otimizar SQL identificado
- Verificar plano de execução
- Atualizar estatísticas
- Considerar paralelização ou particionamento

### Problema 2: Log File Sync Wait

**Diagnóstico:**
```sql
SELECT 
    event,
    total_waits,
    time_waited,
    average_wait
FROM v$system_event
WHERE event = 'log file sync';
```

**Ação:**
- Aumentar redo log size
- Mover redo logs para discos mais rápidos
- Reduzir commits (batch commits)
- Verificar I/O do sistema de storage

### Problema 3: Enq: TX - Row Lock Contention

**Diagnóstico:**
```sql
SELECT 
    s1.sid AS blocking_sid,
    s1.serial# AS blocking_serial,
    s1.username AS blocking_user,
    s2.sid AS waiting_sid,
    s2.serial# AS waiting_serial,
    s2.username AS waiting_user,
    s2.event
FROM v$lock l1
JOIN v$session s1 ON l1.sid = s1.sid
JOIN v$lock l2 ON l1.id1 = l2.id1 AND l1.id2 = l2.id2
JOIN v$session s2 ON l2.sid = s2.sid
WHERE l1.block = 1 AND l2.request > 0;
```

**Ação:**
- Reduzir tempo de transação
- Implementar retry logic na aplicação
- Considerar particionamento
- Otimizar índices

## 📞 Contatos e Escalação

| Nível | Contato | Telefone | Email |
|-------|---------|----------|-------|
| N1 - Suporte | Equipe DBA | (11) 9999-0001 | dba-support@empresa.com |
| N2 - Performance | DBA Performance | (11) 9999-0002 | dba-performance@empresa.com |
| N3 - Especialista | Arquiteto Oracle | (11) 9999-0003 | oracle-architect@empresa.com |

## 📚 Referências

- Oracle Database Performance Tuning Guide
- Oracle Database SQL Tuning Guide
- MOS Note: Understanding and Tuning Waits (ID 2361215.1)
- MOS Note: SQL Tuning Guide (ID 1922234.1)

## 📅 Histórico de Revisões

| Versão | Data | Autor | Descrição |
|--------|------|-------|-----------|
| 1.0 | 19/12/2025 | Sistema de Auditoria | Versão inicial |
