const mysql = require('mysql2/promise');

async function createLGPDTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'rootpass',
    database: 'auditoria_db'
  });

  try {
    console.log('🔄 Criando tabela lgpd_registros...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lgpd_registros (
        id INT AUTO_INCREMENT PRIMARY KEY,
        identificacao_dados VARCHAR(255) NOT NULL,
        tipo_dados VARCHAR(100) NOT NULL,
        tecnica_anonimizacao VARCHAR(150) NOT NULL,
        data_inicio DATE NOT NULL,
        data_termino DATE NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Tabela lgpd_registros criada');

    console.log('🔄 Criando tabela lgpd_campos...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lgpd_campos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lgpd_id INT NOT NULL,
        nome_campo VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        matriz_vendas VARCHAR(150) NOT NULL,
        matriz_marketing VARCHAR(150) NOT NULL,
        matriz_financeiro VARCHAR(150) NOT NULL,
        matriz_rh VARCHAR(150) NOT NULL,
        matriz_logistica VARCHAR(150) NOT NULL,
        matriz_assistencia_tecnica VARCHAR(150) NOT NULL,
        matriz_analytics VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (lgpd_id) REFERENCES lgpd_registros(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Tabela lgpd_campos criada');

    console.log('🔄 Inserindo dados de exemplo...');
    await connection.execute(`
      INSERT IGNORE INTO lgpd_registros (id, identificacao_dados, tipo_dados, tecnica_anonimizacao, data_inicio, ativo) VALUES
      (1, 'Dados de Clientes - CRM', 'Dados Identificadores Diretos', 'Pseudonimização (Embaralhamento Reversível)', '2024-01-01', true),
      (2, 'Histórico de Navegação', 'Dados Identificadores Indiretos', 'Anonimização por Generalização', '2024-01-15', true)
    `);

    await connection.execute(`
      INSERT IGNORE INTO lgpd_campos (id, lgpd_id, nome_campo, descricao, matriz_vendas, matriz_marketing, matriz_financeiro, matriz_rh, matriz_logistica, matriz_assistencia_tecnica, matriz_analytics) VALUES
      (1, 1, 'cpf', 'CPF do cliente', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Generalização'),
      (2, 1, 'email', 'Endereço de e-mail', 'Pseudonimização (Embaralhamento Reversível)', 'Pseudonimização (Embaralhamento Reversível)', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Supressão', 'Anonimização por Supressão', 'Pseudonimização (Embaralhamento Reversível)', 'Anonimização por Generalização')
    `);
    console.log('✅ Dados de exemplo inseridos');

    console.log('\n✨ Tabelas LGPD criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createLGPDTables();
