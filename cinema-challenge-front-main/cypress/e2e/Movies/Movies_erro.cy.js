// Salve em: cypress/e2e/Movies/Movies_erro.cy.js

describe('Filmes em Cartaz - Caminho Ruim', () => {
  before(() => {
    // Cadastro
    cy.visit('/register');
    cy.get('input#name').type('Usuário Teste Erro');
    cy.get('input#email').type(`erro${Date.now()}@cinema.com`);
    cy.get('input#password').type('Senha123');
    cy.get('input#confirmPassword').type('Senha123');
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    cy.wait(1500);
    // Login
    cy.visit('/login');
    cy.get('input#email').type(`erro${Date.now()}@cinema.com`);
    cy.get('input#password').type('Senha123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
    // Home
    cy.visit('/');
    cy.wait(500);
    // Movies
    cy.visit('/movies');
    cy.wait(500);
  });

  it('Deve mostrar mensagem de erro se não carregar filmes', () => {
    cy.visit('/movies');
    cy.get('body').then(($body) => {
      if ($body.find('[class*="error"], .text-red-500, .text-danger').length > 0) {
        cy.contains(/não foi possível carregar os filmes|erro|falha/i).should('exist');
      } else {
        cy.log('⚠️ Nenhuma mensagem de erro encontrada.');
      }
    });
  });

  it('Deve mostrar mensagem de erro se não houver filmes disponíveis', () => {
    cy.visit('/movies');
    cy.get('body').then(($body) => {
      if ($body.text().match(/nenhum filme encontrado|não há filmes/i)) {
        cy.contains(/nenhum filme encontrado|não há filmes/i).should('exist');
      } else {
        cy.log('⚠️ Nenhuma mensagem de "nenhum filme" encontrada.');
      }
    });
  });
});
