// Testes unitários para controlador de reservas
// Testa todas as operações CRUD do reservationController

const { getReservations, getMyReservations, getReservationById, createReservation, updateReservationStatus, deleteReservation } = require('../../../src/controllers/reservationController');
const { Reservation, Session, User } = require('../../../src/models');

// Mock dos modelos
jest.mock('../../../src/models', () => ({
  Reservation: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn()
  },
  Session: {
    findById: jest.fn()
  },
  User: {
    findById: jest.fn()
  }
}));

describe('ReservationController - Testes Unitários', () => {

  let req, res, next;

  beforeEach(() => {
    // Setup padrão de req, res, next para cada teste
    req = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'userId', role: 'user' }
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Reset de todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('getReservations (Admin)', () => {

    it('TC01 - Deve listar reservas com paginação padrão', async () => {
      // Arrange
      const mockReservations = [
        { _id: 'res1', user: 'user1', status: 'confirmed' },
        { _id: 'res2', user: 'user2', status: 'pending' }
      ];
      
      Reservation.countDocuments.mockResolvedValue(15);
      Reservation.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReservations)
      });

      // Act
      await getReservations(req, res, next);

      // Assert
      expect(Reservation.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        pagination: expect.any(Object),
        data: mockReservations
      });
    });

    it('TC02 - Deve listar reservas com paginação customizada', async () => {
      // Arrange
      req.query = { page: '2', limit: '5' };
      const mockReservations = [
        { _id: 'res6', user: 'user6', status: 'confirmed' }
      ];
      
      Reservation.countDocuments.mockResolvedValue(15);
      Reservation.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReservations)
      });

      // Act
      await getReservations(req, res, next);

      // Assert
      expect(Reservation.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        pagination: expect.objectContaining({
          next: expect.any(Object),
          prev: expect.any(Object)
        }),
        data: mockReservations
      });
    });

    it('TC03 - Deve popular dados de usuário e sessão', async () => {
      // Arrange
      const mockReservations = [{ _id: 'res1' }];
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockReservations)
      };
      
      Reservation.countDocuments.mockResolvedValue(1);
      Reservation.find.mockReturnValue(mockChain);

      // Act
      await getReservations(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalledWith('user', 'name email');
      expect(mockChain.populate).toHaveBeenCalledWith({
        path: 'session',
        populate: {
          path: 'movie theater',
          select: 'title name'
        }
      });
    });

    it('TC04 - Deve tratar erro na listagem', async () => {
      // Arrange
      const mockError = new Error('Database error');
      Reservation.countDocuments.mockRejectedValue(mockError);

      // Act
      await getReservations(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('getMyReservations', () => {

    it('TC05 - Deve listar reservas do usuário logado', async () => {
      // Arrange
      req.user._id = 'user123';
      const mockReservations = [
        { _id: 'res1', user: 'user123', status: 'confirmed' },
        { _id: 'res2', user: 'user123', status: 'pending' }
      ];
      
      Reservation.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockReservations)
      });

      // Act
      await getMyReservations(req, res, next);

      // Assert
      expect(Reservation.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockReservations
      });
    });

    it('TC06 - Deve retornar lista vazia se usuário sem reservas', async () => {
      // Arrange
      req.user._id = 'userWithoutReservations';
      
      Reservation.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      // Act
      await getMyReservations(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('TC07 - Deve popular dados de sessão com filme e teatro', async () => {
      // Arrange
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };
      
      Reservation.find.mockReturnValue(mockChain);

      // Act
      await getMyReservations(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalledWith({
        path: 'session',
        populate: {
          path: 'movie theater',
          select: 'title name poster datetime'
        }
      });
    });

    it('TC08 - Deve tratar erro na busca de reservas do usuário', async () => {
      // Arrange
      const mockError = new Error('Database error');
      Reservation.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(mockError)
      });

      // Act
      await getMyReservations(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('getReservationById', () => {

    it('TC09 - Deve buscar reserva por ID', async () => {
      // Arrange
      req.params.id = 'reservation123';
      
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'reservation123' })
      };
      Reservation.findById.mockReturnValue(mockChain);

      // Act
      await getReservationById(req, res, next);

      // Assert
      expect(Reservation.findById).toHaveBeenCalledWith('reservation123');
    });

    it('TC10 - Deve popular dados corretamente', async () => {
      // Arrange
      req.params.id = 'reservation123';
      
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'reservation123' })
      };
      Reservation.findById.mockReturnValue(mockChain);

      // Act
      await getReservationById(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalled();
    });

    it('TC11 - Deve chamar Reservation.findById', async () => {
      // Arrange
      req.params.id = 'reservation123';
      
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'reservation123' })
      };
      Reservation.findById.mockReturnValue(mockChain);

      // Act
      await getReservationById(req, res, next);

      // Assert
      expect(Reservation.findById).toHaveBeenCalledWith('reservation123');
    });

    it('TC12 - Deve validar parâmetro ID', async () => {
      // Arrange
      req.params.id = 'validId123';
      
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'validId123' })
      };
      Reservation.findById.mockReturnValue(mockChain);

      // Act
      await getReservationById(req, res, next);

      // Assert
      expect(Reservation.findById).toHaveBeenCalledWith('validId123');
    });

  });

  describe('createReservation', () => {

    it('TC13 - Deve criar reserva com assentos disponíveis', async () => {
      // Arrange
      req.body = {
        session: 'session123',
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'half' }
        ],
        paymentMethod: 'credit_card'
      };
      req.user._id = 'user123';
      
      const mockSession = {
        _id: 'session123',
        fullPrice: 20,
        halfPrice: 10,
        seats: [
          { row: 'A', number: 1, status: 'available' },
          { row: 'A', number: 2, status: 'available' }
        ],
        save: jest.fn().mockResolvedValue()
      };
      
      const mockReservation = {
        _id: 'newReservation',
        populate: jest.fn().mockResolvedValue({
          _id: 'newReservation',
          totalPrice: 30,
          status: 'confirmed'
        })
      };
      
      Session.findById.mockResolvedValue(mockSession);
      Reservation.create.mockResolvedValue(mockReservation);

      // Act
      await createReservation(req, res, next);

      // Assert
      expect(Reservation.create).toHaveBeenCalledWith({
        user: 'user123',
        session: 'session123',
        seats: req.body.seats,
        totalPrice: 30, // 20 + 10
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card',
        paymentDate: expect.any(Date)
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC14 - Deve rejeitar criação para sessão inexistente', async () => {
      // Arrange
      req.body = {
        session: 'nonexistent',
        seats: [{ row: 'A', number: 1, type: 'full' }]
      };
      
      Session.findById.mockResolvedValue(null);

      // Act
      await createReservation(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found'
      });
    });

    it('TC15 - Deve rejeitar assentos já ocupados', async () => {
      // Arrange
      req.body = {
        session: 'session123',
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'full' }
        ]
      };
      
      const mockSession = {
        seats: [
          { row: 'A', number: 1, status: 'occupied' },
          { row: 'A', number: 2, status: 'available' }
        ]
      };
      
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await createReservation(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('A1')
      });
    });

    it('TC16 - Deve calcular preço corretamente com full e half', async () => {
      // Arrange
      req.body = {
        session: 'session123',
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'half' },
          { row: 'A', number: 3, type: 'full' }
        ]
      };
      
      const mockSession = {
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', number: 1, status: 'available' },
          { row: 'A', number: 2, status: 'available' },
          { row: 'A', number: 3, status: 'available' }
        ],
        save: jest.fn()
      };
      
      Session.findById.mockResolvedValue(mockSession);
      Reservation.create.mockResolvedValue({
        populate: jest.fn().mockResolvedValue({})
      });

      // Act
      await createReservation(req, res, next);

      // Assert
      expect(Reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          totalPrice: 62.5 // 25 + 12.5 + 25
        })
      );
    });

    it('TC17 - Deve atualizar status dos assentos na sessão', async () => {
      // Arrange
      req.body = {
        session: 'session123',
        seats: [{ row: 'A', number: 1, type: 'full' }]
      };
      
      const mockSession = {
        fullPrice: 20,
        seats: [{ row: 'A', number: 1, status: 'available' }],
        save: jest.fn().mockResolvedValue()
      };
      
      Session.findById.mockResolvedValue(mockSession);
      Reservation.create.mockResolvedValue({
        populate: jest.fn().mockResolvedValue({})
      });

      // Act
      await createReservation(req, res, next);

      // Assert
      expect(mockSession.seats[0].status).toBe('occupied');
      expect(mockSession.save).toHaveBeenCalled();
    });

  });

  describe('updateReservationStatus (Admin)', () => {

    it('TC18 - Admin deve atualizar status da reserva', async () => {
      // Arrange
      req.params.id = 'reservation123';
      req.body = { status: 'cancelled' };
      req.user.role = 'admin';
      
      const mockReservation = {
        _id: 'reservation123',
        status: 'confirmed',
        session: 'session123',
        seats: [{ row: 'A', number: 1 }],
        save: jest.fn().mockResolvedValue()
      };
      
      const mockSession = {
        seats: [{ row: 'A', number: 1, status: 'occupied' }],
        save: jest.fn().mockResolvedValue()
      };
      
      Reservation.findById.mockResolvedValue(mockReservation);
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await updateReservationStatus(req, res, next);

      // Assert
      expect(mockReservation.status).toBe('cancelled');
      expect(mockReservation.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReservation
      });
    });

    it('TC19 - Deve liberar assentos ao cancelar reserva', async () => {
      // Arrange
      req.params.id = 'reservation123';
      req.body = { status: 'cancelled' };
      
      const mockReservation = {
        status: 'confirmed',
        session: 'session123',
        seats: [
          { row: 'A', number: 1 },
          { row: 'A', number: 2 }
        ],
        save: jest.fn()
      };
      
      const mockSession = {
        seats: [
          { row: 'A', number: 1, status: 'occupied' },
          { row: 'A', number: 2, status: 'occupied' }
        ],
        save: jest.fn()
      };
      
      Reservation.findById.mockResolvedValue(mockReservation);
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await updateReservationStatus(req, res, next);

      // Assert
      expect(mockSession.seats[0].status).toBe('available');
      expect(mockSession.seats[1].status).toBe('available');
      expect(mockSession.save).toHaveBeenCalled();
    });

    it('TC20 - Deve rejeitar status inválido', async () => {
      // Arrange
      req.params.id = 'reservation123';
      req.body = { status: 'invalid_status' };

      // Act
      await updateReservationStatus(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid status (pending, confirmed, cancelled)'
      });
    });

    it('TC21 - Deve retornar 404 para reserva inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      req.body = { status: 'cancelled' };
      
      Reservation.findById.mockResolvedValue(null);

      // Act
      await updateReservationStatus(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Reservation not found'
      });
    });

  });

  describe('deleteReservation (Admin)', () => {

    it('TC22 - Admin deve deletar reserva e liberar assentos', async () => {
      // Arrange
      req.params.id = 'reservation123';
      
      const mockReservation = {
        _id: 'reservation123',
        session: 'session123',
        seats: [{ row: 'A', number: 1 }],
        deleteOne: jest.fn().mockResolvedValue()
      };
      
      const mockSession = {
        seats: [{ row: 'A', number: 1, status: 'occupied' }],
        save: jest.fn().mockResolvedValue()
      };
      
      Reservation.findById.mockResolvedValue(mockReservation);
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await deleteReservation(req, res, next);

      // Assert
      expect(mockSession.seats[0].status).toBe('available');
      expect(mockReservation.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Reservation removed'
      });
    });

    it('TC23 - Deve retornar 404 para reserva inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      
      Reservation.findById.mockResolvedValue(null);

      // Act
      await deleteReservation(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Reservation not found'
      });
    });

    it('TC24 - Deve tratar erro na deleção', async () => {
      // Arrange
      req.params.id = 'reservation123';
      const mockError = new Error('Database error');
      
      Reservation.findById.mockRejectedValue(mockError);

      // Act
      await deleteReservation(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

});