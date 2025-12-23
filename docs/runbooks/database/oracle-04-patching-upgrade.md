# Runbook Oracle 04 - Patching e Upgrade

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 11g, 12c, 18c, 19c, 21c, 23c |
| **Tipo** | Patching e Upgrade |
| **Criticidade** | Alta |
| **Tempo Estimado** | 1-4 horas |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Procedimentos para aplicação de patches (PSU, CPU, RU) e upgrade de versão do Oracle Database.

## 📚 Pré-requisitos

- [ ] Backup completo do banco de dados
- [ ] Janela de manutenção aprovada
- [ ] Download do patch/software
- [ ] Espaço suficiente em disco
- [ ] OPatch atualizado

## 🔧 Procedimentos

### Procedimento 1: Aplicar Release Update (RU/PSU)

#### 1.1. Preparação

```bash
# Verificar versão atual
sqlplus / as sysdba << EOF
SELECT * FROM v\$version;
EXIT;
EOF

# Verificar patches instalados
cd $ORACLE_HOME/OPatch
./opatch lsinventory

# Atualizar OPatch se necessário
# Baixar última versão do OPatch do MOS
cd $ORACLE_HOME
mv OPatch OPatch.old
unzip /stage/p6880880_190000_Linux-x86-64.zip

# Backup do ORACLE_HOME (opcional mas recomendado)
tar -czf /backup/oracle_home_$(date +%Y%m%d).tar.gz $ORACLE_HOME
```

#### 1.2. Aplicar Patch

```bash
# Extrair patch
cd /stage
unzip p34786990_190000_Linux-x86-64.zip
cd 34786990

# Verificar conflitos
$ORACLE_HOME/OPatch/opatch prereq CheckConflictAgainstOHWithDetail -ph ./

# Parar banco de dados e listener
sqlplus / as sysdba << EOF
SHUTDOWN IMMEDIATE;
EXIT;
EOF

lsnrctl stop

# Aplicar patch
cd /stage/34786990
$ORACLE_HOME/OPatch/opatch apply

# Iniciar banco e executar datapatch
sqlplus / as sysdba << EOF
STARTUP;
EXIT;
EOF

cd $ORACLE_HOME/OPatch
./datapatch -verbose

# Iniciar listener
lsnrctl start
```

#### 1.3. Verificação Pós-Patch

```sql
-- Verificar versão e patches
SELECT * FROM v$version;

SELECT patch_id, patch_uid, action, status, description
FROM dba_registry_sqlpatch
ORDER BY action_time DESC;

-- Verificar componentes inválidos
SELECT comp_name, status, version 
FROM dba_registry;

-- Recompilar objetos inválidos
@?/rdbms/admin/utlrp.sql
```

### Procedimento 2: Upgrade de Versão

#### 2.1. Pre-Upgrade (11g/12c para 19c)

```bash
# Executar Pre-Upgrade Tool
cd $ORACLE_HOME/rdbms/admin
sqlplus / as sysdba

@preupgrd.sql

# Revisar relatório
-- Arquivo: $ORACLE_BASE/cfgtoollogs/ORCL/preupgrade/preupgrade.log

# Executar fixups necessários
@preupgrade_fixups.sql
```

#### 2.2. Backup Completo

```bash
rman target / << EOF
BACKUP DATABASE PLUS ARCHIVELOG;
BACKUP CURRENT CONTROLFILE TO '/backup/control.bkp';
ALTER DATABASE BACKUP CONTROLFILE TO TRACE AS '/backup/control.trc';
EXIT;
EOF
```

#### 2.3. Instalar Nova Versão do Software

```bash
# Instalar Oracle 19c em novo ORACLE_HOME
# Ver Runbook 03 - Instalação

# Exemplo:
export ORACLE_HOME_19C=/u01/app/oracle/product/19.3.0/dbhome_1
cd $ORACLE_HOME_19C
./runInstaller -silent -responseFile /tmp/db_install.rsp
```

#### 2.4. Executar Upgrade

```bash
# Parar banco na versão antiga
export ORACLE_HOME=/u01/app/oracle/product/12.2.0/dbhome_1
export ORACLE_SID=ORCL
sqlplus / as sysdba << EOF
SHUTDOWN IMMEDIATE;
EXIT;
EOF

# Copiar arquivos de configuração
cp $ORACLE_HOME/dbs/spfileORCL.ora /u01/app/oracle/product/19.3.0/dbhome_1/dbs/
cp $ORACLE_HOME/network/admin/*.ora /u01/app/oracle/product/19.3.0/dbhome_1/network/admin/

# Ajustar ambiente para nova versão
export ORACLE_HOME=/u01/app/oracle/product/19.3.0/dbhome_1
export PATH=$ORACLE_HOME/bin:$PATH

# Iniciar em modo UPGRADE
sqlplus / as sysdba << EOF
STARTUP UPGRADE;
EXIT;
EOF

# Executar upgrade usando DBUA (GUI)
dbua

# Ou manual via scripts
cd $ORACLE_HOME/rdbms/admin
sqlplus / as sysdba << EOF
@catupgrd.sql
EXIT;
EOF

# Executar post-upgrade
sqlplus / as sysdba << EOF
@postupgrade_fixups.sql
@utlrp.sql
EXIT;
EOF
```

#### 2.5. Validação Pós-Upgrade

```sql
-- Verificar versão
SELECT * FROM v$version;

-- Verificar componentes
SELECT comp_name, version, status 
FROM dba_registry
ORDER BY comp_name;

-- Verificar timezone
SELECT * FROM v$timezone_file;

-- Verificar parâmetros obsoletos
SELECT name, value 
FROM v$parameter 
WHERE isdefault = 'FALSE' 
  AND name IN (SELECT name FROM v$obsolete_parameter);
```

### Procedimento 3: Rollback de Patch

```bash
# Rollback de RU/PSU
cd /stage/34786990

# Parar banco e listener
sqlplus / as sysdba << EOF
SHUTDOWN IMMEDIATE;
EXIT;
EOF

lsnrctl stop

# Executar rollback
$ORACLE_HOME/OPatch/opatch rollback -id 34786990

# Iniciar banco
sqlplus / as sysdba << EOF
STARTUP;
EXIT;
EOF

# Executar datapatch
cd $ORACLE_HOME/OPatch
./datapatch -verbose

lsnrctl start
```

### Procedimento 4: Downgrade de Versão

```bash
# Downgrade usando DBNEWID (último recurso)
# Melhor opção: Restore de backup

# Método 1: Flashback Database
sqlplus / as sysdba << EOF
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
FLASHBACK DATABASE TO TIMESTAMP TO_TIMESTAMP('2025-12-19 10:00:00', 'YYYY-MM-DD HH24:MI:SS');
ALTER DATABASE OPEN RESETLOGS;
EXIT;
EOF

# Método 2: Restaurar backup
rman target / << EOF
SHUTDOWN IMMEDIATE;
STARTUP NOMOUNT;
RESTORE CONTROLFILE FROM '/backup/control.bkp';
ALTER DATABASE MOUNT;
RESTORE DATABASE;
RECOVER DATABASE;
ALTER DATABASE OPEN RESETLOGS;
EXIT;
EOF
```

### Procedimento 5: Atualizar Timezone Data

```sql
-- Verificar versão atual
SELECT * FROM v$timezone_file;

-- Baixar patch de timezone do MOS
-- Aplicar usando DBMS_DST

-- Preparar
EXEC DBMS_DST.BEGIN_PREPARE(new_version => 42);

-- Verificar impacto
SELECT * FROM DBA_TABLES_WITH_DATA;

-- Aplicar
EXEC DBMS_DST.BEGIN_UPGRADE(new_version => 42);

-- Finalizar
EXEC DBMS_DST.END_UPGRADE;

-- Verificar
SELECT * FROM v$timezone_file;
```

### Procedimento 6: Bundle Patches e One-off Patches

```bash
# Aplicar múltiplos patches
cd /stage

# Descompactar todos os patches no mesmo diretório
unzip p12345678_190000_Linux-x86-64.zip
unzip p87654321_190000_Linux-x86-64.zip

# Parar banco
sqlplus / as sysdba << EOF
SHUTDOWN IMMEDIATE;
EXIT;
EOF

lsnrctl stop

# Aplicar patches em sequência
cd 12345678
$ORACLE_HOME/OPatch/opatch apply

cd ../87654321
$ORACLE_HOME/OPatch/opatch apply

# Iniciar e executar datapatch
sqlplus / as sysdba << EOF
STARTUP;
EXIT;
EOF

$ORACLE_HOME/OPatch/datapatch -verbose

lsnrctl start
```

## 📊 Checklist de Patching/Upgrade

- [ ] Backup completo realizado e validado
- [ ] Janela de manutenção agendada
- [ ] Patches/software baixados e validados (checksum)
- [ ] Pre-upgrade check executado
- [ ] Equipe notificada
- [ ] Rollback plan definido
- [ ] OPatch atualizado
- [ ] Espaço em disco verificado
- [ ] Aplicação para de acessar banco
- [ ] Patch aplicado
- [ ] Datapatch executado
- [ ] Validação pós-patch realizada
- [ ] Objetos inválidos recompilados
- [ ] Aplicação testa banco
- [ ] Documentação atualizada

## 🚨 Troubleshooting

### Patch Apply Falha

```bash
# Verificar log
tail -f $ORACLE_BASE/cfgtoollogs/opatch/opatch*.log

# Conflitos de patch
$ORACLE_HOME/OPatch/opatch lsinventory -detail

# Rollback e tentar novamente
$ORACLE_HOME/OPatch/opatch rollback -id <patch_id>
```

### Datapatch Falha

```sql
-- Ver erros
SELECT * FROM dba_registry_sqlpatch WHERE status != 'SUCCESS';

-- Reexecutar
$ORACLE_HOME/OPatch/datapatch -verbose -force
```

### Componentes INVALID após Upgrade

```sql
-- Recompilar
@?/rdbms/admin/utlrp.sql

-- Verificar objetos ainda inválidos
SELECT owner, object_type, object_name 
FROM dba_objects 
WHERE status = 'INVALID'
ORDER BY owner, object_type;
```

## 📞 Contatos

| Nível | Contato | Email |
|-------|---------|-------|
| N1 | Equipe DBA | dba-support@empresa.com |
| N2 | DBA Sênior | dba-senior@empresa.com |
| N3 | Arquiteto | oracle-architect@empresa.com |

## 📚 Referências

- MOS Note: Database Patching Guide (ID 2337415.1)
- MOS Note: Database Upgrade Guide (ID 2369376.1)
- Oracle Database Upgrade Guide

## 📅 Histórico

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 19/12/2025 | Versão inicial |
