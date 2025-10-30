// Salve em: cypress/e2e/Home/Home_sucesso.cy.js

describe('Home - Caminho Bom', () => {
  before(() => {
    // Realizar login antes de acessar Home
    cy.visit('/login');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
  });

  it('Deve renderizar todos os elementos principais da Home', () => {
    cy.visit('/');
    cy.get('h1').should('exist');
    cy.get('.features-section').should('exist');
    cy.get('.featured-movies').should('exist');
    cy.get('.coming-soon').should('exist');
    cy.get('.cta-buttons .btn-lg, .btn-primary').should('exist');
    cy.get('.movie-card').should('exist');
    cy.get('footer').should('exist');
  });

  it('Deve navegar para filmes em cartaz ao clicar no botão', () => {
    cy.visit('/');
    cy.get('.cta-buttons .btn-lg, .btn-primary').first().click();
    cy.url().should('include', '/movies');
    cy.get('h1').should('exist');
    cy.get('.movie-card').should('exist');
  });
});
