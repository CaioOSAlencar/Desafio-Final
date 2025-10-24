// Testes de integração para rotas de autenticação
// Baseados no Plano de Teste de Autenticação

const request = require('supertest');
const express = require('express');
const { User } = require('../../src/models');
const { register, login, getProfile, updateProfile } = require('../../src/controllers/authController');
const { 
  mockUsers, 
  generateTestToken,
  generateInvalidToken,
  validateLoginResponse,
  validateUserResponse,
  validateJWTToken 
} = require('../helpers/testHelpers');

// Mock do middleware de autenticação
const mockProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  
  const token = authHeader.substring(7);
  if (token === 'invalid.jwt.token') {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  
  // Mock de usuário válido - buscar do banco ou usar mock
  req.user = { _id: 'mock-user-id' };
  next();
};

// Setup da aplicação de teste
const app = express();
app.use(express.json());

// Definir rotas diretamente
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', mockProtect, getProfile);
app.put('/api/auth/profile', mockProtect, updateProfile);

describe('Auth Routes - Testes de Integração', () => {
  
  describe('POST /api/auth/register', () => {
    
    // TC01: Registrar usuário com dados válidos
    it('TC01 - Deve registrar usuário com dados válidos', async () => {
      // Arrange
      const userData = mockUsers.validUser;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
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
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    // TC03: Registrar usuário com email inválido
    it('TC03 - Deve rejeitar registro com email inválido', async () => {
      // Arrange
      const userData = mockUsers.invalidEmailUser;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    // TC04: Registrar usuário com senha muito curta
    it('TC04 - Deve rejeitar registro com senha muito curta', async () => {
      // Arrange
      const userData = mockUsers.shortPasswordUser;

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });

    // Teste de dados obrigatórios
    it('Deve rejeitar registro sem campos obrigatórios', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    
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
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      // Assert
      validateLoginResponse(response.body);
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
        .post('/api/auth/login')
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
        .post('/api/auth/login')
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
        .post('/api/auth/login')
        .send({})
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    
    // TC08: Obter perfil com token válido
    it('TC08 - Deve retornar perfil com token válido', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      validateUserResponse(response.body.data);
      expect(response.body.data.email).toBe(userData.email);
    });

    // TC09: Obter perfil com token inválido
    it('TC09 - Deve rejeitar acesso com token inválido', async () => {
      // Arrange
      const invalidToken = generateInvalidToken();

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized');
    });

    // Teste sem token de autorização
    it('Deve rejeitar acesso sem token de autorização', async () => {
      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized');
    });
  });

  describe('PUT /api/auth/profile', () => {
    
    // TC10: Atualizar perfil com dados válidos
    it('TC10 - Deve atualizar perfil com dados válidos', async () => {
      // Arrange
      const userData = mockUsers.validUser;
      const user = await User.create(userData);
      const token = generateTestToken(user._id);
      
      const updateData = { name: 'João Silva Novo' };

      // Act
      const response = await request(app)
        .put('/api/auth/profile')
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
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil atualizado com sucesso');
      expect(response.body.data).toHaveProperty('token');
      validateJWTToken(response.body.data.token);
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
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Senha atual incorreta');
    });

    // Teste sem autorização
    it('Deve rejeitar atualização sem autorização', async () => {
      // Act
      const response = await request(app)
        .put('/api/auth/profile')
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
        .post('/api/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/auth/login')
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
        .post('/api/auth/register')
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
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      // Assert
      const token = response.body.data.token;
      validateJWTToken(token);
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });
});