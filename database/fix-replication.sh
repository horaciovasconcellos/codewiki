#!/bin/bash
# Script para corrigir problemas de replicação MySQL
# Corrige erros de schema e reinicia a replicação

set -e

echo "🔧 CORREÇÃO DE REPLICAÇÃO MYSQL"
echo "================================"
echo ""

# Verificar se os containers estão rodando
echo "📋 Verificando containers..."
if ! docker ps | grep -q mysql-master; then
  echo "❌ Container mysql-master não está rodando"
  exit 1
fi

if ! docker ps | grep -q mysql-slave; then
  echo "❌ Container mysql-slave não está rodando"
  exit 1
fi

echo "✅ Containers estão rodando"
echo ""

# Passo 1: Parar a replicação no slave
echo "⏸️  Passo 1: Parando replicação no slave..."
docker exec mysql-slave mysql -uroot -prootpass123 -e "STOP SLAVE;" 2>/dev/null || true
echo "✅ Replicação parada"
echo ""

# Passo 2: Corrigir schema no SLAVE (garantir que está igual ao master)
echo "🔧 Passo 2: Corrigindo schema no slave..."

# Corrigir ENUMs no slave para corresponder ao master
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db << 'EOF' 2>/dev/null
-- Corrigir lgpd_registros
ALTER TABLE lgpd_registros 
  MODIFY COLUMN hierarquia_sensibilidade ENUM('Dados Publicos','Dados Corporativos','Dados Pessoais','Dados Identificadores','Dados Sensíveis') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tipo_dados ENUM('Identificadores Direto','Identificadores Indireto','Sensível','Financeiro','Localização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE lgpd_registros 
  MODIFY COLUMN tecnica_anonimizacao ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Corrigir lgpd_campos (adicionar base_legal se não existir)
ALTER TABLE lgpd_campos 
  ADD COLUMN IF NOT EXISTS base_legal VARCHAR(500) AFTER descricao;

-- Corrigir matriz ENUMs
ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_vendas ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_marketing ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_financeiro ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_rh ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_logistica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_assist_tecnica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';

ALTER TABLE lgpd_campos 
  MODIFY COLUMN matriz_analytics ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização';
EOF

echo "✅ Schema do slave corrigido"
echo ""

# Passo 3: Limpar tabela de teste com problemas
echo "🗑️  Passo 3: Limpando tabela replication_test..."
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e "DROP TABLE IF EXISTS replication_test;" 2>/dev/null || true
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "DROP TABLE IF EXISTS replication_test;" 2>/dev/null || true
echo "✅ Tabela de teste removida"
echo ""

# Passo 4: Resetar posição da replicação
echo "🔄 Passo 4: Resetando posição da replicação..."

# Obter posição atual do master
MASTER_STATUS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW MASTER STATUS\G" 2>/dev/null)
BINLOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
BINLOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "   Master Binlog: $BINLOG_FILE"
echo "   Master Position: $BINLOG_POS"

# Reconfigurar slave
docker exec mysql-slave mysql -uroot -prootpass123 << EOF 2>/dev/null
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

echo "✅ Replicação reconfigurada"
echo ""

# Passo 5: Aguardar e verificar status
echo "⏳ Passo 5: Aguardando sincronização..."
sleep 5

SLAVE_STATUS=$(docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" 2>/dev/null)
IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | awk '{print $2}')
SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | awk '{print $2}')
LAST_ERROR=$(echo "$SLAVE_STATUS" | grep "Last_SQL_Error:" | cut -d: -f2- | xargs)

echo ""
echo "📊 STATUS DA REPLICAÇÃO"
echo "======================="
echo "Slave_IO_Running:  $IO_RUNNING"
echo "Slave_SQL_Running: $SQL_RUNNING"

if [ -n "$LAST_ERROR" ] && [ "$LAST_ERROR" != "0" ]; then
  echo "Last Error: $LAST_ERROR"
fi

echo ""

if [ "$IO_RUNNING" = "Yes" ] && [ "$SQL_RUNNING" = "Yes" ]; then
  echo "✅ SUCESSO! Replicação restaurada e funcionando"
  echo ""
  echo "🔍 Para monitorar a replicação:"
  echo "   docker exec mysql-slave mysql -uroot -prootpass123 -e \"SHOW SLAVE STATUS\\G\""
  exit 0
else
  echo "❌ ERRO: Replicação ainda com problemas"
  echo ""
  echo "📋 Verifique os logs:"
  echo "   docker logs mysql-slave --tail 100"
  echo ""
  echo "🔍 Status completo:"
  docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" 2>/dev/null | grep -E "Running|Error|Behind"
  exit 1
fi
