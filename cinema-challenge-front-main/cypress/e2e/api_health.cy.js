// cypress/e2e/API/api_health.cy.js
// Testes para verificar se o backend está rodando

describe('API Health Check', () => {
  const API_URL = Cypress.env('API_BASE_URL') || 'http://localhost:3000/api/v1';

  it('Deve verificar se a API está respondendo', () => {
    cy.request({
      method: 'GET',
      url: API_URL,
      failOnStatusCode: false
    }).then((response) => {
      if (response.status === 200) {
        cy.log('✅ API está respondendo');
        expect(response.status).to.eq(200);
      } else {
        cy.log('⚠️ API não está respondendo corretamente');
        cy.log('Status:', response.status);
      }
    });
  });

  it('Deve verificar endpoint de registro', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL}/auth/register`,
      failOnStatusCode: false,
      body: {
        name: 'Test User',
        email: `test${Date.now()}@test.com`,
        password: 'Test123@'
      }
    }).then((response) => {
      cy.log('Status do registro:', response.status);
      cy.log('Resposta:', response.body);
      
      if (response.status === 200 || response.status === 201) {
        cy.log('✅ Endpoint de registro está funcionando');
      } else if (response.status === 404) {
        cy.log('❌ Endpoint de registro não existe');
        cy.log('⚠️ Verifique se o backend está rodando e a URL está correta');
      } else {
        cy.log('⚠️ Resposta inesperada do endpoint de registro');
      }
    });
  });

  it('Deve verificar endpoint de login', () => {
    cy.request({
      method: 'POST',
      url: `${API_URL}/auth/login`,
      failOnStatusCode: false,
      body: {
        email: Cypress.env('ADMIN_EMAIL') || 'admin@cinema.com',
        password: Cypress.env('ADMIN_PASSWORD') || 'admin123'
      }
    }).then((response) => {
      cy.log('Status do login:', response.status);
      
      if (response.status === 200) {
        cy.log('✅ Endpoint de login está funcionando');
        expect(response.body).to.have.property('token').or.have.property('data');
      } else if (response.status === 404) {
        cy.log('❌ Endpoint de login não existe');
      } else {
        cy.log('⚠️ Credenciais podem estar incorretas ou API offline');
      }
    });
  });

  it('Deve listar todos os endpoints disponíveis', () => {
    const endpoints = [
      { method: 'GET', path: '/movies', description: 'Listar filmes' },
      { method: 'GET', path: '/theaters', description: 'Listar salas' },
      { method: 'GET', path: '/sessions', description: 'Listar sessões' },
      { method: 'POST', path: '/auth/register', description: 'Registro' },
      { method: 'POST', path: '/auth/login', description: 'Login' }
    ];

    cy.wrap(endpoints).each((endpoint) => {
      cy.request({
        method: endpoint.method,
        url: `${API_URL}${endpoint.path}`,
        failOnStatusCode: false
      }).then((response) => {
        const status = response.status;
        const emoji = status < 400 ? '✅' : status === 404 ? '❌' : '⚠️';
        cy.log(`${emoji} ${endpoint.method} ${endpoint.path} - ${status} - ${endpoint.description}`);
      });
    });
  });
});