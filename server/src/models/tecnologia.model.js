import Joi from 'joi';

/**
 * Schema de validação para Tecnologia
 */
export const tecnologiaSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  sigla: Joi.string().min(1).max(50).required()
    .messages({
      'string.min': 'Sigla deve ter no mínimo 1 caractere',
      'string.max': 'Sigla deve ter no máximo 50 caracteres',
      'any.required': 'Sigla é obrigatória'
    }),
  nome: Joi.string().min(2).max(200).required()
    .messages({
      'string.min': 'Nome deve ter no mínimo 2 caracteres',
      'string.max': 'Nome deve ter no máximo 200 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
  versaoRelease: Joi.string().max(50).optional().allow('', null),
  categoria: Joi.string().max(100).optional().allow('', null),
  status: Joi.string().max(50).optional().allow('', null),
  fornecedorFabricante: Joi.string().max(200).optional().allow('', null),
  tipoLicenciamento: Joi.string().max(50).optional().allow('', null),
  dataFimSuporteEos: Joi.date().optional().allow(null),
  maturidadeInterna: Joi.string().max(50).optional().allow('', null),
  nivelSuporteInterno: Joi.string().max(100).optional().allow('', null),
  documentacaoOficial: Joi.string().max(500).optional().allow('', null),
  repositorioInterno: Joi.string().max(500).optional().allow('', null),
  ambienteDev: Joi.boolean().default(false),
  ambienteQa: Joi.boolean().default(false),
  ambienteProd: Joi.boolean().default(false),
  ambienteCloud: Joi.boolean().default(false),
  ambienteOnPremise: Joi.boolean().default(false),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional().allow(null)
});

/**
 * Schema para criar tecnologia (subset)
 */
export const createTecnologiaSchema = Joi.object({
  sigla: Joi.string().min(1).max(50).required(),
  nome: Joi.string().min(2).max(200).required(),
  versaoRelease: Joi.string().max(50).optional().allow('', null),
  categoria: Joi.string().max(100).optional().allow('', null),
  status: Joi.string().max(50).optional().allow('', null),
  fornecedorFabricante: Joi.string().max(200).optional().allow('', null),
  tipoLicenciamento: Joi.string().max(50).optional().allow('', null),
  dataFimSuporteEos: Joi.date().optional().allow(null),
  maturidadeInterna: Joi.string().max(50).optional().allow('', null),
  nivelSuporteInterno: Joi.string().max(100).optional().allow('', null),
  documentacaoOficial: Joi.string().max(500).optional().allow('', null),
  repositorioInterno: Joi.string().max(500).optional().allow('', null),
  ambienteDev: Joi.boolean().default(false),
  ambienteQa: Joi.boolean().default(false),
  ambienteProd: Joi.boolean().default(false),
  ambienteCloud: Joi.boolean().default(false),
  ambienteOnPremise: Joi.boolean().default(false)
});

/**
 * Schema para atualizar tecnologia (todos campos opcionais exceto validação)
 */
export const updateTecnologiaSchema = Joi.object({
  sigla: Joi.string().min(1).max(50).optional(),
  nome: Joi.string().min(2).max(200).optional(),
  versaoRelease: Joi.string().max(50).optional().allow('', null),
  categoria: Joi.string().max(100).optional().allow('', null),
  status: Joi.string().max(50).optional().allow('', null),
  fornecedorFabricante: Joi.string().max(200).optional().allow('', null),
  tipoLicenciamento: Joi.string().max(50).optional().allow('', null),
  dataFimSuporteEos: Joi.date().optional().allow(null),
  maturidadeInterna: Joi.string().max(50).optional().allow('', null),
  nivelSuporteInterno: Joi.string().max(100).optional().allow('', null),
  documentacaoOficial: Joi.string().max(500).optional().allow('', null),
  repositorioInterno: Joi.string().max(500).optional().allow('', null),
  ambienteDev: Joi.boolean().optional(),
  ambienteQa: Joi.boolean().optional(),
  ambienteProd: Joi.boolean().optional(),
  ambienteCloud: Joi.boolean().optional(),
  ambienteOnPremise: Joi.boolean().optional()
}).min(1);

export default {
  tecnologiaSchema,
  createTecnologiaSchema,
  updateTecnologiaSchema
};
