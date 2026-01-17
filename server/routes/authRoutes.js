/**
 * API de Autenticação e Controle de Acesso
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { 
  authenticate, 
  authorize, 
  canImpersonate,
  hasRole,
  generateToken,
  generateRefreshToken,
  auditResponse 
} = require('../middleware/authMiddleware');

const router = express.Router();
let pool; // Pool de conexão MySQL

function setPool(dbPool) {
  pool = dbPool;
}

// =====================================================
// AUTENTICAÇÃO
// =====================================================

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const [users] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = TRUE',
      [email]
    );

    if (users.length === 0) {
      // Registrar tentativa falha
      await pool.query(
        `INSERT INTO auditoria_acesso 
         (usuario_id, acao, resultado, ip_address, user_agent, detalhes)
         VALUES (0, 'login_failed', 'denied', ?, ?, ?)`,
        [req.ip, req.headers['user-agent'], JSON.stringify({ email, reason: 'user_not_found' })]
      );

      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = users[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      // Registrar tentativa falha
      await pool.query(
        `INSERT INTO auditoria_acesso 
         (usuario_id, acao, resultado, ip_address, user_agent, detalhes)
         VALUES (?, 'login_failed', 'denied', ?, ?, ?)`,
        [user.id, req.ip, req.headers['user-agent'], JSON.stringify({ reason: 'wrong_password' })]
      );

      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken();

    // Calcular expiração (8 horas)
    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + 8);

    // Criar sessão
    const [result] = await pool.query(
      `INSERT INTO sessoes_usuario 
       (usuario_id, token, refresh_token, ip_address, user_agent, data_expiracao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, token, refreshToken, req.ip, req.headers['user-agent'], dataExpiracao]
    );

    const sessionId = result.insertId;

    // Registrar login bem-sucedido
    await pool.query(
      `INSERT INTO auditoria_acesso 
       (usuario_id, acao, resultado, ip_address, user_agent, sessao_id)
       VALUES (?, 'login', 'success', ?, ?, ?)`,
      [user.id, req.ip, req.headers['user-agent'], sessionId]
    );

    // Buscar permissões do usuário
    const [permissions] = await pool.query(
      `SELECT DISTINCT permissao_codigo, acao, recurso_nome
       FROM vw_usuario_permissoes_efetivas
       WHERE usuario_id = ?`,
      [user.id]
    );

    // Buscar roles
    const [roles] = await pool.query(
      `SELECT r.nome, r.nivel_hierarquia
       FROM usuario_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.usuario_id = ? AND ur.ativo = TRUE
         AND (ur.data_fim IS NULL OR ur.data_fim >= CURDATE())`,
      [user.id]
    );

    res.json({
      success: true,
      token,
      refreshToken,
      expiresIn: '8h',
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        roles: roles.map(r => r.nome),
        nivelHierarquia: Math.max(...roles.map(r => r.nivel_hierarquia), 0)
      },
      permissions: permissions.map(p => p.permissao_codigo),
      permissionsByResource: groupPermissionsByResource(permissions)
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login', details: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout de usuário
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const sessionId = req.user.sessionId;

    // Desativar sessão
    await pool.query(
      'UPDATE sessoes_usuario SET ativa = FALSE, data_logout = NOW() WHERE id = ?',
      [sessionId]
    );

    // Registrar logout
    await pool.query(
      `INSERT INTO auditoria_acesso 
       (usuario_id, acao, resultado, ip_address, user_agent, sessao_id)
       VALUES (?, 'logout', 'success', ?, ?, ?)`,
      [req.user.id, req.ip, req.headers['user-agent'], sessionId]
    );

    res.json({ success: true, message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout', details: error.message });
  }
});

/**
 * POST /api/auth/refresh
 * Renovar token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token não fornecido' });
    }

    // Buscar sessão
    const [sessions] = await pool.query(
      `SELECT s.*, u.* 
       FROM sessoes_usuario s
       INNER JOIN usuarios u ON s.usuario_id = u.id
       WHERE s.refresh_token = ? AND s.ativa = TRUE`,
      [refreshToken]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const session = sessions[0];
    const user = {
      id: session.usuario_id,
      nome: session.nome,
      email: session.email
    };

    // Gerar novo token
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken();

    // Calcular nova expiração
    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + 8);

    // Atualizar sessão
    await pool.query(
      `UPDATE sessoes_usuario 
       SET token = ?, refresh_token = ?, data_expiracao = ?
       WHERE id = ?`,
      [newToken, newRefreshToken, dataExpiracao, session.id]
    );

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: '8h'
    });

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ error: 'Erro ao renovar token', details: error.message });
  }
});

/**
 * GET /api/auth/me
 * Obter informações do usuário autenticado
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, nome, email, created_at FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const [permissions] = await pool.query(
      `SELECT DISTINCT permissao_codigo, acao, recurso_nome
       FROM vw_usuario_permissoes_efetivas
       WHERE usuario_id = ?`,
      [req.user.id]
    );

    const [roles] = await pool.query(
      `SELECT r.nome, r.nivel_hierarquia, r.descricao
       FROM usuario_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE ur.usuario_id = ? AND ur.ativo = TRUE
         AND (ur.data_fim IS NULL OR ur.data_fim >= CURDATE())`,
      [req.user.id]
    );

    res.json({
      user: users[0],
      roles: roles,
      permissions: permissions.map(p => p.permissao_codigo),
      permissionsByResource: groupPermissionsByResource(permissions),
      isImpersonated: !!req.user.impersonatedBy
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário', details: error.message });
  }
});

// =====================================================
// IMPERSONATION
// =====================================================

/**
 * POST /api/auth/impersonate/:userId
 * Iniciar impersonation de outro usuário
 */
router.post('/impersonate/:userId', authenticate, canImpersonate, async (req, res) => {
  try {
    const adminId = req.user.id;
    const targetUserId = parseInt(req.params.userId);

    if (adminId === targetUserId) {
      return res.status(400).json({ error: 'Não é possível impersonar a si mesmo' });
    }

    // Verificar se usuário alvo existe
    const [targetUsers] = await pool.query(
      'SELECT * FROM usuarios WHERE id = ? AND ativo = TRUE',
      [targetUserId]
    );

    if (targetUsers.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const targetUser = targetUsers[0];

    // Gerar token para impersonation
    const token = generateToken(targetUser);
    const refreshToken = generateRefreshToken();

    const dataExpiracao = new Date();
    dataExpiracao.setHours(dataExpiracao.getHours() + 8);

    // Criar sessão de impersonation
    const [result] = await pool.query(
      `INSERT INTO sessoes_usuario 
       (usuario_id, token, refresh_token, ip_address, user_agent, data_expiracao, impersonated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [targetUserId, token, refreshToken, req.ip, req.headers['user-agent'], dataExpiracao, adminId]
    );

    // Registrar auditoria
    await pool.query(
      `INSERT INTO auditoria_acesso 
       (usuario_id, acao, resultado, ip_address, user_agent, sessao_id, impersonated_by, detalhes)
       VALUES (?, 'impersonation_start', 'success', ?, ?, ?, ?, ?)`,
      [targetUserId, req.ip, req.headers['user-agent'], result.insertId, adminId,
       JSON.stringify({ admin: adminId, target: targetUserId })]
    );

    res.json({
      success: true,
      token,
      refreshToken,
      impersonatedUser: {
        id: targetUser.id,
        nome: targetUser.nome,
        email: targetUser.email
      },
      adminUser: {
        id: adminId,
        nome: req.user.nome
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar impersonation:', error);
    res.status(500).json({ error: 'Erro ao iniciar impersonation', details: error.message });
  }
});

/**
 * POST /api/auth/stop-impersonate
 * Parar impersonation
 */
router.post('/stop-impersonate', authenticate, async (req, res) => {
  try {
    if (!req.user.impersonatedBy) {
      return res.status(400).json({ error: 'Não há impersonation ativa' });
    }

    const sessionId = req.user.sessionId;

    // Desativar sessão de impersonation
    await pool.query(
      'UPDATE sessoes_usuario SET ativa = FALSE, data_logout = NOW() WHERE id = ?',
      [sessionId]
    );

    // Registrar auditoria
    await pool.query(
      `INSERT INTO auditoria_acesso 
       (usuario_id, acao, resultado, ip_address, user_agent, sessao_id, impersonated_by)
       VALUES (?, 'impersonation_end', 'success', ?, ?, ?, ?)`,
      [req.user.id, req.ip, req.headers['user-agent'], sessionId, req.user.impersonatedBy]
    );

    res.json({ success: true, message: 'Impersonation finalizada' });

  } catch (error) {
    console.error('Erro ao parar impersonation:', error);
    res.status(500).json({ error: 'Erro ao parar impersonation', details: error.message });
  }
});

// =====================================================
// VERIFICAÇÃO DE PERMISSÕES
// =====================================================

/**
 * POST /api/auth/check-permission
 * Verificar se usuário tem permissão específica
 */
router.post('/check-permission', authenticate, async (req, res) => {
  try {
    const { permissionCode, context } = req.body;

    if (!permissionCode) {
      return res.status(400).json({ error: 'Código de permissão é obrigatório' });
    }

    // Verificar ACL deny
    const [denyRules] = await pool.query(
      `SELECT acl.* 
       FROM usuario_permissoes_acl acl
       INNER JOIN permissoes p ON acl.permissao_id = p.id
       WHERE acl.usuario_id = ? 
         AND p.codigo = ?
         AND acl.tipo = 'deny'
         AND acl.ativo = TRUE
         AND (acl.data_fim IS NULL OR acl.data_fim >= CURDATE())`,
      [req.user.id, permissionCode]
    );

    if (denyRules.length > 0) {
      return res.json({ 
        hasPermission: false, 
        reason: 'ACL_DENY',
        deniedBy: denyRules[0]
      });
    }

    // Verificar permissões efetivas
    const [permissions] = await pool.query(
      `SELECT * FROM vw_usuario_permissoes_efetivas
       WHERE usuario_id = ? AND permissao_codigo = ?`,
      [req.user.id, permissionCode]
    );

    res.json({ 
      hasPermission: permissions.length > 0,
      source: permissions[0]?.origem || null,
      role: permissions[0]?.role_nome || null
    });

  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    res.status(500).json({ error: 'Erro ao verificar permissão', details: error.message });
  }
});

/**
 * GET /api/auth/my-permissions
 * Listar todas as permissões do usuário autenticado
 */
router.get('/my-permissions', authenticate, async (req, res) => {
  try {
    const [permissions] = await pool.query(
      `SELECT DISTINCT 
         permissao_codigo, 
         acao, 
         recurso_nome,
         recurso_tipo,
         origem,
         role_nome
       FROM vw_usuario_permissoes_efetivas
       WHERE usuario_id = ?
       ORDER BY recurso_nome, acao`,
      [req.user.id]
    );

    res.json({
      permissions,
      permissionsByResource: groupPermissionsByResource(permissions),
      total: permissions.length
    });

  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ error: 'Erro ao listar permissões', details: error.message });
  }
});

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function groupPermissionsByResource(permissions) {
  const grouped = {};
  
  permissions.forEach(p => {
    if (!grouped[p.recurso_nome]) {
      grouped[p.recurso_nome] = {
        create: false,
        read: false,
        update: false,
        delete: false,
        execute: false,
        export: false,
        import: false,
        approve: false
      };
    }
    grouped[p.recurso_nome][p.acao] = true;
  });
  
  return grouped;
}

module.exports = { router, setPool };
