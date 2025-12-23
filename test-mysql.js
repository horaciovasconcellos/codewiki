import mysql from 'mysql2/promise';

const config = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'rootpass123',
  database: 'auditoria_db'
};

console.log('Tentando conectar com:', config);

try {
  const conn = await mysql.createConnection(config);
  console.log('✓ Conexão bem-sucedida!');
  const [rows] = await conn.execute('SELECT COUNT(*) as total FROM tipos_comunicacao');
  console.log('✓ Query executada:', rows);
  await conn.end();
} catch (error) {
  console.error('✗ Erro:', error.message);
  console.error('Código:', error.code);
  console.error('Errno:', error.errno);
}
