/**
 * Script de teste para verificar se os Squads estão sendo salvos e recuperados corretamente
 * 
 * Uso: node test-squads.js [aplicacao_id]
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3308,
  user: process.env.MYSQL_USER || 'app_user',
  password: process.env.MYSQL_PASSWORD || 'apppass123',
  database: process.env.MYSQL_DATABASE || 'auditoria_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function testSquads() {
  let connection;
  
  try {
    console.log('\n🔍 TESTE DE SQUADS - APLICAÇÃO\n');
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado!\n');

    // Verificar se a tabela existe
    console.log('1. Verificando estrutura da tabela aplicacao_squads...');
    const [tableInfo] = await connection.query('DESCRIBE aplicacao_squads');
    console.log('✅ Tabela existe com as colunas:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });

    // Buscar uma aplicação de teste
    console.log('\n2. Buscando aplicações no sistema...');
    const aplicacaoId = process.argv[2];
    
    if (aplicacaoId) {
      console.log(`   Testando com aplicação ID: ${aplicacaoId}`);
      
      const [aplicacao] = await connection.query(
        'SELECT id, sigla, descricao FROM aplicacoes WHERE id = ?',
        [aplicacaoId]
      );
      
      if (aplicacao.length === 0) {
        console.log('❌ Aplicação não encontrada!');
        return;
      }
      
      console.log(`   ✅ Aplicação encontrada: ${aplicacao[0].sigla} - ${aplicacao[0].descricao}`);
      
      // Buscar squads associados
      console.log('\n3. Buscando squads associados...');
      const [squads] = await connection.query(`
        SELECT asq.id, asq.colaborador_id, asq.perfil, asq.squad,
               asq.data_inicio, asq.data_termino, asq.status,
               c.nome as colaborador_nome, c.matricula as colaborador_matricula
        FROM aplicacao_squads asq
        JOIN colaboradores c ON asq.colaborador_id = c.id
        WHERE asq.aplicacao_id = ?
        ORDER BY asq.data_inicio DESC
      `, [aplicacaoId]);
      
      if (squads.length === 0) {
        console.log('   ⚠️  Nenhum squad associado a esta aplicação');
      } else {
        console.log(`   ✅ ${squads.length} squad(s) encontrado(s):\n`);
        squads.forEach((squad, index) => {
          console.log(`   ${index + 1}. ${squad.colaborador_nome} (${squad.colaborador_matricula})`);
          console.log(`      Perfil: ${squad.perfil}`);
          console.log(`      Squad: ${squad.squad}`);
          console.log(`      Período: ${squad.data_inicio} até ${squad.data_termino || 'Em andamento'}`);
          console.log(`      Status: ${squad.status}\n`);
        });
      }
    } else {
      // Listar todas as aplicações com squads
      const [aplicacoes] = await connection.query(`
        SELECT a.id, a.sigla, a.descricao, COUNT(asq.id) as total_squads
        FROM aplicacoes a
        LEFT JOIN aplicacao_squads asq ON a.id = asq.aplicacao_id AND asq.status = 'Ativo'
        GROUP BY a.id
        HAVING total_squads > 0
        ORDER BY total_squads DESC
        LIMIT 10
      `);
      
      if (aplicacoes.length === 0) {
        console.log('   ⚠️  Nenhuma aplicação com squads encontrada');
        console.log('\n💡 Dica: Adicione squads através da Wizard de Aplicação, passo 3');
      } else {
        console.log(`   ✅ ${aplicacoes.length} aplicação(ões) com squads:\n`);
        aplicacoes.forEach((app, index) => {
          console.log(`   ${index + 1}. ${app.sigla} - ${app.descricao}`);
          console.log(`      ID: ${app.id}`);
          console.log(`      Squads: ${app.total_squads}\n`);
        });
        
        console.log('\n💡 Para ver detalhes de uma aplicação específica, execute:');
        console.log(`   node test-squads.js ${aplicacoes[0].id}`);
      }
    }

    // Estatísticas gerais
    console.log('\n4. Estatísticas gerais:');
    const [stats] = await connection.query(`
      SELECT 
        COUNT(DISTINCT aplicacao_id) as total_aplicacoes,
        COUNT(DISTINCT colaborador_id) as total_colaboradores,
        COUNT(*) as total_associacoes,
        COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as associacoes_ativas
      FROM aplicacao_squads
    `);
    
    console.log(`   Total de aplicações com squads: ${stats[0].total_aplicacoes}`);
    console.log(`   Total de colaboradores em squads: ${stats[0].total_colaboradores}`);
    console.log(`   Total de associações: ${stats[0].total_associacoes}`);
    console.log(`   Associações ativas: ${stats[0].associacoes_ativas}`);

    console.log('\n✅ Teste concluído com sucesso!\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 A tabela aplicacao_squads não existe.');
      console.log('   Execute o script SQL: database/17-create-aplicacao-squads.sql');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testSquads();
