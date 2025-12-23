#!/usr/bin/env node

/**
 * Script de teste para validar a estrutura dos dados
 * Este script NÃO carrega no navegador - apenas valida o JSON
 */

const processosData = [
  {
    id: "admn-00001",
    identificacao: "ADMN-00001",
    descricao: "Gestão de Contratos Administrativos",
    areaResponsavel: "Administração",
    nivelMaturidade: "Inicial",
    frequencia: "Ad-Hoc",
    duracaoMedia: 8,
    complexidade: "Média",
    normas: [
      {
        id: "norma-iso9001-001",
        nome: "ISO 9001",
        tipo: "Norma Técnica",
        descricao: "Sistema de Gestão da Qualidade",
        itemNorma: "Cláusula 8.4",
        dataInicio: "2024-01-15",
        dataTermino: null,
        obrigatoriedade: "Obrigatória",
        status: "Ativo"
      }
    ]
  }
];

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        VALIDAÇÃO DA ESTRUTURA DE DADOS                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Validar estrutura
let valid = true;
const camposObrigatorios = ['id', 'identificacao', 'descricao', 'areaResponsavel', 'nivelMaturidade', 'frequencia', 'duracaoMedia', 'complexidade', 'normas'];

processosData.forEach((proc, idx) => {
  camposObrigatorios.forEach(campo => {
    if (!(campo in proc)) {
      console.error(`✗ Processo ${idx}: falta campo '${campo}'`);
      valid = false;
    }
  });
  
  if (proc.normas && proc.normas.length > 0) {
    proc.normas.forEach((norma, nIdx) => {
      const camposNorma = ['id', 'nome', 'tipo', 'descricao', 'itemNorma', 'dataInicio', 'obrigatoriedade', 'status'];
      camposNorma.forEach(campo => {
        if (!(campo in norma)) {
          console.error(`✗ Processo ${idx}, Norma ${nIdx}: falta campo '${campo}'`);
          valid = false;
        }
      });
    });
  }
});

if (valid) {
  console.log('✓ Estrutura de dados válida!');
  console.log(`✓ Total de processos: ${processosData.length}`);
  console.log(`✓ Total de normas: ${processosData.reduce((acc, p) => acc + p.normas.length, 0)}`);
  console.log('\n✓ JSON pode ser carregado no localStorage');
  console.log('\nPróximo passo: Cole o script no Console do navegador');
} else {
  console.error('\n✗ Estrutura inválida! Corrija os erros acima.');
  process.exit(1);
}
