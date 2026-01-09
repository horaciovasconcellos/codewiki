import Joi from 'joi';

/**
 * Schema de validação para User
 */
export const userSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  nome: Joi.string().min(3).max(100).required()
    .messages({
      'string.min': 'Nome deve ter no mínimo 3 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  email: Joi.string().email().max(255).required()
    .messages({
      'string.email': 'Email inválido',
      'any.required': 'Email é obrigatório'
    }),
  senha: Joi.string().min(8).max(100).optional()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .messages({
      'string.min': 'Senha deve ter no mínimo 8 caracteres',
      'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    }),
  role: Joi.string().valid('admin', 'user', 'viewer').default('user'),
  ativo: Joi.boolean().default(true),
  ultimoAcesso: Joi.date().optional().allow(null),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional().allow(null)
});

/**
 * Schema para registro de novo usuário
 */
export const registerSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().max(255).required(),
  senha: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .messages({
      'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    }),
  role: Joi.string().valid('admin', 'user', 'viewer').default('user')
});

/**
 * Schema para login
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required()
});

/**
 * Schema para alterar senha
 */
export const changePasswordSchema = Joi.object({
  senhaAtual: Joi.string().required(),
  senhaNova: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .messages({
      'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    })
});

/**
 * Schema para solicitar reset de senha
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

/**
 * Schema para resetar senha
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  senhaNova: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .messages({
      'string.pattern.base': 'Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais'
    })
});

export default {
  userSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
