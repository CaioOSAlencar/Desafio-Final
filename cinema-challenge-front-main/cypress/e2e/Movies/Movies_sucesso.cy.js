// Salve em: cypress/e2e/Movies/Movies_sucesso.cy.js

describe('Filmes em Cartaz - Caminho Bom', () => {
  before(() => {
    // Cadastro
    cy.visit('/register');
    cy.get('input#name').type('Usuário Teste Sucesso');
    const email = `sucesso${Date.now()}@cinema.com`;
    cy.get('input#email').type(email);
    cy.get('input#password').type('Senha123');
    cy.get('input#confirmPassword').type('Senha123');
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    cy.wait(1500);
    // Login
    cy.visit('/login');
    cy.get('input#email').type(email);
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

  it('Deve exibir lista de filmes corretamente', () => {
    cy.visit('/movies');
    cy.get('h1').should('contain', 'Filmes em Cartaz');
    cy.get('.filters-container').should('exist');
    cy.get('.search-box input').should('exist');
    cy.get('.genre-filter select').should('exist');
    cy.get('.movies-grid').should('exist');
    cy.get('.movie-card').should('have.length.greaterThan', 0);
  });

  it('Deve acessar detalhes de um filme', () => {
    cy.visit('/movies');
    cy.get('.movie-card').first().within(() => {
      cy.get('a, .btn-primary').first().click();
    });
    cy.get('.movie-detail-page').should('exist');
    cy.get('h1').should('exist');
    cy.get('.movie-poster img').should('exist');
    cy.get('.movie-info').should('exist');
    cy.get('.movie-genres').should('exist');
    cy.get('.movie-synopsis').should('exist');
    cy.get('.sessions-container').should('exist');
    cy.get('footer').should('exist');
  });
});
