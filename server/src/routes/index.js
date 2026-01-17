import express from 'express';
import authRoutes from './auth.routes.js';
import tecnologiasRoutes from './tecnologias.routes.js';
import usuariosRoutes from './usuarios.routes.js';

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check da API
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: API está funcionando
 */
router.get('/', (req, res) => {
  res.json({
    name: 'CodeWiki API',
    version: '2.0.0',
    status: 'running',
    docs: '/api-docs'
  });
});

// Rotas de autenticação
router.use('/auth', authRoutes);

// Rotas de tecnologias
router.use('/tecnologias', tecnologiasRoutes);

// Rotas de usuários
router.use('/usuarios', usuariosRoutes);

// Adicionar novas rotas aqui conforme forem criadas
// router.use('/colaboradores', colaboradoresRoutes);
// router.use('/aplicacoes', aplicacoesRoutes);
// router.use('/habilidades', habilidadesRoutes);

export default router;
