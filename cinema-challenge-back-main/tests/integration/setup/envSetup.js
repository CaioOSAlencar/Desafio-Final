/**
 * Configuração de variáveis de ambiente para testes de integração
 */

// Definir variáveis de ambiente específicas para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
process.env.JWT_EXPIRATION = '1d';

// Configurações de banco de dados para testes (será sobrescrito pelo MongoDB em memória)
process.env.MONGODB_URI = 'mongodb://localhost:27017/cinema-test';

// Configurações de logging para testes (silencioso)
process.env.LOG_LEVEL = 'error';

// Porta para servidor de teste
process.env.PORT = 5001;

console.log('🧪 Variáveis de ambiente configuradas para testes de integração');