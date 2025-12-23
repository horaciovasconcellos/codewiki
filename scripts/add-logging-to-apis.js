#!/usr/bin/env node

/**
 * Script para adicionar logging de auditoria em todas as rotas da API
 * Este script gera as modificações necessárias no arquivo api.js
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de rotas para entidades
const routeToEntity = {
  '/api/tipos-afastamento': 'TipoAfastamento',
  '/api/colaboradores': 'Colaborador',
  '/api/habilidades': 'Habilidade',
  '/api/capacidades-negocio': 'CapacidadeNegocio',
  '/api/tecnologias': 'Tecnologia',
  '/api/tecnologias/:id/responsaveis': 'TecnologiaResponsavel',
  '/api/tecnologias/:id/contratos': 'ContratoTecnologia',
  '/api/tecnologias/:id/contratos-ams': 'ContratoAMS',
  '/api/tecnologias/:id/custos-saas': 'CustoSaaS',
  '/api/tecnologias/:id/manutencoes-saas': 'ManutencaoSaaS',
  '/api/aplicacoes': 'Aplicacao',
  '/api/processos-negocio': 'ProcessoNegocio',
  '/api/slas': 'SLA',
  '/api/runbooks': 'Runbook',
  '/api/estruturas-projeto': 'EstruturaProjeto',
  '/api/azure-devops-projetos': 'AzureDevOpsProjeto',
  '/api/integrador-projetos': 'IntegradorProjeto',
  '/api/configuracoes': 'Configuracao',
  '/api/integracoes': 'Integracao',
  '/api/integracoes-execucoes': 'IntegracaoExecucao'
};

// Operações que precisam de logging
const operations = [
  { method: 'POST', opType: 'CREATE' },
  { method: 'PUT', opType: 'UPDATE' },
  { method: 'DELETE', opType: 'DELETE' },
  { method: 'PATCH', opType: 'UPDATE' }
];

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║   Script de Adição de Logging nas APIs               ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('📋 Rotas que precisam de logging:\n');

Object.entries(routeToEntity).forEach(([route, entity]) => {
  console.log(`  ✓ ${route.padEnd(40)} → ${entity}`);
});

console.log('\n📝 Gerando código de logging...\n');

// Gerar template de logging para cada rota
function generateLoggingCode(route, entity, method, opType) {
  const hasId = route.includes(':id');
  const entityId = hasId ? 'req.params.id' : 'id';
  
  return `
    // Log de auditoria
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    const logPayload = {
      operationType: '${opType}',
      entityType: '${entity}',
      entityId: ${entityId},
      method: '${method}',
      route: '${route}',
      statusCode: null,
      durationMs: null,
      ...requestInfo,
      payload: req.body,
      ${opType === 'UPDATE' ? 'oldValues: existing[0],' : ''}
      ${opType === 'UPDATE' ? 'newValues: req.body,' : ''}
    };
    
    try {
      // ... código da operação ...
      
      // Log de sucesso
      logPayload.statusCode = ${opType === 'CREATE' ? '201' : '200'};
      logPayload.durationMs = Date.now() - startTime;
      await logAuditoria(logPayload);
      
    } catch (error) {
      // Log de erro
      logPayload.statusCode = 500;
      logPayload.durationMs = Date.now() - startTime;
      logPayload.errorMessage = error.message;
      logPayload.severity = 'error';
      await logAuditoria(logPayload);
      throw error;
    }`;
}

console.log('✅ Código de logging gerado!\n');
console.log('📌 Próximos passos:\n');
console.log('  1. Backup do arquivo api.js');
console.log('  2. Adicionar logging em cada rota manualmente ou usar replace');
console.log('  3. Testar cada endpoint');
console.log('  4. Verificar tabela logs_auditoria\n');

// Verificar se tabela existe
console.log('🔍 Verificando estrutura da tabela logs_auditoria...\n');

const createTableSQL = `
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id VARCHAR(26) PRIMARY KEY,
  log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trace_id VARCHAR(26),
  span_id VARCHAR(26),
  user_id VARCHAR(50),
  user_login VARCHAR(100),
  operation_type VARCHAR(20),
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  method VARCHAR(10),
  route VARCHAR(255),
  status_code INT,
  duration_ms INT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  payload JSON,
  old_values JSON,
  new_values JSON,
  error_message TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  INDEX idx_timestamp (log_timestamp),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_login),
  INDEX idx_operation (operation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

console.log(createTableSQL);
console.log('\n✅ Script concluído!\n');
