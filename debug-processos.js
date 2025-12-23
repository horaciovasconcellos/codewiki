// SCRIPT DE DEPURAÇÃO - Execute no console de http://localhost:5173
// Pressione F12 > Console > Cole este script

console.log('='.repeat(60));
console.log('DIAGNÓSTICO DE PROCESSOS DE NEGÓCIO');
console.log('='.repeat(60));

// 1. Verificar localStorage
const dadosRaw = localStorage.getItem('processos-negocio');
console.log('\n1. DADOS NO LOCALSTORAGE:');
console.log('Existe:', dadosRaw !== null);
console.log('Tamanho:', dadosRaw ? new Blob([dadosRaw]).size + ' bytes' : 'N/A');

if (!dadosRaw) {
  console.error('❌ PROBLEMA: Nenhum dado no localStorage!');
  console.log('📝 SOLUÇÃO: Acesse http://localhost:5173/carga-processos.html');
} else {
  try {
    const processos = JSON.parse(dadosRaw);
    console.log('✅ JSON válido');
    console.log('Total de processos:', processos.length);
    
    // 2. Verificar estrutura
    console.log('\n2. ESTRUTURA DOS DADOS:');
    if (processos.length > 0) {
      const primeiro = processos[0];
      console.log('Campos do processo:', Object.keys(primeiro));
      console.log('Primeiro processo:', primeiro);
      
      if (primeiro.normas && primeiro.normas.length > 0) {
        console.log('Campos da norma:', Object.keys(primeiro.normas[0]));
        console.log('Primeira norma:', primeiro.normas[0]);
      }
    }
    
    // 3. Validar tipos
    console.log('\n3. VALIDAÇÃO DE TIPOS:');
    const tiposNormaValidos = [
      'Norma Legal',
      'Norma Técnica',
      'Norma Reguladora',
      'Norma Setorial',
      'Norma Organizacional',
      'Norma Contratual',
      'Regulamentação Internacional'
    ];
    
    const obrigatoriedadeValida = [
      'Não obrigatório',
      'Recomendado',
      'Obrigatório'
    ];
    
    let erros = [];
    processos.forEach((p, i) => {
      // Validar campos do processo
      if (!p.id) erros.push(`Processo ${i}: falta campo 'id'`);
      if (!p.identificacao) erros.push(`Processo ${i}: falta campo 'identificacao'`);
      if (!p.descricao) erros.push(`Processo ${i}: falta campo 'descricao'`);
      if (!p.nivelMaturidade) erros.push(`Processo ${i}: falta campo 'nivelMaturidade'`);
      if (!p.areaResponsavel) erros.push(`Processo ${i}: falta campo 'areaResponsavel'`);
      if (!p.frequencia) erros.push(`Processo ${i}: falta campo 'frequencia'`);
      if (!p.complexidade) erros.push(`Processo ${i}: falta campo 'complexidade'`);
      if (!p.normas) erros.push(`Processo ${i}: falta campo 'normas'`);
      
      // Validar normas
      if (p.normas && Array.isArray(p.normas)) {
        p.normas.forEach((n, j) => {
          if (!n.id) erros.push(`Processo ${i}, Norma ${j}: falta 'id'`);
          if (!n.tipoNorma) erros.push(`Processo ${i}, Norma ${j}: falta 'tipoNorma'`);
          if (n.tipoNorma && !tiposNormaValidos.includes(n.tipoNorma)) {
            erros.push(`Processo ${i}, Norma ${j}: tipoNorma inválido '${n.tipoNorma}'`);
          }
          if (!n.obrigatoriedade) erros.push(`Processo ${i}, Norma ${j}: falta 'obrigatoriedade'`);
          if (n.obrigatoriedade && !obrigatoriedadeValida.includes(n.obrigatoriedade)) {
            erros.push(`Processo ${i}, Norma ${j}: obrigatoriedade inválida '${n.obrigatoriedade}'`);
          }
          if (!n.itemNorma) erros.push(`Processo ${i}, Norma ${j}: falta 'itemNorma'`);
          if (!n.status) erros.push(`Processo ${i}, Norma ${j}: falta 'status'`);
        });
      }
    });
    
    if (erros.length > 0) {
      console.error('❌ ERROS ENCONTRADOS:', erros.length);
      erros.forEach(e => console.error('  -', e));
    } else {
      console.log('✅ Todos os dados estão válidos!');
    }
    
    // 4. Listar processos
    console.log('\n4. LISTA DE PROCESSOS:');
    processos.forEach((p, i) => {
      console.log(`${i + 1}. ${p.identificacao} - ${p.descricao}`);
      console.log(`   Área: ${p.areaResponsavel}, Normas: ${p.normas?.length || 0}`);
    });
    
    // 5. Estatísticas
    console.log('\n5. ESTATÍSTICAS:');
    const totalNormas = processos.reduce((acc, p) => acc + (p.normas?.length || 0), 0);
    console.log('Total de processos:', processos.length);
    console.log('Total de normas:', totalNormas);
    
    const tipoNormaCount = {};
    processos.forEach(p => {
      if (p.normas) {
        p.normas.forEach(n => {
          tipoNormaCount[n.tipoNorma] = (tipoNormaCount[n.tipoNorma] || 0) + 1;
        });
      }
    });
    console.log('Normas por tipo:', tipoNormaCount);
    
  } catch (error) {
    console.error('❌ ERRO ao parsear JSON:', error);
    console.log('Primeiros 200 caracteres:', dadosRaw.substring(0, 200));
  }
}

// 6. Verificar se a view está montada
console.log('\n6. VERIFICAÇÃO DA VIEW:');
const hasProcessosView = document.querySelector('[class*="processos"]') !== null;
console.log('View de processos montada:', hasProcessosView ? '✅ Sim' : '❌ Não');

console.log('\n' + '='.repeat(60));
console.log('FIM DO DIAGNÓSTICO');
console.log('='.repeat(60));
