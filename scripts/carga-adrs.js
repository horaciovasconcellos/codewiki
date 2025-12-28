#!/usr/bin/env node

/**
 * Script de Carga de ADRs (Architectural Decision Records)
 * 
 * Uso:
 *   node scripts/carga-adrs.js --file data-templates/adrs-carga.json
 *   node scripts/carga-adrs.js --file data-templates/adrs.csv --format csv
 *   node scripts/carga-adrs.js --file data-templates/adrs-aplicacoes-exemplo.json --dry-run
 * 
 * Opções:
 *   --file <path>       Arquivo de entrada (JSON ou CSV)
 *   --format <format>   Formato: json (default) ou csv
 *   --dry-run           Apenas valida sem inserir
 *   --api-url <url>     URL da API (default: http://localhost:3000)
 *   --verbose           Modo verboso com logs detalhados
 */

import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';

// Configuração
const args = process.argv.slice(2);
const config = {
  file: getArg('--file'),
  format: getArg('--format', 'json'),
  dryRun: hasArg('--dry-run'),
  apiUrl: getArg('--api-url', 'http://localhost:3000'),
  verbose: hasArg('--verbose')
};

// Validação de argumentos
if (!config.file) {
  console.error('❌ Erro: Arquivo de entrada obrigatório');
  console.log('Uso: node scripts/carga-adrs.js --file <caminho-arquivo>');
  process.exit(1);
}

// Status válidos
const VALID_ADR_STATUS = ['Proposto', 'Aceito', 'Rejeitado', 'Substituído', 'Obsoleto', 'Adiado/Retirado'];
const VALID_APP_STATUS = ['Ativo', 'Inativo', 'Planejado', 'Descontinuado'];

// Funções auxiliares
function getArg(name, defaultValue = null) {
  const index = args.indexOf(name);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
}

function hasArg(name) {
  return args.includes(name);
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    verbose: '🔍'
  }[level] || 'ℹ️';
  
  if (level === 'verbose' && !config.verbose) return;
  console.log(`${prefix} [${timestamp}] ${message}`);
}

// Validações
function validateADR(adr, index) {
  const errors = [];
  
  // Descrição obrigatória
  if (!adr.descricao || adr.descricao.trim() === '') {
    errors.push(`ADR ${index + 1}: Descrição é obrigatória`);
  } else if (adr.descricao.length > 500) {
    errors.push(`ADR ${index + 1}: Descrição excede 500 caracteres (${adr.descricao.length})`);
  }
  
  // Status válido
  if (!adr.status) {
    errors.push(`ADR ${index + 1}: Status é obrigatório`);
  } else if (!VALID_ADR_STATUS.includes(adr.status)) {
    errors.push(`ADR ${index + 1}: Status inválido "${adr.status}". Use: ${VALID_ADR_STATUS.join(', ')}`);
  }
  
  // Validação condicional: Substituído requer ADR substituta
  if (adr.status === 'Substituído' && !adr.adr_substituta_sequencia) {
    errors.push(`ADR ${index + 1}: Status "Substituído" requer adr_substituta_sequencia`);
  }
  
  // Validar aplicações associadas
  if (adr.aplicacoes && Array.isArray(adr.aplicacoes)) {
    adr.aplicacoes.forEach((app, appIndex) => {
      if (!app.aplicacao_sigla && !app.aplicacaoId) {
        errors.push(`ADR ${index + 1}, Aplicação ${appIndex + 1}: aplicacao_sigla ou aplicacaoId obrigatório`);
      }
      
      if (!app.status) {
        errors.push(`ADR ${index + 1}, Aplicação ${appIndex + 1}: status é obrigatório`);
      } else if (!VALID_APP_STATUS.includes(app.status)) {
        errors.push(`ADR ${index + 1}, Aplicação ${appIndex + 1}: status inválido "${app.status}"`);
      }
      
      // Validar datas
      if (app.data_inicio && app.data_termino) {
        const inicio = new Date(app.data_inicio);
        const termino = new Date(app.data_termino);
        if (termino < inicio) {
          errors.push(`ADR ${index + 1}, Aplicação ${appIndex + 1}: data_termino anterior a data_inicio`);
        }
      }
    });
  }
  
  return errors;
}

// Ler arquivo CSV
async function readCSV(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    log(`CSV lido: ${records.length} registros`, 'success');
    return records.map(record => ({
      descricao: record.descricao,
      status: record.status,
      contexto: record.contexto || null,
      decisao: record.decisao || null,
      justificativa: record.justificativa || null,
      consequencias_positivas: record.consequencias_positivas || null,
      consequencias_negativas: record.consequencias_negativas || null,
      riscos: record.riscos || null,
      alternativas_consideradas: record.alternativas_consideradas || null,
      compliance_constitution: record.compliance_constitution || null,
      adr_substituta_sequencia: record.adr_substituta_sequencia ? parseInt(record.adr_substituta_sequencia) : null,
      referencias: record.referencias || null
    }));
  } catch (error) {
    log(`Erro ao ler CSV: ${error.message}`, 'error');
    throw error;
  }
}

// Ler arquivo JSON
async function readJSON(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    const records = Array.isArray(data) ? data : [data];
    
    log(`JSON lido: ${records.length} registros`, 'success');
    return records;
  } catch (error) {
    log(`Erro ao ler JSON: ${error.message}`, 'error');
    throw error;
  }
}

// Buscar aplicação por sigla
async function getAplicacaoIdBySigla(sigla) {
  try {
    const response = await fetch(`${config.apiUrl}/api/aplicacoes`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar aplicações: ${response.status}`);
    }
    
    const aplicacoes = await response.json();
    const aplicacao = aplicacoes.find(a => a.sigla === sigla);
    
    if (!aplicacao) {
      log(`Aplicação não encontrada: ${sigla}`, 'warning');
      return null;
    }
    
    log(`Aplicação encontrada: ${sigla} -> ${aplicacao.id}`, 'verbose');
    return aplicacao.id;
  } catch (error) {
    log(`Erro ao buscar aplicação ${sigla}: ${error.message}`, 'error');
    return null;
  }
}

// Buscar ADR por sequência (para substituição)
async function getADRIdBySequencia(sequencia) {
  try {
    const response = await fetch(`${config.apiUrl}/api/adrs`);
    if (!response.ok) {
      throw new Error(`Erro ao buscar ADRs: ${response.status}`);
    }
    
    const adrs = await response.json();
    const adr = adrs.find(a => a.sequencia === sequencia);
    
    if (!adr) {
      log(`ADR não encontrado com sequência: ${sequencia}`, 'warning');
      return null;
    }
    
    log(`ADR encontrado: sequência ${sequencia} -> ${adr.id}`, 'verbose');
    return adr.id;
  } catch (error) {
    log(`Erro ao buscar ADR sequência ${sequencia}: ${error.message}`, 'error');
    return null;
  }
}

// Processar aplicações associadas
async function processAplicacoes(aplicacoes) {
  if (!aplicacoes || !Array.isArray(aplicacoes)) {
    return [];
  }
  
  const processed = [];
  
  for (const app of aplicacoes) {
    let aplicacaoId = app.aplicacaoId;
    
    // Se tem sigla mas não ID, buscar ID
    if (app.aplicacao_sigla && !aplicacaoId) {
      aplicacaoId = await getAplicacaoIdBySigla(app.aplicacao_sigla);
      if (!aplicacaoId) {
        log(`Pulando aplicação não encontrada: ${app.aplicacao_sigla}`, 'warning');
        continue;
      }
    }
    
    if (!aplicacaoId) {
      log(`Aplicação sem ID ou sigla válida, pulando`, 'warning');
      continue;
    }
    
    processed.push({
      aplicacaoId,
      dataInicio: app.data_inicio || app.dataInicio || null,
      dataTermino: app.data_termino || app.dataTermino || null,
      status: app.status,
      observacoes: app.observacoes || ''
    });
  }
  
  return processed;
}

// Inserir ADR via API
async function insertADR(adr) {
  try {
    // Processar aplicações
    const aplicacoes = await processAplicacoes(adr.aplicacoes);
    
    // Buscar ADR substituta se necessário
    let adrSubstitutaId = null;
    if (adr.adr_substituta_sequencia) {
      adrSubstitutaId = await getADRIdBySequencia(adr.adr_substituta_sequencia);
      if (!adrSubstitutaId) {
        throw new Error(`ADR substituta não encontrada: sequência ${adr.adr_substituta_sequencia}`);
      }
    }
    
    const payload = {
      descricao: adr.descricao,
      status: adr.status,
      contexto: adr.contexto,
      decisao: adr.decisao,
      justificativa: adr.justificativa,
      consequenciasPositivas: adr.consequencias_positivas,
      consequenciasNegativas: adr.consequencias_negativas,
      riscos: adr.riscos,
      alternativasConsideradas: adr.alternativas_consideradas,
      complianceConstitution: adr.compliance_constitution,
      adrSubstitutaId,
      referencias: adr.referencias,
      aplicacoes
    };
    
    log(`Payload: ${JSON.stringify(payload, null, 2)}`, 'verbose');
    
    const response = await fetch(`${config.apiUrl}/api/adrs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    log(`ADR criado: ADR-${result.sequencia} - ${result.descricao}`, 'success');
    return result;
    
  } catch (error) {
    log(`Erro ao inserir ADR "${adr.descricao}": ${error.message}`, 'error');
    throw error;
  }
}

// Função principal
async function main() {
  log('🚀 Iniciando carga de ADRs', 'info');
  log(`Arquivo: ${config.file}`, 'info');
  log(`Formato: ${config.format}`, 'info');
  log(`Dry-run: ${config.dryRun ? 'Sim' : 'Não'}`, 'info');
  log(`API URL: ${config.apiUrl}`, 'info');
  console.log('');
  
  try {
    // Verificar se arquivo existe
    await fs.access(config.file);
    
    // Ler arquivo
    const adrs = config.format === 'csv' 
      ? await readCSV(config.file)
      : await readJSON(config.file);
    
    log(`Total de ADRs: ${adrs.length}`, 'info');
    console.log('');
    
    // Validar todos os ADRs
    log('🔍 Validando ADRs...', 'info');
    const allErrors = [];
    adrs.forEach((adr, index) => {
      const errors = validateADR(adr, index);
      if (errors.length > 0) {
        allErrors.push(...errors);
      }
    });
    
    if (allErrors.length > 0) {
      log('Erros de validação encontrados:', 'error');
      allErrors.forEach(error => console.log(`  ❌ ${error}`));
      process.exit(1);
    }
    
    log('Validação concluída: todos os ADRs válidos', 'success');
    console.log('');
    
    // Se dry-run, parar aqui
    if (config.dryRun) {
      log('🏁 Dry-run concluído. Nenhum dado foi inserido.', 'info');
      process.exit(0);
    }
    
    // Inserir ADRs
    log('💾 Inserindo ADRs...', 'info');
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (let i = 0; i < adrs.length; i++) {
      const adr = adrs[i];
      log(`Processando ${i + 1}/${adrs.length}: ${adr.descricao}`, 'info');
      
      try {
        await insertADR(adr);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          adr: adr.descricao,
          error: error.message
        });
      }
    }
    
    // Resumo
    console.log('');
    log('📊 Resumo da Carga', 'info');
    log(`  ✅ Sucesso: ${results.success}`, 'success');
    log(`  ❌ Falhas: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
    
    if (results.errors.length > 0) {
      console.log('');
      log('Detalhes dos erros:', 'error');
      results.errors.forEach(({ adr, error }) => {
        console.log(`  ❌ ${adr}: ${error}`);
      });
    }
    
    console.log('');
    log('🏁 Carga concluída!', 'success');
    
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log(`Erro fatal: ${error.message}`, 'error');
    if (config.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Executar
main();
