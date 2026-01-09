import authService from '../services/auth.service.js';
import ApiResponse from '../utils/response.js';

/**
 * Controller de autenticação
 */
class AuthController {
  /**
   * Registrar novo usuário
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return ApiResponse.created(res, user, 'Usuário registrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      const result = await authService.login(email, senha);
      return ApiResponse.success(res, result, 'Login realizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user.id, refreshToken);
      return ApiResponse.success(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renovar access token
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token não fornecido');
      }

      const result = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, result, 'Token renovado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter dados do usuário logado
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);
      return ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { senhaAtual, senhaNova } = req.body;
      await authService.changePassword(req.user.id, senhaAtual, senhaNova);
      return ApiResponse.success(res, null, 'Senha alterada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Solicitar reset de senha
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resetar senha com token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, senhaNova } = req.body;
      await authService.resetPassword(token, senhaNova);
      return ApiResponse.success(res, null, 'Senha resetada com sucesso');
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
