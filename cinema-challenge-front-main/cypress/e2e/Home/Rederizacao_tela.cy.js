// Salve em: cypress/e2e/Home/Rederizacao_tela.cy.js

describe('Teste E2E de Renderização da Tela Home', () => {
  before(() => {
    // Realizar login antes de acessar Home
    cy.visit('/login');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
  });

  it('Deve inspecionar todos os títulos e seções', () => {
    cy.visit('/');
    cy.get('h1').should('exist');
    cy.get('.features-section').should('exist');
    cy.get('.featured-movies').should('exist');
    cy.get('.coming-soon').should('exist');
    cy.get('footer').should('exist');
  });

  it('Deve inspecionar todos os cards de filmes', () => {
    cy.visit('/');
    cy.get('.movie-card').each(($el, idx) => {
      cy.log(`Card ${idx}:`, $el.text());
    });
  });

  it('Deve inspecionar todos os botões principais', () => {
    cy.visit('/');
    cy.get('button, .btn, .btn-lg, .btn-primary').each(($btn, idx) => {
      cy.log(`Botão ${idx}:`, $btn.text());
    });
  });

  it('Deve verificar responsividade da Home', () => {
    cy.visit('/');
    // Mobile
    cy.viewport(375, 667);
    cy.wait(500);
    cy.get('.home-container').should('be.visible');
    cy.screenshot('home-mobile');
    cy.log('✅ Mobile OK');
    // Tablet
    cy.viewport(768, 1024);
    cy.wait(500);
    cy.get('.home-container').should('be.visible');
    cy.screenshot('home-tablet');
    cy.log('✅ Tablet OK');
    // Desktop
    cy.viewport(1920, 1080);
    cy.wait(500);
    cy.get('.home-container').should('be.visible');
    cy.screenshot('home-desktop');
    cy.log('✅ Desktop OK');
    cy.log('✅ Home responsiva em todos os tamanhos');
  });
});
