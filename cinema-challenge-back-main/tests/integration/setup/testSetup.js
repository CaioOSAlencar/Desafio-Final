/**
 * Configuração global para testes de integração
 * Usa a mesma configuração dos testes de autenticação que já funcionam
 */

// Setup básico sem mongodb-memory-server
// Os testes usarão o banco configurado na aplicação principal

beforeEach(async () => {
  // Limpeza será feita individualmente em cada arquivo de teste
  // seguindo o padrão dos testes de autenticação existentes
});

console.log('🧪 Setup de testes de integração carregado');