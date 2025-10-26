// Testes unitários para modelo Session
// Testa validações, schemas e relacionamentos

const mongoose = require('mongoose');
const { Session } = require('../../../src/models');

describe('Session Model - Testes Unitários', () => {

  beforeAll(() => {
    // Configuração do mongoose para testes
    if (mongoose.connection.readyState === 0) {
      mongoose.connect('mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  afterAll(async () => {
    // Limpeza após os testes
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    // Reset para cada teste
    jest.clearAllMocks();
  });

  describe('Schema de Sessão', () => {

    it('TC01 - Deve criar sessão com dados válidos', () => {
      // Arrange
      const validSessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date('2025-12-25T18:00:00'),
        fullPrice: 25.00,
        halfPrice: 12.50,
        seats: [
          { row: 'A', number: 1, status: 'available' },
          { row: 'A', number: 2, status: 'available' }
        ]
      };

      // Act
      const session = new Session(validSessionData);

      // Assert
      expect(session.movie).toEqual(validSessionData.movie);
      expect(session.theater).toEqual(validSessionData.theater);
      expect(session.datetime).toEqual(validSessionData.datetime);
      expect(session.fullPrice).toBe(25.00);
      expect(session.halfPrice).toBe(12.50);
      expect(session.seats).toHaveLength(2);
    });

    it('TC02 - Deve ter campos obrigatórios definidos', () => {
      // Arrange
      const session = new Session({});

      // Act
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors.movie).toBeDefined();
      expect(validationError.errors.theater).toBeDefined();
      expect(validationError.errors.datetime).toBeDefined();
      expect(validationError.errors.fullPrice).toBeDefined();
      expect(validationError.errors.halfPrice).toBeDefined();
    });

    it('TC03 - Deve validar referência do filme como ObjectId', () => {
      // Arrange
      const invalidMovieData = {
        movie: 'invalid_object_id',
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(invalidMovieData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors.movie).toBeDefined();
      expect(validationError.errors.movie.kind).toBe('ObjectId');
    });

    it('TC04 - Deve validar referência do teatro como ObjectId', () => {
      // Arrange
      const invalidTheaterData = {
        movie: new mongoose.Types.ObjectId(),
        theater: 'invalid_theater_id',
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(invalidTheaterData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors.theater).toBeDefined();
      expect(validationError.errors.theater.kind).toBe('ObjectId');
    });

    it('TC05 - Deve validar datetime como Date', () => {
      // Arrange
      const validSessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: '2025-12-25T18:00:00Z', // String ISO válida
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(validSessionData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(session.datetime).toBeInstanceOf(Date);
    });

  });

  describe('Schema de Assentos', () => {

    it('TC06 - Deve validar estrutura de assento válida', () => {
      // Arrange
      const validSessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', number: 1, status: 'available' },
          { row: 'B', number: 15, status: 'reserved' },
          { row: 'C', number: 8, status: 'occupied' }
        ]
      };

      // Act
      const session = new Session(validSessionData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(session.seats[0].row).toBe('A');
      expect(session.seats[0].number).toBe(1);
      expect(session.seats[0].status).toBe('available');
      expect(session.seats[1].status).toBe('reserved');
      expect(session.seats[2].status).toBe('occupied');
    });

    it('TC07 - Deve validar campo row obrigatório', () => {
      // Arrange
      const invalidSeatData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { number: 1, status: 'available' } // Sem row
        ]
      };

      // Act
      const session = new Session(invalidSeatData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors['seats.0.row']).toBeDefined();
    });

    it('TC08 - Deve validar campo number obrigatório', () => {
      // Arrange
      const invalidSeatData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', status: 'available' } // Sem number
        ]
      };

      // Act
      const session = new Session(invalidSeatData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors['seats.0.number']).toBeDefined();
    });

    it('TC09 - Deve validar enum status de assento', () => {
      // Arrange
      const invalidStatusData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', number: 1, status: 'invalid_status' }
        ]
      };

      // Act
      const session = new Session(invalidStatusData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors['seats.0.status']).toBeDefined();
      expect(validationError.errors['seats.0.status'].kind).toBe('enum');
    });

    it('TC10 - Deve aceitar status válidos de assento', () => {
      // Arrange
      const validStatusData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', number: 1, status: 'available' },
          { row: 'A', number: 2, status: 'reserved' },
          { row: 'A', number: 3, status: 'occupied' }
        ]
      };

      // Act
      const session = new Session(validStatusData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(['available', 'reserved', 'occupied']).toContain(session.seats[0].status);
      expect(['available', 'reserved', 'occupied']).toContain(session.seats[1].status);
      expect(['available', 'reserved', 'occupied']).toContain(session.seats[2].status);
    });

    it('TC11 - Deve ter status padrão como "available"', () => {
      // Arrange
      const sessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [
          { row: 'A', number: 1 } // Sem status
        ]
      };

      // Act
      const session = new Session(sessionData);

      // Assert
      expect(session.seats[0].status).toBe('available');
    });

  });

  describe('Validações de Preço', () => {

    it('TC12 - Deve validar preços como números positivos', () => {
      // Arrange
      const validPriceData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25.50,
        halfPrice: 12.75,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(validPriceData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(session.fullPrice).toBe(25.50);
      expect(session.halfPrice).toBe(12.75);
    });

    it('TC13 - Deve rejeitar fullPrice negativo', () => {
      // Arrange
      const negativePriceData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: -10.00,
        halfPrice: 5.00,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(negativePriceData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors.fullPrice).toBeDefined();
      expect(validationError.errors.fullPrice.kind).toBe('min');
    });

    it('TC14 - Deve rejeitar halfPrice negativo', () => {
      // Arrange
      const negativePriceData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 20.00,
        halfPrice: -5.00,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(negativePriceData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError.errors.halfPrice).toBeDefined();
      expect(validationError.errors.halfPrice.kind).toBe('min');
    });

    it('TC15 - Deve aceitar preço zero', () => {
      // Arrange
      const zeroPriceData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 0,
        halfPrice: 0,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(zeroPriceData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(session.fullPrice).toBe(0);
      expect(session.halfPrice).toBe(0);
    });

  });

  describe('Timestamps e Campos Default', () => {

    it('TC16 - Deve definir createdAt automaticamente', () => {
      // Arrange
      const sessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(sessionData);

      // Assert
      expect(session.createdAt).toBeDefined();
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('TC17 - Deve incluir timestamps do mongoose', () => {
      // Arrange
      const sessionData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      };

      // Act
      const session = new Session(sessionData);

      // Assert
      // timestamps: true no schema cria createdAt e updatedAt automaticamente
      expect(session.schema.options.timestamps).toBe(true);
    });

    it('TC18 - Deve ter virtual populate configurado', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Assert
      const virtualReservations = session.schema.virtuals.reservations;
      expect(virtualReservations).toBeDefined();
      expect(virtualReservations.options.ref).toBe('Reservation');
      expect(virtualReservations.options.localField).toBe('_id');
      expect(virtualReservations.options.foreignField).toBe('session');
    });

  });

  describe('Relacionamentos e Populate', () => {

    it('TC19 - Deve referenciar Movie model corretamente', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      expect(session.schema.paths.movie.instance).toBe('ObjectId');
      expect(session.schema.paths.movie.options.ref).toBe('Movie');
      expect(session.schema.paths.movie.options.required).toEqual([true, 'Movie is required']);
    });

    it('TC20 - Deve referenciar Theater model corretamente', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      expect(session.schema.paths.theater.instance).toBe('ObjectId');
      expect(session.schema.paths.theater.options.ref).toBe('Theater');
      expect(session.schema.paths.theater.options.required).toEqual([true, 'Theater is required']);
    });

    it('TC21 - Deve ter índices configurados', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      const indexes = session.schema.indexes();
      expect(indexes).toEqual(
        expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({
              movie: 1,
              theater: 1,
              datetime: 1
            })
          ])
        ])
      );
    });

  });

  describe('Configurações do Schema', () => {

    it('TC22 - Deve ter toJSON configurado com virtuals', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      expect(session.schema.options.toJSON.virtuals).toBe(true);
    });

    it('TC23 - Deve ter toObject configurado com virtuals', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      expect(session.schema.options.toObject.virtuals).toBe(true);
    });

    it('TC24 - Deve não incluir _id nos subdocumentos de assentos', () => {
      // Arrange
      const session = new Session({
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [{ row: 'A', number: 1, status: 'available' }]
      });

      // Act & Assert
      expect(session.seats[0]._id).toBeUndefined();
    });

    it('TC25 - Deve permitir array de assentos vazio inicialmente', () => {
      // Arrange
      const emptySeatsData = {
        movie: new mongoose.Types.ObjectId(),
        theater: new mongoose.Types.ObjectId(),
        datetime: new Date(),
        fullPrice: 25,
        halfPrice: 12.5,
        seats: [] // Array vazio pode ser permitido inicialmente
      };

      // Act
      const session = new Session(emptySeatsData);
      const validationError = session.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(session.seats).toHaveLength(0);
    });

  });

});