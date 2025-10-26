// Testes unitários para modelo Reservation
// Testa validações, schemas e relacionamentos

const mongoose = require('mongoose');
const { Reservation } = require('../../../src/models');

describe('Reservation Model - Testes Unitários', () => {

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

  describe('Schema de Reserva', () => {

    it('TC01 - Deve criar reserva com dados válidos', () => {
      // Arrange
      const validReservationData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'half' }
        ],
        totalPrice: 35.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card',
        paymentDate: new Date()
      };

      // Act
      const reservation = new Reservation(validReservationData);

      // Assert
      expect(reservation.user).toEqual(validReservationData.user);
      expect(reservation.session).toEqual(validReservationData.session);
      expect(reservation.seats).toHaveLength(2);
      expect(reservation.totalPrice).toBe(35.00);
      expect(reservation.status).toBe('confirmed');
      expect(reservation.paymentStatus).toBe('completed');
      expect(reservation.paymentMethod).toBe('credit_card');
      expect(reservation.paymentDate).toEqual(validReservationData.paymentDate);
    });

    it('TC02 - Deve ter campos obrigatórios definidos', () => {
      // Arrange
      const reservation = new Reservation({});

      // Act
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.user).toBeDefined();
      expect(validationError.errors.session).toBeDefined();
      expect(validationError.errors.seats).toBeDefined();
      expect(validationError.errors.totalPrice).toBeDefined();
      // status e paymentStatus têm valores padrão, então não são obrigatórios
      // expect(validationError.errors.status).toBeDefined();
      // expect(validationError.errors.paymentStatus).toBeDefined();
      // expect(validationError.errors.paymentMethod).toBeDefined();
    });

    it('TC03 - Deve validar referência do usuário como ObjectId', () => {
      // Arrange
      const invalidUserData = {
        user: 'invalid_object_id',
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidUserData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.user).toBeDefined();
      expect(validationError.errors.user.kind).toBe('ObjectId');
    });

    it('TC04 - Deve validar referência da sessão como ObjectId', () => {
      // Arrange
      const invalidSessionData = {
        user: new mongoose.Types.ObjectId(),
        session: 'invalid_session_id',
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidSessionData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.session).toBeDefined();
      expect(validationError.errors.session.kind).toBe('ObjectId');
    });

    it('TC05 - Deve validar array de assentos não vazio', () => {
      // Arrange
      const emptySeatsData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [], // Array vazio
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(emptySeatsData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.seats).toBeDefined();
    });

  });

  describe('Schema de Assentos', () => {

    it('TC06 - Deve validar estrutura de assento válida', () => {
      // Arrange
      const validSeatData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'B', number: 15, type: 'half' }
        ],
        totalPrice: 30.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(validSeatData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(reservation.seats[0].row).toBe('A');
      expect(reservation.seats[0].number).toBe(1);
      expect(reservation.seats[0].type).toBe('full');
      expect(reservation.seats[1].row).toBe('B');
      expect(reservation.seats[1].number).toBe(15);
      expect(reservation.seats[1].type).toBe('half');
    });

    it('TC07 - Deve validar campo row obrigatório', () => {
      // Arrange
      const invalidSeatData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { number: 1, type: 'full' } // Sem row
        ],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidSeatData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors['seats.0.row']).toBeDefined();
    });

    it('TC08 - Deve validar campo number obrigatório', () => {
      // Arrange
      const invalidSeatData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { row: 'A', type: 'full' } // Sem number
        ],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidSeatData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors['seats.0.number']).toBeDefined();
    });

    it('TC09 - Deve validar enum type de assento', () => {
      // Arrange
      const invalidTypeData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { row: 'A', number: 1, type: 'invalid_type' }
        ],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidTypeData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors['seats.0.type']).toBeDefined();
      expect(validationError.errors['seats.0.type'].kind).toBe('enum');
    });

    it('TC10 - Deve aceitar tipos válidos de assento', () => {
      // Arrange
      const validTypesData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [
          { row: 'A', number: 1, type: 'full' },
          { row: 'A', number: 2, type: 'half' }
        ],
        totalPrice: 30.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(validTypesData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(['full', 'half']).toContain(reservation.seats[0].type);
      expect(['full', 'half']).toContain(reservation.seats[1].type);
    });

  });

  describe('Validações de Preço', () => {

    it('TC11 - Deve validar preço como número positivo', () => {
      // Arrange
      const validPriceData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 25.50,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(validPriceData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(reservation.totalPrice).toBe(25.50);
    });

    it('TC12 - Deve rejeitar preço negativo', () => {
      // Arrange
      const negativePriceData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: -10.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(negativePriceData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.totalPrice).toBeDefined();
      expect(validationError.errors.totalPrice.kind).toBe('min');
    });

    it('TC13 - Deve aceitar preço zero (mínimo)', () => {
      // Arrange
      const zeroPriceData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 0,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(zeroPriceData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(reservation.totalPrice).toBe(0);
    });

  });

  describe('Validações de Status', () => {

    it('TC14 - Deve validar enum status da reserva', () => {
      // Arrange
      const validStatuses = ['pending', 'confirmed', 'cancelled'];
      
      for (const status of validStatuses) {
        const reservationData = {
          user: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          seats: [{ row: 'A', number: 1, type: 'full' }],
          totalPrice: 20.00,
          status: status,
          paymentStatus: 'completed',
          paymentMethod: 'credit_card'
        };

        // Act
        const reservation = new Reservation(reservationData);
        const validationError = reservation.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(reservation.status).toBe(status);
      }
    });

    it('TC15 - Deve rejeitar status inválido', () => {
      // Arrange
      const invalidStatusData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'invalid_status',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidStatusData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.status).toBeDefined();
      expect(validationError.errors.status.kind).toBe('enum');
    });

    it('TC16 - Deve validar enum paymentStatus', () => {
      // Arrange
      const validPaymentStatuses = ['pending', 'completed', 'failed']; // Sem 'refunded'
      
      for (const paymentStatus of validPaymentStatuses) {
        const reservationData = {
          user: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          seats: [{ row: 'A', number: 1, type: 'full' }],
          totalPrice: 20.00,
          status: 'confirmed',
          paymentStatus: paymentStatus,
          paymentMethod: 'credit_card'
        };

        // Act
        const reservation = new Reservation(reservationData);
        const validationError = reservation.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(reservation.paymentStatus).toBe(paymentStatus);
      }
    });

    it('TC17 - Deve rejeitar paymentStatus inválido', () => {
      // Arrange
      const invalidPaymentStatusData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'invalid_payment_status',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(invalidPaymentStatusData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.paymentStatus).toBeDefined();
      expect(validationError.errors.paymentStatus.kind).toBe('enum');
    });

  });

  describe('Validações de Pagamento', () => {

    it('TC18 - Deve validar enum paymentMethod', () => {
      // Arrange
      const validPaymentMethods = ['credit_card', 'debit_card', 'pix', 'bank_transfer']; // Sem 'cash'
      
      for (const paymentMethod of validPaymentMethods) {
        const reservationData = {
          user: new mongoose.Types.ObjectId(),
          session: new mongoose.Types.ObjectId(),
          seats: [{ row: 'A', number: 1, type: 'full' }],
          totalPrice: 20.00,
          status: 'confirmed',
          paymentStatus: 'completed',
          paymentMethod: paymentMethod
        };

        // Act
        const reservation = new Reservation(reservationData);
        const validationError = reservation.validateSync();

        // Assert
        expect(validationError).toBeUndefined();
        expect(reservation.paymentMethod).toBe(paymentMethod);
      }
    });

    it('TC19 - Deve rejeitar paymentMethod inválido', () => {
      // Arrange
      const invalidPaymentMethodData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'bitcoin' // método inválido
      };

      // Act
      const reservation = new Reservation(invalidPaymentMethodData);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError.errors.paymentMethod).toBeDefined();
      expect(validationError.errors.paymentMethod.kind).toBe('enum');
    });

    it('TC20 - paymentDate deve ser opcional', () => {
      // Arrange
      const reservationWithoutPaymentDate = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit_card'
        // Sem paymentDate
      };

      // Act
      const reservation = new Reservation(reservationWithoutPaymentDate);
      const validationError = reservation.validateSync();

      // Assert
      expect(validationError).toBeUndefined();
      expect(reservation.paymentDate).toBeUndefined();
    });

  });

  describe('Timestamps e Campos Default', () => {

    it('TC21 - Deve definir createdAt automaticamente', () => {
      // Arrange
      const reservationData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      };

      // Act
      const reservation = new Reservation(reservationData);

      // Assert
      expect(reservation.createdAt).toBeDefined();
      expect(reservation.createdAt).toBeInstanceOf(Date);
      // updatedAt é criado pelo timestamps, não diretamente no schema
    });

    it('TC22 - Deve ter status default como "pending"', () => {
      // Arrange
      const reservationData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        paymentStatus: 'pending',
        paymentMethod: 'credit_card'
        // Sem status definido
      };

      // Act
      const reservation = new Reservation(reservationData);

      // Assert
      expect(reservation.status).toBe('pending');
    });

    it('TC23 - Deve ter paymentStatus default como "pending"', () => {
      // Arrange
      const reservationData = {
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentMethod: 'credit_card'
        // Sem paymentStatus definido
      };

      // Act
      const reservation = new Reservation(reservationData);

      // Assert
      expect(reservation.paymentStatus).toBe('pending');
    });

  });

  describe('Relacionamentos e Populate', () => {

    it('TC24 - Deve referenciar User model corretamente', () => {
      // Arrange
      const reservation = new Reservation({
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      });

      // Act & Assert
      expect(reservation.schema.paths.user.instance).toBe('ObjectId');
      expect(reservation.schema.paths.user.options.ref).toBe('User');
      expect(reservation.schema.paths.user.options.required).toEqual([true, 'User is required']);
    });

    it('TC25 - Deve referenciar Session model corretamente', () => {
      // Arrange
      const reservation = new Reservation({
        user: new mongoose.Types.ObjectId(),
        session: new mongoose.Types.ObjectId(),
        seats: [{ row: 'A', number: 1, type: 'full' }],
        totalPrice: 20.00,
        status: 'confirmed',
        paymentStatus: 'completed',
        paymentMethod: 'credit_card'
      });

      // Act & Assert
      expect(reservation.schema.paths.session.instance).toBe('ObjectId');
      expect(reservation.schema.paths.session.options.ref).toBe('Session');
      expect(reservation.schema.paths.session.options.required).toEqual([true, 'Session is required']);
    });

  });

});