// Helper para testes de integração de theaters
// Fornece dados de mock, funções de criação e validação

const request = require('supertest');
const app = require('../../../src/index');
const { Theater } = require('../../../src/models');

// Função para gerar IDs únicos
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Dados de mock para theaters
const mockTheaters = {
  validTheater: {
    name: `Sala Principal ${generateUniqueId()}`,
    capacity: 120,
    type: 'IMAX'
  },
  
  validTheaterStandard: {
    name: `Sala Standard ${generateUniqueId()}`,
    capacity: 80,
    type: 'standard'
  },
  
  validTheater3D: {
    name: `Sala 3D ${generateUniqueId()}`,
    capacity: 100,
    type: '3D'
  },
  
  validTheaterVIP: {
    name: `Sala VIP ${generateUniqueId()}`,
    capacity: 40,
    type: 'VIP'
  },
  
  invalidTheaterNoName: {
    capacity: 120,
    type: 'IMAX'
  },
  
  invalidTheaterNoCapacity: {
    name: `Sala Sem Capacidade ${generateUniqueId()}`,
    type: 'standard'
  },
  
  invalidTheaterNoType: {
    name: `Sala Sem Tipo ${generateUniqueId()}`,
    capacity: 90
  },
  
  invalidTheaterZeroCapacity: {
    name: `Sala Capacidade Zero ${generateUniqueId()}`,
    capacity: 0,
    type: 'standard'
  },
  
  invalidTheaterNegativeCapacity: {
    name: `Sala Capacidade Negativa ${generateUniqueId()}`,
    capacity: -10,
    type: 'standard'
  },
  
  invalidTheaterInvalidType: {
    name: `Sala Tipo Inválido ${generateUniqueId()}`,
    capacity: 60,
    type: 'premium' // Tipo não permitido
  },
  
  theaterUpdate: {
    name: `Sala Atualizada ${generateUniqueId()}`,
    capacity: 150,
    type: 'VIP'
  },
  
  theaterPartialUpdate: {
    capacity: 200
  }
};

// Função para criar um theater de teste
const createTestTheater = async (theaterData = null) => {
  const data = theaterData || {
    ...mockTheaters.validTheater,
    name: `Sala Teste ${generateUniqueId()}`
  };
  
  const theater = await Theater.create(data);
  return theater;
};

// Função para criar múltiplos theaters de teste
const createMultipleTestTheaters = async (count = 3) => {
  const theaters = [];
  const types = ['standard', '3D', 'IMAX', 'VIP'];
  
  for (let i = 0; i < count; i++) {
    const theater = await Theater.create({
      name: `Sala Múltipla ${i + 1} ${generateUniqueId()}`,
      capacity: 50 + (i * 20),
      type: types[i % types.length]
    });
    
    theaters.push(theater);
  }
  
  return theaters;
};

// Função para criar theaters com diferentes tipos
const createTheatersByType = async () => {
  const types = ['standard', '3D', 'IMAX', 'VIP'];
  const theaters = [];
  
  for (let type of types) {
    const theater = await Theater.create({
      name: `Sala ${type} ${generateUniqueId()}`,
      capacity: type === 'VIP' ? 40 : type === 'IMAX' ? 150 : 100,
      type: type
    });
    
    theaters.push(theater);
  }
  
  return theaters;
};

// Função para validar estrutura de resposta de theater
const validateTheaterResponse = (theater) => {
  // Campos obrigatórios
  expect(theater).toHaveProperty('_id');
  expect(theater).toHaveProperty('name');
  expect(theater).toHaveProperty('capacity');
  expect(theater).toHaveProperty('type');
  expect(theater).toHaveProperty('createdAt');
  
  // Validações de tipo
  expect(typeof theater._id).toBe('string');
  expect(typeof theater.name).toBe('string');
  expect(typeof theater.capacity).toBe('number');
  expect(typeof theater.type).toBe('string');
  
  // Validar valores
  expect(theater.capacity).toBeGreaterThan(0);
  expect(['standard', '3D', 'IMAX', 'VIP']).toContain(theater.type);
  expect(theater.name.length).toBeGreaterThan(0);
  
  // Validar data
  expect(new Date(theater.createdAt)).toBeInstanceOf(Date);
};

// Função para validar lista de theaters
const validateTheaterListResponse = (responseBody) => {
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
  
  // Validar cada theater na lista
  responseBody.data.forEach(theater => {
    validateTheaterResponse(theater);
  });
};

// Função para validar resposta de theater com população
const validatePopulatedTheaterResponse = (theater) => {
  validateTheaterResponse(theater);
  
  // Verificar se sessions estão populadas (pode ser array vazio ou com dados)
  if (theater.sessions) {
    expect(Array.isArray(theater.sessions)).toBe(true);
    
    // Se há sessões, validar estrutura básica
    theater.sessions.forEach(session => {
      expect(session).toHaveProperty('_id');
      expect(session).toHaveProperty('movie');
      expect(session).toHaveProperty('datetime');
    });
  }
};

// Função para validar resposta de erro
const validateErrorResponse = (responseBody) => {
  expect(responseBody).toHaveProperty('success', false);
  expect(responseBody).toHaveProperty('message');
  expect(typeof responseBody.message).toBe('string');
  expect(responseBody.message.length).toBeGreaterThan(0);
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

// Função para criar theater com nome específico (para testes de unicidade)
const createTheaterWithName = async (name, otherData = {}) => {
  const theater = await Theater.create({
    name: name,
    capacity: 100,
    type: 'standard',
    ...otherData
  });
  
  return theater;
};

// Função para gerar dados válidos para criação
const generateValidTheaterData = () => {
  return {
    name: `Sala Dinâmica ${generateUniqueId()}`,
    capacity: Math.floor(Math.random() * 100) + 50, // 50-150
    type: ['standard', '3D', 'IMAX', 'VIP'][Math.floor(Math.random() * 4)]
  };
};

// Função para validar estrutura de mensagem de sucesso
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

module.exports = {
  mockTheaters,
  createTestTheater,
  createMultipleTestTheaters,
  createTheatersByType,
  validateTheaterResponse,
  validateTheaterListResponse,
  validatePopulatedTheaterResponse,
  validateErrorResponse,
  validateSuccessResponse,
  generateUserToken,
  generateAdminToken,
  createTheaterWithName,
  generateValidTheaterData,
  generateUniqueId
};