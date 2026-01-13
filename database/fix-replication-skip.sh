#!/bin/bash
# Script para resolver replicação travada pulando eventos problemáticos

set -e

echo "🔧 RESOLVENDO REPLICAÇÃO TRAVADA"
echo "================================="
echo ""

# Parar replicação
echo "⏸️  Parando replicação..."
docker exec mysql-slave mysql -uroot -prootpass123 << 'EOF' 2>/dev/null
STOP SLAVE;
RESET SLAVE ALL;
EOF

# Limpar configuração de workers
docker exec mysql-slave mysql -uroot -prootpass123 << 'EOF' 2>/dev/null
SET GLOBAL slave_parallel_workers = 0;
SET GLOBAL slave_preserve_commit_order = OFF;
EOF
echo "✅ Replicação parada"
echo ""

# Obter nova posição APÓS o evento problemático
echo "📍 Obtendo nova posição do master..."
MASTER_STATUS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW MASTER STATUS\G" 2>/dev/null)
BINLOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
BINLOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "   Nova posição: $BINLOG_FILE @ $BINLOG_POS"
echo ""

# Reconfigurar replicação pulando tudo até a posição atual
echo "🔄 Reconfigurando replicação..."
docker exec mysql-slave mysql -uroot -prootpass123 << EOF 2>/dev/null
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_pass123',
  MASTER_LOG_FILE='$BINLOG_FILE',
  MASTER_LOG_POS=$BINLOG_POS;
START SLAVE;
EOF
echo "✅ Replicação reconfigurada"
echo ""

# Aguardar e verificar
echo "⏳ Aguardando sincronização..."
sleep 5

SLAVE_STATUS=$(docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" 2>/dev/null)
IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | head -1 | awk '{print $2}')
SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | head -1 | awk '{print $2}')
SECONDS_BEHIND=$(echo "$SLAVE_STATUS" | grep "Seconds_Behind_Master:" | awk '{print $2}')

echo ""
echo "📊 STATUS DA REPLICAÇÃO"
echo "======================="
echo "Slave_IO_Running:      $IO_RUNNING"
echo "Slave_SQL_Running:     $SQL_RUNNING"
echo "Seconds Behind Master: $SECONDS_BEHIND"
echo ""

if [ "$IO_RUNNING" = "Yes" ] && [ "$SQL_RUNNING" = "Yes" ]; then
  echo "✅ SUCESSO! Replicação funcionando normalmente"
  echo ""
  echo "🧪 Testando replicação..."
  
  # Criar registro de teste no master
  docker exec mysql-master mysql -uroot -prootpass123 auditoria_db << 'EOF' 2>/dev/null
DELETE FROM lgpd_registros WHERE nome_registro = 'TESTE-SYNC';
INSERT INTO lgpd_registros (nome_registro, hierarquia_sensibilidade, tipo_dados, descricao) 
VALUES ('TESTE-SYNC', 'Dados Publicos', 'Identificadores Direto', 'Teste de sincronização pós-correção');
EOF
  
  echo "   Registro de teste criado no master..."
  sleep 2
  
  # Verificar no slave
  TESTE=$(docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM lgpd_registros WHERE nome_registro='TESTE-SYNC';" 2>/dev/null | tail -1)
  
  if [ "$TESTE" = "1" ]; then
    echo "   ✅ Registro replicado com sucesso no slave!"
    echo ""
    echo "🎉 Replicação totalmente funcional!"
  else
    echo "   ⚠️  Registro não encontrado no slave (pode levar alguns segundos)"
  fi
  
  exit 0
else
  echo "❌ Ainda há problemas na replicação"
  echo ""
  LAST_ERROR=$(echo "$SLAVE_STATUS" | grep "Last_SQL_Error:" | cut -d: -f2-)
  if [ -n "$LAST_ERROR" ]; then
    echo "Erro: $LAST_ERROR"
  fi
  exit 1
fi
