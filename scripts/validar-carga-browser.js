/**
 * SCRIPT DE VALIDAÇÃO - Execute no Console APÓS carregar os dados
 * 
 * Cole este script no console do navegador para validar a carga
 */

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           VALIDAÇÃO DE CARGA - PROCESSOS                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

try {
  // Recuperar dados do localStorage
  const dados = localStorage.getItem('processos-negocio');
  
  if (!dados) {
    console.error('✗ ERRO: Nenhum dado encontrado no localStorage');
    console.log('\n🔄 Execute primeiro o script de carga: carga-processos-browser.js');
    throw new Error('Dados não encontrados');
  }
  
  const processos = JSON.parse(dados);
  
  // Validações
  console.log('📊 ESTATÍSTICAS:\n');
  console.log(`  ✓ Total de processos: ${processos.length}`);
  
  if (processos.length !== 10) {
    console.warn(`  ⚠ Esperado: 10 processos, Encontrado: ${processos.length}`);
  }
  
  // Contar normas
  const totalNormas = processos.reduce((acc, p) => acc + (p.normas?.length || 0), 0);
  console.log(`  ✓ Total de normas: ${totalNormas}`);
  
  if (totalNormas !== 22) {
    console.warn(`  ⚠ Esperado: 22 normas, Encontrado: ${totalNormas}`);
  }
  
  // Validar estrutura
  console.log('\n🔍 VALIDAÇÃO DE ESTRUTURA:\n');
  
  const camposObrigatorios = ['id', 'identificacao', 'descricao', 'areaResponsavel', 
                               'nivelMaturidade', 'frequencia', 'duracaoMedia', 
                               'complexidade', 'normas'];
  
  let erros = 0;
  processos.forEach((proc, idx) => {
    // Validar campos
    camposObrigatorios.forEach(campo => {
      if (!(campo in proc)) {
        console.error(`  ✗ Processo ${idx} (${proc.identificacao || 'sem ID'}): falta campo '${campo}'`);
        erros++;
      }
    });
    
    // Validar formato da sigla
    if (proc.identificacao && !/^[A-Z]{4}-\d{5}$/.test(proc.identificacao)) {
      console.error(`  ✗ Processo ${idx}: sigla inválida '${proc.identificacao}' (esperado: AAAA-00000)`);
      erros++;
    }
  });
  
  if (erros === 0) {
    console.log('  ✓ Todos os campos obrigatórios presentes');
    console.log('  ✓ Todas as siglas no formato correto');
  } else {
    console.error(`\n  ✗ Total de erros encontrados: ${erros}`);
  }
  
  // Listar processos
  console.log('\n📋 PROCESSOS CARREGADOS:\n');
  processos.forEach(p => {
    console.log(`  ${p.identificacao} - ${p.descricao} (${p.normas?.length || 0} normas)`);
  });
  
  // Estatísticas de normas
  const todasNormas = processos.flatMap(p => p.normas || []);
  const normasPorTipo = todasNormas.reduce((acc, n) => {
    acc[n.tipo] = (acc[n.tipo] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📚 NORMAS POR TIPO:\n');
  Object.entries(normasPorTipo).forEach(([tipo, count]) => {
    console.log(`  ${tipo}: ${count}`);
  });
  
  // Resultado final
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  if (erros === 0 && processos.length === 10 && totalNormas === 22) {
    console.log('║  ✓✓✓ VALIDAÇÃO CONCLUÍDA COM SUCESSO! ✓✓✓               ║');
    console.log('║                                                            ║');
    console.log('║  Todos os dados foram carregados corretamente.             ║');
    console.log('║  Você pode usar o sistema normalmente.                     ║');
  } else {
    console.log('║  ⚠ VALIDAÇÃO CONCLUÍDA COM AVISOS                        ║');
    console.log('║                                                            ║');
    console.log('║  Alguns dados podem estar faltando ou incorretos.          ║');
    console.log('║  Revise os avisos acima.                                   ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝');
  
} catch (error) {
  console.error('\n✗ ERRO durante validação:', error.message);
  console.log('\n📝 Dica: Certifique-se de ter executado o script de carga primeiro.');
}
