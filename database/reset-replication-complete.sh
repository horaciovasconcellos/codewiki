#!/bin/bash
# Reset completo da replicação MySQL com reconstrução do slave

set -e

echo "🔄 RESET COMPLETO DA REPLICAÇÃO MYSQL"
echo "======================================"
echo ""

# Passo 1: Parar replicação
echo "⏸️  Passo 1: Parando replicação..."
docker exec mysql-slave mysql -uroot -prootpass123 << 'EOF' 2>/dev/null
STOP SLAVE;
RESET SLAVE ALL;
EOF
echo "✅ Replicação parada e resetada"
echo ""

# Passo 2: Limpar dados problemáticos no slave
echo "🗑️  Passo 2: Limpando dados do slave..."
docker exec mysql-slave mysql -uroot -prootpass123 << 'EOF' 2>/dev/null
-- Dropar tabelas LGPD para recriar com schema correto
DROP TABLE IF EXISTS auditoria_db.lgpd_campos;
DROP TABLE IF EXISTS auditoria_db.lgpd_registros;
DROP TABLE IF EXISTS auditoria_db.replication_test;
EOF
echo "✅ Tabelas problemáticas removidas do slave"
echo ""

# Passo 3: Recriar tabelas no slave com schema correto do master
echo "🔧 Passo 3: Recriando tabelas no slave..."
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SHOW CREATE TABLE lgpd_registros\G" 2>/dev/null | grep "CREATE TABLE" -A 50 | sed '1d' > /tmp/create_lgpd_registros.sql
docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SHOW CREATE TABLE lgpd_campos\G" 2>/dev/null | grep "CREATE TABLE" -A 50 | sed '1d' > /tmp/create_lgpd_campos.sql

# Recriar no slave
docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db << 'EOF' 2>/dev/null
CREATE TABLE IF NOT EXISTS lgpd_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_registro VARCHAR(200) NOT NULL UNIQUE,
  hierarquia_sensibilidade ENUM('Dados Publicos','Dados Corporativos','Dados Pessoais','Dados Identificadores','Dados Sensíveis') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tipo_dados ENUM('Identificadores Direto','Identificadores Indireto','Sensível','Financeiro','Localização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  tecnica_anonimizacao ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sem Anonimização',
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hierarquia (hierarquia_sensibilidade),
  INDEX idx_tipo (tipo_dados)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lgpd_campos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lgpd_id INT NOT NULL,
  nome_campo VARCHAR(100) NOT NULL,
  descricao TEXT,
  base_legal VARCHAR(500),
  matriz_vendas ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_marketing ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_financeiro ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_rh ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_logistica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_assist_tecnica ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  matriz_analytics ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Sem Anonimização',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lgpd_id) REFERENCES lgpd_registros(id) ON DELETE CASCADE,
  INDEX idx_lgpd_id (lgpd_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
echo "✅ Tabelas recriadas no slave"
echo ""

# Passo 4: Copiar dados atuais do master para o slave
echo "📥 Passo 4: Sincronizando dados do master para o slave..."

# Verificar se há dados para copiar
REGISTROS_COUNT=$(docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM lgpd_registros;" 2>/dev/null | tail -1)
CAMPOS_COUNT=$(docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e "SELECT COUNT(*) FROM lgpd_campos;" 2>/dev/null | tail -1)

echo "   Registros no master: $REGISTROS_COUNT"
echo "   Campos no master: $CAMPOS_COUNT"

if [ "$REGISTROS_COUNT" -gt "0" ] || [ "$CAMPOS_COUNT" -gt "0" ]; then
  echo "   Copiando dados..."
  
  # Dump dos dados
  docker exec mysql-master mysqldump -uroot -prootpass123 auditoria_db lgpd_registros lgpd_campos --no-create-info 2>/dev/null > /tmp/lgpd_data.sql
  
  # Importar no slave
  docker cp /tmp/lgpd_data.sql mysql-slave:/tmp/
  docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db < /tmp/lgpd_data.sql 2>/dev/null
  
  echo "✅ Dados copiados"
else
  echo "   Nenhum dado para copiar"
fi
echo ""

# Passo 5: Configurar replicação do ponto atual
echo "🔄 Passo 5: Configurando replicação..."

# Obter posição atual do master (após todas as operações)
MASTER_STATUS=$(docker exec mysql-master mysql -uroot -prootpass123 -e "SHOW MASTER STATUS\G" 2>/dev/null)
BINLOG_FILE=$(echo "$MASTER_STATUS" | grep "File:" | awk '{print $2}')
BINLOG_POS=$(echo "$MASTER_STATUS" | grep "Position:" | awk '{print $2}')

echo "   Master Binlog: $BINLOG_FILE"
echo "   Master Position: $BINLOG_POS"

docker exec mysql-slave mysql -uroot -prootpass123 << EOF 2>/dev/null
CHANGE MASTER TO
  MASTER_HOST='mysql-master',
  MASTER_USER='replication_user',
  MASTER_PASSWORD='replication_pass123',
  MASTER_LOG_FILE='$BINLOG_FILE',
  MASTER_LOG_POS=$BINLOG_POS;
START SLAVE;
EOF

echo "✅ Replicação iniciada"
echo ""

# Passo 6: Verificar status
echo "⏳ Aguardando sincronização..."
sleep 5

SLAVE_STATUS=$(docker exec mysql-slave mysql -uroot -prootpass123 -e "SHOW SLAVE STATUS\G" 2>/dev/null)
IO_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_IO_Running:" | head -1 | awk '{print $2}')
SQL_RUNNING=$(echo "$SLAVE_STATUS" | grep "Slave_SQL_Running:" | head -1 | awk '{print $2}')
LAST_ERROR=$(echo "$SLAVE_STATUS" | grep "Last_SQL_Error:" | cut -d: -f2- | xargs)
SECONDS_BEHIND=$(echo "$SLAVE_STATUS" | grep "Seconds_Behind_Master:" | awk '{print $2}')

echo ""
echo "📊 STATUS FINAL DA REPLICAÇÃO"
echo "=============================="
echo "Slave_IO_Running:     $IO_RUNNING"
echo "Slave_SQL_Running:    $SQL_RUNNING"
echo "Seconds Behind Master: $SECONDS_BEHIND"
echo ""

if [ -n "$LAST_ERROR" ] && [ "$LAST_ERROR" != "" ]; then
  echo "Last Error: $LAST_ERROR"
  echo ""
fi

if [ "$IO_RUNNING" = "Yes" ] && [ "$SQL_RUNNING" = "Yes" ]; then
  echo "✅ SUCESSO! Replicação restaurada e funcionando"
  echo ""
  echo "🧪 Para testar, execute no master:"
  echo "   docker exec mysql-master mysql -uroot -prootpass123 auditoria_db -e \"INSERT INTO lgpd_registros (nome_registro, hierarquia_sensibilidade, tipo_dados, descricao) VALUES ('TESTE-REPL', 'Dados Publicos', 'Identificadores Direto', 'Teste de replicação');\""
  echo ""
  echo "   E verifique no slave:"
  echo "   docker exec mysql-slave mysql -uroot -prootpass123 auditoria_db -e \"SELECT * FROM lgpd_registros WHERE nome_registro='TESTE-REPL';\""
  exit 0
else
  echo "❌ ERRO: Replicação ainda com problemas"
  echo ""
  echo "📋 Logs completos:"
  docker logs mysql-slave --tail 50 | grep -E "error|Error|ERROR"
  exit 1
fi
