import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { ulid } from 'ulid';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import Joi from 'joi';
import winston from 'winston';
import promClient from 'prom-client';
import AzureDevOpsService from './azure-devops-service.js';

const execAsync = promisify(exec);
const app = express();

// ==================== PROMETHEUS METRICS ====================
// Configurar Prometheus client
const register = new promClient.Registry();

// Coletar métricas padrão do Node.js (CPU, memória, event loop, etc)
promClient.collectDefaultMetrics({ 
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Métricas customizadas
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestsTotal);

const dbPoolConnections = new promClient.Gauge({
  name: 'db_pool_connections_active',
  help: 'Number of active database connections'
});
register.registerMetric(dbPoolConnections);

const cacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name']
});
register.registerMetric(cacheHits);

const cacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name']
});
register.registerMetric(cacheMisses);

const azureApiCalls = new promClient.Counter({
  name: 'azure_api_calls_total',
  help: 'Total number of Azure DevOps API calls',
  labelNames: ['operation', 'status']
});
register.registerMetric(azureApiCalls);

// Middleware para coletar métricas de requisições
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status: res.statusCode };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
});

// ==================== END PROMETHEUS METRICS ====================

// Configurar cache (TTL: 5 minutos)
const configCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Configurar logger estruturado
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })] 
      : []
    )
  ]
});

// Configurar multer para upload de arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF ou DOCX são permitidos'));
    }
  }
});

// Configurar multer para upload de templates YAML/Markdown
const uploadYaml = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 // 500KB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.yaml', '.yml', '.md'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos YAML (.yaml, .yml) ou Markdown (.md) são permitidos'));
    }
  }
});

// Configurar multer para upload de scripts
const uploadScript = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = 'uploads/scripts/';
      // Garantir que o diretório existe
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + crypto.randomInt(0, 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.sh', '.ps1', '.py', '.js', '.ts', '.sql', '.yaml', '.yml', '.json', '.xml', '.txt'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido para scripts'));
    }
  }
});

// Garantir que os diretórios de upload existam
const uploadsDir = 'uploads';
const scriptsDir = path.join(uploadsDir, 'scripts');

[uploadsDir, scriptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Diretório criado: ${dir}`);
  }
});

const PORT = process.env.API_PORT || process.env.PORT || 3000;

// Pool de conexões
let pool;

// Healthcheck endpoint - deve vir antes de outras rotas
app.get('/health', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ status: 'error', database: 'not_initialized' });
  }
  
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Endpoint para verificar status do Master
app.get('/api/sincronismo/master', async (req, res) => {
  try {
    const [masterStatus] = await pool.query('SHOW MASTER STATUS');
    const [processlist] = await pool.query('SHOW PROCESSLIST');
    const [variables] = await pool.query("SHOW VARIABLES LIKE 'server_id'");
    const [binlogStatus] = await pool.query("SHOW VARIABLES LIKE 'log_bin'");
    
    const slaveConnections = processlist.filter(proc => 
      proc.Command === 'Binlog Dump' || proc.User === 'repl_user'
    );
    
    res.json({
      status: 'ok',
      server_id: variables[0]?.Value || 'N/A',
      binlog_enabled: binlogStatus[0]?.Value === 'ON',
      master_status: masterStatus[0] || null,
      slave_connections: slaveConnections.length,
      slaves: slaveConnections.map(slave => ({
        host: slave.Host,
        state: slave.State,
        time: slave.Time
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter status do master:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Endpoint para verificar status do Slave
app.get('/api/sincronismo/slave', async (req, res) => {
  try {
    // Conectar ao slave (porta 3306 dentro do container Docker)
    const slavePool = mysql.createPool({
      host: process.env.MYSQL_SLAVE_HOST || 'mysql-slave',
      port: process.env.MYSQL_SLAVE_PORT || 3306,
      user: process.env.MYSQL_USER || 'app_user',
      password: process.env.MYSQL_APP_PASSWORD || 'apppass123',
      database: process.env.MYSQL_DATABASE || 'auditoria_db',
      charset: 'utf8mb4',
      connectionLimit: 2
    });
    
    const [slaveStatus] = await slavePool.query('SHOW SLAVE STATUS');
    const [variables] = await slavePool.query("SHOW VARIABLES LIKE 'server_id'");
    
    await slavePool.end();
    
    if (!slaveStatus || slaveStatus.length === 0) {
      return res.json({
        status: 'not_configured',
        message: 'Replicação não configurada neste servidor',
        timestamp: new Date().toISOString()
      });
    }
    
    const slave = slaveStatus[0];
    const isReplicating = slave.Slave_IO_Running === 'Yes' && slave.Slave_SQL_Running === 'Yes';
    
    res.json({
      status: isReplicating ? 'ok' : 'error',
      server_id: variables[0]?.Value || 'N/A',
      slave_io_running: slave.Slave_IO_Running,
      slave_sql_running: slave.Slave_SQL_Running,
      seconds_behind_master: slave.Seconds_Behind_Master,
      master_host: slave.Master_Host,
      master_port: slave.Master_Port,
      master_log_file: slave.Master_Log_File,
      read_master_log_pos: slave.Read_Master_Log_Pos,
      relay_log_file: slave.Relay_Log_File,
      relay_log_pos: slave.Relay_Log_Pos,
      last_io_error: slave.Last_IO_Error || '',
      last_sql_error: slave.Last_SQL_Error || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao obter status do slave:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      details: 'Não foi possível conectar ao slave. Verifique se o servidor está rodando.'
    });
  }
});

// Endpoint para testar replicação (inserir dado no master e verificar no slave)
app.post('/api/sincronismo/test', async (req, res) => {
  try {
    const testMessage = `Teste de sincronismo - ${new Date().toISOString()}`;
    
    // Inserir no master
    await pool.query(
      'INSERT INTO replication_test (message) VALUES (?)',
      [testMessage]
    );
    
    // Aguardar 2 segundos para replicação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar no slave
    const slavePool = mysql.createPool({
      host: process.env.MYSQL_SLAVE_HOST || 'mysql-slave',
      port: process.env.MYSQL_SLAVE_PORT || 3306,
      user: process.env.MYSQL_USER || 'app_user',
      password: process.env.MYSQL_APP_PASSWORD || 'apppass123',
      database: process.env.MYSQL_DATABASE || 'auditoria_db',
      charset: 'utf8mb4',
      connectionLimit: 2
    });
    
    const [rows] = await slavePool.query(
      'SELECT * FROM replication_test WHERE message = ? ORDER BY created_at DESC LIMIT 1',
      [testMessage]
    );
    
    await slavePool.end();
    
    const success = rows && rows.length > 0;
    
    res.json({
      status: success ? 'ok' : 'error',
      test_message: testMessage,
      replicated: success,
      replication_data: success ? rows[0] : null,
      message: success 
        ? 'Teste de replicação bem-sucedido! Dados foram replicados corretamente.' 
        : 'Falha na replicação! Dados não foram encontrados no slave.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao testar replicação:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// Configuração do MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-master',
  port: process.env. MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'app_user',
  password:  process.env.MYSQL_PASSWORD || 'apppass123',
  database: process.env. MYSQL_DATABASE || 'auditoria_db',
  charset: 'utf8mb4',
  authPlugins: {
    sha256_password: () => () => require('mysql2/lib/auth_plugins').authPlugins.caching_sha2_password  
  }
};

console.log('📋 Configuração do banco:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Helper para converter data ISO para formato MySQL DATE (YYYY-MM-DD)
function formatDateForMySQL(dateString) {
  if (!dateString) return null;
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  // Se está no formato ISO (com timezone), extrai apenas a data
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  return dateString;
}

// Helper para buscar configurações do Azure DevOps (com cache)
async function getAzureDevOpsConfig() {
  const cacheKey = 'azure-devops-config';
  
  // Verificar cache primeiro
  const cachedConfig = configCache.get(cacheKey);
  if (cachedConfig) {
    logger.debug('Azure DevOps config retrieved from cache');
    cacheHits.inc({ cache_name: 'azure_config' });
    return cachedConfig;
  }

  logger.debug('Fetching Azure DevOps config from database');
  cacheMisses.inc({ cache_name: 'azure_config' });
  
  const [configRows] = await pool.query(
    "SELECT chave, valor FROM configuracoes WHERE chave = 'integration-config'"
  );
  
  if (configRows.length === 0) {
    logger.error('Azure DevOps config not found in database');
    throw new Error('AZURE_CONFIG_NOT_FOUND: Configurações de integração não encontradas');
  }

  const integrationConfig = JSON.parse(configRows[0].valor);
  const azureConfig = integrationConfig.azureDevOps;

  if (!azureConfig || !azureConfig.urlOrganizacao || !azureConfig.personalAccessToken) {
    logger.error('Azure DevOps config incomplete', { azureConfig });
    throw new Error('AZURE_CONFIG_INCOMPLETE: Configurações do Azure DevOps incompletas');
  }

  // Extrair nome da organização da URL
  const urlMatch = azureConfig.urlOrganizacao.match(/dev\.azure\.com\/([^\/]+)/);
  const organization = urlMatch ? urlMatch[1] : azureConfig.urlOrganizacao;
  const pat = azureConfig.personalAccessToken;

  const config = { organization, pat, config: azureConfig };
  
  // Armazenar no cache
  configCache.set(cacheKey, config);
  logger.info('Azure DevOps config cached successfully', { organization });

  return config;
}

// Helper para tratamento de erros do Azure DevOps
function handleAzureError(error) {
  const errorMessage = error.message || '';
  
  logger.error('Azure DevOps error occurred', { 
    message: errorMessage,
    stack: error.stack 
  });
  
  if (errorMessage.includes('AZURE_CONFIG_NOT_FOUND')) {
    return {
      status: 400,
      error: 'Configurações de integração não encontradas',
      message: 'Configure as integrações nas Configurações',
      code: 'AZURE_CONFIG_NOT_FOUND'
    };
  }
  
  if (errorMessage.includes('AZURE_CONFIG_INCOMPLETE')) {
    return {
      status: 400,
      error: 'Configurações do Azure DevOps incompletas',
      message: 'Configure a URL da organização e o token PAT nas Configurações de Integração',
      code: 'AZURE_CONFIG_INCOMPLETE'
    };
  }
  
  return {
    status: 500,
    error: 'Erro ao processar requisição',
    message: error.message,
    code: 'INTERNAL_ERROR'
  };
}

// Helper para converter Date do MySQL para formato ISO (YYYY-MM-DD)
function formatDateToISO(date) {
  if (!date) return null;
  
  // Se já é uma string no formato YYYY-MM-DD, retorna
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Se é Date object ou outra string, converte
  const dateObj = date instanceof Date ? date : new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Função para inicializar conexão
async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      charset: 'utf8mb4',
      charsetNumber: 255,
      supportBigNumbers: true,
      bigNumberStrings: true,
      connectionLimit: 10,
      queueLimit: 0,
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    
    // Testar conexão
    const connection = await pool.getConnection();
    await connection.query("SET NAMES utf8mb4");
    await connection.query("SET CHARACTER SET utf8mb4");
    console.log('✓ Conectado ao MySQL');
    
    // Criar tabela de logs de acesso se não existir
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS logs_acesso (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          usuario_id VARCHAR(36),
          email VARCHAR(255) NOT NULL,
          tipo_evento ENUM('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'BLOCKED') NOT NULL,
          ip_origem VARCHAR(45),
          user_agent TEXT,
          sucesso TINYINT(1) DEFAULT 1,
          detalhes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_usuario (usuario_id),
          INDEX idx_email (email),
          INDEX idx_tipo (tipo_evento),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ Tabela logs_acesso verificada/criada');
    } catch (err) {
      console.log('⚠ Erro ao criar tabela logs_acesso:', err.message);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MySQL:', error.message);
    console.log('  Tentando novamente em 5 segundos...');
    return false;
  }
}

// Wrapper para getConnection com charset garantido
const getUtf8Connection = async () => {
  const connection = await pool.getConnection();
  await connection.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
  await connection.query('SET CHARACTER SET utf8mb4');
  await connection.query('SET character_set_connection=utf8mb4');
  await connection.query('SET character_set_results=utf8mb4');
  await connection.query('SET character_set_client=utf8mb4');
  await connection.query('SET collation_connection=utf8mb4_unicode_ci');
  return connection;
};

// Middleware
// CORS configurado com origens específicas para segurança
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Aumentado para 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static('uploads'));

// Função de logging para auditoria
async function logAuditoria({
  operationType,
  entityType,
  entityId = null,
  method = null,
  route = null,
  statusCode = null,
  durationMs = null,
  userId = 'system',
  userLogin = 'system',
  ipAddress = null,
  userAgent = null,
  payload = null,
  oldValues = null,
  newValues = null,
  errorMessage = null,
  severity = 'info',
  traceId = null,
  spanId = null
}) {
  try {
    const logId = ulid();
    const logTimestamp = new Date();
    
    const [result] = await pool.execute(
      `INSERT INTO logs_auditoria (
        id, log_timestamp, trace_id, span_id, user_id, user_login,
        operation_type, entity_type, entity_id, method, route,
        status_code, duration_ms, ip_address, user_agent,
        payload, old_values, new_values, error_message, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId, logTimestamp, traceId, spanId, userId, userLogin,
        operationType, entityType, entityId, method, route,
        statusCode, durationMs, ipAddress, userAgent,
        payload ? JSON.stringify(payload) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        errorMessage, severity
      ]
    );
    
    console.log(`[AUDIT] ${operationType} ${entityType} ${entityId || ''} by ${userLogin}`);
  } catch (error) {
    console.error('[AUDIT ERROR] Falha ao registrar log:', error.message);
  }
}

// Middleware para extrair informações da requisição
function extractRequestInfo(req) {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    traceId: req.get('x-trace-id') || ulid(),
    spanId: req.get('x-span-id') || ulid(),
    userId: req.get('x-user-id') || 'system',
    userLogin: req.get('x-user-login') || 'system'
  };
}

// ==================== HELPERS PARA REDUZIR DUPLICAÇÃO ====================

/**
 * Helper para tratar erros de forma consistente
 * Reduz duplicação de código em tratamento de erros
 */
function handleError(res, error, message, statusCode = 500) {
  console.error(`[ERROR] ${message}:`, error);
  
  // Não expor detalhes internos em produção
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? message 
    : `${message}: ${error.message}`;
  
  res.status(statusCode).json({ 
    error: errorMessage,
    code: 'DATABASE_ERROR'
  });
}

/**
 * Helper para queries de listagem (GET all)
 * Reduz duplicação em endpoints de listagem
 */
async function handleListQuery(res, tableName, orderBy = 'id') {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderBy}`);
    res.json(rows);
  } catch (error) {
    handleError(res, error, `Erro ao listar ${tableName}`);
  }
}

/**
 * Helper para queries de busca por ID (GET by id)
 * Reduz duplicação em endpoints de detalhes
 */
async function handleGetByIdQuery(res, tableName, id) {
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    handleError(res, error, `Erro ao buscar ${tableName}`);
  }
}

/**
 * Cache em memória para melhorar performance de queries frequentes
 */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clearCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// ==================== FIM DOS HELPERS ====================

// Helper para mapear snake_case para camelCase
function mapTipoAfastamento(row) {
  if (!row) return null;
  return {
    id: row.id,
    sigla: row.sigla,
    descricao: row.descricao,
    argumentacaoLegal: row.argumentacao_legal,
    numeroDias: row.numero_dias,
    tipoTempo: row.tipo_tempo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapHabilidade(row) {
  if (!row) return null;
  return {
    id: row.id,
    sigla: row.sigla,
    descricao: row.descricao,
    tipo: row.tipo,
    dominio: row.dominio,
    subcategoria: row.subcategoria,
    certificacoes: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapTecnologia(row) {
  if (!row) return null;
  return {
    id: row.id,
    sigla: row.sigla || '',
    nome: row.nome,
    versaoRelease: row.versao_release || '',
    camada: row.camada || '',
    categoria: row.categoria || '',
    status: row.status || '',
    fornecedorFabricante: row.fornecedor_fabricante || '',
    tipoLicenciamento: row.tipo_licenciamento || '',
    maturidadeInterna: row.maturidade_interna || '',
    nivelSuporteInterno: row.nivel_suporte_interno || '',
    documentacaoOficial: row.documentacao_oficial || '',
    repositorioInterno: row.repositorio_interno || '',
    ambientes: {
      dev: Boolean(row.ambiente_dev),
      qa: Boolean(row.ambiente_qa),
      prod: Boolean(row.ambiente_prod),
      cloud: Boolean(row.ambiente_cloud),
      onPremise: Boolean(row.ambiente_on_premise)
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCapacidadeNegocio(row) {
  if (!row) return null;
  return {
    id: row.id,
    sigla: row.sigla || '',
    nome: row.nome,
    descricao: row.descricao || '',
    nivel: row.nivel || '',
    categoria: row.categoria || '',
    coberturaEstrategica: {
      alinhamentoObjetivos: row.alinhamento_objetivos || '',
      beneficiosEsperados: row.beneficios_esperados || '',
      estadoFuturoDesejado: row.estado_futuro_desejado || '',
      gapEstadoAtualFuturo: row.gap_estado_atual_futuro || ''
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function mapColaborador(row) {
  if (!row) return null;
  
  // Formatar datas para YYYY-MM-DD para evitar problemas de timezone
  const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date.split('T')[0];
    // Se for Date object, converter para YYYY-MM-DD
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Buscar afastamentos do colaborador
  const [afastamentos] = await pool.query(
    'SELECT * FROM afastamentos WHERE colaborador_id = ?',
    [row.id]
  );
  
  // Buscar habilidades do colaborador
  const [habilidades] = await pool.query(
    'SELECT * FROM colaborador_habilidades WHERE colaborador_id = ?',
    [row.id]
  );
  
  // Buscar avaliações do colaborador
  const [avaliacoes] = await pool.query(
    'SELECT * FROM avaliacoes_colaborador WHERE colaborador_id = ? ORDER BY data_avaliacao DESC',
    [row.id]
  );
  
  return {
    id: row.id,
    nome: row.nome,
    matricula: row.matricula,
    setor: row.setor,
    dataAdmissao: formatDate(row.data_admissao),
    dataDemissao: formatDate(row.data_demissao),
    afastamentos: afastamentos.map(a => ({
      id: a.id,
      tipoAfastamentoId: a.tipo_afastamento_id,
      inicialProvavel: formatDate(a.inicial_provavel),
      finalProvavel: formatDate(a.final_provavel),
      inicialEfetivo: formatDate(a.inicial_efetivo),
      finalEfetivo: formatDate(a.final_efetivo)
    })),
    habilidades: habilidades.map(h => ({
      id: h.id,
      habilidadeId: h.habilidade_id,
      nivelDeclarado: h.nivel_declarado,
      nivelAvaliado: h.nivel_avaliado,
      dataInicio: formatDate(h.data_inicio),
      dataTermino: formatDate(h.data_termino)
    })),
    avaliacoes: avaliacoes.map(av => {
      const notas = [
        Number.parseFloat(av.resultados_entregas),
        Number.parseFloat(av.competencias_tecnicas),
        Number.parseFloat(av.qualidade_seguranca),
        Number.parseFloat(av.comportamento_cultura),
        Number.parseFloat(av.evolucao_aprendizado)
      ];
      const notaFinal = notas.reduce((acc, nota) => acc + nota, 0) / notas.length;
      
      return {
        id: av.id,
        colaboradorId: av.colaborador_id,
        dataAvaliacao: formatDate(av.data_avaliacao),
        resultadosEntregas: Number.parseFloat(av.resultados_entregas),
        competenciasTecnicas: Number.parseFloat(av.competencias_tecnicas),
        qualidadeSeguranca: Number.parseFloat(av.qualidade_seguranca),
        comportamentoCultura: Number.parseFloat(av.comportamento_cultura),
        evolucaoAprendizado: Number.parseFloat(av.evolucao_aprendizado),
        notaFinal: notaFinal,
        observacoes: av.motivo,
        motivo: av.motivo,
        dataConversa: formatDate(av.data_conversa),
        createdAt: av.created_at,
        updatedAt: av.updated_at
      };
    }),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ==================== TIPOS DE AFASTAMENTO ====================

// GET /api/tipos-afastamento - Listar todos
app.get('/api/tipos-afastamento', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipos_afastamento ORDER BY sigla');
    res.json(rows.map(mapTipoAfastamento));
  } catch (error) {
    console.error('Erro ao listar tipos:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// GET /api/tipos-afastamento/:id - Buscar por ID
app.get('/api/tipos-afastamento/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipos_afastamento WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Tipo de afastamento não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    res.json(mapTipoAfastamento(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar tipo:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// POST /api/tipos-afastamento - Criar novo
app.post('/api/tipos-afastamento', async (req, res) => {
  // Aceitar tanto camelCase quanto snake_case
  const sigla = req.body.sigla;
  const descricao = req.body.descricao;
  const argumentacaoLegal = req.body.argumentacao_legal || req.body.argumentacaoLegal;
  const numeroDias = req.body.numero_dias !== undefined ? req.body.numero_dias : req.body.numeroDias;
  const tipoTempo = req.body.tipo_tempo || req.body.tipoTempo;
  
  // Validações
  if (!sigla || !descricao || !argumentacaoLegal || numeroDias === undefined || !tipoTempo) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [
        !sigla && 'sigla',
        !descricao && 'descricao',
        !argumentacaoLegal && 'argumentacao_legal',
        numeroDias === undefined && 'numero_dias',
        !tipoTempo && 'tipo_tempo'
      ].filter(Boolean)
    });
  }
  
  // Validar sigla
  if (!/^[A-Za-z0-9-]{2,10}$/.test(sigla)) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        sigla: 'Sigla deve conter entre 2 e 10 caracteres alfanuméricos ou hífens'
      }
    });
  }
  
  // Validar descrição
  if (descricao.length > 50) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        descricao: 'Descrição deve ter no máximo 50 caracteres'
      }
    });
  }
  
  // Validar argumentação legal
  if (argumentacaoLegal.length > 60) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        argumentacaoLegal: 'Argumentação Legal deve ter no máximo 60 caracteres'
      }
    });
  }
  
  // Validar número de dias
  if (numeroDias < 1 || numeroDias > 99) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        numeroDias: 'Número de dias deve estar entre 1 e 99'
      }
    });
  }
  
  // Validar tipo de tempo
  if (!['D', 'M', 'A'].includes(tipoTempo)) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        tipo_tempo: 'Tipo de tempo deve ser D (Dias), M (Meses) ou A (Anos)'
      }
    });
  }
  
  try {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    // Verificar sigla duplicada
    const [existing] = await pool.query(
      'SELECT id FROM tipos_afastamento WHERE LOWER(sigla) = LOWER(?)',
      [sigla]
    );
    
    if (existing.length > 0) {
      await logAuditoria({
        ...requestInfo,
        operationType: 'INSERT',
        entityType: 'tipos_afastamento',
        method: 'POST',
        route: '/api/tipos-afastamento',
        statusCode: 409,
        durationMs: Date.now() - startTime,
        payload: { sigla, descricao },
        errorMessage: 'Sigla já cadastrada',
        severity: 'warn'
      });
      
      return res.status(409).json({
        error: 'Sigla já cadastrada',
        code: 'DUPLICATE_SIGLA',
        field: 'sigla'
      });
    }
    
    // Criar novo tipo
    const id = uuidv4();
    await pool.query(
      'INSERT INTO tipos_afastamento (id, sigla, descricao, argumentacao_legal, numero_dias, tipo_tempo) VALUES (?, ?, ?, ?, ?, ?)',
      [id, sigla.toUpperCase(), descricao, argumentacaoLegal, Number.parseInt(numeroDias), tipoTempo]
    );
    
    const novoTipo = {
      id,
      sigla: sigla.toUpperCase(),
      descricao,
      argumentacaoLegal,
      numeroDias: Number.parseInt(numeroDias),
      tipoTempo
    };
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'tipos_afastamento',
      entityId: id,
      method: 'POST',
      route: '/api/tipos-afastamento',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: { sigla, descricao, argumentacaoLegal, numeroDias, tipoTempo },
      newValues: novoTipo,
      severity: 'info'
    });
    
    res.status(201).json(novoTipo);
  } catch (error) {
    const requestInfo = extractRequestInfo(req);
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tipos_afastamento',
      method: 'POST',
      route: '/api/tipos-afastamento',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao criar tipo:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

// PUT /api/tipos-afastamento/:id - Atualizar
app.put('/api/tipos-afastamento/:id', async (req, res) => {
  // Aceitar tanto camelCase quanto snake_case
  const sigla = req.body.sigla;
  const descricao = req.body.descricao;
  const argumentacaoLegal = req.body.argumentacao_legal || req.body.argumentacaoLegal;
  const numeroDias = req.body.numero_dias !== undefined ? req.body.numero_dias : req.body.numeroDias;
  const tipoTempo = req.body.tipo_tempo || req.body.tipoTempo;
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Verificar se existe
    const [existing] = await pool.query('SELECT * FROM tipos_afastamento WHERE id = ?', [req.params.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Tipo de afastamento não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    // Verificar sigla duplicada (exceto o próprio registro)
    if (sigla) {
      const [duplicate] = await pool.query(
        'SELECT id FROM tipos_afastamento WHERE LOWER(sigla) = LOWER(?) AND id != ?',
        [sigla, req.params.id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          error: 'Sigla já cadastrada',
          code: 'DUPLICATE_SIGLA',
          field: 'sigla'
        });
      }
    }
    
    // Atualizar
    await pool.query(
      'UPDATE tipos_afastamento SET sigla = ?, descricao = ?, argumentacao_legal = ?, numero_dias = ?, tipo_tempo = ? WHERE id = ?',
      [
        sigla?.toUpperCase() || existing[0].sigla,
        descricao || existing[0].descricao,
        argumentacaoLegal || existing[0].argumentacao_legal,
        numeroDias || existing[0].numero_dias,
        tipoTempo || existing[0].tipo_tempo,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tipos_afastamento WHERE id = ?', [req.params.id]);
    const updatedTipo = mapTipoAfastamento(updated[0]);
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'tipos_afastamento',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/tipos-afastamento/:id',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: { sigla, descricao, argumentacaoLegal, numeroDias, tipoTempo },
      oldValues: mapTipoAfastamento(existing[0]),
      newValues: updatedTipo,
      severity: 'info'
    });
    
    res.json(updatedTipo);
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tipos_afastamento',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/tipos-afastamento/:id',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao atualizar tipo:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/tipos-afastamento/:id - Excluir
app.delete('/api/tipos-afastamento/:id', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Buscar dados antes de excluir
    const [existing] = await pool.query('SELECT * FROM tipos_afastamento WHERE id = ?', [req.params.id]);
    const oldValues = existing.length > 0 ? mapTipoAfastamento(existing[0]) : null;
    
    const [result] = await pool.query('DELETE FROM tipos_afastamento WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      await logAuditoria({
        ...requestInfo,
        operationType: 'DELETE',
        entityType: 'tipos_afastamento',
        entityId: req.params.id,
        method: 'DELETE',
        route: '/api/tipos-afastamento/:id',
        statusCode: 404,
        durationMs: Date.now() - startTime,
        errorMessage: 'Tipo de afastamento não encontrado',
        severity: 'warn'
      });
      
      return res.status(404).json({
        error: 'Tipo de afastamento não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'DELETE',
      entityType: 'tipos_afastamento',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/tipos-afastamento/:id',
      statusCode: 204,
      durationMs: Date.now() - startTime,
      oldValues,
      severity: 'info'
    });
    
    res.status(204).send();
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tipos_afastamento',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/tipos-afastamento/:id',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao excluir tipo:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TOKENS DE ACESSO ====================

// Função auxiliar para mapear token do banco para formato da API
function mapTokenAcesso(row) {
  if (!row) return null;
  
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    entidadeTipo: row.entidade_tipo,
    entidadeNome: row.entidade_nome,
    dataInicioValidade: row.data_inicio_validade,
    dataExpiracao: row.data_expiracao,
    escopos: typeof row.escopos === 'string' ? JSON.parse(row.escopos) : row.escopos,
    token: row.token,
    permitirRegeneracao: row.permitir_regeneracao,
    requerMFA: row.requer_mfa,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/tokens-acesso - Listar todos
app.get('/api/tokens-acesso', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tokens_acesso ORDER BY created_at DESC');
    res.json(rows.map(mapTokenAcesso));
  } catch (error) {
    console.error('Erro ao listar tokens:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// GET /api/tokens-acesso/:id - Buscar por ID
app.get('/api/tokens-acesso/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    res.json(mapTokenAcesso(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar token:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// POST /api/tokens-acesso - Criar novo token
app.post('/api/tokens-acesso', async (req, res) => {
  const {
    nome,
    descricao,
    entidadeTipo,
    entidadeNome,
    dataInicioValidade,
    dataExpiracao,
    escopos,
    token,
    permitirRegeneracao,
    requerMFA
  } = req.body;
  
  // Validações
  if (!nome || !entidadeTipo || !entidadeNome || !dataInicioValidade || !dataExpiracao || !escopos || !token) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [
        !nome && 'nome',
        !entidadeTipo && 'entidadeTipo',
        !entidadeNome && 'entidadeNome',
        !dataInicioValidade && 'dataInicioValidade',
        !dataExpiracao && 'dataExpiracao',
        !escopos && 'escopos',
        !token && 'token'
      ].filter(Boolean)
    });
  }
  
  // Validar entidadeTipo
  if (!['Usuario', 'Servico', 'Aplicacao'].includes(entidadeTipo)) {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: {
        entidadeTipo: 'Tipo de entidade deve ser Usuario, Servico ou Aplicacao'
      }
    });
  }
  
  try {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    // Verificar nome duplicado
    const [existing] = await pool.query(
      'SELECT id FROM tokens_acesso WHERE LOWER(nome) = LOWER(?)',
      [nome]
    );
    
    if (existing.length > 0) {
      await logAuditoria({
        ...requestInfo,
        operationType: 'INSERT',
        entityType: 'tokens_acesso',
        method: 'POST',
        route: '/api/tokens-acesso',
        statusCode: 409,
        durationMs: Date.now() - startTime,
        payload: { nome },
        errorMessage: 'Nome já cadastrado',
        severity: 'warn'
      });
      
      return res.status(409).json({
        error: 'Nome já cadastrado',
        code: 'DUPLICATE_NAME',
        field: 'nome'
      });
    }
    
    // Criar novo token
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tokens_acesso (
        id, nome, descricao, entidade_tipo, entidade_nome,
        data_inicio_validade, data_expiracao, escopos, token,
        permitir_regeneracao, requer_mfa, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [
        id,
        nome,
        descricao || null,
        entidadeTipo,
        entidadeNome,
        dataInicioValidade,
        dataExpiracao,
        JSON.stringify(escopos),
        token,
        permitirRegeneracao || false,
        requerMFA || false
      ]
    );
    
    const [newToken] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [id]);
    const novoToken = mapTokenAcesso(newToken[0]);
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'tokens_acesso',
      entityId: id,
      method: 'POST',
      route: '/api/tokens-acesso',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: { nome, entidadeTipo, entidadeNome },
      newValues: { ...novoToken, token: '[HIDDEN]' },
      severity: 'info'
    });
    
    res.status(201).json(novoToken);
  } catch (error) {
    const requestInfo = extractRequestInfo(req);
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tokens_acesso',
      method: 'POST',
      route: '/api/tokens-acesso',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao criar token:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

// PUT /api/tokens-acesso/:id - Atualizar token
app.put('/api/tokens-acesso/:id', async (req, res) => {
  const {
    nome,
    descricao,
    entidadeTipo,
    entidadeNome,
    dataInicioValidade,
    dataExpiracao,
    escopos,
    permitirRegeneracao,
    requerMFA
  } = req.body;
  
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Verificar se existe
    const [existing] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    // Verificar nome duplicado (exceto o próprio registro)
    if (nome) {
      const [duplicate] = await pool.query(
        'SELECT id FROM tokens_acesso WHERE LOWER(nome) = LOWER(?) AND id != ?',
        [nome, req.params.id]
      );
      
      if (duplicate.length > 0) {
        return res.status(409).json({
          error: 'Nome já cadastrado',
          code: 'DUPLICATE_NAME',
          field: 'nome'
        });
      }
    }
    
    // Atualizar
    await pool.query(
      `UPDATE tokens_acesso SET
        nome = ?,
        descricao = ?,
        entidade_tipo = ?,
        entidade_nome = ?,
        data_inicio_validade = ?,
        data_expiracao = ?,
        escopos = ?,
        permitir_regeneracao = ?,
        requer_mfa = ?
      WHERE id = ?`,
      [
        nome || existing[0].nome,
        descricao !== undefined ? descricao : existing[0].descricao,
        entidadeTipo || existing[0].entidade_tipo,
        entidadeNome || existing[0].entidade_nome,
        dataInicioValidade || existing[0].data_inicio_validade,
        dataExpiracao || existing[0].data_expiracao,
        escopos ? JSON.stringify(escopos) : existing[0].escopos,
        permitirRegeneracao !== undefined ? permitirRegeneracao : existing[0].permitir_regeneracao,
        requerMFA !== undefined ? requerMFA : existing[0].requer_mfa,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    const updatedToken = mapTokenAcesso(updated[0]);
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/tokens-acesso/:id',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: { nome, entidadeTipo, entidadeNome },
      oldValues: { ...mapTokenAcesso(existing[0]), token: '[HIDDEN]' },
      newValues: { ...updatedToken, token: '[HIDDEN]' },
      severity: 'info'
    });
    
    res.json(updatedToken);
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PUT',
      route: '/api/tokens-acesso/:id',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao atualizar token:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

// PATCH /api/tokens-acesso/:id/renovar - Regenerar token
app.patch('/api/tokens-acesso/:id/renovar', async (req, res) => {
  const { novoToken, novaDataExpiracao } = req.body;
  
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Verificar se existe e se permite regeneração
    const [existing] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    if (!existing[0].permitir_regeneracao) {
      return res.status(403).json({
        error: 'Token não permite regeneração',
        code: 'REGENERATION_NOT_ALLOWED'
      });
    }
    
    if (existing[0].status !== 'Ativo') {
      return res.status(403).json({
        error: 'Apenas tokens ativos podem ser renovados',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    
    // Atualizar token e data de expiração
    await pool.query(
      'UPDATE tokens_acesso SET token = ?, data_expiracao = ? WHERE id = ?',
      [novoToken, novaDataExpiracao, req.params.id]
    );
    
    const [updated] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    const updatedToken = mapTokenAcesso(updated[0]);
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PATCH',
      route: '/api/tokens-acesso/:id/renovar',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: { action: 'renovar' },
      severity: 'info'
    });
    
    res.json(updatedToken);
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PATCH',
      route: '/api/tokens-acesso/:id/renovar',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar token', code: 'DATABASE_ERROR' });
  }
});

// PATCH /api/tokens-acesso/:id/revogar - Revogar token
app.patch('/api/tokens-acesso/:id/revogar', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Verificar se existe
    const [existing] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    if (existing[0].status === 'Revogado') {
      return res.status(400).json({
        error: 'Token já está revogado',
        code: 'ALREADY_REVOKED'
      });
    }
    
    // Revogar token
    await pool.query(
      'UPDATE tokens_acesso SET status = "Revogado" WHERE id = ?',
      [req.params.id]
    );
    
    const [updated] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    const updatedToken = mapTokenAcesso(updated[0]);
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PATCH',
      route: '/api/tokens-acesso/:id/revogar',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: { action: 'revogar' },
      oldValues: { status: existing[0].status },
      newValues: { status: 'Revogado' },
      severity: 'info'
    });
    
    res.json(updatedToken);
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'PATCH',
      route: '/api/tokens-acesso/:id/revogar',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao revogar token:', error);
    res.status(500).json({ error: 'Erro ao revogar token', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/tokens-acesso/:id - Excluir token
app.delete('/api/tokens-acesso/:id', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  try {
    // Buscar dados antes de excluir
    const [existing] = await pool.query('SELECT * FROM tokens_acesso WHERE id = ?', [req.params.id]);
    const oldValues = existing.length > 0 ? { ...mapTokenAcesso(existing[0]), token: '[HIDDEN]' } : null;
    
    const [result] = await pool.query('DELETE FROM tokens_acesso WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      await logAuditoria({
        ...requestInfo,
        operationType: 'DELETE',
        entityType: 'tokens_acesso',
        entityId: req.params.id,
        method: 'DELETE',
        route: '/api/tokens-acesso/:id',
        statusCode: 404,
        durationMs: Date.now() - startTime,
        errorMessage: 'Token não encontrado',
        severity: 'warn'
      });
      
      return res.status(404).json({
        error: 'Token não encontrado',
        code: 'NOT_FOUND'
      });
    }
    
    // Registrar log de auditoria
    await logAuditoria({
      ...requestInfo,
      operationType: 'DELETE',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/tokens-acesso/:id',
      statusCode: 204,
      durationMs: Date.now() - startTime,
      oldValues,
      severity: 'info'
    });
    
    res.status(204).send();
  } catch (error) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'ERROR',
      entityType: 'tokens_acesso',
      entityId: req.params.id,
      method: 'DELETE',
      route: '/api/tokens-acesso/:id',
      statusCode: 500,
      errorMessage: error.message,
      severity: 'error'
    });
    
    console.error('Erro ao excluir token:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== COLABORADORES ====================

app.get('/api/colaboradores', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM colaboradores ORDER BY nome');
    const colaboradores = await Promise.all(rows.map(row => mapColaborador(row)));
    res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/colaboradores/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM colaboradores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado', code: 'NOT_FOUND' });
    }
    const colaborador = await mapColaborador(rows[0]);
    
    res.json(colaborador);
  } catch (error) {
    console.error('Erro ao buscar colaborador:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/colaboradores', async (req, res) => {
  const { nome, matricula, setor, dataAdmissao, dataDemissao } = req.body;
  
  if (!nome || !matricula || !setor || !dataAdmissao) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [!nome && 'nome', !matricula && 'matricula', !setor && 'setor', !dataAdmissao && 'dataAdmissao'].filter(Boolean)
    });
  }
  
  try {
    const id = uuidv4();
    
    // Converter datas ISO para formato MySQL (YYYY-MM-DD)
    const dataAdmissaoFormatted = dataAdmissao.split('T')[0];
    const dataDemissaoFormatted = dataDemissao ? dataDemissao.split('T')[0] : null;
    
    await pool.query(
      'INSERT INTO colaboradores (id, nome, matricula, setor, data_admissao, data_demissao) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nome, matricula, setor, dataAdmissaoFormatted, dataDemissaoFormatted]
    );
    
    const [created] = await pool.query('SELECT * FROM colaboradores WHERE id = ?', [id]);
    res.status(201).json(await mapColaborador(created[0]));
  } catch (error) {
    console.error('Erro ao criar colaborador:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Matrícula já cadastrada', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/colaboradores/:id', async (req, res) => {
  const { nome, matricula, setor, dataAdmissao, dataDemissao } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM colaboradores WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado', code: 'NOT_FOUND' });
    }
    
    // Converter datas ISO para formato MySQL (YYYY-MM-DD)
    const dataAdmissaoFormatted = dataAdmissao ? dataAdmissao.split('T')[0] : existing[0].data_admissao;
    const dataDemissaoFormatted = dataDemissao ? dataDemissao.split('T')[0] : null;
    
    await pool.query(
      'UPDATE colaboradores SET nome = ?, matricula = ?, setor = ?, data_admissao = ?, data_demissao = ? WHERE id = ?',
      [
        nome || existing[0].nome,
        matricula || existing[0].matricula,
        setor || existing[0].setor,
        dataAdmissaoFormatted,
        dataDemissaoFormatted !== null ? dataDemissaoFormatted : existing[0].data_demissao,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM colaboradores WHERE id = ?', [req.params.id]);
    res.json(await mapColaborador(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar colaborador:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

// ===== Endpoints de Avaliações de Colaboradores =====
app.get('/api/colaboradores/:id/avaliacoes', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM avaliacoes_colaborador WHERE colaborador_id = ? ORDER BY data_avaliacao DESC',
      [req.params.id]
    );
    
    const avaliacoes = rows.map(row => {
      const notas = [
        parseFloat(row.resultados_entregas),
        parseFloat(row.competencias_tecnicas),
        parseFloat(row.qualidade_seguranca),
        parseFloat(row.comportamento_cultura),
        parseFloat(row.evolucao_aprendizado)
      ];
      const notaFinal = notas.reduce((acc, nota) => acc + nota, 0) / notas.length;
      
      return {
        id: row.id,
        colaboradorId: row.colaborador_id,
        dataAvaliacao: row.data_avaliacao,
        resultadosEntregas: parseFloat(row.resultados_entregas),
        competenciasTecnicas: parseFloat(row.competencias_tecnicas),
        qualidadeSeguranca: parseFloat(row.qualidade_seguranca),
        comportamentoCultura: parseFloat(row.comportamento_cultura),
        evolucaoAprendizado: parseFloat(row.evolucao_aprendizado),
        notaFinal: notaFinal,
        observacoes: row.motivo,
        motivo: row.motivo,
        dataConversa: row.data_conversa,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    res.json(avaliacoes);
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/colaboradores/:id/avaliacoes', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const {
    dataAvaliacao,
    resultadosEntregas,
    competenciasTecnicas,
    qualidadeSeguranca,
    comportamentoCultura,
    evolucaoAprendizado,
    motivo,
    dataConversa
  } = req.body;
  
  if (!dataAvaliacao || resultadosEntregas === undefined || competenciasTecnicas === undefined ||
      qualidadeSeguranca === undefined || comportamentoCultura === undefined || evolucaoAprendizado === undefined) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'avaliacoes_colaborador',
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/avaliacoes`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Campos obrigatórios faltando',
      severity: 'warn'
    });
    
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS'
    });
  }
  
  // Validar range 0-10
  const notas = [resultadosEntregas, competenciasTecnicas, qualidadeSeguranca, comportamentoCultura, evolucaoAprendizado];
  if (notas.some(nota => nota < 0 || nota > 10)) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'avaliacoes_colaborador',
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/avaliacoes`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Notas devem estar entre 0 e 10',
      severity: 'warn'
    });
    
    return res.status(400).json({
      error: 'Notas devem estar entre 0 e 10',
      code: 'INVALID_RANGE'
    });
  }
  
  try {
    const id = uuidv4();
    const dataAvaliacaoFormatted = dataAvaliacao.split('T')[0];
    const dataConversaFormatted = dataConversa ? dataConversa.split('T')[0] : null;
    
    await pool.query(
      `INSERT INTO avaliacoes_colaborador (
        id, colaborador_id, data_avaliacao, resultados_entregas, competencias_tecnicas,
        qualidade_seguranca, comportamento_cultura, evolucao_aprendizado, motivo, data_conversa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.id, dataAvaliacaoFormatted, resultadosEntregas, competenciasTecnicas,
        qualidadeSeguranca, comportamentoCultura, evolucaoAprendizado, motivo, dataConversaFormatted
      ]
    );
    
    const [created] = await pool.query('SELECT * FROM avaliacoes_colaborador WHERE id = ?', [id]);
    const result = {
      id: created[0].id,
      colaboradorId: created[0].colaborador_id,
      dataAvaliacao: created[0].data_avaliacao,
      resultadosEntregas: parseFloat(created[0].resultados_entregas),
      competenciasTecnicas: parseFloat(created[0].competencias_tecnicas),
      qualidadeSeguranca: parseFloat(created[0].qualidade_seguranca),
      comportamentoCultura: parseFloat(created[0].comportamento_cultura),
      evolucaoAprendizado: parseFloat(created[0].evolucao_aprendizado),
      motivo: created[0].motivo,
      dataConversa: created[0].data_conversa,
      createdAt: created[0].created_at,
      updatedAt: created[0].updated_at
    };
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'avaliacoes_colaborador',
      entityId: id,
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/avaliacoes`,
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body,
      newValues: result,
      severity: 'info'
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'avaliacoes_colaborador',
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/avaliacoes`,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao salvar avaliação', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/avaliacoes/:id', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const {
    dataAvaliacao,
    resultadosEntregas,
    competenciasTecnicas,
    qualidadeSeguranca,
    comportamentoCultura,
    evolucaoAprendizado,
    motivo,
    dataConversa
  } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM avaliacoes_colaborador WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      await logAuditoria({
        ...requestInfo,
        operationType: 'UPDATE',
        entityType: 'avaliacoes_colaborador',
        entityId: req.params.id,
        method: 'PUT',
        route: `/api/avaliacoes/${req.params.id}`,
        statusCode: 404,
        durationMs: Date.now() - startTime,
        payload: req.body,
        errorMessage: 'Avaliação não encontrada',
        severity: 'warn'
      });
      
      return res.status(404).json({ error: 'Avaliação não encontrada', code: 'NOT_FOUND' });
    }
    
    // Validar range 0-10
    const notas = [resultadosEntregas, competenciasTecnicas, qualidadeSeguranca, comportamentoCultura, evolucaoAprendizado];
    if (notas.some(nota => nota !== undefined && (nota < 0 || nota > 10))) {
      return res.status(400).json({
        error: 'Notas devem estar entre 0 e 10',
        code: 'INVALID_RANGE'
      });
    }
    
    const dataAvaliacaoFormatted = dataAvaliacao ? dataAvaliacao.split('T')[0] : existing[0].data_avaliacao;
    const dataConversaFormatted = dataConversa ? dataConversa.split('T')[0] : existing[0].data_conversa;
    
    await pool.query(
      `UPDATE avaliacoes_colaborador SET
        data_avaliacao = ?, resultados_entregas = ?, competencias_tecnicas = ?,
        qualidade_seguranca = ?, comportamento_cultura = ?, evolucao_aprendizado = ?,
        motivo = ?, data_conversa = ?
      WHERE id = ?`,
      [
        dataAvaliacaoFormatted,
        resultadosEntregas !== undefined ? resultadosEntregas : existing[0].resultados_entregas,
        competenciasTecnicas !== undefined ? competenciasTecnicas : existing[0].competencias_tecnicas,
        qualidadeSeguranca !== undefined ? qualidadeSeguranca : existing[0].qualidade_seguranca,
        comportamentoCultura !== undefined ? comportamentoCultura : existing[0].comportamento_cultura,
        evolucaoAprendizado !== undefined ? evolucaoAprendizado : existing[0].evolucao_aprendizado,
        motivo !== undefined ? motivo : existing[0].motivo,
        dataConversaFormatted,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM avaliacoes_colaborador WHERE id = ?', [req.params.id]);
    const result = {
      id: updated[0].id,
      colaboradorId: updated[0].colaborador_id,
      dataAvaliacao: updated[0].data_avaliacao,
      resultadosEntregas: parseFloat(updated[0].resultados_entregas),
      competenciasTecnicas: parseFloat(updated[0].competencias_tecnicas),
      qualidadeSeguranca: parseFloat(updated[0].qualidade_seguranca),
      comportamentoCultura: parseFloat(updated[0].comportamento_cultura),
      evolucaoAprendizado: parseFloat(updated[0].evolucao_aprendizado),
      motivo: updated[0].motivo,
      dataConversa: updated[0].data_conversa,
      createdAt: updated[0].created_at,
      updatedAt: updated[0].updated_at
    };
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'avaliacoes_colaborador',
      entityId: req.params.id,
      method: 'PUT',
      route: `/api/avaliacoes/${req.params.id}`,
      statusCode: 200,
      durationMs: Date.now() - startTime,
      payload: req.body,
      oldValues: existing[0],
      newValues: result,
      severity: 'info'
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'UPDATE',
      entityType: 'avaliacoes_colaborador',
      entityId: req.params.id,
      method: 'PUT',
      route: `/api/avaliacoes/${req.params.id}`,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao atualizar avaliação', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/avaliacoes/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM avaliacoes_colaborador WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada', code: 'NOT_FOUND' });
    }
    
    await pool.query('DELETE FROM avaliacoes_colaborador WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    res.status(500).json({ error: 'Erro ao excluir avaliação', code: 'DATABASE_ERROR' });
  }
});

// ================== OPT-IN/OUT ROUTES ==================

// Listar Opt-In/Out de um colaborador
app.get('/api/colaboradores/:id/optinouts', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.*, a.sigla as aplicacao_nome 
       FROM colaborador_opt_in_out o
       LEFT JOIN aplicacoes a ON o.aplicacao_id = a.id
       WHERE o.colaborador_id = ?
       ORDER BY o.data_inicio DESC`,
      [req.params.id]
    );
    res.json(rows.map(row => ({
      id: row.id,
      colaboradorId: row.colaborador_id,
      aplicacaoId: row.aplicacao_id,
      aplicacaoNome: row.aplicacao_nome,
      dataInicio: row.data_inicio,
      dataRevogacao: row.data_revogacao,
      arquivoPdf: row.arquivo_pdf,
      assinaturaEletronica: row.assinatura_eletronica
    })));
  } catch (error) {
    console.error('Erro ao listar Opt-In/Out:', error);
    res.status(500).json({ error: 'Erro ao buscar registros de Opt-In/Out', code: 'DATABASE_ERROR' });
  }
});

// Criar novo Opt-In/Out
app.post('/api/colaboradores/:id/optinouts', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const {
    aplicacaoId,
    dataInicio,
    dataRevogacao,
    arquivoPdf,
    assinaturaEletronica
  } = req.body;
  
  if (!aplicacaoId || !dataInicio) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_opt_in_out',
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/optinouts`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Campos obrigatórios faltando (aplicacaoId e dataInicio)',
      severity: 'warn'
    });
    
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    const id = uuidv4();
    const dataInicioFormatted = dataInicio.split('T')[0];
    const dataRevogacaoFormatted = dataRevogacao ? dataRevogacao.split('T')[0] : null;
    
    await pool.query(
      `INSERT INTO colaborador_opt_in_out (
        id, colaborador_id, aplicacao_id, data_inicio, data_revogacao,
        arquivo_pdf, assinatura_eletronica
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, aplicacaoId, dataInicioFormatted, dataRevogacaoFormatted, arquivoPdf, assinaturaEletronica]
    );
    
    const [rows] = await pool.query(
      'SELECT * FROM colaborador_opt_in_out WHERE id = ?',
      [id]
    );
    
    const result = {
      id: rows[0].id,
      colaboradorId: rows[0].colaborador_id,
      aplicacaoId: rows[0].aplicacao_id,
      dataInicio: rows[0].data_inicio,
      dataRevogacao: rows[0].data_revogacao,
      arquivoPdf: rows[0].arquivo_pdf,
      assinaturaEletronica: rows[0].assinatura_eletronica
    };
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_opt_in_out',
      entityId: id,
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/optinouts`,
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body,
      newValues: result,
      severity: 'info'
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar Opt-In/Out:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_opt_in_out',
      method: 'POST',
      route: `/api/colaboradores/${req.params.id}/optinouts`,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao salvar Opt-In/Out', code: 'DATABASE_ERROR' });
  }
});

// Deletar Opt-In/Out
app.delete('/api/optinouts/:id', async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM colaborador_opt_in_out WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opt-In/Out não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query('DELETE FROM colaborador_opt_in_out WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir Opt-In/Out:', error);
    res.status(500).json({ error: 'Erro ao excluir Opt-In/Out', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
  try {
    console.log('[DELETE] Tentando excluir colaborador:', req.params.id);
    
    // Primeiro, deletar os relacionamentos que não têm CASCADE
    try {
      const [result1] = await pool.query('DELETE FROM tecnologia_responsaveis WHERE colaborador_id = ?', [req.params.id]);
      console.log('[DELETE] Removidos', result1.affectedRows, 'registros de tecnologia_responsaveis');
    } catch (err) {
      // Se a tabela não existir, ignorar o erro
      console.log('[DELETE] Tabela tecnologia_responsaveis não existe ou não tem registros:', err.message);
    }
    
    // Depois deletar o colaborador (afastamentos e habilidades têm CASCADE)
    const [result] = await pool.query('DELETE FROM colaboradores WHERE id = ?', [req.params.id]);
    console.log('[DELETE] Resultado da exclusão:', result.affectedRows, 'linhas afetadas');
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado', code: 'NOT_FOUND' });
    }
    
    console.log('[DELETE] Colaborador excluído com sucesso');
    res.status(204).send();
  } catch (error) {
    console.error('[DELETE] Erro ao excluir colaborador:', error);
    console.error('[DELETE] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao excluir dados', 
      code: 'DATABASE_ERROR',
      details: error.message 
    });
  }
});

// ==================== AFASTAMENTOS DE COLABORADORES ====================

// POST /api/colaboradores/:colaboradorId/afastamentos - Criar afastamento
app.post('/api/colaboradores/:colaboradorId/afastamentos', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const { tipoAfastamentoId, inicialProvavel, finalProvavel, inicialEfetivo, finalEfetivo } = req.body;
  
  if (!tipoAfastamentoId || !inicialProvavel || !finalProvavel) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'afastamentos',
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/afastamentos`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Campos obrigatórios faltando',
      severity: 'warn'
    });
    
    return res.status(400).json({ error: 'Campos obrigatórios faltando', code: 'MISSING_FIELDS' });
  }
  
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO afastamentos (id, colaborador_id, tipo_afastamento_id, inicial_provavel, final_provavel, inicial_efetivo, final_efetivo) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.colaboradorId, tipoAfastamentoId, inicialProvavel, finalProvavel, inicialEfetivo || null, finalEfetivo || null]
    );
    
    const [created] = await pool.query('SELECT * FROM afastamentos WHERE id = ?', [id]);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'afastamentos',
      entityId: id,
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/afastamentos`,
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body,
      newValues: created[0],
      severity: 'info'
    });
    
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Erro ao criar afastamento:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'afastamentos',
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/afastamentos`,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/afastamentos/:id - Excluir afastamento
app.delete('/api/afastamentos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM afastamentos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Afastamento não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir afastamento:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== HABILIDADES DE COLABORADORES ====================

// POST /api/colaboradores/:colaboradorId/habilidades - Adicionar habilidade
app.post('/api/colaboradores/:colaboradorId/habilidades', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const { habilidadeId, nivelDeclarado, nivelAvaliado, dataInicio, dataTermino } = req.body;
  
  if (!habilidadeId || !nivelDeclarado || !nivelAvaliado || !dataInicio) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_habilidades',
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/habilidades`,
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Campos obrigatórios faltando',
      severity: 'warn'
    });
    
    return res.status(400).json({ error: 'Campos obrigatórios faltando', code: 'MISSING_FIELDS' });
  }
  
  try {
    // Verificar se a habilidade já existe para este colaborador
    const [existing] = await pool.query(
      'SELECT * FROM colaborador_habilidades WHERE colaborador_id = ? AND habilidade_id = ?',
      [req.params.colaboradorId, habilidadeId]
    );
    
    if (existing.length > 0) {
      // Se já existe, atualizar ao invés de inserir
      await pool.query(
        'UPDATE colaborador_habilidades SET nivel_declarado = ?, nivel_avaliado = ?, data_inicio = ?, data_termino = ? WHERE id = ?',
        [nivelDeclarado, nivelAvaliado, dataInicio, dataTermino || null, existing[0].id]
      );
      const [updated] = await pool.query('SELECT * FROM colaborador_habilidades WHERE id = ?', [existing[0].id]);
      
      await logAuditoria({
        ...requestInfo,
        operationType: 'UPDATE',
        entityType: 'colaborador_habilidades',
        entityId: existing[0].id,
        method: 'POST',
        route: `/api/colaboradores/${req.params.colaboradorId}/habilidades`,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        payload: req.body,
        oldValues: existing[0],
        newValues: updated[0],
        severity: 'info'
      });
      
      return res.json(updated[0]);
    }
    
    // Se não existe, inserir nova
    const id = uuidv4();
    await pool.query(
      'INSERT INTO colaborador_habilidades (id, colaborador_id, habilidade_id, nivel_declarado, nivel_avaliado, data_inicio, data_termino) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.params.colaboradorId, habilidadeId, nivelDeclarado, nivelAvaliado, dataInicio, dataTermino || null]
    );
    
    const [created] = await pool.query('SELECT * FROM colaborador_habilidades WHERE id = ?', [id]);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_habilidades',
      entityId: id,
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/habilidades`,
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body,
      newValues: created[0],
      severity: 'info'
    });
    
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Erro ao adicionar habilidade:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'colaborador_habilidades',
      method: 'POST',
      route: `/api/colaboradores/${req.params.colaboradorId}/habilidades`,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/colaborador-habilidades/:id - Remover habilidade
app.delete('/api/colaborador-habilidades/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM colaborador_habilidades WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Habilidade não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover habilidade:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== HABILIDADES ====================

// GET /api/habilidades/diagnostico - Verificar estrutura da tabela
app.get('/api/habilidades/diagnostico', async (req, res) => {
  try {
    const [columns] = await pool.query('DESCRIBE habilidades');
    const [count] = await pool.query('SELECT COUNT(*) as total FROM habilidades');
    const [sample] = await pool.query('SELECT * FROM habilidades LIMIT 1');
    
    res.json({
      colunas: columns,
      total_registros: count[0].total,
      exemplo: sample[0] || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.get('/api/habilidades', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        sigla,
        descricao,
        tipo,
        dominio,
        subcategoria,
        created_at,
        updated_at
      FROM habilidades 
      ORDER BY sigla
    `);
    
    // Buscar certificações para todas as habilidades
    const habilidadesIds = rows.map(r => r.id);
    let certificacoesMap = {};
    
    if (habilidadesIds.length > 0) {
      const [certRows] = await pool.query(
        `SELECT id, habilidade_id, codigo, descricao, orgao_certificador, url_documentacao 
         FROM habilidade_certificacoes 
         WHERE habilidade_id IN (?)`,
        [habilidadesIds]
      );
      
      certRows.forEach(cert => {
        if (!certificacoesMap[cert.habilidade_id]) {
          certificacoesMap[cert.habilidade_id] = [];
        }
        certificacoesMap[cert.habilidade_id].push({
          id: cert.id,
          codigo: cert.codigo,
          descricao: cert.descricao,
          orgaoCertificador: cert.orgao_certificador,
          urlDocumentacao: cert.url_documentacao
        });
      });
    }
    
    // Mapear para o formato esperado pelo frontend
    const habilidades = rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao || row.sigla,
      tipo: row.tipo,
      dominio: row.dominio || row.tipo,
      subcategoria: row.subcategoria || 'Outras',
      certificacoes: certificacoesMap[row.id] || []
    }));
    
    res.json(habilidades);
  } catch (error) {
    console.error('Erro ao buscar habilidades:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.get('/api/habilidades/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        sigla,
        descricao,
        tipo,
        dominio,
        subcategoria,
        created_at,
        updated_at
      FROM habilidades 
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }
    
    // Buscar certificações desta habilidade
    const [certRows] = await pool.query(
      `SELECT id, codigo, descricao, orgao_certificador, url_documentacao 
       FROM habilidade_certificacoes 
       WHERE habilidade_id = ?`,
      [req.params.id]
    );
    
    const certificacoes = certRows.map(cert => ({
      id: cert.id,
      codigo: cert.codigo,
      descricao: cert.descricao,
      orgaoCertificador: cert.orgao_certificador,
      urlDocumentacao: cert.url_documentacao
    }));
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao || rows[0].sigla,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio || rows[0].tipo,
      subcategoria: rows[0].subcategoria || 'Outras',
      certificacoes
    };
    
    res.json(habilidade);
  } catch (error) {
    console.error('Erro ao buscar habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.post('/api/habilidades', async (req, res) => {
  try {
    // Frontend envia: sigla, descricao, tipo, dominio, subcategoria, certificacoes
    const { sigla, descricao, tipo, dominio, subcategoria, certificacoes } = req.body;
    
    if (!sigla || !tipo) {
      return res.status(400).json({ error: 'Sigla e tipo são obrigatórios' });
    }
    
    const id = uuidv4();
    await pool.query(
      'INSERT INTO habilidades (id, sigla, descricao, tipo, dominio, subcategoria) VALUES (?, ?, ?, ?, ?, ?)',
      [id, sigla, descricao || sigla, tipo, dominio || 'Desenvolvimento & Engenharia', subcategoria || 'Outras']
    );
    
    // Salvar certificações se houver
    if (certificacoes && certificacoes.length > 0) {
      for (const cert of certificacoes) {
        const certId = uuidv4();
        await pool.query(
          'INSERT INTO habilidade_certificacoes (id, habilidade_id, codigo, descricao, orgao_certificador, url_documentacao) VALUES (?, ?, ?, ?, ?, ?)',
          [certId, id, cert.codigo, cert.descricao, cert.orgaoCertificador, cert.urlDocumentacao || null]
        );
      }
    }
    
    // Buscar a habilidade criada com certificações
    const [rows] = await pool.query('SELECT * FROM habilidades WHERE id = ?', [id]);
    const [certRows] = await pool.query(
      'SELECT id, codigo, descricao, orgao_certificador, url_documentacao FROM habilidade_certificacoes WHERE habilidade_id = ?',
      [id]
    );
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio,
      subcategoria: rows[0].subcategoria,
      certificacoes: certRows.map(cert => ({
        id: cert.id,
        codigo: cert.codigo,
        descricao: cert.descricao,
        orgaoCertificador: cert.orgao_certificador,
        urlDocumentacao: cert.url_documentacao
      }))
    };
    
    res.status(201).json(habilidade);
  } catch (error) {
    console.error('Erro ao criar habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.put('/api/habilidades/:id', async (req, res) => {
  try {
    // Frontend envia: sigla, descricao, tipo, dominio, subcategoria, certificacoes
    const { sigla, descricao, tipo, dominio, subcategoria, certificacoes } = req.body;
    
    if (!sigla || !tipo) {
      return res.status(400).json({ error: 'Sigla e tipo são obrigatórios' });
    }
    
    await pool.query(
      'UPDATE habilidades SET sigla = ?, descricao = ?, tipo = ?, dominio = ?, subcategoria = ? WHERE id = ?',
      [sigla, descricao || sigla, tipo, dominio || 'Desenvolvimento & Engenharia', subcategoria || 'Outras', req.params.id]
    );
    
    // Deletar certificações antigas
    await pool.query('DELETE FROM habilidade_certificacoes WHERE habilidade_id = ?', [req.params.id]);
    
    // Inserir novas certificações
    if (certificacoes && certificacoes.length > 0) {
      for (const cert of certificacoes) {
        const certId = cert.id && cert.id.startsWith('cert-') ? uuidv4() : (cert.id || uuidv4());
        await pool.query(
          'INSERT INTO habilidade_certificacoes (id, habilidade_id, codigo, descricao, orgao_certificador, url_documentacao) VALUES (?, ?, ?, ?, ?, ?)',
          [certId, req.params.id, cert.codigo, cert.descricao, cert.orgaoCertificador, cert.urlDocumentacao || null]
        );
      }
    }
    
    const [rows] = await pool.query('SELECT * FROM habilidades WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }
    
    // Buscar certificações atualizadas
    const [certRows] = await pool.query(
      'SELECT id, codigo, descricao, orgao_certificador, url_documentacao FROM habilidade_certificacoes WHERE habilidade_id = ?',
      [req.params.id]
    );
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio,
      subcategoria: rows[0].subcategoria,
      certificacoes: certRows.map(cert => ({
        id: cert.id,
        codigo: cert.codigo,
        descricao: cert.descricao,
        orgaoCertificador: cert.orgao_certificador,
        urlDocumentacao: cert.url_documentacao
      }))
    };
    
    res.json(habilidade);
  } catch (error) {
    console.error('Erro ao atualizar habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.delete('/api/habilidades/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM habilidades WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

// ==================== CAPACIDADES DE NEGÓCIO ====================

app.get('/api/capacidades-negocio', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM capacidades_negocio ORDER BY nome');
    res.json(rows.map(mapCapacidadeNegocio));
  } catch (error) {
    console.error('Erro ao listar capacidades:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/capacidades-negocio/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM capacidades_negocio WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Capacidade não encontrada', code: 'NOT_FOUND' });
    }
    res.json(mapCapacidadeNegocio(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar capacidade:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/capacidades-negocio', async (req, res) => {
  const startTime = Date.now();
  const requestInfo = extractRequestInfo(req);
  
  const { sigla, nome, descricao, nivel, categoria, coberturaEstrategica } = req.body;
  
  if (!nome) {
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'capacidades_negocio',
      method: 'POST',
      route: '/api/capacidades-negocio',
      statusCode: 400,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: 'Campo nome é obrigatório',
      severity: 'warn'
    });
    
    return res.status(400).json({
      error: 'Campo nome é obrigatório',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    const id = uuidv4();
    
    // Extrair campos de coberturaEstrategica
    const alinhamentoObjetivos = coberturaEstrategica?.alinhamentoObjetivos || '';
    const beneficiosEsperados = coberturaEstrategica?.beneficiosEsperados || '';
    const estadoFuturoDesejado = coberturaEstrategica?.estadoFuturoDesejado || '';
    const gapEstadoAtualFuturo = coberturaEstrategica?.gapEstadoAtualFuturo || '';
    
    await pool.query(
      `INSERT INTO capacidades_negocio 
       (id, sigla, nome, descricao, nivel, categoria, 
        alinhamento_objetivos, beneficios_esperados, 
        estado_futuro_desejado, gap_estado_atual_futuro) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        sigla || null, 
        nome, 
        descricao || '', 
        nivel || null, 
        categoria || null,
        alinhamentoObjetivos,
        beneficiosEsperados,
        estadoFuturoDesejado,
        gapEstadoAtualFuturo
      ]
    );
    
    const [created] = await pool.query('SELECT * FROM capacidades_negocio WHERE id = ?', [id]);
    const result = mapCapacidadeNegocio(created[0]);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'capacidades_negocio',
      entityId: id,
      method: 'POST',
      route: '/api/capacidades-negocio',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      payload: req.body,
      newValues: result,
      severity: 'info'
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro ao criar capacidade:', error);
    
    await logAuditoria({
      ...requestInfo,
      operationType: 'INSERT',
      entityType: 'capacidades_negocio',
      method: 'POST',
      route: '/api/capacidades-negocio',
      statusCode: error.code === 'ER_DUP_ENTRY' ? 409 : 500,
      durationMs: Date.now() - startTime,
      payload: req.body,
      errorMessage: error.message,
      severity: 'error'
    });
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Capacidade já existe', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/capacidades-negocio/:id', async (req, res) => {
  const { sigla, nome, descricao, nivel, categoria, coberturaEstrategica } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM capacidades_negocio WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Capacidade não encontrada', code: 'NOT_FOUND' });
    }
    
    // Extrair campos de coberturaEstrategica se fornecidos
    const alinhamentoObjetivos = coberturaEstrategica?.alinhamentoObjetivos !== undefined 
      ? coberturaEstrategica.alinhamentoObjetivos 
      : existing[0].alinhamento_objetivos;
    const beneficiosEsperados = coberturaEstrategica?.beneficiosEsperados !== undefined 
      ? coberturaEstrategica.beneficiosEsperados 
      : existing[0].beneficios_esperados;
    const estadoFuturoDesejado = coberturaEstrategica?.estadoFuturoDesejado !== undefined 
      ? coberturaEstrategica.estadoFuturoDesejado 
      : existing[0].estado_futuro_desejado;
    const gapEstadoAtualFuturo = coberturaEstrategica?.gapEstadoAtualFuturo !== undefined 
      ? coberturaEstrategica.gapEstadoAtualFuturo 
      : existing[0].gap_estado_atual_futuro;
    
    await pool.query(
      `UPDATE capacidades_negocio SET 
       sigla = ?, nome = ?, descricao = ?, nivel = ?, categoria = ?,
       alinhamento_objetivos = ?, beneficios_esperados = ?,
       estado_futuro_desejado = ?, gap_estado_atual_futuro = ?
       WHERE id = ?`,
      [
        sigla !== undefined ? sigla : existing[0].sigla,
        nome || existing[0].nome,
        descricao !== undefined ? descricao : existing[0].descricao,
        nivel !== undefined ? nivel : existing[0].nivel,
        categoria !== undefined ? categoria : existing[0].categoria,
        alinhamentoObjetivos,
        beneficiosEsperados,
        estadoFuturoDesejado,
        gapEstadoAtualFuturo,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM capacidades_negocio WHERE id = ?', [req.params.id]);
    res.json(mapCapacidadeNegocio(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar capacidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/capacidades-negocio/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM capacidades_negocio WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Capacidade não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir capacidade:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIAS ====================

app.get('/api/tecnologias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tecnologias ORDER BY sigla');
    res.json(rows.map(mapTecnologia));
  } catch (error) {
    console.error('Erro ao listar tecnologias:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/tecnologias/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tecnologias WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tecnologia não encontrada', code: 'NOT_FOUND' });
    }
    res.json(mapTecnologia(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar tecnologia:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias', async (req, res) => {
  const {
    sigla,
    nome,
    versaoRelease,
    camada,
    categoria,
    status,
    fornecedorFabricante,
    tipoLicenciamento,
    maturidadeInterna,
    nivelSuporteInterno,
    ambienteDev,
    ambienteQa,
    ambienteProd,
    ambienteCloud,
    ambienteOnPremise
  } = req.body;

  // Validações
  if (!sigla || !nome || !camada) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [!sigla && 'sigla', !nome && 'nome', !camada && 'camada'].filter(Boolean)
    });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologias (
        id, sigla, nome, versao_release, camada, categoria, status,
        fornecedor_fabricante, tipo_licenciamento, maturidade_interna,
        nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod,
        ambiente_cloud, ambiente_on_premise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sigla, nome, versaoRelease || null, camada, categoria || null, status || null,
        fornecedorFabricante || null, tipoLicenciamento || null, maturidadeInterna || null,
        nivelSuporteInterno || null, ambienteDev || false, ambienteQa || false,
        ambienteProd || false, ambienteCloud || false, ambienteOnPremise || false
      ]
    );

    const [created] = await pool.query('SELECT * FROM tecnologias WHERE id = ?', [id]);
    res.status(201).json(mapTecnologia(created[0]));
  } catch (error) {
    console.error('Erro ao criar tecnologia:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Sigla já cadastrada', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id', async (req, res) => {
  const {
    sigla,
    nome,
    versaoRelease,
    camada,
    categoria,
    status,
    fornecedorFabricante,
    tipoLicenciamento,
    maturidadeInterna,
    nivelSuporteInterno,
    ambienteDev,
    ambienteQa,
    ambienteProd,
    ambienteCloud,
    ambienteOnPremise
  } = req.body;

  // Validações
  if (!sigla || !nome || !camada) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [!sigla && 'sigla', !nome && 'nome', !camada && 'camada'].filter(Boolean)
    });
  }

  try {
    const [result] = await pool.query(
      `UPDATE tecnologias SET
        sigla = ?, nome = ?, versao_release = ?, camada = ?, categoria = ?, status = ?,
        fornecedor_fabricante = ?, tipo_licenciamento = ?, maturidade_interna = ?,
        nivel_suporte_interno = ?, ambiente_dev = ?, ambiente_qa = ?, ambiente_prod = ?,
        ambiente_cloud = ?, ambiente_on_premise = ?
      WHERE id = ?`,
      [
        sigla, nome, versaoRelease, camada, categoria, status,
        fornecedorFabricante, tipoLicenciamento, maturidadeInterna,
        nivelSuporteInterno, ambienteDev, ambienteQa, ambienteProd,
        ambienteCloud, ambienteOnPremise, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tecnologia não encontrada', code: 'NOT_FOUND' });
    }

    const [updated] = await pool.query('SELECT * FROM tecnologias WHERE id = ?', [req.params.id]);
    res.json(mapTecnologia(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar tecnologia:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Sigla já cadastrada', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tecnologias WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tecnologia não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir tecnologia:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIA RESPONSÁVEIS ====================

function mapTecnologiaResponsavel(row) {
  return {
    id: row.id,
    tecnologiaId: row.tecnologia_id,
    colaboradorId: row.colaborador_id,
    perfil: row.perfil,
    dataInicio: row.data_inicio,
    dataTermino: row.data_termino,
    status: row.status,
    observacoes: row.observacoes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/tecnologias/:id/responsaveis', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tecnologia_responsaveis WHERE tecnologia_id = ? ORDER BY data_inicio DESC',
      [req.params.id]
    );
    res.json(rows.map(mapTecnologiaResponsavel));
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias/:id/responsaveis', async (req, res) => {
  const { colaboradorId, perfil, dataInicio, dataTermino, status, observacoes } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologia_responsaveis 
        (id, tecnologia_id, colaborador_id, perfil, data_inicio, data_termino, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, colaboradorId, perfil, formatDateForMySQL(dataInicio), formatDateForMySQL(dataTermino), status, observacoes || null]
    );
    
    const [created] = await pool.query('SELECT * FROM tecnologia_responsaveis WHERE id = ?', [id]);
    res.status(201).json(mapTecnologiaResponsavel(created[0]));
  } catch (error) {
    console.error('Erro ao criar responsável:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id/responsaveis/:respId', async (req, res) => {
  const { colaboradorId, perfil, dataInicio, dataTermino, status, observacoes } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tecnologia_responsaveis WHERE id = ? AND tecnologia_id = ?',
      [req.params.respId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Responsável não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE tecnologia_responsaveis SET 
        colaborador_id = ?, perfil = ?, data_inicio = ?, data_termino = ?, 
        status = ?, observacoes = ?
      WHERE id = ?`,
      [
        colaboradorId !== undefined ? colaboradorId : existing[0].colaborador_id,
        perfil !== undefined ? perfil : existing[0].perfil,
        dataInicio !== undefined ? formatDateForMySQL(dataInicio) : existing[0].data_inicio,
        dataTermino !== undefined ? formatDateForMySQL(dataTermino) : existing[0].data_termino,
        status !== undefined ? status : existing[0].status,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        req.params.respId
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tecnologia_responsaveis WHERE id = ?', [req.params.respId]);
    res.json(mapTecnologiaResponsavel(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar responsável:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id/responsaveis/:respId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tecnologia_responsaveis WHERE id = ? AND tecnologia_id = ?',
      [req.params.respId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Responsável não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir responsável:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIA CONTRATOS ====================

function mapTecnologiaContrato(row) {
  return {
    id: row.id,
    tecnologiaId: row.tecnologia_id,
    numeroContrato: row.numero_contrato,
    vigenciaInicial: row.vigencia_inicial,
    vigenciaTermino: row.vigencia_termino,
    valorContrato: row.valor_contrato ? parseFloat(row.valor_contrato) : 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/tecnologias/:id/contratos', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tecnologia_contratos WHERE tecnologia_id = ? ORDER BY vigencia_inicial DESC',
      [req.params.id]
    );
    res.json(rows.map(mapTecnologiaContrato));
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias/:id/contratos', async (req, res) => {
  const { numeroContrato, vigenciaInicial, vigenciaTermino, valorContrato, status } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologia_contratos 
        (id, tecnologia_id, numero_contrato, vigencia_inicial, vigencia_termino, valor_contrato, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, numeroContrato, formatDateForMySQL(vigenciaInicial), formatDateForMySQL(vigenciaTermino), valorContrato, status]
    );
    
    const [created] = await pool.query('SELECT * FROM tecnologia_contratos WHERE id = ?', [id]);
    res.status(201).json(mapTecnologiaContrato(created[0]));
  } catch (error) {
    console.error('Erro ao criar contrato:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id/contratos/:contratoId', async (req, res) => {
  const { numeroContrato, vigenciaInicial, vigenciaTermino, valorContrato, status } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tecnologia_contratos WHERE id = ? AND tecnologia_id = ?',
      [req.params.contratoId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE tecnologia_contratos SET 
        numero_contrato = ?, vigencia_inicial = ?, vigencia_termino = ?, 
        valor_contrato = ?, status = ?
      WHERE id = ?`,
      [
        numeroContrato !== undefined ? numeroContrato : existing[0].numero_contrato,
        vigenciaInicial !== undefined ? formatDateForMySQL(vigenciaInicial) : existing[0].vigencia_inicial,
        vigenciaTermino !== undefined ? formatDateForMySQL(vigenciaTermino) : existing[0].vigencia_termino,
        valorContrato !== undefined ? valorContrato : existing[0].valor_contrato,
        status !== undefined ? status : existing[0].status,
        req.params.contratoId
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tecnologia_contratos WHERE id = ?', [req.params.contratoId]);
    res.json(mapTecnologiaContrato(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar contrato:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id/contratos/:contratoId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tecnologia_contratos WHERE id = ? AND tecnologia_id = ?',
      [req.params.contratoId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contrato não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir contrato:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIA CONTRATOS AMS ====================

function mapTecnologiaContratoAMS(row) {
  return {
    id: row.id,
    tecnologiaId: row.tecnologia_id,
    contrato: row.contrato,
    cnpjContratado: row.cnpj_contratado,
    custoAnual: row.custo_anual ? parseFloat(row.custo_anual) : 0,
    dataInicio: row.data_inicio,
    dataTermino: row.data_termino,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/tecnologias/:id/contratos-ams', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tecnologia_contratos_ams WHERE tecnologia_id = ? ORDER BY data_inicio DESC',
      [req.params.id]
    );
    res.json(rows.map(mapTecnologiaContratoAMS));
  } catch (error) {
    console.error('Erro ao buscar contratos AMS:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias/:id/contratos-ams', async (req, res) => {
  const { contrato, cnpjContratado, custoAnual, dataInicio, dataTermino, status } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologia_contratos_ams 
        (id, tecnologia_id, contrato, cnpj_contratado, custo_anual, data_inicio, data_termino, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, contrato, cnpjContratado, custoAnual, formatDateForMySQL(dataInicio), formatDateForMySQL(dataTermino), status]
    );
    
    const [created] = await pool.query('SELECT * FROM tecnologia_contratos_ams WHERE id = ?', [id]);
    res.status(201).json(mapTecnologiaContratoAMS(created[0]));
  } catch (error) {
    console.error('Erro ao criar contrato AMS:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id/contratos-ams/:contratoId', async (req, res) => {
  const { contrato, cnpjContratado, custoAnual, dataInicio, dataTermino, status } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tecnologia_contratos_ams WHERE id = ? AND tecnologia_id = ?',
      [req.params.contratoId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contrato AMS não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE tecnologia_contratos_ams SET 
        contrato = ?, cnpj_contratado = ?, custo_anual = ?, 
        data_inicio = ?, data_termino = ?, status = ?
      WHERE id = ?`,
      [
        contrato !== undefined ? contrato : existing[0].contrato,
        cnpjContratado !== undefined ? cnpjContratado : existing[0].cnpj_contratado,
        custoAnual !== undefined ? custoAnual : existing[0].custo_anual,
        dataInicio !== undefined ? formatDateForMySQL(dataInicio) : existing[0].data_inicio,
        dataTermino !== undefined ? formatDateForMySQL(dataTermino) : existing[0].data_termino,
        status !== undefined ? status : existing[0].status,
        req.params.contratoId
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tecnologia_contratos_ams WHERE id = ?', [req.params.contratoId]);
    res.json(mapTecnologiaContratoAMS(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar contrato AMS:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id/contratos-ams/:contratoId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tecnologia_contratos_ams WHERE id = ? AND tecnologia_id = ?',
      [req.params.contratoId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Contrato AMS não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir contrato AMS:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIA CUSTOS SAAS ====================

function mapTecnologiaCustoSaaS(row) {
  return {
    id: row.id,
    tecnologiaId: row.tecnologia_id,
    custoTotalSaaS: row.custo_total_saas ? parseFloat(row.custo_total_saas) : 0,
    custoPorLicenca: row.custo_por_licenca ? parseFloat(row.custo_por_licenca) : 0,
    numeroLicencasContratadas: row.numero_licencas_contratadas,
    licencasUtilizadas: row.licencas_utilizadas,
    crescimentoCustoMensalMoM: row.crescimento_custo_mensal_mom ? parseFloat(row.crescimento_custo_mensal_mom) : 0,
    slaCumprido: row.sla_cumprido ? parseFloat(row.sla_cumprido) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/tecnologias/:id/custos-saas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tecnologia_custos_saas WHERE tecnologia_id = ?',
      [req.params.id]
    );
    res.json(rows.map(mapTecnologiaCustoSaaS));
  } catch (error) {
    console.error('Erro ao buscar custos SaaS:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias/:id/custos-saas', async (req, res) => {
  const { custoTotalSaaS, custoPorLicenca, numeroLicencasContratadas, licencasUtilizadas, crescimentoCustoMensalMoM, slaCumprido } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologia_custos_saas 
        (id, tecnologia_id, custo_total_saas, custo_por_licenca, numero_licencas_contratadas, 
         licencas_utilizadas, crescimento_custo_mensal_mom, sla_cumprido)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, custoTotalSaaS, custoPorLicenca, numeroLicencasContratadas, 
       licencasUtilizadas, crescimentoCustoMensalMoM, slaCumprido]
    );
    
    const [created] = await pool.query('SELECT * FROM tecnologia_custos_saas WHERE id = ?', [id]);
    res.status(201).json(mapTecnologiaCustoSaaS(created[0]));
  } catch (error) {
    console.error('Erro ao criar custo SaaS:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id/custos-saas/:custoId', async (req, res) => {
  const { custoTotalSaaS, custoPorLicenca, numeroLicencasContratadas, licencasUtilizadas, crescimentoCustoMensalMoM, slaCumprido } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tecnologia_custos_saas WHERE id = ? AND tecnologia_id = ?',
      [req.params.custoId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Custo SaaS não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE tecnologia_custos_saas SET 
        custo_total_saas = ?, custo_por_licenca = ?, numero_licencas_contratadas = ?, 
        licencas_utilizadas = ?, crescimento_custo_mensal_mom = ?, sla_cumprido = ?
      WHERE id = ?`,
      [
        custoTotalSaaS !== undefined ? custoTotalSaaS : existing[0].custo_total_saas,
        custoPorLicenca !== undefined ? custoPorLicenca : existing[0].custo_por_licenca,
        numeroLicencasContratadas !== undefined ? numeroLicencasContratadas : existing[0].numero_licencas_contratadas,
        licencasUtilizadas !== undefined ? licencasUtilizadas : existing[0].licencas_utilizadas,
        crescimentoCustoMensalMoM !== undefined ? crescimentoCustoMensalMoM : existing[0].crescimento_custo_mensal_mom,
        slaCumprido !== undefined ? slaCumprido : existing[0].sla_cumprido,
        req.params.custoId
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tecnologia_custos_saas WHERE id = ?', [req.params.custoId]);
    res.json(mapTecnologiaCustoSaaS(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar custo SaaS:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id/custos-saas/:custoId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tecnologia_custos_saas WHERE id = ? AND tecnologia_id = ?',
      [req.params.custoId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Custo SaaS não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir custo SaaS:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== TECNOLOGIA MANUTENÇÕES SAAS ====================

function mapTecnologiaManutencaoSaaS(row) {
  return {
    id: row.id,
    tecnologiaId: row.tecnologia_id,
    dataHoraInicio: row.data_hora_inicio,
    dataHoraTermino: row.data_hora_termino,
    tempoIndisponibilidadeHoras: row.tempo_indisponibilidade_horas ? parseFloat(row.tempo_indisponibilidade_horas) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/tecnologias/:id/manutencoes-saas', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tecnologia_manutencoes_saas WHERE tecnologia_id = ? ORDER BY data_hora_inicio DESC',
      [req.params.id]
    );
    res.json(rows.map(mapTecnologiaManutencaoSaaS));
  } catch (error) {
    console.error('Erro ao buscar manutenções SaaS:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/tecnologias/:id/manutencoes-saas', async (req, res) => {
  const { dataHoraInicio, dataHoraTermino, tempoIndisponibilidadeHoras } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologia_manutencoes_saas 
        (id, tecnologia_id, data_hora_inicio, data_hora_termino, tempo_indisponibilidade_horas)
      VALUES (?, ?, ?, ?, ?)`,
      [id, req.params.id, dataHoraInicio, dataHoraTermino, tempoIndisponibilidadeHoras]
    );
    
    const [created] = await pool.query('SELECT * FROM tecnologia_manutencoes_saas WHERE id = ?', [id]);
    res.status(201).json(mapTecnologiaManutencaoSaaS(created[0]));
  } catch (error) {
    console.error('Erro ao criar manutenção SaaS:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/tecnologias/:id/manutencoes-saas/:manutencaoId', async (req, res) => {
  const { dataHoraInicio, dataHoraTermino, tempoIndisponibilidadeHoras } = req.body;
  
  try {
    const [existing] = await pool.query(
      'SELECT * FROM tecnologia_manutencoes_saas WHERE id = ? AND tecnologia_id = ?',
      [req.params.manutencaoId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Manutenção SaaS não encontrada', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE tecnologia_manutencoes_saas SET 
        data_hora_inicio = ?, data_hora_termino = ?, tempo_indisponibilidade_horas = ?
      WHERE id = ?`,
      [
        dataHoraInicio !== undefined ? dataHoraInicio : existing[0].data_hora_inicio,
        dataHoraTermino !== undefined ? dataHoraTermino : existing[0].data_hora_termino,
        tempoIndisponibilidadeHoras !== undefined ? tempoIndisponibilidadeHoras : existing[0].tempo_indisponibilidade_horas,
        req.params.manutencaoId
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM tecnologia_manutencoes_saas WHERE id = ?', [req.params.manutencaoId]);
    res.json(mapTecnologiaManutencaoSaaS(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar manutenção SaaS:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/tecnologias/:id/manutencoes-saas/:manutencaoId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM tecnologia_manutencoes_saas WHERE id = ? AND tecnologia_id = ?',
      [req.params.manutencaoId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Manutenção SaaS não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir manutenção SaaS:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== APLICAÇÕES ====================

function mapAplicacao(row) {
  return {
    id: row.id,
    sigla: row.sigla,
    descricao: row.descricao,
    urlDocumentacao: row.url_documentacao,
    tipoAplicacao: row.tipo_aplicacao,
    optInOut: row.opt_in_out ? Boolean(row.opt_in_out) : false,
    cloudProvider: row.cloud_provider,
    faseCicloVida: row.fase_ciclo_vida,
    criticidadeNegocio: row.criticidade_negocio,
    categoriaSistema: row.categoria_sistema,
    fornecedor: row.fornecedor,
    tipoHospedagem: row.tipo_hospedagem,
    custoMensal: row.custo_mensal ? parseFloat(row.custo_mensal) : null,
    numeroUsuarios: row.numero_usuarios,
    dataImplantacao: row.data_implantacao,
    versaoAtual: row.versao_atual,
    responsavelTecnico: row.responsavel_tecnico,
    responsavelNegocio: row.responsavel_negocio,
    statusOperacional: row.status_operacional,
    observacoes: row.observacoes,
    tecnologias: row.tecnologias ? (typeof row.tecnologias === 'string' ? JSON.parse(row.tecnologias) : row.tecnologias) : [],
    ambientes: row.ambientes ? (typeof row.ambientes === 'string' ? JSON.parse(row.ambientes) : row.ambientes) : [],
    capacidades: row.capacidades ? (typeof row.capacidades === 'string' ? JSON.parse(row.capacidades) : row.capacidades) : [],
    processos: row.processos ? (typeof row.processos === 'string' ? JSON.parse(row.processos) : row.processos) : [],
    integracoes: row.integracoes ? (typeof row.integracoes === 'string' ? JSON.parse(row.integracoes) : row.integracoes) : [],
    slas: row.slas ? (typeof row.slas === 'string' ? JSON.parse(row.slas) : row.slas) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/aplicacoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aplicacoes ORDER BY sigla');
    
    // Para cada aplicação, carregar as relações com contagem
    const aplicacoesComRelacoes = await Promise.all(rows.map(async (app) => {
      const aplicacao = mapAplicacao(app);
      
      // Carregar tecnologias
      try {
        const [tecnologias] = await pool.query(`
          SELECT at.id, at.tecnologia_id as tecnologiaId, at.data_inicio as dataInicio, 
                 at.data_termino as dataTermino, at.status,
                 t.sigla, t.nome
          FROM aplicacao_tecnologias at
          JOIN tecnologias t ON at.tecnologia_id = t.id
          WHERE at.aplicacao_id = ?
        `, [app.id]);
        aplicacao.tecnologias = tecnologias;
      } catch (e) {
        aplicacao.tecnologias = [];
      }

      // Carregar ambientes
      try {
        const [ambientes] = await pool.query(`
          SELECT id, 
                 COALESCE(identificador_aplicacao, 'api') as identificadorAplicacao, 
                 tipo_ambiente as tipoAmbiente,
                 COALESCE(localizacao_regiao, 'not-specified') as localizacaoRegiao, 
                 url_ambiente as urlAmbiente, 
                 data_criacao as dataCriacao, 
                 tempo_liberacao as tempoLiberacao, 
                 status
          FROM aplicacao_ambientes
          WHERE aplicacao_id = ?
        `, [app.id]);
        aplicacao.ambientes = ambientes;
      } catch (e) {
        aplicacao.ambientes = [];
      }

      // Carregar capacidades
      try {
        const [capacidades] = await pool.query(`
          SELECT ac.id, ac.capacidade_id as capacidadeId, ac.grau_cobertura as grauCobertura,
                 ac.data_inicio as dataInicio, ac.data_termino as dataTermino, ac.status,
                 c.sigla, c.nome
          FROM aplicacao_capacidades ac
          JOIN capacidades_negocio c ON ac.capacidade_id = c.id
          WHERE ac.aplicacao_id = ?
        `, [app.id]);
        aplicacao.capacidades = capacidades;
      } catch (e) {
        aplicacao.capacidades = [];
      }

      // Carregar processos
      try {
        const [processos] = await pool.query(`
          SELECT ap.id, ap.processo_id as processoId, ap.tipo_suporte as tipoSuporte,
                 ap.criticidade, ap.data_inicio as dataInicio, 
                 ap.data_termino as dataTermino, ap.status,
                 p.identificacao, p.nome, p.area_responsavel, p.nivel_maturidade, p.complexidade
          FROM aplicacao_processos ap
          JOIN processos_negocio p ON ap.processo_id = p.id
          WHERE ap.aplicacao_id = ?
        `, [app.id]);
        aplicacao.processos = processos;
      } catch (e) {
        aplicacao.processos = [];
      }

      // Carregar integracoes
      try {
        const [integracoes] = await pool.query(`
          SELECT ai.id, ai.aplicacao_destino_id as aplicacaoDestinoId, 
                 ai.tipo_integracao as tipoIntegracao, ai.protocolo, ai.frequencia,
                 ai.descricao, ai.status,
                 a.sigla, a.descricao as nomeAplicacao
          FROM aplicacao_integracoes ai
          JOIN aplicacoes a ON ai.aplicacao_destino_id = a.id
          WHERE ai.aplicacao_id = ?
        `, [app.id]);
        aplicacao.integracoes = integracoes;
      } catch (e) {
        aplicacao.integracoes = [];
      }

      // Carregar slas
      try {
        const [slas] = await pool.query(`
          SELECT asla.id, asla.sla_id as slaId, asla.descricao,
                 asla.data_inicio as dataInicio, asla.data_termino as dataTermino, 
                 asla.status,
                 s.sigla, s.tipo_sla as tipoSla
          FROM aplicacao_slas asla
          JOIN slas s ON asla.sla_id = s.id
          WHERE asla.aplicacao_id = ?
        `, [app.id]);
        aplicacao.slas = slas;
      } catch (e) {
        aplicacao.slas = [];
      }

      // Carregar runbooks
      try {
        const [runbooks] = await pool.query(`
          SELECT ar.id, ar.runbook_id as runbookId, ar.descricao,
                 ar.data_associacao as dataAssociacao, ar.status,
                 r.sigla, r.descricao_resumida as descricaoResumida, r.tipo_runbook as tipoRunbook
          FROM aplicacao_runbooks ar
          JOIN runbooks r ON ar.runbook_id = r.id
          WHERE ar.aplicacao_id = ?
        `, [app.id]);
        aplicacao.runbooks = runbooks;
      } catch (e) {
        aplicacao.runbooks = [];
      }

      // Carregar servidores
      try {
        const [servidores] = await pool.query(`
          SELECT 
            sa.id,
            sa.servidor_id as servidorId,
            sa.aplicacao_id as aplicacaoId,
            sa.data_inicio as dataInicio,
            sa.data_termino as dataTermino,
            sa.status,
            se.sigla as servidorSigla,
            se.hostname as servidorHostname,
            se.tipo as tipoServidor,
            se.sistema_operacional as sistemaOperacional
          FROM servidor_aplicacao sa
          INNER JOIN servidores se ON sa.servidor_id = se.id
          WHERE sa.aplicacao_id = ?
          ORDER BY se.sigla
        `, [app.id]);
        aplicacao.servidores = servidores;
      } catch (e) {
        aplicacao.servidores = [];
      }

      return aplicacao;
    }));
    
    res.json(aplicacoesComRelacoes);
  } catch (error) {
    console.error('Erro ao listar aplicações:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// Endpoint para estatísticas de aplicações
app.get('/api/aplicacoes-stats', async (req, res) => {
  try {
    // Total de aplicações
    const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM aplicacoes');
    const total = totalResult[0].total;

    // Por tipo de aplicação
    const [tipoResult] = await pool.query(`
      SELECT tipo_aplicacao, COUNT(*) as quantidade 
      FROM aplicacoes 
      WHERE tipo_aplicacao IS NOT NULL
      GROUP BY tipo_aplicacao
      ORDER BY quantidade DESC
    `);

    // Por fase do ciclo de vida
    const [faseResult] = await pool.query(`
      SELECT fase_ciclo_vida, COUNT(*) as quantidade 
      FROM aplicacoes 
      WHERE fase_ciclo_vida IS NOT NULL
      GROUP BY fase_ciclo_vida
      ORDER BY quantidade DESC
    `);

    // Por criticidade do negócio
    const [criticidadeResult] = await pool.query(`
      SELECT criticidade_negocio, COUNT(*) as quantidade 
      FROM aplicacoes 
      WHERE criticidade_negocio IS NOT NULL
      GROUP BY criticidade_negocio
      ORDER BY quantidade DESC
    `);

    res.json({
      total,
      porTipo: tipoResult.map(row => ({
        tipo: row.tipo_aplicacao,
        quantidade: row.quantidade
      })),
      porFase: faseResult.map(row => ({
        fase: row.fase_ciclo_vida,
        quantidade: row.quantidade
      })),
      porCriticidade: criticidadeResult.map(row => ({
        criticidade: row.criticidade_negocio,
        quantidade: row.quantidade
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de aplicações:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/aplicacoes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM aplicacoes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
    }
    
    const aplicacao = mapAplicacao(rows[0]);

    // Carregar tecnologias
    try {
      const [tecnologias] = await pool.query(`
        SELECT at.id, at.tecnologia_id as tecnologiaId, at.data_inicio as dataInicio, 
               at.data_termino as dataTermino, at.status,
               t.sigla, t.nome
        FROM aplicacao_tecnologias at
        JOIN tecnologias t ON at.tecnologia_id = t.id
        WHERE at.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.tecnologias = tecnologias;
    } catch (e) {
      aplicacao.tecnologias = [];
    }

    // Carregar ambientes
    try {
      const [ambientes] = await pool.query(`
        SELECT id, 
               COALESCE(identificador_aplicacao, 'api') as identificadorAplicacao, 
               tipo_ambiente as tipoAmbiente,
               COALESCE(localizacao_regiao, 'not-specified') as localizacaoRegiao, 
               url_ambiente as urlAmbiente, 
               data_criacao as dataCriacao, 
               tempo_liberacao as tempoLiberacao, 
               status
        FROM aplicacao_ambientes
        WHERE aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.ambientes = ambientes;
    } catch (e) {
      aplicacao.ambientes = [];
    }

    // Carregar capacidades
    try {
      const [capacidades] = await pool.query(`
        SELECT ac.id, ac.capacidade_id as capacidadeId, ac.grau_cobertura as grauCobertura,
               ac.data_inicio as dataInicio, ac.data_termino as dataTermino, ac.status,
               c.sigla, c.nome
        FROM aplicacao_capacidades ac
        JOIN capacidades_negocio c ON ac.capacidade_id = c.id
        WHERE ac.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.capacidades = capacidades;
    } catch (e) {
      aplicacao.capacidades = [];
    }

    // Carregar processos
    try {
      const [processos] = await pool.query(`
        SELECT ap.id, ap.processo_id as processoId, ap.tipo_suporte as tipoSuporte,
               ap.criticidade, ap.data_inicio as dataInicio, 
               ap.data_termino as dataTermino, ap.status,
               p.identificacao, p.nome
        FROM aplicacao_processos ap
        JOIN processos_negocio p ON ap.processo_id = p.id
        WHERE ap.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.processos = processos;
    } catch (e) {
      aplicacao.processos = [];
    }

    // Carregar integracoes
    try {
      const [integracoes] = await pool.query(`
        SELECT ai.id, ai.aplicacao_destino_id as aplicacaoDestinoId, 
               ai.tipo_integracao as tipoIntegracao, ai.protocolo, ai.frequencia,
               ai.descricao, ai.status,
               a.sigla, a.descricao as nomeAplicacao
        FROM aplicacao_integracoes ai
        JOIN aplicacoes a ON ai.aplicacao_destino_id = a.id
        WHERE ai.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.integracoes = integracoes;
    } catch (e) {
      aplicacao.integracoes = [];
    }

    // Carregar slas
    try {
      const [slas] = await pool.query(`
        SELECT asla.id, asla.sla_id as slaId, asla.descricao,
               asla.data_inicio as dataInicio, asla.data_termino as dataTermino, 
               asla.status,
               s.sigla, s.tipo_sla as tipoSla
        FROM aplicacao_slas asla
        JOIN slas s ON asla.sla_id = s.id
        WHERE asla.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.slas = slas;
    } catch (e) {
      aplicacao.slas = [];
    }

    // Carregar runbooks
    try {
      const [runbooks] = await pool.query(`
        SELECT ar.id, ar.runbook_id as runbookId, ar.descricao,
               ar.data_associacao as dataAssociacao, ar.status,
               r.sigla, r.descricao_resumida as descricaoResumida, r.tipo_runbook as tipoRunbook
        FROM aplicacao_runbooks ar
        JOIN runbooks r ON ar.runbook_id = r.id
        WHERE ar.aplicacao_id = ?
      `, [req.params.id]);
      aplicacao.runbooks = runbooks;
    } catch (e) {
      aplicacao.runbooks = [];
    }

    // Carregar squads
    try {
      const [squads] = await pool.query(`
        SELECT asq.id, asq.colaborador_id as colaboradorId, asq.perfil, asq.squad,
               asq.data_inicio as dataInicio, asq.data_termino as dataTermino, asq.status,
               c.nome as colaboradorNome, c.matricula as colaboradorMatricula
        FROM aplicacao_squads asq
        JOIN colaboradores c ON asq.colaborador_id = c.id
        WHERE asq.aplicacao_id = ?
        ORDER BY asq.data_inicio DESC
      `, [req.params.id]);
      aplicacao.squads = squads;
    } catch (e) {
      aplicacao.squads = [];
    }

    // Carregar ADRs
    try {
      const [adrs] = await pool.query(`
        SELECT aa.id, aa.adr_id as adrId, aa.aplicacao_id as aplicacaoId,
               aa.data_inicio as dataInicio, aa.data_termino as dataTermino, 
               aa.status, aa.observacoes,
               a.sequencia as adrSequencia, a.descricao as adrDescricao, 
               a.contexto as adrContexto, a.decisao as adrDecisao, 
               a.justificativa as adrJustificativa,
               a.consequencias_positivas as adrConsequenciasPositivas,
               a.consequencias_negativas as adrConsequenciasNegativas,
               a.status as adrStatus, a.data_criacao as adrDataCriacao
        FROM adr_aplicacoes aa
        JOIN adrs a ON aa.adr_id = a.id
        WHERE aa.aplicacao_id = ?
        ORDER BY a.sequencia
      `, [req.params.id]);
      aplicacao.adrs = adrs;
    } catch (e) {
      aplicacao.adrs = [];
    }

    // Carregar servidores
    try {
      const [servidores] = await pool.query(`
        SELECT 
          sa.id,
          sa.servidor_id as servidorId,
          sa.aplicacao_id as aplicacaoId,
          sa.data_inicio as dataInicio,
          sa.data_termino as dataTermino,
          sa.status,
          se.sigla as servidorSigla,
          se.hostname as servidorHostname,
          se.tipo as tipoServidor,
          se.sistema_operacional as sistemaOperacional
        FROM servidor_aplicacao sa
        INNER JOIN servidores se ON sa.servidor_id = se.id
        WHERE sa.aplicacao_id = ?
        ORDER BY se.sigla
      `, [req.params.id]);
      aplicacao.servidores = servidores;
    } catch (e) {
      aplicacao.servidores = [];
    }

    // Carregar payloads
    try {
      const [payloads] = await pool.query(`
        SELECT id, aplicacao_id as aplicacaoId, sigla, definicao, descricao,
               formato_arquivo as formatoArquivo, versao_openapi as versaoOpenapi,
               arquivo_valido as arquivoValido, data_inicio as dataInicio, 
               data_termino as dataTermino
        FROM payloads
        WHERE aplicacao_id = ?
        ORDER BY data_inicio DESC
      `, [req.params.id]);
      aplicacao.payloads = payloads;
    } catch (e) {
      aplicacao.payloads = [];
    }

    // Carregar contratos
    try {
      const [contratos] = await pool.query(`
        SELECT id, aplicacao_id as aplicacaoId, numero_contrato as numeroContrato, 
               data_vigencia_inicial as dataVigenciaInicial, 
               data_vigencia_final as dataVigenciaFinal, status
        FROM contratos
        WHERE aplicacao_id = ?
        ORDER BY data_vigencia_inicial DESC
      `, [req.params.id]);
      aplicacao.contratos = contratos;
    } catch (e) {
      aplicacao.contratos = [];
    }

    // Carregar projetos
    try {
      const [projetos] = await pool.query(`
        SELECT id, aplicacao_id as aplicacaoId, nome_projeto as nomeProjeto,
               ia_selecionada as iaSelecionada, gerador_projetos as geradorProjetos,
               created_at as createdAt
        FROM projetos_sdd
        WHERE aplicacao_id = ?
        ORDER BY created_at DESC
      `, [req.params.id]);
      aplicacao.projetos = projetos;
    } catch (e) {
      aplicacao.projetos = [];
    }

    res.json(aplicacao);
  } catch (error) {
    console.error('Erro ao buscar aplicação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/aplicacoes', async (req, res) => {
  console.log('[API POST /aplicacoes] ========== NOVA REQUISIÇÃO ==========');
  console.log('[API POST /aplicacoes] Body recebido:', JSON.stringify(req.body, null, 2));
  console.log('[API POST /aplicacoes] Tecnologias:', req.body.tecnologias);
  console.log('[API POST /aplicacoes] Contadores:', {
    tecnologias: req.body.tecnologias?.length || 0,
    ambientes: req.body.ambientes?.length || 0,
    capacidades: req.body.capacidades?.length || 0,
    processos: req.body.processos?.length || 0,
    integracoes: req.body.integracoes?.length || 0,
    slas: req.body.slas?.length || 0,
    runbooks: req.body.runbooks?.length || 0
  });

  const { 
    sigla, 
    descricao, 
    urlDocumentacao,
    tipoAplicacao,
    cloudProvider,
    faseCicloVida, 
    criticidadeNegocio,
    optInOut,
    categoriaSistema,
    fornecedor,
    tipoHospedagem,
    custoMensal,
    numeroUsuarios,
    dataImplantacao,
    versaoAtual,
    responsavelTecnico,
    responsavelNegocio,
    statusOperacional,
    observacoes,
    tecnologias,
    ambientes,
    capacidades,
    processos,
    integracoes,
    slas,
    runbooks
  } = req.body;
  
  console.log('[API] cloudProvider recebido:', cloudProvider, 'tipo:', typeof cloudProvider);
  
  try {
    if (!sigla || !descricao || !urlDocumentacao || !tipoAplicacao || !faseCicloVida || !criticidadeNegocio) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        code: 'MISSING_FIELDS',
        missing: [
          !sigla && 'sigla',
          !descricao && 'descricao',
          !urlDocumentacao && 'urlDocumentacao',
          !tipoAplicacao && 'tipoAplicacao',
          !faseCicloVida && 'faseCicloVida',
          !criticidadeNegocio && 'criticidadeNegocio'
        ].filter(Boolean)
      });
    }

    if (sigla.length > 20) {
      return res.status(400).json({
        error: 'Sigla deve ter no máximo 20 caracteres',
        code: 'INVALID_SIGLA'
      });
    }

    if (descricao.length > 200) {
      return res.status(400).json({
        error: 'Descrição deve ter no máximo 200 caracteres',
        code: 'INVALID_DESCRIPTION_LENGTH'
      });
    }

    const [existing] = await pool.query('SELECT id FROM aplicacoes WHERE sigla = ?', [sigla]);
    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Aplicação com esta sigla já existe',
        code: 'DUPLICATE_SIGLA'
      });
    }

    const id = uuidv4();
    
    console.log('[API INSERT] Valores a serem inseridos:');
    console.log('cloudProvider:', cloudProvider, 'tipo:', typeof cloudProvider);
    console.log('tipoAplicacao:', tipoAplicacao);
    
    await pool.query(
      `INSERT INTO aplicacoes (
        id, sigla, descricao, url_documentacao, tipo_aplicacao, opt_in_out, fase_ciclo_vida, criticidade_negocio,
        categoria_sistema, fornecedor, tipo_hospedagem, cloud_provider, custo_mensal, numero_usuarios,
        data_implantacao, versao_atual, responsavel_tecnico, responsavel_negocio,
        status_operacional, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sigla, descricao, urlDocumentacao, tipoAplicacao, optInOut || false, faseCicloVida, criticidadeNegocio,
        categoriaSistema || null,
        fornecedor || null,
        tipoHospedagem || null,
        cloudProvider || null,
        custoMensal || null,
        numeroUsuarios || null,
        dataImplantacao || null,
        versaoAtual || null,
        responsavelTecnico || null,
        responsavelNegocio || null,
        statusOperacional || null,
        observacoes || null
      ]
    );

    // Salvar tecnologias
    if (tecnologias && Array.isArray(tecnologias)) {
      console.log('[API POST /aplicacoes] Salvando tecnologias:', tecnologias.length);
      for (const tec of tecnologias) {
        if (!tec.tecnologiaId) {
          console.log('[API POST /aplicacoes] Tecnologia sem tecnologiaId, pulando:', tec);
          continue;
        }
        
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = tec.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        let dataTermino = tec.dataTermino;
        if (dataTermino) {
          if (typeof dataTermino === 'string') {
            dataTermino = dataTermino.split('T')[0];
          } else if (dataTermino instanceof Date) {
            dataTermino = dataTermino.toISOString().split('T')[0];
          }
        } else {
          dataTermino = null;
        }
        
        await pool.query(
          'INSERT INTO aplicacao_tecnologias (id, aplicacao_id, tecnologia_id, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, tec.tecnologiaId, dataInicio, dataTermino, tec.status || 'Ativo']
        );
        console.log('[API POST /aplicacoes] Tecnologia salva:', tec.tecnologiaId);
      }
    }

    // Salvar ambientes
    if (ambientes && Array.isArray(ambientes)) {
      for (const amb of ambientes) {
        // Normalizar TipoAmbiente - converter valores antigos para novos
        const normalizarTipoAmbiente = (tipo) => {
          const mapeamento = {
            'Dev': 'DEV',
            'Prod': 'PROD',
            'Cloud': 'DEV',
            'On-Premise': 'PROD'
          };
          return mapeamento[tipo] || tipo;
        };

        const tipoAmbienteNormalizado = normalizarTipoAmbiente(amb.tipoAmbiente);

        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataCriacao = amb.dataCriacao;
        if (dataCriacao) {
          if (typeof dataCriacao === 'string') {
            dataCriacao = dataCriacao.split('T')[0];
          } else if (dataCriacao instanceof Date) {
            dataCriacao = dataCriacao.toISOString().split('T')[0];
          }
        } else {
          dataCriacao = new Date().toISOString().split('T')[0];
        }
        
        await pool.query(
          'INSERT INTO aplicacao_ambientes (id, aplicacao_id, identificador_aplicacao, tipo_ambiente, localizacao_regiao, url_ambiente, data_criacao, tempo_liberacao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, amb.identificadorAplicacao || 'api', tipoAmbienteNormalizado, amb.localizacaoRegiao || 'not-specified', amb.urlAmbiente, dataCriacao, amb.tempoLiberacao || 0, amb.status || 'Ativo']
        );
      }
    }

    // Salvar capacidades
    if (capacidades && Array.isArray(capacidades)) {
      for (const cap of capacidades) {
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = cap.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        await pool.query(
          'INSERT INTO aplicacao_capacidades (id, aplicacao_id, capacidade_id, grau_cobertura, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, cap.capacidadeId, cap.grauCobertura || 0, dataInicio, cap.status || 'Ativo']
        );
      }
    }

    // Salvar processos
    if (processos && Array.isArray(processos)) {
      for (const proc of processos) {
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = proc.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        await pool.query(
          'INSERT INTO aplicacao_processos (id, aplicacao_id, processo_id, tipo_suporte, criticidade, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, proc.processoId, proc.tipoSuporte || 'Operacional', proc.criticidade || 'Média', dataInicio, proc.status || 'Ativo']
        );
      }
    }

    // Salvar integrações
    if (integracoes && Array.isArray(integracoes)) {
      for (const integ of integracoes) {
        // Validar campos obrigatórios mínimos
        if (!integ.aplicacaoDestinoId) {
          console.log('[API POST /aplicacoes] Integracao sem aplicacaoDestinoId, pulando:', integ);
          continue;
        }
        
        // Usar valores padrão para campos não fornecidos
        const tipoIntegracao = integ.tipoIntegracao || 'API';
        const protocolo = integ.protocolo || 'REST';
        const frequencia = integ.frequencia || 'On-demand';
        
        await pool.query(
          'INSERT INTO aplicacao_integracoes (id, aplicacao_id, aplicacao_destino_id, tipo_integracao, protocolo, frequencia, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, integ.aplicacaoDestinoId, tipoIntegracao, protocolo, frequencia, integ.descricao || '', integ.status || 'Ativo']
        );
      }
    }

    // Salvar SLAs
    if (slas && Array.isArray(slas)) {
      for (const sla of slas) {
        // Validar campos obrigatórios
        if (!sla.slaId || !sla.descricao) {
          console.log('[API POST /aplicacoes] SLA com dados incompletos, pulando:', sla);
          continue; // Pular SLAs com dados incompletos
        }
        
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = sla.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        await pool.query(
          'INSERT INTO aplicacao_slas (id, aplicacao_id, sla_id, descricao, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, sla.slaId, sla.descricao, dataInicio, sla.status || 'Ativo']
        );
      }
    }

    // Salvar Runbooks
    if (runbooks && Array.isArray(runbooks)) {
      for (const runbook of runbooks) {
        // Validar campos obrigatórios
        if (!runbook.runbookId) {
          console.log('[API POST /aplicacoes] Runbook com dados incompletos, pulando:', runbook);
          continue;
        }
        
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataAssociacao = runbook.dataAssociacao;
        if (dataAssociacao) {
          if (typeof dataAssociacao === 'string') {
            dataAssociacao = dataAssociacao.split('T')[0];
          } else if (dataAssociacao instanceof Date) {
            dataAssociacao = dataAssociacao.toISOString().split('T')[0];
          }
        } else {
          dataAssociacao = new Date().toISOString().split('T')[0];
        }
        
        await pool.query(
          'INSERT INTO aplicacao_runbooks (id, aplicacao_id, runbook_id, descricao, data_associacao, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, runbook.runbookId, runbook.descricao || '', dataAssociacao, runbook.status || 'Ativo']
        );
      }
    }

    // Salvar Squads
    if (req.body.squads && Array.isArray(req.body.squads)) {
      console.log('[API POST /aplicacoes] Salvando Squads:', req.body.squads.length);
      for (const squad of req.body.squads) {
        if (!squad.colaboradorId || !squad.perfil || !squad.squad) {
          console.log('[API POST /aplicacoes] Squad com dados incompletos, pulando:', squad);
          continue;
        }
        
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = squad.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        let dataTermino = squad.dataTermino;
        if (dataTermino) {
          if (typeof dataTermino === 'string') {
            dataTermino = dataTermino.split('T')[0];
          } else if (dataTermino instanceof Date) {
            dataTermino = dataTermino.toISOString().split('T')[0];
          }
        } else {
          dataTermino = null;
        }
        
        await pool.query(
          'INSERT INTO aplicacao_squads (id, aplicacao_id, colaborador_id, perfil, squad, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, squad.colaboradorId, squad.perfil, squad.squad, dataInicio, dataTermino, squad.status || 'Ativo']
        );
        console.log('[API POST /aplicacoes] Squad salvo:', squad.colaboradorId, squad.perfil, squad.squad);
      }
    }

    // Salvar ADRs associadas
    if (req.body.adrs && Array.isArray(req.body.adrs)) {
      console.log('[API POST /aplicacoes] Salvando ADRs:', req.body.adrs.length);
      for (const adr of req.body.adrs) {
        if (!adr.adrId) {
          console.log('[API POST /aplicacoes] ADR sem adrId, pulando:', adr);
          continue;
        }
        
        // Converter data para formato MySQL (YYYY-MM-DD)
        let dataInicio = adr.dataInicio;
        if (dataInicio) {
          if (typeof dataInicio === 'string') {
            dataInicio = dataInicio.split('T')[0];
          } else if (dataInicio instanceof Date) {
            dataInicio = dataInicio.toISOString().split('T')[0];
          }
        } else {
          dataInicio = new Date().toISOString().split('T')[0];
        }
        
        let dataTermino = adr.dataTermino;
        if (dataTermino) {
          if (typeof dataTermino === 'string') {
            dataTermino = dataTermino.split('T')[0];
          } else if (dataTermino instanceof Date) {
            dataTermino = dataTermino.toISOString().split('T')[0];
          }
        } else {
          dataTermino = null;
        }
        
        await pool.query(
          'INSERT INTO adr_aplicacoes (id, adr_id, aplicacao_id, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), adr.adrId, id, dataInicio, dataTermino, adr.status || 'Ativo']
        );
        console.log('[API POST /aplicacoes] ADR salva:', adr.adrId);
      }
    }

    const [created] = await pool.query('SELECT * FROM aplicacoes WHERE id = ?', [id]);
    res.status(201).json(mapAplicacao(created[0]));
  } catch (error) {
    console.error('Erro ao criar aplicação:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/aplicacoes/:id', async (req, res) => {
  console.log('[API PUT /aplicacoes/:id] ========== ATUALIZAÇÃO ==========');
  console.log('[API PUT /aplicacoes/:id] ID:', req.params.id);
  console.log('[API PUT /aplicacoes/:id] Body recebido:', JSON.stringify(req.body, null, 2));
  console.log('[API PUT /aplicacoes/:id] Tecnologias recebidas:', req.body.tecnologias);
  console.log('[API PUT /aplicacoes/:id] Contadores:', {
    tecnologias: req.body.tecnologias?.length || 0,
    ambientes: req.body.ambientes?.length || 0,
    capacidades: req.body.capacidades?.length || 0,
    processos: req.body.processos?.length || 0,
    integracoes: req.body.integracoes?.length || 0,
    slas: req.body.slas?.length || 0,
    runbooks: req.body.runbooks?.length || 0
  });

  const { 
    sigla, 
    descricao, 
    urlDocumentacao,
    tipoAplicacao,
    cloudProvider,
    faseCicloVida, 
    criticidadeNegocio,
    optInOut,
    categoriaSistema,
    fornecedor,
    tipoHospedagem,
    custoMensal,
    numeroUsuarios,
    dataImplantacao,
    versaoAtual,
    responsavelTecnico,
    responsavelNegocio,
    statusOperacional,
    observacoes,
    tecnologias,
    ambientes,
    capacidades,
    processos,
    integracoes,
    slas,
    runbooks
  } = req.body;

  try {
    const [existing] = await pool.query('SELECT * FROM aplicacoes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
    }

    if (sigla && sigla !== existing[0].sigla) {
      const [duplicate] = await pool.query('SELECT id FROM aplicacoes WHERE sigla = ? AND id != ?', [sigla, req.params.id]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          error: 'Aplicação com esta sigla já existe',
          code: 'DUPLICATE_SIGLA'
        });
      }
    }

    await pool.query(
      `UPDATE aplicacoes SET 
        sigla = ?,
        descricao = ?,
        url_documentacao = ?,
        tipo_aplicacao = ?,
        opt_in_out = ?,
        cloud_provider = ?,
        fase_ciclo_vida = ?,
        criticidade_negocio = ?,
        categoria_sistema = ?,
        fornecedor = ?,
        tipo_hospedagem = ?,
        custo_mensal = ?,
        numero_usuarios = ?,
        data_implantacao = ?,
        versao_atual = ?,
        responsavel_tecnico = ?,
        responsavel_negocio = ?,
        status_operacional = ?,
        observacoes = ?
      WHERE id = ?`,
      [
        sigla !== undefined ? sigla : existing[0].sigla,
        descricao !== undefined ? descricao : existing[0].descricao,
        urlDocumentacao !== undefined ? urlDocumentacao : existing[0].url_documentacao,
        tipoAplicacao !== undefined ? tipoAplicacao : existing[0].tipo_aplicacao,
        optInOut !== undefined ? optInOut : existing[0].opt_in_out,
        cloudProvider !== undefined ? cloudProvider : existing[0].cloud_provider,
        faseCicloVida !== undefined ? faseCicloVida : existing[0].fase_ciclo_vida,
        criticidadeNegocio !== undefined ? criticidadeNegocio : existing[0].criticidade_negocio,
        categoriaSistema !== undefined ? categoriaSistema : existing[0].categoria_sistema,
        fornecedor !== undefined ? fornecedor : existing[0].fornecedor,
        tipoHospedagem !== undefined ? tipoHospedagem : existing[0].tipo_hospedagem,
        custoMensal !== undefined ? custoMensal : existing[0].custo_mensal,
        numeroUsuarios !== undefined ? numeroUsuarios : existing[0].numero_usuarios,
        dataImplantacao !== undefined ? dataImplantacao : existing[0].data_implantacao,
        versaoAtual !== undefined ? versaoAtual : existing[0].versao_atual,
        responsavelTecnico !== undefined ? responsavelTecnico : existing[0].responsavel_tecnico,
        responsavelNegocio !== undefined ? responsavelNegocio : existing[0].responsavel_negocio,
        statusOperacional !== undefined ? statusOperacional : existing[0].status_operacional,
        observacoes !== undefined ? observacoes : existing[0].observacoes,
        req.params.id
      ]
    );

    // Atualizar tecnologias
    if (tecnologias !== undefined) {
      console.log('[API PUT /aplicacoes] Atualizando tecnologias:', tecnologias.length);
      await pool.query('DELETE FROM aplicacao_tecnologias WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(tecnologias)) {
        for (const tec of tecnologias) {
          if (!tec.tecnologiaId) {
            console.log('[API PUT /aplicacoes] Tecnologia sem tecnologiaId, pulando:', tec);
            continue;
          }
          
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = tec.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          let dataTermino = tec.dataTermino;
          if (dataTermino) {
            if (typeof dataTermino === 'string') {
              dataTermino = dataTermino.split('T')[0];
            } else if (dataTermino instanceof Date) {
              dataTermino = dataTermino.toISOString().split('T')[0];
            }
          } else {
            dataTermino = null;
          }
          
          await pool.query(
            'INSERT INTO aplicacao_tecnologias (id, aplicacao_id, tecnologia_id, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, tec.tecnologiaId, dataInicio, dataTermino, tec.status || 'Ativo']
          );
          console.log('[API PUT /aplicacoes] Tecnologia salva:', tec.tecnologiaId);
        }
      }
    }

    // Atualizar ambientes
    if (ambientes !== undefined) {
      await pool.query('DELETE FROM aplicacao_ambientes WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(ambientes)) {
        for (const amb of ambientes) {
          // Normalizar TipoAmbiente - converter valores antigos para novos
          const normalizarTipoAmbiente = (tipo) => {
            const mapeamento = {
              'Dev': 'DEV',
              'Prod': 'PROD',
              'Cloud': 'DEV',
              'On-Premise': 'PROD'
            };
            return mapeamento[tipo] || tipo;
          };

          const tipoAmbienteNormalizado = normalizarTipoAmbiente(amb.tipoAmbiente);

          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataCriacao = amb.dataCriacao;
          if (dataCriacao) {
            if (typeof dataCriacao === 'string') {
              dataCriacao = dataCriacao.split('T')[0];
            } else if (dataCriacao instanceof Date) {
              dataCriacao = dataCriacao.toISOString().split('T')[0];
            }
          } else {
            dataCriacao = new Date().toISOString().split('T')[0];
          }
          
          await pool.query(
            'INSERT INTO aplicacao_ambientes (id, aplicacao_id, identificador_aplicacao, tipo_ambiente, localizacao_regiao, url_ambiente, data_criacao, tempo_liberacao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, amb.identificadorAplicacao || 'api', tipoAmbienteNormalizado, amb.localizacaoRegiao || 'not-specified', amb.urlAmbiente, dataCriacao, amb.tempoLiberacao || 0, amb.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar capacidades
    if (capacidades !== undefined) {
      await pool.query('DELETE FROM aplicacao_capacidades WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(capacidades)) {
        for (const cap of capacidades) {
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = cap.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          await pool.query(
            'INSERT INTO aplicacao_capacidades (id, aplicacao_id, capacidade_id, grau_cobertura, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, cap.capacidadeId, cap.grauCobertura || 0, dataInicio, cap.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar processos
    if (processos !== undefined) {
      await pool.query('DELETE FROM aplicacao_processos WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(processos)) {
        for (const proc of processos) {
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = proc.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          await pool.query(
            'INSERT INTO aplicacao_processos (id, aplicacao_id, processo_id, tipo_suporte, criticidade, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, proc.processoId, proc.tipoSuporte || 'Operacional', proc.criticidade || 'Média', dataInicio, proc.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar integrações
    if (integracoes !== undefined) {
      await pool.query('DELETE FROM aplicacao_integracoes WHERE aplicacao_id = ? OR aplicacao_destino_id = ?', [req.params.id, req.params.id]);
      if (Array.isArray(integracoes)) {
        for (const integ of integracoes) {
          // Validar campos obrigatórios mínimos
          if (!integ.aplicacaoDestinoId) {
            console.log('[API PUT /aplicacoes/:id] Integracao sem aplicacaoDestinoId, pulando:', integ);
            continue;
          }
          
          // Usar valores padrão para campos não fornecidos
          const tipoIntegracao = integ.tipoIntegracao || 'API';
          const protocolo = integ.protocolo || 'REST';
          const frequencia = integ.frequencia || 'On-demand';
          
          await pool.query(
            'INSERT INTO aplicacao_integracoes (id, aplicacao_id, aplicacao_destino_id, tipo_integracao, protocolo, frequencia, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, integ.aplicacaoDestinoId, tipoIntegracao, protocolo, frequencia, integ.descricao || '', integ.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar SLAs
    if (slas !== undefined) {
      await pool.query('DELETE FROM aplicacao_slas WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(slas)) {
        for (const sla of slas) {
          // Validar campos obrigatórios
          if (!sla.slaId || !sla.descricao) {
            console.log('[API PUT /aplicacoes/:id] SLA com dados incompletos, pulando:', sla);
            continue; // Pular SLAs com dados incompletos
          }
          
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = sla.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          await pool.query(
            'INSERT INTO aplicacao_slas (id, aplicacao_id, sla_id, descricao, data_inicio, status) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, sla.slaId, sla.descricao, dataInicio, sla.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar Runbooks
    if (runbooks !== undefined) {
      await pool.query('DELETE FROM aplicacao_runbooks WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(runbooks)) {
        for (const runbook of runbooks) {
          // Validar campos obrigatórios
          if (!runbook.runbookId) {
            console.log('[API PUT /aplicacoes/:id] Runbook com dados incompletos, pulando:', runbook);
            continue;
          }
          
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataAssociacao = runbook.dataAssociacao;
          if (dataAssociacao) {
            if (typeof dataAssociacao === 'string') {
              dataAssociacao = dataAssociacao.split('T')[0];
            } else if (dataAssociacao instanceof Date) {
              dataAssociacao = dataAssociacao.toISOString().split('T')[0];
            }
          } else {
            dataAssociacao = new Date().toISOString().split('T')[0];
          }
          
          await pool.query(
            'INSERT INTO aplicacao_runbooks (id, aplicacao_id, runbook_id, descricao, data_associacao, status) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, runbook.runbookId, runbook.descricao || '', dataAssociacao, runbook.status || 'Ativo']
          );
        }
      }
    }

    // Atualizar Squads
    if (req.body.squads !== undefined) {
      console.log('[API PUT /aplicacoes/:id] Atualizando Squads:', req.body.squads?.length || 0);
      await pool.query('DELETE FROM aplicacao_squads WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(req.body.squads)) {
        for (const squad of req.body.squads) {
          if (!squad.colaboradorId || !squad.perfil || !squad.squad) {
            console.log('[API PUT /aplicacoes/:id] Squad com dados incompletos, pulando:', squad);
            continue;
          }
          
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = squad.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          let dataTermino = squad.dataTermino;
          if (dataTermino) {
            if (typeof dataTermino === 'string') {
              dataTermino = dataTermino.split('T')[0];
            } else if (dataTermino instanceof Date) {
              dataTermino = dataTermino.toISOString().split('T')[0];
            }
          } else {
            dataTermino = null;
          }
          
          await pool.query(
            'INSERT INTO aplicacao_squads (id, aplicacao_id, colaborador_id, perfil, squad, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, squad.colaboradorId, squad.perfil, squad.squad, dataInicio, dataTermino, squad.status || 'Ativo']
          );
          console.log('[API PUT /aplicacoes/:id] Squad salvo:', squad.colaboradorId, squad.perfil, squad.squad);
        }
      }
    }

    // Atualizar ADRs associadas
    if (req.body.adrs !== undefined) {
      console.log('[API PUT /aplicacoes/:id] Atualizando ADRs:', req.body.adrs?.length || 0);
      await pool.query('DELETE FROM adr_aplicacoes WHERE aplicacao_id = ?', [req.params.id]);
      if (Array.isArray(req.body.adrs)) {
        for (const adr of req.body.adrs) {
          if (!adr.adrId) {
            console.log('[API PUT /aplicacoes/:id] ADR sem adrId, pulando:', adr);
            continue;
          }
          
          // Converter data para formato MySQL (YYYY-MM-DD)
          let dataInicio = adr.dataInicio;
          if (dataInicio) {
            if (typeof dataInicio === 'string') {
              dataInicio = dataInicio.split('T')[0];
            } else if (dataInicio instanceof Date) {
              dataInicio = dataInicio.toISOString().split('T')[0];
            }
          } else {
            dataInicio = new Date().toISOString().split('T')[0];
          }
          
          let dataTermino = adr.dataTermino;
          if (dataTermino) {
            if (typeof dataTermino === 'string') {
              dataTermino = dataTermino.split('T')[0];
            } else if (dataTermino instanceof Date) {
              dataTermino = dataTermino.toISOString().split('T')[0];
            }
          } else {
            dataTermino = null;
          }
          
          await pool.query(
            'INSERT INTO adr_aplicacoes (id, adr_id, aplicacao_id, data_inicio, data_termino, status) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), adr.adrId, req.params.id, dataInicio, dataTermino, adr.status || 'Ativo']
          );
          console.log('[API PUT /aplicacoes/:id] ADR salva:', adr.adrId);
        }
      }
    }

    const [updated] = await pool.query('SELECT * FROM aplicacoes WHERE id = ?', [req.params.id]);
    console.log('[API PUT /aplicacoes/:id] ✓ Aplicação atualizada com sucesso');
    res.json(mapAplicacao(updated[0]));
  } catch (error) {
    console.error('[API PUT /aplicacoes/:id] ❌ ERRO ao atualizar aplicação:', error);
    console.error('[API PUT /aplicacoes/:id] Stack:', error.stack);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR', details: error.message });
  }
});

app.delete('/api/aplicacoes/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Delete all related records first
    await connection.query('DELETE FROM aplicacao_tecnologias WHERE aplicacao_id = ?', [req.params.id]);
    await connection.query('DELETE FROM aplicacao_capacidades WHERE aplicacao_id = ?', [req.params.id]);
    await connection.query('DELETE FROM aplicacao_processos WHERE aplicacao_id = ?', [req.params.id]);
    await connection.query('DELETE FROM aplicacao_ambientes WHERE aplicacao_id = ?', [req.params.id]);
    await connection.query('DELETE FROM aplicacao_integracoes WHERE aplicacao_id = ? OR aplicacao_destino_id = ?', [req.params.id, req.params.id]);
    await connection.query('DELETE FROM aplicacao_slas WHERE aplicacao_id = ?', [req.params.id]);
    await connection.query('DELETE FROM aplicacao_runbooks WHERE aplicacao_id = ?', [req.params.id]);
    
    // Delete the main record
    const [result] = await connection.query('DELETE FROM aplicacoes WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
    }
    
    await connection.commit();
    res.status(204).send();
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir aplicação:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR', details: error.message });
  } finally {
    connection.release();
  }
});

// ==================== APLICAÇÃO x TECNOLOGIAS ====================

// Associar tecnologia a uma aplicação
app.post('/api/aplicacoes/:id/tecnologias', async (req, res) => {
  const { idTecnologia } = req.body;
  
  if (!idTecnologia) {
    return res.status(400).json({
      error: 'Campo idTecnologia é obrigatório',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    // Verificar se a aplicação existe
    const [aplicacao] = await pool.query('SELECT id FROM aplicacoes WHERE id = ?', [req.params.id]);
    if (aplicacao.length === 0) {
      return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
    }
    
    // Verificar se a tecnologia existe
    const [tecnologia] = await pool.query('SELECT id FROM tecnologias WHERE id = ?', [idTecnologia]);
    if (tecnologia.length === 0) {
      return res.status(404).json({ error: 'Tecnologia não encontrada', code: 'NOT_FOUND' });
    }
    
    // Verificar se a associação já existe
    const [existing] = await pool.query(
      'SELECT id FROM aplicacao_tecnologias WHERE aplicacao_id = ? AND tecnologia_id = ?',
      [req.params.id, idTecnologia]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Associação já existe', 
        code: 'DUPLICATE_ENTRY',
        id: existing[0].id
      });
    }
    
    // Criar a associação
    const id = uuidv4();
    await pool.query(
      `INSERT INTO aplicacao_tecnologias 
        (id, aplicacao_id, tecnologia_id, data_inicio, status)
      VALUES (?, ?, ?, CURDATE(), 'Ativo')`,
      [id, req.params.id, idTecnologia]
    );
    
    res.status(201).json({
      id,
      aplicacaoId: req.params.id,
      tecnologiaId: idTecnologia,
      status: 'Ativo'
    });
  } catch (error) {
    console.error('Erro ao associar tecnologia à aplicação:', error);
    res.status(500).json({ error: 'Erro ao associar tecnologia', code: 'DATABASE_ERROR' });
  }
});

// Listar tecnologias de uma aplicação
app.get('/api/aplicacoes/:id/tecnologias', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, at.id as associacao_id, at.data_inicio, at.data_termino, at.status as status_associacao
       FROM aplicacao_tecnologias at
       INNER JOIN tecnologias t ON at.tecnologia_id = t.id
       WHERE at.aplicacao_id = ?
       ORDER BY t.nome`,
      [req.params.id]
    );
    
    res.json(rows.map(row => ({
      ...mapTecnologia(row),
      associacaoId: row.associacao_id,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      statusAssociacao: row.status_associacao
    })));
  } catch (error) {
    console.error('Erro ao listar tecnologias da aplicação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// Remover associação aplicação x tecnologia
app.delete('/api/aplicacoes/:id/tecnologias/:tecnologiaId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM aplicacao_tecnologias WHERE aplicacao_id = ? AND tecnologia_id = ?',
      [req.params.id, req.params.tecnologiaId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Associação não encontrada', code: 'NOT_FOUND' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover associação:', error);
    res.status(500).json({ error: 'Erro ao remover associação', code: 'DATABASE_ERROR' });
  }
});

// ==================== APLICAÇÃO x SQUADS ====================

// Listar squads de uma aplicação
app.get('/api/aplicacoes/:id/squads', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT asq.*, c.nome as colaborador_nome, c.matricula as colaborador_matricula
       FROM aplicacao_squads asq
       INNER JOIN colaboradores c ON asq.colaborador_id = c.id
       WHERE asq.aplicacao_id = ?
       ORDER BY asq.data_inicio DESC`,
      [req.params.id]
    );
    
    res.json(rows.map(row => ({
      id: row.id,
      colaboradorId: row.colaborador_id,
      colaboradorNome: row.colaborador_nome,
      colaboradorMatricula: row.colaborador_matricula,
      perfil: row.perfil,
      squad: row.squad,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      status: row.status
    })));
  } catch (error) {
    console.error('Erro ao listar squads da aplicação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// Adicionar colaborador ao squad da aplicação
app.post('/api/aplicacoes/:id/squads', async (req, res) => {
  const { colaboradorId, perfil, squad, dataInicio, dataTermino } = req.body;
  
  if (!colaboradorId || !perfil || !squad || !dataInicio) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando: colaboradorId, perfil, squad, dataInicio',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    // Verificar se a aplicação existe
    const [aplicacao] = await pool.query('SELECT id FROM aplicacoes WHERE id = ?', [req.params.id]);
    if (aplicacao.length === 0) {
      return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
    }
    
    // Verificar se o colaborador existe
    const [colaborador] = await pool.query('SELECT id, nome, matricula FROM colaboradores WHERE id = ?', [colaboradorId]);
    if (colaborador.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado', code: 'NOT_FOUND' });
    }
    
    // Verificar se já existe associação ativa com mesmo colaborador, perfil e squad
    const [existing] = await pool.query(
      `SELECT id FROM aplicacao_squads 
       WHERE aplicacao_id = ? AND colaborador_id = ? AND perfil = ? AND squad = ? AND status = 'Ativo'`,
      [req.params.id, colaboradorId, perfil, squad]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        error: 'Colaborador já está associado com este perfil e squad nesta aplicação', 
        code: 'DUPLICATE_ENTRY'
      });
    }
    
    // Criar a associação
    const id = uuidv4();
    await pool.query(
      `INSERT INTO aplicacao_squads 
        (id, aplicacao_id, colaborador_id, perfil, squad, data_inicio, data_termino, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [id, req.params.id, colaboradorId, perfil, squad, dataInicio, dataTermino || null]
    );
    
    res.status(201).json({
      id,
      aplicacaoId: req.params.id,
      colaboradorId,
      colaboradorNome: colaborador[0].nome,
      colaboradorMatricula: colaborador[0].matricula,
      perfil,
      squad,
      dataInicio,
      dataTermino: dataTermino || null,
      status: 'Ativo'
    });
  } catch (error) {
    console.error('Erro ao associar colaborador ao squad:', error);
    res.status(500).json({ error: 'Erro ao associar colaborador', code: 'DATABASE_ERROR' });
  }
});

// Atualizar associação de squad
app.put('/api/aplicacoes/:id/squads/:squadId', async (req, res) => {
  const { colaboradorId, perfil, squad, dataInicio, dataTermino, status } = req.body;
  
  if (!colaboradorId || !perfil || !squad || !dataInicio) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando: colaboradorId, perfil, squad, dataInicio',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    // Verificar se a associação existe
    const [existing] = await pool.query(
      'SELECT * FROM aplicacao_squads WHERE id = ? AND aplicacao_id = ?',
      [req.params.squadId, req.params.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada', code: 'NOT_FOUND' });
    }
    
    // Verificar se o colaborador existe
    const [colaborador] = await pool.query('SELECT id, nome, matricula FROM colaboradores WHERE id = ?', [colaboradorId]);
    if (colaborador.length === 0) {
      return res.status(404).json({ error: 'Colaborador não encontrado', code: 'NOT_FOUND' });
    }
    
    // Verificar duplicatas (exceto o registro atual)
    const [duplicate] = await pool.query(
      `SELECT id FROM aplicacao_squads 
       WHERE aplicacao_id = ? AND colaborador_id = ? AND perfil = ? AND squad = ? 
       AND id != ? AND status = 'Ativo'`,
      [req.params.id, colaboradorId, perfil, squad, req.params.squadId]
    );
    
    if (duplicate.length > 0) {
      return res.status(409).json({ 
        error: 'Colaborador já está associado com este perfil e squad nesta aplicação', 
        code: 'DUPLICATE_ENTRY'
      });
    }
    
    // Atualizar a associação
    await pool.query(
      `UPDATE aplicacao_squads 
       SET colaborador_id = ?, perfil = ?, squad = ?, data_inicio = ?, data_termino = ?, status = ?
       WHERE id = ? AND aplicacao_id = ?`,
      [colaboradorId, perfil, squad, dataInicio, dataTermino || null, status || 'Ativo', req.params.squadId, req.params.id]
    );
    
    res.json({
      id: req.params.squadId,
      aplicacaoId: req.params.id,
      colaboradorId,
      colaboradorNome: colaborador[0].nome,
      colaboradorMatricula: colaborador[0].matricula,
      perfil,
      squad,
      dataInicio,
      dataTermino: dataTermino || null,
      status: status || 'Ativo'
    });
  } catch (error) {
    console.error('Erro ao atualizar associação de squad:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

// Remover associação aplicação x squad
app.delete('/api/aplicacoes/:id/squads/:squadId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM aplicacao_squads WHERE id = ? AND aplicacao_id = ?',
      [req.params.squadId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Associação não encontrada', code: 'NOT_FOUND' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover associação de squad:', error);
    res.status(500).json({ error: 'Erro ao remover associação', code: 'DATABASE_ERROR' });
  }
});

// ==================== PROCESSOS DE NEGÓCIO ====================

function mapProcessoNegocio(row) {
  return {
    id: row.id,
    identificacao: row.identificacao,
    nome: row.nome || row.identificacao,
    descricao: row.descricao,
    nivelMaturidade: row.nivel_maturidade || 'Inicial',
    areaResponsavel: row.area_responsavel || '',
    frequencia: row.frequencia || 'Mensal',
    duracaoMedia: row.duracao_media ? parseFloat(row.duracao_media) : 0,
    complexidade: row.complexidade || 'Média',
    normas: row.normas ? (typeof row.normas === 'string' ? JSON.parse(row.normas) : row.normas) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/processos-negocio', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM processos_negocio ORDER BY nome');
    res.json(rows.map(mapProcessoNegocio));
  } catch (error) {
    console.error('Erro ao listar processos de negócio:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/processos-negocio/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM processos_negocio WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado', code: 'NOT_FOUND' });
    }
    res.json(mapProcessoNegocio(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar processo de negócio:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/processos-negocio', async (req, res) => {
  const { identificacao, nome, descricao, nivelMaturidade, areaResponsavel, frequencia, duracaoMedia, complexidade, normas } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO processos_negocio (
        id, identificacao, nome, descricao, nivel_maturidade, area_responsavel, 
        frequencia, duracao_media, complexidade, normas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        identificacao,
        nome || '',
        descricao,
        nivelMaturidade || 'Inicial',
        areaResponsavel || '',
        frequencia || 'Mensal',
        duracaoMedia || 0,
        complexidade || 'Média',
        normas ? JSON.stringify(normas) : '[]'
      ]
    );
    
    const [created] = await pool.query('SELECT * FROM processos_negocio WHERE id = ?', [id]);
    res.status(201).json(mapProcessoNegocio(created[0]));
  } catch (error) {
    console.error('Erro ao criar processo de negócio:', error);
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/processos-negocio/:id', async (req, res) => {
  const { identificacao, nome, descricao, nivelMaturidade, areaResponsavel, frequencia, duracaoMedia, complexidade, normas } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM processos_negocio WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE processos_negocio SET 
        identificacao = ?, 
        nome = ?,
        descricao = ?,
        nivel_maturidade = ?,
        area_responsavel = ?,
        frequencia = ?,
        duracao_media = ?,
        complexidade = ?,
        normas = ?
      WHERE id = ?`,
      [
        identificacao !== undefined ? identificacao : existing[0].identificacao,
        nome !== undefined ? nome : existing[0].nome,
        descricao !== undefined ? descricao : existing[0].descricao,
        nivelMaturidade !== undefined ? nivelMaturidade : existing[0].nivel_maturidade,
        areaResponsavel !== undefined ? areaResponsavel : existing[0].area_responsavel,
        frequencia !== undefined ? frequencia : existing[0].frequencia,
        duracaoMedia !== undefined ? duracaoMedia : existing[0].duracao_media,
        complexidade !== undefined ? complexidade : existing[0].complexidade,
        normas !== undefined ? JSON.stringify(normas) : existing[0].normas,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM processos_negocio WHERE id = ?', [req.params.id]);
    res.json(mapProcessoNegocio(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar processo de negócio:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/processos-negocio/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM processos_negocio WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Processo não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir processo de negócio:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== COMUNICAÇÕES ====================

function mapComunicacao(row) {
  if (!row) return null;
  
  // Parse tecnologias - pode vir como string ou já como array
  let tecnologias = [];
  if (row.tecnologias) {
    if (typeof row.tecnologias === 'string') {
      try {
        tecnologias = JSON.parse(row.tecnologias);
      } catch (e) {
        console.error('Erro ao fazer parse de tecnologias:', e.message, 'Valor:', row.tecnologias);
        tecnologias = [];
      }
    } else if (Array.isArray(row.tecnologias)) {
      tecnologias = row.tecnologias;
    }
  }
  
  return {
    id: row.id,
    sigla: row.sigla,
    tecnologias: tecnologias,
    tipo: row.tipo,
    usoTipico: row.uso_tipico,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

app.get('/api/comunicacoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comunicacoes ORDER BY sigla');
    res.json(rows.map(mapComunicacao));
  } catch (error) {
    console.error('Erro ao listar comunicações:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/comunicacoes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comunicacoes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Comunicação não encontrada', code: 'NOT_FOUND' });
    }
    res.json(mapComunicacao(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar comunicação:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/comunicacoes', async (req, res) => {
  const { sigla, tecnologias, tipo, usoTipico } = req.body;
  
  if (!sigla || !tecnologias || tecnologias.length === 0 || !tipo || !usoTipico) {
    return res.status(400).json({
      error: 'Campos sigla, tecnologias, tipo e usoTipico são obrigatórios',
      code: 'MISSING_FIELDS'
    });
  }

  if (usoTipico.length > 120) {
    return res.status(400).json({
      error: 'Campo usoTipico não pode ter mais de 120 caracteres',
      code: 'INVALID_LENGTH'
    });
  }
  
  try {
    const id = uuidv4();
    
    await pool.query(
      `INSERT INTO comunicacoes (id, sigla, tecnologias, tipo, uso_tipico) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, sigla, JSON.stringify(tecnologias), tipo, usoTipico]
    );
    
    const [created] = await pool.query('SELECT * FROM comunicacoes WHERE id = ?', [id]);
    res.status(201).json(mapComunicacao(created[0]));
  } catch (error) {
    console.error('Erro ao criar comunicação:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Comunicação já existe', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/comunicacoes/:id', async (req, res) => {
  const { sigla, tecnologias, tipo, usoTipico } = req.body;
  
  if (usoTipico && usoTipico.length > 120) {
    return res.status(400).json({
      error: 'Campo usoTipico não pode ter mais de 120 caracteres',
      code: 'INVALID_LENGTH'
    });
  }
  
  try {
    const [existing] = await pool.query('SELECT * FROM comunicacoes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Comunicação não encontrada', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE comunicacoes SET 
       sigla = ?, tecnologias = ?, tipo = ?, uso_tipico = ?
       WHERE id = ?`,
      [
        sigla !== undefined ? sigla : existing[0].sigla,
        tecnologias !== undefined ? JSON.stringify(tecnologias) : existing[0].tecnologias,
        tipo !== undefined ? tipo : existing[0].tipo,
        usoTipico !== undefined ? usoTipico : existing[0].uso_tipico,
        req.params.id
      ]
    );
    
    const [updated] = await pool.query('SELECT * FROM comunicacoes WHERE id = ?', [req.params.id]);
    res.json(mapComunicacao(updated[0]));
  } catch (error) {
    console.error('Erro ao atualizar comunicação:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/comunicacoes/:id', async (req, res) => {
  try {
    // Verificar se há registros dependentes (apenas nas tabelas que têm comunicacao_id)
    // COMENTADO - tabelas antigas removidas
    /*const [dependencies] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_to_cloud WHERE comunicacao_id = ?) +
        (SELECT COUNT(*) FROM user_to_onpremise WHERE comunicacao_id = ?) as total
    `, [req.params.id, req.params.id]);*/
    // Nova query:
    const [dependencies] = await pool.query(`
      SELECT COUNT(*) as total FROM integracoes WHERE comunicacao_id = ?
    `, [req.params.id]);
    
    if (dependencies[0].total > 0) {
      return res.status(400).json({ 
        error: `Não é possível excluir esta comunicação pois ela está sendo utilizada em ${dependencies[0].total} integração(ões)`, 
        code: 'HAS_DEPENDENCIES' 
      });
    }
    
    const [result] = await pool.query('DELETE FROM comunicacoes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comunicação não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir comunicação:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// ==================== INTEGRAÇÕES ====================

// CRUD Integração Principal
app.get('/api/integracoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso, especificacao_filename, especificacao_mimetype, created_at, updated_at FROM integracoes ORDER BY sigla');
    res.json(rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      nome: row.nome,
      estiloIntegracao: row.estilo_integracao,
      padraoCasoUso: row.padrao_caso_uso,
      integracaoTecnologica: row.integracao_tecnologica,
      tipoIntegracao: row.tipo_integracao,
      tipoDispositivo: row.tipo_dispositivo,
      nomeDispositivo: row.nome_dispositivo,
      aplicacaoOrigemId: row.aplicacao_origem_id,
      aplicacaoDestinoId: row.aplicacao_destino_id,
      comunicacaoId: row.comunicacao_id,
      tipoAutenticacao: row.tipo_autenticacao,
      periodicidade: row.periodicidade,
      frequenciaUso: row.frequencia_uso,
      especificacaoFilename: row.especificacao_filename,
      especificacaoMimetype: row.especificacao_mimetype,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })));
  } catch (error) {
    console.error('Erro ao listar integrações:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/integracoes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso, especificacao_filename, especificacao_mimetype, created_at, updated_at FROM integracoes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Integração não encontrada', code: 'NOT_FOUND' });
    }
    const row = rows[0];
    res.json({
      id: row.id,
      sigla: row.sigla,
      nome: row.nome,
      estiloIntegracao: row.estilo_integracao,
      padraoCasoUso: row.padrao_caso_uso,
      integracaoTecnologica: row.integracao_tecnologica,
      tipoIntegracao: row.tipo_integracao,
      tipoDispositivo: row.tipo_dispositivo,
      nomeDispositivo: row.nome_dispositivo,
      aplicacaoOrigemId: row.aplicacao_origem_id,
      aplicacaoDestinoId: row.aplicacao_destino_id,
      comunicacaoId: row.comunicacao_id,
      tipoAutenticacao: row.tipo_autenticacao,
      periodicidade: row.periodicidade,
      frequenciaUso: row.frequencia_uso,
      especificacaoFilename: row.especificacao_filename,
      especificacaoMimetype: row.especificacao_mimetype,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Erro ao buscar integração:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/integracoes/:id/especificacao', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT especificacao_data, especificacao_filename, especificacao_mimetype FROM integracoes WHERE id = ?', [req.params.id]);
    if (rows.length === 0 || !rows[0].especificacao_data) {
      return res.status(404).json({ error: 'Especificação não encontrada', code: 'NOT_FOUND' });
    }
    const row = rows[0];
    res.setHeader('Content-Type', row.especificacao_mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${row.especificacao_filename}"`);
    res.send(row.especificacao_data);
  } catch (error) {
    console.error('Erro ao buscar especificação:', error);
    res.status(500).json({ error: 'Erro ao buscar arquivo', code: 'DATABASE_ERROR' });
  }
});

app.post('/api/integracoes', upload.single('especificacao'), async (req, res) => {
  const { 
    sigla, nome, estiloIntegracao, padraoCasoUso, integracaoTecnologica,
    tipoIntegracao, tipoDispositivo, nomeDispositivo, 
    aplicacaoOrigemId, aplicacaoDestinoId, comunicacaoId,
    tipoAutenticacao, periodicidade, frequenciaUso
  } = req.body;
  
  console.log('[POST /api/integracoes] Dados recebidos:', {
    sigla, nome, comunicacaoId, tipoAutenticacao, periodicidade, frequenciaUso
  });
  console.log('[POST /api/integracoes] TODOS os campos do req.body:', JSON.stringify(req.body, null, 2));
  
  if (!sigla || !nome) {
    return res.status(400).json({ error: 'Campos sigla e nome são obrigatórios', code: 'MISSING_FIELDS' });
  }
  
  if (sigla.length > 30) {
    console.log('[POST /api/integracoes] ERRO: Sigla com', sigla.length, 'caracteres (máximo 30)');
    return res.status(400).json({ error: 'Sigla deve ter no máximo 30 caracteres', code: 'INVALID_LENGTH' });
  }
  
  if (nome.length > 80) {
    return res.status(400).json({ error: 'Nome deve ter no máximo 80 caracteres', code: 'INVALID_LENGTH' });
  }
  
  try {
    const id = uuidv4();
    
    if (req.file) {
      await pool.query(
        'INSERT INTO integracoes (id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso, especificacao_filename, especificacao_mimetype, especificacao_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, sigla, nome, estiloIntegracao || null, padraoCasoUso || null, integracaoTecnologica || null, tipoIntegracao || null, tipoDispositivo || null, nomeDispositivo || null, aplicacaoOrigemId || null, aplicacaoDestinoId || null, comunicacaoId || null, tipoAutenticacao || null, periodicidade || null, frequenciaUso || null, req.file.originalname, req.file.mimetype, req.file.buffer]
      );
    } else {
      await pool.query(
        'INSERT INTO integracoes (id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, sigla, nome, estiloIntegracao || null, padraoCasoUso || null, integracaoTecnologica || null, tipoIntegracao || null, tipoDispositivo || null, nomeDispositivo || null, aplicacaoOrigemId || null, aplicacaoDestinoId || null, comunicacaoId || null, tipoAutenticacao || null, periodicidade || null, frequenciaUso || null]
      );
    }
    
    const [created] = await pool.query('SELECT id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso, especificacao_filename, especificacao_mimetype, created_at, updated_at FROM integracoes WHERE id = ?', [id]);
    res.status(201).json({
      id: created[0].id,
      sigla: created[0].sigla,
      nome: created[0].nome,
      estiloIntegracao: created[0].estilo_integracao,
      padraoCasoUso: created[0].padrao_caso_uso,
      integracaoTecnologica: created[0].integracao_tecnologica,
      tipoIntegracao: created[0].tipo_integracao,
      tipoDispositivo: created[0].tipo_dispositivo,
      nomeDispositivo: created[0].nome_dispositivo,
      aplicacaoOrigemId: created[0].aplicacao_origem_id,
      aplicacaoDestinoId: created[0].aplicacao_destino_id,
      comunicacaoId: created[0].comunicacao_id,
      tipoAutenticacao: created[0].tipo_autenticacao,
      periodicidade: created[0].periodicidade,
      frequenciaUso: created[0].frequencia_uso,
      especificacaoFilename: created[0].especificacao_filename,
      especificacaoMimetype: created[0].especificacao_mimetype,
      createdAt: created[0].created_at,
      updatedAt: created[0].updated_at
    });
  } catch (error) {
    console.error('Erro ao criar integração:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Sigla já existe', code: 'DUPLICATE' });
    }
    res.status(500).json({ error: 'Erro ao salvar dados', code: 'DATABASE_ERROR' });
  }
});

app.put('/api/integracoes/:id', upload.single('especificacao'), async (req, res) => {
  console.log('[PUT /api/integracoes/:id] RAW req.body:', req.body);
  console.log('[PUT /api/integracoes/:id] req.file:', req.file ? 'presente' : 'ausente');
  console.log('[PUT /api/integracoes/:id] Content-Type:', req.get('Content-Type'));
  
  const { 
    sigla, nome, estiloIntegracao, padraoCasoUso, integracaoTecnologica,
    tipoIntegracao, tipoDispositivo, nomeDispositivo,
    aplicacaoOrigemId, aplicacaoDestinoId, comunicacaoId,
    tipoAutenticacao, periodicidade, frequenciaUso
  } = req.body;
  
  console.log('[PUT /api/integracoes/:id] Dados recebidos:', {
    sigla, nome, estiloIntegracao, padraoCasoUso, integracaoTecnologica,
    tipoIntegracao, tipoDispositivo, nomeDispositivo,
    aplicacaoOrigemId, aplicacaoDestinoId, comunicacaoId,
    tipoAutenticacao, periodicidade, frequenciaUso
  });
  
  try {
    const [existing] = await pool.query('SELECT * FROM integracoes WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Integração não encontrada', code: 'NOT_FOUND' });
    }
    
    if (req.file) {
      await pool.query(
        'UPDATE integracoes SET sigla = ?, nome = ?, estilo_integracao = ?, padrao_caso_uso = ?, integracao_tecnologica = ?, tipo_integracao = ?, tipo_dispositivo = ?, nome_dispositivo = ?, aplicacao_origem_id = ?, aplicacao_destino_id = ?, comunicacao_id = ?, tipo_autenticacao = ?, periodicidade = ?, frequencia_uso = ?, especificacao_filename = ?, especificacao_mimetype = ?, especificacao_data = ? WHERE id = ?',
        [
          sigla || existing[0].sigla, 
          nome || existing[0].nome, 
          estiloIntegracao !== undefined ? estiloIntegracao : existing[0].estilo_integracao,
          padraoCasoUso !== undefined ? padraoCasoUso : existing[0].padrao_caso_uso,
          integracaoTecnologica !== undefined ? integracaoTecnologica : existing[0].integracao_tecnologica,
          tipoIntegracao !== undefined ? tipoIntegracao : existing[0].tipo_integracao,
          tipoDispositivo !== undefined ? tipoDispositivo : existing[0].tipo_dispositivo,
          nomeDispositivo !== undefined ? nomeDispositivo : existing[0].nome_dispositivo,
          aplicacaoOrigemId !== undefined ? aplicacaoOrigemId : existing[0].aplicacao_origem_id,
          aplicacaoDestinoId !== undefined ? aplicacaoDestinoId : existing[0].aplicacao_destino_id,
          comunicacaoId !== undefined ? comunicacaoId : existing[0].comunicacao_id,
          tipoAutenticacao !== undefined ? tipoAutenticacao : existing[0].tipo_autenticacao,
          periodicidade !== undefined ? periodicidade : existing[0].periodicidade,
          frequenciaUso !== undefined ? frequenciaUso : existing[0].frequencia_uso,
          req.file.originalname, 
          req.file.mimetype, 
          req.file.buffer, 
          req.params.id
        ]
      );
    } else {
      await pool.query(
        'UPDATE integracoes SET sigla = ?, nome = ?, estilo_integracao = ?, padrao_caso_uso = ?, integracao_tecnologica = ?, tipo_integracao = ?, tipo_dispositivo = ?, nome_dispositivo = ?, aplicacao_origem_id = ?, aplicacao_destino_id = ?, comunicacao_id = ?, tipo_autenticacao = ?, periodicidade = ?, frequencia_uso = ? WHERE id = ?',
        [
          sigla || existing[0].sigla, 
          nome || existing[0].nome, 
          estiloIntegracao !== undefined ? estiloIntegracao : existing[0].estilo_integracao,
          padraoCasoUso !== undefined ? padraoCasoUso : existing[0].padrao_caso_uso,
          integracaoTecnologica !== undefined ? integracaoTecnologica : existing[0].integracao_tecnologica,
          tipoIntegracao !== undefined ? tipoIntegracao : existing[0].tipo_integracao,
          tipoDispositivo !== undefined ? tipoDispositivo : existing[0].tipo_dispositivo,
          nomeDispositivo !== undefined ? nomeDispositivo : existing[0].nome_dispositivo,
          aplicacaoOrigemId !== undefined ? aplicacaoOrigemId : existing[0].aplicacao_origem_id,
          aplicacaoDestinoId !== undefined ? aplicacaoDestinoId : existing[0].aplicacao_destino_id,
          comunicacaoId !== undefined ? comunicacaoId : existing[0].comunicacao_id,
          tipoAutenticacao !== undefined ? tipoAutenticacao : existing[0].tipo_autenticacao,
          periodicidade !== undefined ? periodicidade : existing[0].periodicidade,
          frequenciaUso !== undefined ? frequenciaUso : existing[0].frequencia_uso,
          req.params.id
        ]
      );
    }
    
    const [updated] = await pool.query('SELECT id, sigla, nome, estilo_integracao, padrao_caso_uso, integracao_tecnologica, tipo_integracao, tipo_dispositivo, nome_dispositivo, aplicacao_origem_id, aplicacao_destino_id, comunicacao_id, tipo_autenticacao, periodicidade, frequencia_uso, especificacao_filename, especificacao_mimetype, created_at, updated_at FROM integracoes WHERE id = ?', [req.params.id]);
    res.json({
      id: updated[0].id,
      sigla: updated[0].sigla,
      nome: updated[0].nome,
      estiloIntegracao: updated[0].estilo_integracao,
      padraoCasoUso: updated[0].padrao_caso_uso,
      integracaoTecnologica: updated[0].integracao_tecnologica,
      tipoIntegracao: updated[0].tipo_integracao,
      tipoDispositivo: updated[0].tipo_dispositivo,
      nomeDispositivo: updated[0].nome_dispositivo,
      aplicacaoOrigemId: updated[0].aplicacao_origem_id,
      aplicacaoDestinoId: updated[0].aplicacao_destino_id,
      comunicacaoId: updated[0].comunicacao_id,
      tipoAutenticacao: updated[0].tipo_autenticacao,
      periodicidade: updated[0].periodicidade,
      frequenciaUso: updated[0].frequencia_uso,
      especificacaoFilename: updated[0].especificacao_filename,
      especificacaoMimetype: updated[0].especificacao_mimetype,
      createdAt: updated[0].created_at,
      updatedAt: updated[0].updated_at
    });
  } catch (error) {
    console.error('Erro ao atualizar integração:', error);
    res.status(500).json({ error: 'Erro ao atualizar dados', code: 'DATABASE_ERROR' });
  }
});

app.delete('/api/integracoes/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM integracoes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Integração não encontrada', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir integração:', error);
    res.status(500).json({ error: 'Erro ao excluir dados', code: 'DATABASE_ERROR' });
  }
});

// OnPremise-to-Cloud




// OnPremise-to-OnPremise




// ==================== SLAs ====================

function mapSLA(row) {
  const sla = {
    id: row.id,
    sigla: row.sigla,
    descricao: row.descricao,
    tipoSLA: row.tipo_sla,
    dataInicio: row.data_inicio,
    dataTermino: row.data_termino,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  // Suporte e Atendimento
  if (row.tempo_resposta || row.tempo_solucao || row.hora_inicial_atendimento || row.hora_termino_atendimento) {
    sla.suporteAtendimento = {
      tempoResposta: row.tempo_resposta,
      tempoSolucao: row.tempo_solucao,
      horaInicialAtendimento: row.hora_inicial_atendimento,
      horaTerminoAtendimento: row.hora_termino_atendimento
    };
  }

  // Segurança
  if (row.patching_mensal_obrigatorio !== null || row.mfa_todos_acessos !== null || row.tempo_correcao_vulnerabilidade_critical) {
    sla.seguranca = {
      patchingMensalObrigatorio: Boolean(row.patching_mensal_obrigatorio),
      mfaParaTodosAcessos: Boolean(row.mfa_todos_acessos),
      tempoCorrecaoVulnerabilidadeCritical: row.tempo_correcao_vulnerabilidade_critical
    };
  }

  // Capacidade
  if (row.percentual_cpu_maxima !== null || row.capacidade_storage_livre !== null || row.escalabilidade_automatica !== null) {
    sla.capacidade = {
      percentualCPUMaxima: parseFloat(row.percentual_cpu_maxima) || 0,
      capacidadeStorageLivre: parseFloat(row.capacidade_storage_livre) || 0,
      escalabilidadeAutomatica: Boolean(row.escalabilidade_automatica)
    };
  }

  // Disponibilidade
  if (row.percentual_uptime !== null) {
    sla.disponibilidade = {
      percentualUptime: parseFloat(row.percentual_uptime) || 0
    };
  }

  // Performance
  if (row.latencia_maxima !== null || row.throughput !== null || row.iops_storage !== null || row.erros_por_minuto !== null) {
    sla.performance = {
      latenciaMaxima: parseFloat(row.latencia_maxima) || 0,
      throughput: parseFloat(row.throughput) || 0,
      iopsStorage: parseInt(row.iops_storage) || 0,
      errosPorMinuto: parseInt(row.erros_por_minuto) || 0
    };
  }

  // Prioridade
  if (row.prioridade_p1 || row.prioridade_p2 || row.prioridade_p3) {
    sla.prioridade = {
      p1: row.prioridade_p1,
      p2: row.prioridade_p2,
      p3: row.prioridade_p3
    };
  }

  // Apoio
  if (row.sla_empresa || row.sla_fornecedores) {
    sla.apoio = {
      slaEmpresa: row.sla_empresa,
      slaFornecedores: row.sla_fornecedores
    };
  }

  // Operacional
  if (row.infraestrutura || row.servico || row.rede) {
    sla.operacional = {
      infraestrutura: row.infraestrutura,
      servico: row.servico,
      rede: row.rede
    };
  }

  // Componentes
  if (row.sla_banco_dados || row.sla_rede || row.sla_storage || row.sla_microservico) {
    sla.componentes = {
      slaBancoDados: row.sla_banco_dados,
      slaRede: row.sla_rede,
      slaStorage: row.sla_storage,
      slaMicroservico: row.sla_microservico
    };
  }

  // Usuário
  if (row.suporte_prioritario_area_critica || row.atendimento_especial_usuarios_chave) {
    sla.usuario = {
      suportePrioritarioAreaCritica: row.suporte_prioritario_area_critica,
      atendimentoEspecialUsuariosChave: row.atendimento_especial_usuarios_chave
    };
  }

  // Serviço
  if (row.disponibilidade_sistema || row.backup_diario || row.tempo_resposta_apis || row.rpo_rto_dr || row.clonagem || row.data_alvo_clonagem) {
    sla.servico = {
      disponibilidadeSistema: row.disponibilidade_sistema,
      backupDiario: row.backup_diario,
      tempoRespostaAPIs: row.tempo_resposta_apis,
      rpoRtoDR: row.rpo_rto_dr,
      clonagem: row.clonagem,
      dataAlvoClonagem: row.data_alvo_clonagem
    };
  }

  return sla;
}

// ====================================================================
// ROTAS DE LGPD (Lei Geral de Proteção de Dados)
// ====================================================================

// GET /api/lgpd - Listar todos os registros LGPD
app.get('/api/lgpd', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        hierarquia_sensibilidade as hierarquiaSensibilidade,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar registros LGPD:', error);
    res.status(500).json({ error: 'Erro ao buscar registros LGPD', code: 'DATABASE_ERROR' });
  }
});

// GET /api/lgpd/:id - Buscar registro LGPD específico com campos
app.get('/api/lgpd/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar registro principal
    const [registros] = await pool.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        hierarquia_sensibilidade as hierarquiaSensibilidade,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [id]);

    if (registros.length === 0) {
      return res.status(404).json({ error: 'Registro LGPD não encontrado', code: 'NOT_FOUND' });
    }

    // Buscar campos associados
    const [campos] = await pool.query(`
      SELECT 
        id,
        lgpd_id as lgpdId,
        nome_campo as nomeCampo,
        descricao,
        base_legal as baseLegal,
        matriz_vendas as vendas,
        matriz_marketing as marketing,
        matriz_financeiro as financeiro,
        matriz_rh as rh,
        matriz_logistica as logistica,
        matriz_assistencia_tecnica as assistenciaTecnica,
        matriz_analytics as analytics,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_campos
      WHERE lgpd_id = ?
      ORDER BY id
    `, [id]);

    // Formatar campos com matriz como objeto
    const camposFormatados = campos.map(campo => ({
      id: campo.id,
      lgpdId: campo.lgpdId,
      nomeCampo: campo.nomeCampo,
      descricao: campo.descricao,
      baseLegal: campo.baseLegal,
      matrizAnonimizacao: {
        vendas: campo.vendas,
        marketing: campo.marketing,
        financeiro: campo.financeiro,
        rh: campo.rh,
        logistica: campo.logistica,
        assistenciaTecnica: campo.assistenciaTecnica,
        analytics: campo.analytics
      },
      createdAt: campo.createdAt,
      updatedAt: campo.updatedAt
    }));

    const registro = {
      ...registros[0],
      campos: camposFormatados
    };

    res.json(registro);
  } catch (error) {
    console.error('Erro ao buscar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao buscar registro LGPD', code: 'DATABASE_ERROR' });
  }
});

// POST /api/lgpd - Criar novo registro LGPD
app.post('/api/lgpd', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      identificacaoDados,
      hierarquiaSensibilidade,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino,
      ativo,
      campos = []
    } = req.body;

    // Inserir registro principal
    const [result] = await connection.query(`
      INSERT INTO lgpd_registros (
        identificacao_dados,
        hierarquia_sensibilidade,
        tipo_dados,
        tecnica_anonimizacao,
        data_inicio,
        data_termino,
        ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      identificacaoDados,
      hierarquiaSensibilidade || 'Dados Pessoais',
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio || new Date().toISOString().split('T')[0],
      dataTermino || null,
      ativo !== undefined ? ativo : true
    ]);

    const lgpdId = result.insertId;

    // Inserir campos associados
    if (campos.length > 0) {
      const camposValues = campos.map(campo => [
        lgpdId,
        campo.nomeCampo,
        campo.descricao,
        campo.baseLegal || null,
        campo.matrizAnonimizacao.vendas,
        campo.matrizAnonimizacao.marketing,
        campo.matrizAnonimizacao.financeiro,
        campo.matrizAnonimizacao.rh,
        campo.matrizAnonimizacao.logistica,
        campo.matrizAnonimizacao.assistenciaTecnica,
        campo.matrizAnonimizacao.analytics
      ]);

      await connection.query(`
        INSERT INTO lgpd_campos (
          lgpd_id,
          nome_campo,
          descricao,
          base_legal,
          matriz_vendas,
          matriz_marketing,
          matriz_financeiro,
          matriz_rh,
          matriz_logistica,
          matriz_assistencia_tecnica,
          matriz_analytics
        ) VALUES ?
      `, [camposValues]);
    }

    await connection.commit();

    // Buscar registro completo criado
    const [registroCriado] = await connection.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        hierarquia_sensibilidade as hierarquiaSensibilidade,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [lgpdId]);

    res.status(201).json(registroCriado[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao criar registro LGPD', code: 'DATABASE_ERROR' });
  } finally {
    connection.release();
  }
});

// PUT /api/lgpd/:id - Atualizar registro LGPD
app.put('/api/lgpd/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      identificacaoDados,
      hierarquiaSensibilidade,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino,
      ativo,
      campos = []
    } = req.body;

    console.log('PUT /api/lgpd/:id - Dados recebidos:', { id, identificacaoDados, hierarquiaSensibilidade, tipoDados, dataInicio, dataTermino, ativo, camposCount: campos.length });

    // Atualizar registro principal
    await connection.query(`
      UPDATE lgpd_registros
      SET identificacao_dados = ?,
          hierarquia_sensibilidade = ?,
          tipo_dados = ?,
          tecnica_anonimizacao = ?,
          data_inicio = ?,
          data_termino = ?,
          ativo = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [
      identificacaoDados,
      hierarquiaSensibilidade || 'Dados Pessoais',
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino || null,
      ativo !== undefined ? ativo : true,
      id
    ]);

    console.log('Registro principal atualizado com sucesso');

    // Deletar campos existentes
    await connection.query('DELETE FROM lgpd_campos WHERE lgpd_id = ?', [id]);

    console.log('Campos anteriores deletados');

    // Inserir novos campos
    if (campos.length > 0) {
      const camposValues = campos.map(campo => [
        id,
        campo.nomeCampo,
        campo.descricao,
        campo.baseLegal || null,
        campo.matrizAnonimizacao.vendas,
        campo.matrizAnonimizacao.marketing,
        campo.matrizAnonimizacao.financeiro,
        campo.matrizAnonimizacao.rh,
        campo.matrizAnonimizacao.logistica,
        campo.matrizAnonimizacao.assistenciaTecnica,
        campo.matrizAnonimizacao.analytics
      ]);

      console.log('Inserindo campos:', camposValues);

      await connection.query(`
        INSERT INTO lgpd_campos (
          lgpd_id,
          nome_campo,
          descricao,
          base_legal,
          matriz_vendas,
          matriz_marketing,
          matriz_financeiro,
          matriz_rh,
          matriz_logistica,
          matriz_assistencia_tecnica,
          matriz_analytics
        ) VALUES ?
      `, [camposValues]);
    }

    await connection.commit();

    // Buscar registro atualizado
    const [registroAtualizado] = await connection.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        hierarquia_sensibilidade as hierarquiaSensibilidade,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [id]);

    res.json(registroAtualizado[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro LGPD', code: 'DATABASE_ERROR' });
  } finally {
    connection.release();
  }
});

// DELETE /api/lgpd/:id - Excluir registro LGPD
app.delete('/api/lgpd/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Deletar campos associados
    await connection.query('DELETE FROM lgpd_campos WHERE lgpd_id = ?', [id]);

    // Deletar registro principal
    await connection.query('DELETE FROM lgpd_registros WHERE id = ?', [id]);

    await connection.commit();

    res.json({ message: 'Registro LGPD excluído com sucesso' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao excluir registro LGPD', code: 'DATABASE_ERROR' });
  } finally {
    connection.release();
  }
});

// ====================================================================
// ROTAS DE SLA (Service Level Agreement)
// ====================================================================

// GET /api/slas - Listar todos os SLAs
app.get('/api/slas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM slas ORDER BY sigla');
    res.json(rows.map(mapSLA));
  } catch (error) {
    console.error('Erro ao buscar SLAs:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// GET /api/slas/:id - Buscar SLA por ID
app.get('/api/slas/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM slas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'SLA não encontrado', code: 'NOT_FOUND' });
    }
    res.json(mapSLA(rows[0]));
  } catch (error) {
    console.error('Erro ao buscar SLA:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// POST /api/slas - Criar novo SLA
app.post('/api/slas', async (req, res) => {
  try {
    const id = uuidv4();
    const { 
      sigla, descricao, tipoSLA, dataInicio, dataTermino, status,
      suporteAtendimento, seguranca, capacidade, disponibilidade, 
      performance, prioridade, apoio, operacional, componentes, usuario, servico
    } = req.body;

    await pool.query(
      `INSERT INTO slas (
        id, sigla, descricao, tipo_sla, data_inicio, data_termino, status,
        tempo_resposta, tempo_solucao, hora_inicial_atendimento, hora_termino_atendimento,
        patching_mensal_obrigatorio, mfa_todos_acessos, tempo_correcao_vulnerabilidade_critical,
        percentual_cpu_maxima, capacidade_storage_livre, escalabilidade_automatica,
        percentual_uptime,
        latencia_maxima, throughput, iops_storage, erros_por_minuto,
        prioridade_p1, prioridade_p2, prioridade_p3,
        sla_empresa, sla_fornecedores,
        infraestrutura, servico, rede,
        sla_banco_dados, sla_rede, sla_storage, sla_microservico,
        suporte_prioritario_area_critica, atendimento_especial_usuarios_chave,
        disponibilidade_sistema, backup_diario, tempo_resposta_apis, rpo_rto_dr, clonagem, data_alvo_clonagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sigla, descricao, tipoSLA, formatDateForMySQL(dataInicio), formatDateForMySQL(dataTermino), status || 'Ativo',
        suporteAtendimento?.tempoResposta, suporteAtendimento?.tempoSolucao, 
        suporteAtendimento?.horaInicialAtendimento, suporteAtendimento?.horaTerminoAtendimento,
        seguranca?.patchingMensalObrigatorio, seguranca?.mfaParaTodosAcessos, seguranca?.tempoCorrecaoVulnerabilidadeCritical,
        capacidade?.percentualCPUMaxima, capacidade?.capacidadeStorageLivre, capacidade?.escalabilidadeAutomatica,
        disponibilidade?.percentualUptime,
        performance?.latenciaMaxima, performance?.throughput, performance?.iopsStorage, performance?.errosPorMinuto,
        prioridade?.p1, prioridade?.p2, prioridade?.p3,
        apoio?.slaEmpresa, apoio?.slaFornecedores,
        operacional?.infraestrutura, operacional?.servico, operacional?.rede,
        componentes?.slaBancoDados, componentes?.slaRede, componentes?.slaStorage, componentes?.slaMicroservico,
        usuario?.suportePrioritarioAreaCritica, usuario?.atendimentoEspecialUsuariosChave,
        servico?.disponibilidadeSistema, servico?.backupDiario, servico?.tempoRespostaAPIs, 
        servico?.rpoRtoDR, servico?.clonagem, servico?.dataAlvoClonagem
      ]
    );

    const [rows] = await pool.query('SELECT * FROM slas WHERE id = ?', [id]);
    res.status(201).json(mapSLA(rows[0]));
  } catch (error) {
    console.error('Erro ao criar SLA:', error);
    res.status(500).json({ error: 'Erro ao criar SLA', code: 'DATABASE_ERROR' });
  }
});

// PUT /api/slas/:id - Atualizar SLA
app.put('/api/slas/:id', async (req, res) => {
  try {
    const { 
      sigla, descricao, tipoSLA, dataInicio, dataTermino, status,
      suporteAtendimento, seguranca, capacidade, disponibilidade, 
      performance, prioridade, apoio, operacional, componentes, usuario, servico
    } = req.body;

    await pool.query(
      `UPDATE slas SET
        sigla = ?, descricao = ?, tipo_sla = ?, data_inicio = ?, data_termino = ?, status = ?,
        tempo_resposta = ?, tempo_solucao = ?, hora_inicial_atendimento = ?, hora_termino_atendimento = ?,
        patching_mensal_obrigatorio = ?, mfa_todos_acessos = ?, tempo_correcao_vulnerabilidade_critical = ?,
        percentual_cpu_maxima = ?, capacidade_storage_livre = ?, escalabilidade_automatica = ?,
        percentual_uptime = ?,
        latencia_maxima = ?, throughput = ?, iops_storage = ?, erros_por_minuto = ?,
        prioridade_p1 = ?, prioridade_p2 = ?, prioridade_p3 = ?,
        sla_empresa = ?, sla_fornecedores = ?,
        infraestrutura = ?, servico = ?, rede = ?,
        sla_banco_dados = ?, sla_rede = ?, sla_storage = ?, sla_microservico = ?,
        suporte_prioritario_area_critica = ?, atendimento_especial_usuarios_chave = ?,
        disponibilidade_sistema = ?, backup_diario = ?, tempo_resposta_apis = ?, rpo_rto_dr = ?, clonagem = ?, data_alvo_clonagem = ?
      WHERE id = ?`,
      [
        sigla, descricao, tipoSLA, formatDateForMySQL(dataInicio), formatDateForMySQL(dataTermino), status || 'Ativo',
        suporteAtendimento?.tempoResposta, suporteAtendimento?.tempoSolucao, 
        suporteAtendimento?.horaInicialAtendimento, suporteAtendimento?.horaTerminoAtendimento,
        seguranca?.patchingMensalObrigatorio, seguranca?.mfaParaTodosAcessos, seguranca?.tempoCorrecaoVulnerabilidadeCritical,
        capacidade?.percentualCPUMaxima, capacidade?.capacidadeStorageLivre, capacidade?.escalabilidadeAutomatica,
        disponibilidade?.percentualUptime,
        performance?.latenciaMaxima, performance?.throughput, performance?.iopsStorage, performance?.errosPorMinuto,
        prioridade?.p1, prioridade?.p2, prioridade?.p3,
        apoio?.slaEmpresa, apoio?.slaFornecedores,
        operacional?.infraestrutura, operacional?.servico, operacional?.rede,
        componentes?.slaBancoDados, componentes?.slaRede, componentes?.slaStorage, componentes?.slaMicroservico,
        usuario?.suportePrioritarioAreaCritica, usuario?.atendimentoEspecialUsuariosChave,
        servico?.disponibilidadeSistema, servico?.backupDiario, servico?.tempoRespostaAPIs, 
        servico?.rpoRtoDR, servico?.clonagem, servico?.dataAlvoClonagem,
        req.params.id
      ]
    );

    const [rows] = await pool.query('SELECT * FROM slas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'SLA não encontrado', code: 'NOT_FOUND' });
    }
    res.json(mapSLA(rows[0]));
  } catch (error) {
    console.error('Erro ao atualizar SLA:', error);
    res.status(500).json({ error: 'Erro ao atualizar SLA', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/slas/:id - Deletar SLA
app.delete('/api/slas/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM slas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'SLA não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar SLA:', error);
    res.status(500).json({ error: 'Erro ao deletar SLA', code: 'DATABASE_ERROR' });
  }
});

// ==================== SCRIPTS ====================

// GET /api/scripts - Listar todos os scripts
app.get('/api/scripts', async (req, res) => {
  let connection;
  try {
    connection = await getUtf8Connection();
    const [rows] = await connection.query('SELECT * FROM scripts ORDER BY sigla');
    console.log('[GET /api/scripts] Total de scripts encontrados:', rows.length);
    if (rows.length > 0) {
      console.log('[GET /api/scripts] Primeiro script (raw):', rows[0]);
    }
    const resultado = rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      tipoScript: row.tipo_script,
      arquivo: row.arquivo,
      arquivoUrl: row.arquivo_url,
      arquivoTamanho: row.arquivo_tamanho,
      arquivoTipo: row.arquivo_tipo
    }));
    if (resultado.length > 0) {
      console.log('[GET /api/scripts] Primeiro script (mapeado):', resultado[0]);
    }
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar scripts:', error);
    res.status(500).json({ error: 'Erro ao buscar scripts', code: 'DATABASE_ERROR' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/scripts/:id - Buscar script por ID
app.get('/api/scripts/:id', async (req, res) => {
  let connection;
  try {
    connection = await getUtf8Connection();
    const [rows] = await connection.query('SELECT * FROM scripts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Script não encontrado', code: 'NOT_FOUND' });
    }
    const row = rows[0];
    res.json({
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      tipoScript: row.tipo_script,
      arquivo: row.arquivo,
      arquivoUrl: row.arquivo_url,
      arquivoTamanho: row.arquivo_tamanho,
      arquivoTipo: row.arquivo_tipo
    });
  } catch (error) {
    console.error('Erro ao buscar script:', error);
    res.status(500).json({ error: 'Erro ao buscar script', code: 'DATABASE_ERROR' });
  } finally {
    if (connection) connection.release();
  }
});

// POST /api/scripts - Criar novo script
app.post('/api/scripts', uploadScript.single('arquivo'), async (req, res) => {
  let connection;
  try {
    console.log('[POST /api/scripts] ====== INÍCIO ======');
    console.log('[POST /api/scripts] Content-Type:', req.headers['content-type']);
    console.log('[POST /api/scripts] req.file:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NÃO');
    console.log('[POST /api/scripts] req.body keys:', Object.keys(req.body));
    
    connection = await getUtf8Connection();
    const id = uuidv4();
    let scriptData;

    // Se foi enviado via FormData com arquivo
    if (req.file) {
      console.log('[POST /api/scripts] ✅ BRANCH: Com arquivo');
      scriptData = JSON.parse(req.body.data);
      console.log('[POST /api/scripts] scriptData:', scriptData);
      const arquivo = req.file;
      
      await connection.query(
        `INSERT INTO scripts (
          id, sigla, descricao, data_inicio, data_termino, tipo_script,
          arquivo, arquivo_url, arquivo_tamanho, arquivo_tipo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          scriptData.sigla,
          scriptData.descricao,
          formatDateForMySQL(scriptData.dataInicio),
          formatDateForMySQL(scriptData.dataTermino),
          scriptData.tipoScript,
          arquivo.originalname,
          arquivo.path,
          arquivo.size,
          arquivo.mimetype
        ]
      );
      console.log('[POST /api/scripts] ✅ Inserido COM arquivo');
    } else {
      // Sem arquivo, apenas JSON
      console.log('[POST /api/scripts] ℹ️ BRANCH: Sem arquivo');
      scriptData = req.body;
      console.log('[POST /api/scripts] scriptData:', scriptData);
      
      await connection.query(
        `INSERT INTO scripts (
          id, sigla, descricao, data_inicio, data_termino, tipo_script
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          scriptData.sigla,
          scriptData.descricao,
          formatDateForMySQL(scriptData.dataInicio),
          formatDateForMySQL(scriptData.dataTermino),
          scriptData.tipoScript
        ]
      );
      console.log('[POST /api/scripts] ✅ Inserido SEM arquivo');
    }

    const [rows] = await connection.query('SELECT * FROM scripts WHERE id = ?', [id]);
    const row = rows[0];
    const result = {
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      tipoScript: row.tipo_script,
      arquivo: row.arquivo,
      arquivoUrl: row.arquivo_url,
      arquivoTamanho: row.arquivo_tamanho,
      arquivoTipo: row.arquivo_tipo
    };
    console.log('[POST /api/scripts] ✅ Retornando:', result);
    console.log('[POST /api/scripts] ====== FIM ======');
    res.status(201).json(result);
  } catch (error) {
    console.error('[POST /api/scripts] ❌ ERRO:', error);
    res.status(500).json({ error: 'Erro ao criar script', code: 'DATABASE_ERROR' });
  } finally {
    if (connection) connection.release();
  }
});

// PUT /api/scripts/:id - Atualizar script
app.put('/api/scripts/:id', (req, res, next) => {
  console.log('[PUT /api/scripts/:id] ANTES do multer');
  console.log('[PUT /api/scripts/:id] Content-Type:', req.headers['content-type']);
  console.log('[PUT /api/scripts/:id] Body keys:', Object.keys(req.body));
  next();
}, (req, res, next) => {
  // Wrapper para tratar erro do multer
  uploadScript.single('arquivo')(req, res, (err) => {
    if (err) {
      console.error('[PUT /api/scripts/:id] Erro no multer:', err.message);
      // Se o erro for ENOENT, ignorar (arquivo antigo não existe)
      if (err.code === 'ENOENT') {
        console.log('[PUT /api/scripts/:id] Arquivo não encontrado - continuando sem arquivo');
        return next();
      }
      return res.status(400).json({ error: err.message, code: err.code });
    }
    next();
  });
}, async (req, res) => {
  let connection;
  try {
    console.log('[PUT /api/scripts/:id] Iniciando atualização do script:', req.params.id);
    console.log('[PUT /api/scripts/:id] req.file:', req.file ? 'SIM' : 'NÃO');
    console.log('[PUT /api/scripts/:id] req.body:', req.body);
    
    connection = await getUtf8Connection();
    let scriptData;

    // Se foi enviado via FormData com arquivo
    if (req.file) {
      scriptData = JSON.parse(req.body.data);
      console.log('[PUT /api/scripts/:id] Script data (com arquivo):', scriptData);
      const arquivo = req.file;
      
      await connection.query(
        `UPDATE scripts SET
          sigla = ?, descricao = ?, data_inicio = ?, data_termino = ?, tipo_script = ?,
          arquivo = ?, arquivo_url = ?, arquivo_tamanho = ?, arquivo_tipo = ?
        WHERE id = ?`,
        [
          scriptData.sigla,
          scriptData.descricao,
          formatDateForMySQL(scriptData.dataInicio),
          formatDateForMySQL(scriptData.dataTermino),
          scriptData.tipoScript,
          arquivo.originalname,
          arquivo.path,
          arquivo.size,
          arquivo.mimetype,
          req.params.id
        ]
      );
    } else {
      // Sem arquivo NOVO
      // Se veio de multipart/form-data, o body tem uma propriedade 'data' com JSON string
      if (req.body.data) {
        scriptData = JSON.parse(req.body.data);
        console.log('[PUT /api/scripts/:id] Script data (multipart sem arquivo):', scriptData);
      } else {
        // Se veio como JSON puro
        scriptData = req.body;
        console.log('[PUT /api/scripts/:id] Script data (JSON puro):', scriptData);
      }
      
      // IMPORTANTE: Quando não há novo arquivo, preservar o arquivo existente
      // NÃO atualizar os campos arquivo, arquivo_url, arquivo_tamanho, arquivo_tipo
      await connection.query(
        `UPDATE scripts SET
          sigla = ?, descricao = ?, data_inicio = ?, data_termino = ?, tipo_script = ?
        WHERE id = ?`,
        [
          scriptData.sigla,
          scriptData.descricao,
          formatDateForMySQL(scriptData.dataInicio),
          formatDateForMySQL(scriptData.dataTermino),
          scriptData.tipoScript,
          req.params.id
        ]
      );
      
      console.log('[PUT /api/scripts/:id] Script atualizado SEM mexer no arquivo existente');
    }

    const [rows] = await connection.query('SELECT * FROM scripts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Script não encontrado', code: 'NOT_FOUND' });
    }
    const row = rows[0];
    res.json({
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao,
      dataInicio: row.data_inicio,
      dataTermino: row.data_termino,
      tipoScript: row.tipo_script,
      arquivo: row.arquivo,
      arquivoUrl: row.arquivo_url,
      arquivoTamanho: row.arquivo_tamanho,
      arquivoTipo: row.arquivo_tipo
    });
  } catch (error) {
    console.error('Erro ao atualizar script:', error);
    res.status(500).json({ error: 'Erro ao atualizar script', code: 'DATABASE_ERROR' });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/scripts/:id - Deletar script
app.delete('/api/scripts/:id', async (req, res) => {
  let connection;
  try {
    connection = await getUtf8Connection();
    const [result] = await connection.query('DELETE FROM scripts WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Script não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar script:', error);
    res.status(500).json({ error: 'Erro ao deletar script', code: 'DATABASE_ERROR' });
  } finally {
    if (connection) connection.release();
  }
});

// ==================== RUNBOOKS ====================

// GET /api/runbooks - Listar todos os runbooks
app.get('/api/runbooks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM runbooks ORDER BY sigla');
    
    const runbooks = rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      descricaoResumida: row.descricao_resumida,
      finalidade: row.finalidade,
      tipoRunbook: row.tipo_runbook,
      preRequisitos: {
        acessosNecessarios: row.acessos_necessarios || '',
        validacoesAntesIniciar: row.validacoes_antes_iniciar || '',
        ferramentasNecessarias: row.ferramentas_necessarias || '',
      },
      procedimentoOperacional: {
        comandos: row.comandos || '',
        pontosAtencao: row.pontos_atencao || '',
        checksIntermediarios: row.checks_intermediarios || '',
        criteriosSucesso: row.criterios_sucesso || '',
        criteriosFalha: row.criterios_falha || '',
      },
      posExecucao: {
        validacoesObrigatorias: row.validacoes_obrigatorias || '',
        verificacaoLogs: row.verificacao_logs || '',
        statusEsperadoAplicacao: row.status_esperado_aplicacao || '',
        notificacoesNecessarias: row.notificacoes_necessarias || '',
      },
      execucaoAutomatizada: {
        scriptsRelacionados: row.scripts_relacionados || '',
        jobsAssociados: row.jobs_associados || '',
        urlLocalizacaoScripts: row.url_localizacao_scripts || '',
        condicoesAutomacao: row.condicoes_automacao || '',
      },
      evidencias: {
        printsLogsNecessarios: row.prints_logs_necessarios || '',
        arquivosGerados: row.arquivos_gerados || '',
        tempoMedioExecucao: row.tempo_medio_execucao || '',
      },
      riscosMitigacoes: {
        principaisRiscos: row.principais_riscos || '',
        acoesPreventivas: row.acoes_preventivas || '',
        acoesCorretivasRapidas: row.acoes_corretivas_rapidas || '',
      },
    }));
    
    console.log(`[API] GET /api/runbooks - Retornando ${runbooks.length} runbooks`);
    res.json(runbooks);
  } catch (error) {
    console.error('Erro ao buscar runbooks:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// GET /api/runbooks/:id - Buscar runbook por ID
app.get('/api/runbooks/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM runbooks WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Runbook não encontrado', code: 'NOT_FOUND' });
    }
    
    const row = rows[0];
    const runbook = {
      id: row.id,
      sigla: row.sigla,
      descricaoResumida: row.descricao_resumida,
      finalidade: row.finalidade,
      tipoRunbook: row.tipo_runbook,
      preRequisitos: {
        acessosNecessarios: row.acessos_necessarios || '',
        validacoesAntesIniciar: row.validacoes_antes_iniciar || '',
        ferramentasNecessarias: row.ferramentas_necessarias || '',
      },
      procedimentoOperacional: {
        comandos: row.comandos || '',
        pontosAtencao: row.pontos_atencao || '',
        checksIntermediarios: row.checks_intermediarios || '',
        criteriosSucesso: row.criterios_sucesso || '',
        criteriosFalha: row.criterios_falha || '',
      },
      posExecucao: {
        validacoesObrigatorias: row.validacoes_obrigatorias || '',
        verificacaoLogs: row.verificacao_logs || '',
        statusEsperadoAplicacao: row.status_esperado_aplicacao || '',
        notificacoesNecessarias: row.notificacoes_necessarias || '',
      },
      execucaoAutomatizada: {
        scriptsRelacionados: row.scripts_relacionados || '',
        jobsAssociados: row.jobs_associados || '',
        urlLocalizacaoScripts: row.url_localizacao_scripts || '',
        condicoesAutomacao: row.condicoes_automacao || '',
      },
      evidencias: {
        printsLogsNecessarios: row.prints_logs_necessarios || '',
        arquivosGerados: row.arquivos_gerados || '',
        tempoMedioExecucao: row.tempo_medio_execucao || '',
      },
      riscosMitigacoes: {
        principaisRiscos: row.principais_riscos || '',
        acoesPreventivas: row.acoes_preventivas || '',
        acoesCorretivasRapidas: row.acoes_corretivas_rapidas || '',
      },
    };
    
    res.json(runbook);
  } catch (error) {
    console.error('Erro ao buscar runbook:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// POST /api/runbooks - Criar novo runbook
app.post('/api/runbooks', async (req, res) => {
  try {
    const runbook = req.body;
    const id = runbook.id || uuidv4();
    
    console.log('[API] POST /api/runbooks - Criando runbook:', runbook.sigla);
    
    await pool.query(
      `INSERT INTO runbooks (
        id, sigla, descricao_resumida, finalidade, tipo_runbook,
        acessos_necessarios, validacoes_antes_iniciar, ferramentas_necessarias,
        comandos, pontos_atencao, checks_intermediarios, criterios_sucesso, criterios_falha,
        validacoes_obrigatorias, verificacao_logs, status_esperado_aplicacao, notificacoes_necessarias,
        scripts_relacionados, jobs_associados, url_localizacao_scripts, condicoes_automacao,
        prints_logs_necessarios, arquivos_gerados, tempo_medio_execucao,
        principais_riscos, acoes_preventivas, acoes_corretivas_rapidas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        runbook.sigla,
        runbook.descricaoResumida,
        runbook.finalidade,
        runbook.tipoRunbook,
        runbook.preRequisitos?.acessosNecessarios || null,
        runbook.preRequisitos?.validacoesAntesIniciar || null,
        runbook.preRequisitos?.ferramentasNecessarias || null,
        runbook.procedimentoOperacional?.comandos || null,
        runbook.procedimentoOperacional?.pontosAtencao || null,
        runbook.procedimentoOperacional?.checksIntermediarios || null,
        runbook.procedimentoOperacional?.criteriosSucesso || null,
        runbook.procedimentoOperacional?.criteriosFalha || null,
        runbook.posExecucao?.validacoesObrigatorias || null,
        runbook.posExecucao?.verificacaoLogs || null,
        runbook.posExecucao?.statusEsperadoAplicacao || null,
        runbook.posExecucao?.notificacoesNecessarias || null,
        runbook.execucaoAutomatizada?.scriptsRelacionados || null,
        runbook.execucaoAutomatizada?.jobsAssociados || null,
        runbook.execucaoAutomatizada?.urlLocalizacaoScripts || null,
        runbook.execucaoAutomatizada?.condicoesAutomacao || null,
        runbook.evidencias?.printsLogsNecessarios || null,
        runbook.evidencias?.arquivosGerados || null,
        runbook.evidencias?.tempoMedioExecucao || null,
        runbook.riscosMitigacoes?.principaisRiscos || null,
        runbook.riscosMitigacoes?.acoesPreventivas || null,
        runbook.riscosMitigacoes?.acoesCorretivasRapidas || null,
      ]
    );
    
    res.status(201).json({ id, ...runbook });
  } catch (error) {
    console.error('Erro ao criar runbook:', error);
    res.status(500).json({ error: 'Erro ao criar runbook', code: 'DATABASE_ERROR' });
  }
});

// PUT /api/runbooks/:id - Atualizar runbook
app.put('/api/runbooks/:id', async (req, res) => {
  try {
    const runbook = req.body;
    
    console.log('[API] PUT /api/runbooks/:id - Atualizando runbook:', req.params.id);
    
    const [result] = await pool.query(
      `UPDATE runbooks SET
        sigla = ?, descricao_resumida = ?, finalidade = ?, tipo_runbook = ?,
        acessos_necessarios = ?, validacoes_antes_iniciar = ?, ferramentas_necessarias = ?,
        comandos = ?, pontos_atencao = ?, checks_intermediarios = ?, criterios_sucesso = ?, criterios_falha = ?,
        validacoes_obrigatorias = ?, verificacao_logs = ?, status_esperado_aplicacao = ?, notificacoes_necessarias = ?,
        scripts_relacionados = ?, jobs_associados = ?, url_localizacao_scripts = ?, condicoes_automacao = ?,
        prints_logs_necessarios = ?, arquivos_gerados = ?, tempo_medio_execucao = ?,
        principais_riscos = ?, acoes_preventivas = ?, acoes_corretivas_rapidas = ?
      WHERE id = ?`,
      [
        runbook.sigla,
        runbook.descricaoResumida,
        runbook.finalidade,
        runbook.tipoRunbook,
        runbook.preRequisitos?.acessosNecessarios || null,
        runbook.preRequisitos?.validacoesAntesIniciar || null,
        runbook.preRequisitos?.ferramentasNecessarias || null,
        runbook.procedimentoOperacional?.comandos || null,
        runbook.procedimentoOperacional?.pontosAtencao || null,
        runbook.procedimentoOperacional?.checksIntermediarios || null,
        runbook.procedimentoOperacional?.criteriosSucesso || null,
        runbook.procedimentoOperacional?.criteriosFalha || null,
        runbook.posExecucao?.validacoesObrigatorias || null,
        runbook.posExecucao?.verificacaoLogs || null,
        runbook.posExecucao?.statusEsperadoAplicacao || null,
        runbook.posExecucao?.notificacoesNecessarias || null,
        runbook.execucaoAutomatizada?.scriptsRelacionados || null,
        runbook.execucaoAutomatizada?.jobsAssociados || null,
        runbook.execucaoAutomatizada?.urlLocalizacaoScripts || null,
        runbook.execucaoAutomatizada?.condicoesAutomacao || null,
        runbook.evidencias?.printsLogsNecessarios || null,
        runbook.evidencias?.arquivosGerados || null,
        runbook.evidencias?.tempoMedioExecucao || null,
        runbook.riscosMitigacoes?.principaisRiscos || null,
        runbook.riscosMitigacoes?.acoesPreventivas || null,
        runbook.riscosMitigacoes?.acoesCorretivasRapidas || null,
        req.params.id,
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Runbook não encontrado', code: 'NOT_FOUND' });
    }
    
    res.json({ id: req.params.id, ...runbook });
  } catch (error) {
    console.error('Erro ao atualizar runbook:', error);
    res.status(500).json({ error: 'Erro ao atualizar runbook', code: 'DATABASE_ERROR' });
  }
});

// DELETE /api/runbooks/:id - Deletar runbook
app.delete('/api/runbooks/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM runbooks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Runbook não encontrado', code: 'NOT_FOUND' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar runbook:', error);
    res.status(500).json({ error: 'Erro ao deletar runbook', code: 'DATABASE_ERROR' });
  }
});

// ==================== ESTRUTURAS DE PROJETO ====================

// GET /api/estruturas-projeto - Listar todas as estruturas
app.get('/api/estruturas-projeto', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM estruturas_projeto ORDER BY data_criacao DESC');
    
    const estruturas = rows.map(row => {
      let repositorios = [];
      let estruturasGeradas = [];
      
      // Parse repositorios
      if (row.repositorios) {
        try {
          repositorios = typeof row.repositorios === 'string' 
            ? JSON.parse(row.repositorios) 
            : row.repositorios;
        } catch (e) {
          console.error('Erro ao parsear repositorios:', e);
        }
      }
      
      // Parse estruturas_geradas
      if (row.estruturas_geradas) {
        try {
          estruturasGeradas = typeof row.estruturas_geradas === 'string'
            ? JSON.parse(row.estruturas_geradas)
            : row.estruturas_geradas;
        } catch (e) {
          console.error('Erro ao parsear estruturas_geradas:', e);
        }
      }
      
      return {
        id: row.id,
        produto: row.produto,
        workItemProcess: row.work_item_process,
        projeto: row.projeto,
        nomeTime: row.nome_time,
        dataInicial: row.data_inicial,
        numeroSemanas: row.numero_semanas,
        iteracao: row.iteracao,
        incluirQuery: row.incluir_query === 1,
        incluirMaven: row.incluir_maven === 1,
        incluirLiquibase: row.incluir_liquibase === 1,
        criarTimeSustentacao: row.criar_time_sustentacao === 1,
        iteracaoMensal: row.iteracao_mensal === 1,
        innerSourceProject: row.inner_source_project === 1,
        repositorios,
        patToken: row.pat_token,
        estruturasGeradas,
        dataCriacao: row.data_criacao,
        status: row.status || 'Pendente',
        urlProjeto: row.url_projeto,
        aplicacaoBaseId: row.aplicacao_base_id,
        statusRepositorio: row.status_repositorio || 'N',
      };
    });
    
    console.log(`[API] GET /api/estruturas-projeto - Retornando ${estruturas.length} estruturas`);
    res.json(estruturas);
  } catch (error) {
    console.error('Erro ao buscar estruturas de projeto:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// GET /api/estruturas-projeto/:id - Buscar estrutura por ID
app.get('/api/estruturas-projeto/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM estruturas_projeto WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estrutura não encontrada', code: 'NOT_FOUND' });
    }
    
    const row = rows[0];
    
    let repositorios = [];
    let estruturasGeradas = [];
    
    if (row.repositorios) {
      try {
        repositorios = typeof row.repositorios === 'string' 
          ? JSON.parse(row.repositorios) 
          : row.repositorios;
      } catch (e) {
        console.error('Erro ao parsear repositorios:', e);
      }
    }
    
    if (row.estruturas_geradas) {
      try {
        estruturasGeradas = typeof row.estruturas_geradas === 'string'
          ? JSON.parse(row.estruturas_geradas)
          : row.estruturas_geradas;
      } catch (e) {
        console.error('Erro ao parsear estruturas_geradas:', e);
      }
    }
    
    const estrutura = {
      id: row.id,
      produto: row.produto,
      workItemProcess: row.work_item_process,
      projeto: row.projeto,
      dataInicial: row.data_inicial,
      iteracao: row.iteracao,
      incluirQuery: row.incluir_query === 1,
      incluirMaven: row.incluir_maven === 1,
      incluirLiquibase: row.incluir_liquibase === 1,
      criarTimeSustentacao: row.criar_time_sustentacao === 1,
      repositorios,
      patToken: row.pat_token,
      estruturasGeradas,
      dataCriacao: row.data_criacao,
    };
    
    res.json(estrutura);
  } catch (error) {
    console.error('Erro ao buscar estrutura de projeto:', error);
    res.status(500).json({ error: 'Erro ao buscar dados', code: 'DATABASE_ERROR' });
  }
});

// POST /api/estruturas-projeto - Criar nova estrutura
app.post('/api/estruturas-projeto', async (req, res) => {
  try {
    const estrutura = req.body;
    const id = estrutura.id || uuidv4();
    
    console.log('[API] POST /api/estruturas-projeto - Criando estrutura:', estrutura.produto, estrutura.projeto);
    console.log('[API] InnerSource Project:', estrutura.innerSourceProject);
    
    await pool.query(
      `INSERT INTO estruturas_projeto (
        id, produto, work_item_process, projeto, data_inicial, iteracao,
        incluir_query, incluir_maven, incluir_liquibase, criar_time_sustentacao,
        repositorios, pat_token, estruturas_geradas, nome_time, numero_semanas, iteracao_mensal, status, status_repositorio, inner_source_project, aplicacao_base_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        estrutura.produto,
        estrutura.workItemProcess || 'Scrum',
        estrutura.projeto,
        estrutura.dataInicial,
        estrutura.iteracao,
        estrutura.incluirQuery || false,
        estrutura.incluirMaven || false,
        estrutura.incluirLiquibase || false,
        estrutura.criarTimeSustentacao || false,
        estrutura.repositorios ? JSON.stringify(estrutura.repositorios) : null,
        estrutura.patToken || null,
        estrutura.estruturasGeradas ? JSON.stringify(estrutura.estruturasGeradas) : null,
        estrutura.nomeTime || null,
        estrutura.numeroSemanas || 2,
        estrutura.iteracaoMensal || false,
        estrutura.status || 'Pendente',
        'N',
        estrutura.innerSourceProject || false,
        estrutura.aplicacaoBaseId || null
      ]
    );
    
    // Se o projeto for InnerSource, criar registro na tabela innersource_projects
    if (estrutura.innerSourceProject === true) {
      console.log('[API] Criando registro InnerSource automático para projeto:', estrutura.projeto);
      
      const innerSourceId = `innersource-${id}`;
      
      // Determinar URL do projeto
      let urlProjeto = `https://dev.azure.com/organization/${estrutura.produto}/${estrutura.projeto}`;
      
      if (estrutura.repositorios && estrutura.repositorios.length > 0) {
        const repo = estrutura.repositorios[0];
        if (repo.url) {
          urlProjeto = repo.url;
        } else if (repo.nome) {
          urlProjeto = `https://github.com/${estrutura.produto}/${repo.nome}`;
        }
      }
      
      const ownerData = JSON.stringify({
        login: estrutura.produto || 'unknown',
        avatar_url: null
      });
      
      const metadataData = JSON.stringify({
        produto: estrutura.produto,
        projeto: estrutura.projeto,
        dataInicial: estrutura.dataInicial,
        nomeTime: estrutura.nomeTime
      });
      
      await pool.query(
        `INSERT INTO innersource_projects (
          id, nome, full_nome, html_url, descricao, 
          stargazers_count, watchers_count, language, forks_count, open_issues_count,
          license, owner, metadata, estrutura_projeto_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          innerSourceId,
          estrutura.projeto,
          `${estrutura.produto}/${estrutura.projeto}`,
          urlProjeto,
          `Projeto InnerSource criado automaticamente: ${estrutura.projeto}`,
          0, // stargazers_count
          0, // watchers_count
          null, // language
          0, // forks_count
          0, // open_issues_count
          null, // license
          ownerData,
          metadataData,
          id // estrutura_projeto_id
        ]
      );
      
      console.log('[API] Registro InnerSource criado com ID:', innerSourceId);
    }
    
    res.status(201).json({ id, ...estrutura });
  } catch (error) {
    console.error('Erro ao criar estrutura de projeto:', error);
    res.status(500).json({ error: 'Erro ao criar estrutura', code: 'DATABASE_ERROR' });
  }
});

// PUT /api/estruturas-projeto/:id - Atualizar estrutura
app.put('/api/estruturas-projeto/:id', async (req, res) => {
  try {
    const estrutura = req.body;
    
    console.log('[API] PUT /api/estruturas-projeto/:id - Atualizando estrutura:', req.params.id);
    console.log('[API] Dados recebidos:', JSON.stringify(estrutura, null, 2));
    
    // Converter data ISO para formato MySQL (YYYY-MM-DD)
    let dataInicial = estrutura.dataInicial;
    if (dataInicial && dataInicial.includes('T')) {
      dataInicial = dataInicial.split('T')[0];
    }
    
    // Verificar estado anterior do inner_source_project
    const [existingRows] = await pool.query(
      'SELECT inner_source_project FROM estruturas_projeto WHERE id = ?',
      [req.params.id]
    );
    
    const existingInnerSource = existingRows.length > 0 ? existingRows[0].inner_source_project : false;
    
    const [result] = await pool.query(
      `UPDATE estruturas_projeto SET
        produto = ?, 
        work_item_process = ?, 
        projeto = ?, 
        nome_time = ?,
        data_inicial = ?, 
        numero_semanas = ?,
        iteracao = ?,
        incluir_query = ?, 
        incluir_maven = ?, 
        incluir_liquibase = ?, 
        criar_time_sustentacao = ?,
        iteracao_mensal = ?,
        repositorios = ?, 
        pat_token = ?, 
        estruturas_geradas = ?,
        status = ?,
        url_projeto = ?,
        aplicacao_base_id = ?,
        status_repositorio = ?,
        inner_source_project = ?
      WHERE id = ?`,
      [
        estrutura.produto,
        estrutura.workItemProcess || 'Scrum',
        estrutura.projeto,
        estrutura.nomeTime || `Time_${estrutura.projeto}`,
        dataInicial,
        estrutura.numeroSemanas || 2,
        estrutura.iteracao,
        estrutura.incluirQuery || false,
        estrutura.incluirMaven || false,
        estrutura.incluirLiquibase || false,
        estrutura.criarTimeSustentacao || false,
        estrutura.iteracaoMensal || false,
        estrutura.repositorios ? JSON.stringify(estrutura.repositorios) : null,
        estrutura.patToken || null,
        estrutura.estruturasGeradas ? JSON.stringify(estrutura.estruturasGeradas) : null,
        estrutura.status || 'Pendente',
        estrutura.urlProjeto || null,
        estrutura.aplicacaoBaseId || null,
        estrutura.statusRepositorio || 'N',
        estrutura.innerSourceProject || false,
        req.params.id,
      ]
    );
    
    console.log('[API] Query executada. Linhas afetadas:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estrutura não encontrada', code: 'NOT_FOUND' });
    }
    
    // Sincronizar com InnerSource Projects
    const innerSourceAtivado = estrutura.innerSourceProject === true;
    
    if (innerSourceAtivado && !existingInnerSource) {
      // Checkbox foi marcado agora - criar registro InnerSource
      console.log('[API] InnerSource ativado - criando registro para:', estrutura.projeto);
      
      const innerSourceId = `innersource-${req.params.id}`;
      
      // Determinar URL do projeto
      let urlProjeto = `https://dev.azure.com/organization/${estrutura.produto}/${estrutura.projeto}`;
      
      if (estrutura.repositorios && estrutura.repositorios.length > 0) {
        const repo = estrutura.repositorios[0];
        if (repo.url) {
          urlProjeto = repo.url;
        } else if (repo.nome) {
          urlProjeto = `https://github.com/${estrutura.produto}/${repo.nome}`;
        }
      }
      
      const ownerData = JSON.stringify({
        login: estrutura.produto || 'unknown',
        avatar_url: null
      });
      
      const metadataData = JSON.stringify({
        produto: estrutura.produto,
        projeto: estrutura.projeto,
        dataInicial: estrutura.dataInicial,
        nomeTime: estrutura.nomeTime
      });
      
      await pool.query(
        `INSERT INTO innersource_projects (
          id, nome, full_nome, html_url, descricao, 
          stargazers_count, watchers_count, language, forks_count, open_issues_count,
          license, owner, metadata, estrutura_projeto_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          innerSourceId,
          estrutura.projeto,
          `${estrutura.produto}/${estrutura.projeto}`,
          urlProjeto,
          `Projeto InnerSource: ${estrutura.projeto}`,
          0, 0, null, 0, 0, null,
          ownerData,
          metadataData,
          req.params.id
        ]
      );
      
      console.log('[API] Registro InnerSource criado:', innerSourceId);
    } else if (!innerSourceAtivado && existingInnerSource) {
      // Checkbox foi desmarcado - remover registro InnerSource
      console.log('[API] InnerSource desativado - removendo registro');
      await pool.query(
        'DELETE FROM innersource_projects WHERE estrutura_projeto_id = ?',
        [req.params.id]
      );
      console.log('[API] Registro InnerSource removido');
    }
    
    res.json({ id: req.params.id, ...estrutura });
  } catch (error) {
    console.error('[API] Erro ao atualizar estrutura de projeto:', error);
    console.error('[API] Stack trace:', error.stack);
    res.status(500).json({ error: 'Erro ao atualizar estrutura', code: 'DATABASE_ERROR', details: error.message });
  }
});

// DELETE /api/estruturas-projeto/:id - Deletar estrutura
app.delete('/api/estruturas-projeto/:id', async (req, res) => {
  try {
    // Verificar se o projeto existe
    const [rows] = await pool.query(
      'SELECT id, projeto, status FROM estruturas_projeto WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'Estrutura não encontrada', 
        code: 'NOT_FOUND' 
      });
    }
    
    const estrutura = rows[0];
    
    // [MODO TESTE] Permitir exclusão de projetos processados para testes
    console.log(`[API] Excluindo projeto: ${estrutura.projeto} (Status: ${estrutura.status})`);
    
    // Deletar registro InnerSource associado (se existir)
    console.log('[API] Verificando registro InnerSource associado...');
    const [innerSourceRows] = await pool.query(
      'SELECT id FROM innersource_projects WHERE estrutura_projeto_id = ?',
      [req.params.id]
    );
    
    if (innerSourceRows.length > 0) {
      const innerSourceId = innerSourceRows[0].id;
      console.log('[API] Deletando registro InnerSource associado:', innerSourceId);
      await pool.query('DELETE FROM innersource_projects WHERE id = ?', [innerSourceId]);
      console.log('[API] Registro InnerSource deletado com sucesso');
    }
    
    // Excluir estrutura do projeto
    const [result] = await pool.query('DELETE FROM estruturas_projeto WHERE id = ?', [req.params.id]);
    console.log(`[API] Projeto ${estrutura.projeto} excluído com sucesso`);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar estrutura de projeto:', error);
    res.status(500).json({ error: 'Erro ao deletar estrutura', code: 'DATABASE_ERROR' });
  }
});

// ==================== AZURE DEVOPS ====================

// POST /api/azure-devops/setup-project - Criar projeto completo no Azure DevOps
app.post('/api/azure-devops/setup-project', async (req, res) => {
  try {
    const {
      organization,
      pat,
      projectName,
      workItemProcess,
      teamName,
      startDate,
      criarTimeSustentacao,
      areas,
      iteracao
    } = req.body;

    // Validações
    if (!organization || !pat || !projectName || !teamName || !startDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat', 'projectName', 'teamName', 'startDate']
      });
    }

    console.log(`[AZURE] Iniciando setup do projeto ${projectName} na organização ${organization}`);

    // Criar instância do serviço
    const azureService = new AzureDevOpsService(organization, pat);

    // Configurar projeto completo
    const results = await azureService.setupCompleteProject({
      projectName,
      workItemProcess: workItemProcess || 'Scrum',
      teamName,
      startDate,
      criarTimeSustentacao: criarTimeSustentacao || false,
      areas: areas || [],
      iterationCount: iteracao || 26
    });

    console.log(`[AZURE] Projeto ${projectName} configurado com sucesso`);

    res.json({
      success: true,
      message: 'Projeto configurado com sucesso no Azure DevOps',
      data: results
    });
  } catch (error) {
    console.error('Erro ao configurar projeto no Azure DevOps:', error);
    res.status(500).json({
      error: 'Erro ao configurar projeto',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// POST /api/azure-devops/create-project - Criar apenas o projeto
app.post('/api/azure-devops/create-project', async (req, res) => {
  try {
    const { organization, pat, projectName, workItemProcess, description } = req.body;

    if (!organization || !pat || !projectName) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat', 'projectName']
      });
    }

    const azureService = new AzureDevOpsService(organization, pat);
    const project = await azureService.createOrUpdateProject(
      projectName,
      workItemProcess || 'Scrum',
      description || ''
    );

    res.json({
      success: true,
      message: 'Projeto criado/atualizado com sucesso',
      data: project
    });
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({
      error: 'Erro ao criar projeto',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// POST /api/azure-devops/create-team - Criar time
app.post('/api/azure-devops/create-team', async (req, res) => {
  try {
    const { organization, pat, projectName, teamName, description } = req.body;

    if (!organization || !pat || !projectName || !teamName) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat', 'projectName', 'teamName']
      });
    }

    const azureService = new AzureDevOpsService(organization, pat);
    const team = await azureService.createOrGetTeam(projectName, teamName, description);

    res.json({
      success: true,
      message: 'Time criado/obtido com sucesso',
      data: team
    });
  } catch (error) {
    console.error('Erro ao criar time:', error);
    res.status(500).json({
      error: 'Erro ao criar time',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// POST /api/azure-devops/create-iterations - Criar iterações
app.post('/api/azure-devops/create-iterations', async (req, res) => {
  try {
    const { organization, pat, projectName, teamName, config } = req.body;

    if (!organization || !pat || !projectName || !teamName || !config) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat', 'projectName', 'teamName', 'config']
      });
    }

    const azureService = new AzureDevOpsService(organization, pat);
    const iterations = await azureService.createIterations(projectName, teamName, config);

    res.json({
      success: true,
      message: 'Iterações criadas com sucesso',
      data: iterations
    });
  } catch (error) {
    console.error('Erro ao criar iterações:', error);
    res.status(500).json({
      error: 'Erro ao criar iterações',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// POST /api/azure-devops/integrar-projeto - Integrar projeto automaticamente
app.post('/api/azure-devops/integrar-projeto', async (req, res) => {
  try {
    const { projetoId } = req.body;

    console.log(`[AZURE INTEGRAÇÃO] Iniciando integração do projeto ${projetoId}`);

    // 1. Buscar configurações do Azure DevOps
    const [configRows] = await pool.query(
      "SELECT chave, valor FROM configuracoes WHERE chave = 'integration-config'"
    );
    
    if (configRows.length === 0) {
      return res.status(400).json({
        error: 'Configurações de integração não encontradas',
        message: 'Configure as integrações nas Configurações'
      });
    }

    const integrationConfig = JSON.parse(configRows[0].valor);
    const azureConfig = integrationConfig.azureDevOps;

    if (!azureConfig || !azureConfig.urlOrganizacao || !azureConfig.personalAccessToken) {
      return res.status(400).json({
        error: 'Configurações do Azure DevOps incompletas',
        message: 'Configure a URL da organização e o token PAT nas Configurações de Integração'
      });
    }

    // Extrair o nome da organização da URL
    const urlMatch = azureConfig.urlOrganizacao.match(/dev\.azure\.com\/([^\/]+)/);
    const organization = urlMatch ? urlMatch[1] : azureConfig.urlOrganizacao;
    const pat = azureConfig.personalAccessToken;

    console.log(`[AZURE INTEGRAÇÃO] Organização extraída: ${organization}`);

    // 2. Buscar dados do projeto
    const [projetos] = await pool.query('SELECT * FROM estruturas_projeto WHERE id = ?', [projetoId]);
    
    if (projetos.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const projeto = projetos[0];
    
    console.log(`[AZURE INTEGRAÇÃO] Projeto encontrado: ${projeto.projeto}`);
    console.log(`[AZURE INTEGRAÇÃO] Organização: ${organization}`);

    // 3. Preparar dados para integração
    const projectName = projeto.projeto;
    // Remover espaços e caracteres especiais do nome do time
    const rawTeamName = projeto.nome_time || `Time_${projeto.projeto}`;
    const teamName = rawTeamName.replace(/\s+/g, '_').replace(/-/g, '_');
    const description = `${projeto.produto} - ${projeto.projeto}`;
    const startDate = projeto.data_inicial;
    const numeroSemanas = projeto.numero_semanas || 2;
    const workItemProcess = projeto.work_item_process || 'Scrum';
    
    console.log(`[AZURE INTEGRAÇÃO] Nome do time original: "${rawTeamName}"`);
    console.log(`[AZURE INTEGRAÇÃO] Nome do time sanitizado: "${teamName}"`);

    // 4. Criar instância do serviço Azure
    const azureService = new AzureDevOpsService(organization, pat);

    console.log(`[AZURE INTEGRAÇÃO] Verificando se projeto já existe no Azure DevOps...`);
    
    // 5. Verificar se o projeto já existe
    let azureProject = await azureService.getProject(projectName);
    
    if (azureProject) {
      console.log(`[AZURE INTEGRAÇÃO] Projeto já existe: ${azureProject.id}`);
      console.log(`[AZURE INTEGRAÇÃO] Usando projeto existente`);
    } else {
      console.log(`[AZURE INTEGRAÇÃO] Projeto não existe, criando...`);
      
      // Criar projeto no Azure DevOps
      azureProject = await azureService.createProject({
        name: projectName,
        description: description,
        visibility: 'Private',
        capabilities: {
          versioncontrol: {
            sourceControlType: 'Git'
          },
          processTemplate: {
            templateTypeId: workItemProcess === 'Scrum' ? 
              '6b724908-ef14-45cf-84f8-768b5384da45' : // Scrum
              workItemProcess === 'Agile' ? 
              'adcc42ab-9882-485e-a3ed-7678f01f66bc' : // Agile
              '27450541-8e31-4150-9947-dc59f998fc01'    // Basic
          }
        }
      });

      console.log(`[AZURE INTEGRAÇÃO] Projeto criado: ${azureProject.id}`);
      
      // Aguardar projeto ficar pronto
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 6. Buscar time padrão
    const defaultTeam = await azureService.getDefaultTeam(projectName);
    console.log(`[AZURE INTEGRAÇÃO] Time padrão encontrado: ${defaultTeam.name}`);

    // 7. Renomear time padrão (se necessário)
    if (defaultTeam.name !== teamName) {
      await azureService.updateTeam(projectName, defaultTeam.id, {
        name: teamName,
        description: `Time do projeto ${projectName}`
      });
      console.log(`[AZURE INTEGRAÇÃO] Time renomeado para: ${teamName}`);
    } else {
      console.log(`[AZURE INTEGRAÇÃO] Time já tem o nome correto: ${teamName}`);
    }

    // 8. Criar área do time
    const areaPath = `${projectName}\\${teamName}`;
    await azureService.createArea(projectName, teamName);
    console.log(`[AZURE INTEGRAÇÃO] Área criada: ${areaPath}`);

    // 9. Eliminar iterações default e criar novas
    await azureService.deleteDefaultIterations(projectName);
    
    // Criar iteração raiz do time
    const iterationRoot = await azureService.createIteration(projectName, teamName, null);
    console.log(`[AZURE INTEGRAÇÃO] Iteração raiz criada: ${teamName}`);

    // Calcular datas das iterações
    const iterations = [];
    let currentStartDate = new Date(startDate);
    
    for (let i = 1; i <= numeroSemanas; i++) {
      const endDate = new Date(currentStartDate);
      endDate.setDate(endDate.getDate() + (7 * numeroSemanas - 2));
      
      const iteration = await azureService.createIteration(
        projectName,
        `Sprint ${i}`,
        teamName, // Usar o nome da iteração pai, não o ID
        {
          startDate: currentStartDate.toISOString(),
          finishDate: endDate.toISOString()
        }
      );
      
      iterations.push(iteration);
      console.log(`[AZURE INTEGRAÇÃO] Iteração criada: Sprint ${i} (${currentStartDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]})`);
      
      // Próxima iteração começa 3 dias após o fim da anterior
      if (i < numeroSemanas) {
        currentStartDate = new Date(endDate);
        currentStartDate.setDate(currentStartDate.getDate() + 3);
      }
    }

    // 10. Configurar time (área e iterações)
    // Path de iteração: apenas \NomeDoTime (sem nome do projeto)
    const iterationPath = `\\${teamName}`;
    
    // Preparar array de iterações para adicionar ao time
    const teamIterations = [
      { path: iterationPath } // Iteração raiz: \Time_TESTE001
    ];
    
    // Adicionar sprints: \Time_TESTE001\Sprint 1, etc.
    for (let i = 1; i <= numeroSemanas; i++) {
      teamIterations.push({ path: `${iterationPath}\\Sprint ${i}` });
    }
    
    console.log(`[AZURE INTEGRAÇÃO] Configurando time com:`);
    console.log(`[AZURE INTEGRAÇÃO]   - Default Area: ${areaPath}`);
    console.log(`[AZURE INTEGRAÇÃO]   - Iteration Path: ${iterationPath}`);
    console.log(`[AZURE INTEGRAÇÃO]   - Iterações: ${teamIterations.length} (incluindo raiz)`);
    teamIterations.forEach((iter, idx) => {
      console.log(`[AZURE INTEGRAÇÃO]     ${idx + 1}. ${iter.path}`);
    });
    
    await azureService.configureTeam(projectName, defaultTeam.id, teamName, {
      defaultArea: areaPath,
      iterations: teamIterations
    });
    
    console.log(`[AZURE INTEGRAÇÃO] Time configurado com área e iterações`);

    // 11. Configurar Board - Colunas
    try {
      console.log(`[AZURE INTEGRAÇÃO] Step 11: Chamando configureBoardColumns...`);
      await azureService.configureBoardColumns(projectName, teamName);
      console.log(`[AZURE INTEGRAÇÃO] Step 11: ✅ Colunas configuradas com sucesso`);
    } catch (error) {
      console.error(`[AZURE INTEGRAÇÃO] Step 11: ❌ Erro ao configurar colunas:`, error.message);
      console.error(`[AZURE INTEGRAÇÃO] Step 11: Stack:`, error.stack);
    }

    // 12. Configurar Board - Swimlanes
    try {
      console.log(`[AZURE INTEGRAÇÃO] Step 12: Chamando configureBoardSwimlanes...`);
      await azureService.configureBoardSwimlanes(projectName, teamName);
      console.log(`[AZURE INTEGRAÇÃO] Step 12: ✅ Swimlanes configuradas com sucesso`);
    } catch (error) {
      console.error(`[AZURE INTEGRAÇÃO] Step 12: ❌ Erro ao configurar swimlanes:`, error.message);
      console.error(`[AZURE INTEGRAÇÃO] Step 12: Stack:`, error.stack);
    }

    // 13. Configurar Board - Card Styles (Prioridades e Tags)
    try {
      console.log(`[AZURE INTEGRAÇÃO] Step 13: Chamando configureBoardCardStyles...`);
      await azureService.configureBoardCardStyles(projectName, teamName);
      console.log(`[AZURE INTEGRAÇÃO] Step 13: ✅ Card Styles configurados com sucesso`);
    } catch (error) {
      console.error(`[AZURE INTEGRAÇÃO] Step 13: ❌ Erro ao configurar card styles:`, error.message);
      console.error(`[AZURE INTEGRAÇÃO] Step 13: Stack:`, error.stack);
    }

    // 14. Verificar se projeto tem SPEC-KIT associado e criar PBIs
    let pbisCreated = 0;
    let tasksCreated = 0;
    
    // Helper para truncar títulos longos (máximo 255 caracteres)
    const truncateTitle = (title, maxLength = 255) => {
      if (title.length <= maxLength) return title;
      return title.substring(0, 253) + '...';
    };
    
    try {
      console.log(`[AZURE INTEGRAÇÃO] Step 14: Verificando projeto SPEC-KIT associado...`);
      console.log(`[AZURE INTEGRAÇÃO] Step 14: Buscando por aplicacao_id='${projeto.aplicacao_base_id}' e nome_projeto='${projeto.projeto}'`);
      
      // Buscar projeto SDD pelo aplicacao_id e nome_projeto
      const [projetosSDDRows] = await pool.query(
        `SELECT * FROM projetos_sdd 
         WHERE aplicacao_id = ? 
         AND nome_projeto = ? 
         AND gerador_projetos = 1
         LIMIT 1`,
        [projeto.aplicacao_base_id, projeto.projeto]
      );
      
      console.log(`[AZURE INTEGRAÇÃO] Step 14: Projetos SPEC-KIT encontrados: ${projetosSDDRows.length}`);
      
      if (projetosSDDRows.length > 0) {
        const projetoSDD = projetosSDDRows[0];
        console.log(`[AZURE INTEGRAÇÃO] Projeto SPEC-KIT encontrado: ID=${projetoSDD.id}, Nome='${projetoSDD.nome_projeto}'`);
        
        // Primeiro, buscar TODOS os requisitos para debug
        const [todosRequisitosRows] = await pool.query(
          `SELECT * FROM requisitos_sdd WHERE projeto_id = ? ORDER BY sequencia`,
          [projetoSDD.id]
        );
        console.log(`[AZURE INTEGRAÇÃO] Total de requisitos no projeto: ${todosRequisitosRows.length}`);
        
        if (todosRequisitosRows.length > 0) {
          console.log(`[AZURE INTEGRAÇÃO] Status dos requisitos:`);
          todosRequisitosRows.forEach(req => {
            console.log(`[AZURE INTEGRAÇÃO]   - ${req.sequencia}: ${req.nome} (Status: ${req.status})`);
          });
        }
        
        // Buscar APENAS requisitos com status = 'PRONTO P/DEV'
        const [requisitosRows] = await pool.query(
          `SELECT * FROM requisitos_sdd 
           WHERE projeto_id = ? 
           AND status = 'PRONTO P/DEV'
           ORDER BY sequencia`,
          [projetoSDD.id]
        );
        
        console.log(`[AZURE INTEGRAÇÃO] Requisitos com status 'PRONTO P/DEV' encontrados: ${requisitosRows.length}`);
        
        for (const requisito of requisitosRows) {
          try {
            console.log(`[AZURE INTEGRAÇÃO] ========================================`);
            console.log(`[AZURE INTEGRAÇÃO] Processando Requisito: ${requisito.sequencia} - ${requisito.nome}`);
            console.log(`[AZURE INTEGRAÇÃO] Status: ${requisito.status}`);
            console.log(`[AZURE INTEGRAÇÃO] Descrição: ${requisito.descricao ? requisito.descricao.substring(0, 50) + '...' : 'Sem descrição'}`);
            
            // Criar PBI (Product Backlog Item)
            // REGRA: Title = "SEQUENCIA - NOME" | Description = descricao
            const pbiTitle = truncateTitle(`${requisito.sequencia} - ${requisito.nome}`);
            
            const pbiData = {
              title: pbiTitle,
              description: requisito.descricao || '',
              state: 'New', // Status 'PRONTO P/DEV' mapeado para 'New'
              areaPath: areaPath,
              iterationPath: `${projectName}${iterationPath}\\Sprint 1`,
              priority: 2,
              tags: 'PRONTO P/DEV'
            };
            
            console.log(`[AZURE INTEGRAÇÃO] Dados do PBI a ser criado:`, JSON.stringify(pbiData, null, 2));
            console.log(`[AZURE INTEGRAÇÃO] Chamando azureService.createWorkItem...`);
            
            const pbi = await azureService.createWorkItem(projectName, 'Product Backlog Item', pbiData);
            pbisCreated++;
            console.log(`[AZURE INTEGRAÇÃO] ✅ PBI criado com sucesso: ID=${pbi.id}, Title='${pbiTitle}'`);
            
            // Buscar todas as tarefas para debug
            const [todasTarefasRows] = await pool.query(
              `SELECT * FROM tarefas_sdd 
               WHERE requisito_id = ? 
               ORDER BY data_inicio`,
              [requisito.id]
            );
            
            console.log(`[AZURE INTEGRAÇÃO] Total de tarefas no requisito: ${todasTarefasRows.length}`);
            if (todasTarefasRows.length > 0) {
              console.log(`[AZURE INTEGRAÇÃO] Status das tarefas:`);
              todasTarefasRows.forEach((t, idx) => {
                console.log(`[AZURE INTEGRAÇÃO]   ${idx + 1}. ${t.descricao.substring(0, 40)}... (Status: ${t.status}, Data: ${t.data_inicio})`);
              });
            }
            
            // Buscar APENAS tarefas com status = 'TO DO', ordenadas por data_inicio
            const [tarefasRows] = await pool.query(
              `SELECT * FROM tarefas_sdd 
               WHERE requisito_id = ? 
               AND status = 'TO DO'
               ORDER BY data_inicio`,
              [requisito.id]
            );
            
            console.log(`[AZURE INTEGRAÇÃO] Tarefas com status 'TO DO' encontradas: ${tarefasRows.length}`);
            
            // Criar tasks associadas ao PBI
            for (let taskIndex = 0; taskIndex < tarefasRows.length; taskIndex++) {
              const tarefa = tarefasRows[taskIndex];
              const taskSequencia = taskIndex + 1; // Sequência ordenada pela data de início
              
              try {
                console.log(`[AZURE INTEGRAÇÃO]   Criando Task ${taskSequencia} de ${tarefasRows.length}...`);
                
                // REGRA: Title = "SEQUENCIA_REQUISITO - SEQUENCIA_ORDENADA : DESCRICAO"
                // Description = descricao da tarefa
                const taskTitle = truncateTitle(`${requisito.sequencia} - ${taskSequencia} : ${tarefa.descricao}`);
                
                const taskData = {
                  title: taskTitle,
                  description: tarefa.descricao || '',
                  state: 'To Do', // Status 'TO DO' mapeado para 'To Do'
                  areaPath: areaPath,
                  iterationPath: `${projectName}${iterationPath}\\Sprint 1`,
                  parentId: pbi.id // Associar ao PBI
                };
                
                console.log(`[AZURE INTEGRAÇÃO]   Dados da Task:`, JSON.stringify(taskData, null, 2));
                
                const task = await azureService.createWorkItem(projectName, 'Task', taskData);
                tasksCreated++;
                console.log(`[AZURE INTEGRAÇÃO]   ✅ Task criada com sucesso: ID=${task.id}, Title='${taskTitle}'`);
              } catch (taskError) {
                console.error(`[AZURE INTEGRAÇÃO]   ❌ Erro ao criar task ${requisito.sequencia}.${taskSequencia}:`, taskError.message);
                console.error(`[AZURE INTEGRAÇÃO]   Stack:`, taskError.stack);
              }
            }
            
          } catch (pbiError) {
            console.error(`[AZURE INTEGRAÇÃO] ❌ Erro ao criar PBI para requisito ${requisito.sequencia}:`, pbiError.message);
            console.error(`[AZURE INTEGRAÇÃO] Stack:`, pbiError.stack);
          }
        }
        
        console.log(`[AZURE INTEGRAÇÃO] ========================================`);
        console.log(`[AZURE INTEGRAÇÃO] ✅ Criados ${pbisCreated} PBIs e ${tasksCreated} Tasks do SPEC-KIT`);
      } else {
        console.log(`[AZURE INTEGRAÇÃO] ⚠️ Nenhum projeto SPEC-KIT associado encontrado`);
        console.log(`[AZURE INTEGRAÇÃO] Verifique se:`);
        console.log(`[AZURE INTEGRAÇÃO]   1. O projeto SPEC-KIT existe`);
        console.log(`[AZURE INTEGRAÇÃO]   2. O aplicacao_id='${projeto.aplicacao_base_id}' está correto`);
        console.log(`[AZURE INTEGRAÇÃO]   3. O nome_projeto='${projeto.projeto}' está correto`);
        console.log(`[AZURE INTEGRAÇÃO]   4. O campo gerador_projetos=1 está ativado`);
      }
    } catch (sddError) {
      console.error(`[AZURE INTEGRAÇÃO] ❌ Erro crítico ao processar SPEC-KIT:`, sddError.message);
      console.error(`[AZURE INTEGRAÇÃO] Stack completo:`, sddError.stack);
      // Não interromper a integração por erro no SPEC-KIT
    }

    // 15. Gerar URL do projeto
    const projectUrl = `https://dev.azure.com/${organization}/${projectName}`;

    console.log(`[AZURE INTEGRAÇÃO] Integração concluída com sucesso!`);
    console.log(`[AZURE INTEGRAÇÃO] URL: ${projectUrl}`);

    res.json({
      success: true,
      message: 'Projeto integrado com sucesso ao Azure DevOps',
      projectUrl,
      projectId: azureProject.id,
      teamId: defaultTeam.id,
      iterations: iterations.length,
      pbisCreated,
      tasksCreated
    });

  } catch (error) {
    console.error('[AZURE INTEGRAÇÃO] Erro:', error);
    res.status(500).json({
      error: 'Erro ao integrar projeto',
      message: error.message,
      code: 'AZURE_INTEGRATION_ERROR'
    });
  }
});

// POST /api/azure-devops/criar-repositorios - Criar repositórios com estrutura completa
app.post('/api/azure-devops/criar-repositorios', async (req, res) => {
  try {
    const { projetoId } = req.body;

    console.log(`[CRIAR REPOSITÓRIOS] Iniciando criação de repositórios para projeto ${projetoId}`);

    // 1. Buscar configurações do Azure DevOps usando helper
    const { organization, pat } = await getAzureDevOpsConfig();

    // 2. Buscar dados do projeto
    const [projetos] = await pool.query('SELECT * FROM estruturas_projeto WHERE id = ?', [projetoId]);
    
    if (projetos.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const projeto = projetos[0];
    const projectName = projeto.projeto;

    console.log(`[CRIAR REPOSITÓRIOS] Projeto: ${projectName}`);

    // 3. Buscar templates salvos
    const [templates] = await pool.query(
      'SELECT template_type, template_content, file_name FROM azure_devops_templates ORDER BY template_type'
    );

    if (templates.length === 0) {
      return res.status(400).json({
        error: 'Templates não encontrados',
        message: 'Configure os templates de Azure DevOps nas Configurações'
      });
    }

    console.log(`[CRIAR REPOSITÓRIOS] Templates encontrados: ${templates.length}`);

    // Organizar templates por tipo
    const templatesMap = {};
    templates.forEach(t => {
      // Converter BLOB para string se necessário
      let content = t.template_content;
      if (Buffer.isBuffer(content)) {
        console.log(`[CRIAR REPOSITÓRIOS] Convertendo Buffer para string: ${t.template_type}`);
        content = content.toString('utf-8');
      }
      console.log(`[CRIAR REPOSITÓRIOS] Template ${t.template_type} - tipo: ${typeof content}, tamanho: ${content?.length || 0}`);
      templatesMap[t.template_type] = content;
    });

    // 4. Criar instância do serviço Azure
    const azureService = new AzureDevOpsService(organization, pat);

    // 5. Buscar repositórios do projeto
    let repositorios = projeto.repositorios;
    
    // Se vier como string, fazer parse; se já for objeto/array, usar direto
    if (typeof repositorios === 'string') {
      repositorios = JSON.parse(repositorios);
    } else if (!repositorios) {
      repositorios = [];
    }
    
    console.log(`[CRIAR REPOSITÓRIOS] Repositórios a criar: ${repositorios.length}`);

    const repositoriosCriados = [];
    const erros = [];

    // 6. Criar cada repositório
    for (const repo of repositorios) {
      try {
        // Gerar nome do repositório: Grupo-Tipo-Linguagem em minúsculas
        const repoName = `${repo.produto}-${repo.categoria}-${repo.tecnologia}`.toLowerCase();
        console.log(`[CRIAR REPOSITÓRIOS] Criando repositório: ${repoName}`);

        let repository;
        let isNewRepository = false;
        
        try {
          // Tentar criar repositório
          repository = await azureService.createRepository(projectName, {
            name: repoName
          });
          console.log(`[CRIAR REPOSITÓRIOS] Repositório criado: ${repository.id}`);
          isNewRepository = true;
        } catch (createError) {
          // Se já existe, buscar o repositório existente
          if (createError.message.includes('already exists') || createError.message.includes('409')) {
            console.log(`[CRIAR REPOSITÓRIOS] Repositório ${repoName} já existe, verificando se já foi inicializado...`);
            const repos = await azureService.getProjectRepositories(projectName);
            repository = repos.find(r => r.name === repoName);
            
            if (!repository) {
              throw new Error(`Repositório ${repoName} não encontrado após erro de duplicação`);
            }
            console.log(`[CRIAR REPOSITÓRIOS] Repositório existente encontrado: ${repository.id}`);
            
            // Verificar se já tem commits (estrutura inicializada)
            try {
              const refsUrl = `/${projectName}/_apis/git/repositories/${repository.id}/refs?filter=heads/main&api-version=7.1`;
              const refsResponse = await fetch(`https://dev.azure.com/horaciovasconcellos${refsUrl}`, {
                headers: {
                  'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
                  'Content-Type': 'application/json'
                }
              });
              const refs = await refsResponse.json();
              
              if (refs.value && refs.value.length > 0) {
                console.log(`[CRIAR REPOSITÓRIOS] Repositório ${repoName} já foi inicializado anteriormente. Pulando...`);
                repositoriosCriados.push({
                  nome: repoName,
                  id: repository.id,
                  url: repository.webUrl,
                  status: 'já existente'
                });
                continue; // Pular para o próximo repositório
              }
            } catch (refError) {
              console.log(`[CRIAR REPOSITÓRIOS] Não foi possível verificar refs, prosseguindo com inicialização...`);
            }
          } else {
            throw createError;
          }
        }

        // Criar estrutura inicial no repositório (apenas se for novo ou vazio)
        if (isNewRepository || repository) {
          await azureService.initializeRepository(
            projectName,
            repository.id,
            repoName,
            templatesMap
          );

          console.log(`[CRIAR REPOSITÓRIOS] Estrutura inicial criada para ${repoName}`);

          // Configurar branch policies
          await azureService.configureBranchPolicies(
            projectName,
            repository.id
          );

          console.log(`[CRIAR REPOSITÓRIOS] Branch policies configuradas para ${repoName}`);

          // Configurar repository policies
          await azureService.configureRepositoryPolicies(
            projectName,
            repository.id
          );

          console.log(`[CRIAR REPOSITÓRIOS] Repository policies configuradas para ${repoName}`);

          // Configurar permissões de segurança do repositório (não crítico)
          try {
            const permResult = await azureService.configureRepositoryPermissions(
              projeto.project_id,
              repository.id,
              projectName
            );

            if (permResult.success) {
              console.log(`[CRIAR REPOSITÓRIOS] ✅ Permissões de segurança configuradas para ${repoName}`);
            } else {
              console.warn(`[CRIAR REPOSITÓRIOS] ⚠️  Permissões não configuradas para ${repoName}: ${permResult.message || permResult.error}`);
            }
          } catch (permError) {
            console.warn(`[CRIAR REPOSITÓRIOS] ⚠️  Erro ao configurar permissões para ${repoName}:`, permError.message);
            console.warn(`[CRIAR REPOSITÓRIOS] ⚠️  Repositório criado com sucesso, mas configure permissões manualmente`);
          }
        }

        repositoriosCriados.push({
          nome: repoName,
          id: repository.id,
          url: repository.webUrl
        });

      } catch (error) {
        console.error(`[CRIAR REPOSITÓRIOS] Erro ao criar ${repo.produto}-${repo.categoria}-${repo.tecnologia}:`, error);
        erros.push({
          nome: `${repo.produto}-${repo.categoria}-${repo.tecnologia}`.toLowerCase(),
          erro: error.message
        });
      }
    }

    console.log(`[CRIAR REPOSITÓRIOS] Concluído. Criados: ${repositoriosCriados.length}, Erros: ${erros.length}`);

    // 7. Atualizar status_repositorio no banco de dados
    if (repositoriosCriados.length > 0) {
      try {
        await pool.query(
          'UPDATE estruturas_projeto SET status_repositorio = ? WHERE id = ?',
          ['Y', projetoId]
        );
        console.log(`[CRIAR REPOSITÓRIOS] Status do repositório atualizado para 'Y' no projeto ${projetoId}`);
      } catch (updateError) {
        console.error('[CRIAR REPOSITÓRIOS] Erro ao atualizar status_repositorio:', updateError);
        // Não falhar a operação se não conseguir atualizar o status
      }
    }

    // 8. Excluir o repositório default criado pelo Azure DevOps (geralmente tem o nome do projeto)
    // IMPORTANTE: Só excluir se houver outros repositórios criados
    if (repositoriosCriados.length > 0) {
      try {
        console.log(`[CRIAR REPOSITÓRIOS] Verificando repositório default...`);
        const allRepos = await azureService.getProjectRepositories(projectName);
        const defaultRepo = allRepos.find(r => r.name === projectName);
        
        if (defaultRepo && allRepos.length > 1) { // Só excluir se houver mais de um repositório
          console.log(`[CRIAR REPOSITÓRIOS] Repositório default encontrado: ${defaultRepo.name} (${defaultRepo.id})`);
          console.log(`[CRIAR REPOSITÓRIOS] Excluindo repositório default...`);
          await azureService.deleteRepository(projectName, defaultRepo.id);
          console.log(`[CRIAR REPOSITÓRIOS] Repositório default excluído com sucesso`);
        } else if (defaultRepo) {
          console.log(`[CRIAR REPOSITÓRIOS] Repositório default encontrado, mas é o único repositório. Mantendo...`);
        } else {
          console.log(`[CRIAR REPOSITÓRIOS] Nenhum repositório default encontrado`);
        }
      } catch (deleteError) {
        console.error(`[CRIAR REPOSITÓRIOS] Erro ao excluir repositório default:`, deleteError);
        // Não falhar a operação se não conseguir deletar o default
      }
    }

    res.json({
      success: true,
      message: 'Repositórios criados com sucesso',
      repositoriosCriados,
      erros,
      total: repositorios.length,
      sucesso: repositoriosCriados.length
    });

  } catch (error) {
    console.error('[CRIAR REPOSITÓRIOS] Erro:', error);
    const errorResponse = handleAzureError(error);
    res.status(errorResponse.status).json(errorResponse);
  }
});

// GET /api/azure-devops/consultar-projeto/:projectName/:teamName - Consultar configuração do projeto
app.get('/api/azure-devops/consultar-projeto/:projectName/:teamName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const teamName = decodeURIComponent(req.params.teamName);

    console.log(`[CONSULTAR PROJETO] Projeto: ${projectName}, Time: ${teamName}`);

    // Buscar configuração
    const [rows] = await pool.execute(
      "SELECT valor FROM configuracoes WHERE chave = 'integration-config' LIMIT 1"
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuração do Azure DevOps não encontrada' });
    }

    const config = JSON.parse(rows[0].valor);
    const orgUrl = config.azureDevOps.urlOrganizacao;
    const pat = config.azureDevOps.personalAccessToken;
    const organization = orgUrl.match(/dev\.azure\.com\/([^\/]+)/)[1];

    const azureService = new AzureDevOpsService(orgUrl, pat);

    // Buscar team settings - URL encode do team name
    const encodedTeamName = encodeURIComponent(teamName);
    console.log(`[CONSULTAR PROJETO] Team name encoded: ${encodedTeamName}`);
    
    const teamSettings = await azureService.request(
      'GET',
      `/${projectName}/${encodedTeamName}/_apis/work/teamsettings?api-version=7.1`
    );

    // Buscar iterações do time
    const teamIterations = await azureService.request(
      'GET',
      `/${projectName}/${encodedTeamName}/_apis/work/teamsettings/iterations?api-version=7.1`
    );

    console.log(`[CONSULTAR PROJETO] ========================================`);
    console.log(`[CONSULTAR PROJETO] TEAM SETTINGS ATUAL:`);
    console.log(`[CONSULTAR PROJETO]   Default Area: ${teamSettings.defaultAreaPath || 'N/A'}`);
    console.log(`[CONSULTAR PROJETO]   Default Iteration: ${teamSettings.defaultIteration?.name || teamSettings.defaultIterationMacro || 'N/A'}`);
    console.log(`[CONSULTAR PROJETO]   Backlog Iteration: ${teamSettings.backlogIteration?.name || 'N/A'}`);
    console.log(`[CONSULTAR PROJETO] ========================================`);

    res.json({
      success: true,
      projectName,
      teamName,
      organization,
      summary: {
        defaultArea: teamSettings.defaultAreaPath,
        defaultIteration: teamSettings.defaultIteration,
        defaultIterationMacro: teamSettings.defaultIterationMacro,
        backlogIteration: teamSettings.backlogIteration
      },
      teamSettings,
      teamIterations
    });

  } catch (error) {
    console.error('[CONSULTAR PROJETO] Erro:', error);
    res.status(500).json({
      error: 'Erro ao consultar projeto',
      message: error.message
    });
  }
});

// POST /api/azure-devops/configure-board - Configurar board do time
app.post('/api/azure-devops/configure-board', async (req, res) => {
  try {
    const { organization, pat, projectName, teamName } = req.body;

    if (!organization || !pat || !projectName || !teamName) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat', 'projectName', 'teamName']
      });
    }

    const azureService = new AzureDevOpsService(organization, pat);
    const boardConfig = await azureService.configureTeamBoard(projectName, teamName);

    res.json({
      success: true,
      message: 'Board configurado com sucesso',
      data: boardConfig
    });
  } catch (error) {
    console.error('Erro ao configurar board:', error);
    res.status(500).json({
      error: 'Erro ao configurar board',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// GET /api/azure-devops/project/:projectName - Obter informações do projeto
app.get('/api/azure-devops/project/:projectName', async (req, res) => {
  try {
    const { organization, pat } = req.query;
    const { projectName } = req.params;

    if (!organization || !pat) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios faltando',
        required: ['organization', 'pat']
      });
    }

    const azureService = new AzureDevOpsService(organization, pat);
    const project = await azureService.getProject(projectName);

    if (!project) {
      return res.status(404).json({
        error: 'Projeto não encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({
      error: 'Erro ao buscar projeto',
      message: error.message,
      code: 'AZURE_DEVOPS_ERROR'
    });
  }
});

// POST /api/azure-devops/templates - Upload de templates YAML
app.post('/api/azure-devops/templates', uploadYaml.single('file'), async (req, res) => {
  let connection;
  try {
    const { templateType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        code: 'NO_FILE'
      });
    }

    if (!templateType) {
      return res.status(400).json({
        error: 'Tipo de template não fornecido',
        code: 'NO_TEMPLATE_TYPE'
      });
    }

    const validTypes = ['pullRequest', 'hotfix', 'main', 'develop'];
    if (!validTypes.includes(templateType)) {
      return res.status(400).json({
        error: 'Tipo de template inválido',
        validTypes,
        code: 'INVALID_TEMPLATE_TYPE'
      });
    }

    // Converter o buffer para string
    const templateContent = file.buffer.toString('utf-8');

    // Validação básica do conteúdo
    if (!templateContent.trim()) {
      return res.status(400).json({
        error: 'Arquivo está vazio',
        code: 'EMPTY_FILE'
      });
    }

    connection = await pool.getConnection();

    // Verificar se já existe um template deste tipo
    const [existing] = await connection.execute(
      'SELECT id FROM azure_devops_templates WHERE template_type = ?',
      [templateType]
    );

    if (existing.length > 0) {
      // Atualizar template existente
      await connection.execute(
        `UPDATE azure_devops_templates 
         SET template_content = ?, 
             file_name = ?, 
             updated_at = NOW() 
         WHERE template_type = ?`,
        [templateContent, file.originalname, templateType]
      );

      console.log(`[API] Template ${templateType} atualizado - ${file.originalname}`);
    } else {
      // Inserir novo template
      await connection.execute(
        `INSERT INTO azure_devops_templates 
         (id, template_type, template_content, file_name, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [uuidv4(), templateType, templateContent, file.originalname]
      );

      console.log(`[API] Template ${templateType} criado - ${file.originalname}`);
    }

    res.json({
      success: true,
      message: 'Template salvo com sucesso',
      data: {
        templateType,
        fileName: file.originalname,
        size: file.size
      }
    });
  } catch (error) {
    console.error('Erro ao salvar template:', error);
    res.status(500).json({
      error: 'Erro ao salvar template',
      message: error.message,
      code: 'TEMPLATE_SAVE_ERROR'
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/azure-devops/templates - Listar todos os templates
app.get('/api/azure-devops/templates', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [templates] = await connection.execute(
      `SELECT id, template_type, file_name, 
              CHAR_LENGTH(template_content) as content_size,
              created_at, updated_at 
       FROM azure_devops_templates 
       ORDER BY template_type`
    );

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({
      error: 'Erro ao buscar templates',
      message: error.message,
      code: 'TEMPLATE_FETCH_ERROR'
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/azure-devops/templates/:templateType - Buscar template específico
app.get('/api/azure-devops/templates/:templateType', async (req, res) => {
  let connection;
  try {
    const { templateType } = req.params;

    const validTypes = ['pullRequest', 'hotfix', 'main', 'develop'];
    if (!validTypes.includes(templateType)) {
      return res.status(400).json({
        error: 'Tipo de template inválido',
        validTypes,
        code: 'INVALID_TEMPLATE_TYPE'
      });
    }

    connection = await pool.getConnection();

    const [templates] = await connection.execute(
      `SELECT id, template_type, template_content, file_name, 
              created_at, updated_at 
       FROM azure_devops_templates 
       WHERE template_type = ?`,
      [templateType]
    );

    if (templates.length === 0) {
      return res.status(404).json({
        error: 'Template não encontrado',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    const template = templates[0];
    
    // Converter BLOB para string se necessário
    if (Buffer.isBuffer(template.template_content)) {
      template.template_content = template.template_content.toString('utf-8');
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    res.status(500).json({
      error: 'Erro ao buscar template',
      message: error.message,
      code: 'TEMPLATE_FETCH_ERROR'
    });
  } finally {
    if (connection) connection.release();
  }
});

// ========================================================================
// SINCRONIZAÇÃO LEGADA - Azure DevOps
// ========================================================================

// GET /api/azure/sincronizacao-legada - Listar todas as sincronizações
app.get('/api/azure/sincronizacao-legada', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [sincronizacoes] = await connection.execute(`
      SELECT 
        sl.id,
        sl.aplicacao_id,
        sl.url_projeto,
        sl.projeto_nome,
        sl.repositorio_nome,
        sl.status,
        sl.mensagem_erro,
        sl.created_at,
        sl.updated_at,
        a.sigla AS aplicacao_sigla,
        a.descricao AS aplicacao_nome
      FROM sincronizacao_legada sl
      LEFT JOIN aplicacoes a ON a.id = sl.aplicacao_id
      ORDER BY sl.created_at DESC
    `);

    res.json(sincronizacoes);
  } catch (error) {
    console.error('Erro ao buscar sincronizações:', error);
    res.status(500).json({
      error: 'Erro ao buscar sincronizações',
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Schema de validação para sincronização legada
const sincronizarLegadoSchema = Joi.object({
  aplicacao_id: Joi.string().required()
    .messages({
      'any.required': 'aplicacao_id é obrigatório',
      'string.empty': 'aplicacao_id não pode ser vazio'
    }),
  url_projeto: Joi.string().pattern(/^https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/?$/).required()
    .messages({
      'any.required': 'url_projeto é obrigatório',
      'string.empty': 'url_projeto não pode ser vazio',
      'string.pattern.base': 'Formato esperado: https://dev.azure.com/{org}/{project}/_git/{repository}'
    })
});

// POST /api/azure/sincronizar-legado - Sincronizar aplicação legada
app.post('/api/azure/sincronizar-legado', async (req, res) => {
  let connection;
  try {
    // Validar entrada com Joi
    const { error, value } = sincronizarLegadoSchema.validate(req.body);
    if (error) {
      logger.warn('Validation failed for sincronizar-legado', { 
        errors: error.details,
        body: req.body 
      });
      return res.status(400).json({
        error: 'Validação falhou',
        message: error.details[0].message,
        details: error.details
      });
    }

    const { aplicacao_id, url_projeto } = value;

    logger.info('Starting legacy sync', { aplicacao_id, url_projeto });

    // Extrair dados da URL
    const urlPattern = /^https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)\/?$/;
    const match = url_projeto.match(urlPattern);
    const [org, projectName, repoName] = match.slice(1);

    // Buscar configurações do Azure DevOps usando helper
    const { pat } = await getAzureDevOpsConfig();

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Buscar dados da aplicação
    const [aplicacoes] = await connection.execute(
      'SELECT id, sigla, descricao FROM aplicacoes WHERE id = ?',
      [aplicacao_id]
    );

    if (aplicacoes.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Aplicação não encontrada',
        message: `Aplicação com ID ${aplicacao_id} não foi encontrada`
      });
    }

    const aplicacao = aplicacoes[0];

    try {
      // Buscar informações do projeto no Azure DevOps
      // Usar organização extraída da URL
      const azureService = new AzureDevOpsService(org, pat);
      const projectInfo = await azureService.getProjectByName(projectName);

      if (!projectInfo) {
        throw new Error('Projeto não encontrado no Azure DevOps');
      }

      // Gerar ID único
      const estruturaId = ulid();

      // Criar registro na tabela estruturas_projeto
      await connection.execute(`
        INSERT INTO estruturas_projeto (
          id, produto, projeto, work_item_process,
          data_inicial, iteracao, incluir_query, incluir_maven,
          incluir_liquibase, criar_time_sustentacao, repositorios,
          url_projeto, status, aplicacao_base_id, status_repositorio,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, CURDATE(), 1, 1, 0, 0, 0, '[]', ?, 'Processado', ?, 'N', NOW(), NOW())
      `, [
        estruturaId,
        aplicacao.sigla,
        projectName,
        projectInfo.capabilities?.processTemplate?.templateName || 'Agile',
        url_projeto,
        aplicacao_id
      ]);

      // Criar registro de sincronização
      const sincId = ulid();
      await connection.execute(`
        INSERT INTO sincronizacao_legada (
          id, aplicacao_id, url_projeto, projeto_nome, repositorio_nome,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'Sincronizado', NOW(), NOW())
      `, [sincId, aplicacao_id, url_projeto, projectName, repoName]);

      await connection.commit();

      logger.info('Legacy sync completed successfully', {
        estruturaId,
        aplicacao_id,
        projectName,
        repoName
      });

      res.json({
        success: true,
        message: 'Sincronização realizada com sucesso',
        data: {
          id: sincId,
          estrutura_id: estruturaId,
          projeto: projectName,
          repositorio: repoName,
          aplicacao: aplicacao.sigla
        }
      });

    } catch (azureError) {
      await connection.rollback();
      
      logger.error('Azure sync failed, recording error', { 
        aplicacao_id, 
        url_projeto, 
        error: azureError.message 
      });
      
      // Registrar erro na tabela de sincronização
      const errorId = ulid();
      await connection.execute(`
        INSERT INTO sincronizacao_legada (
          id, aplicacao_id, url_projeto, status, mensagem_erro,
          created_at, updated_at
        ) VALUES (?, ?, ?, 'Erro', ?, NOW(), NOW())
      `, [errorId, aplicacao_id, url_projeto, azureError.message]);

      throw azureError;
    }

  } catch (error) {
    logger.error('Failed to sync legacy application', { 
      error: error.message, 
      stack: error.stack 
    });
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        logger.error('Rollback failed', { error: rollbackError.message });
      }
    }
    const errorResponse = handleAzureError(error);
    res.status(errorResponse.status).json(errorResponse);
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/azure/sincronizacao-legada/:id - Excluir sincronização
app.delete('/api/azure/sincronizacao-legada/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar se existe
    const [sincronizacoes] = await connection.execute(
      'SELECT id FROM sincronizacao_legada WHERE id = ?',
      [id]
    );

    if (sincronizacoes.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: 'Sincronização não encontrada'
      });
    }

    // Excluir
    await connection.execute('DELETE FROM sincronizacao_legada WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Sincronização excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir sincronização:', error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Erro ao fazer rollback:', rollbackError);
      }
    }
    res.status(500).json({
      error: 'Erro ao excluir sincronização',
      message: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// DELETE /api/azure-devops/templates/:templateType - Deletar template
app.delete('/api/azure-devops/templates/:templateType', async (req, res) => {
  let connection;
  try {
    const { templateType } = req.params;

    const validTypes = ['pullRequest', 'hotfix', 'main', 'develop'];
    if (!validTypes.includes(templateType)) {
      return res.status(400).json({
        error: 'Tipo de template inválido',
        validTypes,
        code: 'INVALID_TEMPLATE_TYPE'
      });
    }

    connection = await pool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM azure_devops_templates WHERE template_type = ?',
      [templateType]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Template não encontrado',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    console.log(`[API] Template ${templateType} deletado`);

    res.json({
      success: true,
      message: 'Template deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar template:', error);
    res.status(500).json({
      error: 'Erro ao deletar template',
      message: error.message,
      code: 'TEMPLATE_DELETE_ERROR'
    });
  } finally {
    if (connection) connection.release();
  }
});

// ==================== CONFIGURAÇÕES ====================

// GET /api/configuracoes - Buscar configurações do sistema
app.get('/api/configuracoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT chave, valor FROM configuracoes');
    
    // Transformar array de {chave, valor} em objeto {chave: valor}
    const config = {};
    rows.forEach(row => {
      try {
        // Tentar fazer parse de JSON para valores complexos
        config[row.chave] = JSON.parse(row.valor);
      } catch {
        // Se não for JSON válido, usar o valor como string
        config[row.chave] = row.valor;
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    // Retornar objeto vazio em caso de erro (tabela pode não existir ainda)
    res.json({});
  }
});

// Atualizar uma configuração específica
app.put('/api/configuracoes/:chave', async (req, res) => {
  const { chave } = req.params;
  const { valor } = req.body;
  
  try {
    const valorJson = typeof valor === 'string' ? valor : JSON.stringify(valor);
    
    // Gerar ID seguro usando crypto
    const id = `conf-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Usar INSERT ... ON DUPLICATE KEY UPDATE para criar ou atualizar
    await pool.query(
      `INSERT INTO configuracoes (id, chave, valor, tipo, updated_at) 
       VALUES (?, ?, ?, 'json', NOW()) 
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), updated_at = NOW()`,
      [id, chave, valorJson]
    );
    
    res.json({ success: true, message: 'Configuração salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

// ==================== SEGURANÇA ====================

// Função para criptografar senha com SALT
function hashPassword(login, password, salt) {
  const combined = `${login}:${password}:${salt}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// GET /api/usuarios - Listar todos os usuários (alias para compatibilidade)
app.get('/api/usuarios', async (req, res) => {
  try {
    // Adicionar coluna colaborador_id se não existir
    try {
      await pool.query(`ALTER TABLE usuarios_seguranca ADD COLUMN colaborador_id VARCHAR(36) NULL`);
      await pool.query(`ALTER TABLE usuarios_seguranca ADD INDEX idx_colaborador (colaborador_id)`);
    } catch (err) {
      // Coluna já existe, ignorar erro
    }

    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.login AS email,
        u.data_vigencia_inicial AS createdAt,
        u.data_vigencia_termino,
        u.status AS ativo,
        'admin' AS role,
        u.colaborador_id AS colaboradorId,
        c.nome AS colaboradorNome,
        c.matricula AS colaboradorMatricula,
        c.setor AS colaboradorSetor,
        '[]' AS permissoesPorSetor,
        u.created_at,
        u.updated_at
      FROM usuarios_seguranca u
      LEFT JOIN colaboradores c ON u.colaborador_id = c.id
      ORDER BY u.created_at DESC
    `);
    
    // Formatar resposta para compatibilidade com o frontend
    const usuariosFormatados = rows.map(u => ({
      ...u,
      ativo: u.ativo === 'ATIVO' ? 1 : 0,
      permissoesPorSetor: []
    }));
    
    res.json(usuariosFormatados);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuários',
      details: error.message 
    });
  }
});

// GET /api/usuarios/:id - Buscar usuário por ID (alias)
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        u.id,
        u.login AS email,
        u.data_vigencia_inicial AS createdAt,
        u.data_vigencia_termino,
        u.status AS ativo,
        'admin' AS role,
        u.colaborador_id AS colaboradorId,
        c.nome AS colaboradorNome,
        c.matricula AS colaboradorMatricula,
        c.setor AS colaboradorSetor,
        '[]' AS permissoesPorSetor,
        u.created_at,
        u.updated_at
      FROM usuarios_seguranca u
      LEFT JOIN colaboradores c ON u.colaborador_id = c.id
      WHERE u.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = {
      ...rows[0],
      ativo: rows[0].ativo === 'ATIVO' ? 1 : 0,
      permissoesPorSetor: []
    };
    
    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /api/usuarios - Criar novo usuário (alias)
app.post('/api/usuarios', async (req, res) => {
  const { email, password, role, ativo, colaboradorId } = req.body;
  
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar SALT
    const [configRows] = await pool.query('SELECT valor FROM configuracoes WHERE chave = ?', ['PASSWORD_SALT']);
    if (configRows.length === 0) {
      return res.status(400).json({ error: 'SALT não configurado' });
    }
    
    const salt = configRows[0].valor;
    
    // Verificar se já existe
    const [existing] = await pool.query('SELECT id FROM usuarios_seguranca WHERE login = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já existe' });
    }
    
    const id = uuidv4();
    const passwordHash = hashPassword(email, password, salt);
    const status = ativo ? 'ATIVO' : 'INATIVO';
    
    await pool.query(
      `INSERT INTO usuarios_seguranca 
       (id, login, password_hash, data_vigencia_inicial, status, salt_usado, created_by, colaborador_id) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [id, email, passwordHash, status, salt, 'system', colaboradorId]
    );
    
    const [created] = await pool.query('SELECT * FROM usuarios_seguranca WHERE id = ?', [id]);
    
    res.status(201).json({
      ...created[0],
      email: created[0].login,
      ativo: created[0].status === 'ATIVO' ? 1 : 0,
      role: 'admin'
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário', details: error.message });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário (alias)
app.put('/api/usuarios/:id', async (req, res) => {
  const { email, password, role, ativo, colaboradorId } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM usuarios_seguranca WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = existing[0];
    let passwordHash = usuario.password_hash;
    
    if (password) {
      passwordHash = hashPassword(email || usuario.login, password, usuario.salt_usado);
    }
    
    const status = ativo ? 'ATIVO' : 'INATIVO';
    
    await pool.query(
      `UPDATE usuarios_seguranca 
       SET login = ?, password_hash = ?, status = ?, updated_by = ?, updated_at = NOW(), colaborador_id = ?
       WHERE id = ?`,
      [email || usuario.login, passwordHash, status, 'system', colaboradorId || usuario.colaborador_id, req.params.id]
    );
    
    const [updated] = await pool.query('SELECT * FROM usuarios_seguranca WHERE id = ?', [req.params.id]);
    
    res.json({
      ...updated[0],
      email: updated[0].login,
      ativo: updated[0].status === 'ATIVO' ? 1 : 0,
      role: 'admin'
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário', details: error.message });
  }
});

// DELETE /api/usuarios/:id - Excluir usuário (alias)
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM usuarios_seguranca WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// GET /api/usuarios-seguranca - Listar todos os usuários de segurança
app.get('/api/usuarios-seguranca', async (req, res) => {
  try {
    // Verificar se a tabela existe, criar se necessário
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios_seguranca (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        login VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        data_vigencia_inicial DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        data_vigencia_termino DATETIME NULL,
        status ENUM('ATIVO', 'INATIVO', 'BLOQUEADO', 'AGUARDANDO_ATIVACAO') NOT NULL DEFAULT 'ATIVO',
        salt_usado VARCHAR(32) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        INDEX idx_login (login),
        INDEX idx_status (status),
        INDEX idx_vigencia (data_vigencia_inicial, data_vigencia_termino)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    const [rows] = await pool.query(`
      SELECT id, login, data_vigencia_inicial, data_vigencia_termino, status,
             salt_usado, created_at, updated_at, created_by, updated_by
      FROM usuarios_seguranca
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar usuários de segurança:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao buscar usuários',
      details: error.message,
      code: error.code
    });
  }
});

// GET /api/usuarios-seguranca/:id - Buscar usuário específico
app.get('/api/usuarios-seguranca/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, login, data_vigencia_inicial, data_vigencia_termino, status, salt_usado, created_at, updated_at FROM usuarios_seguranca WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /api/usuarios-seguranca - Criar novo usuário
app.post('/api/usuarios-seguranca', async (req, res) => {
  const { login, password, data_vigencia_termino, status, created_by } = req.body;
  
  try {
    // Validações
    if (!login || !password) {
      return res.status(400).json({ error: 'Login e senha são obrigatórios' });
    }
    
    // Buscar SALT das configurações
    const [configRows] = await pool.query('SELECT valor FROM configuracoes WHERE chave = ?', ['SALT']);
    if (configRows.length === 0) {
      return res.status(400).json({ error: 'SALT não configurado. Configure o SALT em Configurações primeiro.' });
    }
    
    const salt = configRows[0].valor;
    
    // Verificar se login já existe
    const [existing] = await pool.query('SELECT id FROM usuarios_seguranca WHERE login = ?', [login]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Login já existe' });
    }
    
    // Gerar ID e hash da senha
    const id = uuidv4();
    const passwordHash = hashPassword(login, password, salt);
    const dataVigenciaInicial = new Date();
    
    // Inserir usuário
    await pool.query(
      `INSERT INTO usuarios_seguranca 
       (id, login, password_hash, data_vigencia_inicial, data_vigencia_termino, status, salt_usado, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, login, passwordHash, dataVigenciaInicial, data_vigencia_termino || null, status || 'ATIVO', salt, created_by || 'system']
    );
    
    // Buscar usuário criado
    const [created] = await pool.query(
      'SELECT id, login, data_vigencia_inicial, data_vigencia_termino, status, created_at FROM usuarios_seguranca WHERE id = ?',
      [id]
    );
    
    res.status(201).json(created[0]);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// PUT /api/usuarios-seguranca/:id - Atualizar usuário
app.put('/api/usuarios-seguranca/:id', async (req, res) => {
  const { login, password, data_vigencia_termino, status, updated_by } = req.body;
  
  try {
    // Verificar se usuário existe
    const [existing] = await pool.query('SELECT * FROM usuarios_seguranca WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const usuario = existing[0];
    
    // Se a senha foi alterada, recriptografar
    let passwordHash = usuario.password_hash;
    if (password) {
      // Buscar SALT do banco
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ? LIMIT 1',
        ['PASSWORD_SALT']
      );
      
      if (configRows.length === 0) {
        return res.status(500).json({ error: 'SALT não configurado no sistema' });
      }
      
      const SALT = configRows[0].valor;
      passwordHash = hashPassword(login || usuario.login, password, SALT);
    }
    
    // Atualizar usuário
    await pool.query(
      `UPDATE usuarios_seguranca 
       SET login = ?, password_hash = ?, data_vigencia_termino = ?, status = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [login || usuario.login, passwordHash, data_vigencia_termino, status || usuario.status, updated_by || 'system', req.params.id]
    );
    
    // Buscar usuário atualizado
    const [updated] = await pool.query(
      'SELECT id, login, data_vigencia_inicial, data_vigencia_termino, status, updated_at FROM usuarios_seguranca WHERE id = ?',
      [req.params.id]
    );
    
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE /api/usuarios-seguranca/:id - Excluir usuário
app.delete('/api/usuarios-seguranca/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM usuarios_seguranca WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

// ========================================
// LOGS DE AUDITORIA
// ========================================

app.get('/api/logs-auditoria', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const [logs] = await pool.query(
      `SELECT * FROM logs_auditoria 
       ORDER BY log_timestamp DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM logs_auditoria');
    
    res.json({
      logs,
      total: countResult[0].total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({ error: 'Erro ao buscar logs', code: 'DATABASE_ERROR' });
  }
});

app.get('/api/logs-auditoria/stats', async (req, res) => {
  try {
    const [operationTypes] = await pool.query(
      `SELECT operation_type, COUNT(*) as count 
       FROM logs_auditoria 
       WHERE operation_type IS NOT NULL
       GROUP BY operation_type`
    );
    
    const [entityTypes] = await pool.query(
      `SELECT entity_type, COUNT(*) as count 
       FROM logs_auditoria 
       GROUP BY entity_type 
       ORDER BY count DESC 
       LIMIT 10`
    );
    
    const [statusCodes] = await pool.query(
      `SELECT status_code, COUNT(*) as count 
       FROM logs_auditoria 
       WHERE status_code IS NOT NULL
       GROUP BY status_code`
    );
    
    res.json({
      operationTypes,
      entityTypes,
      statusCodes
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', code: 'DATABASE_ERROR' });
  }
});

// ========================================
// BULK LOAD - APLICAÇÕES
// ========================================

app.post('/api/aplicacoes/bulk', async (req, res) => {
  console.log('[POST /api/aplicacoes/bulk] Iniciando carga em lote');
  
  const { aplicacoes } = req.body;
  
  // Validações básicas
  if (!aplicacoes || !Array.isArray(aplicacoes)) {
    return res.status(400).json({
      error: 'O campo "aplicacoes" deve ser um array',
      code: 'INVALID_FORMAT'
    });
  }
  
  if (aplicacoes.length === 0) {
    return res.status(400).json({
      error: 'O array de aplicações não pode estar vazio',
      code: 'EMPTY_ARRAY'
    });
  }
  
  const results = [];
  let sucessos = 0;
  let falhas = 0;
  
  // Processar cada aplicação
  for (const app of aplicacoes) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      console.log(`[BULK] Processando aplicação: ${app.sigla}`);
      
      // Validar campos obrigatórios
      if (!app.sigla || !app.descricao || !app.url_documentacao || !app.fase_ciclo_vida || !app.criticidade_negocio) {
        throw new Error('Campos obrigatórios faltando: sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio');
      }
      
      // Gerar ID único
      const aplicacaoId = uuidv4();
      
      // Inserir aplicação principal
      await connection.query(
        `INSERT INTO aplicacoes (
          id, sigla, descricao, url_documentacao, fase_ciclo_vida, criticidade_negocio,
          categoria_sistema, fornecedor, tipo_hospedagem, custo_mensal, numero_usuarios,
          data_implantacao, versao_atual, responsavel_tecnico, responsavel_negocio,
          status_operacional, observacoes, tecnologias, ambientes, capacidades, processos, integracoes, slas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', '[]')`,
        [
          aplicacaoId,
          app.sigla,
          app.descricao,
          app.url_documentacao,
          app.fase_ciclo_vida,
          app.criticidade_negocio,
          app.categoria_sistema || null,
          app.fornecedor || null,
          app.tipo_hospedagem || null,
          app.custo_mensal || null,
          app.numero_usuarios || null,
          formatDateForMySQL(app.data_implantacao) || null,
          app.versao_atual || null,
          app.responsavel_tecnico || null,
          app.responsavel_negocio || null,
          app.status_operacional || 'Operacional',
          app.observacoes || null
        ]
      );
      
      const totals = {
        ambientes: 0,
        tecnologias: 0,
        capacidades: 0,
        processos: 0,
        integracoes: 0,
        slas: 0
      };
      
      // Inserir ambientes
      if (app.ambientes && Array.isArray(app.ambientes)) {
        for (const ambiente of app.ambientes) {
          await connection.query(
            `INSERT INTO aplicacao_ambientes (
              id, aplicacao_id, tipo_ambiente, url_ambiente, data_criacao, tempo_liberacao, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              ambiente.tipo_ambiente,
              ambiente.url_ambiente,
              formatDateForMySQL(ambiente.data_criacao),
              ambiente.tempo_liberacao,
              ambiente.status || 'Ativo'
            ]
          );
          totals.ambientes++;
        }
      }
      
      // Inserir tecnologias
      if (app.tecnologias && Array.isArray(app.tecnologias)) {
        for (const tec of app.tecnologias) {
          await connection.query(
            `INSERT INTO aplicacao_tecnologias (
              id, aplicacao_id, tecnologia_id, data_inicio, data_termino, status
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              tec.tecnologia_id,
              formatDateForMySQL(tec.data_inicio),
              formatDateForMySQL(tec.data_termino) || null,
              tec.status || 'Ativo'
            ]
          );
          totals.tecnologias++;
        }
      }
      
      // Inserir capacidades
      if (app.capacidades && Array.isArray(app.capacidades)) {
        for (const cap of app.capacidades) {
          await connection.query(
            `INSERT INTO aplicacao_capacidades (
              id, aplicacao_id, capacidade_id, grau_cobertura, data_inicio, data_termino, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              cap.capacidade_id,
              cap.grau_cobertura,
              formatDateForMySQL(cap.data_inicio),
              formatDateForMySQL(cap.data_termino) || null,
              cap.status || 'Ativo'
            ]
          );
          totals.capacidades++;
        }
      }
      
      // Inserir processos
      if (app.processos && Array.isArray(app.processos)) {
        for (const proc of app.processos) {
          await connection.query(
            `INSERT INTO aplicacao_processos (
              id, aplicacao_id, processo_id, tipo_suporte, criticidade, data_inicio, data_termino, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              proc.processo_id,
              proc.tipo_suporte,
              proc.criticidade,
              formatDateForMySQL(proc.data_inicio),
              formatDateForMySQL(proc.data_termino) || null,
              proc.status || 'Ativo'
            ]
          );
          totals.processos++;
        }
      }
      
      // Inserir integrações
      if (app.integracoes && Array.isArray(app.integracoes)) {
        for (const integ of app.integracoes) {
          await connection.query(
            `INSERT INTO aplicacao_integracoes (
              id, aplicacao_origem_id, aplicacao_destino_id, tipo_integracao, protocolo, frequencia, descricao, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              integ.aplicacao_destino_id,
              integ.tipo_integracao,
              integ.protocolo,
              integ.frequencia,
              integ.descricao || null,
              integ.status || 'Ativo'
            ]
          );
          totals.integracoes++;
        }
      }
      
      // Inserir SLAs
      if (app.slas && Array.isArray(app.slas)) {
        for (const sla of app.slas) {
          await connection.query(
            `INSERT INTO aplicacao_slas (
              id, aplicacao_id, sla_id, descricao, data_inicio, data_termino, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(),
              aplicacaoId,
              sla.sla_id,
              sla.descricao,
              formatDateForMySQL(sla.data_inicio),
              formatDateForMySQL(sla.data_termino) || null,
              sla.status || 'Ativo'
            ]
          );
          totals.slas++;
        }
      }
      
      await connection.commit();
      console.log(`[BULK] ✓ Aplicação ${app.sigla} criada com sucesso`);
      
      results.push({
        sigla: app.sigla,
        status: 'success',
        id: aplicacaoId,
        totals
      });
      
      sucessos++;
      
    } catch (error) {
      await connection.rollback();
      console.error(`[BULK] ✗ Erro ao processar aplicação ${app.sigla}:`, error.message);
      
      results.push({
        sigla: app.sigla,
        status: 'error',
        error: error.message
      });
      
      falhas++;
      
    } finally {
      connection.release();
    }
  }
  
  // Resposta final
  const message = falhas === 0 
    ? 'Carga em lote realizada com sucesso'
    : 'Carga em lote concluída com erros';
  
  res.status(200).json({
    message,
    summary: {
      total: aplicacoes.length,
      sucesso: sucessos,
      falhas
    },
    results
  });
});

// ========================================
// SERVIDOR
// ========================================

async function startServer() {
  // Tentar conectar ao banco com retry
  let connected = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!connected && attempts < maxAttempts) {
    connected = await initializeDatabase();
    if (!connected) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  if (!connected) {
    console.error('✗ Não foi possível conectar ao MySQL após', maxAttempts, 'tentativas');
    console.error('  Verifique se o MySQL está rodando e as credenciais estão corretas');
    process.exit(1);
  }
  
  // ===== ROTAS DE SERVIDORES =====
  
  // GET - Listar todos os servidores
  app.get('/api/servidores', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, sigla, hostname, tipo, ambiente, finalidade, status,
          provedor, datacenter_regiao as datacenterRegiao, 
          zona_availability as zonaAvailability, cluster_host as clusterHost,
          virtualizador, sistema_operacional as sistemaOperacional,
          distribuicao_versao as distribuicaoVersao, arquitetura,
          ferramenta_monitoramento as ferramentaMonitoramento,
          backup_diario as backupDiario, backup_semanal as backupSemanal,
          backup_mensal as backupMensal, created_at, updated_at
        FROM servidores
        ORDER BY sigla
      `);
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      res.status(500).json({ error: 'Erro ao buscar servidores', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar servidor por ID
  app.get('/api/servidores/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, sigla, hostname, tipo, ambiente, finalidade, status,
          provedor, datacenter_regiao as datacenterRegiao, 
          zona_availability as zonaAvailability, cluster_host as clusterHost,
          virtualizador, sistema_operacional as sistemaOperacional,
          distribuicao_versao as distribuicaoVersao, arquitetura,
          ferramenta_monitoramento as ferramentaMonitoramento,
          backup_diario as backupDiario, backup_semanal as backupSemanal,
          backup_mensal as backupMensal, created_at, updated_at
        FROM servidores
        WHERE id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Servidor não encontrado', code: 'NOT_FOUND' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Erro ao buscar servidor:', error);
      res.status(500).json({ error: 'Erro ao buscar servidor', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar novo servidor
  app.post('/api/servidores', async (req, res) => {
    const {
      sigla, hostname, tipo, ambiente, finalidade, status,
      provedor, datacenterRegiao, zonaAvailability, clusterHost, virtualizador,
      sistemaOperacional, distribuicaoVersao, arquitetura,
      ferramentaMonitoramento, backupDiario, backupSemanal, backupMensal
    } = req.body;

    // Validação de campos obrigatórios
    if (!sigla || !hostname || !tipo || !ambiente || !finalidade || !provedor || !sistemaOperacional) {
      return res.status(400).json({
        error: 'Campos obrigatórios: sigla, hostname, tipo, ambiente, finalidade, provedor, sistemaOperacional',
        code: 'MISSING_FIELDS'
      });
    }

    try {
      const id = uuidv4();
      
      await pool.query(`
        INSERT INTO servidores (
          id, sigla, hostname, tipo, ambiente, finalidade, status,
          provedor, datacenter_regiao, zona_availability, cluster_host, virtualizador,
          sistema_operacional, distribuicao_versao, arquitetura,
          ferramenta_monitoramento, backup_diario, backup_semanal, backup_mensal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, sigla, hostname, tipo, ambiente, finalidade, status || 'Ativo',
        provedor, datacenterRegiao || null, zonaAvailability || null, 
        clusterHost || null, virtualizador || null,
        sistemaOperacional, distribuicaoVersao || null, arquitetura || null,
        ferramentaMonitoramento || null, 
        backupDiario || false, backupSemanal || false, backupMensal || false
      ]);

      const [rows] = await pool.query('SELECT * FROM servidores WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Erro ao criar servidor:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Servidor com esta sigla já existe', code: 'DUPLICATE_SIGLA' });
      }
      res.status(500).json({ error: 'Erro ao criar servidor', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // PUT - Atualizar servidor
  app.put('/api/servidores/:id', async (req, res) => {
    const {
      sigla, hostname, tipo, ambiente, finalidade, status,
      provedor, datacenterRegiao, zonaAvailability, clusterHost, virtualizador,
      sistemaOperacional, distribuicaoVersao, arquitetura,
      ferramentaMonitoramento, backupDiario, backupSemanal, backupMensal
    } = req.body;

    try {
      const [existing] = await pool.query('SELECT * FROM servidores WHERE id = ?', [req.params.id]);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Servidor não encontrado', code: 'NOT_FOUND' });
      }

      await pool.query(`
        UPDATE servidores SET
          sigla = ?, hostname = ?, tipo = ?, ambiente = ?, finalidade = ?, status = ?,
          provedor = ?, datacenter_regiao = ?, zona_availability = ?, 
          cluster_host = ?, virtualizador = ?,
          sistema_operacional = ?, distribuicao_versao = ?, arquitetura = ?,
          ferramenta_monitoramento = ?, 
          backup_diario = ?, backup_semanal = ?, backup_mensal = ?
        WHERE id = ?
      `, [
        sigla, hostname, tipo, ambiente, finalidade, status,
        provedor, datacenterRegiao || null, zonaAvailability || null,
        clusterHost || null, virtualizador || null,
        sistemaOperacional, distribuicaoVersao || null, arquitetura || null,
        ferramentaMonitoramento || null,
        backupDiario || false, backupSemanal || false, backupMensal || false,
        req.params.id
      ]);

      const [rows] = await pool.query('SELECT * FROM servidores WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar servidor:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Servidor com esta sigla já existe', code: 'DUPLICATE_SIGLA' });
      }
      res.status(500).json({ error: 'Erro ao atualizar servidor', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // DELETE - Excluir servidor
  app.delete('/api/servidores/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM servidores WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Servidor não encontrado', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir servidor:', error);
      res.status(500).json({ error: 'Erro ao excluir servidor', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // ENDPOINTS DE STAGES
  // ===================================

  // GET - Listar todos os stages
  app.get('/api/stages', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, nome, descricao, yaml_content as yamlContent, tipo, reutilizavel,
          timeout_seconds as timeoutSeconds,
          created_at as createdAt, updated_at as updatedAt
        FROM stages
        ORDER BY nome
      `);
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar stages:', error);
      res.status(500).json({ error: 'Erro ao buscar stages', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar stage por ID
  app.get('/api/stages/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, nome, descricao, yaml_content as yamlContent, tipo, reutilizavel,
          timeout_seconds as timeoutSeconds,
          created_at as createdAt, updated_at as updatedAt
        FROM stages
        WHERE id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Stage não encontrado', code: 'NOT_FOUND' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Erro ao buscar stage:', error);
      res.status(500).json({ error: 'Erro ao buscar stage', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar novo stage
  app.post('/api/stages', async (req, res) => {
    const { nome, descricao, yamlContent, tipo, reutilizavel, timeoutSeconds } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, tipo',
        code: 'MISSING_FIELDS'
      });
    }

    try {
      const id = uuidv4();
      
      await pool.query(`
        INSERT INTO stages (id, nome, descricao, yaml_content, tipo, reutilizavel, timeout_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, nome, descricao || null, yamlContent || null, tipo,
        reutilizavel !== undefined ? reutilizavel : true,
        timeoutSeconds || 3600
      ]);

      const [rows] = await pool.query('SELECT * FROM stages WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Erro ao criar stage:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Stage com este nome já existe', code: 'DUPLICATE_NAME' });
      }
      res.status(500).json({ error: 'Erro ao criar stage', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // PUT - Atualizar stage
  app.put('/api/stages/:id', async (req, res) => {
    const { nome, descricao, yamlContent, tipo, reutilizavel, timeoutSeconds } = req.body;

    try {
      const [result] = await pool.query(`
        UPDATE stages SET
          nome = ?, descricao = ?, yaml_content = ?, tipo = ?, reutilizavel = ?,
          timeout_seconds = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [nome, descricao, yamlContent, tipo, reutilizavel, timeoutSeconds, req.params.id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Stage não encontrado', code: 'NOT_FOUND' });
      }

      const [rows] = await pool.query('SELECT * FROM stages WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar stage:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Stage com este nome já existe', code: 'DUPLICATE_NAME' });
      }
      res.status(500).json({ error: 'Erro ao atualizar stage', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // DELETE - Excluir stage
  app.delete('/api/stages/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM stages WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Stage não encontrado', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir stage:', error);
      res.status(500).json({ error: 'Erro ao excluir stage', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // ENDPOINTS DE PIPELINES
  // ===================================

  // GET - Listar todas as pipelines
  app.get('/api/pipelines', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id, nome, status,
          data_inicio as dataInicio,
          data_termino as dataTermino,
          trigger_branches as triggerBranches,
          trigger_paths as triggerPaths,
          pr_branches as prBranches,
          variables,
          resources_repositories as resourcesRepositories,
          resources_pipelines as resourcesPipelines,
          resources_containers as resourcesContainers,
          schedules,
          created_at as createdAt,
          updated_at as updatedAt
        FROM pipelines
        ORDER BY nome
      `);
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar pipelines:', error);
      res.status(500).json({ error: 'Erro ao buscar pipelines', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar pipeline por ID com stages
  app.get('/api/pipelines/:id', async (req, res) => {
    try {
      const [pipelineRows] = await pool.query(`
        SELECT 
          id, nome, status,
          data_inicio as dataInicio,
          data_termino as dataTermino,
          trigger_branches as triggerBranches,
          trigger_paths as triggerPaths,
          pr_branches as prBranches,
          variables,
          resources_repositories as resourcesRepositories,
          resources_pipelines as resourcesPipelines,
          resources_containers as resourcesContainers,
          schedules,
          created_at as createdAt,
          updated_at as updatedAt
        FROM pipelines
        WHERE id = ?
      `, [req.params.id]);
      
      if (pipelineRows.length === 0) {
        return res.status(404).json({ error: 'Pipeline não encontrada', code: 'NOT_FOUND' });
      }
      
      const pipeline = pipelineRows[0];
      
      // Buscar stages associados
      const [stageRows] = await pool.query(`
        SELECT 
          ps.id, ps.pipeline_id as pipelineId, ps.stage_id as stageId,
          ps.status, ps.data_inicio as dataInicio, ps.data_termino as dataTermino,
          ps.ordem,
          s.nome, s.tipo, s.descricao
        FROM pipeline_stages ps
        JOIN stages s ON ps.stage_id = s.id
        WHERE ps.pipeline_id = ?
        ORDER BY ps.ordem
      `, [req.params.id]);
      
      pipeline.stages = stageRows.map(row => ({
        id: row.id,
        pipelineId: row.pipelineId,
        stageId: row.stageId,
        status: row.status,
        dataInicio: row.dataInicio,
        dataTermino: row.dataTermino,
        ordem: row.ordem,
        stage: {
          id: row.stageId,
          nome: row.nome,
          tipo: row.tipo,
          descricao: row.descricao
        }
      }));
      
      res.json(pipeline);
    } catch (error) {
      console.error('Erro ao buscar pipeline:', error);
      res.status(500).json({ error: 'Erro ao buscar pipeline', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar nova pipeline
  app.post('/api/pipelines', async (req, res) => {
    const {
      nome, status, dataInicio, dataTermino,
      triggerBranches, triggerPaths, prBranches,
      variables, resourcesRepositories, resourcesPipelines,
      resourcesContainers, schedules, stages
    } = req.body;

    console.log('Status recebido:', status, '| Bytes:', Buffer.from(status || 'Em avaliacao').toString('hex'));
    console.log('🔍 Stages recebidos:', stages ? `${stages.length} stages` : 'Nenhum stage');
    if (stages && stages.length > 0) {
      console.log('🔍 Primeiro stage:', stages[0]);
    }

    if (!nome) {
      return res.status(400).json({
        error: 'Campo obrigatório: nome',
        code: 'MISSING_FIELDS'
      });
    }

    const connection = await getUtf8Connection();
    try {
      await connection.beginTransaction();
      
      const id = uuidv4();
      
      await connection.query(`
        INSERT INTO pipelines (
          id, nome, status, data_inicio, data_termino,
          trigger_branches, trigger_paths, pr_branches,
          variables, resources_repositories, resources_pipelines,
          resources_containers, schedules
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, nome, status || 'Em avaliacao', dataInicio || null, dataTermino || null,
        triggerBranches || null, triggerPaths || null, prBranches || null,
        variables || null, resourcesRepositories || null, resourcesPipelines || null,
        resourcesContainers || null, schedules || null
      ]);

      // Inserir stages
      if (stages && stages.length > 0) {
        for (let i = 0; i < stages.length; i++) {
          const stage = stages[i];
          await connection.query(`
            INSERT INTO pipeline_stages (
              id, pipeline_id, stage_id, status,
              data_inicio, data_termino, ordem
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            stage.id || uuidv4(),
            id,
            stage.stageId,
            stage.status || 'Ativa',
            stage.dataInicio,
            stage.dataTermino || null,
            stage.ordem !== undefined ? stage.ordem : i
          ]);
        }
      }

      await connection.commit();

      const [rows] = await pool.query('SELECT * FROM pipelines WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao criar pipeline:', error);
      res.status(500).json({ error: 'Erro ao criar pipeline', code: 'DATABASE_ERROR', details: error.message });
    } finally {
      connection.release();
    }
  });

  // PUT - Atualizar pipeline
  app.put('/api/pipelines/:id', async (req, res) => {
    const {
      nome, status, dataInicio, dataTermino,
      triggerBranches, triggerPaths, prBranches,
      variables, resourcesRepositories, resourcesPipelines,
      resourcesContainers, schedules, stages
    } = req.body;

    console.log('🔍 PUT Pipeline - Stages recebidos:', stages ? `${stages.length} stages` : 'Nenhum stage');

    const connection = await getUtf8Connection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(`
        UPDATE pipelines SET
          nome = ?, status = ?, data_inicio = ?, data_termino = ?,
          trigger_branches = ?, trigger_paths = ?, pr_branches = ?,
          variables = ?, resources_repositories = ?, resources_pipelines = ?,
          resources_containers = ?, schedules = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        nome, status, dataInicio, dataTermino,
        triggerBranches, triggerPaths, prBranches,
        variables, resourcesRepositories, resourcesPipelines,
        resourcesContainers, schedules, req.params.id
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pipeline não encontrada', code: 'NOT_FOUND' });
      }

      // Remover stages existentes
      await connection.query('DELETE FROM pipeline_stages WHERE pipeline_id = ?', [req.params.id]);

      // Inserir novos stages
      if (stages && stages.length > 0) {
        for (let i = 0; i < stages.length; i++) {
          const stage = stages[i];
          await connection.query(`
            INSERT INTO pipeline_stages (
              id, pipeline_id, stage_id, status,
              data_inicio, data_termino, ordem
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            stage.id || uuidv4(),
            req.params.id,
            stage.stageId,
            stage.status || 'Ativa',
            stage.dataInicio,
            stage.dataTermino || null,
            stage.ordem !== undefined ? stage.ordem : i
          ]);
        }
      }

      await connection.commit();

      const [rows] = await pool.query('SELECT * FROM pipelines WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao atualizar pipeline:', error);
      res.status(500).json({ error: 'Erro ao atualizar pipeline', code: 'DATABASE_ERROR', details: error.message });
    } finally {
      connection.release();
    }
  });

  // DELETE - Excluir pipeline
  app.delete('/api/pipelines/:id', async (req, res) => {
    try {
      // Cascade delete configurado no banco excluirá os pipeline_stages automaticamente
      const [result] = await pool.query('DELETE FROM pipelines WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Pipeline não encontrada', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir pipeline:', error);
      res.status(500).json({ error: 'Erro ao excluir pipeline', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // ENDPOINTS DE ADR (ARCHITECTURAL DECISION RECORDS)
  // =====================================================

  /* ENDPOINTS DUPLICADOS COMENTADOS - Versão melhorada está mais abaixo (linha ~8500)
  // GET - Listar todos os ADRs
  app.get('/api/adrs', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.id, a.sequencia, a.descricao, a.data_criacao as dataCriacao,
          a.updated_at as dataAtualizacao,
          a.status, a.contexto, a.decisao, a.justificativa,
          a.consequencias_positivas as consequenciasPositivas,
          a.consequencias_negativas as consequenciasNegativas,
          a.riscos, a.alternativas_consideradas as alternativasConsideradas,
          a.compliance_constitution as complianceConstitution,
          a.adr_substituta_id as adrSubstitutaId,
          a.referencias, a.created_at as createdAt, a.updated_at as updatedAt,
          sub.sequencia as adrSubstitutaSequencia,
          sub.descricao as adrSubstitutaDescricao,
          (SELECT COUNT(*) FROM adr_aplicacoes WHERE adr_id = a.id) as aplicacoesCount
        FROM adrs a
        LEFT JOIN adrs sub ON a.adr_substituta_id = sub.id
        ORDER BY a.sequencia DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar ADRs:', error);
      res.status(500).json({ error: 'Erro ao buscar ADRs', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar ADR por ID
  app.get('/api/adrs/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          a.id, a.sequencia, a.descricao, a.data_criacao as dataCriacao,
          a.updated_at as dataAtualizacao,
          a.status, a.contexto, a.decisao, a.justificativa,
          a.consequencias_positivas as consequenciasPositivas,
          a.consequencias_negativas as consequenciasNegativas,
          a.riscos, a.alternativas_consideradas as alternativasConsideradas,
          a.compliance_constitution as complianceConstitution,
          a.adr_substituta_id as adrSubstitutaId,
          a.referencias, a.created_at as createdAt, a.updated_at as updatedAt
        FROM adrs a
        WHERE a.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'ADR não encontrado', code: 'NOT_FOUND' });
      }

      // Buscar aplicações associadas
      const [aplicacoes] = await pool.query(`
        SELECT 
          aa.id, aa.adr_id as adrId, aa.aplicacao_id as aplicacaoId,
          aa.data_inicio as dataInicio, aa.data_termino as dataTermino,
          aa.status, aa.observacoes,
          ap.descricao as aplicacaoNome, ap.sigla as aplicacaoSigla
        FROM adr_aplicacoes aa
        INNER JOIN aplicacoes ap ON aa.aplicacao_id = ap.id
        WHERE aa.adr_id = ?
        ORDER BY aa.data_inicio DESC
      `, [req.params.id]);

      const adr = rows[0];
      adr.aplicacoes = aplicacoes;
      
      res.json(adr);
    } catch (error) {
      console.error('Erro ao buscar ADR:', error);
      res.status(500).json({ error: 'Erro ao buscar ADR', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar novo ADR
  app.post('/api/adrs', async (req, res) => {
    const {
      descricao, status, contexto, decisao, justificativa,
      consequenciasPositivas, consequenciasNegativas, riscos,
      alternativasConsideradas, complianceConstitution, adrSubstitutaId,
      aplicacoes
    } = req.body;

    console.log('🔍 POST ADR - Aplicações recebidas:', aplicacoes ? `${aplicacoes.length} aplicações` : 'Nenhuma aplicação');
    if (aplicacoes && aplicacoes.length > 0) {
      console.log('🔍 Primeira aplicação:', aplicacoes[0]);
    }

    if (!descricao) {
      return res.status(400).json({
        error: 'Campo obrigatório: descricao',
        code: 'MISSING_FIELDS'
      });
    }

    // Validar ADR substituta se status for "Substituído"
    if (status === 'Substituído' && !adrSubstitutaId) {
      return res.status(400).json({
        error: 'Campo adrSubstitutaId é obrigatório quando status é Substituído',
        code: 'MISSING_SUBSTITUTA'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const id = uuidv4();
      const referencias = `- [Michael Nygard's ADR Template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)\n- [ADR GitHub Organization](https://adr.github.io/)\n- [Constitution - Mandatory Artifacts](../../.specify/memory/constitution.md)`;
      
      await connection.query(`
        INSERT INTO adrs (
          id, descricao, status, contexto, decisao, justificativa,
          consequencias_positivas, consequencias_negativas, riscos,
          alternativas_consideradas, compliance_constitution,
          adr_substituta_id, referencias
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, descricao, status || 'Proposto', contexto || null, decisao || null,
        justificativa || null, consequenciasPositivas || null,
        consequenciasNegativas || null, riscos || null,
        alternativasConsideradas || null, complianceConstitution || null,
        adrSubstitutaId || null, referencias
      ]);

      // Inserir aplicações associadas
      if (aplicacoes && aplicacoes.length > 0) {
        for (const app of aplicacoes) {
          await connection.query(`
            INSERT INTO adr_aplicacoes (
              id, adr_id, aplicacao_id, data_inicio, data_termino, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), id, app.aplicacaoId, app.dataInicio || null,
            app.dataTermino || null, app.status || 'Ativo', app.observacoes || null
          ]);
        }
      }

      await connection.commit();

      const [rows] = await connection.query('SELECT * FROM adrs WHERE id = ?', [id]);
      res.status(201).json(rows[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao criar ADR:', error);
      res.status(500).json({ error: 'Erro ao criar ADR', code: 'DATABASE_ERROR', details: error.message });
    } finally {
      connection.release();
    }
  });

  // PUT - Atualizar ADR
  app.put('/api/adrs/:id', async (req, res) => {
    const {
      descricao, status, contexto, decisao, justificativa,
      consequenciasPositivas, consequenciasNegativas, riscos,
      alternativasConsideradas, complianceConstitution, adrSubstitutaId,
      aplicacoes
    } = req.body;

    console.log('🔍 PUT ADR - Aplicações recebidas:', aplicacoes ? `${aplicacoes.length} aplicações` : 'Nenhuma aplicação');

    // Validar ADR substituta se status for "Substituído"
    if (status === 'Substituído' && !adrSubstitutaId) {
      return res.status(400).json({
        error: 'Campo adrSubstitutaId é obrigatório quando status é Substituído',
        code: 'MISSING_SUBSTITUTA'
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(`
        UPDATE adrs SET
          descricao = ?, status = ?, contexto = ?, decisao = ?,
          justificativa = ?, consequencias_positivas = ?,
          consequencias_negativas = ?, riscos = ?,
          alternativas_consideradas = ?, compliance_constitution = ?,
          adr_substituta_id = ?
        WHERE id = ?
      `, [
        descricao, status, contexto || null, decisao || null,
        justificativa || null, consequenciasPositivas || null,
        consequenciasNegativas || null, riscos || null,
        alternativasConsideradas || null, complianceConstitution || null,
        adrSubstitutaId || null, req.params.id
      ]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'ADR não encontrado', code: 'NOT_FOUND' });
      }

      // Atualizar aplicações associadas
      // Remover associações antigas
      await connection.query('DELETE FROM adr_aplicacoes WHERE adr_id = ?', [req.params.id]);

      // Inserir novas associações
      if (aplicacoes && aplicacoes.length > 0) {
        for (const app of aplicacoes) {
          await connection.query(`
            INSERT INTO adr_aplicacoes (
              id, adr_id, aplicacao_id, data_inicio, data_termino, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(), req.params.id, app.aplicacaoId, app.dataInicio || null,
            app.dataTermino || null, app.status || 'Ativo', app.observacoes || null
          ]);
        }
      }

      await connection.commit();

      const [rows] = await connection.query('SELECT * FROM adrs WHERE id = ?', [req.params.id]);
      res.json(rows[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao atualizar ADR:', error);
      res.status(500).json({ error: 'Erro ao atualizar ADR', code: 'DATABASE_ERROR', details: error.message });
    } finally {
      connection.release();
    }
  });

  // DELETE - Excluir ADR
  app.delete('/api/adrs/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM adrs WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ADR não encontrado', code: 'NOT_FOUND' });
      }
      
      res.json({ success: true, message: 'ADR excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ADR:', error);
      res.status(500).json({ error: 'Erro ao excluir ADR', code: 'DATABASE_ERROR' });
    }
  });
  */

  // ===================================
  // ENDPOINTS DE APLICAÇÃO-SERVIDOR
  // ===================================

  // GET - Listar todas as aplicações de um servidor
  app.get('/api/servidores/:servidorId/aplicacoes', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          sa.id,
          sa.servidor_id as servidorId,
          sa.aplicacao_id as aplicacaoId,
          sa.data_inicio as dataInicio,
          sa.data_termino as dataTermino,
          sa.status,
          a.sigla as aplicacaoSigla,
          a.descricao as aplicacaoDescricao,
          sa.created_at as createdAt,
          sa.updated_at as updatedAt
        FROM servidor_aplicacao sa
        LEFT JOIN aplicacoes a ON sa.aplicacao_id = a.id
        WHERE sa.servidor_id = ?
        ORDER BY sa.data_inicio DESC
      `, [req.params.servidorId]);
      
      const aplicacoes = rows.map(row => ({
        id: row.id,
        servidorId: row.servidorId,
        aplicacaoId: row.aplicacaoId,
        aplicacaoSigla: row.aplicacaoSigla,
        aplicacaoDescricao: row.aplicacaoDescricao,
        dataInicio: row.dataInicio ? formatDateToISO(row.dataInicio) : null,
        dataTermino: row.dataTermino ? formatDateToISO(row.dataTermino) : null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
      
      res.json(aplicacoes);
    } catch (error) {
      console.error('Erro ao buscar aplicações do servidor:', error);
      res.status(500).json({ error: 'Erro ao buscar aplicações do servidor', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Adicionar aplicação ao servidor
  app.post('/api/servidores/:servidorId/aplicacoes', async (req, res) => {
    try {
      const { aplicacaoId, dataInicio, dataTermino, status } = req.body;
      
      if (!aplicacaoId || !dataInicio || !status) {
        return res.status(400).json({ 
          error: 'Aplicação, data de início e status são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS' 
        });
      }

      const id = uuidv4();
      
      await pool.query(
        `INSERT INTO servidor_aplicacao 
        (id, servidor_id, aplicacao_id, data_inicio, data_termino, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, req.params.servidorId, aplicacaoId, dataInicio, dataTermino || null, status]
      );
      
      const [rows] = await pool.query(
        `SELECT 
          sa.id,
          sa.servidor_id as servidorId,
          sa.aplicacao_id as aplicacaoId,
          sa.data_inicio as dataInicio,
          sa.data_termino as dataTermino,
          sa.status,
          a.sigla as aplicacaoSigla,
          a.descricao as aplicacaoDescricao,
          sa.created_at as createdAt,
          sa.updated_at as updatedAt
        FROM servidor_aplicacao sa
        LEFT JOIN aplicacoes a ON sa.aplicacao_id = a.id
        WHERE sa.id = ?`,
        [id]
      );
      
      const aplicacao = {
        id: rows[0].id,
        servidorId: rows[0].servidorId,
        aplicacaoId: rows[0].aplicacaoId,
        aplicacaoSigla: rows[0].aplicacaoSigla,
        aplicacaoDescricao: rows[0].aplicacaoDescricao,
        dataInicio: rows[0].dataInicio ? formatDateToISO(rows[0].dataInicio) : null,
        dataTermino: rows[0].dataTermino ? formatDateToISO(rows[0].dataTermino) : null,
        status: rows[0].status,
        createdAt: rows[0].createdAt,
        updatedAt: rows[0].updatedAt
      };
      
      res.status(201).json(aplicacao);
    } catch (error) {
      console.error('Erro ao adicionar aplicação ao servidor:', error);
      res.status(500).json({ error: 'Erro ao adicionar aplicação ao servidor', code: 'DATABASE_ERROR' });
    }
  });

  // DELETE - Remover todas as aplicações de um servidor
  app.delete('/api/servidores/:servidorId/aplicacoes', async (req, res) => {
    try {
      await pool.query('DELETE FROM servidor_aplicacao WHERE servidor_id = ?', [req.params.servidorId]);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover aplicações do servidor:', error);
      res.status(500).json({ error: 'Erro ao remover aplicações do servidor', code: 'DATABASE_ERROR' });
    }
  });

  // DELETE - Remover uma aplicação específica de um servidor
  app.delete('/api/servidores/:servidorId/aplicacoes/:id', async (req, res) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM servidor_aplicacao WHERE id = ? AND servidor_id = ?',
        [req.params.id, req.params.servidorId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Aplicação não encontrada', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao remover aplicação do servidor:', error);
      res.status(500).json({ error: 'Erro ao remover aplicação do servidor', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Listar todos os servidores de uma aplicação
  app.get('/api/aplicacoes/:aplicacaoId/servidores', async (req, res) => {
    try {
      console.log('Buscando servidores para aplicacao_id:', req.params.aplicacaoId);
      
      const [rows] = await pool.query(`
        SELECT 
          sa.id,
          sa.servidor_id as servidorId,
          sa.aplicacao_id as aplicacaoId,
          sa.data_inicio as dataInicio,
          sa.data_termino as dataTermino,
          sa.status,
          s.sigla as servidorSigla,
          s.hostname as servidorHostname,
          s.tipo as tipoServidor,
          s.sistema_operacional as sistemaOperacional,
          sa.created_at as createdAt,
          sa.updated_at as updatedAt
        FROM servidor_aplicacao sa
        INNER JOIN servidores s ON sa.servidor_id = s.id
        WHERE sa.aplicacao_id = ?
        ORDER BY s.sigla
      `, [req.params.aplicacaoId]);
      
      console.log(`Encontrados ${rows.length} servidores para aplicacao_id ${req.params.aplicacaoId}`);
      
      const servidores = rows.map(row => ({
        id: row.id,
        servidorId: row.servidorId,
        aplicacaoId: row.aplicacaoId,
        servidorSigla: row.servidorSigla,
        servidorHostname: row.servidorHostname,
        tipoServidor: row.tipoServidor,
        sistemaOperacional: row.sistemaOperacional,
        dataInicio: row.dataInicio ? formatDateToISO(row.dataInicio) : null,
        dataTermino: row.dataTermino ? formatDateToISO(row.dataTermino) : null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
      
      res.json(servidores);
    } catch (error) {
      console.error('Erro ao buscar servidores da aplicação:', error);
      res.status(500).json({ error: 'Erro ao buscar servidores da aplicação', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar payloads de uma aplicação específica
  app.get('/api/aplicacoes/:aplicacaoId/payloads', async (req, res) => {
    try {
      console.log('Buscando payloads para aplicacao_id:', req.params.aplicacaoId);
      
      const [rows] = await pool.query(`
        SELECT 
          p.id, 
          p.aplicacao_id as aplicacaoId, 
          p.sigla, 
          p.definicao, 
          p.descricao,
          p.formato_arquivo as formatoArquivo, 
          p.conteudo_arquivo as conteudoArquivo,
          p.versao_openapi as versaoOpenapi, 
          p.arquivo_valido as arquivoValido,
          p.ultima_validacao as ultimaValidacao, 
          p.erros_validacao as errosValidacao,
          p.data_inicio as dataInicio, 
          p.data_termino as dataTermino,
          p.created_at as createdAt, 
          p.updated_at as updatedAt,
          a.sigla as aplicacaoSigla, 
          a.descricao as aplicacaoDescricao
        FROM payloads p
        LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
        WHERE p.aplicacao_id = ?
        ORDER BY p.data_inicio DESC
      `, [req.params.aplicacaoId]);
      
      console.log(`Encontrados ${rows.length} payloads para aplicacao_id ${req.params.aplicacaoId}`);
      
      const payloads = rows.map(row => ({
        id: row.id,
        aplicacaoId: row.aplicacaoId,
        aplicacaoSigla: row.aplicacaoSigla,
        aplicacaoDescricao: row.aplicacaoDescricao,
        sigla: row.sigla,
        definicao: row.definicao,
        descricao: row.descricao,
        formatoArquivo: row.formatoArquivo,
        conteudoArquivo: row.conteudoArquivo,
        versaoOpenapi: row.versaoOpenapi,
        arquivoValido: Boolean(row.arquivoValido),
        ultimaValidacao: row.ultimaValidacao,
        errosValidacao: row.errosValidacao,
        dataInicio: row.dataInicio ? formatDateToISO(row.dataInicio) : null,
        dataTermino: row.dataTermino ? formatDateToISO(row.dataTermino) : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
      
      res.json(payloads);
    } catch (error) {
      console.error('Erro ao buscar payloads da aplicação:', error);
      res.status(500).json({ error: 'Erro ao buscar payloads da aplicação', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // ENDPOINTS DE CONTRATOS
  // ===================================

  // GET - Listar todos os contratos de uma aplicação
  // ============ ENDPOINTS PARA ADRs DE APLICAÇÃO ============
  
  // GET - Buscar ADRs de uma aplicação
  app.get('/api/aplicacoes/:aplicacaoId/adrs', async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT 
          aa.id,
          aa.adr_id as adrId,
          aa.aplicacao_id as aplicacaoId,
          aa.data_inicio as dataInicio,
          aa.data_termino as dataTermino,
          aa.status,
          aa.observacoes,
          a.sequencia as adrSequencia,
          a.descricao as adrDescricao,
          a.status as adrStatus
        FROM adr_aplicacoes aa
        INNER JOIN adrs a ON aa.adr_id = a.id
        WHERE aa.aplicacao_id = ?
        ORDER BY a.sequencia`,
        [req.params.aplicacaoId]
      );
      
      res.json(rows);
    } catch (error) {
      console.error('[API GET /aplicacoes/:aplicacaoId/adrs] Erro:', error);
      res.status(500).json({ error: 'Erro ao buscar ADRs da aplicação', code: 'DATABASE_ERROR' });
    }
  });

  // ============ ENDPOINTS PARA CONTRATOS DE APLICAÇÃO ============

  app.get('/api/aplicacoes/:aplicacaoId/contratos', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM contratos WHERE aplicacao_id = ? ORDER BY data_vigencia_inicial DESC',
        [req.params.aplicacaoId]
      );
      
      // Formatar datas para YYYY-MM-DD
      const contratos = rows.map(row => ({
        ...row,
        dataVigenciaInicial: row.data_vigencia_inicial ? formatDateToISO(row.data_vigencia_inicial) : null,
        dataVigenciaFinal: row.data_vigencia_final ? formatDateToISO(row.data_vigencia_final) : null,
        aplicacaoId: row.aplicacao_id,
        numeroContrato: row.numero_contrato
      }));
      
      res.json(contratos);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar contrato por ID
  app.get('/api/contratos/:id', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM contratos WHERE id = ?', [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Contrato não encontrado', code: 'NOT_FOUND' });
      }
      
      const contrato = {
        ...rows[0],
        dataVigenciaInicial: rows[0].data_vigencia_inicial ? formatDateToISO(rows[0].data_vigencia_inicial) : null,
        dataVigenciaFinal: rows[0].data_vigencia_final ? formatDateToISO(rows[0].data_vigencia_final) : null,
        aplicacaoId: rows[0].aplicacao_id,
        numeroContrato: rows[0].numero_contrato
      };
      
      res.json(contrato);
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      res.status(500).json({ error: 'Erro ao buscar contrato', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar novo contrato
  app.post('/api/aplicacoes/:aplicacaoId/contratos', async (req, res) => {
    try {
      const { id, numeroContrato, dataVigenciaInicial, dataVigenciaFinal, status } = req.body;
      
      // Validações
      if (!numeroContrato || !numeroContrato.trim()) {
        return res.status(400).json({ error: 'Número do contrato é obrigatório', code: 'VALIDATION_ERROR' });
      }
      
      if (!dataVigenciaInicial) {
        return res.status(400).json({ error: 'Data de vigência inicial é obrigatória', code: 'VALIDATION_ERROR' });
      }
      
      if (!dataVigenciaFinal) {
        return res.status(400).json({ error: 'Data de vigência final é obrigatória', code: 'VALIDATION_ERROR' });
      }

      const contratoId = id || uuidv4();
      
      await pool.query(
        `INSERT INTO contratos (
          id, aplicacao_id, numero_contrato, data_vigencia_inicial, 
          data_vigencia_final, status
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          contratoId,
          req.params.aplicacaoId,
          numeroContrato,
          dataVigenciaInicial,
          dataVigenciaFinal,
          status || 'Vigente'
        ]
      );
      
      const [rows] = await pool.query('SELECT * FROM contratos WHERE id = ?', [contratoId]);
      const contrato = {
        ...rows[0],
        dataVigenciaInicial: rows[0].data_vigencia_inicial ? formatDateToISO(rows[0].data_vigencia_inicial) : null,
        dataVigenciaFinal: rows[0].data_vigencia_final ? formatDateToISO(rows[0].data_vigencia_final) : null,
        aplicacaoId: rows[0].aplicacao_id,
        numeroContrato: rows[0].numero_contrato
      };
      res.status(201).json(contrato);
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      res.status(500).json({ error: 'Erro ao criar contrato', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // PUT - Atualizar contrato
  app.put('/api/contratos/:id', async (req, res) => {
    try {
      const { numeroContrato, dataVigenciaInicial, dataVigenciaFinal, status } = req.body;
      
      // Validações
      if (!numeroContrato || !numeroContrato.trim()) {
        return res.status(400).json({ error: 'Número do contrato é obrigatório', code: 'VALIDATION_ERROR' });
      }
      
      if (!dataVigenciaInicial) {
        return res.status(400).json({ error: 'Data de vigência inicial é obrigatória', code: 'VALIDATION_ERROR' });
      }
      
      if (!dataVigenciaFinal) {
        return res.status(400).json({ error: 'Data de vigência final é obrigatória', code: 'VALIDATION_ERROR' });
      }

      const [result] = await pool.query(
        `UPDATE contratos SET
          numero_contrato = ?,
          data_vigencia_inicial = ?,
          data_vigencia_final = ?,
          status = ?
        WHERE id = ?`,
        [numeroContrato, dataVigenciaInicial, dataVigenciaFinal, status, req.params.id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Contrato não encontrado', code: 'NOT_FOUND' });
      }
      
      const [rows] = await pool.query('SELECT * FROM contratos WHERE id = ?', [req.params.id]);
      const contrato = {
        ...rows[0],
        dataVigenciaInicial: rows[0].data_vigencia_inicial ? formatDateToISO(rows[0].data_vigencia_inicial) : null,
        dataVigenciaFinal: rows[0].data_vigencia_final ? formatDateToISO(rows[0].data_vigencia_final) : null,
        aplicacaoId: rows[0].aplicacao_id,
        numeroContrato: rows[0].numero_contrato
      };
      res.json(contrato);
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
      res.status(500).json({ error: 'Erro ao atualizar contrato', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // DELETE - Excluir contrato
  app.delete('/api/contratos/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM contratos WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Contrato não encontrado', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
      res.status(500).json({ error: 'Erro ao excluir contrato', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // ENDPOINTS DE PROJETOS
  // ===================================

  // GET - Listar projetos por produto (aplicação)
  app.get('/api/projetos', async (req, res) => {
    try {
      const { produto } = req.query;
      
      let query = 'SELECT * FROM estruturas_projeto';
      const params = [];
      
      if (produto) {
        query += ' WHERE produto = ?';
        params.push(produto);
      }
      
      query += ' ORDER BY data_criacao DESC';
      
      const [rows] = await pool.query(query, params);
      
      // Formatar dados para camelCase
      const projetos = rows.map(row => ({
        id: row.id,
        produto: row.produto,
        projeto: row.projeto,
        workItemProcess: row.work_item_process,
        dataInicial: row.data_inicial,
        iteracao: row.iteracao,
        incluirQuery: row.incluir_query,
        incluirMaven: row.incluir_maven,
        incluirLiquibase: row.incluir_liquibase,
        criarTimeSustentacao: row.criar_time_sustentacao,
        repositorios: row.repositorios,
        estruturasGeradas: row.estruturas_geradas,
        nomeTime: row.nome_time,
        numeroSemanas: row.numero_semanas,
        iteracaoMensal: row.iteracao_mensal,
        status: row.status,
        urlProjeto: row.url_projeto,
        aplicacaoBaseId: row.aplicacao_base_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(projetos);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      res.status(500).json({ error: 'Erro ao buscar projetos', code: 'DATABASE_ERROR' });
    }
  });

  // ==================== DOCUMENTAÇÃO DE PROJETOS ====================
  
  // GET /api/documentacao-projetos - Listar todas as documentações
  app.get('/api/documentacao-projetos', async (req, res) => {
    try {
      const { categoria, status, search } = req.query;
      
      let query = `
        SELECT 
          d.*,
          a.sigla as aplicacao_nome
        FROM documentacao_projetos d
        LEFT JOIN aplicacoes a ON d.aplicacao_id = a.id
        WHERE 1=1
      `;
      const params = [];
      
      if (categoria) {
        query += ' AND d.categoria = ?';
        params.push(categoria);
      }
      
      if (status) {
        query += ' AND d.status = ?';
        params.push(status);
      }
      
      if (search) {
        query += ' AND (MATCH(d.titulo, d.descricao, d.conteudo) AGAINST (? IN NATURAL LANGUAGE MODE) OR d.tags LIKE ?)';
        params.push(search, `%${search}%`);
      }
      
      query += ' ORDER BY d.data_ultima_atualizacao DESC';
      
      const [rows] = await pool.query(query, params);
      
      // Formatar dados para camelCase e parsear JSON
      const docs = rows.map(row => ({
        id: row.id,
        titulo: row.titulo,
        slug: row.slug,
        descricao: row.descricao,
        conteudo: row.conteudo,
        categoria: row.categoria,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags,
        versao: row.versao,
        autor: row.autor,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        status: row.status,
        dataPublicacao: row.data_publicacao,
        dataUltimaAtualizacao: row.data_ultima_atualizacao,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(docs);
    } catch (error) {
      console.error('Erro ao buscar documentações:', error);
      res.status(500).json({ error: 'Erro ao buscar documentações' });
    }
  });

  // GET /api/documentacao-projetos/:id - Buscar documentação por ID
  app.get('/api/documentacao-projetos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.query(
        `SELECT 
          d.*,
          a.sigla as aplicacao_nome
        FROM documentacao_projetos d
        LEFT JOIN aplicacoes a ON d.aplicacao_id = a.id
        WHERE d.id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Documentação não encontrada' });
      }
      
      const doc = {
        id: rows[0].id,
        titulo: rows[0].titulo,
        slug: rows[0].slug,
        descricao: rows[0].descricao,
        conteudo: rows[0].conteudo,
        categoria: rows[0].categoria,
        tags: JSON.parse(rows[0].tags || '[]'),
        versao: rows[0].versao,
        autor: rows[0].autor,
        projeto: rows[0].projeto,
        status: rows[0].status,
        dataPublicacao: rows[0].data_publicacao,
        dataUltimaAtualizacao: rows[0].data_ultima_atualizacao,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
      
      res.json(doc);
    } catch (error) {
      console.error('Erro ao buscar documentação:', error);
      res.status(500).json({ error: 'Erro ao buscar documentação' });
    }
  });

  // GET /api/documentacao-projetos/slug/:slug - Buscar documentação por slug
  app.get('/api/documentacao-projetos/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      
      const [rows] = await pool.query(
        `SELECT 
          d.*,
          a.sigla as aplicacao_nome
        FROM documentacao_projetos d
        LEFT JOIN aplicacoes a ON d.aplicacao_id = a.id
        WHERE d.slug = ?`,
        [slug]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Documentação não encontrada' });
      }
      
      const doc = {
        id: rows[0].id,
        titulo: rows[0].titulo,
        slug: rows[0].slug,
        descricao: rows[0].descricao,
        conteudo: rows[0].conteudo,
        categoria: rows[0].categoria,
        tags: JSON.parse(rows[0].tags || '[]'),
        versao: rows[0].versao,
        autor: rows[0].autor,
        projeto: rows[0].projeto,
        status: rows[0].status,
        dataPublicacao: rows[0].data_publicacao,
        dataUltimaAtualizacao: rows[0].data_ultima_atualizacao,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
      
      res.json(doc);
    } catch (error) {
      console.error('Erro ao buscar documentação:', error);
      res.status(500).json({ error: 'Erro ao buscar documentação' });
    }
  });

  // POST /api/documentacao-projetos - Criar nova documentação
  app.post('/api/documentacao-projetos', async (req, res) => {
    try {
      const {
        titulo,
        slug,
        descricao,
        conteudo,
        categoria,
        tags,
        versao,
        autor,
        aplicacaoId,
        status
      } = req.body;
      
      // Validações
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
      
      if (!slug || !slug.trim()) {
        return res.status(400).json({ error: 'Slug é obrigatório' });
      }
      
      if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
      }
      
      if (!autor || !autor.trim()) {
        return res.status(400).json({ error: 'Autor é obrigatório' });
      }
      
      const id = uuidv4();
      const tagsJson = JSON.stringify(tags || []);
      const dataPublicacao = status === 'Publicado' ? new Date() : null;
      
      await pool.query(
        `INSERT INTO documentacao_projetos (
          id, titulo, slug, descricao, conteudo, categoria, tags,
          versao, autor, aplicacao_id, status, data_publicacao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, titulo, slug, descricao, conteudo, categoria, tagsJson, versao, autor, aplicacaoId, status, dataPublicacao]
      );
      
      const [rows] = await pool.query(
        `SELECT 
          d.*,
          a.sigla as aplicacao_nome
        FROM documentacao_projetos d
        LEFT JOIN aplicacoes a ON d.aplicacao_id = a.id
        WHERE d.id = ?`,
        [id]
      );
      
      const doc = {
        id: rows[0].id,
        titulo: rows[0].titulo,
        slug: rows[0].slug,
        descricao: rows[0].descricao,
        conteudo: rows[0].conteudo,
        categoria: rows[0].categoria,
        tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
        versao: rows[0].versao,
        autor: rows[0].autor,
        aplicacaoId: rows[0].aplicacao_id,
        aplicacaoNome: rows[0].aplicacao_nome,
        status: rows[0].status,
        dataPublicacao: rows[0].data_publicacao,
        dataUltimaAtualizacao: rows[0].data_ultima_atualizacao,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
      
      res.status(201).json(doc);
    } catch (error) {
      console.error('Erro ao criar documentação:', error);
      console.error('Stack trace:', error.stack);
      console.error('Dados recebidos:', req.body);
      
      // Tratamento de erro de slug duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Já existe uma documentação com este slug',
          code: 'DUPLICATE_SLUG' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao criar documentação',
        message: error.message,
        details: error.toString()
      });
    }
  });

  // PUT /api/documentacao-projetos/:id - Atualizar documentação
  app.put('/api/documentacao-projetos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        titulo,
        slug,
        descricao,
        conteudo,
        categoria,
        tags,
        versao,
        autor,
        aplicacaoId,
        status
      } = req.body;
      
      // Validações
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
      
      if (!slug || !slug.trim()) {
        return res.status(400).json({ error: 'Slug é obrigatório' });
      }
      
      if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
      }
      
      if (!autor || !autor.trim()) {
        return res.status(400).json({ error: 'Autor é obrigatório' });
      }
      
      // Verificar se existe
      const [existing] = await pool.query('SELECT * FROM documentacao_projetos WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Documentação não encontrada' });
      }
      
      const tagsJson = JSON.stringify(tags || []);
      const dataPublicacao = status === 'Publicado' && existing[0].status !== 'Publicado' 
        ? new Date() 
        : existing[0].data_publicacao;
      
      await pool.query(
        `UPDATE documentacao_projetos SET
          titulo = ?, slug = ?, descricao = ?, conteudo = ?, categoria = ?,
          tags = ?, versao = ?, autor = ?, aplicacao_id = ?, status = ?,
          data_publicacao = ?, data_ultima_atualizacao = NOW()
        WHERE id = ?`,
        [titulo, slug, descricao, conteudo, categoria, tagsJson, versao, autor, aplicacaoId, status, dataPublicacao, id]
      );
      
      const [rows] = await pool.query(
        `SELECT 
          d.*,
          a.sigla as aplicacao_nome
        FROM documentacao_projetos d
        LEFT JOIN aplicacoes a ON d.aplicacao_id = a.id
        WHERE d.id = ?`,
        [id]
      );
      
      const doc = {
        id: rows[0].id,
        titulo: rows[0].titulo,
        slug: rows[0].slug,
        descricao: rows[0].descricao,
        conteudo: rows[0].conteudo,
        categoria: rows[0].categoria,
        tags: typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags || '[]') : rows[0].tags,
        versao: rows[0].versao,
        autor: rows[0].autor,
        aplicacaoId: rows[0].aplicacao_id,
        aplicacaoNome: rows[0].aplicacao_nome,
        status: rows[0].status,
        dataPublicacao: rows[0].data_publicacao,
        dataUltimaAtualizacao: rows[0].data_ultima_atualizacao,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      };
      
      res.json(doc);
    } catch (error) {
      console.error('Erro ao atualizar documentação:', error);
      
      // Tratamento de erro de slug duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Já existe uma documentação com este slug',
          code: 'DUPLICATE_SLUG' 
        });
      }
      
      res.status(500).json({ 
        error: 'Erro ao atualizar documentação',
        message: error.message 
      });
    }
  });

  // DELETE /api/documentacao-projetos/:id - Deletar documentação
  app.delete('/api/documentacao-projetos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [result] = await pool.query('DELETE FROM documentacao_projetos WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Documentação não encontrada' });
      }
      
      res.json({ message: 'Documentação deletada com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar documentação:', error);
      res.status(500).json({ error: 'Erro ao deletar documentação' });
    }
  });

  // ==================== PESQUISA POR PERÍODO ====================
  
  // GET /api/pesquisa/afastamentos - Buscar colaboradores ativos com afastamentos no período
  app.get('/api/pesquisa/afastamentos', async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
      }
      
      const query = `
        SELECT 
          c.id as colaborador_id,
          c.nome as colaborador_nome,
          ta.descricao as tipo_afastamento,
          a.inicial_provavel as data_inicial,
          a.final_provavel as data_final,
          CASE 
            WHEN a.final_provavel >= CURDATE() THEN 'Ativo'
            ELSE 'Finalizado'
          END as status
        FROM afastamentos a
        INNER JOIN colaboradores c ON a.colaborador_id = c.id
        INNER JOIN tipos_afastamento ta ON a.tipo_afastamento_id = ta.id
        WHERE c.data_demissao IS NULL
          AND (
            (a.inicial_provavel BETWEEN ? AND ?)
            OR (a.final_provavel BETWEEN ? AND ?)
            OR (a.inicial_provavel <= ? AND a.final_provavel >= ?)
          )
        ORDER BY a.inicial_provavel, c.nome
      `;
      
      const [rows] = await pool.query(query, [
        dataInicio, dataFim,
        dataInicio, dataFim,
        dataInicio, dataFim
      ]);
      
      const resultados = rows.map(row => ({
        colaboradorId: row.colaborador_id,
        colaboradorNome: row.colaborador_nome,
        tipoAfastamento: row.tipo_afastamento,
        dataInicial: row.data_inicial,
        dataFinal: row.data_final,
        status: row.status
      }));
      
      res.json(resultados);
    } catch (error) {
      console.error('Erro ao buscar afastamentos:', error);
      res.status(500).json({ error: 'Erro ao buscar afastamentos' });
    }
  });

  // GET /api/pesquisa/contratos-tecnologias - Buscar contratos de tecnologias com vencimento no período
  app.get('/api/pesquisa/contratos-tecnologias', async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
      }
      
      const query = `
        SELECT 
          t.id as tecnologia_id,
          t.sigla as tecnologia_sigla,
          t.nome as tecnologia_nome,
          tc.numero_contrato,
          tc.vigencia_inicial,
          tc.vigencia_termino,
          tc.valor_contrato,
          tc.status
        FROM tecnologia_contratos tc
        INNER JOIN tecnologias t ON tc.tecnologia_id = t.id
        WHERE tc.vigencia_termino BETWEEN ? AND ?
        ORDER BY tc.vigencia_termino, t.sigla
      `;
      
      const [rows] = await pool.query(query, [dataInicio, dataFim]);
      
      const resultados = rows.map(row => ({
        tecnologiaId: row.tecnologia_id,
        tecnologiaSigla: row.tecnologia_sigla,
        tecnologiaNome: row.tecnologia_nome,
        numeroContrato: row.numero_contrato,
        vigenciaInicial: row.vigencia_inicial,
        vigenciaTermino: row.vigencia_termino,
        valorContrato: parseFloat(row.valor_contrato),
        status: row.status
      }));
      
      res.json(resultados);
    } catch (error) {
      console.error('Erro ao buscar contratos de tecnologias:', error);
      res.status(500).json({ error: 'Erro ao buscar contratos de tecnologias' });
    }
  });

  // GET /api/pesquisa/checkpoints - Buscar checkpoints por período
  app.get('/api/pesquisa/checkpoints', async (req, res) => {
    try {
      const { dataInicio, dataFim } = req.query;
      
      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
      }
      
      const query = `
        SELECT 
          c.id,
          c.descricao,
          c.categoria,
          c.data_prevista,
          c.status,
          a.sigla as aplicacao_sigla
        FROM checkpoints c
        LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
        WHERE c.data_prevista BETWEEN ? AND ?
        ORDER BY c.data_prevista ASC
      `;
      
      const [rows] = await pool.query(query, [dataInicio, dataFim]);
      
      const resultados = rows.map(row => ({
        id: row.id,
        aplicacaoSigla: row.aplicacao_sigla,
        descricao: row.descricao,
        categoria: row.categoria,
        dataPrevista: row.data_prevista,
        status: row.status
      }));
      
      res.json(resultados);
    } catch (error) {
      console.error('Erro ao buscar checkpoints:', error);
      res.status(500).json({ error: 'Erro ao buscar checkpoints' });
    }
  });

  // GET /api/pesquisa/logs-operacoes - Buscar logs de operações de usuários
  app.get('/api/pesquisa/logs-operacoes', async (req, res) => {
    try {
      const { dataInicio, dataFim, usuarioId, tipoEvento } = req.query;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({ error: 'Data de início e término são obrigatórias' });
      }

      // Construir query dinâmica com filtros opcionais
      let query = `
        SELECT 
          l.id,
          l.usuario_id,
          l.email,
          l.tipo_evento,
          l.ip_origem,
          l.user_agent,
          l.sucesso,
          l.detalhes,
          l.created_at
        FROM logs_acesso l
        WHERE DATE(l.created_at) BETWEEN ? AND ?
      `;

      const params = [dataInicio, dataFim];

      // Adicionar filtro de usuário se informado
      if (usuarioId) {
        query += ' AND l.usuario_id = ?';
        params.push(usuarioId);
      }

      // Adicionar filtro de tipo de evento se informado
      if (tipoEvento && tipoEvento !== 'TODOS') {
        query += ' AND l.tipo_evento = ?';
        params.push(tipoEvento);
      }

      query += ' ORDER BY l.created_at DESC LIMIT 1000';

      const [rows] = await pool.query(query, params);

      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar logs de operações:', error);
      res.status(500).json({ error: 'Erro ao buscar logs de operações' });
    }
  });

  // ==================== NOTIFICAÇÕES ====================
  
  // GET /api/notificacoes - Listar todas as notificações
  app.get('/api/notificacoes', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          id,
          data_recebimento as data,
          de,
          subject,
          conteudo,
          lido as lida,
          '' as para,
          aplicacao_id as aplicacaoId,
          aplicacao_sigla as aplicacaoSigla,
          email
        FROM notificacoes 
        ORDER BY data_recebimento DESC
      `);
      
      res.json(rows);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
  });

  // POST /api/notificacoes/sync - Sincronizar e-mails
  app.post('/api/notificacoes/sync', async (req, res) => {
    try {
      // Buscar configurações de e-mail
      const [configRows] = await pool.query(`
        SELECT valor FROM configuracoes WHERE chave = 'email-notifications'
      `);
      
      if (configRows.length === 0) {
        return res.status(400).json({ error: 'Configurações de e-mail não encontradas' });
      }
      
      const emailConfig = JSON.parse(configRows[0].valor);
      
      // Aqui você implementaria a lógica de leitura de e-mails
      // Por enquanto, vamos retornar um mock
      res.json({ novos: 0, mensagem: 'Sincronização de e-mails não implementada' });
    } catch (error) {
      console.error('Erro ao sincronizar e-mails:', error);
      res.status(500).json({ error: 'Erro ao sincronizar e-mails' });
    }
  });

  // PUT /api/notificacoes/:id/lida - Marcar como lida
  app.put('/api/notificacoes/:id/lida', async (req, res) => {
    try {
      const { id } = req.params;
      
      await pool.query(`
        UPDATE notificacoes 
        SET lido = TRUE 
        WHERE id = ?
      `, [id]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
  });

  // DELETE /api/notificacoes/:id - Deletar notificação
  app.delete('/api/notificacoes/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      await pool.query('DELETE FROM notificacoes WHERE id = ?', [id]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
      res.status(500).json({ error: 'Erro ao deletar notificação' });
    }
  });

  // ===== ENDPOINTS GMAIL OAUTH =====

  // GET /api/gmail/auth-url - Gerar URL de autenticação OAuth do Gmail
  app.get('/api/gmail/auth-url', async (req, res) => {
    try {
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['gmail-config']
      );
      
      let gmailConfig = {};
      if (configRows.length > 0) {
        gmailConfig = JSON.parse(configRows[0].valor);
      }

      if (!gmailConfig.clientId || !gmailConfig.clientSecret) {
        return res.status(400).json({ 
          error: 'Credenciais do Gmail não configuradas. Configure Client ID e Client Secret primeiro.' 
        });
      }

      const { google } = await import('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        gmailConfig.clientId,
        gmailConfig.clientSecret,
        `${req.protocol}://${req.get('host')}/api/gmail/oauth-callback`
      );

      const scopes = [
        gmailConfig.scope === 'gmail.modify' 
          ? 'https://www.googleapis.com/auth/gmail.modify'
          : gmailConfig.scope === 'mail.google.com'
          ? 'https://mail.google.com/'
          : 'https://www.googleapis.com/auth/gmail.readonly'
      ];

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: gmailConfig.accessType || 'offline',
        scope: scopes,
        prompt: 'consent'
      });

      res.json({ authUrl });
    } catch (error) {
      console.error('Erro ao gerar URL de autenticação:', error);
      res.status(500).json({ error: 'Erro ao gerar URL de autenticação: ' + error.message });
    }
  });

  // GET /api/gmail/oauth-callback - Callback OAuth do Gmail
  app.get('/api/gmail/oauth-callback', async (req, res) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).send('Código de autorização não fornecido');
      }

      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['gmail-config']
      );
      
      if (configRows.length === 0) {
        return res.status(400).send('Configurações do Gmail não encontradas');
      }

      const gmailConfig = JSON.parse(configRows[0].valor);

      const { google } = await import('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        gmailConfig.clientId,
        gmailConfig.clientSecret,
        `${req.protocol}://${req.get('host')}/api/gmail/oauth-callback`
      );

      const { tokens } = await oauth2Client.getToken(code);
      
      // Salvar tokens no banco
      gmailConfig.accessToken = tokens.access_token;
      gmailConfig.refreshToken = tokens.refresh_token;
      gmailConfig.expiryDate = tokens.expiry_date;

      await pool.query(
        'UPDATE configuracoes SET valor = ?, updated_at = NOW() WHERE chave = ?',
        [JSON.stringify(gmailConfig), 'gmail-config']
      );

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Autenticação Gmail Concluída</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .success-box {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            .success-icon {
              font-size: 48px;
              color: #22c55e;
              margin-bottom: 16px;
            }
            h1 { color: #22c55e; margin: 0 0 16px 0; }
            p { color: #666; margin: 8px 0; }
            button {
              margin-top: 24px;
              padding: 12px 24px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="success-box">
            <div class="success-icon">✓</div>
            <h1>Autenticação Concluída!</h1>
            <p>Sua conta Gmail foi conectada com sucesso.</p>
            <p>Você já pode fechar esta janela e voltar para o sistema.</p>
            <button onclick="window.close()">Fechar</button>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Erro no callback OAuth:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Erro na Autenticação</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0;
              background: #f5f5f5;
            }
            .error-box {
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            .error-icon {
              font-size: 48px;
              color: #ef4444;
              margin-bottom: 16px;
            }
            h1 { color: #ef4444; margin: 0 0 16px 0; }
            p { color: #666; margin: 8px 0; }
            .error-details {
              background: #fee;
              padding: 12px;
              border-radius: 4px;
              margin-top: 16px;
              font-family: monospace;
              font-size: 12px;
              color: #c00;
            }
          </style>
        </head>
        <body>
          <div class="error-box">
            <div class="error-icon">✗</div>
            <h1>Erro na Autenticação</h1>
            <p>Não foi possível completar a autenticação com o Gmail.</p>
            <div class="error-details">${error.message}</div>
          </div>
        </body>
        </html>
      `);
    }
  });

  // POST /api/gmail/save-config - Salvar configurações do Gmail
  app.post('/api/gmail/save-config', async (req, res) => {
    try {
      const { clientId, clientSecret, scope, accessType, filterSubjects } = req.body;

      if (!clientId || !clientSecret) {
        return res.status(400).json({ 
          error: 'Client ID e Client Secret são obrigatórios' 
        });
      }

      const gmailConfig = {
        clientId,
        clientSecret,
        scope: scope || 'gmail.readonly',
        accessType: accessType || 'offline',
        filterSubjects: filterSubjects || []
      };

      // Verificar se já existe configuração
      const [existing] = await pool.query(
        'SELECT id FROM configuracoes WHERE chave = ?',
        ['gmail-config']
      );

      if (existing.length > 0) {
        // Atualizar configuração existente preservando tokens se já existirem
        const [current] = await pool.query(
          'SELECT valor FROM configuracoes WHERE chave = ?',
          ['gmail-config']
        );
        const currentConfig = JSON.parse(current[0].valor);
        
        // Preservar tokens se existirem
        if (currentConfig.accessToken) gmailConfig.accessToken = currentConfig.accessToken;
        if (currentConfig.refreshToken) gmailConfig.refreshToken = currentConfig.refreshToken;
        if (currentConfig.expiryDate) gmailConfig.expiryDate = currentConfig.expiryDate;

        await pool.query(
          'UPDATE configuracoes SET valor = ?, updated_at = NOW() WHERE chave = ?',
          [JSON.stringify(gmailConfig), 'gmail-config']
        );
      } else {
        // Inserir nova configuração
        await pool.query(
          'INSERT INTO configuracoes (id, chave, valor, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [uuidv4(), 'gmail-config', JSON.stringify(gmailConfig)]
        );
      }

      res.json({ 
        success: true, 
        message: 'Configurações do Gmail salvas com sucesso',
        needsAuth: !gmailConfig.refreshToken 
      });
    } catch (error) {
      console.error('Erro ao salvar configurações do Gmail:', error);
      res.status(500).json({ error: 'Erro ao salvar configurações: ' + error.message });
    }
  });

  // GET /api/gmail/config - Buscar configurações do Gmail
  app.get('/api/gmail/config', async (req, res) => {
    try {
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['gmail-config']
      );
      
      if (configRows.length === 0) {
        return res.json({ 
          configured: false,
          config: {
            clientId: '',
            clientSecret: '',
            scope: 'gmail.readonly',
            accessType: 'offline',
            filterSubjects: []
          }
        });
      }

      const gmailConfig = JSON.parse(configRows[0].valor);
      
      // Não enviar tokens sensíveis para o frontend
      const safeConfig = {
        clientId: gmailConfig.clientId || '',
        clientSecret: gmailConfig.clientSecret ? '••••••••••••••••' : '',
        scope: gmailConfig.scope || 'gmail.readonly',
        accessType: gmailConfig.accessType || 'offline',
        filterSubjects: gmailConfig.filterSubjects || [],
        hasRefreshToken: !!gmailConfig.refreshToken,
        authenticated: !!gmailConfig.refreshToken
      };

      res.json({ 
        configured: true,
        config: safeConfig
      });
    } catch (error) {
      console.error('Erro ao buscar configurações do Gmail:', error);
      res.status(500).json({ error: 'Erro ao buscar configurações: ' + error.message });
    }
  });

  // POST /api/notificacoes/buscar-emails - Buscar e-mails e salvar como notificações via Microsoft Graph API e Gmail API
  app.post('/api/notificacoes/buscar-emails', async (req, res) => {
    try {
      let todosEmailsEncontrados = [];
      let notificacoesInseridas = 0;
      const resultados = { outlook: 0, gmail: 0, total: 0 };

      // ========== BUSCAR NO OUTLOOK (Microsoft Graph API) ==========
      try {
        const [configRowsOutlook] = await pool.query(
          'SELECT valor FROM configuracoes WHERE chave = ?',
          ['email-notifications']
        );
        
        if (configRowsOutlook.length > 0) {
          const emailConfig = JSON.parse(configRowsOutlook[0].valor);
          
          // Validar se tem as configurações necessárias
          if (emailConfig.tenantId && emailConfig.clientId && emailConfig.clientSecret && emailConfig.emailCaixa) {
            console.log('[Outlook] Conectando ao Microsoft Graph API...');

            // Importar bibliotecas do Graph API dinamicamente
            const { Client } = await import('@microsoft/microsoft-graph-client');
            const { ClientSecretCredential } = await import('@azure/identity');

            // Criar credencial com Client Credentials Flow
            const credential = new ClientSecretCredential(
              emailConfig.tenantId,
              emailConfig.clientId,
              emailConfig.clientSecret
            );

            // Obter token de acesso
            const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');

            // Criar cliente do Graph
            const client = Client.init({
              authProvider: (done) => {
                done(null, tokenResponse.token);
              }
            });

            // Calcular data de corte (últimos 30 dias)
            const dataCutoff = new Date();
            dataCutoff.setDate(dataCutoff.getDate() - 30);
            const filterDate = dataCutoff.toISOString();

            // Buscar e-mails não lidos da caixa
            let messagesQuery = `/users/${emailConfig.emailCaixa}/messages?$filter=isRead eq false and receivedDateTime ge ${filterDate}`;
            
            // Adicionar filtros de assunto se configurados
            if (emailConfig.filterSubjects && Array.isArray(emailConfig.filterSubjects) && emailConfig.filterSubjects.length > 0) {
              const subjectFilters = emailConfig.filterSubjects
                .map(fs => `contains(subject,'${fs.subject.replace(/'/g, "''")}')`)
                .join(' or ');
              messagesQuery += ` and (${subjectFilters})`;
            }

            messagesQuery += '&$select=id,receivedDateTime,from,subject,bodyPreview,body&$top=50';

            console.log('[Outlook] Buscando e-mails...');

            const messages = await client.api(messagesQuery).get();

            console.log(`[Outlook] Encontrados ${messages.value?.length || 0} e-mails`);

            for (const message of messages.value || []) {
              const filterMatch = emailConfig.filterSubjects?.find(fs => 
                message.subject && message.subject.includes(fs.subject)
              );

              todosEmailsEncontrados.push({
                id: uuidv4(),
                de: message.from?.emailAddress?.address || 'Desconhecido',
                subject: message.subject || 'Sem assunto',
                conteudo: (message.body?.content || message.bodyPreview || 'Sem conteúdo').substring(0, 5000),
                data_recebimento: new Date(message.receivedDateTime),
                aplicacao_id: filterMatch?.aplicacaoId || null,
                aplicacao_sigla: filterMatch?.aplicacaoSigla || null,
                email: emailConfig.emailCaixa || null,
                fonte: 'Outlook'
              });
            }
            
            resultados.outlook = messages.value?.length || 0;
          } else {
            console.log('[Outlook] Configurações incompletas, pulando busca no Outlook');
          }
        }
      } catch (errorOutlook) {
        console.error('[Outlook] Erro ao buscar e-mails:', errorOutlook.message);
        // Continua para tentar o Gmail
      }

      // ========== BUSCAR NO GMAIL ==========
      try {
        const [configRowsGmail] = await pool.query(
          'SELECT valor FROM configuracoes WHERE chave = ?',
          ['gmail-config']
        );
        
        if (configRowsGmail.length > 0) {
          const gmailConfig = JSON.parse(configRowsGmail[0].valor);
          
          // Validar se tem as configurações necessárias
          if (gmailConfig.clientId && gmailConfig.clientSecret && gmailConfig.refreshToken) {
            console.log('[Gmail] Conectando ao Gmail API...');

            const { google } = await import('googleapis');
            
            const oauth2Client = new google.auth.OAuth2(
              gmailConfig.clientId,
              gmailConfig.clientSecret,
              'http://localhost'
            );

            oauth2Client.setCredentials({
              refresh_token: gmailConfig.refreshToken
            });

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

            // Calcular data de corte (últimos 30 dias)
            const dataCutoff = new Date();
            dataCutoff.setDate(dataCutoff.getDate() - 30);
            const afterDate = Math.floor(dataCutoff.getTime() / 1000);

            // Buscar e-mails não lidos
            let query = `is:unread after:${afterDate}`;
            
            // Adicionar filtros de assunto se configurados
            if (gmailConfig.filterSubjects && Array.isArray(gmailConfig.filterSubjects) && gmailConfig.filterSubjects.length > 0) {
              const subjectQuery = gmailConfig.filterSubjects
                .map(fs => `subject:"${fs.subject}"`)
                .join(' OR ');
              query += ` (${subjectQuery})`;
            }

            console.log('[Gmail] Query:', query);

            const response = await gmail.users.messages.list({
              userId: 'me',
              q: query,
              maxResults: 50
            });

            const messages = response.data.messages || [];
            console.log(`[Gmail] Encontrados ${messages.length} e-mails`);

            for (const message of messages) {
              // Buscar detalhes da mensagem
              const msgDetail = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full'
              });

              const headers = msgDetail.data.payload.headers;
              const subject = headers.find(h => h.name === 'Subject')?.value || 'Sem assunto';
              const from = headers.find(h => h.name === 'From')?.value || 'Desconhecido';
              const date = headers.find(h => h.name === 'Date')?.value;

              // Extrair conteúdo
              let body = '';
              if (msgDetail.data.payload.body.data) {
                body = Buffer.from(msgDetail.data.payload.body.data, 'base64').toString('utf-8');
              } else if (msgDetail.data.payload.parts) {
                const textPart = msgDetail.data.payload.parts.find(p => p.mimeType === 'text/plain');
                if (textPart?.body?.data) {
                  body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                }
              }

              // Encontrar a aplicação correspondente ao subject
              const filterMatch = gmailConfig.filterSubjects?.find(fs => 
                subject && subject.includes(fs.subject)
              );

              todosEmailsEncontrados.push({
                id: uuidv4(),
                de: from,
                subject: subject,
                conteudo: (msgDetail.data.snippet || body || 'Sem conteúdo').substring(0, 5000),
                data_recebimento: date ? new Date(date) : new Date(),
                aplicacao_id: filterMatch?.aplicacaoId || null,
                aplicacao_sigla: filterMatch?.aplicacaoSigla || null,
                email: 'gmail',
                fonte: 'Gmail'
              });
            }
            
            resultados.gmail = messages.length;
          } else {
            console.log('[Gmail] Configurações incompletas, pulando busca no Gmail');
          }
        }
      } catch (errorGmail) {
        console.error('[Gmail] Erro ao buscar e-mails:', errorGmail.message);
        // Continua mesmo com erro
      }

      // ========== SALVAR NOTIFICAÇÕES NO BANCO ==========
      for (const email of todosEmailsEncontrados) {
        // Verificar se já existe
        const [existing] = await pool.query(
          'SELECT id FROM notificacoes WHERE subject = ? AND de = ? AND DATE(data_recebimento) = DATE(?)',
          [email.subject, email.de, email.data_recebimento]
        );
        
        if (existing.length === 0) {
          await pool.query(
            'INSERT INTO notificacoes (id, data_recebimento, de, subject, conteudo, lido, aplicacao_id, aplicacao_sigla, email) VALUES (?, ?, ?, ?, ?, FALSE, ?, ?, ?)',
            [email.id, email.data_recebimento, email.de, email.subject, email.conteudo, email.aplicacao_id, email.aplicacao_sigla, email.email]
          );
          notificacoesInseridas++;
        }
      }
      
      resultados.total = notificacoesInseridas;

      let message = `${notificacoesInseridas} nova(s) notificação(ões) encontrada(s)`;
      if (resultados.outlook > 0 || resultados.gmail > 0) {
        message += ` (Outlook: ${resultados.outlook}, Gmail: ${resultados.gmail})`;
      }
      
      res.json({ 
        success: true, 
        message,
        resultados
      });
    } catch (error) {
      console.error('Erro ao buscar e-mails:', error);
      res.status(500).json({ error: 'Erro ao buscar e-mails: ' + error.message });
    }
  });

  // ===== ENDPOINTS AZURE WORK ITEMS =====

  // GET /api/azure-work-items - Buscar work items com filtros
  app.get('/api/azure-work-items', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { projetoId, projetoNome, state, workItemType } = req.query;
      
      let query = `
        SELECT 
          id, projeto_id as projetoId, projeto_nome as projetoNome,
          time_nome as timeNome, work_item_id as workItemId,
          work_item_type as workItemType, title, state, assigned_to as assignedTo,
          activity, area_path as areaPath, iteration_path as iterationPath,
          created_date as createdDate, changed_date as changedDate,
          closed_date as closedDate, priority, effort, remaining_work as remainingWork,
          completed_work as completedWork, story_points as storyPoints,
          url, sync_date as syncDate, created_at as createdAt,
          updated_at as updatedAt
        FROM azure_work_items
        WHERE 1=1
      `;
      const params = [];
      
      if (projetoId) {
        query += ' AND projeto_id = ?';
        params.push(projetoId);
      }
      
      if (projetoNome) {
        query += ' AND projeto_nome LIKE ?';
        params.push(`%${projetoNome}%`);
      }
      
      if (state) {
        query += ' AND state = ?';
        params.push(state);
      }
      
      if (workItemType) {
        query += ' AND work_item_type = ?';
        params.push(workItemType);
      }
      
      query += ' ORDER BY changed_date DESC';
      
      const [workItems] = await pool.execute(query, params);
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_work_items',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(workItems);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar work items:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_work_items',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar work items: ' + error.message });
    }
  });

  // GET /api/azure-work-items/:id/historico - Buscar histórico de um work item
  app.get('/api/azure-work-items/:id/historico', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { id } = req.params;
      
      const [historico] = await pool.execute(
        `SELECT 
          id, work_item_table_id as workItemTableId, work_item_id as workItemId,
          projeto_nome as projetoNome, campo_alterado as campoAlterado,
          valor_anterior as valorAnterior, valor_novo as valorNovo,
          alterado_por as alteradoPor, data_alteracao as dataAlteracao,
          sync_date as syncDate, created_at as createdAt
        FROM azure_work_items_historico
        WHERE work_item_table_id = ?
        ORDER BY data_alteracao DESC`,
        [id]
      );
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_work_items_historico',
        entityId: id,
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(historico);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar histórico:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_work_items_historico',
        entityId: req.params.id,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar histórico: ' + error.message });
    }
  });

  // POST /api/azure-work-items/sync/:projetoId - Sincronizar work items de um projeto
  app.post('/api/azure-work-items/sync/:projetoId', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { projetoId } = req.params;
      
      // Buscar configurações do Azure DevOps
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['integration-config']
      );
      
      if (configRows.length === 0) {
        return res.status(400).json({ 
          error: 'Configurações não encontradas. Configure em Configurações > Azure DevOps.' 
        });
      }
      
      const integrationConfig = JSON.parse(configRows[0].valor);
      const azureConfig = integrationConfig.azureDevOps;
      
      if (!azureConfig || !azureConfig.urlOrganizacao) {
        return res.status(400).json({ 
          error: 'URL da Organização não configurada. Configure em Configurações > Azure DevOps.' 
        });
      }
      
      if (!azureConfig.personalAccessToken) {
        return res.status(400).json({ 
          error: 'Personal Access Token (PAT) não configurado. Configure em Configurações > Azure DevOps.' 
        });
      }
      
      // Extrair organization da URL
      const orgMatch = azureConfig.urlOrganizacao.match(/dev\.azure\.com\/([^\/]+)/);
      if (!orgMatch) {
        return res.status(400).json({ 
          error: 'URL da Organização inválida. Formato esperado: https://dev.azure.com/{organization}/' 
        });
      }
      
      const azureOrganization = orgMatch[1];
      const azurePat = azureConfig.personalAccessToken;
      
      // Buscar informações do projeto
      const [projetos] = await pool.execute(
        `SELECT id, produto, projeto, work_item_process as workItemProcess,
         nome_time as nomeTime, url_projeto as urlProjeto
        FROM estruturas_projeto
        WHERE id = ?`,
        [projetoId]
      );
      
      if (projetos.length === 0) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }
      
      const projeto = projetos[0];
      
      if (!projeto.urlProjeto) {
        return res.status(400).json({ error: 'Projeto não possui URL configurada' });
      }
      
      // Criar log de sincronização
      const syncLogId = uuidv4();
      await pool.execute(
        `INSERT INTO azure_sync_log 
        (id, projeto_id, projeto_nome, inicio_sync, status)
        VALUES (?, ?, ?, NOW(), 'em_progresso')`,
        [syncLogId, projetoId, projeto.projeto]
      );
      
      try {
        // Extrair nome do projeto da URL
        // Formato esperado: https://dev.azure.com/{organization}/{project}
        const urlMatch = projeto.urlProjeto.match(/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
        
        if (!urlMatch) {
          throw new Error('URL do projeto inválida. Formato esperado: https://dev.azure.com/{organization}/{project}');
        }
        
        const projectName = decodeURIComponent(urlMatch[2]);
        
        console.log(`[Azure Sync] Sincronizando projeto: ${projectName} (ID: ${projetoId})`);
        
        // Instanciar serviço do Azure DevOps com configurações globais
        const azureService = new AzureDevOpsService(azureOrganization, azurePat);
        
        // Buscar work items que não estão em estados finais
        // Suporta múltiplos processos: Scrum (Done), Agile/Basic/CMMI (Closed)
        const wiql = {
          query: `
            SELECT [System.Id], [System.WorkItemType], [System.Title], [System.State],
                   [System.AssignedTo], [Microsoft.VSTS.Common.Activity],
                   [System.AreaPath], [System.IterationPath],
                   [System.CreatedDate], [System.ChangedDate],
                   [Microsoft.VSTS.Common.Priority], [Microsoft.VSTS.Scheduling.Effort],
                   [Microsoft.VSTS.Scheduling.RemainingWork],
                   [Microsoft.VSTS.Scheduling.CompletedWork],
                   [Microsoft.VSTS.Scheduling.StoryPoints]
            FROM WorkItems
            WHERE [System.TeamProject] = '${projectName}'
              AND [System.State] <> 'Done'
              AND [System.State] <> 'Closed'
              AND [System.State] <> 'Removed'
              AND [System.State] <> 'Resolved'
            ORDER BY [System.ChangedDate] DESC
          `
        };
        
        const workItemIds = await azureService.queryWorkItems(projectName, wiql);
        
        if (workItemIds.length === 0) {
          await pool.execute(
            `UPDATE azure_sync_log 
            SET fim_sync = NOW(), status = 'sucesso',
                total_work_items = 0, novos_work_items = 0, atualizados_work_items = 0
            WHERE id = ?`,
            [syncLogId]
          );
          
          return res.json({
            success: true,
            message: 'Nenhum work item encontrado',
            stats: { total: 0, novos: 0, atualizados: 0 }
          });
        }
        
        // Buscar detalhes dos work items
        const workItems = await azureService.getWorkItems(workItemIds);
        
        // Função auxiliar para converter data ISO para formato MySQL
        const formatDateForMySQL = (isoDate) => {
          if (!isoDate) return null;
          const date = new Date(isoDate);
          return date.toISOString().slice(0, 19).replace('T', ' ');
        };
        
        let novos = 0;
        let atualizados = 0;
        
        for (const wi of workItems) {
          const workItemId = uuidv4();
          const fields = wi.fields;
          
          // Verificar se já existe
          const [existing] = await pool.execute(
            'SELECT id FROM azure_work_items WHERE projeto_id = ? AND work_item_id = ?',
            [projetoId, wi.id]
          );
          
          if (existing.length === 0) {
            // Inserir novo work item
            await pool.execute(
              `INSERT INTO azure_work_items
              (id, projeto_id, projeto_nome, time_nome, work_item_id, work_item_type,
               title, state, assigned_to, activity, area_path, iteration_path,
               created_date, changed_date, closed_date, priority, effort,
               remaining_work, completed_work, story_points, url, sync_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                workItemId, projetoId, projeto.projeto, projeto.nomeTime || '',
                wi.id, fields['System.WorkItemType'], fields['System.Title'],
                fields['System.State'], fields['System.AssignedTo']?.displayName || null,
                fields['Microsoft.VSTS.Common.Activity'] || null,
                fields['System.AreaPath'] || null, fields['System.IterationPath'] || null,
                formatDateForMySQL(fields['System.CreatedDate']),
                formatDateForMySQL(fields['System.ChangedDate']),
                formatDateForMySQL(fields['System.ClosedDate']),
                fields['Microsoft.VSTS.Common.Priority'] || null,
                fields['Microsoft.VSTS.Scheduling.Effort'] || null,
                fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
                fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
                fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
                wi.url || null
              ]
            );
            
            novos++;
          } else {
            // Atualizar work item existente
            const existingId = existing[0].id;
            
            await pool.execute(
              `UPDATE azure_work_items
              SET title = ?, state = ?, assigned_to = ?, activity = ?,
                  area_path = ?, iteration_path = ?, changed_date = ?,
                  closed_date = ?, priority = ?, effort = ?, remaining_work = ?,
                  completed_work = ?, story_points = ?, sync_date = NOW(),
                  updated_at = NOW()
              WHERE id = ?`,
              [
                fields['System.Title'], fields['System.State'],
                fields['System.AssignedTo']?.displayName || null,
                fields['Microsoft.VSTS.Common.Activity'] || null,
                fields['System.AreaPath'] || null, fields['System.IterationPath'] || null,
                formatDateForMySQL(fields['System.ChangedDate']),
                formatDateForMySQL(fields['System.ClosedDate']),
                fields['Microsoft.VSTS.Common.Priority'] || null,
                fields['Microsoft.VSTS.Scheduling.Effort'] || null,
                fields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
                fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
                fields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
                existingId
              ]
            );
            
            atualizados++;
            
            // Registrar histórico de alterações (se houver revisões)
            if (wi.relations && wi.relations.length > 0) {
              try {
                const revisions = await azureService.getWorkItemRevisions(wi.id);
                
                for (let i = 1; i < revisions.length; i++) {
                  const prev = revisions[i - 1].fields;
                  const curr = revisions[i].fields;
                  const revisedBy = curr['System.ChangedBy']?.displayName || 'Sistema';
                  const revisedDate = curr['System.ChangedDate'];
                  
                  // Detectar campos alterados
                  const fieldsToTrack = [
                    'System.State', 'System.AssignedTo', 'System.Title',
                    'Microsoft.VSTS.Common.Activity', 'Microsoft.VSTS.Scheduling.Effort',
                    'Microsoft.VSTS.Scheduling.RemainingWork', 'Microsoft.VSTS.Scheduling.StoryPoints'
                  ];
                  
                  for (const field of fieldsToTrack) {
                    const oldValue = prev[field];
                    const newValue = curr[field];
                    
                    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                      await pool.execute(
                        `INSERT INTO azure_work_items_historico
                        (id, work_item_table_id, work_item_id, projeto_nome,
                         campo_alterado, valor_anterior, valor_novo, alterado_por, data_alteracao, sync_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                          uuidv4(), existingId, wi.id, projeto.projeto,
                          field, 
                          typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue || ''),
                          typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue || ''),
                          revisedBy, revisedDate
                        ]
                      );
                    }
                  }
                }
              } catch (revError) {
                console.warn(`Erro ao buscar revisões do WI ${wi.id}:`, revError.message);
              }
            }
          }
        }
        
        // Atualizar log de sincronização
        await pool.execute(
          `UPDATE azure_sync_log 
          SET fim_sync = NOW(), status = 'sucesso',
              total_work_items = ?, novos_work_items = ?, atualizados_work_items = ?
          WHERE id = ?`,
          [workItems.length, novos, atualizados, syncLogId]
        );
        
        const durationMs = Date.now() - startTime;
        await logAuditoria(pool, {
          operationType: 'SYNC',
          entityType: 'azure_work_items',
          entityId: projetoId,
          statusCode: 200,
          durationMs,
          newValues: JSON.stringify({ total: workItems.length, novos, atualizados }),
          ...requestInfo
        });
        
        res.json({
          success: true,
          message: `Sincronização concluída com sucesso`,
          stats: {
            total: workItems.length,
            novos,
            atualizados
          }
        });
        
      } catch (syncError) {
        // Atualizar log de sincronização com erro
        await pool.execute(
          `UPDATE azure_sync_log 
          SET fim_sync = NOW(), status = 'erro', erro_mensagem = ?
          WHERE id = ?`,
          [syncError.message, syncLogId]
        );
        
        // Melhorar mensagem de erro para projetos não encontrados
        if (syncError.message.includes('does not exist') || syncError.message.includes('ProjectDoesNotExist')) {
          throw new Error(`Projeto não encontrado no Azure DevOps. Verifique se a URL do projeto está correta e se o projeto existe na organização configurada.`);
        }
        
        throw syncError;
      }
      
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao sincronizar work items:', error);
      
      await logAuditoria(pool, {
        operationType: 'SYNC',
        entityType: 'azure_work_items',
        entityId: req.params.projetoId,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao sincronizar work items: ' + error.message });
    }
  });

  // GET /api/azure-work-items/sync-logs - Buscar logs de sincronização
  app.get('/api/azure-work-items/sync-logs', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { projetoId } = req.query;
      
      let query = `
        SELECT 
          id, projeto_id as projetoId, projeto_nome as projetoNome,
          inicio_sync as inicioSync, fim_sync as fimSync, status,
          total_work_items as totalWorkItems, novos_work_items as novosWorkItems,
          atualizados_work_items as atualizadosWorkItems, erro_mensagem as erroMensagem,
          created_at as createdAt
        FROM azure_sync_log
        WHERE 1=1
      `;
      const params = [];
      
      if (projetoId) {
        query += ' AND projeto_id = ?';
        params.push(projetoId);
      }
      
      query += ' ORDER BY inicio_sync DESC LIMIT 50';
      
      const [logs] = await pool.execute(query, params);
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_sync_log',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(logs);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar logs de sincronização:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'azure_sync_log',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar logs: ' + error.message });
    }
  });

  // POST /api/azure-work-items/sync-all - Sincronizar todos os projetos
  app.post('/api/azure-work-items/sync-all', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      // Buscar todos os projetos com URL configurada
      const [projetos] = await pool.execute(
        `SELECT id, projeto, url_projeto as urlProjeto
        FROM estruturas_projeto
        WHERE url_projeto IS NOT NULL AND url_projeto != ''
        ORDER BY projeto`
      );
      
      if (projetos.length === 0) {
        return res.json({
          success: true,
          message: 'Nenhum projeto com URL configurada',
          results: []
        });
      }
      
      const results = [];
      
      for (const projeto of projetos) {
        try {
          // Fazer requisição interna para sincronizar cada projeto
          const syncUrl = `http://localhost:3000/api/azure-work-items/sync/${projeto.id}`;
          const response = await fetch(syncUrl, { method: 'POST' });
          const result = await response.json();
          
          results.push({
            projetoId: projeto.id,
            projetoNome: projeto.projeto,
            success: response.ok,
            ...result
          });
        } catch (error) {
          results.push({
            projetoId: projeto.id,
            projetoNome: projeto.projeto,
            success: false,
            error: error.message
          });
        }
      }
      
      const totalSuccess = results.filter(r => r.success).length;
      const totalFailed = results.filter(r => !r.success).length;
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'SYNC_ALL',
        entityType: 'azure_work_items',
        statusCode: 200,
        durationMs,
        newValues: JSON.stringify({ totalProjetos: projetos.length, sucesso: totalSuccess, falha: totalFailed }),
        ...requestInfo
      });
      
      res.json({
        success: true,
        message: `Sincronização concluída: ${totalSuccess} sucesso, ${totalFailed} falha`,
        totalProjetos: projetos.length,
        totalSuccess,
        totalFailed,
        results
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao sincronizar todos os projetos:', error);
      
      await logAuditoria(pool, {
        operationType: 'SYNC_ALL',
        entityType: 'azure_work_items',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao sincronizar projetos: ' + error.message });
    }
  });

  // GET /api/azure-work-items/projetos - Buscar projetos disponíveis para sincronização
  app.get('/api/azure-work-items/projetos', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const [projetos] = await pool.execute(
        `SELECT 
          id, produto, projeto, work_item_process as workItemProcess,
          nome_time as nomeTime, data_inicial as dataInicial,
          status, url_projeto as urlProjeto
        FROM estruturas_projeto
        ORDER BY projeto`
      );
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'estruturas_projeto',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(projetos);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar projetos:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'estruturas_projeto',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar projetos: ' + error.message });
    }
  });

  // ===== ENDPOINTS MÉTRICAS DORA =====

  /**
   * GET /api/dora-metrics/unified - Buscar métricas DORA unificadas de todos os projetos
   * 
   * Retorna métricas consolidadas de todos os projetos com URL configurada
   * 
   * IMPORTANTE: Esta rota deve vir ANTES da rota com :projetoId para evitar que "unified" 
   * seja interpretado como um ID de projeto
   */
  app.get('/api/dora-metrics/unified', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { startDate, endDate } = req.query;

      // Buscar todos os projetos com URL configurada
      const [projetos] = await pool.execute(
        `SELECT id, projeto, url_projeto as urlProjeto
        FROM estruturas_projeto
        WHERE url_projeto IS NOT NULL AND url_projeto != ''
        ORDER BY projeto`
      );

      if (projetos.length === 0) {
        return res.json({
          success: true,
          data: {
            totalProjetos: 0,
            periodo: { inicio: startDate, fim: endDate },
            metricas: {}
          }
        });
      }

      const unifiedMetrics = {
        totalProjetos: projetos.length,
        periodo: {
          inicio: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          fim: endDate || new Date().toISOString()
        },
        autores: {}, // Consolidar autores de todos os projetos
        totais: {
          deploymentsCount: 0,
          commitsCount: 0,
          bugCommitsCount: 0,
          featureCommitsCount: 0,
          pullRequestsCount: 0,
          leadTimeAvgMinutes: 0,
          deploymentFrequencyPerDay: 0
        },
        projetos: []
      };

      // Buscar métricas de cada projeto
      for (const projeto of projetos) {
        try {
          const response = await fetch(
            `http://localhost:3000/api/dora-metrics/${projeto.id}?startDate=${unifiedMetrics.periodo.inicio}&endDate=${unifiedMetrics.periodo.fim}`
          );

          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
              unifiedMetrics.projetos.push(result.data);
              
              // Consolidar autores
              if (result.data.autores) {
                for (const [authorKey, authorData] of Object.entries(result.data.autores)) {
                  if (!unifiedMetrics.autores[authorKey]) {
                    unifiedMetrics.autores[authorKey] = {
                      name: authorData.name,
                      email: authorData.email,
                      commits: 0,
                      linesAdded: 0,
                      linesDeleted: 0,
                      prs: 0,
                      bugCommits: 0,
                      featureCommits: 0
                    };
                  }
                  
                  unifiedMetrics.autores[authorKey].commits += authorData.commits || 0;
                  unifiedMetrics.autores[authorKey].linesAdded += authorData.linesAdded || 0;
                  unifiedMetrics.autores[authorKey].linesDeleted += authorData.linesDeleted || 0;
                  unifiedMetrics.autores[authorKey].prs += authorData.prs || 0;
                  unifiedMetrics.autores[authorKey].bugCommits += authorData.bugCommits || 0;
                  unifiedMetrics.autores[authorKey].featureCommits += authorData.featureCommits || 0;
                }
              }
              
              // Acumular totais
              unifiedMetrics.totais.deploymentsCount += result.data.totais.deploymentsCount || 0;
              unifiedMetrics.totais.commitsCount += result.data.totais.commitsCount || 0;
              unifiedMetrics.totais.bugCommitsCount += result.data.totais.bugCommitsCount || 0;
              unifiedMetrics.totais.featureCommitsCount += result.data.totais.featureCommitsCount || 0;
              unifiedMetrics.totais.pullRequestsCount += result.data.totais.pullRequestsCount || 0;
            }
          }
        } catch (error) {
          console.warn(`[DORA Unified] Erro ao buscar métricas do projeto ${projeto.projeto}:`, error.message);
        }
      }

      // Calcular médias gerais
      const projetosComDados = unifiedMetrics.projetos.length;
      if (projetosComDados > 0) {
        let totalLeadTime = 0;
        let totalDeployFreq = 0;

        for (const proj of unifiedMetrics.projetos) {
          totalLeadTime += proj.totais.leadTimeAvgMinutes || 0;
          totalDeployFreq += proj.totais.deploymentFrequencyPerDay || 0;
        }

        unifiedMetrics.totais.leadTimeAvgMinutes = Math.round(totalLeadTime / projetosComDados);
        unifiedMetrics.totais.leadTimeAvgHours = Math.round((unifiedMetrics.totais.leadTimeAvgMinutes / 60) * 10) / 10;
        unifiedMetrics.totais.deploymentFrequencyPerDay = Math.round((totalDeployFreq / projetosComDados) * 100) / 100;
      }

      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'dora_metrics_unified',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });

      res.json({
        success: true,
        data: unifiedMetrics
      });

    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar métricas DORA unificadas:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'dora_metrics_unified',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar métricas DORA unificadas: ' + error.message });
    }
  });

  /**
   * GET /api/dora-metrics/:projetoId - Buscar métricas DORA de um projeto
   * 
   * Retorna as 4 métricas principais do framework DORA:
   * - Deployment Frequency (Frequência de Deploy)
   * - Lead Time for Changes (Tempo de Entrega)
   * - Change Failure Rate (Taxa de Falha em Mudanças)
   * - Time to Restore Service (Tempo para Restaurar Serviço)
   * 
   * Além de métricas adicionais:
   * - Quantidade de Commits (total e por tipo: bug/feature)
   * - Análise de Commits por idade (Aging)
   */
  app.get('/api/dora-metrics/:projetoId', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { projetoId } = req.params;
      const { startDate, endDate } = req.query;

      // Buscar informações do projeto
      const [projetos] = await pool.execute(
        `SELECT id, projeto, url_projeto as urlProjeto
        FROM estruturas_projeto
        WHERE id = ?`,
        [projetoId]
      );

      if (projetos.length === 0) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      const projeto = projetos[0];

      if (!projeto.urlProjeto) {
        return res.status(400).json({ error: 'Projeto não possui URL configurada' });
      }

      // Extrair nome do projeto da URL
      const urlMatch = projeto.urlProjeto.match(/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return res.status(400).json({ error: 'URL do projeto inválida' });
      }

      const [, organization, projectName] = urlMatch;

      // Buscar configurações do Azure DevOps da tabela configuracoes (padrão da tela de configurações)
      const [configRows] = await pool.execute(
        "SELECT valor FROM configuracoes WHERE chave = 'integration-config' LIMIT 1"
      );

      if (configRows.length === 0 || !configRows[0].valor) {
        return res.status(500).json({ 
          error: 'Configuração do Azure DevOps não encontrada',
          message: 'Configure as integrações na tela de Configurações'
        });
      }

      const integrationConfig = JSON.parse(configRows[0].valor);
      const azureConfig = integrationConfig.azureDevOps;

      if (!azureConfig || !azureConfig.personalAccessToken) {
        return res.status(500).json({ 
          error: 'PAT do Azure DevOps não configurado',
          message: 'Configure o Personal Access Token na tela de Configurações'
        });
      }

      // Extrair organização da URL configurada
      const orgMatch = azureConfig.urlOrganizacao.match(/dev\.azure\.com\/([^\/]+)/);
      const configuredOrg = orgMatch ? orgMatch[1] : organization;

      const azureService = new AzureDevOpsService(configuredOrg, azureConfig.personalAccessToken);

      // Definir período de análise
      const fromDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
      const toDate = endDate ? new Date(endDate) : new Date();

      // Buscar repositórios do projeto
      const repositories = await azureService.getProjectRepositories(decodeURIComponent(projectName));

      const metrics = {
        projetoId,
        projetoNome: projeto.projeto,
        periodo: {
          inicio: fromDate.toISOString(),
          fim: toDate.toISOString()
        },
        repositorios: [],
        autores: {}, // Mapa de autor -> {commits, linesAdded, linesDeleted, prs}
        totais: {
          deploymentsCount: 0,
          commitsCount: 0,
          bugCommitsCount: 0,
          featureCommitsCount: 0,
          pullRequestsCount: 0,
          leadTimeAvgMinutes: 0,
          deploymentFrequencyPerDay: 0
        }
      };

      // Analisar cada repositório
      for (const repo of repositories) {
        try {
          console.log(`[DORA] Analisando repositório: ${repo.name}`);

          // 1. Buscar commits da branch main
          const commits = await azureService.getCommits(
            decodeURIComponent(projectName),
            repo.id,
            'main',
            fromDate,
            toDate
          );

          // Analisar commits por autor
          for (const commit of commits) {
            const authorName = commit.author?.name || 'Desconhecido';
            const authorEmail = commit.author?.email || '';
            const authorKey = `${authorName} <${authorEmail}>`;

            if (!metrics.autores[authorKey]) {
              metrics.autores[authorKey] = {
                name: authorName,
                email: authorEmail,
                commits: 0,
                linesAdded: 0,
                linesDeleted: 0,
                prs: 0,
                bugCommits: 0,
                featureCommits: 0
              };
            }

            metrics.autores[authorKey].commits++;

            // Obter estatísticas de LOC do commit (changeCounts do Azure DevOps)
            if (commit.changeCounts) {
              // Azure DevOps retorna Add (linhas adicionadas), Edit (pode incluir add/delete), Delete (linhas removidas)
              // Vamos considerar Add como linhas adicionadas e Delete como linhas removidas
              // Edit geralmente representa arquivos modificados, não contabilizamos em LOC direto
              metrics.autores[authorKey].linesAdded += (commit.changeCounts.Add || 0) + (commit.changeCounts.Edit || 0);
              metrics.autores[authorKey].linesDeleted += (commit.changeCounts.Delete || 0);
            }

            // Classificar tipo de commit
            const comment = commit.comment?.toLowerCase() || '';
            if (comment.includes('bug') || comment.includes('fix') || comment.includes('hotfix')) {
              metrics.autores[authorKey].bugCommits++;
            } else if (comment.includes('feature') || comment.includes('feat')) {
              metrics.autores[authorKey].featureCommits++;
            }
          }

          // Classificar commits por tipo (bug, feature, outros)
          const bugCommits = commits.filter(c => 
            c.comment && (
              c.comment.toLowerCase().includes('bug') ||
              c.comment.toLowerCase().includes('fix') ||
              c.comment.toLowerCase().includes('hotfix')
            )
          );

          const featureCommits = commits.filter(c => 
            c.comment && (
              c.comment.toLowerCase().includes('feature') ||
              c.comment.toLowerCase().includes('feat')
            )
          );

          // 2. Buscar Pull Requests completos
          const pullRequests = await azureService.getPullRequests(
            decodeURIComponent(projectName),
            repo.id,
            'completed'
          );

          // Filtrar PRs por período
          const filteredPRs = pullRequests.filter(pr => {
            const completedDate = new Date(pr.closedDate);
            return completedDate >= fromDate && completedDate <= toDate;
          });

          // Calcular Lead Time médio (tempo desde criação até merge)
          let totalLeadTimeMinutes = 0;
          let prWithLeadTime = 0;

          for (const pr of filteredPRs) {
            // Contar PRs por autor
            const prAuthorName = pr.createdBy?.displayName || 'Desconhecido';
            const prAuthorEmail = pr.createdBy?.uniqueName || '';
            const prAuthorKey = `${prAuthorName} <${prAuthorEmail}>`;

            if (!metrics.autores[prAuthorKey]) {
              metrics.autores[prAuthorKey] = {
                name: prAuthorName,
                email: prAuthorEmail,
                commits: 0,
                linesAdded: 0,
                linesDeleted: 0,
                prs: 0,
                bugCommits: 0,
                featureCommits: 0
              };
            }
            metrics.autores[prAuthorKey].prs++;

            if (pr.creationDate && pr.closedDate) {
              const created = new Date(pr.creationDate);
              const closed = new Date(pr.closedDate);
              const leadTimeMs = closed.getTime() - created.getTime();
              totalLeadTimeMinutes += leadTimeMs / (1000 * 60);
              prWithLeadTime++;
            }
          }

          const leadTimeAvg = prWithLeadTime > 0 ? totalLeadTimeMinutes / prWithLeadTime : 0;

          // 3. Análise de Commits por Idade (Aging)
          const now = new Date();
          const commitsAging = {
            '0-7dias': 0,
            '8-14dias': 0,
            '15-30dias': 0,
            'mais30dias': 0
          };

          for (const commit of commits) {
            const commitDate = new Date(commit.author.date);
            const ageInDays = (now.getTime() - commitDate.getTime()) / (1000 * 60 * 60 * 24);

            if (ageInDays <= 7) {
              commitsAging['0-7dias']++;
            } else if (ageInDays <= 14) {
              commitsAging['8-14dias']++;
            } else if (ageInDays <= 30) {
              commitsAging['15-30dias']++;
            } else {
              commitsAging['mais30dias']++;
            }
          }

          // Adicionar métricas do repositório
          metrics.repositorios.push({
            repositorioId: repo.id,
            repositorioNome: repo.name,
            commits: {
              total: commits.length,
              bugs: bugCommits.length,
              features: featureCommits.length,
              aging: commitsAging
            },
            pullRequests: {
              total: filteredPRs.length,
              leadTimeAvgMinutes: Math.round(leadTimeAvg),
              leadTimeAvgHours: Math.round(leadTimeAvg / 60 * 10) / 10
            }
          });

          // Atualizar totais
          metrics.totais.commitsCount += commits.length;
          metrics.totais.bugCommitsCount += bugCommits.length;
          metrics.totais.featureCommitsCount += featureCommits.length;
          metrics.totais.pullRequestsCount += filteredPRs.length;
          metrics.totais.leadTimeAvgMinutes += totalLeadTimeMinutes;

        } catch (repoError) {
          console.error(`[DORA] Erro ao analisar repositório ${repo.name}:`, repoError.message);
        }
      }

      // 4. Buscar informações de Deployments (Builds e Releases)
      try {
        const builds = await azureService.getBuilds(
          decodeURIComponent(projectName),
          fromDate,
          toDate,
          'succeeded'
        );

        metrics.totais.deploymentsCount = builds.length;

        // Calcular Deployment Frequency (deploys por dia)
        const periodInDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
        metrics.totais.deploymentFrequencyPerDay = periodInDays > 0 
          ? Math.round((builds.length / periodInDays) * 100) / 100 
          : 0;

      } catch (buildError) {
        console.warn(`[DORA] Aviso ao buscar builds: ${buildError.message}`);
      }

      // Calcular Lead Time médio geral
      if (metrics.totais.pullRequestsCount > 0) {
        metrics.totais.leadTimeAvgMinutes = Math.round(
          metrics.totais.leadTimeAvgMinutes / metrics.totais.pullRequestsCount
        );
        metrics.totais.leadTimeAvgHours = Math.round(
          (metrics.totais.leadTimeAvgMinutes / 60) * 10
        ) / 10;
      }

      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'dora_metrics',
        entityId: projetoId,
        statusCode: 200,
        durationMs,
        ...requestInfo
      });

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar métricas DORA:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'dora_metrics',
        entityId: req.params.projetoId,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar métricas DORA: ' + error.message });
    }
  });

  // ===== ENDPOINTS REPORTBOOK =====

  // GET /api/reports - Listar todos os relatórios
  app.get('/api/reports', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { status } = req.query;
      
      let query = `
        SELECT 
          r.id, r.nome, r.descricao, r.filtros, r.agrupamentos,
          r.status, r.query, r.created_at as createdAt, r.updated_at as updatedAt,
          COUNT(DISTINCT rc.id) as totalColunas
        FROM reports r
        LEFT JOIN report_columns rc ON r.id = rc.report_id
        WHERE 1=1
      `;
      const params = [];
      
      if (status) {
        query += ' AND r.status = ?';
        params.push(status);
      }
      
      query += ' GROUP BY r.id ORDER BY r.updated_at DESC';
      
      const [reports] = await pool.execute(query, params);
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'reports',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(reports);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar relatórios:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'reports',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar relatórios: ' + error.message });
    }
  });

  // GET /api/reports/:id - Buscar relatório por ID
  app.get('/api/reports/:id', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const [reports] = await pool.execute(
        `SELECT id, nome, descricao, filtros, agrupamentos, status, query,
         created_at as createdAt, updated_at as updatedAt
         FROM reports WHERE id = ?`,
        [req.params.id]
      );
      
      if (reports.length === 0) {
        return res.status(404).json({ error: 'Relatório não encontrado' });
      }
      
      // Buscar colunas
      const [columns] = await pool.execute(
        `SELECT id, report_id as reportId, column_name as columnName, data_type as dataType,
         order_direction as orderDirection, description, query,
         created_at as createdAt, updated_at as updatedAt
         FROM report_columns WHERE report_id = ? ORDER BY created_at`,
        [req.params.id]
      );
      
      const report = { ...reports[0], columns };
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json(report);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao buscar relatório:', error);
      
      await logAuditoria(pool, {
        operationType: 'READ',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao buscar relatório: ' + error.message });
    }
  });

  // POST /api/reports - Criar novo relatório
  app.post('/api/reports', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { nome, descricao, filtros, agrupamentos, status, query, columns } = req.body;
      
      const reportId = uuidv4();
      
      await pool.execute(
        `INSERT INTO reports (id, nome, descricao, filtros, agrupamentos, status, query)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [reportId, nome, descricao, filtros, agrupamentos, status || 'Especificacao', query]
      );
      
      // Inserir colunas se fornecidas
      if (columns && columns.length > 0) {
        for (const col of columns) {
          await pool.execute(
            `INSERT INTO report_columns (id, report_id, column_name, data_type, order_direction, description, query)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), reportId, col.columnName, col.dataType, col.orderDirection || 'ASC', col.description, col.query]
          );
        }
      }
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'CREATE',
        entityType: 'reports',
        entityId: reportId,
        statusCode: 201,
        durationMs,
        newValues: JSON.stringify({ nome, status }),
        ...requestInfo
      });
      
      res.status(201).json({ id: reportId, message: 'Relatório criado com sucesso' });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao criar relatório:', error);
      
      await logAuditoria(pool, {
        operationType: 'CREATE',
        entityType: 'reports',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao criar relatório: ' + error.message });
    }
  });

  // PUT /api/reports/:id - Atualizar relatório
  app.put('/api/reports/:id', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { nome, descricao, filtros, agrupamentos, status, query, columns } = req.body;
      
      await pool.execute(
        `UPDATE reports SET nome = ?, descricao = ?, filtros = ?, agrupamentos = ?, status = ?, query = ?
         WHERE id = ?`,
        [nome, descricao, filtros, agrupamentos, status, query, req.params.id]
      );
      
      // Atualizar colunas - deletar e reinserir
      if (columns) {
        await pool.execute('DELETE FROM report_columns WHERE report_id = ?', [req.params.id]);
        
        for (const col of columns) {
          await pool.execute(
            `INSERT INTO report_columns (id, report_id, column_name, data_type, order_direction, description, query)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [col.id || uuidv4(), req.params.id, col.columnName, col.dataType, col.orderDirection || 'ASC', col.description, col.query]
          );
        }
      }
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'UPDATE',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 200,
        durationMs,
        newValues: JSON.stringify({ nome, status }),
        ...requestInfo
      });
      
      res.json({ message: 'Relatório atualizado com sucesso' });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao atualizar relatório:', error);
      
      await logAuditoria(pool, {
        operationType: 'UPDATE',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao atualizar relatório: ' + error.message });
    }
  });

  // DELETE /api/reports/:id - Deletar relatório
  app.delete('/api/reports/:id', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      await pool.execute('DELETE FROM reports WHERE id = ?', [req.params.id]);
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'DELETE',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json({ message: 'Relatório deletado com sucesso' });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao deletar relatório:', error);
      
      await logAuditoria(pool, {
        operationType: 'DELETE',
        entityType: 'reports',
        entityId: req.params.id,
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao deletar relatório: ' + error.message });
    }
  });

  // POST /api/reports/analyze-similarity - Analisar similaridade de relatórios
  app.post('/api/reports/analyze-similarity', async (req, res) => {
    const startTime = Date.now();
    const requestInfo = extractRequestInfo(req);
    
    try {
      const { columns, filtros, agrupamentos } = req.body;
      
      if (!columns || columns.length === 0) {
        return res.status(400).json({ error: 'Colunas são obrigatórias para análise' });
      }
      
      // Buscar todos os relatórios com suas colunas
      const [reports] = await pool.execute(`
        SELECT 
          r.id, r.nome, r.descricao, r.filtros, r.agrupamentos, r.status, r.query,
          GROUP_CONCAT(DISTINCT rc.column_name) as columns
        FROM reports r
        LEFT JOIN report_columns rc ON r.id = rc.report_id
        GROUP BY r.id
      `);
      
      // Funções auxiliares para similaridade
      const tokenize = (text) => {
        if (!text) return new Set();
        return new Set(text.toLowerCase().split(/\W+/).filter(t => t.length > 2));
      };
      
      const jaccardSimilarity = (set1, set2) => {
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
      };
      
      const cosineSimilarity = (text1, text2) => {
        const tokens1 = tokenize(text1);
        const tokens2 = tokenize(text2);
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const denominator = Math.sqrt(tokens1.size * tokens2.size);
        return denominator === 0 ? 0 : intersection.size / denominator;
      };
      
      // Analisar similaridade para cada relatório
      const results = reports.map(report => {
        const reportColumns = new Set((report.columns || '').split(',').map(c => c.trim()).filter(c => c));
        const inputColumns = new Set(columns.map(c => c.toLowerCase()));
        
        const reportFiltros = tokenize(report.filtros);
        const inputFiltros = tokenize(filtros);
        
        const reportAgrupamentos = tokenize(report.agrupamentos);
        const inputAgrupamentos = tokenize(agrupamentos);
        
        // Calcular métricas
        const columnsSimilarity = jaccardSimilarity(inputColumns, reportColumns);
        const filtrosSimilarity = jaccardSimilarity(inputFiltros, reportFiltros);
        const agrupamentosSimilarity = jaccardSimilarity(inputAgrupamentos, reportAgrupamentos);
        const textSimilarity = cosineSimilarity(
          `${columns.join(' ')} ${filtros} ${agrupamentos}`,
          `${report.columns} ${report.filtros} ${report.agrupamentos}`
        );
        
        // Score ponderado: Colunas 40%, Filtros 30%, Agrupamentos 20%, Texto 10%
        const weightedScore = (
          columnsSimilarity * 0.40 +
          filtrosSimilarity * 0.30 +
          agrupamentosSimilarity * 0.20 +
          textSimilarity * 0.10
        );
        
        return {
          report: {
            id: report.id,
            nome: report.nome,
            descricao: report.descricao,
            status: report.status,
            totalColunas: report.columns ? report.columns.split(',').length : 0
          },
          similarity: {
            columns: Math.round(columnsSimilarity * 100),
            filtros: Math.round(filtrosSimilarity * 100),
            agrupamentos: Math.round(agrupamentosSimilarity * 100),
            text: Math.round(textSimilarity * 100),
            weighted: Math.round(weightedScore * 100)
          }
        };
      })
      .filter(r => r.similarity.weighted > 0) // Apenas resultados com alguma similaridade
      .sort((a, b) => b.similarity.weighted - a.similarity.weighted) // Ordenar por score
      .slice(0, 10); // Top 10 resultados
      
      const durationMs = Date.now() - startTime;
      await logAuditoria(pool, {
        operationType: 'ANALYZE',
        entityType: 'reports_similarity',
        statusCode: 200,
        durationMs,
        ...requestInfo
      });
      
      res.json({
        success: true,
        totalAnalyzed: reports.length,
        results,
        algorithms: {
          jaccard: 'Medida de interseção entre conjuntos (Colunas, Filtros, Agrupamentos)',
          cosine: 'Similaridade textual entre descrições',
          weighted: 'Score ponderado: Colunas 40%, Filtros 30%, Agrupamentos 20%, Texto 10%'
        }
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Erro ao analisar similaridade:', error);
      
      await logAuditoria(pool, {
        operationType: 'ANALYZE',
        entityType: 'reports_similarity',
        statusCode: 500,
        durationMs,
        errorMessage: error.message,
        ...requestInfo
      });
      
      res.status(500).json({ error: 'Erro ao analisar similaridade: ' + error.message });
    }
  });

  // ===== ROTAS DE PAYLOADS (OpenAPI) =====
  
  // GET - Listar todos os payloads
  app.get('/api/payloads', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          p.id, p.aplicacao_id as aplicacaoId, p.sigla, p.definicao, p.descricao,
          p.formato_arquivo as formatoArquivo, p.conteudo_arquivo as conteudoArquivo,
          p.versao_openapi as versaoOpenapi, p.arquivo_valido as arquivoValido,
          p.ultima_validacao as ultimaValidacao, p.erros_validacao as errosValidacao,
          p.data_inicio as dataInicio, p.data_termino as dataTermino,
          p.created_at as createdAt, p.updated_at as updatedAt,
          a.sigla as aplicacaoSigla, a.descricao as aplicacaoDescricao
        FROM payloads p
        LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
        ORDER BY p.data_inicio DESC
      `);
      
      const payloads = rows.map(row => ({
        id: row.id,
        aplicacaoId: row.aplicacaoId,
        aplicacaoSigla: row.aplicacaoSigla,
        aplicacaoDescricao: row.aplicacaoDescricao,
        sigla: row.sigla,
        definicao: row.definicao,
        descricao: row.descricao,
        formatoArquivo: row.formatoArquivo,
        conteudoArquivo: row.conteudoArquivo,
        versaoOpenapi: row.versaoOpenapi,
        arquivoValido: Boolean(row.arquivoValido),
        ultimaValidacao: row.ultimaValidacao,
        errosValidacao: row.errosValidacao,
        dataInicio: row.dataInicio ? formatDateToISO(row.dataInicio) : null,
        dataTermino: row.dataTermino ? formatDateToISO(row.dataTermino) : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
      
      res.json(payloads);
    } catch (error) {
      console.error('Erro ao buscar payloads:', error);
      res.status(500).json({ error: 'Erro ao buscar payloads', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Buscar payload por ID
  app.get('/api/payloads/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          p.id, p.aplicacao_id as aplicacaoId, p.sigla, p.definicao, p.descricao,
          p.formato_arquivo as formatoArquivo, p.conteudo_arquivo as conteudoArquivo,
          p.versao_openapi as versaoOpenapi, p.arquivo_valido as arquivoValido,
          p.ultima_validacao as ultimaValidacao, p.erros_validacao as errosValidacao,
          p.data_inicio as dataInicio, p.data_termino as dataTermino,
          p.created_at as createdAt, p.updated_at as updatedAt,
          a.sigla as aplicacaoSigla, a.descricao as aplicacaoDescricao
        FROM payloads p
        LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
        WHERE p.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Payload não encontrado', code: 'NOT_FOUND' });
      }
      
      const row = rows[0];
      const payload = {
        id: row.id,
        aplicacaoId: row.aplicacaoId,
        aplicacaoSigla: row.aplicacaoSigla,
        aplicacaoDescricao: row.aplicacaoDescricao,
        sigla: row.sigla,
        definicao: row.definicao,
        descricao: row.descricao,
        formatoArquivo: row.formatoArquivo,
        conteudoArquivo: row.conteudoArquivo,
        versaoOpenapi: row.versaoOpenapi,
        arquivoValido: Boolean(row.arquivoValido),
        ultimaValidacao: row.ultimaValidacao,
        errosValidacao: row.errosValidacao,
        dataInicio: row.dataInicio ? formatDateToISO(row.dataInicio) : null,
        dataTermino: row.dataTermino ? formatDateToISO(row.dataTermino) : null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      };
      
      res.json(payload);
    } catch (error) {
      console.error('Erro ao buscar payload:', error);
      res.status(500).json({ error: 'Erro ao buscar payload', code: 'DATABASE_ERROR' });
    }
  });

  // POST - Criar novo payload
  app.post('/api/payloads', async (req, res) => {
    const {
      aplicacaoId, sigla, definicao, descricao,
      formatoArquivo, conteudoArquivo, versaoOpenapi,
      arquivoValido, errosValidacao, dataTermino
    } = req.body;

    // Validação de campos obrigatórios
    if (!aplicacaoId || !sigla || !definicao || !formatoArquivo || !conteudoArquivo) {
      return res.status(400).json({
        error: 'Campos obrigatórios: aplicacaoId, sigla, definicao, formatoArquivo, conteudoArquivo',
        code: 'MISSING_FIELDS'
      });
    }

    try {
      const id = uuidv4();
      const dataInicio = new Date().toISOString().split('T')[0];
      
      await pool.query(`
        INSERT INTO payloads (
          id, aplicacao_id, sigla, definicao, descricao,
          formato_arquivo, conteudo_arquivo, versao_openapi,
          arquivo_valido, ultima_validacao, erros_validacao,
          data_inicio, data_termino
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
      `, [
        id, aplicacaoId, sigla, definicao, descricao || null,
        formatoArquivo, conteudoArquivo, versaoOpenapi || '3.0.0',
        arquivoValido || false, errosValidacao || null,
        dataInicio, dataTermino || null
      ]);

      const [rows] = await pool.query(`
        SELECT 
          p.id, p.aplicacao_id as aplicacaoId, p.sigla, p.definicao, p.descricao,
          p.formato_arquivo as formatoArquivo, p.conteudo_arquivo as conteudoArquivo,
          p.versao_openapi as versaoOpenapi, p.arquivo_valido as arquivoValido,
          p.ultima_validacao as ultimaValidacao, p.erros_validacao as errosValidacao,
          p.data_inicio as dataInicio, p.data_termino as dataTermino,
          p.created_at as createdAt, p.updated_at as updatedAt,
          a.sigla as aplicacaoSigla, a.descricao as aplicacaoDescricao
        FROM payloads p
        LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
        WHERE p.id = ?
      `, [id]);
      
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Erro ao criar payload:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Payload com esta sigla já existe', code: 'DUPLICATE_SIGLA' });
      }
      res.status(500).json({ error: 'Erro ao criar payload', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // PUT - Atualizar payload
  app.put('/api/payloads/:id', async (req, res) => {
    const {
      aplicacaoId, sigla, definicao, descricao,
      formatoArquivo, conteudoArquivo, versaoOpenapi,
      arquivoValido, errosValidacao, dataTermino
    } = req.body;

    try {
      const [existing] = await pool.query('SELECT * FROM payloads WHERE id = ?', [req.params.id]);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Payload não encontrado', code: 'NOT_FOUND' });
      }

      await pool.query(`
        UPDATE payloads SET
          aplicacao_id = ?, sigla = ?, definicao = ?, descricao = ?,
          formato_arquivo = ?, conteudo_arquivo = ?, versao_openapi = ?,
          arquivo_valido = ?, ultima_validacao = NOW(), erros_validacao = ?,
          data_termino = ?
        WHERE id = ?
      `, [
        aplicacaoId, sigla, definicao, descricao || null,
        formatoArquivo, conteudoArquivo, versaoOpenapi || '3.0.0',
        arquivoValido || false, errosValidacao || null,
        dataTermino || null,
        req.params.id
      ]);

      const [rows] = await pool.query(`
        SELECT 
          p.id, p.aplicacao_id as aplicacaoId, p.sigla, p.definicao, p.descricao,
          p.formato_arquivo as formatoArquivo, p.conteudo_arquivo as conteudoArquivo,
          p.versao_openapi as versaoOpenapi, p.arquivo_valido as arquivoValido,
          p.ultima_validacao as ultimaValidacao, p.erros_validacao as errosValidacao,
          p.data_inicio as dataInicio, p.data_termino as dataTermino,
          p.created_at as createdAt, p.updated_at as updatedAt,
          a.sigla as aplicacaoSigla, a.descricao as aplicacaoDescricao
        FROM payloads p
        LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
        WHERE p.id = ?
      `, [req.params.id]);
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Erro ao atualizar payload:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Payload com esta sigla já existe', code: 'DUPLICATE_SIGLA' });
      }
      res.status(500).json({ error: 'Erro ao atualizar payload', code: 'DATABASE_ERROR', details: error.message });
    }
  });

  // DELETE - Excluir payload
  app.delete('/api/payloads/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM payloads WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Payload não encontrado', code: 'NOT_FOUND' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir payload:', error);
      res.status(500).json({ error: 'Erro ao excluir payload', code: 'DATABASE_ERROR' });
    }
  });

  // GET - Estatísticas de payloads
  app.get('/api/payloads/stats/summary', async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN arquivo_valido = 1 THEN 1 ELSE 0 END) as validos,
          SUM(CASE WHEN arquivo_valido = 0 THEN 1 ELSE 0 END) as invalidos,
          SUM(CASE WHEN formato_arquivo = 'JSON' THEN 1 ELSE 0 END) as json,
          SUM(CASE WHEN formato_arquivo = 'YAML' THEN 1 ELSE 0 END) as yaml,
          SUM(CASE WHEN data_termino IS NULL THEN 1 ELSE 0 END) as ativos,
          SUM(CASE WHEN data_termino IS NOT NULL THEN 1 ELSE 0 END) as descontinuados
        FROM payloads
      `);
      
      res.json(stats[0]);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de payloads:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas', code: 'DATABASE_ERROR' });
    }
  });

  // ===================================
  // GERADOR DE CATÁLOGO DE APIs COM SWAGGER UI
  // ===================================
  
  app.post('/api/catalog/generate', async (req, res) => {
    try {
      console.log('🚀 Iniciando geração do catálogo de APIs com Swagger UI...');
      
      const fs = await import('fs').then(m => m.promises);
      const path = await import('path');
      
      // Buscar payloads válidos com aplicações
      const [payloads] = await pool.query(`
        SELECT 
          p.id,
          p.sigla,
          p.definicao as descricao_curta,
          p.descricao as descricao_longa,
          p.formato_arquivo,
          p.conteudo_arquivo,
          p.versao_openapi,
          p.data_inicio,
          p.data_termino,
          a.sigla as aplicacao_sigla,
          a.descricao as aplicacao_nome
        FROM payloads p
        INNER JOIN aplicacoes a ON p.aplicacao_id = a.id
        WHERE p.arquivo_valido = true
          AND (p.data_termino IS NULL OR p.data_termino > NOW())
        ORDER BY a.sigla, p.sigla
      `);
      
      if (payloads.length === 0) {
        return res.status(404).json({
          error: 'Nenhum payload válido encontrado',
          code: 'NO_PAYLOADS'
        });
      }
      
      // Criar diretórios
      const docsDir = path.join(process.cwd(), 'docs', 'api-catalog');
      const publicJsonDir = path.join(process.cwd(), 'public', 'json');
      
      await fs.mkdir(docsDir, { recursive: true });
      await fs.mkdir(publicJsonDir, { recursive: true });
      
      // Função para exportar arquivo de especificação
      const exportSpecFile = async (payload) => {
        const extension = payload.formato_arquivo.toLowerCase();
        // Substituir # por - para evitar problemas com URLs
        const sanitizedSigla = payload.sigla.replace(/#/g, '-');
        const filename = `${sanitizedSigla}.${extension}`;
        const docsPath = path.join(docsDir, filename);
        const publicPath = path.join(publicJsonDir, filename);

        try {
          // Valida se o conteúdo é JSON válido
          if (extension === 'json') {
            JSON.parse(payload.conteudo_arquivo);
          }

          // Exporta para docs/api-catalog/ (acessível via MkDocs)
          await fs.writeFile(docsPath, payload.conteudo_arquivo, 'utf8');
          
          // Exporta para public/json/ (acessível via React)
          await fs.writeFile(publicPath, payload.conteudo_arquivo, 'utf8');
          
          return filename;
        } catch (error) {
          console.error(`Erro ao exportar ${filename}:`, error.message);
          return null;
        }
      };
      
      // Função para gerar página individual com Swagger UI
      const generateApiPage = (payload, specFilename) => {
        // Caminho do spec - usar caminho relativo ao diretório api-catalog
        const specPath = specFilename;
        const dataInicio = payload.data_inicio ? new Date(payload.data_inicio).toLocaleDateString('pt-BR') : 'N/A';
        const dataTermino = payload.data_termino ? new Date(payload.data_termino).toLocaleDateString('pt-BR') : null;
        const status = dataTermino ? '🔴 Depreciado' : '🟢 Ativo';
        // Sanitizar sigla para exibição (sem #)
        const siglaSanitizada = payload.sigla.replace(/#/g, '-');
        
        let content = `# ${payload.aplicacao_nome} - ${siglaSanitizada}

## Aplicação: ${payload.aplicacao_sigla}

**Descrição:** ${payload.aplicacao_nome}  
**Criticidade:** Média  
**Total de APIs:** 1

---

## APIs Disponíveis

### ${siglaSanitizada}

**Status:** ${status}  
**Descrição Curta:** ${payload.descricao_curta || 'N/A'}  
`;

        if (payload.descricao_longa) {
          content += `**Descrição Longa:** ${payload.descricao_longa}  
`;
        }
        
        content += `**Versão OpenAPI:** ${payload.versao_openapi || 'N/A'}  
**Data de Início:** ${dataInicio}  
`;

        if (dataTermino) {
          content += `**Data de Término:** ${dataTermino}  
`;
        }

        content += `

---

## 📋 Documentação Interativa da API

Utilize o visualizador abaixo para explorar e testar os endpoints da API:

<swagger-ui src="${specPath}"/>

---

## 📥 Download da Especificação

Você pode baixar a especificação OpenAPI completa:

- [📄 Download ${payload.formato_arquivo}](${specPath})
- [📄 Download via React](http://localhost:5173/json/${specFilename})

## 🔧 Como Usar

### Importar em Ferramentas

#### Postman
1. Abra o Postman
2. Clique em "Import"
3. Cole a URL: \`http://localhost:5173/json/${specFilename}\`
4. Clique em "Import"

#### Insomnia
1. Abra o Insomnia
2. Clique em "Import/Export"
3. Selecione "Import Data" → "From URL"
4. Cole a URL: \`http://localhost:5173/json/${specFilename}\`

#### Swagger Editor
1. Acesse https://editor.swagger.io/
2. File → Import URL
3. Cole a URL: \`http://localhost:5173/json/${specFilename}\`

### Testar com cURL

Exemplo de como testar endpoints usando cURL:

\`\`\`bash
# Exemplo GET
curl -X GET "https://api.example.com/endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SEU_TOKEN"

# Exemplo POST
curl -X POST "https://api.example.com/endpoint" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -d '{"key": "value"}'
\`\`\`

---

[← Voltar ao Catálogo](index.md)
`;

        return content;
      };
      
      // Processar payloads e gerar páginas
      const apiPages = {};
      let specsExportados = 0;
      
      for (const payload of payloads) {
        const specFilename = await exportSpecFile(payload);
        
        if (specFilename) {
          // Substituir # por - para evitar problemas com URLs
          const sanitizedSigla = payload.sigla.replace(/#/g, '-');
          const pageFilename = `${sanitizedSigla}.md`;
          const pageContent = generateApiPage(payload, specFilename);
          const pagePath = path.join(docsDir, pageFilename);
          
          await fs.writeFile(pagePath, pageContent, 'utf8');
          apiPages[payload.id] = pageFilename;
          specsExportados++;
        }
      }
      
      // Gerar página índice
      const totalApis = payloads.length;
      const aplicacoes = [...new Set(payloads.map(p => p.aplicacao_sigla))];
      const totalAplicacoes = aplicacoes.length;

      let indexContent = `# 📚 Catálogo de APIs

Bem-vindo ao **Catálogo de APIs** do Sistema de Auditoria.

Este catálogo contém a documentação completa e interativa de todas as APIs disponíveis no sistema.

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de Aplicações** | ${totalAplicacoes} |
| **Total de APIs** | ${totalApis} |
| **Última Atualização** | ${new Date().toLocaleString('pt-BR')} |

---

## 🗂️ Índice de APIs

A tabela abaixo lista todas as APIs disponíveis. Clique na sigla para acessar a documentação completa e o visualizador interativo Swagger UI.

| Aplicação | Sigla | Descrição | Versão OpenAPI | Status |
|-----------|-------|-----------|----------------|--------|
`;

      payloads.forEach(payload => {
        const pageLink = apiPages[payload.id];
        const status = '🟢 Ativo';
        const descricao = payload.descricao_curta || 'N/A';
        const versao = payload.versao_openapi || 'N/A';
        // Sanitizar sigla para exibição consistente (sem #)
        const siglaSanitizada = payload.sigla.replace(/#/g, '-');
        
        indexContent += `| ${payload.aplicacao_sigla} | [${siglaSanitizada}](${pageLink}) | ${descricao} | ${versao} | ${status} |\n`;
      });

      indexContent += `
---

## 🚀 Como Usar Este Catálogo

### 1. Explorar APIs
Navegue pela tabela acima e clique na sigla da API desejada.

### 2. Visualizar Documentação
Cada página de API contém:
- ✅ Informações gerais da aplicação
- ✅ Descrição detalhada da API
- ✅ Visualizador interativo Swagger UI (tag \`<swagger-ui>\`)
- ✅ Download da especificação OpenAPI
- ✅ Exemplos de uso com cURL, Postman, etc.

### 3. Testar Endpoints
O Swagger UI integrado permite:
- 📋 Visualizar todos os endpoints disponíveis
- 🔍 Ver parâmetros de entrada e saída
- ⚡ Testar requisições diretamente no navegador
- 📝 Gerar código cliente em várias linguagens

### 4. Importar em Ferramentas
Você pode importar as especificações OpenAPI em:
- Postman
- Insomnia
- Swagger Editor
- Qualquer ferramenta compatível com OpenAPI 3.0

---

## 📖 Documentação Adicional

- [Guia de Design de APIs](#)
- [Boas Práticas de APIs RESTful](#)
- [Governança de APIs](#)

---

## 🔄 Atualização

Este catálogo é gerado automaticamente a partir dos payloads cadastrados no sistema.

**Para regenerar o catálogo:**

1. Acesse a interface web em http://localhost:5173
2. Navegue até "Catálogo de APIs"
3. Clique em "Gerar Catálogo de APIs"

---

*Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;

      await fs.writeFile(path.join(docsDir, 'index.md'), indexContent, 'utf8');
      
      console.log('✅ Catálogo gerado com sucesso!');
      
      // Reiniciar container mkdocs para refletir as alterações
      console.log('🔄 Reiniciando container mkdocs...');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      
      try {
        await execPromise('docker restart auditoria-mkdocs');
        console.log('✅ Container mkdocs reiniciado com sucesso!');
      } catch (restartError) {
        console.warn('⚠️ Não foi possível reiniciar o container mkdocs:', restartError.message);
        console.warn('💡 Execute manualmente: docker restart auditoria-mkdocs');
      }
      
      // Retornar resultado
      res.json({
        success: true,
        stats: {
          totalAplicacoes,
          totalApis,
          pagesGenerated: Object.keys(apiPages).length,
          specsExportados
        },
        message: 'Catálogo gerado com sucesso! O container MkDocs foi reiniciado e está disponível para consulta.'
      });
      
    } catch (error) {
      console.error('❌ Erro ao gerar catálogo:', error);
      res.status(500).json({
        error: 'Erro ao gerar catálogo de APIs',
        message: error.message,
        code: 'GENERATION_ERROR'
      });
    }
  });

  // =====================================================
  // ADR (ARCHITECTURAL DECISION RECORDS) ENDPOINTS
  // =====================================================

  // GET /api/adrs - Listar todos os ADRs
  app.get('/api/adrs', async (req, res) => {
    const connection = await getUtf8Connection();
    try {
      const [adrs] = await connection.query(`
        SELECT 
          a.id,
          a.sequencia,
          a.descricao,
          a.data_criacao as dataCriacao,
          a.updated_at as dataAtualizacao,
          a.status,
          a.contexto,
          a.decisao,
          a.justificativa,
          a.consequencias_positivas as consequenciasPositivas,
          a.consequencias_negativas as consequenciasNegativas,
          a.riscos,
          a.alternativas_consideradas as alternativasConsideradas,
          a.compliance_constitution as complianceConstitution,
          a.adr_substituta_id as adrSubstitutaId,
          a.referencias,
          a.created_at as createdAt,
          a.updated_at as updatedAt,
          sub.sequencia as adrSubstitutaSequencia,
          sub.descricao as adrSubstitutaDescricao,
          (
            SELECT COUNT(*)
            FROM adr_aplicacoes aa
            WHERE aa.adr_id = a.id
          ) as aplicacoesCount
        FROM adrs a
        LEFT JOIN adrs sub ON a.adr_substituta_id = sub.id
        ORDER BY a.sequencia DESC
      `);
      res.json(adrs);
    } catch (error) {
      console.error('Erro ao buscar ADRs:', error);
      res.status(500).json({ error: 'Erro ao buscar ADRs' });
    } finally {
      connection.release();
    }
  });

  // GET /api/adrs/:id - Buscar ADR específico
  app.get('/api/adrs/:id', async (req, res) => {
    const connection = await getUtf8Connection();
    try {
      const [adrs] = await connection.query(`
        SELECT 
          a.id,
          a.sequencia,
          a.descricao,
          a.data_criacao as dataCriacao,
          a.updated_at as dataAtualizacao,
          a.status,
          a.contexto,
          a.decisao,
          a.justificativa,
          a.consequencias_positivas as consequenciasPositivas,
          a.consequencias_negativas as consequenciasNegativas,
          a.riscos,
          a.alternativas_consideradas as alternativasConsideradas,
          a.compliance_constitution as complianceConstitution,
          a.adr_substituta_id as adrSubstitutaId,
          a.referencias,
          a.created_at as createdAt,
          a.updated_at as updatedAt,
          sub.sequencia as adrSubstitutaSequencia,
          COALESCE(
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id', aa.id,
                  'adrId', aa.adr_id,
                  'aplicacaoId', aa.aplicacao_id,
                  'aplicacaoSigla', ap.sigla,
                  'aplicacaoNome', ap.sigla,
                  'aplicacaoDescricao', ap.descricao,
                  'dataInicio', aa.data_inicio,
                  'dataTermino', aa.data_termino,
                  'status', aa.status,
                  'observacoes', aa.observacoes,
                  'createdAt', aa.created_at,
                  'updatedAt', aa.updated_at
                )
              )
              FROM adr_aplicacoes aa
              LEFT JOIN aplicacoes ap ON aa.aplicacao_id = ap.id
              WHERE aa.adr_id = a.id
            ),
            JSON_ARRAY()
          ) as aplicacoes
        FROM adrs a
        LEFT JOIN adrs sub ON a.adr_substituta_id = sub.id
        WHERE a.id = ?
      `, [req.params.id]);

      if (adrs.length === 0) {
        return res.status(404).json({ error: 'ADR não encontrado' });
      }

      const adr = adrs[0];
      if (adr.aplicacoes && typeof adr.aplicacoes === 'string') {
        try {
          adr.aplicacoes = JSON.parse(adr.aplicacoes);
        } catch (e) {
          adr.aplicacoes = [];
        }
      } else {
        adr.aplicacoes = adr.aplicacoes || [];
      }

      res.json(adr);
    } catch (error) {
      console.error('Erro ao buscar ADR:', error);
      res.status(500).json({ error: 'Erro ao buscar ADR' });
    } finally {
      connection.release();
    }
  });

  // POST /api/adrs - Criar novo ADR
  app.post('/api/adrs', async (req, res) => {
    const connection = await getUtf8Connection();
    try {
      await connection.beginTransaction();

      const {
        descricao,
        status,
        contexto,
        decisao,
        justificativa,
        consequenciasPositivas,
        consequenciasNegativas,
        riscos,
        alternativasConsideradas,
        complianceConstitution,
        adrSubstitutaId,
        referencias,
        aplicacoes
      } = req.body;

      const id = uuidv4();

      await connection.query(
        `INSERT INTO adrs (
          id, descricao, status, contexto, decisao, justificativa,
          consequencias_positivas, consequencias_negativas, riscos,
          alternativas_consideradas, compliance_constitution,
          adr_substituta_id, referencias
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, descricao, status, contexto, decisao, justificativa,
          consequenciasPositivas, consequenciasNegativas, riscos,
          alternativasConsideradas, complianceConstitution,
          adrSubstitutaId || null, referencias
        ]
      );

      // Inserir aplicações associadas
      if (aplicacoes && aplicacoes.length > 0) {
        for (const app of aplicacoes) {
          await connection.query(
            `INSERT INTO adr_aplicacoes (
              id, adr_id, aplicacao_id, data_inicio, data_termino, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), id, app.aplicacaoId, app.dataInicio || null,
              app.dataTermino || null, app.status, app.observacoes
            ]
          );
        }
      }

      await connection.commit();

      // Buscar ADR completo
      const [adrs] = await pool.query(`
        SELECT 
          a.*,
          a.data_criacao as dataCriacao,
          a.created_at as createdAt,
          a.updated_at as updatedAt,
          a.adr_substituta_id as adrSubstitutaId
        FROM adrs a
        WHERE a.id = ?
      `, [id]);

      res.status(201).json(adrs[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao criar ADR:', error);
      res.status(500).json({ error: 'Erro ao criar ADR' });
    } finally {
      connection.release();
    }
  });

  // PUT /api/adrs/:id - Atualizar ADR
  app.put('/api/adrs/:id', async (req, res) => {
    const connection = await getUtf8Connection();
    try {
      await connection.beginTransaction();

      const {
        descricao,
        status,
        contexto,
        decisao,
        justificativa,
        consequenciasPositivas,
        consequenciasNegativas,
        riscos,
        alternativasConsideradas,
        complianceConstitution,
        adrSubstitutaId,
        referencias,
        aplicacoes
      } = req.body;

      console.log('[PUT /api/adrs/:id] Status recebido:', status, '| Tipo:', typeof status);
      console.log('[PUT /api/adrs/:id] Body completo:', JSON.stringify(req.body, null, 2));

      // Validar ADR substituta se status for "Substituido"
      if (status === 'Substituido' && !adrSubstitutaId) {
        await connection.rollback();
        return res.status(400).json({
          error: 'Campo adrSubstitutaId é obrigatório quando status é Substituido',
          code: 'MISSING_SUBSTITUTA'
        });
      }

      // Validar status ENUM
      const statusValidos = ['Proposto', 'Aceito', 'Rejeitado', 'Substituido', 'Obsoleto', 'Adiado/Retirado'];
      if (!status || !statusValidos.includes(status)) {
        await connection.rollback();
        return res.status(400).json({
          error: `Status inválido. Valores permitidos: ${statusValidos.join(', ')}`,
          code: 'INVALID_STATUS',
          receivedStatus: status
        });
      }

      // WORKAROUND: Normalizar status para evitar problema de encoding
      // MySQL espera UTF-8 com normalização NFC (Canonical Composition)
      let statusNormalizado = status.normalize('NFC');
      
      console.log('[PUT /api/adrs/:id] Status original:', status, '| Bytes:', Buffer.from(status).toString('hex'));
      console.log('[PUT /api/adrs/:id] Status normalizado:', statusNormalizado, '| Bytes:', Buffer.from(statusNormalizado).toString('hex'));

      console.log('[PUT /api/adrs/:id] Valores para UPDATE:', {
        descricao, status: statusNormalizado, contexto, decisao, justificativa,
        consequenciasPositivas, consequenciasNegativas, riscos,
        alternativasConsideradas, complianceConstitution,
        adrSubstitutaId
      });

      // Executar UPDATE sem o status primeiro (para evitar erro de truncamento)
      await connection.query(
        `UPDATE adrs SET
          descricao = ?,
          contexto = ?,
          decisao = ?,
          justificativa = ?,
          consequencias_positivas = ?,
          consequencias_negativas = ?,
          riscos = ?,
          alternativas_consideradas = ?,
          compliance_constitution = ?,
          adr_substituta_id = ?
        WHERE id = ?`,
        [
          descricao, contexto, decisao, justificativa,
          consequenciasPositivas, consequenciasNegativas, riscos,
          alternativasConsideradas, complianceConstitution,
          adrSubstitutaId || null, req.params.id
        ]
      );

      console.log('[PUT /api/adrs/:id] Campos atualizados (exceto status)');

      // Atualizar o status em query separada
      try {
        const statusBytes = Buffer.from(statusNormalizado, 'utf8');
        console.log('[PUT /api/adrs/:id] Tentando atualizar status. Buffer:', statusBytes.toString('hex'));
        
        await connection.query('UPDATE adrs SET status = ? WHERE id = ?', [statusNormalizado, req.params.id]);
        console.log('[PUT /api/adrs/:id] ✅ Status atualizado com sucesso');
      } catch (statusError) {
        console.error('[PUT /api/adrs/:id] ❌ ERRO ao atualizar status:', statusError.message);
        console.error('[PUT /api/adrs/:id] Código do erro:', statusError.code);
        
        // Tentar com CAST explícito
        try {
          await connection.query(
            `UPDATE adrs SET status = CAST(? AS CHAR CHARACTER SET utf8mb4) WHERE id = ?`,
            [statusNormalizado, req.params.id]
          );
          console.log('[PUT /api/adrs/:id] ✅ Status atualizado com CAST');
        } catch (castError) {
          console.error('[PUT /api/adrs/:id] ❌ Falha até com CAST:', castError.message);
        }
      }

      console.log('[PUT /api/adrs/:id] UPDATE executado com sucesso');

      // Atualizar aplicações (remover e reinserir)
      await connection.query('DELETE FROM adr_aplicacoes WHERE adr_id = ?', [req.params.id]);

      if (aplicacoes && aplicacoes.length > 0) {
        for (const app of aplicacoes) {
          await connection.query(
            `INSERT INTO adr_aplicacoes (
              id, adr_id, aplicacao_id, data_inicio, data_termino, status, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uuidv4(), req.params.id, app.aplicacaoId, app.dataInicio || null,
              app.dataTermino || null, app.status, app.observacoes
            ]
          );
        }
      }

      await connection.commit();

      // Buscar ADR atualizado
      const [adrs] = await pool.query(`
        SELECT 
          a.*,
          a.data_criacao as dataCriacao,
          a.created_at as createdAt,
          a.updated_at as updatedAt,
          a.adr_substituta_id as adrSubstitutaId
        FROM adrs a
        WHERE a.id = ?
      `, [req.params.id]);

      res.json(adrs[0]);
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao atualizar ADR:', error);
      res.status(500).json({ error: 'Erro ao atualizar ADR' });
    } finally {
      connection.release();
    }
  });

  // DELETE /api/adrs/:id - Excluir ADR
  app.delete('/api/adrs/:id', async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM adrs WHERE id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'ADR não encontrado' });
      }

      res.json({ message: 'ADR excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir ADR:', error);
      res.status(500).json({ error: 'Erro ao excluir ADR' });
    }
  });

  // ===========================
  // INNERSOURCE PROJECTS ROUTES
  // ===========================

  // GET - Listar todos os projetos InnerSource
  app.get('/api/innersource-projects', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM innersource_projects 
        ORDER BY nome ASC
      `);
      
      // Parse JSON fields with error handling
      const projects = rows.map(row => {
        let owner = row.owner;
        let metadata = row.metadata;
        
        try {
          owner = typeof row.owner === 'string' ? JSON.parse(row.owner) : row.owner;
        } catch (e) {
          console.error('Error parsing owner JSON:', e);
          owner = {};
        }
        
        try {
          metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        } catch (e) {
          console.error('Error parsing metadata JSON:', e);
          metadata = {};
        }
        
        return {
          ...row,
          owner,
          _InnerSourceMetadata: metadata
        };
      });
      
      res.json(projects);
    } catch (err) {
      console.error('Erro ao listar projetos InnerSource:', err);
      res.status(500).json({ error: 'Erro ao listar projetos InnerSource' });
    }
  });

  // GET - Buscar projeto InnerSource por ID
  app.get('/api/innersource-projects/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM innersource_projects WHERE id = ?',
        [req.params.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Projeto InnerSource não encontrado' });
      }
      
      // Parse JSON fields with error handling
      let owner = rows[0].owner;
      let metadata = rows[0].metadata;
      
      try {
        owner = typeof rows[0].owner === 'string' ? JSON.parse(rows[0].owner) : rows[0].owner;
      } catch (e) {
        console.error('Error parsing owner JSON:', e);
        owner = {};
      }
      
      try {
        metadata = typeof rows[0].metadata === 'string' ? JSON.parse(rows[0].metadata) : rows[0].metadata;
      } catch (e) {
        console.error('Error parsing metadata JSON:', e);
        metadata = {};
      }
      
      const project = {
        ...rows[0],
        owner,
        _InnerSourceMetadata: metadata
      };
      
      res.json(project);
    } catch (err) {
      console.error('Erro ao buscar projeto InnerSource:', err);
      res.status(500).json({ error: 'Erro ao buscar projeto InnerSource' });
    }
  });

  // POST - Criar novo projeto InnerSource
  app.post('/api/innersource-projects', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const project = req.body;
      const id = project.id || uuidv4();

      await connection.query(`
        INSERT INTO innersource_projects (
          id, nome, full_nome, html_url, descricao,
          stargazers_count, watchers_count, language,
          forks_count, open_issues_count, license,
          owner, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        project.nome,
        project.full_nome,
        project.html_url,
        project.descricao || null,
        project.stargazers_count || 0,
        project.watchers_count || 0,
        project.language || null,
        project.forks_count || 0,
        project.open_issues_count || 0,
        project.license || null,
        JSON.stringify(project.owner),
        JSON.stringify(project._InnerSourceMetadata)
      ]);

      await connection.commit();
      res.status(201).json({ id, message: 'Projeto InnerSource criado com sucesso' });
    } catch (err) {
      await connection.rollback();
      console.error('Erro ao criar projeto InnerSource:', err);
      res.status(500).json({ error: 'Erro ao criar projeto InnerSource' });
    } finally {
      connection.release();
    }
  });

  // PUT - Atualizar projeto InnerSource
  app.put('/api/innersource-projects/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const project = req.body;

      await connection.query(`
        UPDATE innersource_projects SET
          nome = ?,
          full_nome = ?,
          html_url = ?,
          descricao = ?,
          stargazers_count = ?,
          watchers_count = ?,
          language = ?,
          forks_count = ?,
          open_issues_count = ?,
          license = ?,
          owner = ?,
          metadata = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        project.nome,
        project.full_nome,
        project.html_url,
        project.descricao || null,
        project.stargazers_count || 0,
        project.watchers_count || 0,
        project.language || null,
        project.forks_count || 0,
        project.open_issues_count || 0,
        project.license || null,
        JSON.stringify(project.owner),
        JSON.stringify(project._InnerSourceMetadata),
        req.params.id
      ]);

      await connection.commit();
      res.json({ message: 'Projeto InnerSource atualizado com sucesso' });
    } catch (err) {
      await connection.rollback();
      console.error('Erro ao atualizar projeto InnerSource:', err);
      res.status(500).json({ error: 'Erro ao atualizar projeto InnerSource' });
    } finally {
      connection.release();
    }
  });

  // DELETE - Excluir projeto InnerSource
  app.delete('/api/innersource-projects/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM innersource_projects WHERE id = ?', [req.params.id]);
      res.json({ message: 'Projeto InnerSource excluído com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir projeto InnerSource:', err);
      res.status(500).json({ error: 'Erro ao excluir projeto InnerSource' });
    }
  });

  // ==================== SPACE DASHBOARD ====================
  
  // GET /api/space-dashboard - Buscar métricas SPACE do Azure DevOps
  app.get('/api/space-dashboard', async (req, res) => {
    try {
      const { projectName, startDate, endDate, sprint } = req.query;

      if (!projectName) {
        return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
      }

      console.log('[SPACE] Buscando métricas para projeto:', projectName, 'período:', startDate, '-', endDate);

      // Buscar configurações do Azure DevOps
      const [configRows] = await pool.query(
        'SELECT chave, valor FROM configuracoes WHERE chave LIKE "azure_%"'
      );
      
      const config = {};
      configRows.forEach(row => {
        config[row.chave] = row.valor;
      });

      // Inicializar Azure DevOps Service
      const azureService = new AzureDevOpsService(
        config.azure_organization || 'your-org',
        config.azure_pat_token || ''
      );

      // Buscar dados agregados (mock de exemplo - deve ser integrado com Azure DevOps APIs)
      const dashboardData = await generateSpaceDashboard(
        azureService,
        projectName,
        startDate,
        endDate,
        sprint
      );

      res.json(dashboardData);
    } catch (error) {
      console.error('[SPACE] Erro ao gerar dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar métricas SPACE', code: 'DASHBOARD_ERROR' });
    }
  });

  // Função auxiliar para gerar dashboard SPACE com dados reais do Azure DevOps
  async function generateSpaceDashboard(azureService, projectName, startDate, endDate, sprint) {
    console.log('[SPACE] Buscando dados do projeto:', projectName);
    console.log('[SPACE] Período:', startDate, 'até', endDate);
    
    try {
      // Buscar ID do projeto no banco
      const [projectRows] = await pool.query(
        'SELECT id FROM estruturas_projeto WHERE projeto = ? AND status = "Processado"',
        [projectName]
      );
      
      if (projectRows.length === 0) {
        console.error('[SPACE] Projeto não encontrado no banco:', projectName);
        return generateEmptyDashboard(projectName, startDate, endDate, sprint, 'Projeto não encontrado ou não está processado');
      }
      
      const projetoId = projectRows[0].id;
      console.log('[SPACE] Projeto ID encontrado:', projetoId);
      
      // Buscar work items do banco de dados local (sincronizados do Azure DevOps)
      let query = `
        SELECT 
          work_item_id as id,
          title,
          work_item_type as type,
          state,
          priority,
          area_path as areaPath,
          iteration_path as iterationPath,
          created_date as createdDate,
          closed_date as closedDate,
          changed_date as changedDate,
          assigned_to as assignedTo,
          story_points as storyPoints,
          activity,
          effort,
          remaining_work as remainingWork,
          completed_work as completedWork
        FROM azure_work_items
        WHERE projeto_id = ?
      `;
      
      const params = [projetoId];
      
      // Filtrar por período se fornecido
      if (startDate && endDate) {
        query += ` AND created_date BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      
      const [workItemRows] = await pool.query(query, params);
      const workItemCount = workItemRows?.length || 0;
      console.log('[SPACE] Work items encontrados no banco:', workItemCount);
      
      // Se não houver work items, retornar dashboard vazio com mensagem
      if (workItemCount === 0) {
        console.warn('[SPACE] Nenhum work item encontrado para o projeto:', projectName);
        return generateEmptyDashboard(projectName, startDate, endDate, sprint, 'Nenhum work item sincronizado para este projeto. Faça a sincronização na tela de Sincronização Azure DevOps.');
      }
      
      // Converter para formato esperado pelas funções de cálculo
      const workItems = workItemRows.map(row => ({
        id: row.id,
        title: row.title || 'Sem título',
        type: row.type || 'Unknown',
        state: row.state || 'Unknown',
        priority: row.priority || 999,
        tags: '', // Tags não estão na tabela, usar vazio
        createdDate: row.createdDate,
        closedDate: row.closedDate,
        changedDate: row.changedDate,
        assignedTo: row.assignedTo,
        areaPath: row.areaPath,
        iterationPath: row.iterationPath,
        storyPoints: row.storyPoints,
        activity: row.activity,
        effort: row.effort,
        remainingWork: row.remainingWork,
        completedWork: row.completedWork,
        reason: '' // Reason não está na tabela
      }));
      
      console.log('[SPACE] Work items carregados e convertidos:', workItems.length);
      
      // S - Satisfaction (dados da tabela - não integrado com Azure DevOps)
      const satisfaction = {
        enps: 45, // TODO: Importar de pesquisas externas
        enpsTrend: [
          { date: '2024-10-01', score: 38 },
          { date: '2024-11-01', score: 42 },
          { date: '2024-12-01', score: 45 }
        ],
        teamMood: 'positive',
        comments: [
          'Dados de satisfação devem ser importados de pesquisas externas',
          'Configure integração com Microsoft Forms ou Viva Insights'
        ],
        lastUpdate: new Date().toISOString()
      };

      // P - Performance (Azure Boards)
      const performance = await calculatePerformanceMetrics(workItems, projectName);

      // A - Activity (Calculado dos work items)
      const activity = await calculateActivityMetrics(workItems, startDate, endDate);

      // C - Communication (Azure Boards - itens bloqueados)
      const communication = await calculateCommunicationMetrics(workItems);

      // E - Efficiency (Azure Boards - Lead/Cycle Time)
      const efficiency = await calculateEfficiencyMetrics(workItems, startDate, endDate);

      return {
        satisfaction,
        performance,
        activity,
        communication,
        efficiency,
        period: {
          startDate,
          endDate,
          sprint
        }
      };
    } catch (error) {
      console.error('[SPACE] Erro ao buscar dados do Azure:', error);
      console.error('[SPACE] Detalhes do erro:', error.message);
      // Retornar dashboard vazio em caso de erro
      return generateEmptyDashboard(projectName, startDate, endDate, sprint, `Erro ao buscar dados: ${error.message}`);
    }
  }

  // Calcular métricas de Performance
  async function calculatePerformanceMetrics(workItems, projectName) {
    if (!workItems || workItems.length === 0) {
      console.log('[SPACE Performance] Nenhum work item para calcular');
      return {
        workItemsPlanned: 0,
        workItemsDelivered: 0,
        deliveryRate: 0,
        criticalBugs: 0,
        criticalBugsReopened: 0,
        releaseSuccessRate: 0,
        releases: []
      };
    }

    console.log('[SPACE Performance] Analisando', workItems.length, 'work items');
    
    // Contar por estado
    const byState = {};
    const byType = {};
    workItems.forEach(wi => {
      const state = wi.state || 'Unknown';
      const type = wi.workItemType || 'Unknown';
      byState[state] = (byState[state] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;
    });
    
    console.log('[SPACE Performance] Work items por estado:', byState);
    console.log('[SPACE Performance] Work items por tipo:', byType);

    // Estados que consideramos "entregue"
    const deliveredStates = ['Done', 'Closed', 'Resolved'];
    const delivered = workItems.filter(wi => deliveredStates.includes(wi.state)).length;
    const planned = workItems.length;
    
    // Bugs críticos abertos (Priority 1 ou 2)
    const criticalBugs = workItems.filter(wi => {
      const isBug = wi.workItemType === 'Bug';
      const isCritical = wi.priority && wi.priority <= 2;
      const isOpen = !deliveredStates.includes(wi.state);
      return isBug && isCritical && isOpen;
    });
    
    console.log('[SPACE Performance] Entregues:', delivered, 'de', planned);
    console.log('[SPACE Performance] Bugs críticos abertos:', criticalBugs.length);

    return {
      workItemsPlanned: planned,
      workItemsDelivered: delivered,
      deliveryRate: planned > 0 ? Math.round((delivered / planned) * 100) : 0,
      criticalBugs: criticalBugs.length,
      criticalBugsReopened: 0,
      releaseSuccessRate: 0,
      releases: []
    };
  }

  // Calcular métricas de Activity
  async function calculateActivityMetrics(workItems, startDate, endDate) {
    if (!workItems || workItems.length === 0) {
      console.log('[SPACE Activity] Nenhum work item para calcular');
      return {
        pullRequestsCreated: 0,
        pullRequestsMerged: 0,
        commits: 0,
        workItemsMovements: 0,
        prTrend: [],
        commitTrend: []
      };
    }

    console.log('[SPACE Activity] Analisando', workItems.length, 'work items');
    
    // Contar movimentações (itens que foram alterados no período)
    const movements = workItems.filter(wi => {
      if (!wi.changedDate) return false;
      const changed = new Date(wi.changedDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return changed >= start && changed <= end;
    }).length;

    console.log('[SPACE Activity] Movimentações no período:', movements);

    return {
      pullRequestsCreated: 0,
      pullRequestsMerged: 0,
      commits: 0,
      workItemsMovements: movements,
      prTrend: [],
      commitTrend: []
    };
  }

  // Calcular métricas de Communication
  async function calculateCommunicationMetrics(workItems) {
    if (!workItems || workItems.length === 0) {
      console.log('[SPACE Communication] Nenhum work item para calcular');
      return {
        avgPrReviewTime: 0,
        avgReviewersPerPr: 0,
        prsWithComments: 0,
        totalPrs: 0,
        blockedItems: 0,
        blockedItemsList: []
      };
    }

    console.log('[SPACE Communication] Analisando', workItems.length, 'work items');

    // Buscar itens bloqueados (estado = Blocked ou tag Blocked)
    const blocked = workItems.filter(wi => {
      const stateBlocked = wi.state === 'Blocked';
      const tagBlocked = wi.tags && (
        wi.tags.includes('Blocked') || 
        wi.tags.includes('blocked') ||
        wi.tags.toLowerCase().includes('blocked')
      );
      return stateBlocked || tagBlocked;
    });

    console.log('[SPACE Communication] Itens bloqueados:', blocked.length);

    const blockedItemsList = blocked.map(wi => {
      const createdDate = wi.createdDate ? new Date(wi.createdDate) : new Date();
      const blockedDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: wi.id?.toString() || 'N/A',
        title: wi.title || 'Sem título',
        blockedDays: blockedDays,
        reason: wi.reason || wi.tags || 'Não especificado'
      };
    });

    return {
      avgPrReviewTime: 0,
      avgReviewersPerPr: 0,
      prsWithComments: 0,
      totalPrs: 0,
      blockedItems: blocked.length,
      blockedItemsList: blockedItemsList.slice(0, 10)
    };
  }

  // Calcular métricas de Efficiency
  async function calculateEfficiencyMetrics(workItems, startDate, endDate) {
    if (!workItems || workItems.length === 0) {
      console.log('[SPACE Efficiency] Nenhum work item para calcular');
      return {
        leadTime: 0,
        cycleTime: 0,
        wipByState: {},
        agingItems: [],
        cumulativeFlow: []
      };
    }

    console.log('[SPACE Efficiency] Analisando', workItems.length, 'work items');

    // WIP por estado - contagem atual
    const wipByState = {};
    workItems.forEach(wi => {
      const state = wi.state || 'Unknown';
      wipByState[state] = (wipByState[state] || 0) + 1;
    });

    console.log('[SPACE Efficiency] WIP por estado:', wipByState);

    // Lead Time e Cycle Time apenas para itens concluídos
    const deliveredStates = ['Done', 'Closed', 'Resolved'];
    const completedItems = workItems.filter(wi => 
      deliveredStates.includes(wi.state) && wi.createdDate && wi.closedDate
    );

    console.log('[SPACE Efficiency] Itens concluídos com datas:', completedItems.length);

    let totalLeadTime = 0;
    let validLeadTimeCount = 0;
    
    completedItems.forEach(wi => {
      try {
        const created = new Date(wi.createdDate);
        const closed = new Date(wi.closedDate);
        
        if (!isNaN(created.getTime()) && !isNaN(closed.getTime())) {
          const leadTime = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          if (leadTime >= 0) {
            totalLeadTime += leadTime;
            validLeadTimeCount++;
          }
        }
      } catch (e) {
        console.error('[SPACE Efficiency] Erro ao calcular lead time:', e);
      }
    });

    const avgLeadTime = validLeadTimeCount > 0 ? totalLeadTime / validLeadTimeCount : 0;
    const avgCycleTime = avgLeadTime * 0.6; // Aproximação: 60% do lead time

    console.log('[SPACE Efficiency] Lead Time médio:', avgLeadTime.toFixed(2), 'dias');
    console.log('[SPACE Efficiency] Cycle Time médio:', avgCycleTime.toFixed(2), 'dias');

    // Itens envelhecendo (não concluídos há mais de 7 dias)
    const now = Date.now();
    const agingItems = workItems
      .filter(wi => !deliveredStates.includes(wi.state))
      .map(wi => {
        let age = 0;
        if (wi.createdDate) {
          try {
            const created = new Date(wi.createdDate);
            if (!isNaN(created.getTime())) {
              age = Math.floor((now - created.getTime()) / (1000 * 60 * 60 * 24));
            }
          } catch (e) {
            console.error('[SPACE Efficiency] Erro ao calcular idade:', e);
          }
        }
        
        return {
          id: wi.id?.toString() || 'N/A',
          title: wi.title || 'Sem título',
          state: wi.state || 'Unknown',
          age: age
        };
      })
      .filter(item => item.age > 7)
      .sort((a, b) => b.age - a.age);

    console.log('[SPACE Efficiency] Itens envelhecendo (>7 dias):', agingItems.length);

    return {
      leadTime: avgLeadTime,
      cycleTime: avgCycleTime,
      wipByState: wipByState,
      agingItems: agingItems.slice(0, 10),
      cumulativeFlow: generateCFD(startDate, endDate)
    };
  }

  // Fallback para dados mock


  // Dashboard vazio para projetos sem work items
  function generateEmptyDashboard(projectName, startDate, endDate, sprint, errorMessage = null) {
    console.log('[SPACE] Gerando dashboard vazio para:', projectName);
    if (errorMessage) {
      console.error('[SPACE] Motivo:', errorMessage);
    }
    
    const message = errorMessage 
      ? `Erro: ${errorMessage}` 
      : `Nenhum work item encontrado para o projeto "${projectName}" no período selecionado. Verifique se o projeto existe no Azure DevOps e possui work items criados.`;
    
    return {
      isEmpty: true,
      projectName,
      message,
      satisfaction: {
        enps: 0,
        enpsTrend: [],
        teamMood: 'neutral',
        comments: [message],
        lastUpdate: new Date().toISOString()
      },
      performance: {
        workItemsPlanned: 0,
        workItemsDelivered: 0,
        deliveryRate: 0,
        criticalBugs: 0,
        criticalBugsReopened: 0,
        releaseSuccessRate: 0,
        releases: [],
        message: 'Nenhum dado disponível'
      },
      activity: {
        pullRequestsCreated: 0,
        pullRequestsMerged: 0,
        commits: 0,
        workItemsMovements: 0,
        prTrend: [],
        commitTrend: [],
        message: 'Nenhum dado disponível'
      },
      communication: {
        avgPrReviewTime: 0,
        avgReviewersPerPr: 0,
        prsWithComments: 0,
        totalPrs: 0,
        blockedItems: 0,
        blockedItemsList: [],
        message: 'Nenhum dado disponível'
      },
      efficiency: {
        leadTime: 0,
        cycleTime: 0,
        wipByState: {},
        agingItems: [],
        cumulativeFlow: [],
        message: 'Nenhum dado disponível'
      },
      period: { startDate, endDate, sprint }
    };
  }

  // Gerar CFD vazio (não mock - apenas estrutura)
  function generateCFD(startDate, endDate) {
    console.log('[SPACE CFD] Gerando estrutura vazia de CFD');
    return [];
  }

  // ========================================
  // FinOps-Focus Endpoints
  // ========================================

  // GET /api/finops/providers - Listar provedores cloud
  app.get('/api/finops/providers', async (req, res) => {
    try {
      const [providers] = await pool.query(`
        SELECT 
          id,
          name,
          display_name as displayName,
          api_endpoint as apiEndpoint,
          last_sync_date as lastSyncDate,
          active,
          metadata,
          created_at as createdAt,
          updated_at as updatedAt
        FROM finops_providers
        ORDER BY name
      `);
      
      res.json(providers);
    } catch (error) {
      console.error('[FinOps] Erro ao buscar provedores:', error);
      res.status(500).json({ error: 'Erro ao buscar provedores' });
    }
  });

  // POST /api/finops/ingest - Receber dados de custos dos provedores
  app.post('/api/finops/ingest', async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { provider, resources } = req.body;

      if (!provider || !resources || !Array.isArray(resources)) {
        return res.status(400).json({ 
          error: 'Dados inválidos. Esperado: { provider, resources: [...] }' 
        });
      }

      // Buscar ID do provedor
      const [providerRows] = await connection.query(
        'SELECT id FROM finops_providers WHERE name = ?',
        [provider]
      );

      if (providerRows.length === 0) {
        return res.status(400).json({ error: `Provedor ${provider} não encontrado` });
      }

      const providerId = providerRows[0].id;
      let processedCount = 0;
      let errorCount = 0;

      for (const resourceData of resources) {
        try {
          const {
            resource_id,
            resource_type,
            resource_name,
            aplicacao_id,
            region,
            tags,
            usage = {},
            cost,
            service_category,
            cost_date
          } = resourceData;

          if (!resource_id || !resource_type || !cost || !cost.total_cost || !cost_date) {
            console.warn('[FinOps] Dados incompletos para recurso:', resource_id);
            errorCount++;
            continue;
          }

          // Inserir ou atualizar recurso
          const resourceId = uuidv4();
          await connection.query(`
            INSERT INTO finops_resources (
              id, provider_id, aplicacao_id, resource_id, resource_type, 
              resource_name, region, tags, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              aplicacao_id = VALUES(aplicacao_id),
              resource_name = VALUES(resource_name),
              region = VALUES(region),
              tags = VALUES(tags),
              metadata = VALUES(metadata),
              updated_at = CURRENT_TIMESTAMP
          `, [
            resourceId,
            providerId,
            aplicacao_id || null,
            resource_id,
            resource_type,
            resource_name || null,
            region || null,
            tags ? JSON.stringify(tags) : null,
            JSON.stringify({ lastUpdate: new Date().toISOString() })
          ]);

          // Buscar ID do recurso (novo ou existente)
          const [existingResource] = await connection.query(
            'SELECT id FROM finops_resources WHERE provider_id = ? AND resource_id = ?',
            [providerId, resource_id]
          );

          const finalResourceId = existingResource[0].id;

          // Inserir custo diário
          const costId = uuidv4();
          const isTagged = tags && Object.keys(tags).length > 0;
          const isAllocated = !!aplicacao_id;

          // Calcular unit cost (custo por request, se disponível)
          const unitCost = usage.requests_count > 0 
            ? cost.total_cost / usage.requests_count 
            : null;

          await connection.query(`
            INSERT INTO finops_costs_daily (
              id, resource_id, provider_id, aplicacao_id, cost_date,
              cpu_hours, storage_gb, network_gb, memory_gb_hours, requests_count,
              cpu_cost, storage_cost, network_cost, memory_cost, other_cost, total_cost,
              service_category, is_tagged, is_allocated, unit_cost,
              currency, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              cpu_hours = VALUES(cpu_hours),
              storage_gb = VALUES(storage_gb),
              network_gb = VALUES(network_gb),
              memory_gb_hours = VALUES(memory_gb_hours),
              requests_count = VALUES(requests_count),
              cpu_cost = VALUES(cpu_cost),
              storage_cost = VALUES(storage_cost),
              network_cost = VALUES(network_cost),
              memory_cost = VALUES(memory_cost),
              other_cost = VALUES(other_cost),
              total_cost = VALUES(total_cost),
              service_category = VALUES(service_category),
              is_tagged = VALUES(is_tagged),
              is_allocated = VALUES(is_allocated),
              unit_cost = VALUES(unit_cost),
              updated_at = CURRENT_TIMESTAMP
          `, [
            costId,
            finalResourceId,
            providerId,
            aplicacao_id || null,
            cost_date,
            usage.cpu_hours || 0,
            usage.storage_gb || 0,
            usage.network_gb || 0,
            usage.memory_gb_hours || 0,
            usage.requests_count || 0,
            cost.cpu_cost || 0,
            cost.storage_cost || 0,
            cost.network_cost || 0,
            cost.memory_cost || 0,
            cost.other_cost || 0,
            cost.total_cost,
            service_category || 'Other',
            isTagged,
            isAllocated,
            unitCost,
            'USD',
            JSON.stringify({ provider, imported: new Date().toISOString() })
          ]);

          processedCount++;
        } catch (resourceError) {
          console.error('[FinOps] Erro ao processar recurso:', resourceError);
          errorCount++;
        }
      }

      // Atualizar data de sincronização do provedor
      await connection.query(
        'UPDATE finops_providers SET last_sync_date = NOW() WHERE id = ?',
        [providerId]
      );

      await connection.commit();

      res.json({
        success: true,
        provider,
        processed: processedCount,
        errors: errorCount,
        message: `${processedCount} recursos processados com sucesso`
      });

    } catch (error) {
      await connection.rollback();
      console.error('[FinOps] Erro ao ingerir dados:', error);
      res.status(500).json({ error: 'Erro ao processar dados de custos' });
    } finally {
      connection.release();
    }
  });

  // GET /api/finops/dashboard - Dados para dashboard
  app.get('/api/finops/dashboard', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = startDate && endDate
        ? `cost_date BETWEEN '${startDate}' AND '${endDate}'`
        : `cost_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;

      // KPIs principais
      const [kpiResults] = await pool.query(`
        SELECT 
          SUM(total_cost) as totalCost,
          SUM(CASE WHEN is_allocated = 0 THEN total_cost ELSE 0 END) as unallocatedCost,
          COUNT(DISTINCT resource_id) as totalResources,
          COUNT(DISTINCT aplicacao_id) as totalApplications
        FROM finops_costs_daily
        WHERE ${dateFilter}
      `);

      const kpis = kpiResults[0];
      const unallocatedPercentage = kpis.totalCost > 0 
        ? ((kpis.unallocatedCost / kpis.totalCost) * 100).toFixed(2)
        : 0;

      // Top 5 aplicações por custo
      const [topApps] = await pool.query(`
        SELECT 
          a.sigla as name,
          SUM(c.total_cost) as cost
        FROM finops_costs_daily c
        LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
        WHERE ${dateFilter} AND c.aplicacao_id IS NOT NULL
        GROUP BY c.aplicacao_id, a.sigla
        ORDER BY cost DESC
        LIMIT 5
      `);

      // Custo por dia e aplicação
      const [costByDay] = await pool.query(`
        SELECT 
          cost_date as date,
          COALESCE(a.sigla, 'Não Alocado') as aplicacao,
          SUM(total_cost) as cost
        FROM finops_costs_daily c
        LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
        WHERE ${dateFilter}
        GROUP BY cost_date, aplicacao
        ORDER BY cost_date
      `);

      // Custo por provedor
      const [costByProvider] = await pool.query(`
        SELECT 
          p.name as provider,
          SUM(c.total_cost) as cost
        FROM finops_costs_daily c
        JOIN finops_providers p ON c.provider_id = p.id
        WHERE ${dateFilter}
        GROUP BY p.name
      `);

      // Custo por serviço
      const [costByService] = await pool.query(`
        SELECT 
          service_category as service,
          SUM(total_cost) as cost
        FROM finops_costs_daily
        WHERE ${dateFilter}
        GROUP BY service_category
        ORDER BY cost DESC
      `);

      // Tagged vs Untagged
      const [taggedStats] = await pool.query(`
        SELECT 
          SUM(CASE WHEN is_tagged = 1 THEN total_cost ELSE 0 END) as tagged,
          SUM(CASE WHEN is_tagged = 0 THEN total_cost ELSE 0 END) as untagged
        FROM finops_costs_daily
        WHERE ${dateFilter}
      `);

      // Allocated vs Unallocated
      const [allocatedStats] = await pool.query(`
        SELECT 
          SUM(CASE WHEN is_allocated = 1 THEN total_cost ELSE 0 END) as allocated,
          SUM(CASE WHEN is_allocated = 0 THEN total_cost ELSE 0 END) as unallocated
        FROM finops_costs_daily
        WHERE ${dateFilter}
      `);

      res.json({
        kpis: {
          totalDailyCost: parseFloat(kpis.totalCost || 0),
          unallocatedCostPercentage: parseFloat(unallocatedPercentage),
          topApplications: topApps.map(app => ({
            name: app.name,
            cost: parseFloat(app.cost)
          }))
        },
        costByDay,
        costByProvider,
        costByService,
        taggedVsUntagged: {
          tagged: parseFloat(taggedStats[0]?.tagged || 0),
          untagged: parseFloat(taggedStats[0]?.untagged || 0)
        },
        allocatedVsUnallocated: {
          allocated: parseFloat(allocatedStats[0]?.allocated || 0),
          unallocated: parseFloat(allocatedStats[0]?.unallocated || 0)
        }
      });

    } catch (error) {
      console.error('[FinOps] Erro ao buscar dados do dashboard:', error);
      res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
  });

  // GET /api/finops/resources - Listar recursos com custos
  app.get('/api/finops/resources', async (req, res) => {
    try {
      const { providerId, aplicacaoId } = req.query;
      
      let whereClause = '1=1';
      const params = [];

      if (providerId) {
        whereClause += ' AND r.provider_id = ?';
        params.push(providerId);
      }

      if (aplicacaoId) {
        whereClause += ' AND r.aplicacao_id = ?';
        params.push(aplicacaoId);
      }

      const [resources] = await pool.query(`
        SELECT 
          r.id,
          r.resource_id as resourceId,
          r.resource_type as resourceType,
          r.resource_name as resourceName,
          r.region,
          p.name as providerName,
          a.sigla as aplicacaoNome,
          r.tags,
          SUM(c.total_cost) as totalCost,
          MAX(c.cost_date) as lastCostDate
        FROM finops_resources r
        JOIN finops_providers p ON r.provider_id = p.id
        LEFT JOIN aplicacoes a ON r.aplicacao_id = a.id
        LEFT JOIN finops_costs_daily c ON r.id = c.resource_id
        WHERE ${whereClause}
        GROUP BY r.id
        ORDER BY totalCost DESC
      `, params);

      res.json(resources);
    } catch (error) {
      console.error('[FinOps] Erro ao buscar recursos:', error);
      res.status(500).json({ error: 'Erro ao buscar recursos' });
    }
  });

  // ==================== CASOS DE TESTE ====================
  
  // GET /api/casos-teste - Listar todos os casos de teste
  app.get('/api/casos-teste', async (req, res) => {
    try {
      const { aplicacaoId } = req.query;
      let query = `
        SELECT ct.*, a.sigla as aplicacao_nome
        FROM casos_teste ct
        LEFT JOIN aplicacoes a ON ct.aplicacao_id = a.id
      `;
      const params = [];
      
      if (aplicacaoId) {
        query += ' WHERE ct.aplicacao_id = ?';
        params.push(aplicacaoId);
      }
      
      query += ' ORDER BY ct.created_at DESC';
      
      const [rows] = await pool.query(query, params);
      const casosTeste = rows.map(row => ({
        id: row.id,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        titulo: row.titulo,
        descricao: row.descricao,
        requisitoVinculado: row.requisito_vinculado,
        tipoTeste: row.tipo_teste,
        prioridade: row.prioridade,
        status: row.status,
        preCondicoes: row.pre_condicoes,
        passosExecucao: row.passos_execucao,
        resultadoEsperado: row.resultado_esperado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(casosTeste);
    } catch (error) {
      console.error('Erro ao listar casos de teste:', error);
      res.status(500).json({ error: 'Erro ao buscar casos de teste', code: 'DATABASE_ERROR' });
    }
  });

  // GET /api/casos-teste/:id - Buscar caso de teste por ID
  app.get('/api/casos-teste/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT ct.*, a.sigla as aplicacao_nome
        FROM casos_teste ct
        LEFT JOIN aplicacoes a ON ct.aplicacao_id = a.id
        WHERE ct.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Caso de teste não encontrado', code: 'NOT_FOUND' });
      }
      
      const row = rows[0];
      const casoTeste = {
        id: row.id,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        titulo: row.titulo,
        descricao: row.descricao,
        requisitoVinculado: row.requisito_vinculado,
        tipoTeste: row.tipo_teste,
        prioridade: row.prioridade,
        status: row.status,
        preCondicoes: row.pre_condicoes,
        passosExecucao: row.passos_execucao,
        resultadoEsperado: row.resultado_esperado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(casoTeste);
    } catch (error) {
      console.error('Erro ao buscar caso de teste:', error);
      res.status(500).json({ error: 'Erro ao buscar caso de teste', code: 'DATABASE_ERROR' });
    }
  });

  // POST /api/casos-teste - Criar novo caso de teste
  app.post('/api/casos-teste', async (req, res) => {
    const { 
      aplicacaoId, titulo, descricao, requisitoVinculado, tipoTeste, 
      prioridade, status, preCondicoes, passosExecucao, resultadoEsperado 
    } = req.body;
    
    if (!aplicacaoId || !titulo || !tipoTeste) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        code: 'MISSING_FIELDS',
        missing: [!aplicacaoId && 'aplicacaoId', !titulo && 'titulo', !tipoTeste && 'tipoTeste'].filter(Boolean)
      });
    }
    
    try {
      const id = uuidv4();
      
      await pool.query(`
        INSERT INTO casos_teste (
          id, aplicacao_id, titulo, descricao, requisito_vinculado, tipo_teste, 
          prioridade, status, pre_condicoes, passos_execucao, resultado_esperado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, aplicacaoId, titulo, descricao || null, requisitoVinculado || null, 
        tipoTeste, prioridade || 'Media', status || 'Ativo', 
        preCondicoes || null, passosExecucao || null, resultadoEsperado || null
      ]);
      
      const [created] = await pool.query(`
        SELECT ct.*, a.sigla as aplicacao_nome
        FROM casos_teste ct
        LEFT JOIN aplicacoes a ON ct.aplicacao_id = a.id
        WHERE ct.id = ?
      `, [id]);
      
      const row = created[0];
      const casoTeste = {
        id: row.id,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        titulo: row.titulo,
        descricao: row.descricao,
        requisitoVinculado: row.requisito_vinculado,
        tipoTeste: row.tipo_teste,
        prioridade: row.prioridade,
        status: row.status,
        preCondicoes: row.pre_condicoes,
        passosExecucao: row.passos_execucao,
        resultadoEsperado: row.resultado_esperado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.status(201).json(casoTeste);
    } catch (error) {
      console.error('Erro ao criar caso de teste:', error);
      res.status(500).json({ error: 'Erro ao criar caso de teste', code: 'DATABASE_ERROR' });
    }
  });

  // PUT /api/casos-teste/:id - Atualizar caso de teste
  app.put('/api/casos-teste/:id', async (req, res) => {
    const { 
      aplicacaoId, titulo, descricao, requisitoVinculado, tipoTeste, 
      prioridade, status, preCondicoes, passosExecucao, resultadoEsperado 
    } = req.body;
    
    try {
      const [existing] = await pool.query('SELECT * FROM casos_teste WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Caso de teste não encontrado', code: 'NOT_FOUND' });
      }
      
      await pool.query(`
        UPDATE casos_teste SET 
          aplicacao_id = ?, titulo = ?, descricao = ?, requisito_vinculado = ?, 
          tipo_teste = ?, prioridade = ?, status = ?, pre_condicoes = ?, 
          passos_execucao = ?, resultado_esperado = ?
        WHERE id = ?
      `, [
        aplicacaoId || existing[0].aplicacao_id,
        titulo || existing[0].titulo,
        descricao !== undefined ? descricao : existing[0].descricao,
        requisitoVinculado !== undefined ? requisitoVinculado : existing[0].requisito_vinculado,
        tipoTeste || existing[0].tipo_teste,
        prioridade || existing[0].prioridade,
        status || existing[0].status,
        preCondicoes !== undefined ? preCondicoes : existing[0].pre_condicoes,
        passosExecucao !== undefined ? passosExecucao : existing[0].passos_execucao,
        resultadoEsperado !== undefined ? resultadoEsperado : existing[0].resultado_esperado,
        req.params.id
      ]);
      
      const [updated] = await pool.query(`
        SELECT ct.*, a.sigla as aplicacao_nome
        FROM casos_teste ct
        LEFT JOIN aplicacoes a ON ct.aplicacao_id = a.id
        WHERE ct.id = ?
      `, [req.params.id]);
      
      const row = updated[0];
      const casoTeste = {
        id: row.id,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        titulo: row.titulo,
        descricao: row.descricao,
        requisitoVinculado: row.requisito_vinculado,
        tipoTeste: row.tipo_teste,
        prioridade: row.prioridade,
        status: row.status,
        preCondicoes: row.pre_condicoes,
        passosExecucao: row.passos_execucao,
        resultadoEsperado: row.resultado_esperado,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(casoTeste);
    } catch (error) {
      console.error('Erro ao atualizar caso de teste:', error);
      res.status(500).json({ error: 'Erro ao atualizar caso de teste', code: 'DATABASE_ERROR' });
    }
  });

  // DELETE /api/casos-teste/:id - Deletar caso de teste
  app.delete('/api/casos-teste/:id', async (req, res) => {
    try {
      const [existing] = await pool.query('SELECT * FROM casos_teste WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Caso de teste não encontrado', code: 'NOT_FOUND' });
      }
      
      await pool.query('DELETE FROM casos_teste WHERE id = ?', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar caso de teste:', error);
      res.status(500).json({ error: 'Erro ao deletar caso de teste', code: 'DATABASE_ERROR' });
    }
  });

  // ==================== EXECUÇÕES DE TESTE ====================

  // Configurar multer para upload de evidências de teste
  const uploadTestEvidence = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = 'uploads/test-evidences/';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      }
    }),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos PDF, PNG ou JPG são permitidos'));
      }
    }
  });

  // GET /api/execucoes-teste - Listar todas as execuções de teste
  app.get('/api/execucoes-teste', async (req, res) => {
    try {
      const { aplicacaoId, casoTesteId, ambiente, executorId } = req.query;
      let query = `
        SELECT 
          et.*,
          COALESCE(ct.titulo, et.caso_teste_titulo) as caso_teste_titulo,
          a.sigla as aplicacao_nome,
          c.nome as executor_nome,
          c.matricula as executor_matricula
        FROM execucoes_teste et
        LEFT JOIN casos_teste ct ON et.caso_teste_id = ct.id
        LEFT JOIN aplicacoes a ON et.aplicacao_id = a.id
        LEFT JOIN colaboradores c ON et.executor_id = c.id
        WHERE 1=1
      `;
      const params = [];
      
      if (aplicacaoId) {
        query += ' AND et.aplicacao_id = ?';
        params.push(aplicacaoId);
      }
      if (casoTesteId) {
        query += ' AND et.caso_teste_id = ?';
        params.push(casoTesteId);
      }
      if (ambiente) {
        query += ' AND et.ambiente = ?';
        params.push(ambiente);
      }
      if (executorId) {
        query += ' AND et.executor_id = ?';
        params.push(executorId);
      }
      
      query += ' ORDER BY et.data_hora_inicio DESC';
      
      const [rows] = await pool.query(query, params);
      const execucoes = rows.map(row => ({
        id: row.id,
        casoTesteId: row.caso_teste_id,
        casoTesteTitulo: row.caso_teste_titulo,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        requisitoVinculado: row.requisito_vinculado,
        ambiente: row.ambiente,
        executorId: row.executor_id,
        executorNome: row.executor_nome,
        executorMatricula: row.executor_matricula,
        dataHoraInicio: row.data_hora_inicio,
        dataHoraTermino: row.data_hora_termino,
        registroAtividades: row.registro_atividades,
        resultadoExecucao: row.resultado_execucao,
        statusExecucao: row.status_execucao,
        arquivoResultado: row.arquivo_resultado,
        arquivoNomeOriginal: row.arquivo_nome_original,
        arquivoMimeType: row.arquivo_mime_type,
        arquivoTamanho: row.arquivo_tamanho,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      res.json(execucoes);
    } catch (error) {
      console.error('Erro ao listar execuções de teste:', error);
      res.status(500).json({ error: 'Erro ao buscar execuções de teste', code: 'DATABASE_ERROR' });
    }
  });

  // GET /api/execucoes-teste/:id - Buscar execução de teste por ID
  app.get('/api/execucoes-teste/:id', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          et.*,
          COALESCE(ct.titulo, et.caso_teste_titulo) as caso_teste_titulo,
          a.sigla as aplicacao_nome,
          c.nome as executor_nome,
          c.matricula as executor_matricula
        FROM execucoes_teste et
        LEFT JOIN casos_teste ct ON et.caso_teste_id = ct.id
        LEFT JOIN aplicacoes a ON et.aplicacao_id = a.id
        LEFT JOIN colaboradores c ON et.executor_id = c.id
        WHERE et.id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Execução de teste não encontrada', code: 'NOT_FOUND' });
      }
      
      const row = rows[0];
      const execucao = {
        id: row.id,
        casoTesteId: row.caso_teste_id,
        casoTesteTitulo: row.caso_teste_titulo,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        requisitoVinculado: row.requisito_vinculado,
        ambiente: row.ambiente,
        executorId: row.executor_id,
        executorNome: row.executor_nome,
        executorMatricula: row.executor_matricula,
        dataHoraInicio: row.data_hora_inicio,
        dataHoraTermino: row.data_hora_termino,
        registroAtividades: row.registro_atividades,
        resultadoExecucao: row.resultado_execucao,
        statusExecucao: row.status_execucao,
        arquivoResultado: row.arquivo_resultado,
        arquivoNomeOriginal: row.arquivo_nome_original,
        arquivoMimeType: row.arquivo_mime_type,
        arquivoTamanho: row.arquivo_tamanho,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(execucao);
    } catch (error) {
      console.error('Erro ao buscar execução de teste:', error);
      res.status(500).json({ error: 'Erro ao buscar execução de teste', code: 'DATABASE_ERROR' });
    }
  });

  // POST /api/execucoes-teste - Criar nova execução de teste
  app.post('/api/execucoes-teste', uploadTestEvidence.single('arquivo'), async (req, res) => {
    const { 
      casoTesteId, casoTesteTitulo, aplicacaoId, requisitoVinculado, ambiente, executorId,
      dataHoraInicio, dataHoraTermino, registroAtividades, resultadoExecucao, statusExecucao
    } = req.body;
    
    // Validar que pelo menos um dos dois está presente (casoTesteId ou casoTesteTitulo)
    if ((!casoTesteId && !casoTesteTitulo) || !aplicacaoId || !ambiente || !executorId || !dataHoraInicio) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        code: 'MISSING_FIELDS',
        missing: [
          (!casoTesteId && !casoTesteTitulo) && 'casoTesteId ou casoTesteTitulo', 
          !aplicacaoId && 'aplicacaoId', 
          !ambiente && 'ambiente',
          !executorId && 'executorId',
          !dataHoraInicio && 'dataHoraInicio'
        ].filter(Boolean)
      });
    }
    
    try {
      const id = uuidv4();
      
      let arquivoResultado = null;
      let arquivoNomeOriginal = null;
      let arquivoMimeType = null;
      let arquivoTamanho = null;
      
      if (req.file) {
        arquivoResultado = req.file.path;
        arquivoNomeOriginal = req.file.originalname;
        arquivoMimeType = req.file.mimetype;
        arquivoTamanho = req.file.size;
      }
      
      await pool.query(`
        INSERT INTO execucoes_teste (
          id, caso_teste_id, caso_teste_titulo, aplicacao_id, requisito_vinculado, ambiente, executor_id,
          data_hora_inicio, data_hora_termino, registro_atividades, resultado_execucao,
          status_execucao, arquivo_resultado, arquivo_nome_original, arquivo_mime_type, arquivo_tamanho
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, casoTesteId || null, casoTesteTitulo || null, aplicacaoId, requisitoVinculado || null, ambiente, executorId,
        dataHoraInicio, dataHoraTermino || null, registroAtividades || null, 
        resultadoExecucao || null, statusExecucao || 'Aguardando',
        arquivoResultado, arquivoNomeOriginal, arquivoMimeType, arquivoTamanho
      ]);
      
      const [created] = await pool.query(`
        SELECT 
          et.*,
          COALESCE(ct.titulo, et.caso_teste_titulo) as caso_teste_titulo,
          a.sigla as aplicacao_nome,
          c.nome as executor_nome,
          c.matricula as executor_matricula
        FROM execucoes_teste et
        LEFT JOIN casos_teste ct ON et.caso_teste_id = ct.id
        LEFT JOIN aplicacoes a ON et.aplicacao_id = a.id
        LEFT JOIN colaboradores c ON et.executor_id = c.id
        WHERE et.id = ?
      `, [id]);
      
      const row = created[0];
      const execucao = {
        id: row.id,
        casoTesteId: row.caso_teste_id,
        casoTesteTitulo: row.caso_teste_titulo,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        requisitoVinculado: row.requisito_vinculado,
        ambiente: row.ambiente,
        executorId: row.executor_id,
        executorNome: row.executor_nome,
        executorMatricula: row.executor_matricula,
        dataHoraInicio: row.data_hora_inicio,
        dataHoraTermino: row.data_hora_termino,
        registroAtividades: row.registro_atividades,
        resultadoExecucao: row.resultado_execucao,
        statusExecucao: row.status_execucao,
        arquivoResultado: row.arquivo_resultado,
        arquivoNomeOriginal: row.arquivo_nome_original,
        arquivoMimeType: row.arquivo_mime_type,
        arquivoTamanho: row.arquivo_tamanho,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.status(201).json(execucao);
    } catch (error) {
      console.error('Erro ao criar execução de teste:', error);
      res.status(500).json({ error: 'Erro ao criar execução de teste', code: 'DATABASE_ERROR' });
    }
  });

  // PUT /api/execucoes-teste/:id - Atualizar execução de teste
  app.put('/api/execucoes-teste/:id', uploadTestEvidence.single('arquivo'), async (req, res) => {
    const { 
      casoTesteId, casoTesteTitulo, aplicacaoId, requisitoVinculado, ambiente, executorId,
      dataHoraInicio, dataHoraTermino, registroAtividades, resultadoExecucao, statusExecucao
    } = req.body;
    
    try {
      const [existing] = await pool.query('SELECT * FROM execucoes_teste WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Execução de teste não encontrada', code: 'NOT_FOUND' });
      }
      
      let arquivoResultado = existing[0].arquivo_resultado;
      let arquivoNomeOriginal = existing[0].arquivo_nome_original;
      let arquivoMimeType = existing[0].arquivo_mime_type;
      let arquivoTamanho = existing[0].arquivo_tamanho;
      
      if (req.file) {
        // Deletar arquivo antigo se existir
        if (existing[0].arquivo_resultado && fs.existsSync(existing[0].arquivo_resultado)) {
          fs.unlinkSync(existing[0].arquivo_resultado);
        }
        
        arquivoResultado = req.file.path;
        arquivoNomeOriginal = req.file.originalname;
        arquivoMimeType = req.file.mimetype;
        arquivoTamanho = req.file.size;
      }
      
      await pool.query(`
        UPDATE execucoes_teste SET 
          caso_teste_id = ?, caso_teste_titulo = ?, aplicacao_id = ?, requisito_vinculado = ?, ambiente = ?, 
          executor_id = ?, data_hora_inicio = ?, data_hora_termino = ?, 
          registro_atividades = ?, resultado_execucao = ?, status_execucao = ?,
          arquivo_resultado = ?, arquivo_nome_original = ?, arquivo_mime_type = ?, arquivo_tamanho = ?
        WHERE id = ?
      `, [
        casoTesteId !== undefined ? casoTesteId : existing[0].caso_teste_id,
        casoTesteTitulo !== undefined ? casoTesteTitulo : existing[0].caso_teste_titulo,
        aplicacaoId || existing[0].aplicacao_id,
        requisitoVinculado !== undefined ? requisitoVinculado : existing[0].requisito_vinculado,
        ambiente || existing[0].ambiente,
        executorId || existing[0].executor_id,
        dataHoraInicio || existing[0].data_hora_inicio,
        dataHoraTermino !== undefined ? dataHoraTermino : existing[0].data_hora_termino,
        registroAtividades !== undefined ? registroAtividades : existing[0].registro_atividades,
        resultadoExecucao !== undefined ? resultadoExecucao : existing[0].resultado_execucao,
        statusExecucao || existing[0].status_execucao,
        arquivoResultado,
        arquivoNomeOriginal,
        arquivoMimeType,
        arquivoTamanho,
        req.params.id
      ]);
      
      const [updated] = await pool.query(`
        SELECT 
          et.*,
          COALESCE(ct.titulo, et.caso_teste_titulo) as caso_teste_titulo,
          a.sigla as aplicacao_nome,
          c.nome as executor_nome,
          c.matricula as executor_matricula
        FROM execucoes_teste et
        LEFT JOIN casos_teste ct ON et.caso_teste_id = ct.id
        LEFT JOIN aplicacoes a ON et.aplicacao_id = a.id
        LEFT JOIN colaboradores c ON et.executor_id = c.id
        WHERE et.id = ?
      `, [req.params.id]);
      
      const row = updated[0];
      const execucao = {
        id: row.id,
        casoTesteId: row.caso_teste_id,
        casoTesteTitulo: row.caso_teste_titulo,
        aplicacaoId: row.aplicacao_id,
        aplicacaoNome: row.aplicacao_nome,
        requisitoVinculado: row.requisito_vinculado,
        ambiente: row.ambiente,
        executorId: row.executor_id,
        executorNome: row.executor_nome,
        executorMatricula: row.executor_matricula,
        dataHoraInicio: row.data_hora_inicio,
        dataHoraTermino: row.data_hora_termino,
        registroAtividades: row.registro_atividades,
        resultadoExecucao: row.resultado_execucao,
        statusExecucao: row.status_execucao,
        arquivoResultado: row.arquivo_resultado,
        arquivoNomeOriginal: row.arquivo_nome_original,
        arquivoMimeType: row.arquivo_mime_type,
        arquivoTamanho: row.arquivo_tamanho,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      
      res.json(execucao);
    } catch (error) {
      console.error('Erro ao atualizar execução de teste:', error);
      res.status(500).json({ error: 'Erro ao atualizar execução de teste', code: 'DATABASE_ERROR' });
    }
  });

  // DELETE /api/execucoes-teste/:id - Deletar execução de teste
  app.delete('/api/execucoes-teste/:id', async (req, res) => {
    try {
      const [existing] = await pool.query('SELECT * FROM execucoes_teste WHERE id = ?', [req.params.id]);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Execução de teste não encontrada', code: 'NOT_FOUND' });
      }
      
      // Deletar arquivo se existir
      if (existing[0].arquivo_resultado && fs.existsSync(existing[0].arquivo_resultado)) {
        fs.unlinkSync(existing[0].arquivo_resultado);
      }
      
      await pool.query('DELETE FROM execucoes_teste WHERE id = ?', [req.params.id]);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar execução de teste:', error);
      res.status(500).json({ error: 'Erro ao deletar execução de teste', code: 'DATABASE_ERROR' });
    }
  });

  // GET /api/execucoes-teste/:id/download - Download do arquivo de evidência
  app.get('/api/execucoes-teste/:id/download', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM execucoes_teste WHERE id = ?', [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Execução de teste não encontrada', code: 'NOT_FOUND' });
      }
      
      const execucao = rows[0];
      
      if (!execucao.arquivo_resultado || !fs.existsSync(execucao.arquivo_resultado)) {
        return res.status(404).json({ error: 'Arquivo não encontrado', code: 'FILE_NOT_FOUND' });
      }
      
      res.setHeader('Content-Type', execucao.arquivo_mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${execucao.arquivo_nome_original}"`);
      res.setHeader('Content-Length', execucao.arquivo_tamanho);
      
      const fileStream = fs.createReadStream(execucao.arquivo_resultado);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      res.status(500).json({ error: 'Erro ao fazer download do arquivo', code: 'DOWNLOAD_ERROR' });
    }
  });

  // ==================== AUTENTICAÇÃO ====================

  // POST /api/auth/login - Fazer login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          error: 'E-mail e senha são obrigatórios',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // 1. Buscar usuário pelo e-mail com dados do colaborador
      const [usuarios] = await pool.query(`
        SELECT 
          u.id,
          u.login,
          u.password_hash,
          u.status,
          u.data_vigencia_inicial,
          u.data_vigencia_termino,
          u.colaborador_id,
          c.nome AS colaborador_nome,
          c.matricula AS colaborador_matricula,
          c.setor AS colaborador_setor
        FROM usuarios_seguranca u
        LEFT JOIN colaboradores c ON u.colaborador_id = c.id
        WHERE u.login = ?
      `, [email]);

      if (usuarios.length === 0) {
        // Não revelar se o usuário existe ou não (segurança)
        return res.status(401).json({ 
          error: 'E-mail ou senha inválidos',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const usuario = usuarios[0];

      // 2. Verificar se usuário está ativo
      if (usuario.status !== 'ATIVO') {
        return res.status(403).json({ 
          error: 'Usuário inativo. Entre em contato com o administrador',
          code: 'USER_INACTIVE'
        });
      }

      // 3. Verificar data de vigência
      const agora = new Date();
      if (usuario.data_vigencia_inicial && new Date(usuario.data_vigencia_inicial) > agora) {
        return res.status(403).json({ 
          error: 'Acesso ainda não liberado',
          code: 'ACCESS_NOT_STARTED'
        });
      }

      if (usuario.data_vigencia_termino && new Date(usuario.data_vigencia_termino) < agora) {
        return res.status(403).json({ 
          error: 'Acesso expirado. Entre em contato com o administrador',
          code: 'ACCESS_EXPIRED'
        });
      }

      // 4. Buscar SALT do banco
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ? LIMIT 1',
        ['PASSWORD_SALT']
      );

      if (configRows.length === 0) {
        console.error('SALT não configurado no banco de dados');
        return res.status(500).json({ 
          error: 'Erro de configuração do sistema',
          code: 'SALT_NOT_CONFIGURED'
        });
      }

      const SALT = configRows[0].valor;

      // 5. Validar senha com hash
      const senhaHash = hashPassword(usuario.login, senha, SALT);
      
      if (senhaHash !== usuario.password_hash) {
        // Senha inválida
        return res.status(401).json({ 
          error: 'E-mail ou senha inválidos',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // 6. Login bem-sucedido - gerar tokens
      const token = crypto.randomBytes(32).toString('hex');
      const refreshToken = crypto.randomBytes(32).toString('hex');

      // 7. Buscar permissões do usuário (se existir tabela de permissões)
      let permissoes = [];
      let permissoesPorRecurso = {};
      
      try {
        const [perms] = await pool.query(`
          SELECT tela, create_permission, read_permission, update_permission, delete_permission
          FROM permissoes_usuario
          WHERE usuario_id = ?
        `, [usuario.id]);
        
        permissoes = perms.map(p => ({
          tela: p.tela,
          create: p.create_permission === 1,
          read: p.read_permission === 1,
          update: p.update_permission === 1,
          delete: p.delete_permission === 1
        }));

        permissoesPorRecurso = perms.reduce((acc, p) => {
          acc[p.tela] = {
            create: p.create_permission === 1,
            read: p.read_permission === 1,
            update: p.update_permission === 1,
            delete: p.delete_permission === 1
          };
          return acc;
        }, {});
      } catch (err) {
        // Tabela de permissões ainda não existe - retornar permissões padrão
        console.log('Tabela de permissões não encontrada, usando permissões padrão');
      }

      // 8. Registrar log de acesso
      try {
        await pool.query(`
          INSERT INTO logs_acesso (
            usuario_id,
            email,
            tipo_evento,
            ip_origem,
            user_agent,
            sucesso,
            created_at
          ) VALUES (?, ?, 'LOGIN', ?, ?, 1, NOW())
        `, [
          usuario.id,
          usuario.login,
          req.ip || req.connection.remoteAddress,
          req.headers['user-agent']
        ]);
      } catch (err) {
        // Tabela de logs pode não existir ainda
        console.log('Não foi possível registrar log de acesso:', err.message);
      }

      // 11. Retornar dados do usuário autenticado
      res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: usuario.id,
          email: usuario.login,
          nome: usuario.colaborador_nome,
          matricula: usuario.colaborador_matricula,
          setor: usuario.colaborador_setor,
          role: 'admin' // Por enquanto, todos são admin
        },
        permissions: permissoes,
        permissionsByResource: permissoesPorRecurso
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        error: 'Erro ao processar login',
        code: 'LOGIN_ERROR'
      });
    }
  });

  // POST /api/auth/logout - Fazer logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        // Aqui poderia invalidar o token em uma blacklist
        // Por enquanto, apenas registrar o evento
        console.log('Logout realizado - Token:', token.substring(0, 10) + '...');
      }

      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ 
        error: 'Erro ao processar logout',
        code: 'LOGOUT_ERROR'
      });
    }
  });

  // POST /api/auth/refresh - Renovar token
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ 
          error: 'Refresh token não fornecido',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      // Aqui implementaria validação do refresh token
      // Por enquanto, apenas gera um novo token
      const novoToken = crypto.randomBytes(32).toString('hex');

      res.json({
        success: true,
        token: novoToken
      });
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      res.status(500).json({ 
        error: 'Erro ao renovar token',
        code: 'REFRESH_ERROR'
      });
    }
  });

  // Endpoint de métricas Prometheus
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.end(metrics);
    } catch (err) {
      logger.error('Error collecting metrics', { error: err.message });
      res.status(500).end(err.message);
    }
  });

  // Endpoint de health check
  app.get('/health', (req, res) => {
    const health = {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: pool ? 'connected' : 'disconnected',
      cache: {
        keys: configCache.keys().length,
        stats: configCache.getStats()
      }
    };
    res.json(health);
  });

  // Middleware de tratamento de erros global
  app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR HANDLER]', err);
    console.error('[GLOBAL ERROR] URL:', req.method, req.url);
    console.error('[GLOBAL ERROR] Stack:', err.stack);
    res.status(500).json({ 
      error: err.message || 'Erro interno do servidor',
      code: err.code || 'INTERNAL_ERROR'
    });
  });

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 API Server rodando em http://localhost:' + PORT);
    console.log('📊 Conectado ao MySQL:', dbConfig.host + ':' + dbConfig.port);
    console.log('📈 Prometheus metrics: http://localhost:' + PORT + '/metrics');
    console.log('❤️  Health check: http://localhost:' + PORT + '/health');
    console.log('');
    console.log('Endpoints disponíveis:');
    console.log('  GET    /api/tipos-afastamento');
    console.log('  POST   /api/tipos-afastamento');
    console.log('  GET    /api/tipos-afastamento/:id');
    console.log('  PUT    /api/tipos-afastamento/:id');
    console.log('  DELETE /api/tipos-afastamento/:id');
    console.log('  GET    /api/colaboradores');
    console.log('  GET    /api/habilidades');
    console.log('  GET    /api/capacidades-negocio');
    console.log('  GET    /api/tecnologias');
    console.log('  GET    /api/configuracoes');
    console.log('  GET    /api/logs-auditoria');
    console.log('  GET    /api/logs-auditoria/stats');
    console.log('  POST   /api/aplicacoes/bulk          [Carga em lote]');
    console.log('  GET    /api/azure-devops/consultar-projeto/:projectName/:teamName');
    console.log('  GET    /api/adrs                     [ADRs]');
    console.log('  GET    /api/adrs/:id                 [ADR específico]');
    console.log('  POST   /api/adrs                     [Criar ADR]');
    console.log('  PUT    /api/adrs/:id                 [Atualizar ADR]');
    console.log('  DELETE /api/adrs/:id                 [Excluir ADR]');
    console.log('  GET    /health');
    console.log('  GET    /api/dashboard/aging-chart    [Aging Chart - Histograma de Work Items]');
    console.log('');
  });
}

// GET /api/dashboard/aging-chart - Aging Chart (histograma de work items por faixa de aging)
app.get('/api/dashboard/aging-chart', async (req, res) => {
  try {
    console.log('[AGING CHART] Calculando aging de work items...');

    // Primeiro, tentar buscar da tabela principal azure_work_items
    const queryPrincipal = `
      SELECT 
        work_item_id,
        projeto_nome,
        created_date as data_criacao,
        DATEDIFF(NOW(), created_date) as dias_desde_criacao
      FROM azure_work_items
      WHERE created_date IS NOT NULL
        AND DATEDIFF(NOW(), created_date) >= 0
    `;

    let [workItems] = await pool.query(queryPrincipal);
    
    console.log(`[AGING CHART] ${workItems.length} work items encontrados na tabela principal`);

    // Se não houver dados na tabela principal, buscar do histórico
    if (workItems.length === 0) {
      console.log('[AGING CHART] Tentando buscar do histórico...');
      const query = `
        SELECT 
          h.work_item_id,
          h.projeto_nome,
          MIN(h.data_alteracao) as data_criacao,
          DATEDIFF(NOW(), MIN(h.data_alteracao)) as dias_desde_criacao
        FROM azure_work_items_historico h
        WHERE h.campo_alterado = 'System.CreatedDate' 
          OR h.campo_alterado = 'created'
        GROUP BY h.work_item_id, h.projeto_nome
        HAVING dias_desde_criacao >= 0
      `;

      [workItems] = await pool.query(query);
      console.log(`[AGING CHART] ${workItems.length} work items encontrados no histórico`);
    }

    // Se ainda não houver, buscar todos do histórico pela data mais antiga
    let items = workItems;
    if (items.length === 0) {
      const fallbackQuery = `
        SELECT 
          h.work_item_id,
          h.projeto_nome,
          MIN(h.data_alteracao) as data_criacao,
          DATEDIFF(NOW(), MIN(h.data_alteracao)) as dias_desde_criacao
        FROM azure_work_items_historico h
        GROUP BY h.work_item_id, h.projeto_nome
        HAVING dias_desde_criacao >= 0
      `;
      [items] = await pool.query(fallbackQuery);
    }

    console.log(`[AGING CHART] ${items.length} work items encontrados`);

    // Definir os bins (faixas de aging)
    const bins = [
      { label: '0-5 dias', min: 0, max: 5, count: 0 },
      { label: '6-15 dias', min: 6, max: 15, count: 0 },
      { label: '16-30 dias', min: 16, max: 30, count: 0 },
      { label: '31-45 dias', min: 31, max: 45, count: 0 },
      { label: '46-60 dias', min: 46, max: 60, count: 0 },
      { label: '61-90 dias', min: 61, max: 90, count: 0 },
      { label: '> 90 dias', min: 91, max: Infinity, count: 0 }
    ];

    // Distribuir work items nos bins
    items.forEach(item => {
      const dias = parseInt(item.dias_desde_criacao, 10);
      if (!isNaN(dias)) {
        const bin = bins.find(b => dias >= b.min && dias <= b.max);
        if (bin) {
          bin.count++;
        }
      }
    });

    console.log('[AGING CHART] Distribuição por faixa:', bins);

    // Calcular estatísticas adicionais - GARANTIR que todos os valores são numéricos
    const totalItems = items.length;
    
    // Converter todos os valores para números inteiros e filtrar valores inválidos
    const diasArray = items
      .map(item => {
        const dias = parseInt(item.dias_desde_criacao, 10);
        return isNaN(dias) ? null : dias;
      })
      .filter(dias => dias !== null && dias >= 0);
    
    console.log('[AGING CHART] Amostra de dias (primeiros 10):', diasArray.slice(0, 10));
    console.log('[AGING CHART] Total de itens válidos:', diasArray.length);
    console.log('[AGING CHART] Soma total:', diasArray.reduce((sum, dias) => sum + dias, 0));
    
    const somaTotal = diasArray.reduce((sum, dias) => sum + dias, 0);
    const avgAge = diasArray.length > 0 
      ? somaTotal / diasArray.length 
      : 0;
    const maxAge = diasArray.length > 0 
      ? Math.max(...diasArray) 
      : 0;
    const minAge = diasArray.length > 0 
      ? Math.min(...diasArray) 
      : 0;
    
    console.log('[AGING CHART] Estatísticas calculadas:');
    console.log(`  - Total: ${totalItems}`);
    console.log(`  - Soma: ${somaTotal}`);
    console.log(`  - Média: ${avgAge.toFixed(2)} dias (arredondado: ${Math.round(avgAge)})`);
    console.log(`  - Mínimo: ${minAge} dias`);
    console.log(`  - Máximo: ${maxAge} dias`);

    // Contar projetos únicos
    const projetos = [...new Set(items.map(item => item.projeto_nome))];

    res.json({
      success: true,
      data: {
        histogram: bins.map(bin => ({
          faixa: bin.label,
          quantidade: bin.count,
          percentual: totalItems > 0 ? ((bin.count / totalItems) * 100).toFixed(1) : '0.0'
        })),
        stats: {
          total: totalItems,
          mediaIdade: Math.round(avgAge),
          idadeMaxima: maxAge,
          idadeMinima: minAge,
          totalProjetos: projetos.length,
          projetos: projetos
        }
      }
    });

  } catch (error) {
    console.error('[AGING CHART] Erro:', error);
    res.status(500).json({
      error: 'Erro ao calcular aging chart',
      message: error.message,
      code: 'AGING_CHART_ERROR'
    });
  }
});

// ===== DOCUMENTAÇÃO SDD =====

// GET /api/sdd/projetos - Listar todos os projetos SDD
app.get('/api/sdd/projetos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        a.descricao as aplicacao_nome,
        a.sigla as aplicacao_sigla
      FROM projetos_sdd p
      LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
      ORDER BY p.updated_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar projetos SDD:', error);
    res.status(500).json({ error: 'Erro ao buscar projetos SDD' });
  }
});

// GET /api/sdd/projetos/:id - Buscar projeto específico
app.get('/api/sdd/projetos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        a.descricao as aplicacao_nome,
        a.sigla as aplicacao_sigla
      FROM projetos_sdd p
      LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar projeto SDD:', error);
    res.status(500).json({ error: 'Erro ao buscar projeto SDD' });
  }
});

// POST /api/sdd/projetos - Criar novo projeto
app.post('/api/sdd/projetos', async (req, res) => {
  try {
    const { aplicacao_id, nome_projeto, ia_selecionada, constituicao, prd_content, gerador_projetos } = req.body;
    
    if (!nome_projeto || !ia_selecionada) {
      return res.status(400).json({ error: 'Nome do projeto e IA são obrigatórios' });
    }
    
    const id = uuidv4();
    
    await pool.query(`
      INSERT INTO projetos_sdd (id, aplicacao_id, nome_projeto, ia_selecionada, constituicao, prd_content, gerador_projetos)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, aplicacao_id || null, nome_projeto, ia_selecionada, constituicao || null, prd_content || null, gerador_projetos || false]);
    
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        a.descricao as aplicacao_nome,
        a.sigla as aplicacao_sigla
      FROM projetos_sdd p
      LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
      WHERE p.id = ?
    `, [id]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar projeto SDD:', error);
    res.status(500).json({ error: 'Erro ao criar projeto SDD' });
  }
});

// PUT /api/sdd/projetos/:id - Atualizar projeto
app.put('/api/sdd/projetos/:id', async (req, res) => {
  try {
    const { aplicacao_id, nome_projeto, ia_selecionada, constituicao, gerador_projetos } = req.body;
    
    await pool.query(`
      UPDATE projetos_sdd
      SET aplicacao_id = ?, nome_projeto = ?, ia_selecionada = ?, constituicao = ?, gerador_projetos = ?
      WHERE id = ?
    `, [aplicacao_id || null, nome_projeto, ia_selecionada, constituicao || null, gerador_projetos, req.params.id]);
    
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        a.descricao as aplicacao_nome,
        a.sigla as aplicacao_sigla
      FROM projetos_sdd p
      LEFT JOIN aplicacoes a ON p.aplicacao_id = a.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar projeto SDD:', error);
    res.status(500).json({ error: 'Erro ao atualizar projeto SDD' });
  }
});

// DELETE /api/sdd/projetos/:id - Deletar projeto
app.delete('/api/sdd/projetos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projetos_sdd WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar projeto SDD:', error);
    res.status(500).json({ error: 'Erro ao deletar projeto SDD' });
  }
});

// GET /api/sdd/requisitos/:projetoId - Listar requisitos de um projeto
app.get('/api/sdd/requisitos/:projetoId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*,
        COUNT(t.id) as tarefas_count,
        SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as tarefas_done_count
      FROM requisitos_sdd r
      LEFT JOIN tarefas_sdd t ON r.id = t.requisito_id
      WHERE r.projeto_id = ?
      GROUP BY r.id
      ORDER BY r.sequencia
    `, [req.params.projetoId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar requisitos:', error);
    res.status(500).json({ error: 'Erro ao buscar requisitos' });
  }
});

// POST /api/sdd/requisitos - Criar novo requisito
app.post('/api/sdd/requisitos', async (req, res) => {
  try {
    const { projeto_id, nome, descricao, status } = req.body;
    
    if (!projeto_id || !nome) {
      return res.status(400).json({ error: 'Projeto e nome são obrigatórios' });
    }
    
    // Gerar sequência
    const [maxSeq] = await pool.query(`
      SELECT sequencia FROM requisitos_sdd WHERE projeto_id = ? ORDER BY sequencia DESC LIMIT 1
    `, [projeto_id]);
    
    let nextNum = 1;
    if (maxSeq.length > 0) {
      const match = maxSeq[0].sequencia.match(/REQ-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    
    const sequencia = `REQ-${String(nextNum).padStart(3, '0')}`;
    const id = uuidv4();
    
    await pool.query(`
      INSERT INTO requisitos_sdd (id, projeto_id, sequencia, nome, descricao, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, projeto_id, sequencia, nome, descricao || null, status || 'BACKLOG']);
    
    const [rows] = await pool.query('SELECT * FROM requisitos_sdd WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar requisito:', error);
    res.status(500).json({ error: 'Erro ao criar requisito' });
  }
});

// PUT /api/sdd/requisitos/:id - Atualizar requisito
app.put('/api/sdd/requisitos/:id', async (req, res) => {
  try {
    const { nome, descricao, status } = req.body;
    
    // Buscar status atual
    const [current] = await pool.query('SELECT status FROM requisitos_sdd WHERE id = ?', [req.params.id]);
    
    if (current.length === 0) {
      return res.status(404).json({ error: 'Requisito não encontrado' });
    }
    
    const statusAnterior = current[0].status !== status ? current[0].status : null;
    
    await pool.query(`
      UPDATE requisitos_sdd
      SET nome = ?, descricao = ?, status = ?, status_anterior = ?
      WHERE id = ?
    `, [nome, descricao || null, status, statusAnterior, req.params.id]);
    
    const [rows] = await pool.query('SELECT * FROM requisitos_sdd WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar requisito:', error);
    res.status(500).json({ error: 'Erro ao atualizar requisito' });
  }
});

// PUT /api/sdd/requisitos/:id/restaurar-status - Restaurar status anterior
app.put('/api/sdd/requisitos/:id/restaurar-status', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT status_anterior FROM requisitos_sdd WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Requisito não encontrado' });
    }
    
    if (!rows[0].status_anterior) {
      return res.status(400).json({ error: 'Não há status anterior para restaurar' });
    }
    
    await pool.query(`
      UPDATE requisitos_sdd
      SET status = ?, status_anterior = NULL
      WHERE id = ?
    `, [rows[0].status_anterior, req.params.id]);
    
    const [updated] = await pool.query('SELECT * FROM requisitos_sdd WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao restaurar status:', error);
    res.status(500).json({ error: 'Erro ao restaurar status' });
  }
});

// DELETE /api/sdd/requisitos/:id - Deletar requisito
app.delete('/api/sdd/requisitos/:id', async (req, res) => {
  try {
    // Verificar se há tarefas não finalizadas
    const [tarefas] = await pool.query(`
      SELECT COUNT(*) as count FROM tarefas_sdd WHERE requisito_id = ? AND status != 'DONE'
    `, [req.params.id]);
    
    if (tarefas[0].count > 0) {
      return res.status(400).json({ error: 'Não é possível excluir requisito com tarefas não finalizadas' });
    }
    
    await pool.query('DELETE FROM requisitos_sdd WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar requisito:', error);
    res.status(500).json({ error: 'Erro ao deletar requisito' });
  }
});

// POST /api/sdd/projetos/:id/extrair-requisitos-prd - Extrair requisitos do PRD
app.post('/api/sdd/projetos/:id/extrair-requisitos-prd', async (req, res) => {
  try {
    const projetoId = req.params.id;
    
    // Buscar projeto com PRD
    const [projeto] = await pool.query('SELECT prd_content FROM projetos_sdd WHERE id = ?', [projetoId]);
    
    if (projeto.length === 0) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    if (!projeto[0].prd_content) {
      return res.status(400).json({ error: 'Projeto não possui PRD' });
    }
    
    const prdContent = projeto[0].prd_content;
    const requisitosExtraidos = [];
    
    // Parser de Markdown otimizado para requisitos estruturados
    const lines = prdContent.split('\n');
    let currentSection = '';
    let currentRequisitoPrincipal = '';
    let counter = 1;
    
    // Buscar maior sequência existente
    const [maxSeq] = await pool.query(`
      SELECT sequencia FROM requisitos_sdd WHERE projeto_id = ? ORDER BY sequencia DESC LIMIT 1
    `, [projetoId]);
    
    if (maxSeq.length > 0) {
      const match = maxSeq[0].sequencia.match(/REQ-(\d+)/);
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Capturar requisitos principais: ### RF001 - Nome do Requisito
      // Regex otimizada para evitar ReDoS
      const reqPrincipalMatch = line.match(/^###\s+(RF\d{1,4}|RNF\d{1,4}|RD\d{1,4})\s*-\s*(.+?)\s*$/);
      if (reqPrincipalMatch) {
        currentRequisitoPrincipal = reqPrincipalMatch[1].toUpperCase(); // RF001, RNF001, etc.
        currentSection = `${reqPrincipalMatch[1]} - ${reqPrincipalMatch[2].trim()}`;
        
        // Opcional: criar o requisito principal também
        const nome = `${reqPrincipalMatch[1]} - ${reqPrincipalMatch[2].trim()}`;
        
        // Capturar descrição (próximas linhas até encontrar outro header ou subtarefa)
        let descricao = '';
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (nextLine.match(/^#{3,4}\s+/) || nextLine.length === 0) break;
          if (nextLine.startsWith('**Descrição:**')) {
            descricao = nextLine.replace('**Descrição:**', '').trim();
          }
          j++;
        }
        
        const id = uuidv4();
        const sequencia = `REQ-${String(counter).padStart(3, '0')}`;
        
        await pool.query(`
          INSERT INTO requisitos_sdd 
          (id, projeto_id, sequencia, nome, descricao, status, origem_prd, secao_prd)
          VALUES (?, ?, ?, ?, ?, 'PRONTO P/DEV', TRUE, ?)
        `, [id, projetoId, sequencia, nome.substring(0, 150), descricao || null, currentSection]);
        
        requisitosExtraidos.push({
          id,
          sequencia,
          nome: nome.substring(0, 150),
          secao: currentSection
        });
        
        counter++;
        continue;
      }
      
      // Capturar subtarefas/requisitos detalhados: #### RF001.1 - Nome da Tarefa
      // Regex otimizada para evitar ReDoS
      const subtarefaMatch = line.match(/^####\s+(RF\d{1,4}\.\d{1,4}|RNF\d{1,4}\.\d{1,4}|RD\d{1,4}\.\d{1,4})\s*-\s*(.+?)\s*$/);
      if (subtarefaMatch) {
        const codigo = subtarefaMatch[1].toUpperCase(); // RF001.1
        const nomeSubtarefa = subtarefaMatch[2].trim();
        const nome = `${codigo} - ${nomeSubtarefa}`;
        
        // Capturar descrição e critérios de aceitação
        let descricao = '';
        let prioridade = '';
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          // Parar se encontrar outro header
          if (nextLine.match(/^#{3,4}\s+/)) break;
          
          // Capturar descrição
          if (nextLine.startsWith('**Descrição:**')) {
            descricao = nextLine.replace('**Descrição:**', '').trim();
          }
          
          // Capturar prioridade
          if (nextLine.startsWith('**Prioridade:**')) {
            prioridade = nextLine.replace('**Prioridade:**', '').trim();
          }
          
          // Capturar critérios de aceitação
          if (nextLine.startsWith('**Critérios de Aceitação:**')) {
            let k = j + 1;
            const criterios = [];
            while (k < lines.length) {
              const criterioLine = lines[k].trim();
              if (criterioLine.match(/^#{3,4}\s+/) || criterioLine.startsWith('**')) break;
              if (criterioLine.startsWith('-') && criterioLine.length > 20) {
                criterios.push(criterioLine.replace(/^-\s*/, '').trim());
              }
              k++;
            }
            if (criterios.length > 0) {
              descricao += '\n\nCritérios: ' + criterios.join('; ');
            }
          }
          
          j++;
        }
        
        const id = uuidv4();
        const sequencia = `REQ-${String(counter).padStart(3, '0')}`;
        
        // Adicionar prioridade à descrição se existir
        if (prioridade) {
          descricao = `[${prioridade}] ${descricao}`;
        }
        
        await pool.query(`
          INSERT INTO requisitos_sdd 
          (id, projeto_id, sequencia, nome, descricao, status, origem_prd, secao_prd)
          VALUES (?, ?, ?, ?, ?, 'PRONTO P/DEV', TRUE, ?)
        `, [id, projetoId, sequencia, nome.substring(0, 150), descricao.substring(0, 5000) || null, currentSection]);
        
        requisitosExtraidos.push({
          id,
          sequencia,
          nome: nome.substring(0, 150),
          secao: currentSection,
          codigo: codigo
        });
        
        counter++;
        continue;
      }
      
      // Capturar seções gerais (## Título)
      if (line.match(/^#{2}\s+(.+)/)) {
        const sectionName = line.replace(/^#{2}\s+/, '').trim();
        if (!currentSection || !currentSection.includes('RF') && !currentSection.includes('RNF')) {
          currentSection = sectionName;
        }
      }
    }
    
    res.json({
      success: true,
      requisitosExtraidos: requisitosExtraidos.length,
      requisitos: requisitosExtraidos
    });
  } catch (error) {
    console.error('Erro ao extrair requisitos do PRD:', error);
    res.status(500).json({ error: 'Erro ao extrair requisitos do PRD' });
  }
});

// GET /api/sdd/tarefas/:requisitoId - Listar tarefas de um requisito
app.get('/api/sdd/tarefas/:requisitoId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.*,
        r.sequencia as requisito_sequencia,
        DATEDIFF(COALESCE(t.data_termino, CURDATE()), t.data_inicio) as dias_decorridos
      FROM tarefas_sdd t
      JOIN requisitos_sdd r ON t.requisito_id = r.id
      WHERE t.requisito_id = ?
      ORDER BY t.created_at
    `, [req.params.requisitoId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// POST /api/sdd/tarefas - Criar nova tarefa
app.post('/api/sdd/tarefas', async (req, res) => {
  try {
    const { requisito_id, descricao, data_inicio } = req.body;
    
    if (!requisito_id || !descricao) {
      return res.status(400).json({ error: 'Requisito e descrição são obrigatórios' });
    }
    
    // Verificar se requisito está em "PRONTO P/DEV"
    const [requisito] = await pool.query('SELECT status FROM requisitos_sdd WHERE id = ?', [requisito_id]);
    
    if (requisito.length === 0) {
      return res.status(404).json({ error: 'Requisito não encontrado' });
    }
    
    if (requisito[0].status !== 'PRONTO P/DEV') {
      return res.status(400).json({ error: 'Tarefas só podem ser criadas para requisitos com status "PRONTO P/DEV"' });
    }
    
    const id = uuidv4();
    const dataInicio = data_inicio || new Date().toISOString().split('T')[0];
    
    await pool.query(`
      INSERT INTO tarefas_sdd (id, requisito_id, descricao, data_inicio, status)
      VALUES (?, ?, ?, ?, 'TO DO')
    `, [id, requisito_id, descricao, dataInicio]);
    
    const [rows] = await pool.query('SELECT * FROM tarefas_sdd WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// PUT /api/sdd/tarefas/:id - Atualizar tarefa
app.put('/api/sdd/tarefas/:id', async (req, res) => {
  try {
    const { descricao, data_termino, status } = req.body;
    
    const [current] = await pool.query('SELECT requisito_id, data_inicio, status FROM tarefas_sdd WHERE id = ?', [req.params.id]);
    
    if (current.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    // Validar data de término
    if (data_termino && data_termino < current[0].data_inicio) {
      return res.status(400).json({ error: 'Data de término não pode ser anterior à data de início' });
    }
    
    // Se marcar como DONE, preencher data de término automaticamente
    let finalDataTermino = data_termino;
    if (status === 'DONE' && !data_termino) {
      finalDataTermino = new Date().toISOString().split('T')[0];
    }
    
    await pool.query(`
      UPDATE tarefas_sdd
      SET descricao = ?, data_termino = ?, status = ?
      WHERE id = ?
    `, [descricao, finalDataTermino || null, status, req.params.id]);
    
    // Se marcar como DONE, verificar se todas as tarefas do requisito estão concluídas
    if (status === 'DONE') {
      const [tarefasPendentes] = await pool.query(`
        SELECT COUNT(*) as count FROM tarefas_sdd WHERE requisito_id = ? AND status != 'DONE'
      `, [current[0].requisito_id]);
      
      if (tarefasPendentes[0].count === 0) {
        await pool.query(`
          UPDATE requisitos_sdd SET status = 'DONE' WHERE id = ?
        `, [current[0].requisito_id]);
      }
    }
    
    const [rows] = await pool.query('SELECT * FROM tarefas_sdd WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// DELETE /api/sdd/tarefas/:id - Deletar tarefa
app.delete('/api/sdd/tarefas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tarefas_sdd WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
});

// GET /api/sdd/decisoes/:projetoId - Listar decisões arquiteturais de um projeto
app.get('/api/sdd/decisoes/:projetoId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        a.descricao as adr_titulo
      FROM decisoes_arquiteturais_sdd d
      LEFT JOIN adrs a ON d.adr_id = a.id
      WHERE d.projeto_id = ?
      ORDER BY d.created_at DESC
    `, [req.params.projetoId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar decisões arquiteturais:', error);
    res.status(500).json({ error: 'Erro ao buscar decisões arquiteturais' });
  }
});

// POST /api/sdd/decisoes - Criar nova decisão arquitetural
app.post('/api/sdd/decisoes', async (req, res) => {
  try {
    const { projeto_id, adr_id, data_inicio, data_termino, status } = req.body;
    
    if (!projeto_id || !adr_id) {
      return res.status(400).json({ error: 'Projeto e ADR são obrigatórios' });
    }
    
    const id = uuidv4();
    const dataInicio = data_inicio || new Date().toISOString().split('T')[0];
    
    await pool.query(`
      INSERT INTO decisoes_arquiteturais_sdd (id, projeto_id, adr_id, data_inicio, data_termino, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, projeto_id, adr_id, dataInicio, data_termino || null, status || 'Proposta']);
    
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        a.descricao as adr_titulo
      FROM decisoes_arquiteturais_sdd d
      LEFT JOIN adrs a ON d.adr_id = a.id
      WHERE d.id = ?
    `, [id]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar decisão arquitetural:', error);
    res.status(500).json({ error: 'Erro ao criar decisão arquitetural' });
  }
});

// PUT /api/sdd/decisoes/:id - Atualizar decisão arquitetural
app.put('/api/sdd/decisoes/:id', async (req, res) => {
  try {
    const { data_termino, status } = req.body;
    
    await pool.query(`
      UPDATE decisoes_arquiteturais_sdd
      SET data_termino = ?, status = ?
      WHERE id = ?
    `, [data_termino || null, status, req.params.id]);
    
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        a.descricao as adr_titulo
      FROM decisoes_arquiteturais_sdd d
      LEFT JOIN adrs a ON d.adr_id = a.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar decisão arquitetural:', error);
    res.status(500).json({ error: 'Erro ao atualizar decisão arquitetural' });
  }
});

// DELETE /api/sdd/decisoes/:id - Deletar decisão arquitetural
app.delete('/api/sdd/decisoes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM decisoes_arquiteturais_sdd WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar decisão arquitetural:', error);
    res.status(500).json({ error: 'Erro ao deletar decisão arquitetural' });
  }
});

// ==================== DOCKER MKDOCS ====================

// GET /api/docker/mkdocs/status - Verificar status do container MkDocs
app.get('/api/docker/mkdocs/status', async (req, res) => {
  try {
    // Usar HTTPS em produção, HTTP apenas em desenvolvimento
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const mkdocsUrl = `${protocol}://mkdocs:8082`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    try {
      const response = await fetch(mkdocsUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Sistema-Auditoria-HealthCheck' }
      });
      clearTimeout(timeout);
      
      const running = response.ok || response.status === 404; // 404 também indica que está respondendo
      
      res.json({ 
        running,
        status: running ? 'up' : 'down',
        message: running ? 'Container MkDocs está rodando' : 'Container MkDocs não está respondendo'
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      
      // Se der timeout ou erro de conexão, container está down
      res.json({ 
        running: false,
        status: 'down',
        message: 'Container MkDocs não está respondendo'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar status do MkDocs:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      running: false,
      status: 'unknown'
    });
  }
});

// POST /api/docker/mkdocs/start - Avisar que container precisa ser iniciado
app.post('/api/docker/mkdocs/start', async (req, res) => {
  // Como não temos acesso ao Docker de dentro do container,
  // retornar instruções para o usuário
  res.json({ 
    success: false,
    needsManualStart: true,
    message: 'Por favor, inicie o container MkDocs manualmente',
    instructions: [
      'Abra um terminal',
      'Navegue até o diretório do projeto',
      'Execute: docker-compose start mkdocs',
      'Ou execute: docker-compose up -d mkdocs'
    ]
  });
});

// POST /api/docker/mkdocs/restart - Avisar que container precisa ser reiniciado
app.post('/api/docker/mkdocs/restart', async (req, res) => {
  res.json({ 
    success: false,
    needsManualRestart: true,
    message: 'Por favor, reinicie o container MkDocs manualmente',
    instructions: [
      'Abra um terminal',
      'Navegue até o diretório do projeto',
      'Execute: docker-compose restart mkdocs'
    ]
  });
});

// =====================================================
// CHECKPOINTS - Gestão de Checkpoints de Aplicações
// =====================================================

// GET - Listar checkpoints de uma aplicação
app.get('/api/checkpoints', async (req, res) => {
  try {
    const { aplicacaoId } = req.query;
    
    let query = `
      SELECT c.*, 
             a.sigla as aplicacaoSigla
      FROM checkpoints c
      LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
    `;
    
    const params = [];
    if (aplicacaoId) {
      query += ' WHERE c.aplicacao_id = ?';
      params.push(aplicacaoId);
    }
    
    query += ' ORDER BY c.data_prevista ASC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar checkpoints:', error);
    res.status(500).json({ error: 'Erro ao listar checkpoints', code: 'DATABASE_ERROR', details: error.message });
  }
});

// POST - Criar checkpoint
app.post('/api/checkpoints', async (req, res) => {
  const {
    aplicacaoId, descricao, categoria, status, dataPrevista, dataReal
  } = req.body;

  if (!aplicacaoId || !descricao || !categoria || !dataPrevista) {
    return res.status(400).json({
      error: 'Campos obrigatórios: aplicacaoId, descricao, categoria, dataPrevista',
      code: 'MISSING_FIELDS'
    });
  }

  const connection = await getUtf8Connection();
  try {
    const checkpointId = uuidv4();
    
    // Se data_real está preenchida, status deve ser 'OK'
    const finalStatus = dataReal ? 'OK' : (status || 'Em Risco');
    
    await connection.query(`
      INSERT INTO checkpoints (
        id, aplicacao_id, descricao, categoria, status,
        data_prevista, data_real
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      checkpointId, aplicacaoId, descricao, categoria, finalStatus,
      dataPrevista, dataReal || null
    ]);

    const [rows] = await connection.query(`
      SELECT c.*, 
             a.sigla as aplicacaoSigla
      FROM checkpoints c
      LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
      WHERE c.id = ?
    `, [checkpointId]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar checkpoint:', error);
    res.status(500).json({ error: 'Erro ao criar checkpoint', code: 'DATABASE_ERROR', details: error.message });
  } finally {
    connection.release();
  }
});

// PUT - Atualizar checkpoint
app.put('/api/checkpoints/:id', async (req, res) => {
  const {
    descricao, categoria, status, dataPrevista, dataReal
  } = req.body;

  const connection = await getUtf8Connection();
  try {
    // Verificar se checkpoint já tem data_real (está finalizado)
    const [existing] = await connection.query(
      'SELECT data_real FROM checkpoints WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }

    if (existing[0].data_real && !dataReal) {
      return res.status(400).json({ 
        error: 'Checkpoint finalizado não pode ser editado', 
        code: 'CHECKPOINT_FINALIZED' 
      });
    }

    // Se data_real está preenchida, status deve ser 'OK'
    const finalStatus = dataReal ? 'OK' : (status || 'Em Risco');

    const [result] = await connection.query(`
      UPDATE checkpoints SET
        descricao = ?, categoria = ?, status = ?,
        data_prevista = ?, data_real = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      descricao, categoria, finalStatus,
      dataPrevista, dataReal || null,
      req.params.id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }

    const [rows] = await connection.query(`
      SELECT c.*, 
             a.sigla as aplicacaoSigla
      FROM checkpoints c
      LEFT JOIN aplicacoes a ON c.aplicacao_id = a.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar checkpoint:', error);
    res.status(500).json({ error: 'Erro ao atualizar checkpoint', code: 'DATABASE_ERROR', details: error.message });
  } finally {
    connection.release();
  }
});

// DELETE - Remover checkpoint
app.delete('/api/checkpoints/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM checkpoints WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }
    
    res.json({ message: 'Checkpoint removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover checkpoint:', error);
    res.status(500).json({ error: 'Erro ao remover checkpoint', code: 'DATABASE_ERROR', details: error.message });
  }
});

// =====================================================
// CHECKPOINT DETALHES - Gestão de Detalhes de Checkpoints
// =====================================================

// GET - Listar detalhes de um checkpoint
app.get('/api/checkpoints/:checkpointId/detalhes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, 
             col.nome as responsavelNome
      FROM checkpoint_detalhes d
      LEFT JOIN colaboradores col ON d.responsavel_id = col.id
      WHERE d.checkpoint_id = ?
      ORDER BY d.created_at DESC
    `, [req.params.checkpointId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar detalhes:', error);
    res.status(500).json({ error: 'Erro ao listar detalhes', code: 'DATABASE_ERROR', details: error.message });
  }
});

// POST - Criar detalhe de checkpoint
app.post('/api/checkpoints/:checkpointId/detalhes', async (req, res) => {
  const { responsavelId, dataPlanejada, dataEfetiva, descricaoDetalhada, comentarios } = req.body;

  const connection = await getUtf8Connection();
  try {
    // Verificar se checkpoint está finalizado
    const [checkpoint] = await connection.query(
      'SELECT data_real FROM checkpoints WHERE id = ?',
      [req.params.checkpointId]
    );

    if (checkpoint.length === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }

    if (checkpoint[0].data_real) {
      return res.status(400).json({ 
        error: 'Não é possível adicionar detalhes a checkpoint finalizado', 
        code: 'CHECKPOINT_FINALIZED' 
      });
    }

    const detalheId = uuidv4();
    await connection.query(`
      INSERT INTO checkpoint_detalhes (
        id, checkpoint_id, responsavel_id, data_planejada,
        data_efetiva, descricao_detalhada, comentarios
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      detalheId, req.params.checkpointId, responsavelId || null,
      dataPlanejada || null, dataEfetiva || null,
      descricaoDetalhada || null, comentarios || null
    ]);

    const [rows] = await connection.query(`
      SELECT d.*, 
             col.nome as responsavelNome
      FROM checkpoint_detalhes d
      LEFT JOIN colaboradores col ON d.responsavel_id = col.id
      WHERE d.id = ?
    `, [detalheId]);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Erro ao criar detalhe:', error);
    res.status(500).json({ error: 'Erro ao criar detalhe', code: 'DATABASE_ERROR', details: error.message });
  } finally {
    connection.release();
  }
});

// PUT - Atualizar detalhe de checkpoint
app.put('/api/checkpoints/:checkpointId/detalhes/:id', async (req, res) => {
  const { responsavelId, dataPlanejada, dataEfetiva, descricaoDetalhada, comentarios } = req.body;

  const connection = await getUtf8Connection();
  try {
    // Verificar se checkpoint está finalizado
    const [checkpoint] = await connection.query(
      'SELECT data_real FROM checkpoints WHERE id = ?',
      [req.params.checkpointId]
    );

    if (checkpoint.length === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }

    if (checkpoint[0].data_real) {
      return res.status(400).json({ 
        error: 'Não é possível editar detalhes de checkpoint finalizado', 
        code: 'CHECKPOINT_FINALIZED' 
      });
    }

    const [result] = await connection.query(`
      UPDATE checkpoint_detalhes SET
        responsavel_id = ?, data_planejada = ?,
        data_efetiva = ?, descricao_detalhada = ?,
        comentarios = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND checkpoint_id = ?
    `, [
      responsavelId || null, dataPlanejada || null,
      dataEfetiva || null, descricaoDetalhada || null,
      comentarios || null,
      req.params.id, req.params.checkpointId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Detalhe não encontrado', code: 'NOT_FOUND' });
    }

    const [rows] = await connection.query(`
      SELECT d.*, 
             col.nome as responsavelNome
      FROM checkpoint_detalhes d
      LEFT JOIN colaboradores col ON d.responsavel_id = col.id
      WHERE d.id = ?
    `, [req.params.id]);
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar detalhe:', error);
    res.status(500).json({ error: 'Erro ao atualizar detalhe', code: 'DATABASE_ERROR', details: error.message });
  } finally {
    connection.release();
  }
});

// DELETE - Remover detalhe de checkpoint
app.delete('/api/checkpoints/:checkpointId/detalhes/:id', async (req, res) => {
  try {
    // Verificar se checkpoint está finalizado
    const [checkpoint] = await pool.query(
      'SELECT data_real FROM checkpoints WHERE id = ?',
      [req.params.checkpointId]
    );

    if (checkpoint.length === 0) {
      return res.status(404).json({ error: 'Checkpoint não encontrado', code: 'NOT_FOUND' });
    }

    if (checkpoint[0].data_real) {
      return res.status(400).json({ 
        error: 'Não é possível excluir detalhes de checkpoint finalizado', 
        code: 'CHECKPOINT_FINALIZED' 
      });
    }

    const [result] = await pool.query(
      'DELETE FROM checkpoint_detalhes WHERE id = ? AND checkpoint_id = ?',
      [req.params.id, req.params.checkpointId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Detalhe não encontrado', code: 'NOT_FOUND' });
    }
    
    res.json({ message: 'Detalhe removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover detalhe:', error);
    res.status(500).json({ error: 'Erro ao remover detalhe', code: 'DATABASE_ERROR', details: error.message });
  }
});

startServer();

export default app;
