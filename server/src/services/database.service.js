import database from '../config/database.js';

/**
 * Serviço genérico de operações de banco de dados
 */
class DatabaseService {
  /**
   * Buscar todos os registros de uma tabela
   */
  async findAll(table, orderBy = 'created_at DESC') {
    const query = `SELECT * FROM ${table} ORDER BY ${orderBy}`;
    return await database.query(query);
  }

  /**
   * Buscar registro por ID
   */
  async findById(table, id) {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const results = await database.query(query, [id]);
    return results[0] || null;
  }

  /**
   * Buscar registro por campo específico
   */
  async findBy(table, field, value) {
    const query = `SELECT * FROM ${table} WHERE ${field} = ?`;
    const results = await database.query(query, [value]);
    return results[0] || null;
  }

  /**
   * Buscar múltiplos registros por campo
   */
  async findManyBy(table, field, value) {
    const query = `SELECT * FROM ${table} WHERE ${field} = ?`;
    return await database.query(query, [value]);
  }

  /**
   * Criar novo registro
   */
  async create(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    await database.execute(query, values);
    
    return await this.findById(table, data.id);
  }

  /**
   * Atualizar registro
   */
  async update(table, id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    await database.execute(query, [...values, id]);
    
    return await this.findById(table, id);
  }

  /**
   * Excluir registro
   */
  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const result = await database.execute(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Contar registros
   */
  async count(table, whereClause = '', params = []) {
    let query = `SELECT COUNT(*) as total FROM ${table}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    
    const results = await database.query(query, params);
    return results[0].total;
  }

  /**
   * Verificar se registro existe
   */
  async exists(table, field, value) {
    const query = `SELECT COUNT(*) as total FROM ${table} WHERE ${field} = ?`;
    const results = await database.query(query, [value]);
    return results[0].total > 0;
  }

  /**
   * Executar query customizada
   */
  async customQuery(query, params = []) {
    return await database.query(query, params);
  }

  /**
   * Executar transação
   */
  async transaction(callback) {
    return await database.transaction(callback);
  }
}

export default new DatabaseService();
