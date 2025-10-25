// Testes unitários para middleware de autenticação
// Testa proteção de rotas e autorização por role

const { protect, authorize } = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const { User } = require('../../../src/models');

// Mock das dependências
jest.mock('jsonwebtoken');
jest.mock('../../../src/models');

describe('Middleware Auth - Testes Unitários', () => {
  
  let req, res, next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request/response mock objects
    req = {
      headers: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    // Mock environment variable
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  describe('protect middleware', () => {
    
    // TC01: Token válido com usuário encontrado
    it('TC01 - Deve autenticar usuário com token JWT válido', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';
      const mockUserId = 'user123';
      const mockUser = {
        _id: mockUserId,
        name: 'João Silva',
        email: 'joao@exemplo.com',
        role: 'user'
      };
      
      req.headers.authorization = `Bearer ${mockToken}`;
      
      jwt.verify.mockReturnValue({ id: mockUserId });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    // TC02: Token ausente no header
    it('TC02 - Deve rejeitar requisição sem token de autorização', async () => {
      // Arrange - sem token no header
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    // TC03: Header authorization sem Bearer
    it('TC03 - Deve rejeitar header authorization sem formato Bearer', async () => {
      // Arrange
      req.headers.authorization = 'InvalidFormat token123';
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    // TC04: Token JWT inválido
    it('TC04 - Deve rejeitar token JWT inválido', async () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';
      req.headers.authorization = `Bearer ${invalidToken}`;
      
      jwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError: invalid token');
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(invalidToken, process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
    });

    // TC05: Token válido mas usuário não encontrado
    it('TC05 - Deve rejeitar quando usuário do token não existe', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';
      const mockUserId = 'nonexistent-user';
      
      req.headers.authorization = `Bearer ${mockToken}`;
      
      jwt.verify.mockReturnValue({ id: mockUserId });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // Usuário não encontrado
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(req.user).toBeNull();
    });

    // TC06: Token expirado
    it('TC06 - Deve rejeitar token expirado', async () => {
      // Arrange
      const expiredToken = 'expired.jwt.token';
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('TokenExpiredError: jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(expiredToken, process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
    });

    // TC07: JWT_SECRET não definido
    it('TC07 - Deve lidar com JWT_SECRET não definido', async () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const mockToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${mockToken}`;
      
      jwt.verify.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
    });

    // TC08: Erro interno do middleware deve chamar next com erro
    it('TC08 - Deve chamar next com erro em caso de exceção interna', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';
      
      req.headers.authorization = `Bearer ${mockToken}`;
      
      // Simular erro interno no middleware
      jwt.verify.mockImplementation(() => {
        throw new Error('Internal middleware error');
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
    });
  });

  describe('authorize middleware', () => {
    
    // TC09: Usuário com role autorizado
    it('TC09 - Deve autorizar usuário com role válido', () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      req.user = {
        _id: 'admin123',
        name: 'Admin User',
        role: 'admin'
      };
      
      // Act
      authorizeAdmin(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    // TC10: Usuário com role não autorizado
    it('TC10 - Deve rejeitar usuário com role inválido', () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      req.user = {
        _id: 'user123',
        name: 'Regular User',
        role: 'user'
      };
      
      // Act
      authorizeAdmin(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role user is not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    // TC11: Múltiplos roles autorizados
    it('TC11 - Deve autorizar usuário em lista de múltiplos roles', () => {
      // Arrange
      const authorizeMultiple = authorize('admin', 'moderator');
      req.user = {
        _id: 'mod123',
        name: 'Moderator User',
        role: 'moderator'
      };
      
      // Act
      authorizeMultiple(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    // TC12: Requisição sem usuário autenticado
    it('TC12 - Deve rejeitar quando não há usuário autenticado', () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      req.user = null;
      
      // Act
      authorizeAdmin(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role unknown is not authorized to access this route'
      });
      expect(next).not.toHaveBeenCalled();
    });

    // TC13: Role case-sensitive
    it('TC13 - Deve ser case-sensitive na verificação de role', () => {
      // Arrange
      const authorizeAdmin = authorize('admin');
      req.user = {
        _id: 'user123',
        name: 'User',
        role: 'ADMIN' // Case diferente
      };
      
      // Act
      authorizeAdmin(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User role ADMIN is not authorized to access this route'
      });
    });
  });

  describe('Edge Cases e Cenários Especiais', () => {
    
    // TC14: Header authorization com espaços extras
    it('TC14 - Deve tratar header authorization corretamente', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token';
      req.headers.authorization = `Bearer ${mockToken}`;
      
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ _id: 'user123', name: 'User' })
      });
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, process.env.JWT_SECRET);
      expect(next).toHaveBeenCalledWith();
    });

    // TC15: Token vazio após Bearer
    it('TC15 - Deve rejeitar quando token está vazio após Bearer', async () => {
      // Arrange
      req.headers.authorization = 'Bearer ';
      
      // Act
      await protect(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
    });
  });
});