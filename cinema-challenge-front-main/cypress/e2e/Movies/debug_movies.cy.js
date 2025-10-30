// Salve em: cypress/e2e/Movies/debug_movies.cy.js

describe('DEBUG - Filmes em Cartaz', () => {
  before(() => {
    // Login antes de acessar filmes
    cy.visit('/login');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
    // Verificar se login foi realizado
    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      if (token) {
        cy.log('✅ Login realizado - Token encontrado');
      } else {
        cy.log('⚠️ Login não realizado - Token não encontrado');
      }
    });
    // Verificar se botões Login/Cadastrar sumiram
    cy.get('header').then($header => {
      const headerText = $header.text().toLowerCase();
      if (!headerText.includes('login') && !headerText.includes('cadastrar')) {
        cy.log('✅ Botões Login/Cadastrar sumiram após login');
      } else {
        cy.log('⚠️ Botões Login/Cadastrar ainda aparecem após login');
      }
    });
  });

  it('Deve inspecionar os elementos da lista de filmes', () => {
    cy.visit('/movies');
    cy.wait(1000);
    cy.log('=== INSPECIONANDO LISTA DE FILMES ===');
    cy.get('h1').should('contain', 'Filmes em Cartaz');
    cy.get('.filters-container').should('exist');
    cy.get('.search-box input').should('exist');
    cy.get('.genre-filter select').should('exist');
    cy.get('.movies-grid').should('exist');
    cy.get('.movie-card').each(($el, idx) => {
      cy.log(`Card ${idx}:`, $el.text());
    });
  });

  it('Deve clicar em um filme e inspecionar detalhes', () => {
    cy.visit('/movies');
    cy.wait(1000);
    cy.get('.movie-card').first().within(() => {
      cy.get('a, .btn-primary').first().click();
    });
    cy.wait(1000);
    cy.log('=== INSPECIONANDO DETALHE DO FILME ===');
    cy.get('.movie-detail-page').should('exist');
    cy.get('h1').should('exist');
    cy.get('.movie-poster img').should('exist');
    cy.get('.movie-info').should('exist');
    cy.get('.movie-genres').should('exist');
    cy.get('.movie-synopsis').should('exist');
    cy.get('.sessions-container').should('exist');
    cy.get('footer').should('exist');
  });

  it('Deve testar responsividade da lista de filmes', () => {
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
    cy.log('✅ Lista de filmes responsiva em todos os tamanhos');
  });
});
