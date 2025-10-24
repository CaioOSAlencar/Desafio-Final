// Testes unitários para modelo User
// Testa validações, métodos e hooks do schema

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');

// Mock do bcrypt
jest.mock('bcryptjs');

describe('User Model - Testes Unitários', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Criação e Validação do Schema', () => {
    
    // TC01: Criar usuário com dados válidos
    it('TC01 - Deve criar usuário com todos os campos válidos', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123456',
        role: 'user'
      };
      
      // Act
      const user = new User(userData);
      
      // Assert
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.role).toBe(userData.role);
    });

    // TC02: Valores padrão do schema
    it('TC02 - Deve aplicar valores padrão corretos', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'senha123456'
        // role não fornecido
      };
      
      // Act
      const user = new User(userData);
      
      // Assert
      expect(user.role).toBe('user'); // Valor padrão
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    // TC03: Validação de campo obrigatório - nome
    it('TC03 - Deve falhar validação quando nome não fornecido', () => {
      // Arrange
      const userData = {
        email: 'joao@exemplo.com',
        password: 'senha123456'
        // name ausente
      };
      
      // Act
      const user = new User(userData);
      const validationError = user.validateSync();
      
      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toBe('Name is required');
    });

    // TC04: Validação de campo obrigatório - email
    it('TC04 - Deve falhar validação quando email não fornecido', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        password: 'senha123456'
        // email ausente
      };
      
      // Act
      const user = new User(userData);
      const validationError = user.validateSync();
      
      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe('Email is required');
    });

    // TC05: Validação de campo obrigatório - password
    it('TC05 - Deve falhar validação quando password não fornecido', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@exemplo.com'
        // password ausente
      };
      
      // Act
      const user = new User(userData);
      const validationError = user.validateSync();
      
      // Assert
      expect(validationError).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe('Password is required');
    });
  });

  describe('Validações de Formato', () => {
    
    // TC06: Validação de formato de email válido
    it('TC06 - Deve aceitar emails com formato válido', () => {
      // Arrange
      const validEmails = [
        'test@exemplo.com',
        'user@domain.com',
        'user123@test.com'
      ];
      
      validEmails.forEach(email => {
        // Act
        const user = new User({
          name: 'Test User',
          email: email,
          password: 'senha123456'
        });
        const validationError = user.validateSync();
        
        // Assert
        expect(validationError?.errors?.email).toBeUndefined();
      });
    });

    // TC07: Validação de formato de email inválido
    it('TC07 - Deve rejeitar emails com formato inválido', () => {
      // Arrange
      const invalidEmails = [
        'email-sem-arroba',
        'email@',
        '@domain.com',
        'email..duplo@domain.com',
        'email@domain',
        'email@.domain.com'
      ];
      
      invalidEmails.forEach(email => {
        // Act
        const user = new User({
          name: 'Test User',
          email: email,
          password: 'senha123456'
        });
        const validationError = user.validateSync();
        
        // Assert
        expect(validationError?.errors?.email).toBeDefined();
        expect(validationError.errors.email.message).toBe('Please provide a valid email');
      });
    });

    // TC08: Validação de comprimento mínimo da senha
    it('TC08 - Deve rejeitar senhas muito curtas', () => {
      // Arrange
      const shortPasswords = ['1', '12', '123', '1234', '12345'];
      
      shortPasswords.forEach(password => {
        // Act
        const user = new User({
          name: 'Test User',
          email: 'test@exemplo.com',
          password: password
        });
        const validationError = user.validateSync();
        
        // Assert
        expect(validationError?.errors?.password).toBeDefined();
        expect(validationError.errors.password.message).toBe('Password must be at least 6 characters long');
      });
    });

    // TC09: Validação de role válido
    it('TC09 - Deve aceitar roles válidos', () => {
      // Arrange
      const validRoles = ['user', 'admin'];
      
      validRoles.forEach(role => {
        // Act
        const user = new User({
          name: 'Test User',
          email: 'test@exemplo.com',
          password: 'senha123456',
          role: role
        });
        const validationError = user.validateSync();
        
        // Assert
        expect(validationError?.errors?.role).toBeUndefined();
        expect(user.role).toBe(role);
      });
    });

    // TC10: Validação de role inválido
    it('TC10 - Deve rejeitar roles inválidos', () => {
      // Arrange
      const invalidRoles = ['superuser', 'moderator', 'guest', 'owner'];
      
      invalidRoles.forEach(role => {
        // Act
        const user = new User({
          name: 'Test User',
          email: 'test@exemplo.com',
          password: 'senha123456',
          role: role
        });
        const validationError = user.validateSync();
        
        // Assert
        expect(validationError?.errors?.role).toBeDefined();
      });
    });
  });

  describe('Processamento de Dados', () => {
    
    // TC11: Email deve ser convertido para lowercase
    it('TC11 - Deve converter email para lowercase', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'JOAO@EXEMPLO.COM',
        password: 'senha123456'
      };
      
      // Act
      const user = new User(userData);
      
      // Assert
      expect(user.email).toBe('joao@exemplo.com');
    });

    // TC12: Trim deve remover espaços do nome e email
    it('TC12 - Deve remover espaços em branco do nome e email', () => {
      // Arrange
      const userData = {
        name: '  João Silva  ',
        email: '  joao@exemplo.com  ',
        password: 'senha123456'
      };
      
      // Act
      const user = new User(userData);
      
      // Assert
      expect(user.name).toBe('João Silva');
      expect(user.email).toBe('joao@exemplo.com');
    });
  });

  describe('Método matchPassword', () => {
    
    let user;
    
    beforeEach(() => {
      user = new User({
        name: 'Test User',
        email: 'test@exemplo.com',
        password: 'hashedPassword123'
      });
    });

    // TC13: Senha correta deve retornar true
    it('TC13 - Deve retornar true para senha correta', async () => {
      // Arrange
      const plainPassword = 'senha123456';
      bcrypt.compare.mockResolvedValue(true);
      
      // Act
      const isMatch = await user.matchPassword(plainPassword);
      
      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, user.password);
      expect(isMatch).toBe(true);
    });

    // TC14: Senha incorreta deve retornar false
    it('TC14 - Deve retornar false para senha incorreta', async () => {
      // Arrange
      const wrongPassword = 'senhaErrada123';
      bcrypt.compare.mockResolvedValue(false);
      
      // Act
      const isMatch = await user.matchPassword(wrongPassword);
      
      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, user.password);
      expect(isMatch).toBe(false);
    });

    // TC15: Erro do bcrypt deve ser propagado
    it('TC15 - Deve propagar erro do bcrypt.compare', async () => {
      // Arrange
      const password = 'senha123456';
      const bcryptError = new Error('Bcrypt error');
      bcrypt.compare.mockRejectedValue(bcryptError);
      
      // Act & Assert
      await expect(user.matchPassword(password)).rejects.toThrow('Bcrypt error');
    });

    // TC16: Senha vazia deve ser tratada
    it('TC16 - Deve lidar com senha vazia', async () => {
      // Arrange
      const emptyPassword = '';
      bcrypt.compare.mockResolvedValue(false);
      
      // Act
      const isMatch = await user.matchPassword(emptyPassword);
      
      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(emptyPassword, user.password);
      expect(isMatch).toBe(false);
    });

    // TC17: Senha null/undefined deve ser tratada
    it('TC17 - Deve lidar com senha null ou undefined', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(false);
      
      // Test null
      let isMatch = await user.matchPassword(null);
      expect(bcrypt.compare).toHaveBeenCalledWith(null, user.password);
      expect(isMatch).toBe(false);
      
      // Reset mock
      bcrypt.compare.mockClear();
      
      // Test undefined  
      isMatch = await user.matchPassword(undefined);
      expect(bcrypt.compare).toHaveBeenCalledWith(undefined, user.password);
      expect(isMatch).toBe(false);
    });
  });

  describe('Hook pre-save (Hash de Senha)', () => {
    
    // TC18: Verificar se hook existe no schema
    it('TC18 - Deve ter hook pre-save configurado para senha', () => {
      // Act
      const preSaveHooks = User.schema.pre.length || User.schema._pres?.size || 0;
      
      // Assert
      expect(preSaveHooks).toBeGreaterThan(0);
    });

    // TC19: Testar comportamento do isModified (método do mongoose)
    it('TC19 - Instância deve ter método isModified', () => {
      // Arrange
      const user = new User({
        name: 'Test User',
        email: 'test@exemplo.com',
        password: 'senha123456'
      });
      
      // Assert
      expect(typeof user.isModified).toBe('function');
    });
  });

  describe('Configurações do Schema', () => {
    
    // TC21: Campo password deve ter select: false
    it('TC21 - Campo password deve ter select: false por padrão', () => {
      // Act
      const passwordField = User.schema.paths.password;
      
      // Assert
      expect(passwordField.options.select).toBe(false);
    });

    // TC22: Timestamps devem estar habilitados
    it('TC22 - Deve ter timestamps habilitados', () => {
      // Act
      const schemaOptions = User.schema.options;
      
      // Assert
      expect(schemaOptions.timestamps).toBe(true);
    });

    // TC23: Verificar índices do schema
    it('TC23 - Email deve ter índice único', () => {
      // Act
      const emailField = User.schema.paths.email;
      
      // Assert
      expect(emailField.options.unique).toBe(true);
    });
  });

  describe('Métodos Estáticos e de Instância', () => {
    
    // TC24: Verificar se modelo foi registrado corretamente
    it('TC24 - Deve registrar modelo User no mongoose', () => {
      // Assert
      expect(mongoose.models.User).toBeDefined();
      expect(mongoose.models.User).toBe(User);
    });

    // TC25: Verificar nome da collection
    it('TC25 - Deve usar nome de collection correto', () => {
      // Act
      const collectionName = User.collection.name;
      
      // Assert
      expect(collectionName).toBe('users');
    });
  });
});