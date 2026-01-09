import ApiResponse from '../utils/response.js';

/**
 * Middleware de validação com Joi
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));
      
      return ApiResponse.validationError(res, errors);
    }

    // Substituir o body/params/query validado
    req[property] = value;
    next();
  };
};

export default validate;
