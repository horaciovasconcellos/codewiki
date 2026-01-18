const crypto = require('crypto');
const SALT = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

function hashPassword(login, senha, salt) {
  const combined = login + senha + salt;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

console.log('=== TESTE ADMIN ===');
console.log('Hash esperado:', '79e2cc0d2d29ce310aca954209aa267cea09b4694303e5e9c45d231431b96415');
console.log('Hash senha123:', hashPassword('admin@empresa.com', 'senha123', SALT));
console.log('Hash admin123:', hashPassword('admin@empresa.com', 'admin123', SALT));
console.log('Hash Admin123:', hashPassword('admin@empresa.com', 'Admin123', SALT));

console.log('\n=== TESTE TESTE@GMAIL.COM ===');
console.log('Hash esperado:', 'f8720de21367854d4ddb8b122ecc3dfcfe4174a27011560223fca90fb35d2704');
console.log('Hash senha123:', hashPassword('teste@gmail.com', 'senha123', SALT));
console.log('Hash teste123:', hashPassword('teste@gmail.com', 'teste123', SALT));
console.log('Hash Teste123:', hashPassword('teste@gmail.com', 'Teste123', SALT));
