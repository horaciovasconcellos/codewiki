/**
 * Script de teste para verificar relacionamento servidor-aplicacao
 */

const mysql = require('mysql2/promise');

async function testServidorAplicacao() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'auditoria_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✓ Conectado ao banco de dados\n');

    // 1. Verificar se a tabela existe
    console.log('1. Verificando se a tabela servidor_aplicacao existe...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'servidor_aplicacao'"
    );
    
    if (tables.length === 0) {
      console.log('✗ ERRO: Tabela servidor_aplicacao não existe!');
      console.log('Execute o script de migração: database/31-create-servidor-aplicacao.sql\n');
      return;
    }
    console.log('✓ Tabela servidor_aplicacao existe\n');

    // 2. Verificar estrutura da tabela
    console.log('2. Estrutura da tabela servidor_aplicacao:');
    const [structure] = await connection.query('DESCRIBE servidor_aplicacao');
    console.table(structure.map(col => ({
      Campo: col.Field,
      Tipo: col.Type,
      Nulo: col.Null,
      Chave: col.Key
    })));

    // 3. Contar registros na tabela
    console.log('\n3. Contando registros...');
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM servidor_aplicacao'
    );
    const totalRegistros = countResult[0].total;
    console.log(`Total de registros: ${totalRegistros}\n`);

    if (totalRegistros === 0) {
      console.log('⚠ Nenhum registro encontrado na tabela servidor_aplicacao');
      console.log('Você precisa associar servidores às aplicações através da interface.\n');
    }

    // 4. Listar alguns registros
    if (totalRegistros > 0) {
      console.log('4. Primeiros 10 registros:');
      const [registros] = await connection.query(`
        SELECT 
          sa.id,
          sa.servidor_id,
          sa.aplicacao_id,
          s.sigla as servidor_sigla,
          s.hostname as servidor_hostname,
          a.sigla as aplicacao_sigla,
          a.descricao as aplicacao_descricao,
          sa.status,
          sa.data_inicio
        FROM servidor_aplicacao sa
        LEFT JOIN servidores s ON sa.servidor_id = s.id
        LEFT JOIN aplicacoes a ON sa.aplicacao_id = a.id
        ORDER BY sa.created_at DESC
        LIMIT 10
      `);
      
      console.table(registros.map(r => ({
        'ID': r.id,
        'Servidor ID': r.servidor_id,
        'Aplicacao ID': r.aplicacao_id,
        'Servidor': r.servidor_sigla || 'NULL',
        'Hostname': r.servidor_hostname || 'NULL',
        'Aplicação': r.aplicacao_sigla || 'NULL',
        'Status': r.status,
        'Data Início': r.data_inicio
      })));
      
      // Verificar se há NULLs nos JOINs
      const nullServidores = registros.filter(r => !r.servidor_sigla);
      const nullAplicacoes = registros.filter(r => !r.aplicacao_sigla);
      
      if (nullServidores.length > 0) {
        console.log(`\n⚠ ATENÇÃO: ${nullServidores.length} registro(s) com servidor NULL (servidor_id não encontrado)`);
      }
      if (nullAplicacoes.length > 0) {
        console.log(`\n⚠ ATENÇÃO: ${nullAplicacoes.length} registro(s) com aplicação NULL (aplicacao_id não encontrado)`);
      }
    }

    // 5. Verificar se há servidores e aplicações cadastrados
    console.log('\n5. Verificando servidores e aplicações disponíveis:');
    const [servidores] = await connection.query('SELECT COUNT(*) as total FROM servidores');
    const [aplicacoes] = await connection.query('SELECT COUNT(*) as total FROM aplicacoes');
    
    console.log(`Total de Servidores cadastrados: ${servidores[0].total}`);
    console.log(`Total de Aplicações cadastradas: ${aplicacoes[0].total}`);

    if (servidores[0].total === 0) {
      console.log('\n⚠ Nenhum servidor cadastrado! Cadastre servidores primeiro.');
    }

    if (aplicacoes[0].total === 0) {
      console.log('\n⚠ Nenhuma aplicação cadastrada! Cadastre aplicações primeiro.');
    }

    // 6. Testar query do endpoint
    console.log('\n6. Testando query do endpoint (exemplo com primeira aplicação):');
    const [primeiraApp] = await connection.query(
      'SELECT id, sigla FROM aplicacoes LIMIT 1'
    );
    
    if (primeiraApp.length > 0) {
      const appId = primeiraApp[0].id;
      const appSigla = primeiraApp[0].sigla;
      
      console.log(`Buscando servidores da aplicação: ${appSigla} (ID: ${appId})`);
      
      const [servidoresApp] = await connection.query(`
        SELECT 
          sa.id,
          sa.servidor_id as servidorId,
          sa.aplicacao_id as aplicacaoId,
          sa.data_inicio as dataInicio,
          sa.data_termino as dataTermino,
          sa.status,
          s.sigla as servidorSigla,
          s.hostname as servidorHostname,
          s.tipo_servidor as tipoServidor,
          s.sistema_operacional as sistemaOperacional,
          sa.created_at as createdAt,
          sa.updated_at as updatedAt
        FROM servidor_aplicacao sa
        INNER JOIN servidores s ON sa.servidor_id = s.id
        WHERE sa.aplicacao_id = ?
        ORDER BY s.sigla
      `, [appId]);
      
      console.log(`Resultado: ${servidoresApp.length} servidor(es) encontrado(s)\n`);
      
      if (servidoresApp.length > 0) {
        console.table(servidoresApp.map(s => ({
          'SA ID': s.id,
          'Servidor ID': s.servidorId,
          'Aplicacao ID': s.aplicacaoId,
          'Sigla': s.servidorSigla,
          'Hostname': s.servidorHostname,
          'Tipo': s.tipoServidor,
          'Status': s.status
        })));
      } else {
        console.log('⚠ Nenhum servidor associado a esta aplicação.');
        console.log('\nVerifique se existem registros na tabela:');
        const [todosRegistros] = await connection.query(
          'SELECT aplicacao_id, COUNT(*) as total FROM servidor_aplicacao GROUP BY aplicacao_id'
        );
        if (todosRegistros.length > 0) {
          console.log('\nAplicações com servidores associados:');
          console.table(todosRegistros);
        }
      }
    }

  } catch (error) {
    console.error('✗ Erro:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠ Não foi possível conectar ao MySQL.');
      console.log('Verifique se o MySQL está rodando e as credenciais estão corretas.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Conexão fechada');
    }
  }
}

// Executar teste
testServidorAplicacao();
