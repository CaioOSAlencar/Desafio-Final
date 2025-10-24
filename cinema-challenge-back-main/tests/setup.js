// Setup global para testes
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar JWT_SECRET para testes se não existir
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_123456789';
}

// Configuração de banco de teste
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinema-app';

// Setup antes de todos os testes
beforeAll(async () => {
  // Conectar ao MongoDB de teste
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

// Limpeza após cada teste
afterEach(async () => {
  // Limpar todas as collections apenas se conectado
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Cleanup após todos os testes
afterAll(async () => {
  // Desconectar do MongoDB apenas se conectado
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

// Timeout padrão para testes
jest.setTimeout(10000);

// Mock console.log para testes mais limpos (opcional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};