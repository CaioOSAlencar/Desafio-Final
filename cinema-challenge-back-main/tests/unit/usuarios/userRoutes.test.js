const request = require('supertest');
const express = require('express');
const userRoutes = require('../../../src/routes/userRoutes');
const { protect, authorize } = require('../../../src/middleware/auth');

// Mock dos middlewares
jest.mock('../../../src/middleware/auth', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { id: 'admin123', role: 'admin' };
    next();
  }),
  authorize: jest.fn(() => (req, res, next) => next())
}));

// Mock do controller
jest.mock('../../../src/controllers/userController', () => ({
  getUsers: jest.fn((req, res) => res.json({ success: true, count: 0, data: [] })),
  getUserById: jest.fn((req, res) => res.json({ success: true, data: { id: req.params.id } })),
  updateUser: jest.fn((req, res) => res.json({ success: true, data: { id: req.params.id } })),
  deleteUser: jest.fn((req, res) => res.json({ success: true, message: 'User removed' }))
}));

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../../../src/controllers/userController');

describe('UserRoutes - Testes Unitários', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', userRoutes);
    
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('Configuração das Rotas', () => {

    it('TC01 - Deve ter rota GET /api/users configurada', async () => {
      // Act
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      // Assert
      expect(getUsers).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC02 - Deve ter rota GET /api/users/:id configurada', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/user123')
        .expect(200);

      // Assert
      expect(getUserById).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC03 - Deve ter rota PUT /api/users/:id configurada', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/user123')
        .send({ name: 'João Atualizado' })
        .expect(200);

      // Assert
      expect(updateUser).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC04 - Deve ter rota DELETE /api/users/:id configurada', async () => {
      // Act
      const response = await request(app)
        .delete('/api/users/user123')
        .expect(200);

      // Assert
      expect(deleteUser).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC05 - Não deve ter rota POST /api/users (criação via auth)', async () => {
      // Act
      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Novo User' });

      // Assert
      expect(response.status).toBe(404);
    });

  });

  describe('Middlewares de Autenticação', () => {

    it('TC06 - Todas as rotas devem usar middleware protect', async () => {
      // Act
      await request(app).get('/api/users');
      await request(app).get('/api/users/user123');
      await request(app).put('/api/users/user123').send({});
      await request(app).delete('/api/users/user123');

      // Assert
      expect(protect).toHaveBeenCalledTimes(4);
    });

    it('TC07 - Todas as rotas devem ser protegidas', async () => {
      // Act
      await request(app).get('/api/users');
      await request(app).get('/api/users/user123');
      await request(app).put('/api/users/user123').send({});
      await request(app).delete('/api/users/user123');

      // Assert
      expect(protect).toHaveBeenCalledTimes(4);
    });

    it('TC08 - Middleware protect deve definir req.user', async () => {
      // Act
      await request(app).get('/api/users');

      // Assert
      expect(getUsers).toHaveBeenCalled();
      const req = getUsers.mock.calls[0][0];
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('admin');
    });

    it('TC09 - Deve aplicar middlewares globalmente a todas as rotas', async () => {
      // Arrange
      let middlewareCallCount = 0;
      protect.mockImplementation((req, res, next) => {
        middlewareCallCount++;
        req.user = { id: 'admin123', role: 'admin' };
        next();
      });

      // Act
      await request(app).get('/api/users');

      // Assert
      expect(middlewareCallCount).toBe(1);
      expect(protect).toHaveBeenCalled();
    });

    it('TC10 - Deve aplicar middlewares nas rotas protegidas', async () => {
      // Act
      await request(app).get('/api/users');

      // Assert
      expect(protect).toHaveBeenCalled();
      expect(getUsers).toHaveBeenCalled();
    });

  });

  describe('Parâmetros das Rotas', () => {

    it('TC11 - Rota GET /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const userId = 'user123';

      // Act
      await request(app).get(`/api/users/${userId}`);

      // Assert
      expect(getUserById).toHaveBeenCalled();
      const call = getUserById.mock.calls[0];
      expect(call[0].params.id).toBe(userId);
    });

    it('TC12 - Rota PUT /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const userId = 'user456';

      // Act
      await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Nome Atualizado' });

      // Assert
      expect(updateUser).toHaveBeenCalled();
      const call = updateUser.mock.calls[0];
      expect(call[0].params.id).toBe(userId);
    });

    it('TC13 - Rota DELETE /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const userId = 'user789';

      // Act
      await request(app).delete(`/api/users/${userId}`);

      // Assert
      expect(deleteUser).toHaveBeenCalled();
      const call = deleteUser.mock.calls[0];
      expect(call[0].params.id).toBe(userId);
    });

    it('TC14 - Rota PUT deve receber body corretamente', async () => {
      // Arrange
      const updateData = {
        name: 'João Silva Atualizado',
        email: 'joao.novo@teste.com',
        role: 'admin'
      };

      // Act
      await request(app)
        .put('/api/users/user123')
        .send(updateData);

      // Assert
      expect(updateUser).toHaveBeenCalled();
      const call = updateUser.mock.calls[0];
      expect(call[0].body).toEqual(updateData);
    });

    it('TC15 - Deve aceitar parâmetros de query na rota GET', async () => {
      // Act
      await request(app)
        .get('/api/users?page=2&limit=5&role=admin')
        .expect(200);

      // Assert
      expect(getUsers).toHaveBeenCalled();
      const req = getUsers.mock.calls[0][0];
      expect(req.query.page).toBe('2');
      expect(req.query.limit).toBe('5');
      expect(req.query.role).toBe('admin');
    });

  });

  describe('Estrutura do Router', () => {

    it('TC16 - Deve ser uma instância de Router do Express', () => {
      // Assert
      expect(userRoutes).toBeDefined();
      expect(typeof userRoutes).toBe('function');
    });

    it('TC17 - Deve exportar router corretamente', () => {
      // Assert
      expect(userRoutes.stack).toBeDefined();
      expect(Array.isArray(userRoutes.stack)).toBe(true);
    });

    it('TC18 - Deve ter as rotas corretas registradas', () => {
      // Assert
      const routes = userRoutes.stack.map(layer => {
        if (layer.route) {
          return {
            path: layer.route.path,
            methods: Object.keys(layer.route.methods)
          };
        }
        return null;
      }).filter(Boolean);

      expect(routes).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: '/', methods: expect.arrayContaining(['get']) }),
        expect.objectContaining({ path: '/:id', methods: expect.arrayContaining(['get', 'put', 'delete']) })
      ]));
    });

    it('TC19 - Deve aceitar Content-Type application/json', async () => {
      // Act
      const response = await request(app)
        .put('/api/users/user123')
        .set('Content-Type', 'application/json')
        .send('{"name":"João JSON","email":"joao@json.com"}');

      // Assert
      expect(response.status).not.toBe(400);
      expect(updateUser).toHaveBeenCalled();
    });

    it('TC20 - Não deve aceitar métodos não definidos', async () => {
      // Act
      const response = await request(app)
        .patch('/api/users/user123')
        .send({ name: 'Teste' });

      // Assert
      expect(response.status).toBe(404);
    });

  });

  describe('Integração com Controllers', () => {

    it('TC21 - Deve chamar getUsers com req, res e next', async () => {
      // Act
      await request(app).get('/api/users');

      // Assert
      expect(getUsers).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
        expect.objectContaining({ json: expect.any(Function) }),
        expect.any(Function)
      );
    });

    it('TC22 - Deve chamar updateUser com dados do body', async () => {
      // Arrange
      const userData = { name: 'João Atualizado', role: 'admin' };

      // Act
      await request(app)
        .put('/api/users/user123')
        .send(userData);

      // Assert
      expect(updateUser).toHaveBeenCalled();
      const req = updateUser.mock.calls[0][0];
      expect(req.body).toEqual(userData);
    });

    it('TC23 - Deve passar parâmetros corretamente para controllers', async () => {
      // Act
      await request(app).get('/api/users/test-id-789');

      // Assert
      expect(getUserById).toHaveBeenCalled();
      const req = getUserById.mock.calls[0][0];
      expect(req.params.id).toBe('test-id-789');
    });

    it('TC24 - Deve usar route() para agrupar métodos por path', async () => {
      // Act
      await request(app).get('/api/users/user123');
      await request(app).put('/api/users/user123').send({});
      await request(app).delete('/api/users/user123');

      // Assert
      expect(getUserById).toHaveBeenCalled();
      expect(updateUser).toHaveBeenCalled();
      expect(deleteUser).toHaveBeenCalled();
    });

    it('TC25 - Deve aplicar middleware globalmente com router.use', async () => {
      // Arrange
      let globalMiddlewareExecuted = false;
      protect.mockImplementation((req, res, next) => {
        globalMiddlewareExecuted = true;
        req.user = { id: 'admin123', role: 'admin' };
        next();
      });

      // Act
      await request(app).get('/api/users');

      // Assert
      expect(globalMiddlewareExecuted).toBe(true);
      expect(protect).toHaveBeenCalled();
    });

  });

});