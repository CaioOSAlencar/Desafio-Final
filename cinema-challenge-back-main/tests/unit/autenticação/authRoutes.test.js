// Testes unitários para rotas de autenticação
// Testa configuração e estrutura das rotas

const express = require('express');
const authRoutes = require('../../../src/routes/authRoutes');
const authController = require('../../../src/controllers/authController');
const { protect } = require('../../../src/middleware/auth');

// Mock das dependências
jest.mock('../../../src/controllers/authController');
jest.mock('../../../src/middleware/auth');

describe('Auth Routes - Testes Unitários', () => {
  
  let app, mockReq, mockRes, mockNext;
  
  beforeEach(() => {
    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock objects
    mockReq = {
      body: {},
      headers: {},
      params: {},
      query: {}
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
    
    // Mock controllers para não executar lógica real
    authController.register.mockImplementation((req, res) => {
      res.status(201).json({ success: true });
    });
    
    authController.login.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });
    
    authController.getProfile.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });
    
    authController.updateProfile.mockImplementation((req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Mock middleware protect
    protect.mockImplementation((req, res, next) => {
      next();
    });
  });

  describe('Configuração das Rotas', () => {
    
    // TC01: Verificar se router é uma instância do Express Router
    it('TC01 - Deve exportar um router do Express válido', () => {
      // Assert
      expect(authRoutes).toBeDefined();
      expect(typeof authRoutes).toBe('function');
      expect(authRoutes.stack).toBeDefined(); // Propriedade do Express Router
    });

    // TC02: Verificar rotas públicas (sem middleware)
    it('TC02 - Deve ter rotas públicas configuradas corretamente', () => {
      // Act
      const routes = authRoutes.stack;
      
      // Assert - Encontrar rotas POST /register e /login
      const registerRoute = routes.find(r => 
        r.route && r.route.path === '/register' && r.route.methods.post
      );
      const loginRoute = routes.find(r => 
        r.route && r.route.path === '/login' && r.route.methods.post
      );
      
      expect(registerRoute).toBeDefined();
      expect(loginRoute).toBeDefined();
      
      // Verificar que não tem middleware de autenticação
      expect(registerRoute.route.stack).toHaveLength(1);
      expect(loginRoute.route.stack).toHaveLength(1);
    });

    // TC03: Verificar rotas protegidas (com middleware)
    it('TC03 - Deve ter rotas protegidas configuradas corretamente', () => {
      // Act
      const routes = authRoutes.stack;
      
      // Assert - Encontrar rotas GET /me e PUT /profile
      const meRoute = routes.find(r => 
        r.route && r.route.path === '/me' && r.route.methods.get
      );
      const profileRoute = routes.find(r => 
        r.route && r.route.path === '/profile' && r.route.methods.put
      );
      
      expect(meRoute).toBeDefined();
      expect(profileRoute).toBeDefined();
      
      // Verificar que tem middleware de autenticação (protect + controller)
      expect(meRoute.route.stack).toHaveLength(2);
      expect(profileRoute.route.stack).toHaveLength(2);
    });

    // TC04: Verificar métodos HTTP corretos
    it('TC04 - Deve usar métodos HTTP corretos para cada rota', () => {
      // Act
      const routes = authRoutes.stack;
      
      // Assert
      const routesMethods = routes.map(r => ({
        path: r.route?.path,
        methods: Object.keys(r.route?.methods || {})
      })).filter(r => r.path);
      
      expect(routesMethods).toEqual([
        { path: '/register', methods: ['post'] },
        { path: '/login', methods: ['post'] },
        { path: '/me', methods: ['get'] },
        { path: '/profile', methods: ['put'] }
      ]);
    });
  });

  describe('Integração dos Controllers', () => {
    
    // TC05: Rota /register deve chamar controller register
    it('TC05 - Rota POST /register deve chamar authController.register', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123456'
      };
      
      // Act - Simular chamada da rota
      const registerRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/register'
      );
      const handler = registerRoute.route.stack[0].handle;
      
      mockReq.body = userData;
      await handler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(authController.register).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(authController.register).toHaveBeenCalledTimes(1);
    });

    // TC06: Rota /login deve chamar controller login
    it('TC06 - Rota POST /login deve chamar authController.login', async () => {
      // Arrange
      const loginData = {
        email: 'joao@exemplo.com',
        password: 'senha123456'
      };
      
      // Act
      const loginRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/login'
      );
      const handler = loginRoute.route.stack[0].handle;
      
      mockReq.body = loginData;
      await handler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(authController.login).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(authController.login).toHaveBeenCalledTimes(1);
    });

    // TC07: Rota /me deve chamar middleware protect e controller getProfile
    it('TC07 - Rota GET /me deve usar middleware protect e controller getProfile', async () => {
      // Act
      const meRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/me'
      );
      
      // Verificar middleware protect (primeiro handler)
      const protectMiddleware = meRoute.route.stack[0].handle;
      await protectMiddleware(mockReq, mockRes, mockNext);
      
      // Verificar controller (segundo handler)
      const controllerHandler = meRoute.route.stack[1].handle;
      await controllerHandler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(protect).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(authController.getProfile).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });

    // TC08: Rota /profile deve chamar middleware protect e controller updateProfile
    it('TC08 - Rota PUT /profile deve usar middleware protect e controller updateProfile', async () => {
      // Arrange
      const updateData = { name: 'João Silva Updated' };
      
      // Act
      const profileRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/profile'
      );
      
      // Verificar middleware protect
      const protectMiddleware = profileRoute.route.stack[0].handle;
      await protectMiddleware(mockReq, mockRes, mockNext);
      
      // Verificar controller
      const controllerHandler = profileRoute.route.stack[1].handle;
      mockReq.body = updateData;
      await controllerHandler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(protect).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(authController.updateProfile).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    });
  });

  describe('Ordem de Middleware', () => {
    
    // TC09: Verificar ordem correta dos middlewares nas rotas protegidas
    it('TC09 - Deve executar middlewares na ordem correta para rotas protegidas', () => {
      // Act
      const meRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/me'
      );
      const profileRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/profile'
      );
      
      // Assert - Verificar que protect vem antes do controller
      expect(meRoute.route.stack[0].handle).toBe(protect);
      expect(meRoute.route.stack[1].handle).toBe(authController.getProfile);
      
      expect(profileRoute.route.stack[0].handle).toBe(protect);
      expect(profileRoute.route.stack[1].handle).toBe(authController.updateProfile);
    });

    // TC10: Rotas públicas não devem ter middleware de autenticação
    it('TC10 - Rotas públicas não devem incluir middleware protect', () => {
      // Act
      const registerRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/register'
      );
      const loginRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/login'
      );
      
      // Assert
      expect(registerRoute.route.stack[0].handle).toBe(authController.register);
      expect(registerRoute.route.stack[0].handle).not.toBe(protect);
      
      expect(loginRoute.route.stack[0].handle).toBe(authController.login);
      expect(loginRoute.route.stack[0].handle).not.toBe(protect);
    });
  });

  describe('Tratamento de Erros', () => {
    
    // TC11: Erro no controller deve ser propagado
    it('TC11 - Deve propagar erros dos controllers', async () => {
      // Arrange
      const testError = new Error('Controller error');
      authController.register.mockImplementation((req, res, next) => {
        next(testError);
      });
      
      // Act
      const registerRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/register'
      );
      const handler = registerRoute.route.stack[0].handle;
      
      await handler(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    // TC12: Erro no middleware protect deve ser propagado
    it('TC12 - Deve propagar erros do middleware protect', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      protect.mockImplementation((req, res, next) => {
        next(authError);
      });
      
      // Act
      const meRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/me'
      );
      const protectMiddleware = meRoute.route.stack[0].handle;
      
      await protectMiddleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledWith(authError);
    });
  });

  describe('Configuração de Rotas - Detalhes', () => {
    
    // TC13: Verificar que todas as rotas estão registradas
    it('TC13 - Deve ter exatamente 4 rotas registradas', () => {
      // Act
      const routes = authRoutes.stack.filter(r => r.route);
      
      // Assert
      expect(routes).toHaveLength(4);
      
      const paths = routes.map(r => r.route.path);
      expect(paths).toContain('/register');
      expect(paths).toContain('/login');
      expect(paths).toContain('/me');
      expect(paths).toContain('/profile');
    });

    // TC14: Verificar que não há rotas duplicadas
    it('TC14 - Não deve ter rotas duplicadas', () => {
      // Act
      const routes = authRoutes.stack.filter(r => r.route);
      const routesInfo = routes.map(r => `${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`);
      
      // Assert
      const uniqueRoutes = [...new Set(routesInfo)];
      expect(routesInfo).toHaveLength(uniqueRoutes.length);
    });

    // TC15: Verificar estrutura do router exportado
    it('TC15 - Deve exportar router com estrutura correta', () => {
      // Assert
      expect(authRoutes.params).toBeDefined();
      expect(authRoutes.stack).toBeDefined();
      expect(Array.isArray(authRoutes.stack)).toBe(true);
      expect(typeof authRoutes.use).toBe('function');
      expect(typeof authRoutes.get).toBe('function');
      expect(typeof authRoutes.post).toBe('function');
      expect(typeof authRoutes.put).toBe('function');
    });
  });

  describe('Casos Extremos e Edge Cases', () => {
    
    // TC16: Verificar comportamento com rota não existente
    it('TC16 - Deve permitir que Express trate rotas não existentes', () => {
      // Act
      const nonExistentRoute = authRoutes.stack.find(r => 
        r.route && r.route.path === '/nonexistent'
      );
      
      // Assert
      expect(nonExistentRoute).toBeUndefined();
    });

    // TC17: Verificar se middleware é aplicado apenas nas rotas corretas
    it('TC17 - Middleware protect deve ser aplicado apenas em rotas protegidas', () => {
      // Act
      const allRoutes = authRoutes.stack.filter(r => r.route);
      
      // Assert
      allRoutes.forEach(route => {
        const isProtectedRoute = ['/me', '/profile'].includes(route.route.path);
        const hasProtectMiddleware = route.route.stack.some(layer => layer.handle === protect);
        
        if (isProtectedRoute) {
          expect(hasProtectMiddleware).toBe(true);
        } else {
          expect(hasProtectMiddleware).toBe(false);
        }
      });
    });
  });
});