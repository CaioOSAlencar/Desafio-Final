// Helper para testes de integração de sessões
// Fornece dados de mock, funções de criação de sessões e validação

const request = require('supertest');
const app = require('../../../src/index');
const { Session, Movie, Theater, User } = require('../../../src/models');

// Função para gerar IDs únicos
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Dados de mock para sessões
const mockSessions = {
  validSession: {
    movie: null, // Será preenchido dinamicamente
    theater: null, // Será preenchido dinamicamente
    datetime: new Date('2024-12-15T19:00:00.000Z'),
    fullPrice: 25.00,
    halfPrice: 12.50,
    seats: [
      { row: 'A', number: 1, status: 'available' },
      { row: 'A', number: 2, status: 'available' },
      { row: 'A', number: 3, status: 'available' },
      { row: 'B', number: 1, status: 'available' },
      { row: 'B', number: 2, status: 'available' },
      { row: 'B', number: 3, status: 'available' },
      { row: 'C', number: 1, status: 'available' },
      { row: 'C', number: 2, status: 'available' }
    ]
  },
  
  validSessionEvening: {
    movie: null,
    theater: null,
    datetime: new Date('2024-12-15T21:30:00.000Z'),
    fullPrice: 30.00,
    halfPrice: 15.00,
    seats: [
      { row: 'A', number: 1, status: 'available' },
      { row: 'A', number: 2, status: 'reserved' },
      { row: 'B', number: 1, status: 'available' },
      { row: 'B', number: 2, status: 'available' }
    ]
  },
  
  validSessionMatinee: {
    movie: null,
    theater: null,
    datetime: new Date('2024-12-16T14:00:00.000Z'),
    fullPrice: 18.00,
    halfPrice: 9.00,
    seats: [
      { row: 'A', number: 1, status: 'available' },
      { row: 'A', number: 2, status: 'available' }
    ]
  },
  
  invalidSessionNoMovie: {
    theater: null,
    datetime: new Date('2024-12-15T19:00:00.000Z'),
    fullPrice: 25.00,
    halfPrice: 12.50,
    seats: [
      { row: 'A', number: 1, status: 'available' }
    ]
  },
  
  invalidSessionNoTheater: {
    movie: null,
    datetime: new Date('2024-12-15T19:00:00.000Z'),
    fullPrice: 25.00,
    halfPrice: 12.50,
    seats: [
      { row: 'A', number: 1, status: 'available' }
    ]
  },
  
  invalidSessionNoDatetime: {
    movie: null,
    theater: null,
    fullPrice: 25.00,
    halfPrice: 12.50,
    seats: [
      { row: 'A', number: 1, status: 'available' }
    ]
  },
  
  invalidSessionNegativePrice: {
    movie: null,
    theater: null,
    datetime: new Date('2024-12-15T19:00:00.000Z'),
    fullPrice: -10.00,
    halfPrice: -5.00,
    seats: [
      { row: 'A', number: 1, status: 'available' }
    ]
  },
  
  invalidSessionNoSeats: {
    movie: null,
    theater: null,
    datetime: new Date('2024-12-15T19:00:00.000Z'),
    fullPrice: 25.00,
    halfPrice: 12.50,
    seats: []
  },
  
  sessionUpdate: {
    datetime: new Date('2024-12-15T20:00:00.000Z'),
    fullPrice: 28.00,
    halfPrice: 14.00
  },
  
  sessionUpdatePriceOnly: {
    fullPrice: 22.00,
    halfPrice: 11.00
  }
};

// Dados de mock para filme (necessário para sessões)
const mockMovie = {
  title: `Filme Session Teste ${generateUniqueId()}`,
  synopsis: 'Filme usado nos testes de sessão',
  director: 'Diretor Session',
  genres: ['Action', 'Adventure'],
  duration: 135,
  classification: 'PG-13',
  poster: 'https://exemplo.com/poster-session.jpg',
  releaseDate: '2024-01-15'
};

// Dados de mock para theater (necessário para sessões)
const mockTheater = {
  name: `Sala Session ${generateUniqueId()}`,
  capacity: 50,
  rows: 5,
  seatsPerRow: 10,
  features: ['digital_projection', 'surround_sound', 'reclining_seats']
};

// Função para criar dados de apoio (filme e theater)
const createSupportData = async () => {
  // Criar filme
  const movie = await Movie.create(mockMovie);
  
  // Criar theater
  const theater = await Theater.create({
    ...mockTheater,
    name: `Sala Session ${generateUniqueId()}` // Garantir unicidade
  });
  
  return { movie, theater };
};

// Função para criar uma sessão de teste
const createTestSession = async (sessionData = null, movieId = null, theaterId = null) => {
  let movie, theater;
  
  if (movieId && theaterId) {
    movie = await Movie.findById(movieId);
    theater = await Theater.findById(theaterId);
  } else {
    const supportData = await createSupportData();
    movie = supportData.movie;
    theater = supportData.theater;
  }
  
  // Usar dados padrão se não fornecidos
  const data = sessionData || mockSessions.validSession;
  
  const session = await Session.create({
    ...data,
    movie: movie._id,
    theater: theater._id
  });
  
  return session;
};

// Função para criar múltiplas sessões de teste
const createMultipleTestSessions = async (count = 3) => {
  const { movie, theater } = await createSupportData();
  const sessions = [];
  
  for (let i = 0; i < count; i++) {
    const sessionData = {
      ...mockSessions.validSession,
      datetime: new Date(`2024-12-${15 + i}T${19 + i}:00:00.000Z`),
      fullPrice: 20.00 + (i * 5),
      halfPrice: 10.00 + (i * 2.5)
    };
    
    const session = await Session.create({
      ...sessionData,
      movie: movie._id,
      theater: theater._id
    });
    
    sessions.push(session);
  }
  
  return sessions;
};

// Função para criar sessões com diferentes filmes
const createSessionsWithDifferentMovies = async (count = 2) => {
  const sessions = [];
  
  for (let i = 0; i < count; i++) {
    const { movie, theater } = await createSupportData();
    
    const session = await createTestSession(
      {
        ...mockSessions.validSession,
        datetime: new Date(`2024-12-${20 + i}T19:00:00.000Z`)
      },
      movie._id,
      theater._id
    );
    
    sessions.push(session);
  }
  
  return sessions;
};

// Função para validar estrutura de resposta de sessão
const validateSessionResponse = (session) => {
  // Campos obrigatórios
  expect(session).toHaveProperty('_id');
  expect(session).toHaveProperty('movie');
  expect(session).toHaveProperty('theater');
  expect(session).toHaveProperty('datetime');
  expect(session).toHaveProperty('fullPrice');
  expect(session).toHaveProperty('halfPrice');
  expect(session).toHaveProperty('seats');
  expect(session).toHaveProperty('createdAt');
  
  // Validações de tipo
  expect(typeof session._id).toBe('string');
  expect(typeof session.fullPrice).toBe('number');
  expect(typeof session.halfPrice).toBe('number');
  expect(Array.isArray(session.seats)).toBe(true);
  
  // Validar preços positivos
  expect(session.fullPrice).toBeGreaterThanOrEqual(0);
  expect(session.halfPrice).toBeGreaterThanOrEqual(0);
  expect(session.halfPrice).toBeLessThanOrEqual(session.fullPrice);
  
  // Validar assentos
  session.seats.forEach(seat => {
    expect(seat).toHaveProperty('row');
    expect(seat).toHaveProperty('number');
    expect(seat).toHaveProperty('status');
    expect(['available', 'reserved', 'occupied']).toContain(seat.status);
    expect(typeof seat.row).toBe('string');
    expect(typeof seat.number).toBe('number');
  });
  
  // Validar datetime
  expect(new Date(session.datetime)).toBeInstanceOf(Date);
};

// Função para validar lista de sessões
const validateSessionListResponse = (responseBody) => {
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
  
  // Validar cada sessão na lista
  responseBody.data.forEach(session => {
    validateSessionResponse(session);
  });
};

// Função para validar resposta de sessão com população
const validatePopulatedSessionResponse = (session) => {
  validateSessionResponse(session);
  
  // Verificar se movie e theater estão populados (podem ser string ID ou objeto)
  if (typeof session.movie === 'object' && session.movie !== null) {
    expect(session.movie).toHaveProperty('title');
    expect(session.movie).toHaveProperty('duration');
  }
  
  if (typeof session.theater === 'object' && session.theater !== null) {
    expect(session.theater).toHaveProperty('name');
    expect(session.theater).toHaveProperty('capacity');
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

// Função para formatar data para filtros
const formatDateForFilter = (date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Função para gerar datetime futuro (evitar sessões no passado)
const generateFutureDateTime = (daysFromNow = 1, hour = 19) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date;
};

module.exports = {
  mockSessions,
  mockMovie,
  mockTheater,
  createSupportData,
  createTestSession,
  createMultipleTestSessions,
  createSessionsWithDifferentMovies,
  validateSessionResponse,
  validateSessionListResponse,
  validatePopulatedSessionResponse,
  generateUserToken,
  generateAdminToken,
  formatDateForFilter,
  generateFutureDateTime
};