# BUG-AUTH-001: Validação de Email Inválido Retorna 500 ao invés de 400

## Descrição do Bug
Quando um usuário tenta se registrar com um email inválido, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 400 (Bad Request) esperado.

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
A validação do schema Mongoose está gerando uma exceção não tratada que resulta em erro 500. O controller não está capturando especificamente os erros de validação para retornar status 400.

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/register')
  .send({
    name: "Ana Silva",
    email: "email-invalido", // Email inválido
    password: "123456"
  })
  .expect(400); // Espera 400, mas recebe 500
```

## Impacto
- **Severidade**: Média
- **Usuário**: Recebe mensagem de erro genérica ao invés de feedback específico sobre email inválido
- **Sistema**: Logs desnecessários de erro interno

## Solução Sugerida
Modificar o controller `authController.js` para capturar erros de validação específicos:

```javascript
exports.register = async (req, res, next) => {
  try {
    // ... código existente ...
  } catch (error) {
    // Tratar erros de validação especificamente
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
};
```

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC03
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Média** - Afeta experiência do usuário mas não quebra funcionalidade crítica