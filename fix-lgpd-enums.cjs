const mysql = require('mysql2/promise');

async function fixLGPDEnums() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: 'rootpass123',
    database: 'auditoria_db'
  });

  console.log('Conectado ao MySQL. Verificando ENUMs...\n');

  try {
    // Verificar ENUM atual
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME='lgpd_registros' 
      AND COLUMN_NAME IN ('hierarquia_sensibilidade', 'tipo_dados', 'tecnica_anonimizacao')
    `);
    
    console.log('ENUMs atuais:');
    rows.forEach(row => {
      console.log(`${row.COLUMN_NAME}: ${row.COLUMN_TYPE}`);
    });
    console.log('');

    // Verificar se há algum registro
    const [count] = await connection.query('SELECT COUNT(*) as total FROM lgpd_registros');
    console.log(`Total de registros: ${count[0].total}\n`);

    if (count[0].total > 0) {
      console.log('⚠️  Há registros na tabela. Fazendo backup dos valores...\n');
      
      // Criar coluna temporária
      await connection.query(`
        ALTER TABLE lgpd_registros 
        ADD COLUMN hierarquia_temp VARCHAR(100) AFTER hierarquia_sensibilidade
      `);
      
      // Copiar valores
      await connection.query(`
        UPDATE lgpd_registros 
        SET hierarquia_temp = hierarquia_sensibilidade
      `);
      
      console.log('✓ Backup criado na coluna hierarquia_temp\n');
    }

    // Atualizar ENUM de hierarquia_sensibilidade
    console.log('Atualizando hierarquia_sensibilidade...');
    await connection.query(`
      ALTER TABLE lgpd_registros 
      MODIFY COLUMN hierarquia_sensibilidade ENUM(
        'Dados Publicos',
        'Dados Corporativos',
        'Dados Pessoais',
        'Dados Identificadores',
        'Dados Sensíveis'
      ) NOT NULL
    `);
    console.log('✓ hierarquia_sensibilidade atualizado\n');

    // Restaurar valores se havia backup
    if (count[0].total > 0) {
      await connection.query(`
        UPDATE lgpd_registros 
        SET hierarquia_sensibilidade = hierarquia_temp
      `);
      
      await connection.query(`
        ALTER TABLE lgpd_registros 
        DROP COLUMN hierarquia_temp
      `);
      
      console.log('✓ Valores restaurados e coluna temporária removida\n');
    }

    // Verificar resultado final
    const [finalRows] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME='lgpd_registros' 
      AND COLUMN_NAME IN ('hierarquia_sensibilidade', 'tipo_dados', 'tecnica_anonimizacao')
    `);
    
    console.log('ENUMs finais:');
    finalRows.forEach(row => {
      console.log(`${row.COLUMN_NAME}: ${row.COLUMN_TYPE}`);
    });

  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await connection.end();
    console.log('\nConexão fechada.');
  }
}

fixLGPDEnums().catch(console.error);
