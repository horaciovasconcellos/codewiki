# Runbook Oracle 03 - Instalação e Configuração

## 📋 Informações Gerais

| Item | Descrição |
|------|-----------|
| **Sistema** | Oracle Database |
| **Versões Suportadas** | 19c, 21c, 23c |
| **Tipo** | Instalação e Configuração |
| **Criticidade** | Alta |
| **Tempo Estimado** | 2-4 horas |
| **Última Atualização** | 19/12/2025 |

## 🎯 Objetivo

Procedimentos para instalação e configuração inicial do Oracle Database em ambientes Linux, incluindo preparação do sistema operacional, instalação do software e criação do banco de dados.

## 📚 Pré-requisitos

### Hardware Mínimo

- **CPU**: 2 cores (4+ recomendado)
- **RAM**: 8 GB (16+ GB recomendado)
- **Swap**: 16 GB ou 2x RAM
- **Disco**: 50 GB mínimo para software e dados

### Software

- [ ] Sistema Operacional: Oracle Linux 8/9, RHEL 8/9, ou equivalente
- [ ] Usuário root ou sudo
- [ ] Acesso à internet ou repositório local
- [ ] Download do Oracle Database software

## 🔧 Procedimentos

### Procedimento 1: Preparação do Sistema Operacional

#### 1.1. Configurar Hostname e Hosts

```bash
# Definir hostname
hostnamectl set-hostname oracledb.empresa.local

# Configurar /etc/hosts
cat << EOF >> /etc/hosts
192.168.1.100   oracledb.empresa.local oracledb
EOF
```

#### 1.2. Desabilitar SELinux e Firewall (ou configurar)

```bash
# Desabilitar SELinux
sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
setenforce 0

# Firewall (abrir portas ou desabilitar)
firewall-cmd --permanent --add-port=1521/tcp
firewall-cmd --permanent --add-port=5500/tcp
firewall-cmd --reload

# Ou desabilitar (não recomendado para produção)
systemctl stop firewalld
systemctl disable firewalld
```

#### 1.3. Instalar Pacotes Necessários

```bash
# Para Oracle Linux 8/9
dnf install -y oracle-database-preinstall-19c

# Ou manualmente
dnf install -y \
    bc binutils compat-libcap1 compat-libstdc++-33 elfutils-libelf \
    elfutils-libelf-devel fontconfig-devel glibc glibc-devel ksh \
    libaio libaio-devel libX11 libXau libXi libXtst libXrender \
    libXrender-devel libgcc librdmacm-devel libstdc++ libstdc++-devel \
    libxcb make net-tools nfs-utils python3 python3-configshell \
    python3-rtslib python3-six smartmontools sysstat targetcli \
    unixODBC libnsl libnsl2
```

#### 1.4. Criar Grupos e Usuário Oracle

```bash
# Criar grupos
groupadd -g 54321 oinstall
groupadd -g 54322 dba
groupadd -g 54323 oper
groupadd -g 54324 backupdba
groupadd -g 54325 dgdba
groupadd -g 54326 kmdba
groupadd -g 54327 racdba

# Criar usuário oracle
useradd -u 54321 -g oinstall -G dba,oper,backupdba,dgdba,kmdba,racdba oracle

# Definir senha
echo "oracle:Oracle123!" | chpasswd
```

#### 1.5. Configurar Limites do Kernel

```bash
# Adicionar ao /etc/security/limits.conf
cat << EOF >> /etc/security/limits.conf
oracle   soft   nofile    1024
oracle   hard   nofile    65536
oracle   soft   nproc    16384
oracle   hard   nproc    16384
oracle   soft   stack    10240
oracle   hard   stack    32768
oracle   hard   memlock    134217728
oracle   soft   memlock    134217728
EOF

# Configurar parâmetros do kernel
cat << EOF >> /etc/sysctl.conf
fs.file-max = 6815744
kernel.sem = 250 32000 100 128
kernel.shmmni = 4096
kernel.shmall = 1073741824
kernel.shmmax = 4398046511104
kernel.panic_on_oops = 1
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576
net.ipv4.conf.all.rp_filter = 2
net.ipv4.conf.default.rp_filter = 2
fs.aio-max-nr = 1048576
net.ipv4.ip_local_port_range = 9000 65500
EOF

# Aplicar parâmetros
sysctl -p
```

#### 1.6. Criar Estrutura de Diretórios

```bash
# Criar diretórios base
mkdir -p /u01/app/oracle/product/19.3.0/dbhome_1
mkdir -p /u01/app/oraInventory
mkdir -p /u02/oradata
mkdir -p /u03/fra
mkdir -p /u04/backup

# Definir permissões
chown -R oracle:oinstall /u01 /u02 /u03 /u04
chmod -R 775 /u01 /u02 /u03 /u04
```

#### 1.7. Configurar Ambiente do Usuário Oracle

```bash
# Criar .bash_profile
cat << 'EOF' > /home/oracle/.bash_profile
# Oracle Settings
export TMP=/tmp
export TMPDIR=$TMP
export ORACLE_HOSTNAME=oracledb.empresa.local
export ORACLE_UNQNAME=ORCL
export ORACLE_BASE=/u01/app/oracle
export ORACLE_HOME=$ORACLE_BASE/product/19.3.0/dbhome_1
export ORA_INVENTORY=/u01/app/oraInventory
export ORACLE_SID=ORCL
export PDB_NAME=ORCLPDB
export DATA_DIR=/u02/oradata
export PATH=/usr/sbin:/usr/local/bin:$PATH
export PATH=$ORACLE_HOME/bin:$PATH
export LD_LIBRARY_PATH=$ORACLE_HOME/lib:/lib:/usr/lib
export CLASSPATH=$ORACLE_HOME/jlib:$ORACLE_HOME/rdbms/jlib
alias sqlplus='rlwrap sqlplus'
alias rman='rlwrap rman'
EOF

# Aplicar
chown oracle:oinstall /home/oracle/.bash_profile
```

### Procedimento 2: Instalação do Software Oracle

#### 2.1. Descompactar Software

```bash
# Como usuário oracle
su - oracle

# Descompactar (exemplo com Oracle 19c)
cd $ORACLE_HOME
unzip -q /stage/LINUX.X64_193000_db_home.zip
```

#### 2.2. Instalação Silent Mode

```bash
# Criar response file
cat << EOF > /tmp/db_install.rsp
oracle.install.option=INSTALL_DB_SWONLY
UNIX_GROUP_NAME=oinstall
INVENTORY_LOCATION=/u01/app/oraInventory
ORACLE_HOME=/u01/app/oracle/product/19.3.0/dbhome_1
ORACLE_BASE=/u01/app/oracle
oracle.install.db.InstallEdition=EE
oracle.install.db.OSDBA_GROUP=dba
oracle.install.db.OSOPER_GROUP=oper
oracle.install.db.OSBACKUPDBA_GROUP=backupdba
oracle.install.db.OSDGDBA_GROUP=dgdba
oracle.install.db.OSKMDBA_GROUP=kmdba
oracle.install.db.OSRACDBA_GROUP=racdba
SECURITY_UPDATES_VIA_MYORACLESUPPORT=false
DECLINE_SECURITY_UPDATES=true
EOF

# Executar instalação
cd $ORACLE_HOME
./runInstaller -silent -responseFile /tmp/db_install.rsp -waitforcompletion

# Como root, executar scripts pós-instalação
# /u01/app/oraInventory/orainstRoot.sh
# /u01/app/oracle/product/19.3.0/dbhome_1/root.sh
```

#### 2.3. Instalação com GUI (alternativa)

```bash
# Configurar DISPLAY
export DISPLAY=:0.0

# Executar installer
cd $ORACLE_HOME
./runInstaller

# Seguir wizard:
# 1. Set Up Software Only
# 2. Single instance database
# 3. Enterprise Edition
# 4. Especificar diretórios
# 5. Criar grupos
# 6. Executar scripts de root quando solicitado
```

### Procedimento 3: Criar Banco de Dados

#### 3.1. Usando DBCA (Database Configuration Assistant)

```bash
# Modo GUI
dbca

# Modo Silent
dbca -silent -createDatabase \
  -templateName General_Purpose.dbc \
  -gdbname ORCL \
  -sid ORCL \
  -responseFile NO_VALUE \
  -characterSet AL32UTF8 \
  -sysPassword Oracle123! \
  -systemPassword Oracle123! \
  -createAsContainerDatabase true \
  -numberOfPDBs 1 \
  -pdbName ORCLPDB \
  -pdbAdminPassword Oracle123! \
  -datafileDestination /u02/oradata \
  -recoveryAreaDestination /u03/fra \
  -storageType FS \
  -memoryPercentage 40 \
  -emConfiguration NONE \
  -sampleSchema false
```

#### 3.2. Criação Manual do Banco

```sql
-- 1. Criar PFILE
cat << 'EOF' > $ORACLE_HOME/dbs/initORCL.ora
db_name=ORCL
db_block_size=8192
memory_target=4G
processes=300
db_recovery_file_dest=/u03/fra
db_recovery_file_dest_size=20G
control_files=(/u02/oradata/ORCL/control01.ctl,/u03/fra/ORCL/control02.ctl)
undo_tablespace=UNDOTBS1
compatible=19.0.0
enable_pluggable_database=true
EOF

-- 2. Criar diretórios necessários
mkdir -p /u02/oradata/ORCL
mkdir -p /u03/fra/ORCL

-- 3. Criar scripts SQL
cat << 'EOF' > /tmp/create_database.sql
CREATE DATABASE ORCL
  USER SYS IDENTIFIED BY Oracle123!
  USER SYSTEM IDENTIFIED BY Oracle123!
  LOGFILE GROUP 1 ('/u02/oradata/ORCL/redo01.log') SIZE 100M,
          GROUP 2 ('/u02/oradata/ORCL/redo02.log') SIZE 100M,
          GROUP 3 ('/u02/oradata/ORCL/redo03.log') SIZE 100M
  MAXLOGFILES 5
  MAXLOGMEMBERS 5
  MAXLOGHISTORY 1
  MAXDATAFILES 100
  CHARACTER SET AL32UTF8
  NATIONAL CHARACTER SET AL16UTF16
  EXTENT MANAGEMENT LOCAL
  DATAFILE '/u02/oradata/ORCL/system01.dbf' SIZE 700M REUSE AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED
  SYSAUX DATAFILE '/u02/oradata/ORCL/sysaux01.dbf' SIZE 550M REUSE AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED
  DEFAULT TABLESPACE users
    DATAFILE '/u02/oradata/ORCL/users01.dbf' SIZE 500M REUSE AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED
  DEFAULT TEMPORARY TABLESPACE temp
    TEMPFILE '/u02/oradata/ORCL/temp01.dbf' SIZE 200M REUSE AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED
  UNDO TABLESPACE undotbs1
    DATAFILE '/u02/oradata/ORCL/undotbs01.dbf' SIZE 200M REUSE AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED
  ENABLE PLUGGABLE DATABASE;
EOF

-- 4. Executar criação
sqlplus / as sysdba << EOF
STARTUP NOMOUNT PFILE='$ORACLE_HOME/dbs/initORCL.ora';
@/tmp/create_database.sql
@?/rdbms/admin/catalog.sql
@?/rdbms/admin/catproc.sql
@?/sqlplus/admin/pupbld.sql
EXIT;
EOF
```

### Procedimento 4: Configuração Pós-Instalação

#### 4.1. Criar Pluggable Database (PDB)

```sql
sqlplus / as sysdba

-- Criar PDB
CREATE PLUGGABLE DATABASE orclpdb
  ADMIN USER pdbadmin IDENTIFIED BY Oracle123!
  FILE_NAME_CONVERT = ('/u02/oradata/ORCL/pdbseed/', '/u02/oradata/ORCL/orclpdb/');

-- Abrir PDB
ALTER PLUGGABLE DATABASE orclpdb OPEN;

-- Configurar para abrir automaticamente
ALTER PLUGGABLE DATABASE orclpdb SAVE STATE;

-- Verificar
SHOW PDBS;
```

#### 4.2. Configurar Listener

```bash
# Criar listener.ora
cat << EOF > $ORACLE_HOME/network/admin/listener.ora
LISTENER =
  (DESCRIPTION_LIST =
    (DESCRIPTION =
      (ADDRESS = (PROTOCOL = TCP)(HOST = oracledb.empresa.local)(PORT = 1521))
      (ADDRESS = (PROTOCOL = IPC)(KEY = EXTPROC1521))
    )
  )

SID_LIST_LISTENER =
  (SID_LIST =
    (SID_DESC =
      (GLOBAL_DBNAME = ORCL)
      (ORACLE_HOME = /u01/app/oracle/product/19.3.0/dbhome_1)
      (SID_NAME = ORCL)
    )
  )

ADR_BASE_LISTENER = /u01/app/oracle
EOF

# Iniciar listener
lsnrctl start

# Verificar status
lsnrctl status

# Configurar para iniciar com o sistema
cat << EOF > /etc/systemd/system/oracle-listener.service
[Unit]
Description=Oracle Net Listener
After=network.target

[Service]
Type=forking
User=oracle
Group=oinstall
ExecStart=/u01/app/oracle/product/19.3.0/dbhome_1/bin/lsnrctl start
ExecStop=/u01/app/oracle/product/19.3.0/dbhome_1/bin/lsnrctl stop
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable oracle-listener
```

#### 4.3. Configurar TNS Names

```bash
# Criar tnsnames.ora
cat << EOF > $ORACLE_HOME/network/admin/tnsnames.ora
ORCL =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracledb.empresa.local)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = ORCL)
    )
  )

ORCLPDB =
  (DESCRIPTION =
    (ADDRESS = (PROTOCOL = TCP)(HOST = oracledb.empresa.local)(PORT = 1521))
    (CONNECT_DATA =
      (SERVER = DEDICATED)
      (SERVICE_NAME = orclpdb)
    )
  )
EOF
```

#### 4.4. Habilitar Archive Log Mode

```sql
sqlplus / as sysdba

SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;

-- Verificar
ARCHIVE LOG LIST;
```

#### 4.5. Configurar Automatic Startup

```bash
# Configurar oratab
echo "ORCL:/u01/app/oracle/product/19.3.0/dbhome_1:Y" >> /etc/oratab

# Criar script de inicialização
cat << 'EOF' > /etc/init.d/dbora
#!/bin/bash
# chkconfig: 345 99 10
# description: Oracle auto start-stop script

# Source function library
. /etc/rc.d/init.d/functions

ORACLE_HOME=/u01/app/oracle/product/19.3.0/dbhome_1
ORACLE_USER=oracle

case "$1" in
  start)
    echo -n "Starting Oracle: "
    su - $ORACLE_USER -c "$ORACLE_HOME/bin/dbstart $ORACLE_HOME"
    touch /var/lock/subsys/dbora
    echo "OK"
    ;;
  stop)
    echo -n "Shutting down Oracle: "
    su - $ORACLE_USER -c "$ORACLE_HOME/bin/dbshut $ORACLE_HOME"
    rm -f /var/lock/subsys/dbora
    echo "OK"
    ;;
  restart)
    $0 stop
    $0 start
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
esac

exit 0
EOF

chmod 750 /etc/init.d/dbora
chkconfig --add dbora
chkconfig dbora on
```

#### 4.6. Configurar Backup RMAN

```bash
rman target /

-- Configuração básica
CONFIGURE RETENTION POLICY TO RECOVERY WINDOW OF 7 DAYS;
CONFIGURE CONTROLFILE AUTOBACKUP ON;
CONFIGURE CONTROLFILE AUTOBACKUP FORMAT FOR DEVICE TYPE DISK TO '/u04/backup/cf_%F';
CONFIGURE DEVICE TYPE DISK PARALLELISM 2;
CONFIGURE BACKUP OPTIMIZATION ON;
CONFIGURE DEFAULT DEVICE TYPE TO DISK;
CONFIGURE COMPRESSION ALGORITHM 'MEDIUM';
```

## 📊 Verificação Pós-Instalação

```sql
-- Verificar instalação
sqlplus / as sysdba

SELECT instance_name, status, version FROM v$instance;
SELECT name, open_mode, log_mode FROM v$database;

-- Verificar componentes
SELECT comp_name, status, version FROM dba_registry ORDER BY comp_name;

-- Verificar tablespaces
SELECT tablespace_name, status FROM dba_tablespaces;

-- Verificar PDBs
SHOW PDBS;
```

## 🚨 Troubleshooting

### Problema: ORA-01034: ORACLE not available

**Solução:**
```bash
# Verificar variáveis de ambiente
echo $ORACLE_SID
echo $ORACLE_HOME

# Iniciar banco
sqlplus / as sysdba
STARTUP;
```

### Problema: Listener não inicia

**Solução:**
```bash
# Verificar se porta 1521 está em uso
netstat -tuln | grep 1521

# Verificar logs
tail -f $ORACLE_BASE/diag/tnslsnr/$(hostname)/listener/trace/listener.log

# Recriar listener
lsnrctl stop
rm $ORACLE_HOME/network/admin/listener.ora
netca  # Reconfigurar via GUI
```

## 📞 Contatos

| Nível | Contato | Email |
|-------|---------|-------|
| N1 | Equipe DBA | dba-support@empresa.com |
| N2 | DBA Sênior | dba-senior@empresa.com |

## 📅 Histórico de Revisões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 19/12/2025 | Versão inicial |
