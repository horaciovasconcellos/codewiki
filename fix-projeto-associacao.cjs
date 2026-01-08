// Script para associar o projeto de estrutura TODOS-JUNTOS com a aplicação
const mysql = require('mysql2/promise');

async function fixAssociacao() {
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
    console.log('=== CORRIGINDO ASSOCIAÇÃO DO PROJETO ===\n');

    // Atualizar o projeto TODOS-JUNTOS
    const [result] = await pool.query(
      `UPDATE estruturas_projeto 
       SET aplicacao_base_id = '09490777-a5db-4f8a-aeed-e4e68dec8f71' 
       WHERE id = 'projeto-1767892009925'`
    );
    
    console.log(`✅ Projeto atualizado: ${result.affectedRows} linha(s) afetada(s)`);
    
    // Verificar atualização
    const [projeto] = await pool.query(
      'SELECT id, projeto, aplicacao_base_id FROM estruturas_projeto WHERE id = ?',
      ['projeto-1767892009925']
    );
    
    if (projeto.length > 0) {
      console.log('\n📋 Dados atualizados:');
      console.log(`   ID: ${projeto[0].id}`);
      console.log(`   Nome: ${projeto[0].projeto}`);
      console.log(`   Aplicação Base ID: ${projeto[0].aplicacao_base_id}`);
      
      // Verificar correspondência com SPEC-KIT
      const [match] = await pool.query(
        `SELECT * FROM projetos_sdd 
         WHERE aplicacao_id = ? 
         AND nome_projeto = ? 
         AND gerador_projetos = 1`,
        [projeto[0].aplicacao_base_id, projeto[0].projeto]
      );
      
      if (match.length > 0) {
        console.log('\n✅ CORRESPONDÊNCIA ENCONTRADA COM SPEC-KIT!');
        console.log(`   SPEC-KIT ID: ${match[0].id}`);
        console.log(`   Nome: ${match[0].nome_projeto}`);
        
        // Contar requisitos e tarefas
        const [requisitos] = await pool.query(
          `SELECT COUNT(*) as total FROM requisitos_sdd 
           WHERE projeto_id = ? AND status = 'PRONTO P/DEV'`,
          [match[0].id]
        );
        
        console.log(`\n📊 Estatísticas:`);
        console.log(`   Requisitos "PRONTO P/DEV": ${requisitos[0].total}`);
        
        if (requisitos[0].total > 0) {
          const [reqList] = await pool.query(
            `SELECT id, sequencia, nome FROM requisitos_sdd 
             WHERE projeto_id = ? AND status = 'PRONTO P/DEV'`,
            [match[0].id]
          );
          
          let totalTasks = 0;
          for (const req of reqList) {
            const [tasks] = await pool.query(
              `SELECT COUNT(*) as total FROM tarefas_sdd 
               WHERE requisito_id = ? AND status = 'TO DO'`,
              [req.id]
            );
            totalTasks += tasks[0].total;
          }
          
          console.log(`   Tasks "TO DO": ${totalTasks}`);
          console.log(`\n✅ Ao integrar este projeto no Azure DevOps:`);
          console.log(`   • Serão criados ${requisitos[0].total} PBIs`);
          console.log(`   • Serão criadas ${totalTasks} Tasks`);
        }
      } else {
        console.log('\n❌ Nenhuma correspondência encontrada com SPEC-KIT');
      }
    }
    
    console.log('\n=== FIM ===\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixAssociacao();
