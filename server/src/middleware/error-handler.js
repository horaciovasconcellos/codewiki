import ApiResponse from '../utils/response.js';
import { ERROR_CODES } from '../utils/constants.js';

/**
 * Middleware global de tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error Handler:', err);

  // Erro de validação do Joi
  if (err.isJoi) {
    const errors = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return ApiResponse.validationError(res, errors);
  }

  // Erros específicos do MySQL
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        return ApiResponse.conflict(res, 'Registro duplicado. Este valor já existe no sistema.');
      
      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_NO_REFERENCED_ROW':
        return ApiResponse.badRequest(res, 'Referência inválida. O registro relacionado não existe.');
      
      case 'ER_ROW_IS_REFERENCED_2':
      case 'ER_ROW_IS_REFERENCED':
        return ApiResponse.conflict(res, 'Não é possível excluir. Existem registros relacionados.');
      
      case 'ER_BAD_FIELD_ERROR':
        return ApiResponse.badRequest(res, 'Campo inválido na consulta.');
      
      case 'ER_PARSE_ERROR':
        return ApiResponse.badRequest(res, 'Erro de sintaxe na consulta.');
      
      case 'PROTOCOL_CONNECTION_LOST':
        return ApiResponse.internalError(res, 'Conexão com o banco de dados perdida.');
      
      case 'ER_CON_COUNT_ERROR':
        return ApiResponse.internalError(res, 'Muitas conexões com o banco de dados.');
      
      case 'ER_ACCESS_DENIED_ERROR':
        return ApiResponse.internalError(res, 'Acesso ao banco de dados negado.');
    }
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expirado');
  }

  // Erro de multer (upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.badRequest(res, 'Arquivo muito grande');
    }
    return ApiResponse.badRequest(res, `Erro no upload: ${err.message}`);
  }

  // Erro customizado com statusCode
  if (err.statusCode) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  // Erro genérico
  return ApiResponse.internalError(res, 'Erro interno do servidor', err);
};

export default errorHandler;
