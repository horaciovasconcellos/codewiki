import express from 'express';
import bcrypt from 'bcrypt';
import database from '../config/database.js';

const router = express.Router();

// Get pool instance
const getPool = () => database.getPool();

// ============================================================================
// GET /api/usuarios - Listar todos os usuários
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const [usuarios] = await getPool().query(`
      SELECT 
        id,
        colaborador_id AS colaboradorId,
        email,
        role,
        ativo,
        colaborador_nome AS colaboradorNome,
        colaborador_matricula AS colaboradorMatricula,
        colaborador_setor AS colaboradorSetor,
        permissoes_por_setor AS permissoesPorSetor,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM usuarios
      ORDER BY colaborador_nome
    `);

    // Parse JSON fields
    const usuariosFormatados = usuarios.map(u => ({
      ...u,
      permissoesPorSetor: u.permissoesPorSetor ? JSON.parse(u.permissoesPorSetor) : []
    }));

    res.json(usuariosFormatados);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuários',
      message: error.message 
    });
  }
});

// ============================================================================
// GET /api/usuarios/:id - Buscar usuário por ID
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [usuarios] = await getPool().query(`
      SELECT 
        id,
        colaborador_id AS colaboradorId,
        email,
        role,
        ativo,
        colaborador_nome AS colaboradorNome,
        colaborador_matricula AS colaboradorMatricula,
        colaborador_setor AS colaboradorSetor,
        permissoes_por_setor AS permissoesPorSetor,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM usuarios
      WHERE id = ?
    `, [id]);

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuario = {
      ...usuarios[0],
      permissoesPorSetor: usuarios[0].permissoesPorSetor 
        ? JSON.parse(usuarios[0].permissoesPorSetor) 
        : []
    };

    res.json(usuario);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar usuário',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/usuarios - Criar novo usuário
// ============================================================================
router.post('/', async (req, res) => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      colaboradorId,
      email,
      senha,
      role,
      ativo = true,
      permissoesPorSetor = []
    } = req.body;

    // Validações
    if (!colaboradorId) {
      return res.status(400).json({ error: 'Colaborador é obrigatório' });
    }
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    if (!senha) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    if (!role) {
      return res.status(400).json({ error: 'Role é obrigatório' });
    }

    // Verificar se email já existe
    const [emailExists] = await connection.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );
    if (emailExists.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    // Verificar se colaborador já tem usuário
    const [colaboradorExists] = await connection.query(
      'SELECT id FROM usuarios WHERE colaborador_id = ?',
      [colaboradorId]
    );
    if (colaboradorExists.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Colaborador já possui um usuário' });
    }

    // Verificar se colaborador existe
    const [colaborador] = await connection.query(
      'SELECT id FROM colaboradores WHERE id = ?',
      [colaboradorId]
    );
    if (colaborador.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Colaborador não encontrado' });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário
    const [result] = await connection.query(`
      INSERT INTO usuarios (
        colaborador_id,
        email,
        senha_hash,
        role,
        ativo,
        permissoes_por_setor,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      colaboradorId,
      email,
      senhaHash,
      role,
      ativo,
      JSON.stringify(permissoesPorSetor),
      'SYSTEM' // TODO: Usar usuário autenticado
    ]);

    await connection.commit();

    // Buscar usuário criado
    const [novoUsuario] = await connection.query(`
      SELECT 
        id,
        colaborador_id AS colaboradorId,
        email,
        role,
        ativo,
        colaborador_nome AS colaboradorNome,
        colaborador_matricula AS colaboradorMatricula,
        colaborador_setor AS colaboradorSetor,
        permissoes_por_setor AS permissoesPorSetor,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM usuarios
      WHERE id = ?
    `, [result.insertId]);

    const usuario = {
      ...novoUsuario[0],
      permissoesPorSetor: novoUsuario[0].permissoesPorSetor 
        ? JSON.parse(novoUsuario[0].permissoesPorSetor) 
        : []
    };

    res.status(201).json(usuario);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao criar usuário',
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// ============================================================================
// PUT /api/usuarios/:id - Atualizar usuário
// ============================================================================
router.put('/:id', async (req, res) => {
  const connection = await getPool().getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      colaboradorId,
      email,
      senha,
      role,
      ativo,
      permissoesPorSetor
    } = req.body;

    // Verificar se usuário existe
    const [usuarioExists] = await connection.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [id]
    );
    if (usuarioExists.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se email está disponível (exceto para o próprio usuário)
    if (email) {
      const [emailExists] = await connection.query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );
      if (emailExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Email já está em uso' });
      }
    }

    // Verificar se colaborador está disponível (exceto para o próprio usuário)
    if (colaboradorId) {
      const [colaboradorExists] = await connection.query(
        'SELECT id FROM usuarios WHERE colaborador_id = ? AND id != ?',
        [colaboradorId, id]
      );
      if (colaboradorExists.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Colaborador já possui um usuário' });
      }
    }

    // Construir query de update dinamicamente
    const updates = [];
    const values = [];

    if (colaboradorId !== undefined) {
      updates.push('colaborador_id = ?');
      values.push(colaboradorId);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (senha) {
      // Se senha foi fornecida, fazer hash
      const saltRounds = 10;
      const senhaHash = await bcrypt.hash(senha, saltRounds);
      updates.push('senha_hash = ?');
      values.push(senhaHash);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(ativo);
    }
    if (permissoesPorSetor !== undefined) {
      updates.push('permissoes_por_setor = ?');
      values.push(JSON.stringify(permissoesPorSetor));
    }

    updates.push('updated_by = ?');
    values.push('SYSTEM'); // TODO: Usar usuário autenticado

    values.push(id);

    if (updates.length > 0) {
      await connection.query(`
        UPDATE usuarios 
        SET ${updates.join(', ')}
        WHERE id = ?
      `, values);
    }

    await connection.commit();

    // Buscar usuário atualizado
    const [usuarioAtualizado] = await connection.query(`
      SELECT 
        id,
        colaborador_id AS colaboradorId,
        email,
        role,
        ativo,
        colaborador_nome AS colaboradorNome,
        colaborador_matricula AS colaboradorMatricula,
        colaborador_setor AS colaboradorSetor,
        permissoes_por_setor AS permissoesPorSetor,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM usuarios
      WHERE id = ?
    `, [id]);

    const usuario = {
      ...usuarioAtualizado[0],
      permissoesPorSetor: usuarioAtualizado[0].permissoesPorSetor 
        ? JSON.parse(usuarioAtualizado[0].permissoesPorSetor) 
        : []
    };

    res.json(usuario);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar usuário',
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// ============================================================================
// DELETE /api/usuarios/:id - Excluir usuário
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se usuário existe
    const [usuario] = await getPool().query(
      'SELECT id, email FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Excluir usuário
    await getPool().query('DELETE FROM usuarios WHERE id = ?', [id]);

    res.json({ 
      message: 'Usuário excluído com sucesso',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao excluir usuário',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/usuarios/validate-email - Validar disponibilidade de email
// ============================================================================
router.post('/validate-email', async (req, res) => {
  try {
    const { email, usuarioId } = req.body;

    let query = 'SELECT id FROM usuarios WHERE email = ?';
    let params = [email];

    if (usuarioId) {
      query += ' AND id != ?';
      params.push(usuarioId);
    }

    const [results] = await getPool().query(query, params);

    res.json({ 
      disponivel: results.length === 0,
      emUso: results.length > 0
    });
  } catch (error) {
    console.error('Erro ao validar email:', error);
    res.status(500).json({ 
      error: 'Erro ao validar email',
      message: error.message 
    });
  }
});

// ============================================================================
// POST /api/usuarios/validate-colaborador - Validar disponibilidade de colaborador
// ============================================================================
router.post('/validate-colaborador', async (req, res) => {
  try {
    const { colaboradorId, usuarioId } = req.body;

    let query = 'SELECT id FROM usuarios WHERE colaborador_id = ?';
    let params = [colaboradorId];

    if (usuarioId) {
      query += ' AND id != ?';
      params.push(usuarioId);
    }

    const [results] = await getPool().query(query, params);

    res.json({ 
      disponivel: results.length === 0,
      emUso: results.length > 0
    });
  } catch (error) {
    console.error('Erro ao validar colaborador:', error);
    res.status(500).json({ 
      error: 'Erro ao validar colaborador',
      message: error.message 
    });
  }
});

export default router;
