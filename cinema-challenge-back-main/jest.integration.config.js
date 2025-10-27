/**
 * Configuração Jest para Testes de Integração
 * Configurações específicas para testes E2E com banco real
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/tests/integration/**/*.test.js'
  ],
  
  // Setup global para testes de integração
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup/testSetup.js'
  ],
  
  // Timeout para testes de integração (mais alto que unitários)
  testTimeout: 10000,
  
  // Não collectar coverage para testes de integração (foco em funcionalidade)
  collectCoverage: false,
  
  // Executar testes em série (não paralelo) para evitar conflitos de DB
  maxWorkers: 1,
  
  // Variáveis de ambiente específicas para teste
  setupFiles: [
    '<rootDir>/tests/integration/setup/envSetup.js'
  ],
  
  // Ignorar arquivos não relacionados aos testes
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/unit/'
  ],
  
  // Configurações específicas para módulos
  moduleDirectories: [
    'node_modules',
    'src'
  ],
  
  // Detectar arquivos de teste abertos
  detectOpenHandles: true,
  
  // Forçar saída após testes (evitar hang)
  forceExit: true,
  
  // Padrão de nomeação dos testes
  displayName: {
    name: 'INTEGRATION',
    color: 'blue'
  },
  
  // Verbose para testes de integração
  verbose: true
};