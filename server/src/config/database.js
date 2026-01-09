import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

class Database {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'auditoria_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };
  }

  async initialize() {
    try {
      this.pool = mysql.createPool(this.config);
      
      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✅ Conexão com MySQL estabelecida com sucesso');
      console.log(`📊 Database: ${this.config.database}`);
      console.log(`🔌 Host: ${this.config.host}:${this.config.port}`);
      connection.release();
      
      return this.pool;
    } catch (error) {
      console.error('❌ Erro ao conectar ao MySQL:', error.message);
      throw error;
    }
  }

  async query(sql, params) {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    try {
      const [results] = await this.pool.query(sql, params);
      return results;
    } catch (error) {
      console.error('❌ Erro na query:', error.message);
      console.error('SQL:', sql);
      throw error;
    }
  }

  async execute(sql, params) {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    
    try {
      const [results] = await this.pool.execute(sql, params);
      return results;
    } catch (error) {
      console.error('❌ Erro no execute:', error.message);
      console.error('SQL:', sql);
      throw error;
    }
  }

  async transaction(callback) {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }

    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      console.error('❌ Transaction rollback:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Conexão com MySQL encerrada');
    }
  }

  getPool() {
    return this.pool;
  }
}

// Export singleton instance
const database = new Database();
export default database;
