// Salve em: cypress/e2e/Movies/Rederizacao_tela.cy.js

describe('Teste E2E de Renderização da Tela de Filmes', () => {
  before(() => {
    // Cadastro
    cy.visit('/register');
    cy.get('input#name').type('Usuário Teste Render');
    const email = `render${Date.now()}@cinema.com`;
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

  it('Deve inspecionar todos os filtros e cards', () => {
    cy.visit('/movies');
    cy.get('.filters-container').should('exist');
    cy.get('.search-box input').should('exist');
    cy.get('.genre-filter select').should('exist');
    cy.get('.movies-grid').should('exist');
    cy.get('.movie-card').each(($el, idx) => {
      cy.log(`Card ${idx}:`, $el.text());
    });
  });

  it('Deve inspecionar detalhes do filme', () => {
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

  it('Deve verificar responsividade da tela de filmes', () => {
    cy.visit('/movies');
    // Mobile
    cy.viewport(375, 667);
    cy.wait(500);
    cy.get('.movies-container').should('be.visible');
    cy.screenshot('movies-mobile');
    cy.log('✅ Mobile OK');
    // Tablet
    cy.viewport(768, 1024);
    cy.wait(500);
    cy.get('.movies-container').should('be.visible');
    cy.screenshot('movies-tablet');
    cy.log('✅ Tablet OK');
    // Desktop
    cy.viewport(1920, 1080);
    cy.wait(500);
    cy.get('.movies-container').should('be.visible');
    cy.screenshot('movies-desktop');
    cy.log('✅ Desktop OK');
    cy.log('✅ Tela de filmes responsiva em todos os tamanhos');
  });
});
