const {
  getTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater
} = require('../../../src/controllers/theaterController');
const { Theater } = require('../../../src/models');

// Mock dos models
jest.mock('../../../src/models', () => ({
  Theater: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
}));

describe('TheaterController - Testes Unitários', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {}
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    
    // Limpar todos os mocks
    jest.clearAllMocks();
  });

  describe('getTheaters', () => {

    it('TC01 - Deve retornar lista de teatros', async () => {
      // Arrange
      const mockTheaters = [
        { _id: 'theater1', name: 'Sala 1', capacity: 100, type: 'standard' },
        { _id: 'theater2', name: 'Sala IMAX', capacity: 200, type: 'IMAX' }
      ];
      Theater.find.mockResolvedValue(mockTheaters);

      // Act
      await getTheaters(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockTheaters
      });
    });

    it('TC02 - Deve retornar lista vazia quando não há teatros', async () => {
      // Arrange
      Theater.find.mockResolvedValue([]);

      // Act
      await getTheaters(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('TC03 - Deve chamar Theater.find', async () => {
      // Arrange
      Theater.find.mockResolvedValue([]);

      // Act
      await getTheaters(req, res, next);

      // Assert
      expect(Theater.find).toHaveBeenCalledWith();
    });

    it('TC04 - Deve tratar erros de banco de dados', async () => {
      // Arrange
      const mockError = new Error('Database error');
      Theater.find.mockRejectedValue(mockError);

      // Act
      await getTheaters(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('TC05 - Deve retornar resposta com estrutura correta', async () => {
      // Arrange
      const mockTheaters = [{ _id: 'theater1', name: 'Sala 1' }];
      Theater.find.mockResolvedValue(mockTheaters);

      // Act
      await getTheaters(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          count: expect.any(Number),
          data: expect.any(Array)
        })
      );
    });

  });

  describe('getTheaterById', () => {

    it('TC06 - Deve retornar teatro encontrado', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockTheater = {
        _id: 'theater123',
        name: 'Sala 1',
        capacity: 100,
        type: 'standard',
        sessions: []
      };
      
      const mockChain = {
        populate: jest.fn().mockResolvedValue(mockTheater)
      };
      Theater.findById.mockReturnValue(mockChain);

      // Act
      await getTheaterById(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTheater
      });
    });

    it('TC07 - Deve chamar Theater.findById com ID correto', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'theater123' })
      };
      Theater.findById.mockReturnValue(mockChain);

      // Act
      await getTheaterById(req, res, next);

      // Assert
      expect(Theater.findById).toHaveBeenCalledWith('theater123');
    });

    it('TC08 - Deve popular sessions', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockChain = {
        populate: jest.fn().mockResolvedValue({ _id: 'theater123' })
      };
      Theater.findById.mockReturnValue(mockChain);

      // Act
      await getTheaterById(req, res, next);

      // Assert
      expect(mockChain.populate).toHaveBeenCalledWith('sessions');
    });

    it('TC09 - Deve retornar 404 para teatro inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      const mockChain = {
        populate: jest.fn().mockResolvedValue(null)
      };
      Theater.findById.mockReturnValue(mockChain);

      // Act
      await getTheaterById(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Theater not found'
      });
    });

    it('TC10 - Deve tratar erro na busca', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockError = new Error('Database error');
      const mockChain = {
        populate: jest.fn().mockRejectedValue(mockError)
      };
      Theater.findById.mockReturnValue(mockChain);

      // Act
      await getTheaterById(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('createTheater', () => {

    it('TC11 - Deve criar teatro com dados válidos', async () => {
      // Arrange
      req.body = {
        name: 'Sala Nova',
        capacity: 150,
        type: 'standard'
      };
      const mockTheater = { _id: 'theater123', ...req.body };
      Theater.create.mockResolvedValue(mockTheater);

      // Act
      await createTheater(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTheater
      });
    });

    it('TC12 - Deve chamar Theater.create com dados corretos', async () => {
      // Arrange
      req.body = {
        name: 'Sala Nova',
        capacity: 150,
        type: 'IMAX'
      };
      Theater.create.mockResolvedValue({ _id: 'theater123' });

      // Act
      await createTheater(req, res, next);

      // Assert
      expect(Theater.create).toHaveBeenCalledWith(req.body);
    });

    it('TC13 - Deve tratar erro de validação', async () => {
      // Arrange
      req.body = { name: 'Sala' }; // Dados incompletos
      const mockError = new Error('Validation error');
      Theater.create.mockRejectedValue(mockError);

      // Act
      await createTheater(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('TC14 - Deve tratar erro de nome duplicado', async () => {
      // Arrange
      req.body = {
        name: 'Sala Existente',
        capacity: 100,
        type: 'standard'
      };
      const duplicateError = new Error('Duplicate key');
      duplicateError.code = 11000;
      Theater.create.mockRejectedValue(duplicateError);

      // Act
      await createTheater(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(duplicateError);
    });

    it('TC15 - Deve retornar status 201 para criação bem-sucedida', async () => {
      // Arrange
      req.body = {
        name: 'Sala VIP',
        capacity: 50,
        type: 'VIP'
      };
      Theater.create.mockResolvedValue({ _id: 'theater123' });

      // Act
      await createTheater(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
    });

  });

  describe('updateTheater', () => {

    it('TC16 - Deve atualizar teatro existente', async () => {
      // Arrange
      req.params.id = 'theater123';
      req.body = {
        name: 'Sala Atualizada',
        capacity: 180
      };
      const mockExistingTheater = { _id: 'theater123', name: 'Sala Antiga' };
      const mockUpdatedTheater = { _id: 'theater123', ...req.body };
      
      Theater.findById.mockResolvedValue(mockExistingTheater);
      Theater.findByIdAndUpdate.mockResolvedValue(mockUpdatedTheater);

      // Act
      await updateTheater(req, res, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUpdatedTheater
      });
    });

    it('TC17 - Deve verificar se teatro existe antes de atualizar', async () => {
      // Arrange
      req.params.id = 'theater123';
      req.body = { name: 'Nova Sala' };
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Theater.findByIdAndUpdate.mockResolvedValue({ _id: 'theater123' });

      // Act
      await updateTheater(req, res, next);

      // Assert
      expect(Theater.findById).toHaveBeenCalledWith('theater123');
    });

    it('TC18 - Deve chamar Theater.findByIdAndUpdate com opções corretas', async () => {
      // Arrange
      req.params.id = 'theater123';
      req.body = { capacity: 200 };
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Theater.findByIdAndUpdate.mockResolvedValue({ _id: 'theater123' });

      // Act
      await updateTheater(req, res, next);

      // Assert
      expect(Theater.findByIdAndUpdate).toHaveBeenCalledWith(
        'theater123',
        req.body,
        { new: true, runValidators: true }
      );
    });

    it('TC19 - Deve retornar 404 para teatro inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      req.body = { name: 'Sala' };
      Theater.findById.mockResolvedValue(null);

      // Act
      await updateTheater(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Theater not found'
      });
    });

    it('TC20 - Deve tratar erro na atualização', async () => {
      // Arrange
      req.params.id = 'theater123';
      req.body = { name: 'Sala' };
      const mockError = new Error('Update error');
      Theater.findById.mockResolvedValue({ _id: 'theater123' });
      Theater.findByIdAndUpdate.mockRejectedValue(mockError);

      // Act
      await updateTheater(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

  });

  describe('deleteTheater', () => {

    it('TC21 - Deve deletar teatro existente', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockTheater = {
        _id: 'theater123',
        name: 'Sala para Deletar',
        deleteOne: jest.fn().mockResolvedValue()
      };
      Theater.findById.mockResolvedValue(mockTheater);

      // Act
      await deleteTheater(req, res, next);

      // Assert
      expect(mockTheater.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Theater removed'
      });
    });

    it('TC22 - Deve verificar se teatro existe antes de deletar', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockTheater = { deleteOne: jest.fn() };
      Theater.findById.mockResolvedValue(mockTheater);

      // Act
      await deleteTheater(req, res, next);

      // Assert
      expect(Theater.findById).toHaveBeenCalledWith('theater123');
    });

    it('TC23 - Deve retornar 404 para teatro inexistente', async () => {
      // Arrange
      req.params.id = 'nonexistent';
      Theater.findById.mockResolvedValue(null);

      // Act
      await deleteTheater(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Theater not found'
      });
    });

    it('TC24 - Deve tratar erro na deleção', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockError = new Error('Delete error');
      const mockTheater = {
        deleteOne: jest.fn().mockRejectedValue(mockError)
      };
      Theater.findById.mockResolvedValue(mockTheater);

      // Act
      await deleteTheater(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('TC25 - Deve chamar deleteOne no documento encontrado', async () => {
      // Arrange
      req.params.id = 'theater123';
      const mockTheater = {
        _id: 'theater123',
        deleteOne: jest.fn().mockResolvedValue()
      };
      Theater.findById.mockResolvedValue(mockTheater);

      // Act
      await deleteTheater(req, res, next);

      // Assert
      expect(mockTheater.deleteOne).toHaveBeenCalledWith();
    });

  });

});