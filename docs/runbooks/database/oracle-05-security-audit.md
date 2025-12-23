# Runbook Oracle 05 - Segurança e Auditoria

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 11g, 12c, 18c, 19c, 21c, 23c |
| **Tipo** | Segurança e Auditoria |
| **Criticidade** | Alta |
| **Tempo Estimado** | 30-90 minutos |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Procedimentos para configuração de segurança, auditoria, gerenciamento de usuários e conformidade no Oracle Database.

## 🔧 Procedimentos

### Procedimento 1: Gerenciamento de Usuários e Privilégios

#### 1.1. Criar Usuário

```sql
-- Criar usuário
CREATE USER app_user IDENTIFIED BY "SenhaForte123!"
DEFAULT TABLESPACE users
TEMPORARY TABLESPACE temp
QUOTA 100M ON users;

-- Conceder privilégios básicos
GRANT CREATE SESSION TO app_user;
GRANT CREATE TABLE TO app_user;
GRANT CREATE VIEW TO app_user;
GRANT CREATE PROCEDURE TO app_user;

-- Conceder privilégios via role
CREATE ROLE app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema.tabela TO app_role;
GRANT app_role TO app_user;
```

#### 1.2. Políticas de Senha

```sql
-- Criar profile de senha
CREATE PROFILE strong_password_profile LIMIT
    SESSIONS_PER_USER 3
    CPU_PER_SESSION UNLIMITED
    CPU_PER_CALL UNLIMITED
    CONNECT_TIME UNLIMITED
    IDLE_TIME 30
    LOGICAL_READS_PER_SESSION UNLIMITED
    LOGICAL_READS_PER_CALL UNLIMITED
    PRIVATE_SGA UNLIMITED
    FAILED_LOGIN_ATTEMPTS 5
    PASSWORD_LIFE_TIME 90
    PASSWORD_REUSE_TIME 365
    PASSWORD_REUSE_MAX 10
    PASSWORD_VERIFY_FUNCTION ora12c_strong_verify_function
    PASSWORD_LOCK_TIME 1
    PASSWORD_GRACE_TIME 7;

-- Aplicar profile
ALTER USER app_user PROFILE strong_password_profile;

-- Verificar função de verificação (12c+)
SELECT * FROM dba_users WHERE username = 'APP_USER';
```

#### 1.3. Auditar Privilégios

```sql
-- Listar privilégios de usuário
SELECT * FROM dba_sys_privs WHERE grantee = 'APP_USER';
SELECT * FROM dba_tab_privs WHERE grantee = 'APP_USER';
SELECT * FROM dba_role_privs WHERE grantee = 'APP_USER';

-- Revogar privilégios excessivos
REVOKE DBA FROM app_user;
REVOKE DROP ANY TABLE FROM app_user;
```

### Procedimento 2: Configurar Auditoria

#### 2.1. Unified Auditing (12c+)

```sql
-- Verificar se Unified Auditing está habilitado
SELECT VALUE FROM v$option WHERE PARAMETER = 'Unified Auditing';

-- Criar política de auditoria
CREATE AUDIT POLICY sensitive_data_access
ACTIONS SELECT ON schema.customers,
        INSERT ON schema.customers,
        UPDATE ON schema.customers,
        DELETE ON schema.customers;

-- Habilitar política
AUDIT POLICY sensitive_data_access;

-- Auditar ações de usuários privilegiados
CREATE AUDIT POLICY dba_activity
ACTIONS ALL
WHEN 'SYS_CONTEXT(''USERENV'', ''SESSION_USER'') IN (''SYS'', ''SYSTEM'')' EVALUATE PER SESSION;

AUDIT POLICY dba_activity;

-- Visualizar registros de auditoria
SELECT event_timestamp, dbusername, action_name, object_name, sql_text
FROM unified_audit_trail
WHERE dbusername = 'APP_USER'
ORDER BY event_timestamp DESC
FETCH FIRST 100 ROWS ONLY;
```

#### 2.2. Traditional Auditing (11g)

```sql
-- Habilitar auditoria
ALTER SYSTEM SET audit_trail = DB, EXTENDED SCOPE=SPFILE;
-- Reiniciar banco

-- Auditar operações
AUDIT SELECT TABLE, INSERT TABLE, UPDATE TABLE, DELETE TABLE BY ACCESS;
AUDIT EXECUTE PROCEDURE BY ACCESS;
AUDIT SESSION BY ACCESS;

-- Auditar ações específicas
AUDIT ALL ON schema.sensitive_table BY ACCESS;

-- Visualizar auditoria
SELECT timestamp, username, action_name, obj_name, sql_text
FROM dba_audit_trail
WHERE username = 'APP_USER'
ORDER BY timestamp DESC;
```

#### 2.3. Fine-Grained Auditing (FGA)

```sql
-- Criar política FGA para auditoria detalhada
BEGIN
    DBMS_FGA.ADD_POLICY(
        object_schema   => 'SCHEMA',
        object_name     => 'CUSTOMERS',
        policy_name     => 'audit_customer_ssn',
        audit_condition => 'SSN IS NOT NULL',
        audit_column    => 'SSN',
        enable          => TRUE,
        statement_types => 'SELECT,UPDATE',
        audit_trail     => DBMS_FGA.DB + DBMS_FGA.EXTENDED
    );
END;
/

-- Visualizar FGA
SELECT timestamp, db_user, object_name, sql_text, sql_bind
FROM dba_fga_audit_trail
WHERE policy_name = 'AUDIT_CUSTOMER_SSN'
ORDER BY timestamp DESC;
```

### Procedimento 3: Criptografia (TDE - Transparent Data Encryption)

#### 3.1. Configurar Wallet

```bash
# Criar diretório para wallet
mkdir -p $ORACLE_BASE/admin/$ORACLE_SID/wallet
chmod 700 $ORACLE_BASE/admin/$ORACLE_SID/wallet
```

```sql
-- Configurar wallet location em sqlnet.ora
-- $ORACLE_HOME/network/admin/sqlnet.ora
-- ENCRYPTION_WALLET_LOCATION =
--   (SOURCE = (METHOD = FILE)
--     (METHOD_DATA =
--       (DIRECTORY = /u01/app/oracle/admin/ORCL/wallet)))

-- Criar e abrir wallet
ALTER SYSTEM SET ENCRYPTION KEY IDENTIFIED BY "WalletPassword123!";

-- Verificar status
SELECT * FROM v$encryption_wallet;
```

#### 3.2. Criptografar Tablespace

```sql
-- Criar tablespace criptografado
CREATE TABLESPACE secure_data
DATAFILE '/u02/oradata/ORCL/secure_data01.dbf' SIZE 100M
ENCRYPTION USING 'AES256'
DEFAULT STORAGE(ENCRYPT);

-- Criptografar tabela existente
ALTER TABLE schema.sensitive_table MOVE TABLESPACE secure_data;

-- Criptografar coluna específica
ALTER TABLE schema.customers MODIFY (ssn ENCRYPT USING 'AES256');
```

#### 3.3. Backup de Wallet

```bash
# Backup do wallet
tar -czf wallet_backup_$(date +%Y%m%d).tar.gz $ORACLE_BASE/admin/$ORACLE_SID/wallet
cp wallet_backup_*.tar.gz /backup/secure/
```

### Procedimento 4: Data Redaction (12c+)

```sql
-- Criar política de redação
BEGIN
    DBMS_REDACT.ADD_POLICY(
        object_schema    => 'SCHEMA',
        object_name      => 'CUSTOMERS',
        policy_name      => 'redact_ssn',
        column_name      => 'SSN',
        function_type    => DBMS_REDACT.PARTIAL,
        function_parameters => 'VVVFVVFVVVV,VVV-VV-VVVV,*,1,5',
        expression       => 'SYS_CONTEXT(''USERENV'',''SESSION_USER'') != ''ADMIN'''
    );
END;
/

-- Testar
-- Como usuário não-admin, SSN aparece: ***-**-1234
SELECT customer_name, ssn FROM schema.customers;
```

### Procedimento 5: Virtual Private Database (VPD)

```sql
-- Criar função de política
CREATE OR REPLACE FUNCTION schema.employee_security_policy (
    schema_var IN VARCHAR2,
    table_var  IN VARCHAR2
) RETURN VARCHAR2 AS
    v_predicate VARCHAR2(2000);
BEGIN
    -- Restringe visualização apenas aos próprios registros
    v_predicate := 'employee_id = SYS_CONTEXT(''USERENV'', ''SESSION_USER'')';
    RETURN v_predicate;
END;
/

-- Aplicar política
BEGIN
    DBMS_RLS.ADD_POLICY(
        object_schema   => 'SCHEMA',
        object_name     => 'EMPLOYEES',
        policy_name     => 'employee_rls_policy',
        function_schema => 'SCHEMA',
        policy_function => 'employee_security_policy',
        statement_types => 'SELECT, UPDATE, DELETE'
    );
END;
/
```

### Procedimento 6: Hardening de Segurança

#### 6.1. Remover Contas Padrão

```sql
-- Listar usuários padrão
SELECT username, account_status, lock_date 
FROM dba_users 
WHERE username IN ('SCOTT', 'HR', 'OE', 'OUTLN', 'DBSNMP', 'ANONYMOUS')
ORDER BY username;

-- Dropar ou lock contas não utilizadas
DROP USER scott CASCADE;
ALTER USER dbsnmp ACCOUNT LOCK;
```

#### 6.2. Configurar Network Encryption

```bash
# Adicionar ao sqlnet.ora (servidor e cliente)
cat << EOF >> $ORACLE_HOME/network/admin/sqlnet.ora
SQLNET.ENCRYPTION_SERVER = REQUIRED
SQLNET.ENCRYPTION_TYPES_SERVER = (AES256, AES192, AES128)
SQLNET.CRYPTO_CHECKSUM_SERVER = REQUIRED
SQLNET.CRYPTO_CHECKSUM_TYPES_SERVER = (SHA256, SHA384, SHA512)
EOF

# Reiniciar listener
lsnrctl reload
```

#### 6.3. Restringir Acesso por IP

```bash
# Configurar sqlnet.ora
cat << EOF >> $ORACLE_HOME/network/admin/sqlnet.ora
tcp.validnode_checking = yes
tcp.invited_nodes = (192.168.1.*, 10.0.0.*)
tcp.excluded_nodes = (0.0.0.0)
EOF
```

## 📊 Queries de Auditoria

```sql
-- Últimos logins
SELECT username, timestamp, action_name, returncode
FROM dba_audit_session
ORDER BY timestamp DESC
FETCH FIRST 50 ROWS ONLY;

-- Alterações de schema
SELECT username, timestamp, obj_name, action_name
FROM dba_audit_trail
WHERE action_name IN ('CREATE', 'ALTER', 'DROP')
ORDER BY timestamp DESC
FETCH FIRST 100 ROWS ONLY;

-- Privilégios concedidos recentemente
SELECT * FROM dba_audit_trail
WHERE action_name = 'GRANT'
ORDER BY timestamp DESC;

-- Tentativas de login falhas
SELECT username, timestamp, returncode
FROM dba_audit_session
WHERE returncode != 0
ORDER BY timestamp DESC;
```

## 🚨 Alertas de Segurança

```sql
-- Criar job para alertar sobre eventos de segurança
BEGIN
    DBMS_SCHEDULER.CREATE_JOB(
        job_name   => 'SECURITY_ALERT_JOB',
        job_type   => 'PLSQL_BLOCK',
        job_action => 'BEGIN check_security_events; END;',
        start_date => SYSTIMESTAMP,
        repeat_interval => 'FREQ=HOURLY',
        enabled    => TRUE
    );
END;
/
```

## 📞 Contatos

| Nível | Contato | Email |
|-------|---------|-------|
| N1 | Equipe DBA | dba-support@empresa.com |
| N2 | Security DBA | dba-security@empresa.com |

## 📚 Referências

- Oracle Database Security Guide
- MOS Note: Security Best Practices (ID 1267723.1)
- Oracle Database Vault Documentation

## 📅 Histórico

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 19/12/2025 | Versão inicial |
