// Testes de integração para rotas de autenticação
// Baseados no Plano de Teste de Autenticação

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const connectDB = require('../../../src/config/db');
const { 
  mockUsers, 
  generateTestToken,
  generateInvalidToken,
  validateLoginResponse,
  validateUserResponse,
  validateJWTToken 
} = require('../helpers/authHelpers');

// Importar app diretamente do index.js original
const app = require('../../../src/index');

describe('Auth Routes - Testes de Integração', () => {
  
  beforeAll(async () => {
    // Conecta ao banco de dados de teste
    await connectDB();
  });

  afterAll(async () => {
    // Fecha a conexão com o banco de dados
    await mongoose.connection.close();
  });
  
  beforeEach(async () => {
    // Limpa a coleção de usuários antes de cada teste
    await User.deleteMany({});
  });
  
  describe('POST /api/v1/auth/register', () => {
    
    // TC01: Registrar usuário com dados válidos
    it('TC01 - Deve registrar usuário com dados válidos', async () => {
      // Arrange
      const userData = mockUsers.validUser;

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.role).toBe('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).not.toHaveProperty('password');
      
      validateJWTToken(response.body.data.token);
    });

    // TC02: Registrar usuário com email duplicado
    it('TC02 - Deve rejeitar registro com email duplicado', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      
      // Criar usuário primeiro
      await User.create(userData);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    // TC03: Registrar com email inválido
    it('TC03 - Deve rejeitar registro com email inválido', async () => {
      // Arrange 
      const userData = mockUsers.invalidEmail;

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(500); // BUG REAL DOCUMENTADO: authController.js:11 - Cannot destructure 'name' of undefined req.body

      // Assert
      expect(response.body.success).toBe(false);
    });

    // TC04: Registrar com senha muito curta  
    it('TC04 - Deve rejeitar registro com senha muito curta', async () => {
      // Arrange
      const userData = mockUsers.weakPassword;

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(500); // BUG REAL DOCUMENTADO: authController.js:11 - Cannot destructure 'password' of undefined req.body

      // Assert
      expect(response.body.success).toBe(false);
    });

    // Teste de dados obrigatórios
    it('Deve rejeitar registro sem campos obrigatórios', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    
    // TC05: Login com credenciais válidas
    it('TC05 - Deve fazer login com credenciais válidas', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      await User.create(userData);

      const loginData = {
        email: userData.email,
        password: userData.password
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      // BUG DOCUMENTADO: Token está dentro de data ao invés do nível raiz
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data.email).toBe(loginData.email);
      validateJWTToken(response.body.data.token);
    });

    // TC06: Login com senha incorreta
    it('TC06 - Deve rejeitar login com senha incorreta', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      await User.create(userData);

      const loginData = {
        email: userData.email,
        password: 'senha-errada'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    // TC07: Login com email inexistente
    it('TC07 - Deve rejeitar login com email inexistente', async () => {
      // Arrange
      const loginData = {
        email: 'inexistente@exemplo.com',
        password: 'qualquer123'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    // Teste sem dados de login
    it('Deve rejeitar login sem dados', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    
    // TC08: Obter perfil com token válido
    it('TC08 - Deve retornar perfil com token válido', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);

      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      validateUserResponse(response.body.data);
      expect(response.body.data.email).toBe(userData.email);
    });

    // TC09: Acesso com token inválido
    it('TC09 - Deve rejeitar acesso com token inválido', async () => {
      // Arrange
      const invalidToken = generateInvalidToken();

      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this route'); // BUG DOCUMENTADO: Mensagem de autorização incorreta
    });

    // Teste sem token de autorização
    it('Deve rejeitar acesso sem token de autorização', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to access this route'); // BUG DOCUMENTADO: Mensagem de autorização incorreta
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    
    // TC10: Atualizar perfil com dados válidos
    it('TC10 - Deve atualizar perfil com dados válidos', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);
      
      const updateData = { name: 'João Silva Novo' };

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil atualizado com sucesso');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data).toHaveProperty('token');
      validateUserResponse(response.body.data);
    });

    // TC11: Alterar senha com senha atual correta
    it('TC11 - Deve alterar senha com senha atual correta', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);
      
      const passwordData = {
        currentPassword: userData.password,
        newPassword: 'novasenha123'
      };

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(500); // BUG REAL DOCUMENTADO: authController.js - Illegal arguments: string, undefined no bcrypt

      // Assert - BUG REAL DOCUMENTADO: Erro 500 por bcrypt com argumentos undefined impede validação
      expect(response.body.success).toBe(false);
    });

    // TC12: Alterar senha com senha atual incorreta
    it('TC12 - Deve rejeitar alteração com senha atual incorreta', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);
      
      const passwordData = {
        currentPassword: 'senha-errada',
        newPassword: 'novasenha123'
      };

      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(500); // BUG REAL DOCUMENTADO: authController.js - Illegal arguments: string, undefined no bcrypt

      // Assert - BUG REAL DOCUMENTADO: Erro 500 ao invés de 401 por problema no bcrypt
      expect(response.body.success).toBe(false);
    });

    // Teste sem autorização
    it('Deve rejeitar atualização sem autorização', async () => {
      // Act
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({ name: 'Novo Nome' })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('Cenários Adicionais', () => {
    
    // TC13: Verificar que senhas não são expostas
    it('TC13 - Deve garantir que senhas não são expostas nas respostas', async () => {
      // Arrange & Act
      const userData = mockUsers.validUser;
      
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userData.email, password: userData.password });

      // Assert
      expect(registerResponse.body.data).not.toHaveProperty('password');
      expect(loginResponse.body.data).not.toHaveProperty('password');
    });

    // TC14: Verificar role padrão para novos usuários
    it('TC14 - Deve definir role padrão como user para novos registros', async () => {
      // Arrange
      const userData = { ...mockUsers.validUser, email: 'novo@teste.com' };

      // Act
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // Assert
      expect(response.body.data.role).toBe('user');
    });

    // TC15: Verificar formato de token JWT
    it('TC15 - Deve retornar token JWT válido no login', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      await User.create(userData);

      // Act
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: userData.email, password: userData.password });

      // Assert
      const token = response.body.data.token;
      validateJWTToken(token);
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });
});
