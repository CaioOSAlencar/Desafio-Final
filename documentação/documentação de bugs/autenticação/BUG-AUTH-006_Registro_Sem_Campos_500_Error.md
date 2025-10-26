# BUG-AUTH-006: Registro Sem Campos Obrigatórios Retorna 500 ao invés de 400

## Descrição do Bug
Quando um usuário tenta se registrar sem fornecer campos obrigatórios (name, email, password), o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 400 (Bad Request).

## Comportamento Esperado
- Status: **400 Bad Request**
- Response body: `{ success: false, message: 'validation failed' }`

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `register`
- **Linha**: Aproximadamente 8-48

## Causa Raiz
Os campos obrigatórios definidos no schema do User (name, email, password) estão gerando exceções de validação que não são tratadas adequadamente pelo controller.

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/register')
  .send({}) // Nenhum campo fornecido
  .expect(400); // Espera 400, mas recebe 500
```

## Schema do User (Campos Obrigatórios)
```javascript
// src/models/User.js
name: {
  type: String,
  required: [true, 'Name is required'],
  trim: true
},
email: {
  type: String,
  required: [true, 'Email is required'],
  unique: true,
  trim: true,
  lowercase: true,
  match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
},
password: {
  type: String,
  required: [true, 'Password is required'],
  minlength: [6, 'Password must be at least 6 characters long'],
  select: false
}
```

## Impacto
- **Severidade**: Média
- **Usuário**: Não recebe feedback claro sobre campos obrigatórios
- **Sistema**: Logs de erro interno desnecessários
- **UX**: Formulários não informam adequadamente sobre campos necessários

## Solução Sugerida
Implementar tratamento específico para erros de validação:

```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    
    // Validação básica antes de criar usuário
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      });
    }
    
    // ... resto do código ...
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }
    
    // Tratar erro de email duplicado
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });  
    }
    
    next(error);
  }
};
```

## Relacionado aos Bugs
- **BUG-AUTH-001**: Email inválido (mesmo tratamento de validação)
- **BUG-AUTH-002**: Senha muito curta (mesmo tratamento de validação)

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - "Deve rejeitar registro sem campos obrigatórios"
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Média** - Afeta validação de entrada mas parte do fluxo normal de validação