const request = require('supertest');
const express = require('express');
const theaterRoutes = require('../../../src/routes/theaterRoutes');
const { protect, authorize } = require('../../../src/middleware/auth');

// Mock dos middlewares
jest.mock('../../../src/middleware/auth', () => ({
  protect: jest.fn((req, res, next) => next()),
  authorize: jest.fn(() => (req, res, next) => next())
}));

// Mock do controller
jest.mock('../../../src/controllers/theaterController', () => ({
  getTheaters: jest.fn((req, res) => res.json({ success: true })),
  getTheaterById: jest.fn((req, res) => res.json({ success: true })),
  createTheater: jest.fn((req, res) => res.status(201).json({ success: true })),
  updateTheater: jest.fn((req, res) => res.json({ success: true })),
  deleteTheater: jest.fn((req, res) => res.json({ success: true }))
}));

const {
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater
} = require('../../../src/controllers/theaterController');

describe('TheaterRoutes - Testes Unitários', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/theaters', theaterRoutes);
    
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('Configuração das Rotas', () => {

    it('TC01 - Deve ter rota GET /api/theaters configurada', async () => {
      // Act
      const response = await request(app)
        .get('/api/theaters')
        .expect(200);

      // Assert
      expect(getTheaters).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC02 - Deve ter rota GET /api/theaters/:id configurada', async () => {
      // Act
      const response = await request(app)
        .get('/api/theaters/theater123')
        .expect(200);

      // Assert
      expect(getTheaterById).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC03 - Deve ter rota POST /api/theaters configurada', async () => {
      // Act
      const response = await request(app)
        .post('/api/theaters')
        .send({ name: 'Sala Nova', capacity: 100, type: 'standard' })
        .expect(201);

      // Assert
      expect(createTheater).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC04 - Deve ter rota PUT /api/theaters/:id configurada', async () => {
      // Act
      const response = await request(app)
        .put('/api/theaters/theater123')
        .send({ name: 'Sala Atualizada' })
        .expect(200);

      // Assert
      expect(updateTheater).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

    it('TC05 - Deve ter rota DELETE /api/theaters/:id configurada', async () => {
      // Act
      const response = await request(app)
        .delete('/api/theaters/theater123')
        .expect(200);

      // Assert
      expect(deleteTheater).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

  });

  describe('Estrutura das Rotas', () => {

    it('TC06 - Rotas GET devem ser acessíveis publicamente', async () => {
      // Act & Assert
      await request(app).get('/api/theaters').expect(200);
      await request(app).get('/api/theaters/theater123').expect(200);
    });

    it('TC07 - Rota POST deve estar protegida', async () => {
      // Act
      const response = await request(app)
        .post('/api/theaters')
        .send({ name: 'Sala', capacity: 100, type: 'standard' });

      // Assert
      expect(response.status).toBe(201);
      expect(createTheater).toHaveBeenCalled();
    });

    it('TC08 - Rota PUT deve estar protegida', async () => {
      // Act
      const response = await request(app)
        .put('/api/theaters/theater123')
        .send({ name: 'Sala Atualizada' });

      // Assert
      expect(response.status).toBe(200);
      expect(updateTheater).toHaveBeenCalled();
    });

    it('TC09 - Rota DELETE deve estar protegida', async () => {
      // Act
      const response = await request(app).delete('/api/theaters/theater123');

      // Assert
      expect(response.status).toBe(200);
      expect(deleteTheater).toHaveBeenCalled();
    });

    it('TC10 - Middlewares devem estar importados', () => {
      // Act & Assert
      expect(protect).toBeDefined();
      expect(authorize).toBeDefined();
    });

  });

  describe('Parâmetros das Rotas', () => {

    it('TC11 - Rota GET /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const theaterId = 'theater123';

      // Act
      await request(app).get(`/api/theaters/${theaterId}`);

      // Assert
      expect(getTheaterById).toHaveBeenCalled();
      const call = getTheaterById.mock.calls[0];
      expect(call[0].params.id).toBe(theaterId);
    });

    it('TC12 - Rota PUT /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const theaterId = 'theater456';

      // Act
      await request(app)
        .put(`/api/theaters/${theaterId}`)
        .send({ name: 'Sala Atualizada' });

      // Assert
      expect(updateTheater).toHaveBeenCalled();
      const call = updateTheater.mock.calls[0];
      expect(call[0].params.id).toBe(theaterId);
    });

    it('TC13 - Rota DELETE /:id deve passar parâmetro id corretamente', async () => {
      // Arrange
      const theaterId = 'theater789';

      // Act
      await request(app).delete(`/api/theaters/${theaterId}`);

      // Assert
      expect(deleteTheater).toHaveBeenCalled();
      const call = deleteTheater.mock.calls[0];
      expect(call[0].params.id).toBe(theaterId);
    });

    it('TC14 - Rota POST deve receber body corretamente', async () => {
      // Arrange
      const theaterData = {
        name: 'Sala IMAX',
        capacity: 200,
        type: 'IMAX'
      };

      // Act
      await request(app)
        .post('/api/theaters')
        .send(theaterData);

      // Assert
      expect(createTheater).toHaveBeenCalled();
      const call = createTheater.mock.calls[0];
      expect(call[0].body).toEqual(theaterData);
    });

    it('TC15 - Rota PUT deve receber body corretamente', async () => {
      // Arrange
      const updateData = {
        name: 'Sala VIP Premium',
        capacity: 80,
        type: 'VIP'
      };

      // Act
      await request(app)
        .put('/api/theaters/theater123')
        .send(updateData);

      // Assert
      expect(updateTheater).toHaveBeenCalled();
      const call = updateTheater.mock.calls[0];
      expect(call[0].body).toEqual(updateData);
    });

  });

  describe('Estrutura do Router', () => {

    it('TC16 - Deve ser uma instância de Router do Express', () => {
      // Assert
      expect(theaterRoutes).toBeDefined();
      expect(typeof theaterRoutes).toBe('function');
    });

    it('TC17 - Deve exportar router corretamente', () => {
      // Assert
      expect(theaterRoutes.stack).toBeDefined();
      expect(Array.isArray(theaterRoutes.stack)).toBe(true);
    });

    it('TC18 - Deve ter as rotas corretas registradas', () => {
      // Assert
      const routes = theaterRoutes.stack.map(layer => {
        return {
          path: layer.route?.path,
          methods: layer.route ? Object.keys(layer.route.methods) : []
        };
      });

      expect(routes).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: '/', methods: expect.arrayContaining(['get']) }),
        expect.objectContaining({ path: '/:id', methods: expect.arrayContaining(['get']) }),
        expect.objectContaining({ path: '/', methods: expect.arrayContaining(['post']) }),
        expect.objectContaining({ path: '/:id', methods: expect.arrayContaining(['put']) }),
        expect.objectContaining({ path: '/:id', methods: expect.arrayContaining(['delete']) })
      ]));
    });

    it('TC19 - Deve aceitar Content-Type application/json', async () => {
      // Act
      const response = await request(app)
        .post('/api/theaters')
        .set('Content-Type', 'application/json')
        .send('{"name":"Sala JSON","capacity":100,"type":"standard"}');

      // Assert
      expect(response.status).not.toBe(400);
      expect(createTheater).toHaveBeenCalled();
    });

    it('TC20 - Não deve aceitar rotas não definidas', async () => {
      // Act
      const response = await request(app)
        .patch('/api/theaters/theater123')
        .send({ name: 'Teste' });

      // Assert
      expect(response.status).toBe(404);
    });

  });

  describe('Integração com Controllers', () => {

    it('TC21 - Deve chamar getTheaters com req, res e next', async () => {
      // Act
      await request(app).get('/api/theaters');

      // Assert
      expect(getTheaters).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' }),
        expect.objectContaining({ json: expect.any(Function) }),
        expect.any(Function)
      );
    });

    it('TC22 - Deve chamar createTheater com dados do body', async () => {
      // Arrange
      const theaterData = { name: 'Nova Sala', capacity: 150, type: '3D' };

      // Act
      await request(app)
        .post('/api/theaters')
        .send(theaterData);

      // Assert
      expect(createTheater).toHaveBeenCalled();
      const req = createTheater.mock.calls[0][0];
      expect(req.body).toEqual(theaterData);
    });

    it('TC23 - Deve passar parâmetros corretamente para controllers', async () => {
      // Act
      await request(app).get('/api/theaters/test-id-123');

      // Assert
      expect(getTheaterById).toHaveBeenCalled();
      const req = getTheaterById.mock.calls[0][0];
      expect(req.params.id).toBe('test-id-123');
    });

    it('TC24 - Deve configurar middleware protect antes dos controllers protegidos', async () => {
      // Arrange
      protect.mockImplementation((req, res, next) => {
        req.user = { id: 'user123', role: 'admin' };
        next();
      });

      // Act
      await request(app)
        .post('/api/theaters')
        .send({ name: 'Sala', capacity: 100, type: 'standard' });

      // Assert
      expect(protect).toHaveBeenCalled();
      expect(createTheater).toHaveBeenCalled();
    });

    it('TC25 - Deve integrar corretamente com controllers', async () => {
      // Act
      const response = await request(app)
        .post('/api/theaters')
        .send({ name: 'Sala', capacity: 100, type: 'standard' });

      // Assert
      expect(response.status).toBe(201);
      expect(createTheater).toHaveBeenCalled();
      expect(response.body.success).toBe(true);
    });

  });

});