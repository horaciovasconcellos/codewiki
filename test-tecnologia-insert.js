// Script de teste para verificar inserção de tecnologias
// Execute: node test-tecnologia-insert.js

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function testInsert() {
  console.log('🔍 Testando inserção em aplicacao_tecnologias...\n');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'auditoria_user',
    password: process.env.DB_PASSWORD || 'auditoria_pass',
    database: process.env.DB_NAME || 'auditoria_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando estrutura da tabela...');
    const [columns] = await pool.query('DESCRIBE aplicacao_tecnologias');
    console.log('✓ Colunas da tabela:', columns.map(c => c.Field).join(', '));
    console.log('');

    // 2. Buscar uma aplicação e tecnologia existentes
    console.log('2️⃣ Buscando IDs existentes...');
    const [apps] = await pool.query('SELECT id, sigla FROM aplicacoes LIMIT 1');
    const [tecs] = await pool.query('SELECT id, sigla FROM tecnologias LIMIT 1');
    
    if (apps.length === 0) {
      console.log('❌ Nenhuma aplicação encontrada');
      return;
    }
    if (tecs.length === 0) {
      console.log('❌ Nenhuma tecnologia encontrada');
      return;
    }

    const appId = apps[0].id;
    const tecId = tecs[0].id;
    console.log('✓ Aplicação:', apps[0].sigla, '(', appId, ')');
    console.log('✓ Tecnologia:', tecs[0].sigla, '(', tecId, ')');
    console.log('');

    // 3. Verificar associações existentes
    console.log('3️⃣ Verificando associações existentes...');
    const [existing] = await pool.query(
      'SELECT * FROM aplicacao_tecnologias WHERE aplicacao_id = ?',
      [appId]
    );
    console.log('✓ Associações existentes:', existing.length);
    if (existing.length > 0) {
      console.log('  Exemplo:', existing[0]);
    }
    console.log('');

    // 4. Tentar inserir uma nova associação
    console.log('4️⃣ Tentando inserir nova associação...');
    const newId = uuidv4();
    const dataInicio = new Date().toISOString().split('T')[0];
    
    const insertSQL = `
      INSERT INTO aplicacao_tecnologias 
      (id, aplicacao_id, tecnologia_id, data_inicio, data_termino, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const values = [newId, appId, tecId, dataInicio, null, 'Ativo'];
    
    console.log('  SQL:', insertSQL);
    console.log('  Values:', values);
    
    const [result] = await pool.query(insertSQL, values);
    console.log('✓ INSERT executado com sucesso!');
    console.log('  affectedRows:', result.affectedRows);
    console.log('  insertId:', result.insertId);
    console.log('');

    // 5. Verificar se foi inserido
    console.log('5️⃣ Verificando inserção...');
    const [inserted] = await pool.query(
      'SELECT * FROM aplicacao_tecnologias WHERE id = ?',
      [newId]
    );
    
    if (inserted.length > 0) {
      console.log('✓ Registro encontrado:', inserted[0]);
    } else {
      console.log('❌ Registro NÃO encontrado após INSERT!');
    }
    console.log('');

    // 6. Limpar teste
    console.log('6️⃣ Limpando dados de teste...');
    await pool.query('DELETE FROM aplicacao_tecnologias WHERE id = ?', [newId]);
    console.log('✓ Teste limpo');
    console.log('');

    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!\n');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testInsert();
