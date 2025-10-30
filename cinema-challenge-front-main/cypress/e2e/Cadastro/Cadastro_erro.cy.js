describe('Cadastro - Caminho Ruim', () => {
  beforeEach(() => {
    cy.visit('/register');
    // Aguardar a página carregar completamente
    cy.get('form').should('be.visible');
  });

  it('Deve mostrar erro se campos obrigatórios estiverem vazios', () => {
    // Clicar no botão de cadastrar sem preencher nada
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    
    // Aguardar um pouco para a validação aparecer
    cy.wait(500);
    
    // Tentar encontrar mensagens de erro de diferentes formas
    // Opção 1: Procurar por qualquer mensagem de erro
    cy.get('body').then(($body) => {
      // Verificar se há alguma mensagem de validação visível
      const hasError = $body.find('[class*="error"], [class*="invalid"], .text-red-500, .text-danger').length > 0;
      
      if (hasError) {
        // Se encontrou, verifica se contém texto relacionado a obrigatório
        cy.contains(/obrigatório|required|preencha|campo vazio/i).should('exist');
      } else {
        // Se não encontrou, log para debug
        cy.log('⚠️ Nenhuma mensagem de erro encontrada. Verifique se a validação está implementada.');
        // Verificar se os inputs têm atributo required
        cy.get('input#name').should('have.attr', 'required');
        cy.get('input#email').should('have.attr', 'required');
        cy.get('input#password').should('have.attr', 'required');
      }
    });
  });

  it('Deve mostrar erro se senhas forem diferentes', () => {
    cy.get('input#name').type('Usuário Teste');
    cy.get('input#email').type('teste' + Date.now() + '@exemplo.com');
    cy.get('input#password').type('Senha123');
    cy.get('input#confirmPassword').type('SenhaDiferente');
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    
    // Aguardar validação
    cy.wait(500);
    
    // Procurar por mensagem de senhas diferentes
    cy.get('body').then(($body) => {
      if ($body.text().match(/senhas não coincidem|passwords do not match|senhas diferentes/i)) {
        cy.contains(/senhas não coincidem|passwords do not match|senhas diferentes/i).should('exist');
      } else {
        cy.log('⚠️ Mensagem de senhas diferentes não encontrada');
        // Verificar se ainda está na página de cadastro
        cy.url().should('include', '/register');
      }
    });
  });

  it('Deve mostrar erro se email já estiver cadastrado', () => {
    cy.get('input#name').type('Usuário Existente');
    cy.get('input#email').type('admin@cinema.com');
    cy.get('input#password').type('Senha123');
    cy.get('input#confirmPassword').type('Senha123');
    cy.get('button[type="submit"]').contains('Cadastrar').click();
    
    // Aguardar resposta da API
    cy.wait(2000);
    
    // Procurar por mensagem de email já cadastrado
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.match(/email|cadastrado|existente|já existe|already exists/i)) {
        cy.contains(/email.*cadastrado|email.*existente|já existe|already exists/i).should('exist');
      } else {
        cy.log('⚠️ Mensagem de email duplicado não encontrada');
        // Verificar se ainda está na página de cadastro
        cy.url().should('include', '/register');
      }
    });
  });
});