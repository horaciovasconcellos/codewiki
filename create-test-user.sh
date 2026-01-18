#!/bin/bash

# Script para criar usuário de teste para login

echo "🔐 Criando usuário de teste..."

# Gerar hash da senha "123456" com o SALT do banco
docker exec auditoria-app node -e "
const crypto = require('crypto');
const mysql = require('mysql2/promise');

async function createTestUser() {
  try {
    const pool = mysql.createPool({
      host: 'mysql-master',
      port: 3306,
      user: 'root',
      password: 'rootpassword',
      database: 'auditoria_db'
    });

    // Buscar SALT
    const [configRows] = await pool.query(
      'SELECT valor FROM configuracoes WHERE chave = ? LIMIT 1',
      ['PASSWORD_SALT']
    );

    if (configRows.length === 0) {
      // Criar SALT se não existir
      const SALT = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'INSERT INTO configuracoes (id, chave, valor, descricao) VALUES (UUID(), ?, ?, ?)',
        ['PASSWORD_SALT', SALT, 'Salt para hash de senhas']
      );
      console.log('✓ SALT criado:', SALT);
    }

    const [saltRows] = await pool.query(
      'SELECT valor FROM configuracoes WHERE chave = ? LIMIT 1',
      ['PASSWORD_SALT']
    );
    const SALT = saltRows[0].valor;

    // Criar hash da senha
    const email = 'admin@empresa.com';
    const senha = '123456';
    const combined = \`\${email}:\${senha}:\${SALT}\`;
    const senhaHash = crypto.createHash('sha256').update(combined).digest('hex');

    // Verificar se usuário já existe
    const [existingUser] = await pool.query(
      'SELECT id FROM usuarios_seguranca WHERE login = ?',
      [email]
    );

    if (existingUser.length > 0) {
      // Atualizar senha
      await pool.query(
        'UPDATE usuarios_seguranca SET senha = ?, status = ?, tentativas_login = 0, bloqueado_ate = NULL WHERE login = ?',
        [senhaHash, 'ATIVO', email]
      );
      console.log('✓ Usuário atualizado:', email);
    } else {
      // Criar novo usuário
      const userId = crypto.randomUUID();
      await pool.query(
        \`INSERT INTO usuarios_seguranca (
          id, login, senha, status, 
          data_vigencia_inicial, tentativas_login, 
          created_at, updated_at
        ) VALUES (?, ?, ?, 'ATIVO', NOW(), 0, NOW(), NOW())\`,
        [userId, email, senhaHash]
      );
      console.log('✓ Usuário criado:', email);
    }

    console.log('');
    console.log('📧 E-mail: admin@empresa.com');
    console.log('🔑 Senha: 123456');
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createTestUser();
"

echo ""
echo "✅ Usuário de teste criado com sucesso!"
echo "Acesse http://localhost:5173 para fazer login"
