#!/usr/bin/env node

/**
 * Script Node.js para carga em lote de habilidades
 * Uso: node load-habilidades.js [arquivo.json]
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Arquivo JSON (padrão ou passado como argumento)
const jsonFile = process.argv[2] || resolve(__dirname, '../data-templates/habilidades-exemplo.json');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

async function carregarHabilidades() {
  console.log(`${colors.blue}==========================================`);
  console.log('CARGA EM LOTE DE HABILIDADES');
  console.log(`==========================================${colors.reset}\n`);
  
  // Ler arquivo JSON
  let habilidades;
  try {
    const fileContent = readFileSync(jsonFile, 'utf-8');
    habilidades = JSON.parse(fileContent);
    log.info(`Arquivo carregado: ${jsonFile}`);
    log.info(`Total de registros: ${habilidades.length}\n`);
  } catch (error) {
    log.error(`Erro ao ler arquivo: ${error.message}`);
    process.exit(1);
  }

  // Verificar se servidor está disponível
  try {
    const healthCheck = await fetch(`${API_URL}/health`);
    if (!healthCheck.ok) throw new Error('Servidor não responde');
    log.success('Servidor disponível\n');
  } catch (error) {
    log.error(`Servidor não está rodando em ${API_URL}`);
    log.info('Inicie com: docker-compose up -d');
    process.exit(1);
  }

  // Processar cada habilidade
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const habilidade of habilidades) {
    const { sigla, descricao, dominio, subcategoria } = habilidade;
    
    process.stdout.write(`Criando: ${sigla}... `);
    
    try {
      const response = await fetch(`${API_URL}/api/habilidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habilidade)
      });

      if (response.status === 201) {
        log.success('Criada');
        success++;
      } else if (response.status === 409) {
        log.warning('Já existe');
        skipped++;
      } else {
        const errorData = await response.json();
        log.error(`${response.status} - ${errorData.error || 'Erro desconhecido'}`);
        failed++;
      }
    } catch (error) {
      log.error(error.message);
      failed++;
    }
  }

  // Resumo
  console.log(`\n${colors.blue}==========================================`);
  console.log('RESUMO');
  console.log(`==========================================${colors.reset}`);
  console.log(`Total processados: ${habilidades.length}`);
  log.success(`Sucesso: ${success}`);
  log.warning(`Já existiam: ${skipped}`);
  log.error(`Falhas: ${failed}`);

  // Listar todas as habilidades
  console.log(`\n${colors.blue}==========================================`);
  console.log('Habilidades cadastradas:');
  console.log(`==========================================${colors.reset}`);
  
  try {
    const response = await fetch(`${API_URL}/api/habilidades`);
    const todasHabilidades = await response.json();
    
    todasHabilidades.forEach(h => {
      console.log(`  ${h.sigla.padEnd(15)} - ${h.descricao}`);
    });
    
    console.log(`\nTotal: ${todasHabilidades.length} habilidades`);
  } catch (error) {
    log.error(`Erro ao listar habilidades: ${error.message}`);
  }

  console.log(`\n${colors.green}Carga concluída!${colors.reset}\n`);
}

// Executar
carregarHabilidades().catch(error => {
  log.error(`Erro fatal: ${error.message}`);
  process.exit(1);
});
