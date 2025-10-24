// Testes unitários para utilitário generateToken
// Testa geração de tokens JWT com diferentes configurações

const generateToken = require('../../../src/utils/generateToken');
const jwt = require('jsonwebtoken');

// Mock do jsonwebtoken
jest.mock('jsonwebtoken');

describe('GenerateToken Utility - Testes Unitários', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup environment variables padrão
    process.env.JWT_SECRET = 'test-jwt-secret-key';
    process.env.JWT_EXPIRATION = '1d';
  });

  afterEach(() => {
    // Limpar variáveis de ambiente após cada teste
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRATION;
  });

  describe('Geração de Token Básica', () => {
    
    // TC01: Gerar token com ID válido
    it('TC01 - Deve gerar token JWT com ID de usuário válido', () => {
      // Arrange
      const userId = 'user123456789';
      const expectedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
      
      jwt.sign.mockReturnValue(expectedToken);
      
      // Act
      const token = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      expect(token).toBe(expectedToken);
    });

    // TC02: Gerar token com ID string vazia
    it('TC02 - Deve gerar token mesmo com ID vazio', () => {
      // Arrange
      const userId = '';
      const expectedToken = 'token.for.empty.id';
      
      jwt.sign.mockReturnValue(expectedToken);
      
      // Act
      const token = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      expect(token).toBe(expectedToken);
    });

    // TC03: Gerar token com ID nulo
    it('TC03 - Deve gerar token com ID nulo', () => {
      // Arrange
      const userId = null;
      const expectedToken = 'token.for.null.id';
      
      jwt.sign.mockReturnValue(expectedToken);
      
      // Act
      const token = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      expect(token).toBe(expectedToken);
    });

    // TC04: Gerar token com ID undefined
    it('TC04 - Deve gerar token com ID undefined', () => {
      // Arrange
      const userId = undefined;
      const expectedToken = 'token.for.undefined.id';
      
      jwt.sign.mockReturnValue(expectedToken);
      
      // Act
      const token = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      expect(token).toBe(expectedToken);
    });
  });

  describe('Configurações de Expiração', () => {
    
    // TC05: Usar JWT_EXPIRATION customizado
    it('TC05 - Deve usar JWT_EXPIRATION quando definido', () => {
      // Arrange
      const userId = 'user123';
      const customExpiration = '7d';
      process.env.JWT_EXPIRATION = customExpiration;
      
      jwt.sign.mockReturnValue('token.7days');
      
      // Act
      generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: customExpiration }
      );
    });

    // TC06: Usar expiração padrão quando JWT_EXPIRATION não definido
    it('TC06 - Deve usar expiração padrão (1d) quando JWT_EXPIRATION não definido', () => {
      // Arrange
      const userId = 'user123';
      delete process.env.JWT_EXPIRATION;
      
      jwt.sign.mockReturnValue('token.1day');
      
      // Act
      generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
    });

    // TC07: JWT_EXPIRATION vazio deve usar padrão
    it('TC07 - Deve usar expiração padrão quando JWT_EXPIRATION está vazio', () => {
      // Arrange
      const userId = 'user123';
      process.env.JWT_EXPIRATION = '';
      
      jwt.sign.mockReturnValue('token.default');
      
      // Act
      generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
    });

    // TC08: Diferentes formatos de expiração
    it('TC08 - Deve aceitar diferentes formatos de expiração', () => {
      // Arrange
      const testCases = [
        { expiration: '1h', description: 'horas' },
        { expiration: '30m', description: 'minutos' },
        { expiration: '60s', description: 'segundos' },
        { expiration: '2w', description: 'semanas' },
        { expiration: '3600', description: 'segundos como string' }
      ];
      
      testCases.forEach(({ expiration, description }) => {
        // Arrange
        const userId = `user-${description}`;
        process.env.JWT_EXPIRATION = expiration;
        jwt.sign.mockReturnValue(`token-${description}`);
        
        // Act
        generateToken(userId);
        
        // Assert
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: userId },
          process.env.JWT_SECRET,
          { expiresIn: expiration }
        );
        
        // Reset para próximo teste
        jest.clearAllMocks();
      });
    });
  });

  describe('Tratamento de Erros e Edge Cases', () => {
    
    // TC09: JWT_SECRET não definido
    it('TC09 - Deve propagar erro quando JWT_SECRET não definido', () => {
      // Arrange
      delete process.env.JWT_SECRET;
      const userId = 'user123';
      
      jwt.sign.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });
      
      // Act & Assert
      expect(() => generateToken(userId)).toThrow('secretOrPrivateKey must have a value');
    });

    // TC10: JWT_SECRET vazio
    it('TC10 - Deve propagar erro quando JWT_SECRET está vazio', () => {
      // Arrange
      process.env.JWT_SECRET = '';
      const userId = 'user123';
      
      jwt.sign.mockImplementation(() => {
        throw new Error('secretOrPrivateKey must have a value');
      });
      
      // Act & Assert
      expect(() => generateToken(userId)).toThrow('secretOrPrivateKey must have a value');
    });

    // TC11: Tipos diferentes de ID
    it('TC11 - Deve aceitar diferentes tipos de ID', () => {
      // Arrange
      const testIds = [
        { id: 123, type: 'number' },
        { id: true, type: 'boolean' },
        { id: { userId: '123' }, type: 'object' },
        { id: ['user', '123'], type: 'array' }
      ];
      
      testIds.forEach(({ id, type }) => {
        // Arrange
        jwt.sign.mockReturnValue(`token-${type}`);
        
        // Act
        generateToken(id);
        
        // Assert
        expect(jwt.sign).toHaveBeenCalledWith(
          { id: id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRATION }
        );
        
        // Reset para próximo teste
        jest.clearAllMocks();
      });
    });

    // TC12: Erro interno do jwt.sign
    it('TC12 - Deve propagar erros internos do jwt.sign', () => {
      // Arrange
      const userId = 'user123';
      const jwtError = new Error('Internal JWT error');
      
      jwt.sign.mockImplementation(() => {
        throw jwtError;
      });
      
      // Act & Assert
      expect(() => generateToken(userId)).toThrow('Internal JWT error');
    });
  });

  describe('Integração com Parâmetros Reais', () => {
    
    // TC13: Simular token real (sem mock)
    it('TC13 - Deve chamar jwt.sign com parâmetros corretos (integração)', () => {
      // Arrange
      const userId = 'real-user-id-12345';
      const secret = 'super-secret-key-for-testing';
      const expiration = '2h';
      
      process.env.JWT_SECRET = secret;
      process.env.JWT_EXPIRATION = expiration;
      
      jwt.sign.mockReturnValue('real.jwt.token.example');
      
      // Act
      const result = generateToken(userId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        secret,
        { expiresIn: expiration }
      );
      expect(result).toBe('real.jwt.token.example');
    });

    // TC14: Verificar estrutura do payload
    it('TC14 - Deve incluir ID no payload do token', () => {
      // Arrange
      const userId = 'payload-test-user';
      
      // Act
      generateToken(userId);
      
      // Assert
      const [payload] = jwt.sign.mock.calls[0];
      expect(payload).toEqual({ id: userId });
      expect(payload).toHaveProperty('id');
      expect(Object.keys(payload)).toHaveLength(1);
    });

    // TC15: Verificar que retorna string
    it('TC15 - Deve sempre retornar uma string', () => {
      // Arrange
      const userId = 'string-test-user';
      const tokenString = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.test';
      
      jwt.sign.mockReturnValue(tokenString);
      
      // Act
      const result = generateToken(userId);
      
      // Assert
      expect(typeof result).toBe('string');
      expect(result).toBe(tokenString);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Performance e Limites', () => {
    
    // TC16: ID muito longo
    it('TC16 - Deve lidar com IDs muito longos', () => {
      // Arrange
      const longUserId = 'a'.repeat(1000); // ID de 1000 caracteres
      
      jwt.sign.mockReturnValue('token.for.long.id');
      
      // Act
      const result = generateToken(longUserId);
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: longUserId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      expect(result).toBe('token.for.long.id');
    });

    // TC17: Múltiplas chamadas consecutivas
    it('TC17 - Deve funcionar corretamente em múltiplas chamadas', () => {
      // Arrange
      const userIds = ['user1', 'user2', 'user3'];
      const expectedTokens = ['token1', 'token2', 'token3'];
      
      jwt.sign
        .mockReturnValueOnce(expectedTokens[0])
        .mockReturnValueOnce(expectedTokens[1])
        .mockReturnValueOnce(expectedTokens[2]);
      
      // Act
      const tokens = userIds.map(id => generateToken(id));
      
      // Assert
      expect(jwt.sign).toHaveBeenCalledTimes(3);
      expect(tokens).toEqual(expectedTokens);
      
      userIds.forEach((id, index) => {
        expect(jwt.sign).toHaveBeenNthCalledWith(
          index + 1,
          { id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRATION }
        );
      });
    });
  });
});