const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../../../src/models/User');

/**
 * Helpers específicos para testes de integração de autenticação
 */

// Mock users para testes
const mockUsers = {
  validUser: {
    name: 'João Silva',
    email: 'joao@exemplo.com',
    password: 'password123',
    role: 'user'
  },
  adminUser: {
    name: 'Admin Cinema',
    email: 'admin@cinema.com',
    password: 'admin123',
    role: 'admin'
  },
  invalidEmailUser: {
    name: 'Pedro Silva',
    email: 'email-invalido',
    password: 'password123'
  },
  shortPasswordUser: {
    name: 'Maria Santos',
    email: 'maria@exemplo.com',
    password: '123'
  }
};

/**
 * Gera token JWT válido para testes
 */
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

/**
 * Gera token JWT inválido para testes
 */
const generateInvalidToken = () => {
  return 'invalid.token.here';
};

/**
 * Valida estrutura de resposta de login
 */
const validateLoginResponse = (responseBody) => {
  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('token');
  expect(responseBody).toHaveProperty('data');
  expect(responseBody.data).toHaveProperty('user');
  expect(responseBody.data.user).toHaveProperty('id');
  expect(responseBody.data.user).toHaveProperty('name');
  expect(responseBody.data.user).toHaveProperty('email');
  expect(responseBody.data.user).not.toHaveProperty('password');
};

/**
 * Valida estrutura de resposta de usuário
 */
const validateUserResponse = (userData) => {
  expect(userData).toHaveProperty('_id');
  expect(userData).toHaveProperty('name');
  expect(userData).toHaveProperty('email');
  expect(userData).toHaveProperty('role');
  expect(userData).not.toHaveProperty('password');
};

/**
 * Valida se token JWT é válido
 */
const validateJWTToken = (token) => {
  expect(token).toBeDefined();
  expect(typeof token).toBe('string');
  expect(token.split('.')).toHaveLength(3); // JWT tem 3 partes
  
  // Verifica se é um JWT válido
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
  expect(decoded).toHaveProperty('id');
};

/**
 * Registra e autentica usuário para testes
 */
const registerAndLoginUser = async (userData = mockUsers.validUser) => {
  // Importar app localmente para evitar problemas de circular dependency
  const app = require('../../../src/index');
  
  // Registrar usuário
  const registerResponse = await request(app)
    .post('/api/v1/auth/register')
    .send(userData)
    .expect(201);

  // Fazer login
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: userData.email,
      password: userData.password
    })
    .expect(200);

  return {
    user: registerResponse.body.data.user,
    token: loginResponse.body.token,
    loginData: loginResponse.body
  };
};

/**
 * Cria usuário diretamente no banco para testes
 */
const createTestUser = async (userData = null) => {
  const data = userData || {
    name: `Test User ${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'user'
  };
  
  return await User.create(data);
};

/**
 * Gera token válido para um usuário e role específicos
 */
const generateValidToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1d' }
  );
};

module.exports = {
  mockUsers,
  generateTestToken,
  generateInvalidToken,
  validateLoginResponse,
  validateUserResponse,
  validateJWTToken,
  registerAndLoginUser,
  createTestUser,
  generateValidToken
};