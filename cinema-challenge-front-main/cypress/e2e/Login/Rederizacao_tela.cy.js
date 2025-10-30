// Salve em: cypress/e2e/Login/Rederizacao_tela.cy.js

describe('Teste E2E de Renderização da Tela de Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Inspeciona todos os inputs da tela', () => {
    cy.get('input').each(($el, idx) => {
      cy.log(`Input ${idx}: name=${$el.attr('name')}, id=${$el.attr('id')}, placeholder=${$el.attr('placeholder')}`);
    });
  });

  it('Deve exibir a logo do site à esquerda', () => {
    cy.get('header').find('img, svg').should('exist');
    cy.get('header').contains(/cinema|logo/i).should('exist');
  });

  it('Deve exibir os 4 botões/textos do menu', () => {
    cy.get('header').find('a, button').should('have.length.at.least', 4);
    cy.get('header').contains(/Filmes em Cartaz/i).should('exist');
    cy.get('header').contains(/Início/i).should('exist');
    cy.get('header').contains(/Login/i).should('exist');
    cy.get('header').contains(/Cadastrar/i).should('exist');
  });

  it('Deve renderizar todos os componentes principais', () => {
    cy.contains(/login/i).should('be.visible');
    cy.contains(/entre com suas credenciais para acessar sua conta/i).should('be.visible');
    cy.get('input#email, input[name="email"], input[type="email"]').should('exist');
    cy.contains(/e-mail/i).should('exist');
    cy.get('input#password, input[name="password"], input[type="password"]').should('exist');
    cy.contains(/senha/i).should('exist');
    cy.get('button, input[type="submit"]').contains(/entrar|login/i).should('exist');
    cy.contains(/não tem uma conta|cadastre-se/i).should('exist');
  });

  it('Deve exibir todos os textos principais do footer', () => {
    cy.get('footer').contains('Cinema App').should('exist');
    cy.get('footer').contains('Seu aplicativo completo para reserva de ingressos de cinema.').should('exist');
    cy.get('footer').contains('Links Úteis').should('exist');
    cy.get('footer').contains('Filmes em Cartaz').should('exist');
    cy.get('footer').contains('Login').should('exist');
    cy.get('footer').contains('Cadastre-se').should('exist');
    cy.get('footer').contains('Contato').should('exist');
    cy.get('footer').contains('contato@cinemaapp.com').should('exist');
    cy.get('footer').contains('Tel: (11) 5555-5555').should('exist');
    cy.get('footer').contains('Siga-nos').should('exist');
    cy.get('footer').contains(/© 2025 Cinema App/i).should('exist');
  });

  it('Deve exibir o ícone de email ao lado do texto', () => {
    cy.get('footer').contains('contato@cinemaapp.com')
      .parent()
      .find('img, svg').should('exist');
  });

  it('Deve exibir os ícones das redes sociais', () => {
    cy.get('footer').contains('Siga-nos')
      .parent()
      .find('svg, img').should('have.length.at.least', 3);
    cy.get('footer').find('svg, img').eq(0).should('exist');
    cy.get('footer').find('svg, img').eq(1).should('exist');
    cy.get('footer').find('svg, img').eq(2).should('exist');
  });
});
