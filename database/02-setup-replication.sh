#!/bin/bash
# Script de configuração de replicação MySQL Master-Slave
# Este script é executado após os containers MySQL estarem prontos

set -e

echo "🔄 Iniciando configuração de replicação MySQL..."

# Aguardar MySQL Master estar pronto
echo "⏳ Aguardando MySQL Master..."
until mysql -h mysql-master -u root -prootpass123 -e "SELECT 1" &>/dev/null; do
  echo "   Aguardando MySQL Master ficar disponível..."
  sleep 2
done
echo "✅ MySQL Master está pronto"

# Aguardar MySQL Slave estar pronto
echo "⏳ Aguardando MySQL Slave..."
until mysql -h mysql-slave -u root -prootpass123 -e "SELECT 1" &>/dev/null; do
  echo "   Aguardando MySQL Slave ficar disponível..."
  sleep 2
done
echo "✅ MySQL Slave está pronto"

# Criar usuário de replicação no Master
echo "👤 Criando usuário de replicação no Master..."
mysql -h mysql-master -u root -prootpass123 << EOF
CREATE USER IF NOT EXISTS 'replication_user'@'%' IDENTIFIED WITH mysql_native_password BY 'replication_pass123';
GRANT REPLICATION SLAVE ON *.* TO 'replication_user'@'%';
FLUSH PRIVILEGES;
EOF
echo "✅ Usuário de replicação criado"

# Obter informações do binlog do Master
echo "📋 Obtendo informações do binlog do Master..."
MASTER_STATUS=$(mysql -h mysql-master -u root -prootpass123 -e "SHOW MASTER STATUS\G")
BINLOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
BINLOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "   Binlog File: $BINLOG_FILE"
echo "   Binlog Position: $BINLOG_POS"

# Configurar Slave
echo "🔧 Configurando Slave..."
mysql -h mysql-slave -u root -prootpass123 << EOF
STOP SLAVE;
RESET SLAVE ALL;
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_pass123',
  MASTER_LOG_FILE='$BINLOG_FILE',
  MASTER_LOG_POS=$BINLOG_POS;
START SLAVE;
EOF
echo "✅ Slave configurado"

# Verificar status da replicação
echo "🔍 Verificando status da replicação..."
sleep 3
SLAVE_STATUS=$(mysql -h mysql-slave -u root -prootpass123 -e "SHOW SLAVE STATUS\G")

IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')

echo "   Slave_IO_Running: $IO_RUNNING"
echo "   Slave_SQL_Running: $SQL_RUNNING"

if [ "$IO_RUNNING" = "Yes" ] && [ "$SQL_RUNNING" = "Yes" ]; then
  echo "✅ Replicação configurada com sucesso!"
  echo "🎉 Master-Slave replication está funcionando corretamente"
  exit 0
else
  echo "❌ Erro na configuração da replicação"
  echo "📝 Status detalhado:"
  echo "$SLAVE_STATUS"
  exit 1
fi
