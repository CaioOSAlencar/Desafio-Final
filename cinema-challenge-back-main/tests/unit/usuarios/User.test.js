const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../../src/models/User');

// Mock do bcrypt para testes unitários
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mockedSalt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('User Model - Testes Unitários Complementares', () => {

  describe('Schema de Usuário - Validações Específicas', () => {

    it('TC01 - Deve criar usuário com dados válidos completos', () => {
      // Arrange
      const validUserData = {
        name: 'João Silva Santos',
        email: 'joao.silva@empresa.com.br',
        password: 'minhaSenh@123',
        role: 'admin'
      };

      // Act
      const user = new User(validUserData);

      // Assert
      expect(user.name).toBe('João Silva Santos');
      expect(user.email).toBe('joao.silva@empresa.com.br');
      expect(user.password).toBe('minhaSenh@123');
      expect(user.role).toBe('admin');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('TC02 - Deve aplicar trim no nome', () => {
      // Arrange
      const userData = {
        name: '  João Silva  ',
        email: 'joao@teste.com',
        password: 'senha123'
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.name).toBe('João Silva');
    });

    it('TC03 - Deve converter email para lowercase', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'JOAO.SILVA@TESTE.COM',
        password: 'senha123'
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.email).toBe('joao.silva@teste.com');
    });

    it('TC04 - Deve aplicar trim no email', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: '  joao@teste.com  ',
        password: 'senha123'
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.email).toBe('joao@teste.com');
    });

    it('TC05 - Deve usar role padrão como user', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123'
        // role não especificado
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe('user');
    });

  });

  describe('Validações de Email', () => {

    it('TC06 - Deve validar formato de email válido', () => {
      // Arrange
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user123@example.org',
        'test@site.net'
      ];

      validEmails.forEach(email => {
        // Act
        const user = new User({
          name: 'Teste',
          email: email,
          password: 'senha123'
        });
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeFalsy();
      });
    });

    it('TC07 - Deve invalidar formato de email inválido', () => {
      // Arrange
      const invalidEmails = [
        'email-invalido',
        'email@',
        '@exemplo.com',
        'email.exemplo.com',
        'email@exemplo'
      ];

      invalidEmails.forEach(email => {
        // Act
        const user = new User({
          name: 'Teste',
          email: email,
          password: 'senha123'
        });
        const validationError = user.validateSync();

        // Assert
        expect(validationError.errors.email).toBeDefined();
        expect(validationError.errors.email.kind).toBe('regexp');
      });
    });

    it('TC08 - Deve rejeitar email vazio', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: '',
        password: 'senha123'
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.kind).toBe('required');
    });

    it('TC09 - Deve ter configuração unique para email', () => {
      // Arrange & Act
      const emailField = User.schema.paths.email;

      // Assert
      expect(emailField.options.unique).toBe(true);
    });

    it('TC10 - Deve aceitar emails com números', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao123@empresa.com',
        password: 'senha123'
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(user.email).toBe('joao123@empresa.com');
    });

  });

  describe('Validações de Password', () => {

    it('TC11 - Deve validar password com comprimento mínimo', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '12345' // Menos de 6 caracteres
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.kind).toBe('minlength');
    });

    it('TC12 - Deve aceitar password com 6 ou mais caracteres', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456' // Exatamente 6 caracteres
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError).toBeFalsy();
      expect(user.password).toBe('123456');
    });

    it('TC13 - Deve ter select: false para password', () => {
      // Arrange & Act
      const passwordField = User.schema.paths.password;

      // Assert
      expect(passwordField.options.select).toBe(false);
    });

    it('TC14 - Deve aceitar passwords complexos', () => {
      // Arrange
      const complexPasswords = [
        'MinhaSenh@123!',
        'P@ssw0rd_C0mpl3x0',
        'S3nh4-Sup3r-S3gur@!'
      ];

      complexPasswords.forEach(password => {
        // Act
        const user = new User({
          name: 'Teste',
          email: 'teste@exemplo.com',
          password: password
        });
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeFalsy();
      });
    });

    it('TC15 - Deve rejeitar password vazio', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: ''
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.kind).toBe('required');
    });

  });

  describe('Validações de Role', () => {

    it('TC16 - Deve aceitar todos os roles válidos do enum', () => {
      // Arrange
      const validRoles = ['user', 'admin'];

      validRoles.forEach(role => {
        // Act
        const user = new User({
          name: 'Teste',
          email: 'teste@exemplo.com',
          password: 'senha123',
          role: role
        });
        const validationError = user.validateSync();

        // Assert
        expect(validationError).toBeFalsy();
        expect(user.role).toBe(role);
      });
    });

    it('TC17 - Deve invalidar role não permitido', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
        role: 'superadmin' // Role inválido
      };

      // Act
      const user = new User(userData);
      const validationError = user.validateSync();

      // Assert
      expect(validationError.errors.role).toBeDefined();
      expect(validationError.errors.role.kind).toBe('enum');
    });

    it('TC18 - Deve ter enum correto para role', () => {
      // Arrange & Act
      const roleField = User.schema.paths.role;

      // Assert
      expect(roleField.enumValues).toEqual(['user', 'admin']);
    });

    it('TC19 - Deve preservar case sensitivity no role', () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123',
        role: 'admin'
      };

      // Act
      const user = new User(userData);

      // Assert
      expect(user.role).toBe('admin');
      expect(user.role).not.toBe('ADMIN');
    });

    it('TC20 - Deve usar default value correto para role', () => {
      // Arrange & Act
      const roleField = User.schema.paths.role;

      // Assert
      expect(roleField.defaultValue).toBe('user');
    });

  });

  describe('Middlewares e Métodos', () => {

    it('TC21 - Deve ter middleware pre save configurado', () => {
      // Arrange & Act
      const hooks = User.schema.s.hooks;

      // Assert
      expect(hooks).toBeDefined();
      expect(hooks._pres).toBeDefined();
    });

    it('TC22 - Deve ter método matchPassword definido', () => {
      // Arrange
      const user = new User({
        name: 'Teste',
        email: 'teste@exemplo.com',
        password: 'senha123'
      });

      // Act & Assert
      expect(user.matchPassword).toBeDefined();
      expect(typeof user.matchPassword).toBe('function');
    });

    it('TC23 - Método matchPassword deve retornar Promise', async () => {
      // Arrange
      const user = new User({
        name: 'Teste',
        email: 'teste@exemplo.com',
        password: 'senha123'
      });

      // Act
      const result = user.matchPassword('senha123');

      // Assert
      expect(result).toBeInstanceOf(Promise);
      expect(await result).toBe(true);
    });

    it('TC24 - Deve chamar bcrypt.compare no matchPassword', async () => {
      // Arrange
      const user = new User({
        name: 'Teste',
        email: 'teste@exemplo.com',
        password: 'hashedPassword'
      });
      bcrypt.compare.mockResolvedValue(true);

      // Act
      await user.matchPassword('senhaTestada');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('senhaTestada', 'hashedPassword');
    });

    it('TC25 - Deve ter timestamps habilitado no schema', () => {
      // Arrange
      const schemaOptions = User.schema.options;

      // Act & Assert
      expect(schemaOptions.timestamps).toBe(true);
    });

  });

});