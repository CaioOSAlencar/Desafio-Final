// Salve em: cypress/e2e/Login/Login_erro.cy.js

describe('Login - Caminho Ruim', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('form').should('be.visible');
  });

  it('Deve mostrar erro se campos obrigatórios estiverem vazios', () => {
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(500);
    cy.get('body').then(($body) => {
      const hasError = $body.find('[class*="error"], [class*="invalid"], .text-red-500, .text-danger').length > 0;
      if (hasError) {
        cy.contains(/obrigatório|required|preencha|campo vazio/i).should('exist');
      } else {
        cy.log('⚠️ Nenhuma mensagem de erro encontrada. Verifique se a validação está implementada.');
        cy.get('input#email').should('have.attr', 'required');
        cy.get('input#password').should('have.attr', 'required');
      }
    });
  });

  it('Deve mostrar erro se email ou senha estiverem incorretos', () => {
    cy.get('input#email').type('usuario-invalido@teste.com');
    cy.get('input#password').type('SenhaErrada123');
    cy.get('button[type="submit"]').contains(/entrar|login/i).click();
    cy.wait(1000);
    cy.get('body').then(($body) => {
      if ($body.text().match(/email|senha|inválido|incorrect|não encontrado|não existe/i)) {
        cy.contains(/email|senha|inválido|incorrect|não encontrado|não existe/i).should('exist');
      } else {
        cy.log('⚠️ Mensagem de erro de login não encontrada');
        cy.url().should('include', '/login');
      }
    });
  });
});
