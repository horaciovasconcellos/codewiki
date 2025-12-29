#!/usr/bin/env node

/**
 * Script para verificar se a tabela azure_devops_templates existe
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-master',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'app_user',
  password: process.env.MYSQL_PASSWORD || 'apppass123',
  database: process.env.MYSQL_DATABASE || 'auditoria_db',
};

async function checkTable() {
  let connection;
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Conectado com sucesso!\n');

    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [dbConfig.database, 'azure_devops_templates']
    );

    if (tables.length === 0) {
      console.log('✗ Tabela azure_devops_templates NÃO existe!');
      console.log('\nExecute o script SQL para criar a tabela:');
      console.log('mysql -u app_user -p auditoria_db < database/32-create-azure-devops-templates.sql\n');
      process.exit(1);
    }

    console.log('✓ Tabela azure_devops_templates existe!\n');

    // Verificar estrutura da tabela
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM azure_devops_templates`
    );

    console.log('Estrutura da tabela:');
    columns.forEach((col) => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Verificar templates existentes
    const [templates] = await connection.execute(
      `SELECT template_type, file_name, CHAR_LENGTH(template_content) as size, created_at 
       FROM azure_devops_templates`
    );

    console.log(`\nTemplates cadastrados: ${templates.length}`);
    if (templates.length > 0) {
      templates.forEach((t) => {
        console.log(`  - ${t.template_type}: ${t.file_name} (${t.size} bytes)`);
      });
    }

    console.log('\n✓ Tudo pronto para uso!');
    process.exit(0);

  } catch (error) {
    console.error('✗ Erro:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nO banco de dados não está acessível.');
      console.log('Verifique se o MySQL está rodando.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nCredenciais inválidas.');
      console.log('Verifique as variáveis de ambiente.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTable();
