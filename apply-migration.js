import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-master',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'app_user',
  password: process.env.MYSQL_PASSWORD || 'apppass123',
  database: process.env.MYSQL_DATABASE || 'auditoria_db',
  multipleStatements: true
};

async function applyMigration() {
  let connection;
  
  try {
    console.log('📋 Configuração do banco:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    console.log('\n🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao MySQL!\n');
    
    // Ler o arquivo SQL
    const sqlFile = 'database/31-create-servidor-aplicacao.sql';
    console.log(`📄 Lendo arquivo: ${sqlFile}`);
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Executar o SQL
    console.log('⚙️  Executando migration...');
    await connection.query(sql);
    console.log('✅ Migration aplicada com sucesso!\n');
    
    // Verificar se a tabela foi criada
    const [tables] = await connection.query("SHOW TABLES LIKE 'servidor_aplicacao'");
    if (tables.length > 0) {
      console.log('✅ Tabela servidor_aplicacao criada com sucesso!');
      
      // Mostrar estrutura da tabela
      const [columns] = await connection.query('DESCRIBE servidor_aplicacao');
      console.log('\n📊 Estrutura da tabela:');
      console.table(columns);
    } else {
      console.log('❌ Erro: Tabela não foi criada!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

applyMigration();
