// Helper para testes de integração de reservas
// Fornece dados de mock, funções de criação de reservas e validação

const request = require('supertest');
const app = require('../../../src/index');
const { Reservation, Session, Theater, Movie, User } = require('../../../src/models');

// Dados de mock para reservas
const mockReservations = {
  validReservation: {
    session: null, // Será preenchido dinamicamente
    seats: [
      { row: 'A', number: 1, type: 'full' },
      { row: 'A', number: 2, type: 'half' }
    ],
    paymentMethod: 'credit_card'
  },
  
  validReservationSingle: {
    session: null, // Será preenchido dinamicamente
    seats: [
      { row: 'B', number: 5, type: 'full' }
    ],
    paymentMethod: 'pix'
  },
  
  invalidReservationNoSeats: {
    session: null,
    seats: [],
    paymentMethod: 'credit_card'
  },
  
  invalidReservationNoSession: {
    seats: [
      { row: 'C', number: 10, type: 'full' }
    ],
    paymentMethod: 'debit_card'
  },
  
  invalidSeatData: {
    session: null,
    seats: [
      { row: 'A', number: 'invalid', type: 'full' }, // número inválido
      { row: '', number: 5, type: 'full' } // row vazia
    ],
    paymentMethod: 'credit_card'
  },
  
  reservationUpdate: {
    status: 'confirmed',
    paymentStatus: 'completed'
  },
  
  reservationCancel: {
    status: 'cancelled',
    paymentStatus: 'failed'
  }
};

// Dados de mock para sessões (necessárias para reservas)
const mockSession = {
  movie: null, // Será preenchido
  theater: null, // Será preenchido
  datetime: new Date('2024-12-01T19:00:00.000Z'),
  fullPrice: 20.00,
  halfPrice: 10.00,
  seats: [
    // Gerar alguns assentos para teste
    { row: 'A', number: 1, status: 'available' },
    { row: 'A', number: 2, status: 'available' },
    { row: 'A', number: 3, status: 'available' },
    { row: 'B', number: 1, status: 'available' },
    { row: 'B', number: 2, status: 'available' },
    { row: 'B', number: 3, status: 'available' },
    { row: 'B', number: 4, status: 'available' },
    { row: 'B', number: 5, status: 'available' },
    { row: 'C', number: 1, status: 'available' },
    { row: 'C', number: 2, status: 'available' },
    { row: 'C', number: 3, status: 'available' },
    { row: 'C', number: 4, status: 'available' },
    { row: 'C', number: 5, status: 'available' },
    { row: 'C', number: 6, status: 'available' },
    { row: 'C', number: 7, status: 'available' },
    { row: 'C', number: 8, status: 'available' },
    { row: 'C', number: 9, status: 'available' },
    { row: 'C', number: 10, status: 'available' }
  ]
};

// Dados de mock para theater (necessário para sessões)
const mockTheater = {
  name: `Sala Teste ${Date.now()}`,
  capacity: 100,
  rows: 10,
  seatsPerRow: 10,
  features: ['digital_projection', 'surround_sound']
};

// Dados de mock para filme (necessário para sessões)
const mockMovie = {
  title: `Filme Reserva Teste ${Date.now()}`,
  synopsis: 'Filme usado nos testes de reserva',
  director: 'Diretor Teste',
  genres: ['Drama'],
  duration: 120,
  classification: 'PG-13',
  poster: 'https://exemplo.com/poster-reserva.jpg',
  releaseDate: '2024-01-01'
};

// Função para criar dados de apoio (filme, theater, session)
const createSupportData = async () => {
  // Criar filme
  const movie = await Movie.create(mockMovie);
  
  // Criar theater
  const theater = await Theater.create(mockTheater);
  
  // Criar session
  const sessionData = {
    ...mockSession,
    movie: movie._id,
    theater: theater._id
  };
  const session = await Session.create(sessionData);
  
  return { movie, theater, session };
};

// Função para criar uma reserva de teste
const createTestReservation = async (reservationData = null, userId = null) => {
  const { session } = await createSupportData();
  
  // Usar dados padrão se não fornecidos
  const data = reservationData || {
    ...mockReservations.validReservation,
    session: session._id
  };
  
  // Se session não estiver definido, usar o criado
  if (!data.session) {
    data.session = session._id;
  }
  
  // Criar usuário se não fornecido
  let user;
  if (userId) {
    user = await User.findById(userId);
  } else {
    user = await User.create({
      name: 'Usuário Teste Reserva',
      email: `reserva${Date.now()}@teste.com`,
      password: 'senha123'
    });
  }
  
  const reservation = await Reservation.create({
    ...data,
    user: user._id,
    totalPrice: calculateTotalPrice(data.seats)
  });
  
  return reservation;
};

// Função para criar múltiplas reservas de teste
const createMultipleTestReservations = async (count = 3) => {
  const reservations = [];
  for (let i = 0; i < count; i++) {
    const reservation = await createTestReservation({
      ...mockReservations.validReservation,
      seats: [
        { row: String.fromCharCode(65 + i), number: 1 + i, type: 'full' } // A1, B2, C3, etc.
      ]
    });
    reservations.push(reservation);
  }
  return reservations;
};

// Função para calcular preço total
const calculateTotalPrice = (seats, session = null) => {
  const fullPrice = session?.fullPrice || 20.00;
  const halfPrice = session?.halfPrice || 10.00;
  
  return seats.reduce((total, seat) => {
    return total + (seat.type === 'full' ? fullPrice : halfPrice);
  }, 0);
};

// Função para validar estrutura de resposta de reserva
const validateReservationResponse = (reservation) => {
  // Campos obrigatórios
  expect(reservation).toHaveProperty('_id');
  expect(reservation).toHaveProperty('user');
  expect(reservation).toHaveProperty('session');
  expect(reservation).toHaveProperty('seats');
  expect(reservation).toHaveProperty('totalPrice');
  expect(reservation).toHaveProperty('status');
  expect(reservation).toHaveProperty('paymentStatus');
  expect(reservation).toHaveProperty('paymentMethod');
  expect(reservation).toHaveProperty('createdAt');
  
  // Validações de tipo
  expect(typeof reservation._id).toBe('string');
  expect(typeof reservation.user).toBe('string');
  expect(typeof reservation.session).toBe('string');
  expect(Array.isArray(reservation.seats)).toBe(true);
  expect(typeof reservation.totalPrice).toBe('number');
  expect(typeof reservation.status).toBe('string');
  expect(typeof reservation.paymentStatus).toBe('string');
  expect(typeof reservation.paymentMethod).toBe('string');
  
  // Validar assentos
  reservation.seats.forEach(seat => {
    expect(seat).toHaveProperty('row');
    expect(seat).toHaveProperty('number');
    expect(seat).toHaveProperty('type');
    expect(['full', 'half']).toContain(seat.type);
  });
  
  // Validar enums
  expect(['pending', 'confirmed', 'cancelled']).toContain(reservation.status);
  expect(['pending', 'completed', 'failed']).toContain(reservation.paymentStatus);
  expect(['credit_card', 'debit_card', 'pix', 'bank_transfer']).toContain(reservation.paymentMethod);
};

// Função para validar lista de reservas
const validateReservationListResponse = (responseBody) => {
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
  
  // Validar cada reserva na lista
  responseBody.data.forEach(reservation => {
    validateReservationResponse(reservation);
  });
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

module.exports = {
  mockReservations,
  mockSession,
  mockTheater,
  mockMovie,
  createSupportData,
  createTestReservation,
  createMultipleTestReservations,
  calculateTotalPrice,
  validateReservationResponse,
  validateReservationListResponse,
  generateUserToken,
  generateAdminToken
};