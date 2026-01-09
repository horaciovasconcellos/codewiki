import tecnologiasService from '../services/tecnologias.service.js';
import ApiResponse from '../utils/response.js';

/**
 * Controller de Tecnologias
 */
class TecnologiasController {
  /**
   * Listar todas as tecnologias
   * GET /api/tecnologias
   */
  async getAll(req, res, next) {
    try {
      const tecnologias = await tecnologiasService.getAll();
      return ApiResponse.success(res, tecnologias);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar tecnologia por ID
   * GET /api/tecnologias/:id
   */
  async getById(req, res, next) {
    try {
      const tecnologia = await tecnologiasService.getById(req.params.id);
      return ApiResponse.success(res, tecnologia);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar nova tecnologia
   * POST /api/tecnologias
   */
  async create(req, res, next) {
    try {
      const tecnologia = await tecnologiasService.create(req.body);
      return ApiResponse.created(res, tecnologia, 'Tecnologia criada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar tecnologia
   * PUT /api/tecnologias/:id
   */
  async update(req, res, next) {
    try {
      const tecnologia = await tecnologiasService.update(req.params.id, req.body);
      return ApiResponse.success(res, tecnologia, 'Tecnologia atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir tecnologia
   * DELETE /api/tecnologias/:id
   */
  async delete(req, res, next) {
    try {
      await tecnologiasService.delete(req.params.id);
      return ApiResponse.success(res, null, 'Tecnologia excluída com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar tecnologias
   * GET /api/tecnologias/search?q=termo
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      
      if (!q) {
        return ApiResponse.badRequest(res, 'Parâmetro de busca "q" é obrigatório');
      }

      const tecnologias = await tecnologiasService.search(q);
      return ApiResponse.success(res, tecnologias);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas
   * GET /api/tecnologias/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await tecnologiasService.getStats();
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new TecnologiasController();
