const mysql = require('mysql2/promise');

async function fixLGPDMatriz() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: 'rootpass123',
    database: 'auditoria_db'
  });

  console.log('Conectado ao MySQL. Iniciando migração...');

  const columns = [
    'matriz_vendas',
    'matriz_marketing', 
    'matriz_financeiro',
    'matriz_rh',
    'matriz_logistica',
    'matriz_assistencia_tecnica',
    'matriz_analytics'
  ];

  for (const col of columns) {
    try {
      console.log(`Atualizando ${col}...`);
      await connection.query(`
        ALTER TABLE lgpd_campos 
        MODIFY COLUMN ${col} ENUM('Supressão','Generalização','Embaralhamento','Permutação','Sem Anonimização') 
        DEFAULT 'Sem Anonimização'
      `);
      console.log(`✓ ${col} atualizado com sucesso`);
    } catch (err) {
      console.error(`✗ Erro ao atualizar ${col}:`, err.message);
    }
  }

  await connection.end();
  console.log('\nMigração concluída!');
}

fixLGPDMatriz().catch(console.error);
