import { v4 as uuidv4 } from 'uuid';
import database from '../config/database.js';
import dbService from './database.service.js';

/**
 * Serviço de Tecnologias
 */
class TecnologiasService {
  /**
   * Mapear campos do banco para o formato da API
   */
  mapTecnologia(row) {
    if (!row) return null;
    
    return {
      id: row.id,
      sigla: row.sigla,
      nome: row.nome,
      versaoRelease: row.versao_release,
      categoria: row.categoria,
      status: row.status,
      fornecedorFabricante: row.fornecedor_fabricante,
      tipoLicenciamento: row.tipo_licenciamento,
      dataFimSuporteEos: row.data_fim_suporte_eos,
      maturidadeInterna: row.maturidade_interna,
      nivelSuporteInterno: row.nivel_suporte_interno,
      documentacaoOficial: row.documentacao_oficial,
      repositorioInterno: row.repositorio_interno,
      ambienteDev: row.ambiente_dev === '1' || row.ambiente_dev === 1 || row.ambiente_dev === true,
      ambienteQa: row.ambiente_qa === '1' || row.ambiente_qa === 1 || row.ambiente_qa === true,
      ambienteProd: row.ambiente_prod === '1' || row.ambiente_prod === 1 || row.ambiente_prod === true,
      ambienteCloud: row.ambiente_cloud === '1' || row.ambiente_cloud === 1 || row.ambiente_cloud === true,
      ambienteOnPremise: row.ambiente_on_premise === '1' || row.ambiente_on_premise === 1 || row.ambiente_on_premise === true,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Buscar todas as tecnologias
   */
  async getAll() {
    const rows = await database.query('SELECT * FROM tecnologias ORDER BY sigla');
    return rows.map(row => this.mapTecnologia(row));
  }

  /**
   * Buscar tecnologia por ID
   */
  async getById(id) {
    const row = await dbService.findById('tecnologias', id);
    
    if (!row) {
      throw { statusCode: 404, message: 'Tecnologia não encontrada' };
    }

    return this.mapTecnologia(row);
  }

  /**
   * Criar nova tecnologia
   */
  async create(data) {
    // Verificar se sigla já existe
    const exists = await dbService.exists('tecnologias', 'sigla', data.sigla);
    if (exists) {
      throw { statusCode: 409, message: 'Sigla já cadastrada' };
    }

    const id = uuidv4();
    const tecnologia = {
      id,
      sigla: data.sigla,
      nome: data.nome,
      versao_release: data.versaoRelease || null,
      categoria: data.categoria || null,
      status: data.status || null,
      fornecedor_fabricante: data.fornecedorFabricante || null,
      tipo_licenciamento: data.tipoLicenciamento || null,
      data_fim_suporte_eos: data.dataFimSuporteEos || null,
      maturidade_interna: data.maturidadeInterna || null,
      nivel_suporte_interno: data.nivelSuporteInterno || null,
      documentacao_oficial: data.documentacaoOficial || null,
      repositorio_interno: data.repositorioInterno || null,
      ambiente_dev: data.ambienteDev ? 1 : 0,
      ambiente_qa: data.ambienteQa ? 1 : 0,
      ambiente_prod: data.ambienteProd ? 1 : 0,
      ambiente_cloud: data.ambienteCloud ? 1 : 0,
      ambiente_on_premise: data.ambienteOnPremise ? 1 : 0,
      created_at: new Date()
    };

    await dbService.create('tecnologias', tecnologia);
    return await this.getById(id);
  }

  /**
   * Atualizar tecnologia
   */
  async update(id, data) {
    // Verificar se existe
    const existing = await dbService.findById('tecnologias', id);
    if (!existing) {
      throw { statusCode: 404, message: 'Tecnologia não encontrada' };
    }

    // Se alterou a sigla, verificar se nova sigla já existe
    if (data.sigla && data.sigla !== existing.sigla) {
      const exists = await dbService.exists('tecnologias', 'sigla', data.sigla);
      if (exists) {
        throw { statusCode: 409, message: 'Sigla já cadastrada' };
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    // Apenas atualizar campos fornecidos
    if (data.sigla !== undefined) updateData.sigla = data.sigla;
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.versaoRelease !== undefined) updateData.versao_release = data.versaoRelease;
    if (data.categoria !== undefined) updateData.categoria = data.categoria;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.fornecedorFabricante !== undefined) updateData.fornecedor_fabricante = data.fornecedorFabricante;
    if (data.tipoLicenciamento !== undefined) updateData.tipo_licenciamento = data.tipoLicenciamento;
    if (data.dataFimSuporteEos !== undefined) updateData.data_fim_suporte_eos = data.dataFimSuporteEos;
    if (data.maturidadeInterna !== undefined) updateData.maturidade_interna = data.maturidadeInterna;
    if (data.nivelSuporteInterno !== undefined) updateData.nivel_suporte_interno = data.nivelSuporteInterno;
    if (data.documentacaoOficial !== undefined) updateData.documentacao_oficial = data.documentacaoOficial;
    if (data.repositorioInterno !== undefined) updateData.repositorio_interno = data.repositorioInterno;
    if (data.ambienteDev !== undefined) updateData.ambiente_dev = data.ambienteDev ? 1 : 0;
    if (data.ambienteQa !== undefined) updateData.ambiente_qa = data.ambienteQa ? 1 : 0;
    if (data.ambienteProd !== undefined) updateData.ambiente_prod = data.ambienteProd ? 1 : 0;
    if (data.ambienteCloud !== undefined) updateData.ambiente_cloud = data.ambienteCloud ? 1 : 0;
    if (data.ambienteOnPremise !== undefined) updateData.ambiente_on_premise = data.ambienteOnPremise ? 1 : 0;

    await dbService.update('tecnologias', id, updateData);
    return await this.getById(id);
  }

  /**
   * Excluir tecnologia
   */
  async delete(id) {
    // Verificar se existe
    const existing = await dbService.findById('tecnologias', id);
    if (!existing) {
      throw { statusCode: 404, message: 'Tecnologia não encontrada' };
    }

    // Verificar dependências (se houver tabelas relacionadas)
    // Por exemplo, verificar se há aplicações usando esta tecnologia
    // const hasRelations = await dbService.count('aplicacao_tecnologias', 'tecnologia_id = ?', [id]);
    // if (hasRelations > 0) {
    //   throw { statusCode: 409, message: 'Não é possível excluir. Existem aplicações relacionadas.' };
    // }

    const deleted = await dbService.delete('tecnologias', id);
    return deleted;
  }

  /**
   * Buscar tecnologias por termo
   */
  async search(query) {
    const searchTerm = `%${query}%`;
    const rows = await database.query(
      `SELECT * FROM tecnologias 
       WHERE sigla LIKE ? OR nome LIKE ? OR categoria LIKE ?
       ORDER BY sigla`,
      [searchTerm, searchTerm, searchTerm]
    );
    return rows.map(row => this.mapTecnologia(row));
  }

  /**
   * Buscar por categoria
   */
  async getByCategoria(categoria) {
    const rows = await database.query(
      'SELECT * FROM tecnologias WHERE categoria = ? ORDER BY sigla',
      [categoria]
    );
    return rows.map(row => this.mapTecnologia(row));
  }

  /**
   * Obter estatísticas
   */
  async getStats() {
    const [totalResult] = await database.query('SELECT COUNT(*) as total FROM tecnologias');
    const total = totalResult[0].total;

    const categorias = await database.query(
      'SELECT categoria, COUNT(*) as count FROM tecnologias GROUP BY categoria'
    );

    const status = await database.query(
      'SELECT status, COUNT(*) as count FROM tecnologias GROUP BY status'
    );

    return {
      total,
      porCategoria: categorias,
      porStatus: status
    };
  }
}

export default new TecnologiasService();
