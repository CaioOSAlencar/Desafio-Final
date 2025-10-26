# BUG-AUTH-003: Login com Email Inválido Retorna 500 ao invés de 400

## Descrição do Bug
Quando um usuário tenta fazer login com um email em formato inválido, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 400 (Bad Request).

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
O sistema não valida o formato do email antes de tentar consultar o banco de dados, e o erro resultante não está sendo tratado adequadamente.

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/login')
  .send({
    email: "emailinvalido", // Email em formato inválido
    password: "senhaqualquer"
  })
  .expect(400); // Espera 400, mas recebe 500
```

## Código Atual (Problemático)
```javascript
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Busca usuário sem validar formato do email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    // ... resto do código
  } catch (error) {
    next(error); // Não trata especificamente erros de validação
  }
};
```

## Impacto
- **Severidade**: Média
- **Usuário**: Não recebe feedback claro sobre email inválido
- **Sistema**: Logs de erro interno desnecessários
- **UX**: Experiência confusa durante o login

## Solução Sugerida
Implementar validação de email e tratamento de erros adequado:

```javascript
const validator = require('validator');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validar formato do email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // ... resto do código existente ...
  } catch (error) {
    // Tratar erros específicos
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

## Dependências Necessárias
```json
{
  "validator": "^13.7.0"
}
```

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC01
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Média** - Afeta experiência de login mas não compromete segurança crítica