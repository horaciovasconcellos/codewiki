import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { ulid } from 'ulid';
import multer from 'multer';
import AzureDevOpsService from './azure-devops-service.js';

const app = express();

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
const PORT = 3000;

// Configuração do MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || 'mysql-master',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'app_user',
  password: process.env.MYSQL_PASSWORD || 'apppass123',
  database: process.env.MYSQL_DATABASE || 'auditoria_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('📋 Configuração do banco:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Pool de conexões
let pool;

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
      charset: 'utf8mb4'
    });
    // Testar conexão
    const connection = await pool.getConnection();
    await connection.query("SET NAMES utf8mb4");
    console.log('✓ Conectado ao MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Erro ao conectar ao MySQL:', error.message);
    console.log('  Tentando novamente em 5 segundos...');
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentado para 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  
  // Buscar habilidades do colaborador - DESABILITADO (tabela removida)
  // const [habilidades] = await pool.query(
  //   'SELECT * FROM colaborador_habilidades WHERE colaborador_id = ?',
  //   [row.id]
  // );
  const habilidades = [];
  
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
      [id, sigla.toUpperCase(), descricao, argumentacaoLegal, parseInt(numeroDias), tipoTempo]
    );
    
    const novoTipo = {
      id,
      sigla: sigla.toUpperCase(),
      descricao,
      argumentacaoLegal,
      numeroDias: parseInt(numeroDias),
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
    
    // Buscar avaliações do colaborador
    const [avaliacoes] = await pool.query(
      'SELECT * FROM avaliacoes_colaborador WHERE colaborador_id = ? ORDER BY data_avaliacao DESC',
      [req.params.id]
    );
    
    colaborador.avaliacoes = avaliacoes.map(row => ({
      id: row.id,
      colaboradorId: row.colaborador_id,
      dataAvaliacao: row.data_avaliacao,
      resultadosEntregas: parseFloat(row.resultados_entregas),
      competenciasTecnicas: parseFloat(row.competencias_tecnicas),
      qualidadeSeguranca: parseFloat(row.qualidade_seguranca),
      comportamentoCultura: parseFloat(row.comportamento_cultura),
      evolucaoAprendizado: parseFloat(row.evolucao_aprendizado),
      motivo: row.motivo,
      dataConversa: row.data_conversa,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
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
    
    const avaliacoes = rows.map(row => ({
      id: row.id,
      colaboradorId: row.colaborador_id,
      dataAvaliacao: row.data_avaliacao,
      resultadosEntregas: parseFloat(row.resultados_entregas),
      competenciasTecnicas: parseFloat(row.competencias_tecnicas),
      qualidadeSeguranca: parseFloat(row.qualidade_seguranca),
      comportamentoCultura: parseFloat(row.comportamento_cultura),
      evolucaoAprendizado: parseFloat(row.evolucao_aprendizado),
      motivo: row.motivo,
      dataConversa: row.data_conversa,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
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
    
    // Mapear para o formato esperado pelo frontend
    const habilidades = rows.map(row => ({
      id: row.id,
      sigla: row.sigla,
      descricao: row.descricao || row.sigla,
      tipo: row.tipo,
      dominio: row.dominio || row.tipo,
      subcategoria: row.subcategoria || 'Outras',
      certificacoes: []
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
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao || rows[0].sigla,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio || rows[0].tipo,
      subcategoria: rows[0].subcategoria || 'Outras',
      certificacoes: []
    };
    
    res.json(habilidade);
  } catch (error) {
    console.error('Erro ao buscar habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.post('/api/habilidades', async (req, res) => {
  try {
    // Frontend envia: sigla, descricao, tipo, dominio, subcategoria
    const { sigla, descricao, tipo, dominio, subcategoria } = req.body;
    
    if (!sigla || !tipo) {
      return res.status(400).json({ error: 'Sigla e tipo são obrigatórios' });
    }
    
    const id = uuidv4();
    await pool.query(
      'INSERT INTO habilidades (id, sigla, descricao, tipo, dominio, subcategoria) VALUES (?, ?, ?, ?, ?, ?)',
      [id, sigla, descricao || sigla, tipo, dominio || 'Desenvolvimento & Engenharia', subcategoria || 'Outras']
    );
    
    const [rows] = await pool.query('SELECT * FROM habilidades WHERE id = ?', [id]);
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio,
      subcategoria: rows[0].subcategoria,
      certificacoes: []
    };
    
    res.status(201).json(habilidade);
  } catch (error) {
    console.error('Erro ao criar habilidade:', error);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.put('/api/habilidades/:id', async (req, res) => {
  try {
    // Frontend envia: sigla, descricao, tipo, dominio, subcategoria
    const { sigla, descricao, tipo, dominio, subcategoria } = req.body;
    
    if (!sigla || !tipo) {
      return res.status(400).json({ error: 'Sigla e tipo são obrigatórios' });
    }
    
    await pool.query(
      'UPDATE habilidades SET sigla = ?, descricao = ?, tipo = ?, dominio = ?, subcategoria = ? WHERE id = ?',
      [sigla, descricao || sigla, tipo, dominio || 'Desenvolvimento & Engenharia', subcategoria || 'Outras', req.params.id]
    );
    
    const [rows] = await pool.query('SELECT * FROM habilidades WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Habilidade não encontrada' });
    }
    
    const habilidade = {
      id: rows[0].id,
      sigla: rows[0].sigla,
      descricao: rows[0].descricao,
      tipo: rows[0].tipo,
      dominio: rows[0].dominio,
      subcategoria: rows[0].subcategoria,
      certificacoes: []
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
  if (!sigla || !nome) {
    return res.status(400).json({
      error: 'Campos obrigatórios faltando',
      code: 'MISSING_FIELDS',
      missing: [!sigla && 'sigla', !nome && 'nome'].filter(Boolean)
    });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO tecnologias (
        id, sigla, nome, versao_release, categoria, status,
        fornecedor_fabricante, tipo_licenciamento, maturidade_interna,
        nivel_suporte_interno, ambiente_dev, ambiente_qa, ambiente_prod,
        ambiente_cloud, ambiente_on_premise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sigla, nome, versaoRelease || null, categoria || null, status || null,
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

  try {
    const [result] = await pool.query(
      `UPDATE tecnologias SET
        sigla = ?, nome = ?, versao_release = ?, categoria = ?, status = ?,
        fornecedor_fabricante = ?, tipo_licenciamento = ?, maturidade_interna = ?,
        nivel_suporte_interno = ?, ambiente_dev = ?, ambiente_qa = ?, ambiente_prod = ?,
        ambiente_cloud = ?, ambiente_on_premise = ?
      WHERE id = ?`,
      [
        sigla, nome, versaoRelease, categoria, status,
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
          SELECT id, tipo_ambiente as tipoAmbiente, url_ambiente as urlAmbiente, 
                 data_criacao as dataCriacao, tempo_liberacao as tempoLiberacao, status
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
                 p.identificacao, p.nome
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
        SELECT id, tipo_ambiente as tipoAmbiente, url_ambiente as urlAmbiente, 
               data_criacao as dataCriacao, tempo_liberacao as tempoLiberacao, status
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
        id, sigla, descricao, url_documentacao, tipo_aplicacao, fase_ciclo_vida, criticidade_negocio,
        categoria_sistema, fornecedor, tipo_hospedagem, cloud_provider, custo_mensal, numero_usuarios,
        data_implantacao, versao_atual, responsavel_tecnico, responsavel_negocio,
        status_operacional, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, sigla, descricao, urlDocumentacao, tipoAplicacao, faseCicloVida, criticidadeNegocio,
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
          'INSERT INTO aplicacao_ambientes (id, aplicacao_id, tipo_ambiente, url_ambiente, data_criacao, tempo_liberacao, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, amb.tipoAmbiente, amb.urlAmbiente, dataCriacao, amb.tempoLiberacao || 0, amb.status || 'Ativo']
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
            'INSERT INTO aplicacao_ambientes (id, aplicacao_id, tipo_ambiente, url_ambiente, data_criacao, tempo_liberacao, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), req.params.id, amb.tipoAmbiente, amb.urlAmbiente, dataCriacao, amb.tempoLiberacao || 0, amb.status || 'Ativo']
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

// ==================== PROCESSOS DE NEGÓCIO ====================

function mapProcessoNegocio(row) {
  return {
    id: row.id,
    identificacao: row.identificacao || row.nome,
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
  const { identificacao, descricao, nivelMaturidade, areaResponsavel, frequencia, duracaoMedia, complexidade, normas } = req.body;
  
  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO processos_negocio (
        id, identificacao, descricao, nivel_maturidade, area_responsavel, 
        frequencia, duracao_media, complexidade, normas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        identificacao, 
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
  const { identificacao, descricao, nivelMaturidade, areaResponsavel, frequencia, duracaoMedia, complexidade, normas } = req.body;
  
  try {
    const [existing] = await pool.query('SELECT * FROM processos_negocio WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado', code: 'NOT_FOUND' });
    }
    
    await pool.query(
      `UPDATE processos_negocio SET 
        identificacao = ?, 
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
        repositorios,
        patToken: row.pat_token,
        estruturasGeradas,
        dataCriacao: row.data_criacao,
        status: row.status || 'Pendente',
        urlProjeto: row.url_projeto,
        aplicacaoBaseId: row.aplicacao_base_id,
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
    
    await pool.query(
      `INSERT INTO estruturas_projeto (
        id, produto, work_item_process, projeto, data_inicial, iteracao,
        incluir_query, incluir_maven, incluir_liquibase, criar_time_sustentacao,
        repositorios, pat_token, estruturas_geradas, nome_time, numero_semanas, iteracao_mensal, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        estrutura.status || 'Pendente'
      ]
    );
    
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
        aplicacao_base_id = ?
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
        req.params.id,
      ]
    );
    
    console.log('[API] Query executada. Linhas afetadas:', result.affectedRows);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estrutura não encontrada', code: 'NOT_FOUND' });
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
    // Verificar se o projeto já foi processado
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
    
    // Não permitir exclusão se já foi processado
    if (estrutura.status === 'Processado') {
      console.log(`[API] Tentativa de excluir projeto processado: ${estrutura.projeto}`);
      return res.status(403).json({ 
        error: 'Não é permitido excluir projetos que já foram integrados ao Azure DevOps', 
        code: 'PROCESSED_PROJECT',
        projeto: estrutura.projeto
      });
    }
    
    // Se status for Pendente, permitir exclusão
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

    // 14. Gerar URL do projeto
    const projectUrl = `https://dev.azure.com/${organization}/${projectName}`;

    console.log(`[AZURE INTEGRAÇÃO] Integração concluída com sucesso!`);
    console.log(`[AZURE INTEGRAÇÃO] URL: ${projectUrl}`);

    res.json({
      success: true,
      message: 'Projeto integrado com sucesso ao Azure DevOps',
      projectUrl,
      projectId: azureProject.id,
      teamId: defaultTeam.id,
      iterations: iterations.length
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
    
    // Gerar UUID v4 para o campo id
    const id = `conf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
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

  // ===================================
  // ENDPOINTS DE CONTRATOS
  // ===================================

  // GET - Listar todos os contratos de uma aplicação
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
          '' as para
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

  // POST /api/notificacoes/buscar-emails - Buscar e-mails e salvar como notificações via Microsoft Graph API
  app.post('/api/notificacoes/buscar-emails', async (req, res) => {
    try {
      // Buscar configurações de e-mail
      const [configRows] = await pool.query(
        'SELECT valor FROM configuracoes WHERE chave = ?',
        ['email-notifications']
      );
      
      if (configRows.length === 0) {
        return res.status(400).json({ 
          error: 'Configurações de e-mail não encontradas. Configure em Configurações > Notificações.' 
        });
      }
      
      const emailConfig = JSON.parse(configRows[0].valor);
      
      // Validar configurações do Graph API
      if (!emailConfig.tenantId || !emailConfig.clientId || !emailConfig.clientSecret) {
        return res.status(400).json({ 
          error: 'Credenciais do Azure AD não configuradas. Configure Tenant ID, Client ID e Client Secret.' 
        });
      }

      if (!emailConfig.emailCaixa) {
        return res.status(400).json({ 
          error: 'E-mail da caixa não configurado.' 
        });
      }

      console.log('Conectando ao Microsoft Graph API...');

      // Importar bibliotecas do Graph API dinamicamente
      const { Client } = await import('@microsoft/microsoft-graph-client');
      const { ClientSecretCredential } = await import('@azure/identity');
      const fetch = (await import('isomorphic-fetch')).default;

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
      
      // Adicionar filtros de assunto se configurados (múltiplos subjects com OR)
      if (emailConfig.subjects && Array.isArray(emailConfig.subjects) && emailConfig.subjects.length > 0) {
        const subjectFilters = emailConfig.subjects
          .map(subject => `contains(subject,'${subject.replace(/'/g, "''")}')`)
          .join(' or ');
        messagesQuery += ` and (${subjectFilters})`;
      }

      messagesQuery += '&$select=id,receivedDateTime,from,subject,bodyPreview,body&$top=50';

      console.log('Buscando e-mails:', messagesQuery);

      const messages = await client
        .api(messagesQuery)
        .get();

      console.log(`Encontrados ${messages.value?.length || 0} e-mails`);

      const emailsEncontrados = [];

      for (const message of messages.value || []) {
        const email = {
          id: uuidv4(),
          de: message.from?.emailAddress?.address || 'Desconhecido',
          subject: message.subject || 'Sem assunto',
          conteudo: (message.body?.content || message.bodyPreview || 'Sem conteúdo').substring(0, 5000),
          data_recebimento: new Date(message.receivedDateTime)
        };

        emailsEncontrados.push(email);
      }

      // Salvar notificações no banco
      let notificacoesInseridas = 0;
      for (const email of emailsEncontrados) {
        // Verificar se já existe
        const [existing] = await pool.query(
          'SELECT id FROM notificacoes WHERE subject = ? AND de = ? AND DATE(data_recebimento) = DATE(?)',
          [email.subject, email.de, email.data_recebimento]
        );
        
        if (existing.length === 0) {
          await pool.query(
            'INSERT INTO notificacoes (id, data_recebimento, de, subject, conteudo, lido) VALUES (?, ?, ?, ?, ?, FALSE)',
            [email.id, email.data_recebimento, email.de, email.subject, email.conteudo]
          );
          notificacoesInseridas++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `${notificacoesInseridas} nova(s) notificação(ões) encontrada(s)`,
        total: notificacoesInseridas 
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
          throw new Error('URL do projeto inválida');
        }
        
        const projectName = urlMatch[2];
        
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

  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 API Server rodando em http://localhost:' + PORT);
    console.log('📊 Conectado ao MySQL:', dbConfig.host + ':' + dbConfig.port);
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
    console.log('  GET    /health');
    console.log('');
  });
}

startServer();

export default app;
