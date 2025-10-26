# BUG-AUTH-002: Validação de Senha Curta Retorna 500 ao invés de 400

## Descrição do Bug
Quando um usuário tenta se registrar com uma senha menor que 6 caracteres, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 400 (Bad Request).

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
A validação de `minlength: 6` no schema do User está gerando uma exceção de validação que não é tratada adequadamente, resultando em erro 500 ao invés de 400.

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/register')
  .send({
    name: "Pedro Silva",
    email: "pedro@exemplo.com",
    password: "123" // Senha muito curta (< 6 chars)
  })
  .expect(400); // Espera 400, mas recebe 500
```

## Dados do Schema
```javascript
// src/models/User.js
password: {
  type: String,
  required: [true, 'Password is required'],
  minlength: [6, 'Password must be at least 6 characters long'],
  select: false
}
```

## Impacto
- **Severidade**: Média
- **Usuário**: Não recebe feedback claro sobre o problema da senha
- **Sistema**: Logs de erro interno desnecessários
- **UX**: Experiência confusa para o usuário

## Solução Sugerida
Implementar tratamento específico para erros de validação no controller:

```javascript
exports.register = async (req, res, next) => {
  try {
    // ... código existente ...
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: messages
      });
    }
    next(error);
  }
};
```

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC04
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Média** - Afeta validação de entrada mas não compromete segurança crítica