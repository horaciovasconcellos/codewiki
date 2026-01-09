const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Templates para geração de código
const templates = {
  model: (domain, domainCapitalized) => `const Joi = require('joi');

const ${domain}Schema = Joi.object({
  id: Joi.string().optional(),
  nome: Joi.string().required().min(2).max(200),
  descricao: Joi.string().optional().allow('', null),
  status: Joi.string().valid('Ativo', 'Inativo').default('Ativo'),
  created_at: Joi.date().optional(),
  updated_at: Joi.date().optional()
});

const ${domain}UpdateSchema = ${domain}Schema.fork(
  ['nome'],
  (schema) => schema.optional()
);

module.exports = {
  ${domain}Schema,
  ${domain}UpdateSchema
};
`,

  service: (domain, domainCapitalized, tableName) => `const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ${domainCapitalized}Service {
  async getAll() {
    try {
      const results = await db.query(
        \`SELECT * FROM ${tableName} ORDER BY nome ASC\`
      );
      return results;
    } catch (error) {
      console.error('[${domainCapitalized}Service] Erro ao buscar todos:', error);
      throw new Error(\`Erro ao buscar ${domain}: \${error.message}\`);
    }
  }

  async getById(id) {
    try {
      const [result] = await db.query(
        \`SELECT * FROM ${tableName} WHERE id = ?\`,
        [id]
      );

      if (!result) {
        throw new Error(\`${domainCapitalized} não encontrado(a)\`);
      }

      return result;
    } catch (error) {
      console.error(\`[${domainCapitalized}Service] Erro ao buscar ID \${id}:\`, error);
      throw error;
    }
  }

  async create(data) {
    try {
      const id = data.id || uuidv4();
      
      await db.query(
        \`INSERT INTO ${tableName} (id, nome, descricao, status, created_at)
         VALUES (?, ?, ?, ?, NOW())\`,
        [id, data.nome, data.descricao || null, data.status || 'Ativo']
      );

      return await this.getById(id);
    } catch (error) {
      console.error('[${domainCapitalized}Service] Erro ao criar:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Já existe um registro com este nome');
      }
      throw new Error(\`Erro ao criar ${domain}: \${error.message}\`);
    }
  }

  async update(id, data) {
    try {
      await this.getById(id);

      const fields = [];
      const values = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id' && key !== 'created_at') {
          fields.push(\`\${key} = ?\`);
          values.push(value);
        }
      });

      if (fields.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      await db.query(
        \`UPDATE ${tableName} SET \${fields.join(', ')} WHERE id = ?\`,
        values
      );

      return await this.getById(id);
    } catch (error) {
      console.error(\`[${domainCapitalized}Service] Erro ao atualizar ID \${id}:\`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      await this.getById(id);

      await db.query(\`DELETE FROM ${tableName} WHERE id = ?\`, [id]);

      console.log(\`[${domainCapitalized}Service] Registro \${id} excluído com sucesso\`);
    } catch (error) {
      console.error(\`[${domainCapitalized}Service] Erro ao excluir ID \${id}:\`, error);
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new Error('Não é possível excluir: existem registros relacionados');
      }
      throw error;
    }
  }

  async search(searchTerm) {
    try {
      const term = \`%\${searchTerm}%\`;
      const results = await db.query(
        \`SELECT * FROM ${tableName} 
         WHERE nome LIKE ? OR descricao LIKE ? 
         ORDER BY nome ASC\`,
        [term, term]
      );
      return results;
    } catch (error) {
      console.error('[${domainCapitalized}Service] Erro na busca:', error);
      throw new Error(\`Erro ao buscar ${domain}: \${error.message}\`);
    }
  }

  async count() {
    try {
      const [result] = await db.query(\`SELECT COUNT(*) as total FROM ${tableName}\`);
      return result.total;
    } catch (error) {
      console.error('[${domainCapitalized}Service] Erro ao contar:', error);
      throw new Error(\`Erro ao contar ${domain}: \${error.message}\`);
    }
  }

  async getStats() {
    try {
      const [stats] = await db.query(\`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as ativos,
          COUNT(CASE WHEN status = 'Inativo' THEN 1 END) as inativos
        FROM ${tableName}
      \`);

      return stats;
    } catch (error) {
      console.error('[${domainCapitalized}Service] Erro ao obter estatísticas:', error);
      throw new Error(\`Erro ao obter estatísticas: \${error.message}\`);
    }
  }
}

module.exports = new ${domainCapitalized}Service();
`,

  controller: (domain, domainCapitalized) => `const ${domain}Service = require('../services/${domain}.service');
const ApiResponse = require('../utils/response');
const { ${domain}Schema, ${domain}UpdateSchema } = require('../models/${domain}.model');

class ${domainCapitalized}Controller {
  async getAll(req, res, next) {
    try {
      const data = await ${domain}Service.getAll();
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await ${domain}Service.getById(req.params.id);
      return ApiResponse.success(res, data);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return ApiResponse.notFound(res, error.message);
      }
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { error, value } = ${domain}Schema.validate(req.body);
      if (error) {
        return ApiResponse.badRequest(
          res, 
          'Dados inválidos', 
          error.details.map(d => ({ field: d.path[0], message: d.message }))
        );
      }

      const data = await ${domain}Service.create(value);
      return ApiResponse.created(res, data, 'Criado com sucesso');
    } catch (error) {
      if (error.message.includes('Já existe')) {
        return ApiResponse.conflict(res, error.message);
      }
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { error, value } = ${domain}UpdateSchema.validate(req.body);
      if (error) {
        return ApiResponse.badRequest(
          res,
          'Dados inválidos',
          error.details.map(d => ({ field: d.path[0], message: d.message }))
        );
      }

      const data = await ${domain}Service.update(req.params.id, value);
      return ApiResponse.success(res, data, 'Atualizado com sucesso');
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return ApiResponse.notFound(res, error.message);
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await ${domain}Service.delete(req.params.id);
      return ApiResponse.noContent(res);
    } catch (error) {
      if (error.message.includes('não encontrado')) {
        return ApiResponse.notFound(res, error.message);
      }
      if (error.message.includes('registros relacionados')) {
        return ApiResponse.conflict(res, error.message);
      }
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return ApiResponse.badRequest(res, 'Parâmetro de busca obrigatório');
      }

      const data = await ${domain}Service.search(q);
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await ${domain}Service.getStats();
      return ApiResponse.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ${domainCapitalized}Controller();
`,

  routes: (domain) => `const express = require('express');
const router = express.Router();
const ${domain}Controller = require('../controllers/${domain}.controller');

/**
 * @swagger
 * /api/${domain}:
 *   get:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Listar todos
 *     responses:
 *       200:
 *         description: Lista de registros
 */
router.get('/', ${domain}Controller.getAll);

/**
 * @swagger
 * /api/${domain}/stats:
 *   get:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Obter estatísticas
 *     responses:
 *       200:
 *         description: Estatísticas dos registros
 */
router.get('/stats', ${domain}Controller.getStats);

/**
 * @swagger
 * /api/${domain}/search:
 *   get:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Buscar registros
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 */
router.get('/search', ${domain}Controller.search);

/**
 * @swagger
 * /api/${domain}/{id}:
 *   get:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Buscar por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro encontrado
 *       404:
 *         description: Não encontrado
 */
router.get('/:id', ${domain}Controller.getById);

/**
 * @swagger
 * /api/${domain}:
 *   post:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Criar novo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Criado com sucesso
 */
router.post('/', ${domain}Controller.create);

/**
 * @swagger
 * /api/${domain}/{id}:
 *   put:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Atualizar registro
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Atualizado com sucesso
 */
router.put('/:id', ${domain}Controller.update);

/**
 * @swagger
 * /api/${domain}/{id}:
 *   delete:
 *     tags: [${domain.charAt(0).toUpperCase() + domain.slice(1)}]
 *     summary: Excluir registro
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Excluído com sucesso
 */
router.delete('/:id', ${domain}Controller.delete);

module.exports = router;
`,

  test: (domain, domainCapitalized) => `const ${domain}Service = require('../../../services/${domain}.service');
const db = require('../../../config/database');

jest.mock('../../../config/database');

describe('${domainCapitalized}Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('deve retornar lista de registros', async () => {
      const mockData = [
        { id: '1', nome: 'Teste 1', status: 'Ativo' },
        { id: '2', nome: 'Teste 2', status: 'Ativo' }
      ];
      
      db.query.mockResolvedValue(mockData);

      const result = await ${domain}Service.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].nome).toBe('Teste 1');
    });
  });

  describe('getById', () => {
    it('deve retornar registro por ID', async () => {
      const mockData = { id: '1', nome: 'Teste', status: 'Ativo' };
      
      db.query.mockResolvedValue([mockData]);

      const result = await ${domain}Service.getById('1');

      expect(result).toEqual(mockData);
    });

    it('deve lançar erro se não encontrar', async () => {
      db.query.mockResolvedValue([]);

      await expect(${domain}Service.getById('999'))
        .rejects
        .toThrow('não encontrado');
    });
  });

  describe('create', () => {
    it('deve criar novo registro', async () => {
      const newData = {
        nome: 'Novo Teste',
        descricao: 'Descrição teste',
        status: 'Ativo'
      };

      db.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([{ id: '1', ...newData }]);

      const result = await ${domain}Service.create(newData);

      expect(result).toHaveProperty('id');
      expect(result.nome).toBe(newData.nome);
    });
  });

  describe('update', () => {
    it('deve atualizar registro existente', async () => {
      const updateData = { nome: 'Nome Atualizado' };
      const existing = { id: '1', nome: 'Nome Antigo', status: 'Ativo' };

      db.query
        .mockResolvedValueOnce([existing])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([{ ...existing, ...updateData }]);

      const result = await ${domain}Service.update('1', updateData);

      expect(result.nome).toBe(updateData.nome);
    });
  });

  describe('delete', () => {
    it('deve excluir registro', async () => {
      const existing = { id: '1', nome: 'Teste' };

      db.query
        .mockResolvedValueOnce([existing])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      await expect(${domain}Service.delete('1')).resolves.not.toThrow();
    });
  });
});
`
};

function createDirectories() {
  const dirs = [
    'server/src/models',
    'server/src/services',
    'server/src/controllers',
    'server/src/routes',
    'server/src/tests/unit/services'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Criado: ${dir}`);
    }
  });
}

function generateFiles(domain, tableName) {
  const domainCapitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
  
  const files = [
    { path: `server/src/models/${domain}.model.js`, content: templates.model(domain, domainCapitalized) },
    { path: `server/src/services/${domain}.service.js`, content: templates.service(domain, domainCapitalized, tableName) },
    { path: `server/src/controllers/${domain}.controller.js`, content: templates.controller(domain, domainCapitalized) },
    { path: `server/src/routes/${domain}.routes.js`, content: templates.routes(domain) },
    { path: `server/src/tests/unit/services/${domain}.service.test.js`, content: templates.test(domain, domainCapitalized) }
  ];

  files.forEach(file => {
    fs.writeFileSync(file.path, file.content);
    console.log(`✅ Criado: ${file.path}`);
  });
}

function updateRoutesIndex(domain) {
  const indexPath = 'server/src/routes/index.js';
  
  if (!fs.existsSync(indexPath)) {
    const initialContent = `const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
`;
    fs.writeFileSync(indexPath, initialContent);
  }

  let content = fs.readFileSync(indexPath, 'utf8');

  const importLine = `const ${domain}Routes = require('./${domain}.routes');\n`;
  if (!content.includes(importLine)) {
    const routerIndex = content.indexOf('const router');
    content = content.slice(0, routerIndex) + importLine + content.slice(routerIndex);
  }

  const useLine = `router.use('/${domain}', ${domain}Routes);\n`;
  if (!content.includes(useLine)) {
    const exportIndex = content.indexOf('module.exports');
    content = content.slice(0, exportIndex) + useLine + '\n' + content.slice(exportIndex);
  }

  fs.writeFileSync(indexPath, content);
  console.log(`✅ Atualizado: ${indexPath}`);
}

async function main() {
  console.log('🚀 SCRIPT DE MIGRAÇÃO AUTOMATIZADA\n');

  rl.question('Digite o nome do domínio (ex: colaboradores): ', (domain) => {
    if (!domain || domain.trim().length === 0) {
      console.error('❌ Nome do domínio inválido');
      rl.close();
      return;
    }

    domain = domain.trim().toLowerCase();

    rl.question(`Digite o nome da tabela no banco (padrão: ${domain}): `, (tableName) => {
      tableName = tableName.trim() || domain;

      console.log('\n📦 Gerando arquivos...\n');
      
      createDirectories();
      generateFiles(domain, tableName);
      updateRoutesIndex(domain);

      console.log('\n✅ MIGRAÇÃO CONCLUÍDA!\n');
      console.log('📋 Próximos passos:');
      console.log(`1. Revisar arquivos gerados em server/src/`);
      console.log(`2. Ajustar modelo em server/src/models/${domain}.model.js`);
      console.log(`3. Testar endpoints: npm run dev`);
      console.log(`4. Executar testes: npm test\n`);

      rl.close();
    });
  });
}

main();
