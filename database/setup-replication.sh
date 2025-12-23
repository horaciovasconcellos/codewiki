#!/bin/bash

echo "Aguardando MySQL Master iniciar..."
sleep 20

echo "Obtendo posição do binlog do Master..."
MASTER_STATUS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW MASTER STATUS\G")
MASTER_LOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
MASTER_LOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "Master Log File: $MASTER_LOG_FILE"
echo "Master Log Position: $MASTER_LOG_POS"

echo "Configurando replicação no Slave..."
docker exec mysql-slave mysql -uroot -prootpass123 <<-EOSQL
    STOP SLAVE;
    CHANGE MASTER TO
        MASTER_HOST='mysql-master',
        MASTER_USER='replicator',
        MASTER_PASSWORD='replicator123',
        MASTER_LOG_FILE='$MASTER_LOG_FILE',
        MASTER_LOG_POS=$MASTER_LOG_POS;
    START SLAVE;
EOSQL

echo "Verificando status da replicação..."
docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G"

echo "Replicação configurada com sucesso!"
