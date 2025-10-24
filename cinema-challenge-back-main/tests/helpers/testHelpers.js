const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock data para testes
const mockUsers = {
  validUser: {
    name: "João Silva",
    email: "joao@exemplo.com",
    password: "123456",
    role: "user"
  },
  validAdmin: {
    name: "Admin User",
    email: "admin@exemplo.com", 
    password: "admin123",
    role: "admin"
  },
  invalidEmailUser: {
    name: "Ana Silva",
    email: "email-invalido",
    password: "123456"
  },
  shortPasswordUser: {
    name: "Pedro Silva",
    email: "pedro@exemplo.com",
    password: "123"
  }
};

// Gerar token JWT para testes
const generateTestToken = (userId, role = 'user') => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Gerar token JWT inválido
const generateInvalidToken = () => {
  return 'invalid.jwt.token';
};

// Hash de senha para testes
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Limpar dados de teste sensíveis das respostas
const sanitizeUserResponse = (user) => {
  const { password, ...userWithoutPassword } = user.toObject ? user.toObject() : user;
  return userWithoutPassword;
};

// Validar estrutura de resposta de usuário
const validateUserResponse = (userResponse) => {
  expect(userResponse).toHaveProperty('_id');
  expect(userResponse).toHaveProperty('name');
  expect(userResponse).toHaveProperty('email');
  expect(userResponse).toHaveProperty('role');
  expect(userResponse).not.toHaveProperty('password');
};

// Validar estrutura de resposta de login
const validateLoginResponse = (loginResponse) => {
  expect(loginResponse).toHaveProperty('success', true);
  expect(loginResponse).toHaveProperty('data');
  expect(loginResponse.data).toHaveProperty('_id');
  expect(loginResponse.data).toHaveProperty('name');
  expect(loginResponse.data).toHaveProperty('email');
  expect(loginResponse.data).toHaveProperty('role');
  expect(loginResponse.data).toHaveProperty('token');
  expect(loginResponse.data).not.toHaveProperty('password');
};

// Validar token JWT
const validateJWTToken = (token) => {
  expect(token).toBeDefined();
  expect(typeof token).toBe('string');
  expect(token.split('.')).toHaveLength(3); // JWT tem 3 partes
};

module.exports = {
  mockUsers,
  generateTestToken,
  generateInvalidToken,
  hashPassword,
  sanitizeUserResponse,
  validateUserResponse,
  validateLoginResponse,
  validateJWTToken
};