const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Listar todos os registros LGPD
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar registros LGPD:', error);
    res.status(500).json({ error: 'Erro ao buscar registros LGPD' });
  }
});

// GET - Buscar um registro específico com seus campos
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar registro principal
    const [registros] = await pool.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [id]);

    if (registros.length === 0) {
      return res.status(404).json({ error: 'Registro LGPD não encontrado' });
    }

    // Buscar campos associados
    const [campos] = await pool.query(`
      SELECT 
        id,
        lgpd_id as lgpdId,
        nome_campo as nomeCampo,
        descricao,
        matriz_vendas as vendas,
        matriz_marketing as marketing,
        matriz_financeiro as financeiro,
        matriz_rh as rh,
        matriz_logistica as logistica,
        matriz_assistencia_tecnica as assistenciaTecnica,
        matriz_analytics as analytics,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_campos
      WHERE lgpd_id = ?
      ORDER BY id
    `, [id]);

    // Transformar campos para incluir matriz como objeto
    const camposFormatados = campos.map(campo => ({
      id: campo.id,
      lgpdId: campo.lgpdId,
      nomeCampo: campo.nomeCampo,
      descricao: campo.descricao,
      matrizAnonimizacao: {
        vendas: campo.vendas,
        marketing: campo.marketing,
        financeiro: campo.financeiro,
        rh: campo.rh,
        logistica: campo.logistica,
        assistenciaTecnica: campo.assistenciaTecnica,
        analytics: campo.analytics
      },
      createdAt: campo.createdAt,
      updatedAt: campo.updatedAt
    }));

    const registro = {
      ...registros[0],
      campos: camposFormatados
    };

    res.json(registro);
  } catch (error) {
    console.error('Erro ao buscar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao buscar registro LGPD' });
  }
});

// POST - Criar novo registro LGPD com campos
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      identificacaoDados,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino,
      campos = []
    } = req.body;

    // Inserir registro principal
    const [result] = await connection.query(`
      INSERT INTO lgpd_registros (
        identificacao_dados,
        tipo_dados,
        tecnica_anonimizacao,
        data_inicio,
        data_termino,
        ativo
      ) VALUES (?, ?, ?, ?, ?, true)
    `, [
      identificacaoDados,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio || new Date().toISOString().split('T')[0],
      dataTermino || null
    ]);

    const lgpdId = result.insertId;

    // Inserir campos associados
    if (campos.length > 0) {
      const camposValues = campos.map(campo => [
        lgpdId,
        campo.nomeCampo,
        campo.descricao,
        campo.matrizAnonimizacao.vendas,
        campo.matrizAnonimizacao.marketing,
        campo.matrizAnonimizacao.financeiro,
        campo.matrizAnonimizacao.rh,
        campo.matrizAnonimizacao.logistica,
        campo.matrizAnonimizacao.assistenciaTecnica,
        campo.matrizAnonimizacao.analytics
      ]);

      await connection.query(`
        INSERT INTO lgpd_campos (
          lgpd_id,
          nome_campo,
          descricao,
          matriz_vendas,
          matriz_marketing,
          matriz_financeiro,
          matriz_rh,
          matriz_logistica,
          matriz_assistencia_tecnica,
          matriz_analytics
        ) VALUES ?
      `, [camposValues]);
    }

    await connection.commit();

    // Buscar registro completo criado
    const [registroCriado] = await connection.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [lgpdId]);

    res.status(201).json(registroCriado[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao criar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao criar registro LGPD' });
  } finally {
    connection.release();
  }
});

// PUT - Atualizar registro LGPD
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      identificacaoDados,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino,
      campos = []
    } = req.body;

    // Atualizar registro principal
    await connection.query(`
      UPDATE lgpd_registros
      SET identificacao_dados = ?,
          tipo_dados = ?,
          tecnica_anonimizacao = ?,
          data_inicio = ?,
          data_termino = ?,
          updated_at = NOW()
      WHERE id = ?
    `, [
      identificacaoDados,
      tipoDados,
      tecnicaAnonimizacao,
      dataInicio,
      dataTermino || null,
      id
    ]);

    // Deletar campos existentes
    await connection.query('DELETE FROM lgpd_campos WHERE lgpd_id = ?', [id]);

    // Inserir novos campos
    if (campos.length > 0) {
      const camposValues = campos.map(campo => [
        id,
        campo.nomeCampo,
        campo.descricao,
        campo.matrizAnonimizacao.vendas,
        campo.matrizAnonimizacao.marketing,
        campo.matrizAnonimizacao.financeiro,
        campo.matrizAnonimizacao.rh,
        campo.matrizAnonimizacao.logistica,
        campo.matrizAnonimizacao.assistenciaTecnica,
        campo.matrizAnonimizacao.analytics
      ]);

      await connection.query(`
        INSERT INTO lgpd_campos (
          lgpd_id,
          nome_campo,
          descricao,
          matriz_vendas,
          matriz_marketing,
          matriz_financeiro,
          matriz_rh,
          matriz_logistica,
          matriz_assistencia_tecnica,
          matriz_analytics
        ) VALUES ?
      `, [camposValues]);
    }

    await connection.commit();

    // Buscar registro atualizado
    const [registroAtualizado] = await connection.query(`
      SELECT 
        id,
        identificacao_dados as identificacaoDados,
        tipo_dados as tipoDados,
        tecnica_anonimizacao as tecnicaAnonimizacao,
        data_inicio as dataInicio,
        data_termino as dataTermino,
        ativo,
        created_at as createdAt,
        updated_at as updatedAt
      FROM lgpd_registros
      WHERE id = ?
    `, [id]);

    res.json(registroAtualizado[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao atualizar registro LGPD' });
  } finally {
    connection.release();
  }
});

// DELETE - Excluir registro LGPD (e seus campos em cascata)
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Deletar campos associados
    await connection.query('DELETE FROM lgpd_campos WHERE lgpd_id = ?', [id]);

    // Deletar registro principal
    await connection.query('DELETE FROM lgpd_registros WHERE id = ?', [id]);

    await connection.commit();

    res.json({ message: 'Registro LGPD excluído com sucesso' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir registro LGPD:', error);
    res.status(500).json({ error: 'Erro ao excluir registro LGPD' });
  } finally {
    connection.release();
  }
});

module.exports = router;
