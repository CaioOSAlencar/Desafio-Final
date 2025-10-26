const mongoose = require('mongoose');
const Theater = require('../../../src/models/Theater');

describe('Theater Model - Testes Unitários', () => {

  describe('Schema de Teatro', () => {

    it('TC01 - Deve criar teatro com dados válidos', () => {
      // Arrange
      const validTheaterData = {
        name: 'Sala Premium',
        capacity: 150,
        type: 'IMAX'
      };

      // Act
      const theater = new Theater(validTheaterData);

      // Assert
      expect(theater.name).toBe('Sala Premium');
      expect(theater.capacity).toBe(150);
      expect(theater.type).toBe('IMAX');
      expect(theater.createdAt).toBeInstanceOf(Date);
    });

    it('TC02 - Deve ter campos obrigatórios definidos', () => {
      // Arrange
      const theater = new Theater({});

      // Act
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.capacity).toBeDefined();
      // type tem valor padrão, então não é erro de validação obrigatório
    });

    it('TC03 - Deve validar nome como string obrigatória', () => {
      // Arrange
      const theaterData = {
        capacity: 100,
        type: 'standard'
        // name ausente
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.kind).toBe('required');
    });

    it('TC04 - Deve validar capacity como número obrigatório', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        type: 'standard'
        // capacity ausente
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.capacity).toBeDefined();
      expect(validationError.errors.capacity.kind).toBe('required');
    });

    it('TC05 - Deve usar valor padrão para type quando ausente', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100
        // type ausente - deve usar padrão
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(theater.type).toBe('standard');
    });

  });

  describe('Validações de Campo', () => {

    it('TC06 - Deve aplicar trim no nome', () => {
      // Arrange
      const theaterData = {
        name: '  Sala com Espaços  ',
        capacity: 100,
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.name).toBe('Sala com Espaços');
    });

    it('TC07 - Deve validar capacity mínima de 1', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 0, // Capacidade inválida
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.capacity).toBeDefined();
      expect(validationError.errors.capacity.kind).toBe('min');
    });

    it('TC08 - Deve aceitar capacity válida maior que 1', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 150,
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(theater.capacity).toBe(150);
    });

    it('TC09 - Deve validar enum de type', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'invalid_type' // Tipo inválido
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.type).toBeDefined();
      expect(validationError.errors.type.kind).toBe('enum');
    });

    it('TC10 - Deve aceitar todos os tipos válidos do enum', () => {
      // Arrange
      const validTypes = ['standard', '3D', 'IMAX', 'VIP'];

      validTypes.forEach(type => {
        // Act
        const theater = new Theater({
          name: `Sala ${type}`,
          capacity: 100,
          type: type
        });
        const validationError = theater.validateSync();

        // Assert
        expect(validationError).toBeFalsy();
        expect(theater.type).toBe(type);
      });
    });

  });

  describe('Valores Padrão', () => {

    it('TC11 - Deve definir type padrão como standard', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Padrão',
        capacity: 100
        // type não especificado
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.type).toBe('standard');
    });

    it('TC12 - Deve definir createdAt automaticamente', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'IMAX'
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.createdAt).toBeInstanceOf(Date);
      expect(theater.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('TC13 - Deve permitir sobrescrever createdAt se fornecido', () => {
      // Arrange
      const customDate = new Date('2023-01-01');
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'VIP',
        createdAt: customDate
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.createdAt).toEqual(customDate);
    });

    it('TC14 - Deve ter createdAt definido', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.createdAt).toBeDefined();
      // updatedAt só aparece após save
    });

    it('TC15 - Deve incluir virtuals no JSON', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);
      const json = theater.toJSON();

      // Assert
      expect(json.id).toBeDefined();
    });

  });

  describe('Configurações do Schema', () => {

    it('TC16 - Deve ter configuração de unique para name', () => {
      // Arrange & Act
      const nameField = Theater.schema.paths.name;

      // Assert
      expect(nameField.options.unique).toBe(true);
    });

    it('TC17 - Deve ter virtual populate para sessions', () => {
      // Arrange & Act
      const virtual = Theater.schema.virtuals.sessions;

      // Assert
      expect(virtual).toBeDefined();
      expect(virtual.options.ref).toBe('Session');
      expect(virtual.options.localField).toBe('_id');
      expect(virtual.options.foreignField).toBe('theater');
      expect(virtual.options.justOne).toBe(false);
    });

    it('TC18 - Deve incluir virtuals no toJSON', () => {
      // Arrange
      const schemaOptions = Theater.schema.options;

      // Act & Assert
      expect(schemaOptions.toJSON.virtuals).toBe(true);
    });

    it('TC19 - Deve incluir virtuals no toObject', () => {
      // Arrange
      const schemaOptions = Theater.schema.options;

      // Act & Assert
      expect(schemaOptions.toObject.virtuals).toBe(true);
    });

    it('TC20 - Deve ter timestamps habilitado', () => {
      // Arrange
      const schemaOptions = Theater.schema.options;

      // Act & Assert
      expect(schemaOptions.timestamps).toBe(true);
    });

  });

  describe('Validações Personalizadas', () => {

    it('TC21 - Deve rejeitar capacity negativa', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: -10,
        type: 'standard'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError.errors.capacity).toBeDefined();
      expect(validationError.errors.capacity.kind).toBe('min');
    });

    it('TC22 - Deve aceitar capacity como número inteiro', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 150,
        type: 'IMAX'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(Number.isInteger(theater.capacity)).toBe(true);
    });

    it('TC23 - Deve aceitar nome com caracteres especiais', () => {
      // Arrange
      const theaterData = {
        name: 'Sala VIP & Premium - 3D',
        capacity: 80,
        type: 'VIP'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(theater.name).toBe('Sala VIP & Premium - 3D');
    });

    it('TC24 - Deve preservar case sensitivity no type', () => {
      // Arrange
      const theaterData = {
        name: 'Sala Teste',
        capacity: 100,
        type: 'IMAX' // Case sensitive
      };

      // Act
      const theater = new Theater(theaterData);

      // Assert
      expect(theater.type).toBe('IMAX');
      expect(theater.type).not.toBe('imax');
    });

    it('TC25 - Deve permitir nomes longos', () => {
      // Arrange
      const longName = 'Sala Premium Ultra Luxo com Sistema de Som Dolby Atmos e Projeção Laser 4K HDR';
      const theaterData = {
        name: longName,
        capacity: 200,
        type: 'VIP'
      };

      // Act
      const theater = new Theater(theaterData);
      const validationError = theater.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(theater.name).toBe(longName);
    });

  });

});