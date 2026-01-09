/**
 * Classe para padronização de respostas da API
 */
class ApiResponse {
  /**
   * Resposta de sucesso genérica
   */
  static success(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Resposta de erro genérica
   */
  static error(res, message = 'Erro ao processar requisição', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  }

  /**
   * Recurso criado com sucesso (201)
   */
  static created(res, data, message = 'Recurso criado com sucesso') {
    return res.status(201).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Sem conteúdo (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Requisição inválida (400)
   */
  static badRequest(res, message = 'Requisição inválida', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Recurso não encontrado (404)
   */
  static notFound(res, message = 'Recurso não encontrado') {
    return this.error(res, message, 404);
  }

  /**
   * Não autorizado (401)
   */
  static unauthorized(res, message = 'Não autorizado') {
    return this.error(res, message, 401);
  }

  /**
   * Acesso negado (403)
   */
  static forbidden(res, message = 'Acesso negado') {
    return this.error(res, message, 403);
  }

  /**
   * Conflito (409)
   */
  static conflict(res, message = 'Conflito detectado') {
    return this.error(res, message, 409);
  }

  /**
   * Erro interno do servidor (500)
   */
  static internalError(res, message = 'Erro interno do servidor', error = null) {
    const response = {
      success: false,
      message
    };

    // Em desenvolvimento, incluir stack trace
    if (process.env.NODE_ENV === 'development' && error) {
      response.error = error.message;
      response.stack = error.stack;
    }

    return res.status(500).json(response);
  }

  /**
   * Validação de campos obrigatórios
   */
  static validationError(res, errors) {
    return this.error(res, 'Erro de validação', 422, errors);
  }
}

export default ApiResponse;
