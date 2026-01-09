import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import authConfig from '../config/auth.js';
import database from '../config/database.js';
import dbService from './database.service.js';

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Registrar novo usuário
   */
  async register(userData) {
    const { nome, email, senha, role = 'user' } = userData;

    // Verificar se email já existe
    const existingUser = await dbService.findBy('users', 'email', email);
    if (existingUser) {
      throw { statusCode: 409, message: 'Email já cadastrado' };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, authConfig.bcrypt.rounds);

    // Criar usuário
    const user = {
      id: uuidv4(),
      nome,
      email,
      senha: hashedPassword,
      role,
      ativo: true,
      created_at: new Date()
    };

    await dbService.create('users', user);

    // Retornar sem a senha
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login - validar credenciais e gerar tokens
   */
  async login(email, senha) {
    // Buscar usuário
    const user = await dbService.findBy('users', 'email', email);
    
    if (!user) {
      throw { statusCode: 401, message: 'Credenciais inválidas' };
    }

    if (!user.ativo) {
      throw { statusCode: 403, message: 'Usuário inativo' };
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Credenciais inválidas' };
    }

    // Atualizar último acesso
    await database.execute(
      'UPDATE users SET ultimo_acesso = NOW() WHERE id = ?',
      [user.id]
    );

    // Gerar tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Retornar dados sem senha
    const { senha: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword
    };
  }

  /**
   * Logout - invalidar refresh token
   */
  async logout(userId, refreshToken) {
    if (refreshToken) {
      await database.execute(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND token = ?',
        [userId, refreshToken]
      );
    }
    return true;
  }

  /**
   * Renovar access token usando refresh token
   */
  async refreshToken(refreshToken) {
    // Verificar se refresh token existe e é válido
    const [tokens] = await database.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (tokens.length === 0) {
      throw { statusCode: 401, message: 'Refresh token inválido ou expirado' };
    }

    const tokenData = tokens[0];

    // Buscar usuário
    const user = await dbService.findById('users', tokenData.user_id);
    
    if (!user || !user.ativo) {
      throw { statusCode: 401, message: 'Usuário não encontrado ou inativo' };
    }

    // Gerar novo access token
    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, authConfig.jwt.secret);
    } catch (error) {
      throw { statusCode: 401, message: 'Token inválido' };
    }
  }

  /**
   * Gerar access token JWT
   */
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn
    });
  }

  /**
   * Gerar refresh token
   */
  async generateRefreshToken(user) {
    const token = jwt.sign(
      { id: user.id },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.refreshExpiresIn }
    );

    // Salvar no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await dbService.create('refresh_tokens', {
      id: uuidv4(),
      user_id: user.id,
      token,
      expires_at: expiresAt,
      created_at: new Date()
    });

    return token;
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(userId, senhaAtual, senhaNova) {
    // Buscar usuário
    const user = await dbService.findById('users', userId);
    
    if (!user) {
      throw { statusCode: 404, message: 'Usuário não encontrado' };
    }

    // Verificar senha atual
    const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
    
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Senha atual incorreta' };
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(senhaNova, authConfig.bcrypt.rounds);

    // Atualizar senha
    await database.execute(
      'UPDATE users SET senha = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    return true;
  }

  /**
   * Solicitar reset de senha (gerar token)
   */
  async requestPasswordReset(email) {
    const user = await dbService.findBy('users', 'email', email);
    
    if (!user) {
      // Não revelar se o email existe por segurança
      return { message: 'Se o email existir, você receberá instruções de reset' };
    }

    // Gerar token de reset
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora de validade

    await dbService.create('password_reset_tokens', {
      id: uuidv4(),
      user_id: user.id,
      token,
      expires_at: expiresAt,
      used: false,
      created_at: new Date()
    });

    // Em produção, enviar email aqui
    // Para desenvolvimento, retornar o token
    if (process.env.NODE_ENV === 'development') {
      return { message: 'Token de reset gerado', token };
    }

    return { message: 'Se o email existir, você receberá instruções de reset' };
  }

  /**
   * Resetar senha com token
   */
  async resetPassword(token, senhaNova) {
    // Buscar token válido
    const [tokens] = await database.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
      [token]
    );

    if (tokens.length === 0) {
      throw { statusCode: 400, message: 'Token inválido ou expirado' };
    }

    const resetToken = tokens[0];

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(senhaNova, authConfig.bcrypt.rounds);

    // Atualizar senha e marcar token como usado
    await database.transaction(async (connection) => {
      await connection.execute(
        'UPDATE users SET senha = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, resetToken.user_id]
      );

      await connection.execute(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?',
        [resetToken.id]
      );
    });

    return true;
  }

  /**
   * Buscar informações do usuário por ID
   */
  async getUserById(userId) {
    const user = await dbService.findById('users', userId);
    
    if (!user) {
      throw { statusCode: 404, message: 'Usuário não encontrado' };
    }

    // Remover senha
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new AuthService();
