// Salve em: cypress/e2e/Login/debug_login.cy.js

describe('DEBUG - Login', () => {
  it('Deve inspecionar os elementos da página de login', () => {
    cy.visit('/login');
    cy.wait(1000);
    cy.log('=== INSPECIONANDO FORMULÁRIO DE LOGIN ===');
    cy.get('input').each(($el, index) => {
      cy.log(`Input ${index}:`, {
        id: $el.attr('id'),
        name: $el.attr('name'),
        type: $el.attr('type'),
        placeholder: $el.attr('placeholder'),
        required: $el.attr('required')
      });
    });
    cy.get('button[type="submit"]').then(($btn) => {
      cy.log('Botão submit:', $btn.text());
    });
  });

  it('Deve clicar no botão e ver o que acontece', () => {
    cy.visit('/login');
    cy.wait(1000);
    cy.log('=== ANTES DE CLICAR ===');
    cy.screenshot('antes-click-login');
    cy.get('button[type="submit"]').click();
    cy.wait(2000);
    cy.log('=== DEPOIS DE CLICAR ===');
    cy.screenshot('depois-click-login');
    cy.get('body').then(($body) => {
      cy.log('Conteúdo do body:', $body.text());
    });
    cy.get('body').then(($body) => {
      const errorClasses = [
        '.error',
        '.invalid',
        '.text-red-500',
        '.text-danger',
        '[class*="error"]',
        '[class*="invalid"]',
        'span[style*="red"]',
        'p[style*="red"]'
      ];
      errorClasses.forEach(selector => {
        const elements = $body.find(selector);
        if (elements.length > 0) {
          cy.log(`Encontrado ${elements.length} elemento(s) com ${selector}`);
          elements.each((i, el) => {
            cy.log(`  ${i}: ${el.innerText}`);
          });
        }
      });
    });
  });

  it('Deve testar validação nativa do HTML5', () => {
    cy.visit('/login');
    cy.get('input#email').should('have.attr', 'required');
    cy.get('input#password').should('have.attr', 'required');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');
    cy.log('✅ Validação HTML5 está funcionando no login');
  });
});
