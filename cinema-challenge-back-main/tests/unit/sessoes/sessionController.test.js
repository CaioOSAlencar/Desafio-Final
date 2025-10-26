// Testes unitários para controlador de sessões
// Testa todas as operações CRUD do sessionController

const { getSessions, getSessionById, createSession, updateSession, deleteSession, resetSessionSeats } = require('../../../src/controllers/sessionController');
const { Session, Movie, Theater } = require('../../../src/models');

// Mock dos modelos
jest.mock('../../../src/models', () => ({
  Session: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn()
  },
  Movie: {
    findById: jest.fn()
  },
  Theater: {
    findById: jest.fn()
  }
}));

describe('SessionController - Testes Unitários', () => {

  let req, res, next;

  beforeEach(() => {
    // Setup padrão de req, res, next para cada teste
    req = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'userId', role: 'admin' }
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Reset de todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('getSessions', () => {

    it('TC01 - Deve listar sessões com paginação padrão', async () => {
      // Arrange
      const mockSessions = [
        { _id: 'session1', movie: 'movie1', theater: 'theater1' },
        { _id: 'session2', movie: 'movie2', theater: 'theater2' }
      ];
      
      Session.countDocuments.mockResolvedValue(15);
      Session.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });

      // Act
      await getSessions(req, res, next);

      // Assert
      expect(Session.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        pagination: expect.any(Object),
        data: mockSessions
      });
    });

    it('TC02 - Deve filtrar sessões por filme', async () => {
      // Arrange
      req.query.movie = 'movie123';
      const mockSessions = [{ _id: 'session1', movie: 'movie123' }];
      
      Session.countDocuments.mockResolvedValue(1);
      Session.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });

      // Act
      await getSessions(req, res, next);

      // Assert
      expect(Session.find).toHaveBeenCalledWith({ movie: 'movie123' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        pagination: expect.any(Object),
        data: mockSessions
      });
    });

    it('TC03 - Deve filtrar sessões por teatro', async () => {
      // Arrange
      req.query.theater = 'theater456';
      const mockSessions = [{ _id: 'session1', theater: 'theater456' }];
      
      Session.countDocuments.mockResolvedValue(1);
      Session.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });

      // Act
      await getSessions(req, res, next);

      // Assert
      expect(Session.find).toHaveBeenCalledWith({ theater: 'theater456' });
    });

    it('TC04 - Deve filtrar sessões por data', async () => {
      // Arrange
      req.query.date = '2025-12-25';
      const mockSessions = [{ _id: 'session1', datetime: new Date('2025-12-25T18:00:00') }];
      
      Session.countDocuments.mockResolvedValue(1);
      Session.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockSessions)
      });

      // Act
      await getSessions(req, res, next);

      // Assert
      const expectedQuery = expect.objectContaining({
        datetime: expect.objectContaining({
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        })
      });
      expect(Session.find).toHaveBeenCalledWith(expectedQuery);
    });

    it('TC05 - Deve popular dados de filme e teatro', async () => {
      // Arrange
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };
      
      Session.countDocuments.mockResolvedValue(0);
      Session.find.mockReturnValue(mockChain);

      // Act
      await getSessions(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalledWith('movie', 'title poster duration');
      expect(mockChain.populate).toHaveBeenCalledWith('theater', 'name type');
    });

    it('TC06 - Deve tratar erro', async () => {
      // Arrange
      const mockError = new Error('Database error');
      Session.countDocuments.mockRejectedValue(mockError);

      // Act
      await getSessions(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('getSessionById', () => {

    it('TC07 - Deve retornar sessão encontrada', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockSession = {
        _id: 'session123',
        movie: { title: 'Filme A' },
        theater: { name: 'Sala 1' }
      };
      
      const mockChain = {
        populate: jest.fn().mockReturnThis()
      };
      // Mock the chain: findById().populate().populate()
      mockChain.populate
        .mockReturnValueOnce(mockChain) // first populate('movie') returns chain
        .mockResolvedValueOnce(mockSession); // second populate('theater') returns result
      
      Session.findById.mockReturnValue(mockChain);

      // Act
      await getSessionById(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSession
      });
    });

    it('TC08 - Deve chamar populate para movie e theater', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockSession = { _id: 'session123' };
      
      const mockChain = {
        populate: jest.fn().mockReturnThis()
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(mockSession);
      
      Session.findById.mockReturnValue(mockChain);

      // Act
      await getSessionById(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalledWith('movie');
      expect(mockChain.populate).toHaveBeenCalledWith('theater');
    });

    it('TC09 - Deve retornar 404 para sessão inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      
      const mockChain = {
        populate: jest.fn().mockReturnThis()
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockResolvedValueOnce(null);
      
      Session.findById.mockReturnValue(mockChain);

      // Act
      await getSessionById(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found'
      });
    });

    it('TC10 - Deve tratar erro na busca', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockError = new Error('Database error');
      
      const mockChain = {
        populate: jest.fn().mockReturnThis()
      };
      mockChain.populate
        .mockReturnValueOnce(mockChain)
        .mockRejectedValueOnce(mockError);
      
      Session.findById.mockReturnValue(mockChain);

      // Act
      await getSessionById(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('createSession', () => {

    it('TC11 - Deve criar sessão com dados válidos', async () => {
      // Arrange
      req.body = {
        movie: 'movie123',
        theater: 'theater456',
        datetime: '2025-12-25T18:00:00',
        fullPrice: 25,
        halfPrice: 12.5
      };
      
      const mockMovie = { _id: 'movie123', title: 'Filme A' };
      const mockTheater = { _id: 'theater456', name: 'Sala 1', capacity: 80 };
      const mockSession = { _id: 'newSession', ...req.body };
      
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      Session.create.mockResolvedValue(mockSession);

      // Act
      await createSession(req, res, next);

      // Assert
      expect(Movie.findById).toHaveBeenCalledWith('movie123');
      expect(Theater.findById).toHaveBeenCalledWith('theater456');
      expect(Session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          movie: 'movie123',
          theater: 'theater456',
          seats: expect.any(Array)
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('TC12 - Deve retornar 404 para filme inexistente', async () => {
      // Arrange
      req.body = {
        movie: 'nonexistent',
        theater: 'theater456',
        datetime: '2025-12-25T18:00:00',
        fullPrice: 25,
        halfPrice: 12.5
      };
      
      Movie.findById.mockResolvedValue(null);

      // Act
      await createSession(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Movie not found'
      });
    });

    it('TC13 - Deve retornar 404 para teatro inexistente', async () => {
      // Arrange
      req.body = {
        movie: 'movie123',
        theater: 'nonexistent',
        datetime: '2025-12-25T18:00:00',
        fullPrice: 25,
        halfPrice: 12.5
      };
      
      const mockMovie = { _id: 'movie123', title: 'Filme A' };
      
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(null);

      // Act
      await createSession(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Theater not found'
      });
    });

    it('TC14 - Deve gerar assentos baseado na capacidade do teatro', async () => {
      // Arrange
      req.body = {
        movie: 'movie123',
        theater: 'theater456',
        datetime: '2025-12-25T18:00:00',
        fullPrice: 25,
        halfPrice: 12.5
      };
      
      const mockMovie = { _id: 'movie123' };
      const mockTheater = { _id: 'theater456', capacity: 16 }; // 2 fileiras de 8
      
      Movie.findById.mockResolvedValue(mockMovie);
      Theater.findById.mockResolvedValue(mockTheater);
      Session.create.mockResolvedValue({ _id: 'newSession' });

      // Act
      await createSession(req, res, next);

      // Assert
      const createCall = Session.create.mock.calls[0][0];
      expect(createCall.seats).toHaveLength(16);
      expect(createCall.seats[0]).toEqual({
        row: 'A',
        number: 1,
        status: 'available'
      });
    });

    it('TC15 - Deve tratar erro na criação', async () => {
      // Arrange
      req.body = {
        movie: 'movie123',
        theater: 'theater456',
        datetime: '2025-12-25T18:00:00',
        fullPrice: 25,
        halfPrice: 12.5
      };
      
      const mockError = new Error('Database error');
      Movie.findById.mockRejectedValue(mockError);

      // Act
      await createSession(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('updateSession', () => {

    it('TC16 - Deve atualizar sessão existente', async () => {
      // Arrange
      req.params.id = 'session123';
      req.body = { fullPrice: 30, halfPrice: 15 };
      
      const mockSession = { _id: 'session123' };
      const mockUpdatedSession = { _id: 'session123', fullPrice: 30, halfPrice: 15 };
      
      Session.findById.mockResolvedValue(mockSession);
      Session.findByIdAndUpdate.mockResolvedValue(mockUpdatedSession);

      // Act
      await updateSession(req, res, next);

      // Assert
      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        req.body,
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedSession
      });
    });

    it('TC17 - Deve retornar 404 para sessão inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      req.body = { fullPrice: 30 };
      
      Session.findById.mockResolvedValue(null);

      // Act
      await updateSession(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found'
      });
    });

    it('TC18 - Deve remover campo seats do body', async () => {
      // Arrange
      req.params.id = 'session123';
      req.body = { fullPrice: 30, seats: ['invalid'] };
      
      const mockSession = { _id: 'session123' };
      
      Session.findById.mockResolvedValue(mockSession);
      Session.findByIdAndUpdate.mockResolvedValue({ _id: 'session123' });

      // Act
      await updateSession(req, res, next);

      // Assert
      expect(Session.findByIdAndUpdate).toHaveBeenCalledWith(
        'session123',
        { fullPrice: 30 }, // sem seats
        { new: true, runValidators: true }
      );
    });

    it('TC19 - Deve tratar erro na atualização', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockError = new Error('Database error');
      
      Session.findById.mockRejectedValue(mockError);

      // Act
      await updateSession(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('deleteSession', () => {

    it('TC20 - Deve deletar sessão existente', async () => {
      // Arrange
      req.params.id = 'session123';
      
      const mockSession = {
        _id: 'session123',
        deleteOne: jest.fn().mockResolvedValue()
      };
      
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await deleteSession(req, res, next);

      // Assert
      expect(mockSession.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Session removed'
      });
    });

    it('TC21 - Deve retornar 404 para sessão inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      
      Session.findById.mockResolvedValue(null);

      // Act
      await deleteSession(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found'
      });
    });

    it('TC22 - Deve tratar erro na deleção', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockError = new Error('Database error');
      
      Session.findById.mockRejectedValue(mockError);

      // Act
      await deleteSession(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('resetSessionSeats', () => {

    it('TC23 - Deve resetar assentos para disponível', async () => {
      // Arrange
      req.params.id = 'session123';
      
      const mockSession = {
        _id: 'session123',
        seats: [
          { row: 'A', number: 1, status: 'occupied' },
          { row: 'A', number: 2, status: 'reserved' }
        ],
        save: jest.fn().mockResolvedValue()
      };
      
      Session.findById.mockResolvedValue(mockSession);

      // Act
      await resetSessionSeats(req, res, next);

      // Assert
      expect(mockSession.seats[0].status).toBe('available');
      expect(mockSession.seats[1].status).toBe('available');
      expect(mockSession.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'All seats reset to available status',
        data: mockSession
      });
    });

    it('TC24 - Deve retornar 404 para sessão inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      
      Session.findById.mockResolvedValue(null);

      // Act
      await resetSessionSeats(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session not found'
      });
    });

    it('TC25 - Deve tratar erro no reset', async () => {
      // Arrange
      req.params.id = 'session123';
      const mockError = new Error('Database error');
      
      Session.findById.mockRejectedValue(mockError);

      // Act
      await resetSessionSeats(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

});