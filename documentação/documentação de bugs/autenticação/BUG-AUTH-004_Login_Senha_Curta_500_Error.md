# BUG-AUTH-004: Login com Senha Inválida Retorna 500 ao invés de 400

## Descrição do Bug
Quando um usuário tenta fazer login com uma senha muito curta (menos de 6 caracteres), o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 400 (Bad Request).

## Comportamento Esperado
- Status: **400 Bad Request**
- Response body: `{ success: false, message: 'Invalid credentials' }`

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `login`
- **Linha**: Aproximadamente 50-89

## Causa Raiz
O sistema não valida o comprimento mínimo da senha durante o login, e o erro resultante da validação não está sendo tratado adequadamente.

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/login')
  .send({
    email: "joao@exemplo.com",
    password: "123" // Senha muito curta (< 6 chars)
  })
  .expect(400); // Espera 400, mas recebe 500
```

## Análise do Problema
O problema ocorre quando:
1. Usuário fornece senha com menos de 6 caracteres
2. Sistema tenta processar login sem validação prévia
3. Erro interno é gerado e não tratado adequadamente
4. Retorna 500 ao invés de 400

## Impacto
- **Severidade**: Média
- **Usuário**: Não recebe feedback claro sobre credenciais inválidas
- **Sistema**: Logs de erro interno desnecessários
- **UX**: Experiência confusa durante tentativa de login

## Solução Sugerida
Implementar validação de entrada no login:

```javascript
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Validar formato do email e comprimento da senha
    if (!validator.isEmail(email) || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // ... resto do código existente ...
  } catch (error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    next(error);
  }
};
```

## Considerações de Segurança
- Não especificar se o erro é de email ou senha (segurança por obscuridade)
- Manter mensagem genérica "Invalid credentials"
- Evitar vazar informações sobre usuários existentes

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC02
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Média** - Afeta experiência de login mas mantém segurança básica