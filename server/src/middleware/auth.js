import jwt from 'jsonwebtoken';
import authConfig from '../config/auth.js';
import ApiResponse from '../utils/response.js';

/**
 * Middleware de autenticação JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return ApiResponse.unauthorized(res, 'Token não fornecido');
    }

    // Verificar formato Bearer
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return ApiResponse.unauthorized(res, 'Formato de token inválido');
    }

    const token = parts[1];

    // Verificar token
    const decoded = jwt.verify(token, authConfig.jwt.secret);
    
    // Anexar informações do usuário na requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expirado');
    }
    return ApiResponse.unauthorized(res, 'Falha na autenticação');
  }
};

/**
 * Middleware de autorização por role
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.unauthorized(res, 'Usuário não autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'Acesso negado. Permissões insuficientes.');
    }

    next();
  };
};

/**
 * Middleware de autenticação opcional
 * Tenta autenticar mas não falha se não houver token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, authConfig.jwt.secret);
        
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
  } catch (error) {
    // Ignora erros de autenticação opcional
    console.log('Optional auth failed:', error.message);
  }
  
  next();
};

export default {
  authenticate,
  authorize,
  optionalAuth
};
