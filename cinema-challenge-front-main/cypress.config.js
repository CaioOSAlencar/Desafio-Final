const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
  baseUrl: 'http://localhost:3002',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Timeouts mais generosos
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Configurações básicas
    watchForFileChanges: true,
    video: false, // Desabilitar vídeo por performance
    screenshotOnRunFailure: true,
    
    // Padrões de arquivos - mais específico
    specPattern: [
      'cypress/e2e/**/*.cy.js',
      'cypress/e2e/**/*.cy.ts'
    ],
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    
    // Variáveis de ambiente
    env: {
      API_BASE_URL: 'http://localhost:3000/api/v1',
      ADMIN_EMAIL: 'admin@cinema.com',
      ADMIN_PASSWORD: 'admin123',
      USER_EMAIL: 'user@test.com',
      USER_PASSWORD: 'user123'
    },
    
    setupNodeEvents(on, config) {
      // Configurações básicas
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
      
      return config
    }
  }
})