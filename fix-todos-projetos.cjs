// Script para corrigir TODOS os projetos TODOS-JUNTOS sem aplicacao_base_id
const mysql = require('mysql2/promise');

async function fixTodosProjetos() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'app_user',
    password: 'apppass123',
    database: 'auditoria_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('=== CORRIGINDO PROJETOS TODOS-JUNTOS ===\n');

    // Buscar TODOS os projetos TODOS-JUNTOS sem aplicacao_base_id
    const [projetos] = await pool.query(
      `SELECT id, projeto, aplicacao_base_id 
       FROM estruturas_projeto 
       WHERE projeto = 'TODOS-JUNTOS' 
       AND (aplicacao_base_id IS NULL OR aplicacao_base_id = '')
       ORDER BY id DESC`
    );
    
    console.log(`Projetos "TODOS-JUNTOS" sem aplicacao_base_id: ${projetos.length}`);
    
    if (projetos.length === 0) {
      console.log('✅ Todos os projetos já estão associados!');
      await pool.end();
      return;
    }
    
    console.log('\nProjetos encontrados:');
    projetos.forEach(p => {
      console.log(`  - ID: ${p.id}`);
    });
    
    // Atualizar todos
    const aplicacaoId = '09490777-a5db-4f8a-aeed-e4e68dec8f71';
    
    console.log(`\nAtualizando todos para aplicacao_base_id = ${aplicacaoId}...`);
    
    const [result] = await pool.query(
      `UPDATE estruturas_projeto 
       SET aplicacao_base_id = ? 
       WHERE projeto = 'TODOS-JUNTOS' 
       AND (aplicacao_base_id IS NULL OR aplicacao_base_id = '')`,
      [aplicacaoId]
    );
    
    console.log(`✅ ${result.affectedRows} projeto(s) atualizado(s)`);
    
    // Verificar atualização
    const [updated] = await pool.query(
      `SELECT id, projeto, aplicacao_base_id 
       FROM estruturas_projeto 
       WHERE projeto = 'TODOS-JUNTOS'
       ORDER BY id DESC`
    );
    
    console.log(`\n📋 Status atual de TODOS os projetos TODOS-JUNTOS:`);
    updated.forEach(p => {
      console.log(`  - ID: ${p.id}`);
      console.log(`    Aplicação Base ID: ${p.aplicacao_base_id || 'NULL'}`);
    });
    
    // Verificar correspondência com SPEC-KIT
    const [match] = await pool.query(
      `SELECT id, nome_projeto, aplicacao_id FROM projetos_sdd 
       WHERE aplicacao_id = ? 
       AND nome_projeto = 'TODOS-JUNTOS' 
       AND gerador_projetos = 1`,
      [aplicacaoId]
    );
    
    if (match.length > 0) {
      console.log(`\n✅ Correspondência com SPEC-KIT encontrada:`);
      console.log(`   SPEC-KIT ID: ${match[0].id}`);
      console.log(`   Nome: ${match[0].nome_projeto}`);
      
      // Contar requisitos e tarefas
      const [stats] = await pool.query(
        `SELECT 
          (SELECT COUNT(*) FROM requisitos_sdd WHERE projeto_id = ? AND status = 'PRONTO P/DEV') as req_count,
          (SELECT COUNT(*) FROM tarefas_sdd t 
           INNER JOIN requisitos_sdd r ON t.requisito_id = r.id 
           WHERE r.projeto_id = ? AND t.status = 'TO DO') as task_count`,
        [match[0].id, match[0].id]
      );
      
      console.log(`\n📊 Work Items que serão criados:`);
      console.log(`   • ${stats[0].req_count} PBIs (requisitos "PRONTO P/DEV")`);
      console.log(`   • ${stats[0].task_count} Tasks (tarefas "TO DO")`);
    } else {
      console.log(`\n❌ ATENÇÃO: Não há correspondência com SPEC-KIT!`);
    }
    
    console.log('\n=== FIM ===\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixTodosProjetos();
