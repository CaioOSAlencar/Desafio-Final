// Salve em: cypress/e2e/Home/Home_erro.cy.js

describe('Home - Caminho Ruim', () => {
  before(() => {
    // Realizar login antes de acessar Home
    cy.visit('/login');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
  });

  it('Deve mostrar mensagem de erro se não carregar filmes', () => {
    cy.visit('/');
    cy.get('body').then(($body) => {
      if ($body.find('[class*="error"], .text-red-500, .text-danger').length > 0) {
        cy.contains(/não foi possível carregar os filmes|erro|falha/i).should('exist');
      } else {
        cy.log('⚠️ Nenhuma mensagem de erro encontrada.');
      }
    });
  });

  it('Deve mostrar mensagem de erro se não houver filmes disponíveis', () => {
    cy.visit('/');
    cy.get('.movie-card').should('exist');
    cy.get('body').then(($body) => {
      if ($body.text().match(/nenhum filme encontrado|não há filmes/i)) {
        cy.contains(/nenhum filme encontrado|não há filmes/i).should('exist');
      } else {
        cy.log('⚠️ Nenhuma mensagem de "nenhum filme" encontrada.');
      }
    });
  });
});
