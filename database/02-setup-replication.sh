#!/bin/bash
set -e

echo "==========================================="
echo "Configurando Replicação MySQL Master-Slave"
echo "==========================================="

# Aguardar MySQL Master estar pronto
echo "Aguardando MySQL Master iniciar..."
until mysql -h mysql-master -uroot -prootpass123 -e "SELECT 1" >/dev/null 2>&1; do
    echo "  Master ainda não está pronto..."
    sleep 2
done
echo "✓ MySQL Master está pronto!"

# Aguardar MySQL Slave estar pronto
echo "Aguardando MySQL Slave iniciar..."
until mysql -h mysql-slave -uroot -prootpass123 -e "SELECT 1" >/dev/null 2>&1; do
    echo "  Slave ainda não está pronto..."
    sleep 2
done
echo "✓ MySQL Slave está pronto!"

# Criar banco de dados no Slave (se não existir)
echo "Criando banco de dados no Slave..."
mysql -h mysql-slave -uroot -prootpass123 -e "CREATE DATABASE IF NOT EXISTS auditoria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

# Obter posição atual do binlog do Master
echo "Obtendo posição do binlog do Master..."
MASTER_STATUS=$(mysql -h mysql-master -uroot -prootpass123 -e "SHOW MASTER STATUS\G" 2>/dev/null)
MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "  Master Log File: $MASTER_LOG_FILE"
echo "  Master Log Position: $MASTER_LOG_POS"

if [ -z "$MASTER_LOG_FILE" ] || [ -z "$MASTER_LOG_POS" ]; then
    echo "✗ Erro ao obter posição do binlog"
    exit 1
fi

# Configurar replicação no Slave
echo "Configurando replicação no Slave..."
mysql -h mysql-slave -uroot -prootpass123 <<-EOSQL
    STOP SLAVE;
    CHANGE MASTER TO
        MASTER_HOST='mysql-master',
        MASTER_USER='replicator',
        MASTER_PASSWORD='replicator123',
        MASTER_LOG_FILE='$MASTER_LOG_FILE',
        MASTER_LOG_POS=$MASTER_LOG_POS;
    START SLAVE;
EOSQL

# Aguardar alguns segundos para a replicação iniciar
echo "Aguardando replicação iniciar..."
sleep 5

# Verificar status da replicação
echo "Verificando status da replicação..."
SLAVE_STATUS=$(mysql -h mysql-slave -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" 2>/dev/null)
SLAVE_IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
SLAVE_SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')

echo "  Slave_IO_Running: $SLAVE_IO_RUNNING"
echo "  Slave_SQL_Running: $SLAVE_SQL_RUNNING"

if [ "$SLAVE_IO_RUNNING" = "Yes" ] && [ "$SLAVE_SQL_RUNNING" = "Yes" ]; then
    echo "✓ Replicação configurada com sucesso!"
else
    echo "⚠ Replicação pode não estar funcionando corretamente"
    echo "Status completo:"
    echo "$SLAVE_STATUS"
    exit 1
fi

# Verificar dados replicados
echo "Verificando dados replicados..."
MASTER_COUNT=$(mysql -h mysql-master -uroot -prootpass123 auditoria_db -sN -e "SELECT COUNT(*) FROM tipos_afastamento;" 2>/dev/null || echo "0")
SLAVE_COUNT=$(mysql -h mysql-slave -uroot -prootpass123 auditoria_db -sN -e "SELECT COUNT(*) FROM tipos_afastamento;" 2>/dev/null || echo "0")

echo "  Tipos de Afastamento no Master: $MASTER_COUNT"
echo "  Tipos de Afastamento no Slave: $SLAVE_COUNT"

if [ "$MASTER_COUNT" = "$SLAVE_COUNT" ] && [ "$MASTER_COUNT" -gt "0" ]; then
    echo "✓ Dados sincronizados com sucesso!"
else
    echo "⚠ Aguardando sincronização de dados..."
fi

echo "==========================================="
echo "Configuração concluída!"
echo "==========================================="
