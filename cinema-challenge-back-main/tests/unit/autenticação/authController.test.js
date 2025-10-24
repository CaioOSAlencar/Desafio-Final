// Testes unitários para authController
// Baseados no Plano de Teste de Autenticação

const { User } = require('../../../src/models');
const authController = require('../../../src/controllers/authController');
const generateToken = require('../../../src/utils/generateToken');
const { 
  mockUsers, 
  hashPassword, 
  validateUserResponse,
  validateJWTToken 
} = require('../../helpers/testHelpers');

// Mock das dependências
jest.mock('../../../src/utils/generateToken');

describe('AuthController - Testes Unitários', () => {
  
  beforeEach(() => {
    // Reset de todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('register', () => {
    
    // TC01: Registrar usuário com dados válidos
    it('TC01 - Deve registrar usuário com dados válidos', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const mockToken = 'mock.jwt.token';
      const mockUser = {
        _id: 'mock-user-id',
        ...userData,
        role: 'user'
      };

      User.findOne = jest.fn().mockResolvedValue(null); // Usuário não existe
      User.create = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      const req = { body: userData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
        name: userData.name,
        email: userData.email,
        password: userData.password
      }));
      expect(generateToken).toHaveBeenCalledWith(mockUser._id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          token: mockToken
        }
      });
    });

    // TC02: Registrar usuário com email duplicado
    it('TC02 - Deve rejeitar registro com email duplicado', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const existingUser = { _id: 'existing-id', ...userData };

      User.findOne = jest.fn().mockResolvedValue(existingUser);

      const req = { body: userData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists'
      });
    });

    // TC03: Falha na criação do usuário
    it('TC03 - Deve tratar erro na criação do usuário', async () => {
      // Arrange
      const userData = mockUsers.validUser;

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(null); // Falha na criação

      const req = { body: userData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid user data'
      });
    });
  });

  describe('login', () => {
    
    // TC05: Login com credenciais válidas
    it('TC05 - Deve fazer login com credenciais válidas', async () => {
      // Arrange
      const loginData = {
        email: mockUsers.validUser.email,
        password: mockUsers.validUser.password
      };
      const mockToken = 'mock.jwt.token';
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser,
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      generateToken.mockReturnValue(mockToken);

      const req = { body: loginData };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.login(req, res, next);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.matchPassword).toHaveBeenCalledWith(loginData.password);
      expect(generateToken).toHaveBeenCalledWith(mockUser._id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          token: mockToken
        }
      });
    });

    // TC06: Login com senha incorreta
    it('TC06 - Deve rejeitar login com senha incorreta', async () => {
      // Arrange
      const loginData = {
        email: mockUsers.validUser.email,
        password: 'senha-errada'
      };
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser,
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const req = { body: loginData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.login(req, res, next);

      // Assert
      expect(mockUser.matchPassword).toHaveBeenCalledWith(loginData.password);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });

    // TC07: Login com email inexistente
    it('TC07 - Deve rejeitar login com email inexistente', async () => {
      // Arrange
      const loginData = {
        email: 'inexistente@exemplo.com',
        password: 'qualquer123'
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const req = { body: loginData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.login(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password'
      });
    });
  });

  describe('getProfile', () => {
    
    // TC08: Obter perfil com usuário válido
    it('TC08 - Deve retornar perfil do usuário autenticado', async () => {
      // Arrange
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const req = { user: { _id: mockUser._id } };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.getProfile(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role
        }
      });
    });

    // TC09: Usuário não encontrado
    it('TC09 - Deve retornar erro quando usuário não encontrado', async () => {
      // Arrange
      User.findById = jest.fn().mockResolvedValue(null);

      const req = { user: { _id: 'non-existent-id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.getProfile(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });
  });

  describe('updateProfile', () => {
    
    // TC10: Atualizar perfil com dados válidos
    it('TC10 - Deve atualizar perfil com dados válidos', async () => {
      // Arrange
      const updateData = { name: 'João Silva Novo' };
      const mockToken = 'new.jwt.token';
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser,
        save: jest.fn().mockResolvedValue({
          _id: 'mock-user-id',
          name: updateData.name,
          email: mockUsers.validUser.email,
          role: 'user'
        })
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      const req = { 
        user: { _id: mockUser._id },
        body: updateData 
      };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.updateProfile(req, res, next);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(mockUser._id);
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.name).toBe(updateData.name);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          _id: mockUser._id,
          name: updateData.name,
          email: mockUser.email,
          role: mockUser.role,
          token: mockToken
        }
      });
    });

    // TC11: Alterar senha com senha atual correta
    it('TC11 - Deve alterar senha com senha atual correta', async () => {
      // Arrange
      const passwordData = {
        currentPassword: '123456',
        newPassword: 'novasenha123'
      };
      const mockToken = 'new.jwt.token';
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser,
        matchPassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue({
          _id: 'mock-user-id',
          name: mockUsers.validUser.name,
          email: mockUsers.validUser.email,
          role: 'user'
        })
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      const req = { 
        user: { _id: mockUser._id },
        body: passwordData 
      };
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.updateProfile(req, res, next);

      // Assert
      expect(mockUser.matchPassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockUser.password).toBe(passwordData.newPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: expect.objectContaining({
          token: mockToken
        })
      });
    });

    // TC12: Alterar senha com senha atual incorreta
    it('TC12 - Deve rejeitar alteração com senha atual incorreta', async () => {
      // Arrange
      const passwordData = {
        currentPassword: 'senha-errada',
        newPassword: 'novasenha123'
      };
      const mockUser = {
        _id: 'mock-user-id',
        ...mockUsers.validUser,
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const req = { 
        user: { _id: mockUser._id },
        body: passwordData 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.updateProfile(req, res, next);

      // Assert
      expect(mockUser.matchPassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Senha atual incorreta'
      });
    });
  });

  describe('Error Handling', () => {
    
    it('Deve chamar next com erro em caso de exceção', async () => {
      // Arrange
      const error = new Error('Database error');
      User.findOne = jest.fn().mockRejectedValue(error);

      const req = { body: mockUsers.validUser };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Act
      await authController.register(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});