const request = require('supertest');
const app = require('../../../src/index');
const { Movie } = require('../../../src/models');

/**
 * Helpers específicos para testes de integração de filmes
 */

// Mock movies para testes (baseado no modelo real)
const mockMovies = {
  validMovie: {
    title: 'Filme de Teste',
    synopsis: 'Uma sinopse interessante para teste de integração',
    director: 'Diretor Teste',
    genres: ['Drama', 'Ação'],
    duration: 120,
    classification: 'PG-13',
    poster: 'https://exemplo.com/poster.jpg',
    releaseDate: '2024-12-01'
  },
  
  invalidMovie: {
    title: '', // Título vazio - inválido
    synopsis: 'Sinopse teste',
    director: 'Diretor',
    genres: ['Ação'],
    duration: -10, // Duração inválida
    classification: 'PG-13'
  },
  
  updateData: {
    title: 'Filme Atualizado',
    synopsis: 'Sinopse atualizada para teste',
    director: 'Novo Diretor',
    genres: ['Comédia', 'Romance'],
    duration: 150,
    classification: 'PG',
    poster: 'https://exemplo.com/novo-poster.jpg',
    releaseDate: '2025-01-01'
  },
  
  adminUser: {
    name: 'Admin Teste',
    email: 'admin@teste.com',
    password: 'admin123',
    role: 'admin'
  },
  
  regularUser: {
    name: 'User Teste',
    email: 'user@teste.com',
    password: 'user123',
    role: 'user'
  }
};

/**
 * Cria um filme válido no banco para testes
 */
const createTestMovie = async (movieData = mockMovies.validMovie) => {
  const movie = await Movie.create(movieData);
  return movie;
};

/**
 * Cria múltiplos filmes para testes de listagem
 */
const createMultipleTestMovies = async (count = 5) => {
  const movies = [];
  for (let i = 1; i <= count; i++) {
    const movieData = {
      title: `Filme Teste ${i}`,
      synopsis: `Sinopse do filme ${i} para testes de integração`,
      director: `Diretor ${i}`,
      genres: i % 2 === 0 ? ['Drama'] : ['Ação', 'Aventura'],
      duration: 90 + (i * 15),
      classification: ['G', 'PG', 'PG-13', 'R'][i % 4],
      poster: `https://exemplo.com/poster${i}.jpg`,
      releaseDate: new Date(`2024-${String(i).padStart(2, '0')}-01`)
    };
    const movie = await Movie.create(movieData);
    movies.push(movie);
  }
  return movies;
};

/**
 * Valida estrutura de resposta de filme
 */
const validateMovieResponse = (movieData) => {
  expect(movieData).toHaveProperty('_id');
  expect(movieData).toHaveProperty('title');
  expect(movieData).toHaveProperty('synopsis');
  expect(movieData).toHaveProperty('director');
  expect(movieData).toHaveProperty('genres');
  expect(movieData).toHaveProperty('duration');
  expect(movieData).toHaveProperty('classification');
  expect(movieData).toHaveProperty('releaseDate');
  expect(movieData).toHaveProperty('createdAt');
  expect(movieData).toHaveProperty('updatedAt');
  
  // Validar tipos
  expect(typeof movieData.title).toBe('string');
  expect(typeof movieData.synopsis).toBe('string');
  expect(typeof movieData.director).toBe('string');
  expect(Array.isArray(movieData.genres)).toBe(true);
  expect(typeof movieData.duration).toBe('number');
  expect(typeof movieData.classification).toBe('string');
};

/**
 * Valida estrutura de resposta de lista de filmes
 */
const validateMovieListResponse = (responseBody) => {
  expect(responseBody).toHaveProperty('success', true);
  expect(responseBody).toHaveProperty('count');
  expect(responseBody).toHaveProperty('data');
  expect(Array.isArray(responseBody.data)).toBe(true);
  expect(responseBody).toHaveProperty('pagination');
  
  // Validar paginação
  expect(responseBody.pagination).toHaveProperty('page');
  expect(responseBody.pagination).toHaveProperty('limit');
  expect(responseBody.pagination).toHaveProperty('totalPages');
  
  // Validar cada filme na lista
  if (responseBody.data.length > 0) {
    responseBody.data.forEach(movie => {
      validateMovieResponse(movie);
    });
  }
};

/**
 * Gerar token de admin para testes
 */
const generateAdminToken = () => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: 'admin123', role: 'admin' },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '1h' }
  );
};

/**
 * Gerar token de usuário comum
 */
const generateUserToken = () => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: 'user123', role: 'user' },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '1h' }
  );
};

module.exports = {
  mockMovies,
  createTestMovie,
  createMultipleTestMovies,
  validateMovieResponse,
  validateMovieListResponse,
  generateAdminToken,
  generateUserToken
};