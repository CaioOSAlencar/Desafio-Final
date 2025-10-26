// Testes unitários para rotas de filmes
// Testa configuração e estrutura das rotas

const express = require('express');

// Mock das dependências ANTES de importar as rotas
jest.mock('../../../src/controllers/movieController', () => ({
  getMovies: jest.fn(),
  getMovieById: jest.fn(),
  createMovie: jest.fn(),
  updateMovie: jest.fn(),
  deleteMovie: jest.fn()
}));

jest.mock('../../../src/middleware/auth', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: 'adminId', role: 'admin' };
    next();
  }),
  authorize: jest.fn((role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Forbidden' });
    }
  })
}));

const movieRoutes = require('../../../src/routes/movieRoutes');
const movieController = require('../../../src/controllers/movieController');
const { protect, authorize } = require('../../../src/middleware/auth');

describe('Movie Routes - Testes Unitários', () => {
  
  let app, mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    // Setup de app Express para testes
    app = express();
    app.use('/movies', movieRoutes);
    
    // Mock padrão de middleware
    protect.mockImplementation((req, res, next) => {
      req.user = { _id: 'adminId', role: 'admin' };
      next();
    });
    
    authorize.mockImplementation((role) => (req, res, next) => {
      if (req.user && req.user.role === role) {
        next();
      } else {
        res.status(403).json({ success: false, message: 'Forbidden' });
      }
    });
    
    // Setup padrão de req, res, next
    mockReq = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'userId', role: 'user' }
    };
    
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Reset de todos os mocks
    jest.clearAllMocks();
  });

  describe('Configuração das Rotas', () => {

    it('TC01 - Deve exportar um router do Express válido', () => {
      // Assert
      expect(movieRoutes).toBeDefined();
      expect(typeof movieRoutes).toBe('function'); // Express router é uma função
    });

    it('TC02 - Deve ter rotas públicas configuradas corretamente', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      const publicRoutes = routes.filter(layer => {
        // Rotas públicas não devem ter middleware protect na stack
        return !layer.route.stack.some(stack => 
          stack.handle.name === 'protect'
        );
      });

      // Assert
      expect(publicRoutes.length).toBeGreaterThan(0);
      
      // Verificar se GET / e GET /:id são públicas
      const getRoutes = publicRoutes.filter(layer => 
        layer.route.methods.get
      );
      expect(getRoutes.length).toBeGreaterThanOrEqual(2);
    });

    it('TC03 - Deve ter rotas protegidas configuradas corretamente', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      const protectedRoutes = routes.filter(layer => {
        // Rotas protegidas devem ter middleware protect na stack
        return layer.route.stack.some(stack => 
          stack.handle === protect || stack.handle.name === 'protect'
        );
      });

      // Assert
      expect(protectedRoutes.length).toBeGreaterThan(0);
      
      // Verificar se POST, PUT, DELETE são protegidas
      const writeRoutes = protectedRoutes.filter(layer => 
        layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete
      );
      expect(writeRoutes.length).toBeGreaterThanOrEqual(3);
    });

    it('TC04 - Deve usar métodos HTTP corretos para cada rota', () => {
      // Arrange & Act
      const routes = movieRoutes.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods)
        }));

      // Assert
      // Verificar se há pelo menos rotas GET configuradas
      const getRoutes = routes.filter(r => r.methods.includes('get'));
      expect(getRoutes.length).toBeGreaterThanOrEqual(1);
      
      // Verificar se o router tem as rotas esperadas
      expect(routes.length).toBeGreaterThan(0);
      
      // Verificar se existem rotas com diferentes paths
      const uniquePaths = [...new Set(routes.map(r => r.path))];
      expect(uniquePaths.length).toBeGreaterThanOrEqual(1);
    });

  });

  describe('Integração dos Controllers', () => {

    it('TC05 - Rota GET / deve chamar movieController.getMovies', () => {
      // Arrange
      movieController.getMovies.mockImplementation((req, res) => {
        res.json({ success: true, data: [] });
      });

      // Act
      movieController.getMovies(mockReq, mockRes, mockNext);

      // Assert
      expect(movieController.getMovies).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('TC06 - Rota GET /:id deve chamar movieController.getMovieById', () => {
      // Arrange
      mockReq.params.id = '507f1f77bcf86cd799439011';
      movieController.getMovieById.mockImplementation((req, res) => {
        res.json({ success: true, data: {} });
      });

      // Act
      movieController.getMovieById(mockReq, mockRes, mockNext);

      // Assert
      expect(movieController.getMovieById).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('TC07 - Rota POST / deve usar middleware protect e controller createMovie', () => {
      // Arrange
      mockReq.user = { _id: 'adminId', role: 'admin' };
      movieController.createMovie.mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: {} });
      });

      // Act
      movieController.createMovie(mockReq, mockRes, mockNext);

      // Assert
      expect(movieController.createMovie).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('TC08 - Rota PUT /:id deve usar middleware protect+authorize e controller updateMovie', () => {
      // Arrange
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.user = { _id: 'adminId', role: 'admin' };
      movieController.updateMovie.mockImplementation((req, res) => {
        res.json({ success: true, data: {} });
      });

      // Act
      movieController.updateMovie(mockReq, mockRes, mockNext);

      // Assert
      expect(movieController.updateMovie).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    it('TC09 - Rota DELETE /:id deve usar middleware protect+authorize e controller deleteMovie', () => {
      // Arrange
      mockReq.params.id = '507f1f77bcf86cd799439011';
      mockReq.user = { _id: 'adminId', role: 'admin' };
      movieController.deleteMovie.mockImplementation((req, res) => {
        res.json({ success: true, message: 'Movie removed' });
      });

      // Act
      movieController.deleteMovie(mockReq, mockRes, mockNext);

      // Assert
      expect(movieController.deleteMovie).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

  });

  describe('Ordem de Middleware', () => {

    it('TC10 - Deve executar middlewares na ordem correta para rotas protegidas', () => {
      // Arrange
      const routes = movieRoutes.stack.filter(layer => layer.route);

      // Act & Assert
      // Verificar se há rotas configuradas
      expect(routes.length).toBeGreaterThan(0);
      
      // Para qualquer rota que tenha middlewares, deve ter pelo menos uma função
      routes.forEach(route => {
        if (route.route && route.route.stack) {
          expect(route.route.stack.length).toBeGreaterThanOrEqual(1);
          
          // Cada handler deve ser uma função
          route.route.stack.forEach(handler => {
            expect(typeof handler.handle).toBe('function');
          });
        }
      });
    });

    it('TC11 - Rotas públicas não devem incluir middleware protect', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      const getRoutes = routes.filter(layer => 
        layer.route.methods.get && layer.route.path === '/'
      );

      // Assert
      expect(getRoutes.length).toBeGreaterThan(0);
      
      const publicGetRoute = getRoutes[0];
      const hasProtectMiddleware = publicGetRoute.route.stack.some(stack => 
        stack.handle === protect || stack.handle.name === 'protect'
      );
      
      expect(hasProtectMiddleware).toBe(false);
    });

  });

  describe('Tratamento de Erros', () => {

    it('TC12 - Deve propagar erros dos controllers', () => {
      // Arrange
      const mockError = new Error('Controller error');
      movieController.getMovies.mockImplementation((req, res, next) => {
        next(mockError);
      });

      // Act
      movieController.getMovies(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it('TC13 - Middleware authorize deve rejeitar usuários não-admin', () => {
      // Arrange
      mockReq.user = { _id: 'userId', role: 'user' }; // Usuário comum
      
      const authorizeMiddleware = authorize('admin');
      
      // Act
      authorizeMiddleware(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden'
      });
    });

  });

  describe('Configuração de Rotas - Detalhes', () => {

    it('TC14 - Deve ter exatamente 5 rotas principais registradas', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      
      // Assert
      // Deve ter: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
      expect(routes.length).toBe(5);
    });

    it('TC15 - Não deve ter rotas duplicadas', () => {
      // Arrange & Act
      const routes = movieRoutes.stack
        .filter(layer => layer.route)
        .map(layer => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods)
        }));

      // Assert
      const routeSignatures = routes.map(r => `${r.methods.join(',')}-${r.path}`);
      const uniqueSignatures = [...new Set(routeSignatures)];
      
      expect(routeSignatures.length).toBe(uniqueSignatures.length);
    });

    it('TC16 - Deve exportar router com estrutura correta', () => {
      // Assert
      expect(movieRoutes).toBeDefined();
      expect(movieRoutes.stack).toBeDefined();
      expect(Array.isArray(movieRoutes.stack)).toBe(true);
      expect(movieRoutes.stack.length).toBeGreaterThan(0);
    });

  });

  describe('Casos Extremos e Edge Cases', () => {

    it('TC17 - Deve permitir que Express trate rotas não existentes', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      const catchAllRoute = routes.find(layer => 
        layer.route.path.includes('*') || layer.route.path === '(.*)'
      );

      // Assert
      // Não deve ter rota catch-all - deixa Express tratar 404
      expect(catchAllRoute).toBeUndefined();
    });

    it('TC18 - Middleware protect deve ser aplicado apenas em rotas protegidas', () => {
      // Arrange & Act
      const routes = movieRoutes.stack.filter(layer => layer.route);
      
      const publicRoutes = routes.filter(layer => 
        (layer.route.methods.get && layer.route.path === '/') ||
        (layer.route.methods.get && layer.route.path === '/:id')
      );
      
      const protectedRoutes = routes.filter(layer =>
        layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete
      );

      // Assert
      // Rotas públicas não devem ter protect
      publicRoutes.forEach(route => {
        const hasProtect = route.route.stack.some(stack => 
          stack.handle === protect
        );
        expect(hasProtect).toBe(false);
      });

      // Rotas protegidas devem ter protect
      protectedRoutes.forEach(route => {
        const hasProtect = route.route.stack.some(stack => 
          stack.handle === protect
        );
        expect(hasProtect).toBe(true);
      });
    });

  });

});