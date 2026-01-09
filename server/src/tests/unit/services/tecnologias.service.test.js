import tecnologiasService from '../../../services/tecnologias.service.js';
import dbService from '../../../services/database.service.js';
import database from '../../../config/database.js';

// Mock dependencies
jest.mock('../../../services/database.service.js');
jest.mock('../../../config/database.js', () => ({
  default: {
    query: jest.fn()
  }
}));

describe('TecnologiasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all tecnologias', async () => {
      const mockTecnologias = [
        {
          id: '1',
          sigla: 'REACT',
          nome: 'React.js',
          versao_release: '18.0',
          categoria: 'Framework',
          status: 'Ativa',
          ambiente_dev: 1,
          ambiente_qa: 1,
          ambiente_prod: 1,
          ambiente_cloud: 0,
          ambiente_on_premise: 1
        }
      ];

      database.query.mockResolvedValue(mockTecnologias);

      const result = await tecnologiasService.getAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('sigla', 'REACT');
      expect(result[0]).toHaveProperty('ambienteDev', true);
      expect(result[0]).toHaveProperty('ambienteCloud', false);
    });
  });

  describe('getById', () => {
    it('should return a tecnologia by id', async () => {
      const mockTecnologia = {
        id: '1',
        sigla: 'NODE',
        nome: 'Node.js',
        versao_release: '20.0',
        ambiente_dev: 1
      };

      dbService.findById.mockResolvedValue(mockTecnologia);

      const result = await tecnologiasService.getById('1');

      expect(result).toHaveProperty('sigla', 'NODE');
      expect(result).toHaveProperty('ambienteDev', true);
    });

    it('should throw error if tecnologia not found', async () => {
      dbService.findById.mockResolvedValue(null);

      await expect(tecnologiasService.getById('999')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tecnologia não encontrada'
      });
    });
  });

  describe('create', () => {
    it('should create a new tecnologia', async () => {
      const newTecnologia = {
        sigla: 'VUE',
        nome: 'Vue.js',
        versaoRelease: '3.0',
        categoria: 'Framework',
        ambienteDev: true
      };

      dbService.exists.mockResolvedValue(false);
      dbService.create.mockResolvedValue(undefined);
      dbService.findById.mockResolvedValue({
        id: '123',
        sigla: newTecnologia.sigla,
        nome: newTecnologia.nome,
        versao_release: newTecnologia.versaoRelease,
        categoria: newTecnologia.categoria,
        ambiente_dev: 1
      });

      const result = await tecnologiasService.create(newTecnologia);

      expect(result).toHaveProperty('sigla', 'VUE');
      expect(dbService.exists).toHaveBeenCalledWith('tecnologias', 'sigla', 'VUE');
      expect(dbService.create).toHaveBeenCalled();
    });

    it('should throw error if sigla already exists', async () => {
      const newTecnologia = {
        sigla: 'EXISTING',
        nome: 'Existing Tech'
      };

      dbService.exists.mockResolvedValue(true);

      await expect(tecnologiasService.create(newTecnologia)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Sigla já cadastrada'
      });
    });
  });

  describe('update', () => {
    it('should update a tecnologia', async () => {
      const existingTecnologia = {
        id: '1',
        sigla: 'REACT',
        nome: 'React.js'
      };

      const updateData = {
        versaoRelease: '19.0',
        status: 'Ativa'
      };

      dbService.findById.mockResolvedValue(existingTecnologia);
      dbService.update.mockResolvedValue(undefined);
      dbService.findById.mockResolvedValueOnce(existingTecnologia)
        .mockResolvedValueOnce({
          ...existingTecnologia,
          versao_release: '19.0',
          status: 'Ativa'
        });

      const result = await tecnologiasService.update('1', updateData);

      expect(dbService.update).toHaveBeenCalled();
      expect(result).toHaveProperty('versaoRelease', '19.0');
    });

    it('should throw error if tecnologia not found', async () => {
      dbService.findById.mockResolvedValue(null);

      await expect(
        tecnologiasService.update('999', { nome: 'Updated' })
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tecnologia não encontrada'
      });
    });
  });

  describe('delete', () => {
    it('should delete a tecnologia', async () => {
      const existingTecnologia = {
        id: '1',
        sigla: 'TOREMOVE'
      };

      dbService.findById.mockResolvedValue(existingTecnologia);
      dbService.delete.mockResolvedValue(true);

      const result = await tecnologiasService.delete('1');

      expect(result).toBe(true);
      expect(dbService.delete).toHaveBeenCalledWith('tecnologias', '1');
    });

    it('should throw error if tecnologia not found', async () => {
      dbService.findById.mockResolvedValue(null);

      await expect(tecnologiasService.delete('999')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tecnologia não encontrada'
      });
    });
  });

  describe('search', () => {
    it('should search tecnologias by query', async () => {
      const mockResults = [
        {
          id: '1',
          sigla: 'REACT',
          nome: 'React.js',
          categoria: 'Framework'
        }
      ];

      database.query.mockResolvedValue(mockResults);

      const result = await tecnologiasService.search('react');

      expect(result).toHaveLength(1);
      expect(database.query).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      database.query
        .mockResolvedValueOnce([[{ total: 10 }]])
        .mockResolvedValueOnce([
          { categoria: 'Framework', count: 5 },
          { categoria: 'Linguagem', count: 3 }
        ])
        .mockResolvedValueOnce([
          { status: 'Ativa', count: 8 },
          { status: 'Descontinuada', count: 2 }
        ]);

      const result = await tecnologiasService.getStats();

      expect(result).toHaveProperty('total', 10);
      expect(result).toHaveProperty('porCategoria');
      expect(result).toHaveProperty('porStatus');
    });
  });
});
