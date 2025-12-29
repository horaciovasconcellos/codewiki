#!/usr/bin/env node

/**
 * Script de teste para validar a funcionalidade de templates do Azure DevOps
 * 
 * Este script testa:
 * 1. Upload de templates
 * 2. Listagem de templates
 * 3. Busca de template específico
 * 4. Deleção de templates
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = `${API_BASE_URL}/api/azure-devops/templates`;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Template de exemplo
const sampleTemplate = `# Template de Teste
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Test
    displayName: 'Test Stage'
    jobs:
      - job: TestJob
        displayName: 'Test Job'
        steps:
          - script: echo "Testing..."
            displayName: 'Test'
`;

/**
 * Teste 1: Upload de template
 */
async function testUploadTemplate(templateType) {
  logInfo(`\nTestando upload de template: ${templateType}`);
  
  try {
    // Criar arquivo temporário
    const tempFileName = `test-${templateType}-${Date.now()}.yml`;
    const tempFilePath = path.join('/tmp', tempFileName);
    fs.writeFileSync(tempFilePath, sampleTemplate);

    // Criar FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('templateType', templateType);

    // Fazer upload
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Limpar arquivo temporário
    fs.unlinkSync(tempFilePath);

    if (response.ok && result.success) {
      logSuccess(`Template ${templateType} carregado com sucesso`);
      return true;
    } else {
      logError(`Falha ao carregar template: ${result.message || result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro no upload: ${error.message}`);
    return false;
  }
}

/**
 * Teste 2: Listar todos os templates
 */
async function testListTemplates() {
  logInfo('\nTestando listagem de templates');
  
  try {
    const response = await fetch(ENDPOINT);
    const result = await response.json();

    if (response.ok && result.success) {
      logSuccess(`Encontrados ${result.data.length} templates`);
      result.data.forEach(template => {
        log(`  • ${template.template_type}: ${template.file_name} (${template.content_size} bytes)`, 'blue');
      });
      return true;
    } else {
      logError(`Falha ao listar templates: ${result.message || result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro na listagem: ${error.message}`);
    return false;
  }
}

/**
 * Teste 3: Buscar template específico
 */
async function testGetTemplate(templateType) {
  logInfo(`\nTestando busca de template: ${templateType}`);
  
  try {
    const response = await fetch(`${ENDPOINT}/${templateType}`);
    const result = await response.json();

    if (response.ok && result.success) {
      logSuccess(`Template ${templateType} encontrado`);
      log(`  Nome: ${result.data.file_name}`, 'blue');
      log(`  Tamanho: ${result.data.template_content.length} bytes`, 'blue');
      log(`  Criado em: ${result.data.created_at}`, 'blue');
      log(`  Atualizado em: ${result.data.updated_at}`, 'blue');
      return true;
    } else {
      logError(`Falha ao buscar template: ${result.message || result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro na busca: ${error.message}`);
    return false;
  }
}

/**
 * Teste 4: Deletar template
 */
async function testDeleteTemplate(templateType) {
  logInfo(`\nTestando deleção de template: ${templateType}`);
  
  try {
    const response = await fetch(`${ENDPOINT}/${templateType}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (response.ok && result.success) {
      logSuccess(`Template ${templateType} deletado com sucesso`);
      return true;
    } else {
      logError(`Falha ao deletar template: ${result.message || result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro na deleção: ${error.message}`);
    return false;
  }
}

/**
 * Teste 5: Validação de arquivo inválido
 */
async function testInvalidFile() {
  logInfo('\nTestando validação de arquivo inválido');
  
  try {
    // Criar arquivo com extensão inválida
    const tempFileName = `test-invalid-${Date.now()}.txt`;
    const tempFilePath = path.join('/tmp', tempFileName);
    fs.writeFileSync(tempFilePath, 'invalid content');

    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('templateType', 'pullRequest');

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Limpar arquivo temporário
    fs.unlinkSync(tempFilePath);

    if (!response.ok) {
      logSuccess('Validação de arquivo inválido funcionou corretamente');
      return true;
    } else {
      logWarning('Sistema aceitou arquivo inválido (verificar validação)');
      return false;
    }
  } catch (error) {
    logError(`Erro no teste: ${error.message}`);
    return false;
  }
}

/**
 * Teste 6: Upload de template Markdown
 */
async function testUploadMarkdownTemplate() {
  logInfo('\nTestando upload de template Markdown');
  
  try {
    const markdownContent = `# Pipeline Template
## Description
This is a test markdown template for documentation.

## Stages
1. Build
2. Test
3. Deploy
`;
    
    // Criar arquivo temporário
    const tempFileName = `test-markdown-${Date.now()}.md`;
    const tempFilePath = path.join('/tmp', tempFileName);
    fs.writeFileSync(tempFilePath, markdownContent);

    // Criar FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('templateType', 'main');

    // Fazer upload
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Limpar arquivo temporário
    fs.unlinkSync(tempFilePath);

    if (response.ok && result.success) {
      logSuccess('Template Markdown carregado com sucesso');
      return true;
    } else {
      logError(`Falha ao carregar template Markdown: ${result.message || result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Erro no upload de Markdown: ${error.message}`);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  log('\n================================', 'bright');
  log('  Testes de Templates Azure DevOps', 'bright');
  log('================================\n', 'bright');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Upload Pull Request', fn: () => testUploadTemplate('pullRequest') },
    { name: 'Upload Hotfix', fn: () => testUploadTemplate('hotfix') },
    { name: 'Upload Main', fn: () => testUploadTemplate('main') },
    { name: 'Upload Develop', fn: () => testUploadTemplate('develop') },
    { name: 'Listar Templates', fn: testListTemplates },
    { name: 'Buscar Template Pull Request', fn: () => testGetTemplate('pullRequest') },
    { name: 'Buscar Template Hotfix', fn: () => testGetTemplate('hotfix') },
    { name: 'Validação de Arquivo Inválido', fn: testInvalidFile },
    { name: 'Upload Template Markdown', fn: testUploadMarkdownTemplate },
    { name: 'Deletar Template Pull Request', fn: () => testDeleteTemplate('pullRequest') },
    { name: 'Deletar Template Hotfix', fn: () => testDeleteTemplate('hotfix') },
    { name: 'Deletar Template Main (Markdown)', fn: () => testDeleteTemplate('main') },
  ];

  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay entre testes
  }

  // Resumo
  log('\n================================', 'bright');
  log('  Resumo dos Testes', 'bright');
  log('================================', 'bright');
  log(`Total: ${results.total}`, 'blue');
  log(`Passaram: ${results.passed}`, 'green');
  log(`Falharam: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'blue');
  log('================================\n', 'bright');

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Verificar se o servidor está rodando
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      logSuccess('Servidor está rodando');
      return true;
    }
  } catch (error) {
    logError(`Servidor não está acessível em ${API_BASE_URL}`);
    logInfo('Por favor, inicie o servidor antes de executar os testes');
    return false;
  }
}

// Executar testes
(async () => {
  logInfo(`Verificando servidor em ${API_BASE_URL}...`);
  
  // Comentar a verificação do health check se não existir endpoint
  // const serverRunning = await checkServer();
  // if (!serverRunning) {
  //   process.exit(1);
  // }

  await runAllTests();
})();
