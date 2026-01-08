// Script de debug para verificar a integração SPEC-KIT -> Azure DevOps
const mysql = require('mysql2/promise');

async function debugSpecKit() {
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
    console.log('=== DEBUG SPEC-KIT -> AZURE DEVOPS ===\n');

    // 1. Listar todos os projetos de estrutura
    console.log('1. PROJETOS DE ESTRUTURA:');
    const [estruturas] = await pool.query(
      'SELECT id, produto, projeto, aplicacao_base_id, nome_time FROM estruturas_projeto ORDER BY id DESC LIMIT 5'
    );
    
    if (estruturas.length === 0) {
      console.log('   ⚠️ Nenhum projeto de estrutura encontrado!');
    } else {
      estruturas.forEach(e => {
        console.log(`   - ID: ${e.id}`);
        console.log(`     Produto: ${e.produto}`);
        console.log(`     Projeto: ${e.projeto}`);
        console.log(`     Aplicação Base ID: ${e.aplicacao_base_id || 'NULL'}`);
        console.log(`     Nome do Time: ${e.nome_time || 'NULL'}`);
        console.log('');
      });
    }

    // 2. Listar todos os projetos SPEC-KIT
    console.log('\n2. PROJETOS SPEC-KIT (SDD):');
    const [projetosSDD] = await pool.query(
      'SELECT id, nome_projeto, aplicacao_id, gerador_projetos FROM projetos_sdd ORDER BY created_at DESC LIMIT 5'
    );
    
    if (projetosSDD.length === 0) {
      console.log('   ⚠️ Nenhum projeto SPEC-KIT encontrado!');
    } else {
      projetosSDD.forEach(p => {
        console.log(`   - ID: ${p.id}`);
        console.log(`     Nome: ${p.nome_projeto}`);
        console.log(`     Aplicação ID: ${p.aplicacao_id || 'NULL'}`);
        console.log(`     Gerador Projetos: ${p.gerador_projetos ? 'SIM' : 'NÃO'}`);
        console.log('');
      });
    }

    // 3. Verificar correspondências
    console.log('\n3. VERIFICANDO CORRESPONDÊNCIAS:');
    for (const estrutura of estruturas) {
      console.log(`\n   Estrutura: ${estrutura.projeto}`);
      console.log(`   Buscando SPEC-KIT com:`);
      console.log(`     - aplicacao_id = '${estrutura.aplicacao_base_id}'`);
      console.log(`     - nome_projeto = '${estrutura.projeto}'`);
      console.log(`     - gerador_projetos = 1`);
      
      const [match] = await pool.query(
        `SELECT * FROM projetos_sdd 
         WHERE aplicacao_id = ? 
         AND nome_projeto = ? 
         AND gerador_projetos = 1`,
        [estrutura.aplicacao_base_id, estrutura.projeto]
      );
      
      if (match.length > 0) {
        console.log(`   ✅ ENCONTRADO! ID: ${match[0].id}`);
        
        // Verificar requisitos
        const [requisitos] = await pool.query(
          'SELECT id, sequencia, nome, status FROM requisitos_sdd WHERE projeto_id = ?',
          [match[0].id]
        );
        
        console.log(`   Total de requisitos: ${requisitos.length}`);
        
        if (requisitos.length > 0) {
          const prontosDev = requisitos.filter(r => r.status === 'PRONTO P/DEV');
          console.log(`   Requisitos "PRONTO P/DEV": ${prontosDev.length}`);
          
          if (prontosDev.length > 0) {
            console.log('\n   Requisitos que seriam criados como PBIs:');
            for (const req of prontosDev) {
              console.log(`     - ${req.sequencia}: ${req.nome}`);
              
              // Verificar tarefas
              const [tarefas] = await pool.query(
                'SELECT id, descricao, status, data_inicio FROM tarefas_sdd WHERE requisito_id = ?',
                [req.id]
              );
              
              const tarefasToDo = tarefas.filter(t => t.status === 'TO DO');
              console.log(`       Tarefas "TO DO": ${tarefasToDo.length} de ${tarefas.length} total`);
              
              if (tarefasToDo.length > 0) {
                tarefasToDo.forEach((t, idx) => {
                  console.log(`         ${idx + 1}. ${t.descricao.substring(0, 60)}...`);
                });
              }
            }
          } else {
            console.log(`   ⚠️ Nenhum requisito com status "PRONTO P/DEV"`);
            console.log('\n   Status dos requisitos encontrados:');
            requisitos.forEach(r => {
              console.log(`     - ${r.sequencia}: ${r.status}`);
            });
          }
        }
      } else {
        console.log(`   ❌ NÃO ENCONTRADO`);
        console.log(`   Possíveis causas:`);
        console.log(`     - aplicacao_base_id da estrutura não corresponde ao aplicacao_id do SPEC-KIT`);
        console.log(`     - Nome do projeto não corresponde`);
        console.log(`     - gerador_projetos não está ativado (=1)`);
      }
    }

    // 4. Verificar detalhes de todos os projetos SPEC-KIT
    console.log('\n\n4. DETALHES DOS PROJETOS SPEC-KIT:');
    for (const projeto of projetosSDD) {
      console.log(`\n   === Projeto: ${projeto.nome_projeto} (ID: ${projeto.id}) ===`);
      console.log(`   Aplicação ID: ${projeto.aplicacao_id || 'NULL'}`);
      console.log(`   Gerador de Projetos: ${projeto.gerador_projetos ? 'ATIVO' : 'INATIVO'}`);
      
      // Buscar requisitos
      const [requisitos] = await pool.query(
        'SELECT id, sequencia, nome, status, descricao FROM requisitos_sdd WHERE projeto_id = ? ORDER BY sequencia',
        [projeto.id]
      );
      
      console.log(`   Total de requisitos: ${requisitos.length}`);
      
      if (requisitos.length > 0) {
        const prontosDev = requisitos.filter(r => r.status === 'PRONTO P/DEV');
        console.log(`   Requisitos com status "PRONTO P/DEV": ${prontosDev.length}`);
        
        console.log('\n   Lista de requisitos:');
        for (const req of requisitos) {
          console.log(`\n     [${req.sequencia}] ${req.nome}`);
          console.log(`       Status: ${req.status}`);
          console.log(`       Descrição: ${req.descricao ? req.descricao.substring(0, 80) + '...' : 'Sem descrição'}`);
          
          // Buscar tarefas
          const [tarefas] = await pool.query(
            'SELECT id, descricao, status, data_inicio FROM tarefas_sdd WHERE requisito_id = ? ORDER BY data_inicio',
            [req.id]
          );
          
          const tarefasToDo = tarefas.filter(t => t.status === 'TO DO');
          console.log(`       Tarefas: ${tarefas.length} total, ${tarefasToDo.length} com status "TO DO"`);
          
          if (tarefas.length > 0) {
            tarefas.forEach((t, idx) => {
              console.log(`         ${idx + 1}. [${t.status}] ${t.descricao.substring(0, 50)}... (${t.data_inicio})`);
            });
          }
          
          // Verificar se seria criado PBI e Tasks
          if (req.status === 'PRONTO P/DEV') {
            console.log(`       ✅ SERIA CRIADO COMO PBI`);
            if (tarefasToDo.length > 0) {
              console.log(`       ✅ ${tarefasToDo.length} Tasks "TO DO" SERIAM CRIADAS`);
            } else {
              console.log(`       ⚠️ Nenhuma task "TO DO" para criar`);
            }
          } else {
            console.log(`       ❌ NÃO seria criado (status não é "PRONTO P/DEV")`);
          }
        }
      } else {
        console.log('   ⚠️ Nenhum requisito cadastrado neste projeto');
      }
    }

    console.log('\n\n=== FIM DO DEBUG ===\n');
    
  } catch (error) {
    console.error('Erro no debug:', error);
  } finally {
    await pool.end();
  }
}

debugSpecKit();
