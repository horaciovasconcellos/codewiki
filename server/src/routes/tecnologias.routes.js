import express from 'express';
import tecnologiasController from '../controllers/tecnologias.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validation.js';
import { createTecnologiaSchema, updateTecnologiaSchema } from '../models/tecnologia.model.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tecnologias
 *   description: Gestão de tecnologias
 */

/**
 * @swagger
 * /api/tecnologias:
 *   get:
 *     summary: Listar todas as tecnologias
 *     tags: [Tecnologias]
 *     responses:
 *       200:
 *         description: Lista de tecnologias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tecnologia'
 */
router.get('/', tecnologiasController.getAll);

/**
 * @swagger
 * /api/tecnologias/stats:
 *   get:
 *     summary: Obter estatísticas de tecnologias
 *     tags: [Tecnologias]
 *     responses:
 *       200:
 *         description: Estatísticas das tecnologias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     porCategoria:
 *                       type: array
 *                     porStatus:
 *                       type: array
 */
router.get('/stats', tecnologiasController.getStats);

/**
 * @swagger
 * /api/tecnologias/search:
 *   get:
 *     summary: Buscar tecnologias por termo
 *     tags: [Tecnologias]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tecnologia'
 *       400:
 *         description: Parâmetro de busca obrigatório
 */
router.get('/search', tecnologiasController.search);

/**
 * @swagger
 * /api/tecnologias/{id}:
 *   get:
 *     summary: Buscar tecnologia por ID
 *     tags: [Tecnologias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tecnologia encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Tecnologia'
 *       404:
 *         description: Tecnologia não encontrada
 */
router.get('/:id', tecnologiasController.getById);

/**
 * @swagger
 * /api/tecnologias:
 *   post:
 *     summary: Criar nova tecnologia
 *     tags: [Tecnologias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sigla
 *               - nome
 *             properties:
 *               sigla:
 *                 type: string
 *                 example: REACT
 *               nome:
 *                 type: string
 *                 example: React.js
 *               versaoRelease:
 *                 type: string
 *                 example: "18.2.0"
 *               categoria:
 *                 type: string
 *                 example: Framework
 *               status:
 *                 type: string
 *                 example: Ativa
 *               fornecedorFabricante:
 *                 type: string
 *                 example: Meta
 *               tipoLicenciamento:
 *                 type: string
 *                 example: MIT
 *               maturidadeInterna:
 *                 type: string
 *                 example: Alta
 *               nivelSuporteInterno:
 *                 type: string
 *                 example: Nivel 3
 *               ambienteDev:
 *                 type: boolean
 *               ambienteQa:
 *                 type: boolean
 *               ambienteProd:
 *                 type: boolean
 *               ambienteCloud:
 *                 type: boolean
 *               ambienteOnPremise:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tecnologia criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tecnologia'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       409:
 *         description: Sigla já cadastrada
 */
router.post('/', authenticate, authorize('admin', 'user'), validate(createTecnologiaSchema), tecnologiasController.create);

/**
 * @swagger
 * /api/tecnologias/{id}:
 *   put:
 *     summary: Atualizar tecnologia
 *     tags: [Tecnologias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sigla:
 *                 type: string
 *               nome:
 *                 type: string
 *               versaoRelease:
 *                 type: string
 *               categoria:
 *                 type: string
 *               status:
 *                 type: string
 *               fornecedorFabricante:
 *                 type: string
 *               tipoLicenciamento:
 *                 type: string
 *               maturidadeInterna:
 *                 type: string
 *               nivelSuporteInterno:
 *                 type: string
 *               ambienteDev:
 *                 type: boolean
 *               ambienteQa:
 *                 type: boolean
 *               ambienteProd:
 *                 type: boolean
 *               ambienteCloud:
 *                 type: boolean
 *               ambienteOnPremise:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tecnologia atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Tecnologia'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Tecnologia não encontrada
 *       409:
 *         description: Sigla já cadastrada
 */
router.put('/:id', authenticate, authorize('admin', 'user'), validate(updateTecnologiaSchema), tecnologiasController.update);

/**
 * @swagger
 * /api/tecnologias/{id}:
 *   delete:
 *     summary: Excluir tecnologia
 *     tags: [Tecnologias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tecnologia excluída com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (apenas admin)
 *       404:
 *         description: Tecnologia não encontrada
 *       409:
 *         description: Existem registros relacionados
 */
router.delete('/:id', authenticate, authorize('admin'), tecnologiasController.delete);

export default router;
