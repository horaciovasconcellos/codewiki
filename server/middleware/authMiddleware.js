/**
 * Middleware de Autenticação e Autorização
 * Implementa verificação de JWT, permissões RBAC/ABAC/ACL e auditoria
 */

const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Pool de conexão (importar do seu arquivo de conexão)
let pool;

function setPool(dbPool) {
  pool = dbPool;
}

/**
 * Middleware: Verificar se usuário está autenticado
 */
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar sessão ativa
    const [sessions] = await pool.query(
      `SELECT s.*, u.nome, u.email, u.ativo as usuario_ativo
       FROM sessoes_usuario s
       INNER JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.token = ? AND s.ativa = TRUE AND s.data_expiracao > NOW()`,
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ 
        error: 'Sessão inválida ou expirada',
        code: 'INVALID_SESSION'
      });
    }

    const session = sessions[0];

    if (!session.usuario_ativo) {
      return res.status(403).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    // Adicionar informações do usuário à request
    req.user = {
      id: session.usuario_id,
      nome: session.nome,
      email: session.email,
      sessionId: session.id,
      impersonatedBy: session.impersonated_by
    };

    req.sessionInfo = {
      token,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro ao verificar autenticação',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware Factory: Verificar permissão específica
 * @param {string} permissionCode - Código da permissão (ex: 'documentacao-projetos.create')
 * @param {object} abacRules - Regras ABAC opcionais
 */
function authorize(permissionCode, abacRules = {}) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // 1. Verificar ACL (negação explícita tem prioridade)
      const [denyRules] = await pool.query(
        `SELECT acl.* 
         FROM usuario_permissoes_acl acl
         INNER JOIN permissoes p ON acl.permissao_id = p.id
         WHERE acl.usuario_id = ? 
           AND p.codigo = ?
           AND acl.tipo = 'deny'
           AND acl.ativo = TRUE
           AND (acl.data_fim IS NULL OR acl.data_fim >= CURDATE())`,
        [userId, permissionCode]
      );

      if (denyRules.length > 0) {
        await logAccessDenied(req, permissionCode, 'ACL_DENY');
        return res.status(403).json({ 
          error: 'Acesso negado por ACL',
          code: 'ACL_DENIED',
          permission: permissionCode
        });
      }

      // 2. Verificar permissões efetivas (RBAC + ACL allow)
      const [permissions] = await pool.query(
        `SELECT * FROM vw_usuario_permissoes_efetivas
         WHERE usuario_id = ? AND permissao_codigo = ?`,
        [userId, permissionCode]
      );

      if (permissions.length === 0) {
        await logAccessDenied(req, permissionCode, 'NO_PERMISSION');
        return res.status(403).json({ 
          error: 'Permissão não encontrada',
          code: 'PERMISSION_DENIED',
          permission: permissionCode
        });
      }

      // 3. Avaliar políticas ABAC (se houver)
      if (Object.keys(abacRules).length > 0) {
        const hasAccess = await evaluateABACRules(userId, permissionCode, abacRules, req);
        
        if (!hasAccess) {
          await logAccessDenied(req, permissionCode, 'ABAC_DENIED');
          return res.status(403).json({ 
            error: 'Acesso negado pelas políticas ABAC',
            code: 'ABAC_DENIED',
            permission: permissionCode
          });
        }
      }

      // 4. Acesso permitido
      req.permission = {
        code: permissionCode,
        granted: true,
        source: permissions[0].origem
      };

      next();
    } catch (error) {
      console.error('Erro na autorização:', error);
      return res.status(500).json({ 
        error: 'Erro ao verificar autorização',
        code: 'AUTHZ_ERROR'
      });
    }
  };
}

/**
 * Avaliar regras ABAC
 */
async function evaluateABACRules(userId, permissionCode, rules, req) {
  try {
    // Buscar políticas ABAC aplicáveis
    const [policies] = await pool.query(
      `SELECT pa.* 
       FROM politicas_acesso pa
       INNER JOIN permissoes p ON pa.permissao_id = p.id
       WHERE p.codigo = ? AND pa.ativo = TRUE
       ORDER BY pa.prioridade DESC`,
      [permissionCode]
    );

    if (policies.length === 0) {
      return true; // Sem políticas = permitido
    }

    // Buscar atributos do usuário
    const [userAttrs] = await pool.query(
      `SELECT u.*, 
              GROUP_CONCAT(DISTINCT r.nome) as roles,
              GROUP_CONCAT(DISTINCT g.nome) as grupos
       FROM usuarios u
       LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id AND ur.ativo = TRUE
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN usuario_grupos ug ON u.id = ug.usuario_id
       LEFT JOIN grupos g ON ug.grupo_id = g.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (userAttrs.length === 0) {
      return false;
    }

    const userContext = {
      ...userAttrs[0],
      roles: userAttrs[0].roles?.split(',') || [],
      grupos: userAttrs[0].grupos?.split(',') || [],
      ...rules, // Contexto adicional passado na requisição
      ip: req.ip,
      hora: new Date().getHours(),
      dia_semana: new Date().getDay()
    };

    // Avaliar cada política
    for (const policy of policies) {
      const condition = JSON.parse(policy.condicao);
      const result = evaluateCondition(condition, userContext);

      if (result && policy.efeito === 'deny') {
        return false; // Negação explícita
      }

      if (result && policy.efeito === 'allow') {
        return true; // Permitido
      }
    }

    return false; // Padrão: negar
  } catch (error) {
    console.error('Erro ao avaliar ABAC:', error);
    return false;
  }
}

/**
 * Avaliar condição ABAC
 * Exemplo de condição: { "departamento": "TI", "nivel_acesso": { "$gte": 5 } }
 */
function evaluateCondition(condition, context) {
  for (const [key, value] of Object.entries(condition)) {
    const contextValue = context[key];

    // Operadores
    if (typeof value === 'object' && value !== null) {
      for (const [op, opValue] of Object.entries(value)) {
        switch (op) {
          case '$eq':
            if (contextValue !== opValue) return false;
            break;
          case '$ne':
            if (contextValue === opValue) return false;
            break;
          case '$gt':
            if (!(contextValue > opValue)) return false;
            break;
          case '$gte':
            if (!(contextValue >= opValue)) return false;
            break;
          case '$lt':
            if (!(contextValue < opValue)) return false;
            break;
          case '$lte':
            if (!(contextValue <= opValue)) return false;
            break;
          case '$in':
            if (!Array.isArray(opValue) || !opValue.includes(contextValue)) return false;
            break;
          case '$nin':
            if (Array.isArray(opValue) && opValue.includes(contextValue)) return false;
            break;
          case '$regex':
            if (!new RegExp(opValue).test(contextValue)) return false;
            break;
          case '$between':
            if (!(contextValue >= opValue[0] && contextValue <= opValue[1])) return false;
            break;
          default:
            return false;
        }
      }
    } else {
      // Comparação direta
      if (contextValue !== value) return false;
    }
  }

  return true;
}

/**
 * Registrar tentativa de acesso negado
 */
async function logAccessDenied(req, permissionCode, reason) {
  try {
    await pool.query(
      `INSERT INTO auditoria_acesso 
       (usuario_id, acao, permissao_tentada, resultado, ip_address, user_agent, detalhes, sessao_id, impersonated_by)
       VALUES (?, 'permission_denied', ?, 'denied', ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        permissionCode,
        req.sessionInfo.ipAddress,
        req.sessionInfo.userAgent,
        JSON.stringify({ reason, path: req.path, method: req.method }),
        req.user.sessionId,
        req.user.impersonatedBy
      ]
    );
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
}

/**
 * Middleware: Adicionar informações de auditoria à resposta
 */
function auditResponse(action = 'access') {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async function(data) {
      // Registrar auditoria de acesso bem-sucedido
      if (res.statusCode < 400) {
        try {
          await pool.query(
            `INSERT INTO auditoria_acesso 
             (usuario_id, acao, recurso, resultado, ip_address, user_agent, detalhes, sessao_id, impersonated_by)
             VALUES (?, ?, ?, 'success', ?, ?, ?, ?, ?)`,
            [
              req.user.id,
              action,
              req.path,
              req.sessionInfo.ipAddress,
              req.sessionInfo.userAgent,
              JSON.stringify({ method: req.method, permission: req.permission?.code }),
              req.user.sessionId,
              req.user.impersonatedBy
            ]
          );
        } catch (error) {
          console.error('Erro ao registrar auditoria:', error);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Verificar se usuário pode fazer impersonation
 */
async function canImpersonate(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Verificar permissão de impersonation
    const [permissions] = await pool.query(
      `SELECT * FROM vw_usuario_permissoes_efetivas
       WHERE usuario_id = ? AND permissao_codigo = 'usuarios.impersonate'`,
      [userId]
    );

    if (permissions.length === 0) {
      return res.status(403).json({ 
        error: 'Sem permissão para impersonation',
        code: 'NO_IMPERSONATE_PERMISSION'
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de impersonation:', error);
    return res.status(500).json({ error: 'Erro ao verificar permissão' });
  }
}

/**
 * Verificar se usuário tem role específica
 */
function hasRole(...roleNames) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const [roles] = await pool.query(
        `SELECT r.nome 
         FROM usuario_roles ur
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE ur.usuario_id = ? 
           AND ur.ativo = TRUE
           AND (ur.data_fim IS NULL OR ur.data_fim >= CURDATE())
           AND r.nome IN (?)`,
        [userId, roleNames]
      );

      if (roles.length === 0) {
        return res.status(403).json({ 
          error: 'Role necessária não encontrada',
          code: 'ROLE_REQUIRED',
          requiredRoles: roleNames
        });
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      return res.status(500).json({ error: 'Erro ao verificar role' });
    }
  };
}

/**
 * Gerar token JWT
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Gerar refresh token
 */
function generateRefreshToken() {
  return jwt.sign(
    { type: 'refresh', random: Math.random() },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  setPool,
  authenticate,
  authorize,
  auditResponse,
  canImpersonate,
  hasRole,
  generateToken,
  generateRefreshToken,
  evaluateABACRules,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
