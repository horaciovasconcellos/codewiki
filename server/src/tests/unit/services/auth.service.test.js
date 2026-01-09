import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authService from '../../../services/auth.service.js';
import dbService from '../../../services/database.service.js';
import authConfig from '../../../config/auth.js';

// Mock dependencies
jest.mock('../../../services/database.service.js');
jest.mock('../../../config/database.js', () => ({
  default: {
    query: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        nome: 'Test User',
        email: 'test@example.com',
        senha: 'Test@123',
        role: 'user'
      };

      dbService.findBy.mockResolvedValue(null);
      dbService.create.mockResolvedValue(undefined);

      const result = await authService.register(userData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', userData.nome);
      expect(result).toHaveProperty('email', userData.email);
      expect(result).not.toHaveProperty('senha');
      expect(dbService.findBy).toHaveBeenCalledWith('users', 'email', userData.email);
      expect(dbService.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        nome: 'Test User',
        email: 'existing@example.com',
        senha: 'Test@123'
      };

      dbService.findBy.mockResolvedValue({ id: '123', email: userData.email });

      await expect(authService.register(userData)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Email já cadastrado'
      });
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        role: 'user'
      };

      const token = authService.generateAccessToken(user);

      expect(token).toBeTruthy();
      
      const decoded = jwt.verify(token, authConfig.jwt.secret);
      expect(decoded).toHaveProperty('id', user.id);
      expect(decoded).toHaveProperty('email', user.email);
      expect(decoded).toHaveProperty('role', user.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        role: 'user'
      };

      const token = authService.generateAccessToken(user);
      const decoded = authService.verifyToken(token);

      expect(decoded).toHaveProperty('id', user.id);
      expect(decoded).toHaveProperty('email', user.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => authService.verifyToken(invalidToken)).toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const userId = '123';
      const senhaAtual = 'OldPass@123';
      const senhaNova = 'NewPass@123';
      const hashedOldPassword = await bcrypt.hash(senhaAtual, 10);

      const user = {
        id: userId,
        senha: hashedOldPassword
      };

      dbService.findById.mockResolvedValue(user);
      
      // Mock database execute
      const database = await import('../../../config/database.js');
      database.default.execute.mockResolvedValue([]);

      const result = await authService.changePassword(userId, senhaAtual, senhaNova);

      expect(result).toBe(true);
      expect(dbService.findById).toHaveBeenCalledWith('users', userId);
    });

    it('should throw error if current password is incorrect', async () => {
      const userId = '123';
      const senhaAtual = 'WrongPass@123';
      const senhaNova = 'NewPass@123';
      const hashedPassword = await bcrypt.hash('CorrectPass@123', 10);

      const user = {
        id: userId,
        senha: hashedPassword
      };

      dbService.findById.mockResolvedValue(user);

      await expect(
        authService.changePassword(userId, senhaAtual, senhaNova)
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Senha atual incorreta'
      });
    });
  });
});
