// Helper para testes de integração de usuários
// Fornece dados de mock, funções de criação e validação

const request = require('supertest');
const app = require('../../../src/index');
const { User } = require('../../../src/models');
const bcrypt = require('bcryptjs');

// Função para gerar IDs únicos
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Dados de mock para usuários
const mockUsers = {
  validUser: {
    name: `João Silva ${generateUniqueId()}`,
    email: `joao.silva.${generateUniqueId()}@email.com`,
    password: 'senha123456',
    role: 'user'
  },
  
  validAdmin: {
    name: `Admin User ${generateUniqueId()}`,
    email: `admin.${generateUniqueId()}@email.com`,
    password: 'admin123456',
    role: 'admin'
  },
  
  validUserMinimal: {
    name: `Maria Santos ${generateUniqueId()}`,
    email: `maria.santos.${generateUniqueId()}@email.com`,
    password: '123456' // Senha mínima permitida
  },
  
  invalidUserNoName: {
    email: `sem.nome.${generateUniqueId()}@email.com`,
    password: 'senha123',
    role: 'user'
  },
  
  invalidUserNoEmail: {
    name: `Usuário Sem Email ${generateUniqueId()}`,
    password: 'senha123',
    role: 'user'
  },
  
  invalidUserNoPassword: {
    name: `Usuário Sem Senha ${generateUniqueId()}`,
    email: `sem.senha.${generateUniqueId()}@email.com`,
    role: 'user'
  },
  
  invalidUserInvalidEmail: {
    name: `Email Inválido ${generateUniqueId()}`,
    email: 'email-invalido',
    password: 'senha123',
    role: 'user'
  },
  
  invalidUserShortPassword: {
    name: `Senha Curta ${generateUniqueId()}`,
    email: `senha.curta.${generateUniqueId()}@email.com`,
    password: '123', // Menor que 6 caracteres
    role: 'user'
  },
  
  invalidUserInvalidRole: {
    name: `Role Inválido ${generateUniqueId()}`,
    email: `role.invalido.${generateUniqueId()}@email.com`,
    password: 'senha123',
    role: 'moderator' // Role não permitido
  },
  
  userUpdate: {
    name: `Nome Atualizado ${generateUniqueId()}`,
    email: `email.atualizado.${generateUniqueId()}@email.com`,
    role: 'admin'
  },
  
  userPartialUpdate: {
    name: `Apenas Nome Atualizado ${generateUniqueId()}`
  },
  
  userPasswordUpdate: {
    password: 'novaSenha123456'
  }
};

// Função para criar um usuário de teste
const createTestUser = async (userData = null, hashPassword = true) => {
  const data = userData || {
    ...mockUsers.validUser,
    email: `usuario.teste.${generateUniqueId()}@email.com`
  };
  
  // Se hashPassword for false, criar usuário sem hashear a senha
  if (!hashPassword && data.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    const user = new User({
      ...data,
      password: hashedPassword
    });
    
    // Salvar sem trigger do middleware pre-save
    return await user.save({ validateBeforeSave: true });
  }
  
  const user = await User.create(data);
  return user;
};

// Função para criar usuário admin de teste
const createTestAdmin = async () => {
  const adminData = {
    ...mockUsers.validAdmin,
    email: `admin.teste.${generateUniqueId()}@email.com`
  };
  
  const admin = await User.create(adminData);
  return admin;
};

// Função para criar múltiplos usuários de teste
const createMultipleTestUsers = async (count = 3) => {
  const users = [];
  const roles = ['user', 'admin'];
  
  for (let i = 0; i < count; i++) {
    const user = await User.create({
      name: `Usuário Múltiplo ${i + 1} ${generateUniqueId()}`,
      email: `usuario.multiplo.${i + 1}.${generateUniqueId()}@email.com`,
      password: `senha${i + 1}123456`,
      role: roles[i % roles.length]
    });
    
    users.push(user);
  }
  
  return users;
};

// Função para criar usuários com diferentes roles
const createUsersByRole = async () => {
  const users = [];
  
  // Criar 2 usuários comuns
  for (let i = 0; i < 2; i++) {
    const user = await User.create({
      name: `Usuário Comum ${i + 1} ${generateUniqueId()}`,
      email: `user.${i + 1}.${generateUniqueId()}@email.com`,
      password: `userpass${i + 1}123`,
      role: 'user'
    });
    users.push(user);
  }
  
  // Criar 1 admin
  const admin = await User.create({
    name: `Admin ${generateUniqueId()}`,
    email: `admin.role.${generateUniqueId()}@email.com`,
    password: 'adminpass123',
    role: 'admin'
  });
  users.push(admin);
  
  return users;
};

// Função para validar estrutura de resposta de usuário
const validateUserResponse = (user) => {
  // Campos obrigatórios
  expect(user).toHaveProperty('_id');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('createdAt');
  
  // Senha NUNCA deve estar na resposta
  expect(user).not.toHaveProperty('password');
  
  // Validações de tipo
  expect(typeof user._id).toBe('string');
  expect(typeof user.name).toBe('string');
  expect(typeof user.email).toBe('string');
  expect(typeof user.role).toBe('string');
  
  // Validar valores
  expect(['user', 'admin']).toContain(user.role);
  expect(user.name.length).toBeGreaterThan(0);
  expect(user.email).toMatch(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/);
  
  // Validar data
  expect(new Date(user.createdAt)).toBeInstanceOf(Date);
};

// Função para validar lista de usuários
const validateUserListResponse = (responseBody) => {
  expect(responseBody).toHaveProperty('success');
  expect(responseBody).toHaveProperty('count');
  expect(responseBody).toHaveProperty('data');
  expect(responseBody.success).toBe(true);
  expect(typeof responseBody.count).toBe('number');
  expect(Array.isArray(responseBody.data)).toBe(true);
  
  // Validar paginação (se presente)
  if (responseBody.pagination) {
    expect(responseBody.pagination).toHaveProperty('page');
    expect(responseBody.pagination).toHaveProperty('limit');
    expect(typeof responseBody.pagination.page).toBe('number');
    expect(typeof responseBody.pagination.limit).toBe('number');
  }
  
  // Validar cada usuário na lista
  responseBody.data.forEach(user => {
    validateUserResponse(user);
  });
};

// Função para validar resposta de erro
const validateErrorResponse = (responseBody) => {
  expect(responseBody).toHaveProperty('success', false);
  expect(responseBody).toHaveProperty('message');
  expect(typeof responseBody.message).toBe('string');
  expect(responseBody.message.length).toBeGreaterThan(0);
};

// Função para validar resposta de sucesso
const validateSuccessResponse = (responseBody, expectData = true) => {
  expect(responseBody).toHaveProperty('success', true);
  
  if (expectData) {
    expect(responseBody).toHaveProperty('data');
  }
  
  // Pode ter message em alguns casos
  if (responseBody.message) {
    expect(typeof responseBody.message).toBe('string');
  }
};

// Função para gerar token de usuário comum
const generateUserToken = () => {
  // Token JWT simulado - será rejeitado pelo sistema real
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWM4ZjAwZTAyYTQwMDAxMjM0NTY3OCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzMwMDM4NTAwfQ.fake_signature_user';
};

// Função para gerar token de admin
const generateAdminToken = () => {
  // Token JWT simulado - será rejeitado pelo sistema real
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWM4ZjAwZTAyYTQwMDAxMjM0NTY3OSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMDAzODUwMH0.fake_signature_admin';
};

// Função para criar usuário com email específico (para testes de unicidade)
const createUserWithEmail = async (email, otherData = {}) => {
  const user = await User.create({
    name: `Usuário ${generateUniqueId()}`,
    email: email,
    password: 'senha123456',
    role: 'user',
    ...otherData
  });
  
  return user;
};

// Função para gerar dados válidos para criação
const generateValidUserData = () => {
  return {
    name: `Usuário Dinâmico ${generateUniqueId()}`,
    email: `dinamico.${generateUniqueId()}@email.com`,
    password: 'senha' + Math.floor(Math.random() * 10000) + '123',
    role: ['user', 'admin'][Math.floor(Math.random() * 2)]
  };
};

// Função para verificar se senha foi hasheada corretamente
const validatePasswordHash = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Função para contar usuários por role
const countUsersByRole = async () => {
  const userCount = await User.countDocuments({ role: 'user' });
  const adminCount = await User.countDocuments({ role: 'admin' });
  
  return { userCount, adminCount };
};

module.exports = {
  mockUsers,
  createTestUser,
  createTestAdmin,
  createMultipleTestUsers,
  createUsersByRole,
  validateUserResponse,
  validateUserListResponse,
  validateErrorResponse,
  validateSuccessResponse,
  generateUserToken,
  generateAdminToken,
  createUserWithEmail,
  generateValidUserData,
  validatePasswordHash,
  countUsersByRole,
  generateUniqueId
};