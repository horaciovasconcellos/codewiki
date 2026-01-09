import dotenv from 'dotenv';

dotenv.config();

const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'codewiki-secret-key-2024-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  bcrypt: {
    rounds: 10
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
};

export default authConfig;
