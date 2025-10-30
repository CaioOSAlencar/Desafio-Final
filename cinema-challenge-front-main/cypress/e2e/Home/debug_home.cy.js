
describe('DEBUG - Home', () => {
  before(() => {
    // Realizar login antes de acessar Home
    cy.visit('/login');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('admin123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1500);
    cy.url().then(url => {
      if (url.includes('/login')) {
        cy.log('⚠️ Ainda está na página de login. Verifique se o backend está rodando ou se as credenciais estão corretas.');
      } else {
        cy.log('✅ Login realizado e saiu da página de login.');
      }
    });
  });

  it('Deve inspecionar os elementos da página Home', () => {
    cy.visit('/');
    cy.wait(1000);
    cy.log('=== INSPECIONANDO HOME ===');
    // Inspecionar títulos e seções principais
    cy.get('h1').should('exist').then($el => {
      cy.log('Título:', $el.text());
    });
    cy.get('.features-section').should('exist');
    cy.get('.featured-movies').should('exist');
    cy.get('.coming-soon').should('exist');
    // Inspecionar botões principais
    cy.get('button, .btn, .btn-lg, .btn-primary').each(($btn, idx) => {
      cy.log(`Botão ${idx}:`, $btn.text());
    });
  });

  it('Deve clicar no botão principal e ver o que acontece', () => {
    cy.visit('/');
    cy.wait(1000);
    cy.log('=== ANTES DE CLICAR ===');
    cy.screenshot('antes-click-home');
    cy.get('.cta-buttons .btn-lg, .btn-primary').first().click();
    cy.wait(2000);
    cy.log('=== DEPOIS DE CLICAR ===');
    cy.screenshot('depois-click-home');
    cy.get('body').then(($body) => {
      cy.log('Conteúdo do body:', $body.text());
    });
    // Procurar elementos com classes de erro comuns
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

  it('Deve validar que não há inputs obrigatórios na Home', () => {
    cy.visit('/');
    cy.get('input[required]').should('not.exist');
    cy.log('✅ Não há inputs obrigatórios na Home');
  });
});
