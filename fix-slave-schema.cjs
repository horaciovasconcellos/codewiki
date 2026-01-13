#!/usr/bin/env node
const mysql = require('mysql2/promise');

async function fixSlaveSchema() {
  console.log('🔧 Sincronizando schema do Slave com o Master...\n');

  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307, // Slave port
    user: 'root',
    password: 'rootpass123',
    database: 'auditoria_db',
    multipleStatements: true
  });

  try {
    // Parar replicação
    console.log('⏸️  Parando replicação...');
    await connection.query('STOP SLAVE;');
    
    // Desabilitar foreign key checks
    console.log('🔓 Desabilitando foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Recriar tabela lgpd_registros com schema correto
    console.log('🗑️  Recriando tabela lgpd_registros...');
    await connection.query('DROP TABLE IF EXISTS lgpd_registros;');
    await connection.query(`
      CREATE TABLE lgpd_registros (
        id INT NOT NULL AUTO_INCREMENT,
        identificacao_dados VARCHAR(255) NOT NULL COMMENT 'Nome/Identificação do conjunto de dados',
        hierarquia_sensibilidade ENUM(
          'Dados Publicos',
          'Dados Corporativos',
          'Dados Pessoais',
          'Dados Identificadores',
          'Dados Sensíveis'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        tipo_dados ENUM(
          'Identificadores Direto',
          'Identificadores Indireto',
          'Sensível',
          'Financeiro',
          'Localização'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        tecnica_anonimizacao ENUM(
          'Supressão',
          'Generalização',
          'Embaralhamento',
          'Permutação',
          'Sem Anonimização'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sem Anonimização',
        data_inicio DATE NOT NULL DEFAULT (curdate()) COMMENT 'Data de início do tratamento',
        data_termino DATE DEFAULT NULL COMMENT 'Data de término do tratamento',
        ativo TINYINT(1) DEFAULT '1' COMMENT 'Registro ativo ou inativo',
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_tipo_dados (tipo_dados),
        KEY idx_data_inicio (data_inicio),
        KEY idx_ativo (ativo),
        KEY idx_hierarquia_sensibilidade (hierarquia_sensibilidade)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
      COMMENT='Registros de dados pessoais para conformidade com LGPD';
    `);
    
    console.log('✅ Tabela lgpd_registros recriada!\n');
    
    // Atualizar ENUMs da tabela lgpd_campos
    console.log('📝 Atualizando ENUMs da tabela lgpd_campos...');
    
    const matrizColumns = [
      'matriz_vendas',
      'matriz_marketing', 
      'matriz_financeiro',
      'matriz_rh',
      'matriz_logistica',
      'matriz_assistencia_tecnica',
      'matriz_analytics'
    ];
    
    for (const column of matrizColumns) {
      console.log(`   ✓ Atualizando ${column}...`);
      await connection.query(`
        ALTER TABLE lgpd_campos 
        MODIFY COLUMN ${column} ENUM(
          'Supressão',
          'Generalização',
          'Embaralhamento',
          'Permutação',
          'Sem Anonimização'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Sem Anonimização'
      `);
    }
    
    console.log('✅ ENUMs da tabela lgpd_campos atualizados!\n');
    
    // Reabilitar foreign key checks
    console.log('🔒 Reabilitando foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    // Reiniciar replicação
    console.log('\n▶️  Reiniciando replicação...');
    await connection.query('START SLAVE;');
    
    // Verificar status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const [status] = await connection.query('SHOW SLAVE STATUS');
    
    console.log('\n📊 Status da Replicação:');
    console.log(`   Slave_IO_Running: ${status[0].Slave_IO_Running}`);
    console.log(`   Slave_SQL_Running: ${status[0].Slave_SQL_Running}`);
    console.log(`   Seconds_Behind_Master: ${status[0].Seconds_Behind_Master}`);
    console.log(`   Last_Error: ${status[0].Last_Error || 'Nenhum'}`);
    
    if (status[0].Slave_IO_Running === 'Yes' && status[0].Slave_SQL_Running === 'Yes') {
      console.log('\n✅ Schema do Slave sincronizado com sucesso!');
      console.log('✅ Replicação funcionando corretamente!\n');
    } else {
      console.log('\n⚠️  Replicação ainda com problemas. Verifique os logs.\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixSlaveSchema().catch(console.error);
