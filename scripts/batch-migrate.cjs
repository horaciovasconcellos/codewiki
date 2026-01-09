const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para migração em lote de múltiplos domínios
 */

// Lista de domínios pré-definidos para migração
const domains = [
  { name: 'colaboradores', table: 'colaboradores' },
  { name: 'aplicacoes', table: 'aplicacoes' },
  { name: 'habilidades', table: 'habilidades' },
  { name: 'projetos', table: 'projetos' },
  { name: 'processos', table: 'processos_negocio' },
  { name: 'capacidades', table: 'capacidades_negocio' }
];

console.log('🚀 MIGRAÇÃO EM LOTE DE DOMÍNIOS\n');
console.log(`📦 Total de domínios: ${domains.length}\n`);

const results = {
  success: [],
  failed: [],
  skipped: []
};

function checkIfExists(domain) {
  const modelPath = `server/src/models/${domain.name}.model.js`;
  const servicePath = `server/src/services/${domain.name}.service.js`;
  const controllerPath = `server/src/controllers/${domain.name}.controller.js`;
  
  return fs.existsSync(modelPath) || 
         fs.existsSync(servicePath) || 
         fs.existsSync(controllerPath);
}

function migrateDomain(domain) {
  console.log(`\n🔄 Migrando domínio: ${domain.name}`);
  console.log(`   Tabela: ${domain.table}`);
  
  if (checkIfExists(domain)) {
    console.log(`   ⚠️  Arquivos já existem - pulando`);
    results.skipped.push(domain.name);
    return;
  }
  
  try {
    // Simular entrada do usuário via stdin
    const input = `${domain.name}\n${domain.table}\n`;
    
    execSync(`node scripts/auto-migrate.cjs`, {
      input: input,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });
    
    console.log(`   ✅ Migração concluída`);
    results.success.push(domain.name);
  } catch (error) {
    console.error(`   ❌ Erro na migração: ${error.message}`);
    results.failed.push(domain.name);
  }
}

// Executar migrações
domains.forEach(migrateDomain);

// Relatório final
console.log('\n' + '='.repeat(50));
console.log('📊 RELATÓRIO DE MIGRAÇÃO');
console.log('='.repeat(50));
console.log(`✅ Sucesso: ${results.success.length}`);
if (results.success.length > 0) {
  results.success.forEach(name => console.log(`   - ${name}`));
}

console.log(`\n⚠️  Pulados: ${results.skipped.length}`);
if (results.skipped.length > 0) {
  results.skipped.forEach(name => console.log(`   - ${name}`));
}

console.log(`\n❌ Falhas: ${results.failed.length}`);
if (results.failed.length > 0) {
  results.failed.forEach(name => console.log(`   - ${name}`));
}

console.log('\n' + '='.repeat(50));
console.log('\n📋 Próximos passos:');
console.log('1. Revisar arquivos gerados');
console.log('2. Ajustar modelos conforme necessário');
console.log('3. Criar/ajustar tabelas no banco de dados');
console.log('4. Executar testes: npm test');
console.log('5. Testar API: npm run dev\n');

process.exit(results.failed.length > 0 ? 1 : 0);
