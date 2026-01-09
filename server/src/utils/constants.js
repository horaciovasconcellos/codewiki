// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

// Technology Status
export const TECH_STATUS = {
  ACTIVE: 'Ativa',
  DISCONTINUED: 'Descontinuada',
  IN_EVALUATION: 'Em Avaliação'
};

// Technology Categories
export const TECH_CATEGORIES = {
  LANGUAGE: 'Linguagem',
  FRAMEWORK: 'Framework',
  DATABASE: 'Banco de Dados',
  TOOL: 'Ferramenta',
  CLOUD: 'Cloud',
  OTHER: 'Outro'
};

// Error Codes
export const ERROR_CODES = {
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  MISSING_FIELDS: 'MISSING_FIELDS'
};

export default {
  HTTP_STATUS,
  USER_ROLES,
  TECH_STATUS,
  TECH_CATEGORIES,
  ERROR_CODES
};
