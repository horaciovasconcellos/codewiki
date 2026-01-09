import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CodeWiki API',
      version: '2.0.0',
      description: 'API para Sistema de Gestão e Auditoria de Tecnologias',
      contact: {
        name: 'Equipe CodeWiki',
        email: 'suporte@codewiki.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Desenvolvimento'
      },
      {
        url: 'http://localhost:3000',
        description: 'Desenvolvimento (porta alternativa)'
      },
      {
        url: 'https://api.codewiki.com',
        description: 'Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtido através do endpoint /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Erro ao processar requisição'
            },
            error: {
              type: 'string',
              example: 'Detalhes do erro'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            },
            data: {
              type: 'object'
            }
          }
        },
        Tecnologia: {
          type: 'object',
          required: ['sigla', 'nome'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            sigla: {
              type: 'string',
              example: 'REACT',
              description: 'Sigla da tecnologia'
            },
            nome: {
              type: 'string',
              example: 'React.js',
              description: 'Nome completo da tecnologia'
            },
            versaoRelease: {
              type: 'string',
              example: '18.2.0',
              nullable: true
            },
            categoria: {
              type: 'string',
              example: 'Framework',
              nullable: true
            },
            status: {
              type: 'string',
              example: 'Ativa',
              nullable: true
            },
            fornecedorFabricante: {
              type: 'string',
              example: 'Meta',
              nullable: true
            },
            tipoLicenciamento: {
              type: 'string',
              example: 'MIT',
              nullable: true
            },
            maturidadeInterna: {
              type: 'string',
              example: 'Alta',
              nullable: true
            },
            nivelSuporteInterno: {
              type: 'string',
              example: 'Nivel 3',
              nullable: true
            },
            ambienteDev: {
              type: 'boolean',
              example: true
            },
            ambienteQa: {
              type: 'boolean',
              example: true
            },
            ambienteProd: {
              type: 'boolean',
              example: true
            },
            ambienteCloud: {
              type: 'boolean',
              example: false
            },
            ambienteOnPremise: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          required: ['nome', 'email', 'senha'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            nome: {
              type: 'string',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'joao@example.com'
            },
            senha: {
              type: 'string',
              format: 'password',
              example: 'Password@123'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'viewer'],
              default: 'user'
            },
            ativo: {
              type: 'boolean',
              default: true
            },
            ultimoAcesso: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'senha'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@codewiki.com'
            },
            senha: {
              type: 'string',
              format: 'password',
              example: 'Admin@123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login realizado com sucesso'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT access token'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token'
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nome: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: []
  },
  apis: ['./server/src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
