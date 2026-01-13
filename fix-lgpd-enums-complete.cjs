const mysql = require('mysql2/promise');

async function fixAllLGPDEnums() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: 'rootpass123',
    database: 'auditoria_db',
    charset: 'utf8mb4'
  });

  console.log('🔧 Corrigindo todos os ENUMs LGPD...\n');

  try {
    // 1. Atualizar hierarquia_sensibilidade
    console.log('1️⃣  Atualizando hierarquia_sensibilidade...');
    await connection.query(`
      ALTER TABLE lgpd_registros 
      MODIFY COLUMN hierarquia_sensibilidade ENUM(
        'Dados Publicos',
        'Dados Corporativos',
        'Dados Pessoais',
        'Dados Identificadores',
        'Dados Sensíveis'
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
    `);
    console.log('   ✓ Concluído\n');

    // 2. Atualizar tipo_dados
    console.log('2️⃣  Atualizando tipo_dados...');
    await connection.query(`
      ALTER TABLE lgpd_registros 
      MODIFY COLUMN tipo_dados ENUM(
        'Identificadores Direto',
        'Identificadores Indireto',
        'Sensível',
        'Financeiro',
        'Localização'
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
    `);
    console.log('   ✓ Concluído\n');

    // 3. Atualizar tecnica_anonimizacao
    console.log('3️⃣  Atualizando tecnica_anonimizacao...');
    await connection.query(`
      ALTER TABLE lgpd_registros 
      MODIFY COLUMN tecnica_anonimizacao ENUM(
        'Supressão',
        'Generalização',
        'Embaralhamento',
        'Permutação',
        'Sem Anonimização'
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
    `);
    console.log('   ✓ Concluído\n');

    // Verificar resultado final
    console.log('📊 Verificando ENUMs finais:\n');
    const [rows] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM information_schema.COLUMNS 
      WHERE TABLE_NAME='lgpd_registros' 
      AND COLUMN_NAME IN ('hierarquia_sensibilidade', 'tipo_dados', 'tecnica_anonimizacao')
    `);
    
    rows.forEach(row => {
      console.log(`✅ ${row.COLUMN_NAME}`);
      console.log(`   Valores: ${row.COLUMN_TYPE.substring(0, 100)}...`);
      console.log(`   Charset: ${row.CHARACTER_SET_NAME}`);
      console.log(`   Collation: ${row.COLLATION_NAME}\n`);
    });

    console.log('🎉 Todos os ENUMs foram corrigidos com sucesso!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.error(err);
  } finally {
    await connection.end();
  }
}

fixAllLGPDEnums().catch(console.error);
