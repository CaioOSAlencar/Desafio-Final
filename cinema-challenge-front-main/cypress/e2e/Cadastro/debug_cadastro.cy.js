// Salve em: cypress/e2e/Cadastro/debug_cadastro.cy.js

describe('DEBUG - Cadastro', () => {
  it('Deve inspecionar os elementos da página de cadastro', () => {
    cy.visit('/register');
    
    // Aguardar página carregar
    cy.wait(1000);
    
    // Inspecionar todos os elementos
    cy.log('=== INSPECIONANDO FORMULÁRIO ===');
    
    // Verificar inputs
    cy.get('input').each(($el, index) => {
      cy.log(`Input ${index}:`, {
        id: $el.attr('id'),
        name: $el.attr('name'),
        type: $el.attr('type'),
        placeholder: $el.attr('placeholder'),
        required: $el.attr('required')
      });
    });
    
    // Verificar botão
    cy.get('button[type="submit"]').then(($btn) => {
      cy.log('Botão submit:', $btn.text());
    });
  });

  it('Deve clicar no botão e ver o que acontece', () => {
    cy.visit('/register');
    cy.wait(1000);
    
    // Capturar antes de clicar
    cy.log('=== ANTES DE CLICAR ===');
    cy.screenshot('antes-click');
    
    // Clicar no botão
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    
    // Aguardar um pouco
    cy.wait(2000);
    
    // Capturar depois de clicar
    cy.log('=== DEPOIS DE CLICAR ===');
    cy.screenshot('depois-click');
    
    // Ver todo o conteúdo da página
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

  it('Deve testar validação nativa do HTML5', () => {
    cy.visit('/register');
    
    // Verificar se inputs têm required
    cy.get('input#name').should('have.attr', 'required');
    cy.get('input#email').should('have.attr', 'required');
    cy.get('input#password').should('have.attr', 'required');
    cy.get('input#confirmPassword').should('have.attr', 'required');
    
    // Tentar submeter (validação nativa deve impedir)
    cy.get('button[type="submit"]').click();
    
    // Verificar se ainda está na página de cadastro
    cy.url().should('include', '/register');
    
    cy.log('✅ Validação HTML5 está funcionando');
  });
});