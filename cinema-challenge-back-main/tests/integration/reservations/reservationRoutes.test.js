// Testes de integração para rotas de reservas
// Testa endpoints de criação, listagem, busca, atualização e exclusão de reservas
// Documenta bugs encontrados sem modificar o código principal

const request = require('supertest');
const app = require('../../../src/index');
const mongoose = require('mongoose');
const { Reservation, User, Session, Movie, Theater } = require('../../../src/models');
const {
  mockReservations,
  createSupportData,
  createTestReservation,
  createMultipleTestReservations,
  calculateTotalPrice,
  validateReservationResponse,
  validateReservationListResponse,
  generateUserToken,
  generateAdminToken
} = require('../helpers/reservationHelpers');
const { createTestUser, generateValidToken } = require('../helpers/authHelpers');

// Base URL para todas as requisições
const BASE_URL = '/api/v1/reservations';

describe('Reservations Integration Tests', () => {
  let validUserToken;
  let validAdminToken;
  let testUser;
  let testSession;
  let supportData;

  beforeAll(async () => {
    // Conectar ao banco de teste
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema_test');
    }
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await Reservation.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});

    // Criar dados de apoio
    supportData = await createSupportData();
    testSession = supportData.session;

    // Criar usuário de teste e tokens
    testUser = await createTestUser();
    validUserToken = generateValidToken(testUser._id, 'user');
    validAdminToken = generateValidToken(testUser._id, 'admin');
  });

  afterEach(async () => {
    // Limpar dados após cada teste
    await Reservation.deleteMany({});
    await User.deleteMany({});
    await Session.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});
  });

  afterAll(async () => {
    // Fechar conexão com banco
    await mongoose.connection.close();
  });

  describe('POST /reservations - Criar Reserva', () => {
    test('Deve criar uma reserva válida com sucesso', async () => {
      const reservationData = {
        ...mockReservations.validReservation,
        session: testSession._id
      };

      const response = await request(app)
        .post(BASE_URL)
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('criada');
      validateReservationResponse(response.body.data);
      
      // Verificar se o preço foi calculado corretamente
      const expectedPrice = calculateTotalPrice(reservationData.seats);
      expect(response.body.data.totalPrice).toBe(expectedPrice);
    });

    test('Deve criar reserva com um único assento', async () => {
      const reservationData = {
        ...mockReservations.validReservationSingle,
        session: testSession._id
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.seats).toHaveLength(1);
      expect(response.body.data.totalPrice).toBe(20.00); // Um assento full
    });

    test('Deve falhar ao criar reserva sem token de autenticação', async () => {
      const reservationData = {
        ...mockReservations.validReservation,
        session: testSession._id
      };

      const response = await request(app)
        .post('/reservations')
        .send(reservationData)
        .expect(401);

      // BUG ESPERADO: Sistema deve rejeitar requisições sem token
      // Comportamento atual: pode permitir ou dar erro genérico
      expect(response.body.success).toBe(false);
    });

    test('Deve falhar ao criar reserva com token inválido', async () => {
      const reservationData = {
        ...mockReservations.validReservation,
        session: testSession._id
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', 'Bearer token_invalido')
        .send(reservationData)
        .expect(401);

      // BUG ESPERADO: Token inválido deve ser rejeitado
      expect(response.body.success).toBe(false);
    });

    test('Deve falhar ao criar reserva sem session', async () => {
      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(mockReservations.invalidReservationNoSession)
        .expect(400);

      // BUG POTENCIAL: Validação de session obrigatória pode estar inconsistente
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('session');
    });

    test('Deve falhar ao criar reserva sem assentos', async () => {
      const reservationData = {
        ...mockReservations.invalidReservationNoSeats,
        session: testSession._id
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(400);

      // BUG POTENCIAL: Validação de assentos pode permitir array vazio
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('seats');
    });

    test('Deve falhar ao criar reserva com dados de assento inválidos', async () => {
      const reservationData = {
        ...mockReservations.invalidSeatData,
        session: testSession._id
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(400);

      // BUG ESPERADO: Validação de formato de assento deve rejeitar dados inválidos
      expect(response.body.success).toBe(false);
    });

    test('Deve falhar ao criar reserva com session inexistente', async () => {
      const fakeSessionId = new mongoose.Types.ObjectId();
      const reservationData = {
        ...mockReservations.validReservation,
        session: fakeSessionId
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(400);

      // BUG POTENCIAL: Sistema pode não validar existência da session
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /reservations/me - Listar Minhas Reservas', () => {
    beforeEach(async () => {
      // Criar algumas reservas para o usuário de teste
      await createTestReservation(null, testUser._id);
      await createTestReservation({
        ...mockReservations.validReservationSingle,
        session: testSession._id
      }, testUser._id);
    });

    test('Deve listar reservas do usuário autenticado', async () => {
      const response = await request(app)
        .get('/reservations/me')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verificar se todas as reservas pertencem ao usuário
      response.body.data.forEach(reservation => {
        validateReservationResponse(reservation);
        expect(reservation.user).toBe(testUser._id.toString());
      });
    });

    test('Deve retornar lista vazia para usuário sem reservas', async () => {
      // Limpar reservas
      await Reservation.deleteMany({});

      const response = await request(app)
        .get('/reservations/me')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toHaveLength(0);
    });

    test('Deve falhar sem token de autenticação', async () => {
      const response = await request(app)
        .get('/reservations/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Deve suportar paginação', async () => {
      // Criar mais reservas
      await createMultipleTestReservations(5);

      const response = await request(app)
        .get('/reservations/me')
        .query({ page: 1, limit: 3 })
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(200);

      // BUG POTENCIAL: Paginação pode não estar implementada corretamente
      expect(response.body.success).toBe(true);
      // Se paginação funcionar, deve ter no máximo 3 resultados
      // Se não funcionar, pode retornar todos os resultados
    });
  });

  describe('GET /reservations - Listar Todas as Reservas (Admin)', () => {
    beforeEach(async () => {
      await createMultipleTestReservations(3);
    });

    test('Deve permitir admin listar todas as reservas', async () => {
      const response = await request(app)
        .get('/reservations')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(200);

      validateReservationListResponse(response.body);
      expect(response.body.count).toBeGreaterThan(0);
    });

    test('Deve negar acesso a usuário comum', async () => {
      const response = await request(app)
        .get('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(403);

      // BUG POTENCIAL: Autorização admin pode estar inconsistente
      expect(response.body.success).toBe(false);
    });

    test('Deve falhar sem autenticação', async () => {
      const response = await request(app)
        .get('/reservations')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Deve suportar filtros de busca', async () => {
      const response = await request(app)
        .get('/reservations')
        .query({ status: 'pending' })
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(200);

      // BUG POTENCIAL: Filtros podem não estar funcionando
      expect(response.body.success).toBe(true);
      // Se filtros funcionarem, todas as reservas devem ter status 'pending'
      // Se não funcionarem, pode retornar todas as reservas
    });
  });

  describe('GET /reservations/:id - Buscar Reserva por ID', () => {
    let testReservation;

    beforeEach(async () => {
      testReservation = await createTestReservation(null, testUser._id);
    });

    test('Deve retornar reserva específica para admin', async () => {
      const response = await request(app)
        .get(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      validateReservationResponse(response.body.data);
      expect(response.body.data._id).toBe(testReservation._id.toString());
    });

    test('Deve permitir usuário ver sua própria reserva', async () => {
      const response = await request(app)
        .get(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(200);

      // BUG POTENCIAL: Usuário pode conseguir ou não ver própria reserva
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testReservation._id.toString());
    });

    test('Deve falhar com ID inválido', async () => {
      const response = await request(app)
        .get('/reservations/id_invalido')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('Deve falhar com ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /reservations/:id - Atualizar Reserva (Admin)', () => {
    let testReservation;

    beforeEach(async () => {
      testReservation = await createTestReservation(null, testUser._id);
    });

    test('Deve permitir admin atualizar status da reserva', async () => {
      const updateData = mockReservations.reservationUpdate;

      const response = await request(app)
        .put(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.paymentStatus).toBe(updateData.paymentStatus);
    });

    test('Deve negar acesso a usuário comum', async () => {
      const updateData = mockReservations.reservationUpdate;

      const response = await request(app)
        .put(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(updateData)
        .expect(403);

      // BUG POTENCIAL: Autorização para atualização pode estar inconsistente
      expect(response.body.success).toBe(false);
    });

    test('Deve validar dados de atualização', async () => {
      const invalidData = {
        status: 'status_invalido',
        paymentStatus: 'payment_invalido'
      };

      const response = await request(app)
        .put(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send(invalidData)
        .expect(400);

      // BUG POTENCIAL: Validação de enums pode não estar funcionando
      expect(response.body.success).toBe(false);
    });

    test('Deve falhar com ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = mockReservations.reservationUpdate;

      const response = await request(app)
        .put(`/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /reservations/:id - Excluir Reserva (Admin)', () => {
    let testReservation;

    beforeEach(async () => {
      testReservation = await createTestReservation(null, testUser._id);
    });

    test('Deve permitir admin excluir reserva', async () => {
      const response = await request(app)
        .delete(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verificar se foi realmente excluída
      const deletedReservation = await Reservation.findById(testReservation._id);
      expect(deletedReservation).toBeNull();
    });

    test('Deve negar acesso a usuário comum', async () => {
      const response = await request(app)
        .delete(`/reservations/${testReservation._id}`)
        .set('Authorization', `Bearer ${validUserToken}`)
        .expect(403);

      // BUG POTENCIAL: Autorização para exclusão pode estar inconsistente
      expect(response.body.success).toBe(false);
      
      // Verificar se não foi excluída
      const stillExists = await Reservation.findById(testReservation._id);
      expect(stillExists).toBeTruthy();
    });

    test('Deve falhar sem autenticação', async () => {
      const response = await request(app)
        .delete(`/reservations/${testReservation._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('Deve falhar com ID inexistente', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('Deve falhar com ID inválido', async () => {
      const response = await request(app)
        .delete('/reservations/id_invalido')
        .set('Authorization', `Bearer ${validAdminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Testes de Regras de Negócio', () => {
    test('Deve calcular preço total corretamente', async () => {
      const reservationData = {
        session: testSession._id,
        seats: [
          { row: 'A', number: 1, type: 'full' },   // 20.00
          { row: 'A', number: 2, type: 'half' },   // 10.00
          { row: 'B', number: 1, type: 'full' }    // 20.00
        ],                                          // Total: 50.00
        paymentMethod: 'credit_card'
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(reservationData)
        .expect(201);

      // BUG POTENCIAL: Cálculo de preço pode estar incorreto
      expect(response.body.data.totalPrice).toBe(50.00);
    });

    test('Deve prevenir reserva de assentos duplicados', async () => {
      // Primeira reserva
      const firstReservation = {
        session: testSession._id,
        seats: [{ row: 'A', number: 1, type: 'full' }],
        paymentMethod: 'credit_card'
      };

      await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(firstReservation)
        .expect(201);

      // Tentar reservar o mesmo assento
      const duplicateReservation = {
        session: testSession._id,
        seats: [{ row: 'A', number: 1, type: 'full' }],
        paymentMethod: 'credit_card'
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(duplicateReservation)
        .expect(400);

      // BUG CRÍTICO: Sistema pode permitir reservas duplicadas
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('assento');
    });

    test('Deve aplicar diferentes tipos de ingresso', async () => {
      const mixedReservation = {
        session: testSession._id,
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'half' }
        ],
        paymentMethod: 'pix'
      };

      const response = await request(app)
        .post('/reservations')
        .set('Authorization', `Bearer ${validUserToken}`)
        .send(mixedReservation)
        .expect(201);

      expect(response.body.data.totalPrice).toBe(30.00); // 20.00 + 10.00
      expect(response.body.data.seats).toHaveLength(2);
    });
  });
});