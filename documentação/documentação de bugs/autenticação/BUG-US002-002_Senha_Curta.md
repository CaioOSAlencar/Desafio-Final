# Relatório de Bug - US 002: API de Autenticação
**Título:** Validação de senha curta retornando erro interno ao invés de Bad Request

**ID:** BUG-US002-002

**Data:** 24/10/2025

**Prioridade:** Alta

**Severidade:** Média

**Ambiente:**
- Servidor: Cinema App Backend (Node.js/Express)
- Endpoint: POST /api/auth/register
- Ferramenta: Jest/Supertest
- MongoDB: Local (Docker)

## O que Aconteceu

Durante os testes de validação de segurança de senhas, foi descoberto que o sistema não está validando adequadamente o comprimento mínimo da senha antes de processar o registro do usuário.

**Fluxo do Problema:**
1. O teste enviou uma requisição POST para `/api/auth/register` com senha de apenas 3 caracteres ("123")
2. O sistema tentou processar a requisição sem verificar se a senha atende ao critério mínimo de 6 caracteres
3. O modelo User do Mongoose detectou que a senha não atende aos requisitos (`minlength: [6, 'Password must be at least 6 characters long']`)
4. Uma exceção foi lançada pelo Mongoose durante a validação
5. O controller não tratou adequadamente esta exceção de validação
6. O sistema retornou erro 500 (Internal Server Error) ao invés de 400 (Bad Request)

**Impacto de Segurança:**
- Senhas fracas podem ser processadas até o nível do banco de dados
- Mensagens de erro genéricas não orientam o usuário sobre requisitos de senha
- Logs desnecessários de erro interno quando deveria ser validação de entrada

## Passos para Reproduzir

1. Enviar POST /api/auth/register com payload:
```json
{
    "name": "João Silva", 
    "email": "joao@exemplo.com",
    "password": "123"
}
```
2. Executar a requisição

## Comportamento Observado

- **Status:** 500 Internal Server Error
- **Resposta:** Erro interno do servidor
- **Logs:** Exception não tratada do Mongoose sobre comprimento da senha

## Comportamento Esperado

- **Status:** 400 Bad Request
- **Resposta:**
```json
{
    "success": false,
    "message": "Senha deve ter pelo menos 6 caracteres"
}
```

## Critério Violado

"Sistema deve validar comprimento mínimo da senha (6 caracteres) antes de processar e retornar erro apropriado para o usuário."

## Evidências

```
Test: TC04 - Deve rejeitar registro com senha muito curta
File: tests/integration/authRoutes.test.js:115
Expected: 400 "Bad Request"
Received: 500 "Internal Server Error"

Test Input: { name: "João", email: "joao@exemplo.com", password: "123" }
Test Result: ❌ FAILED
```

**Cenário de Teste:** TC04 - Validar senha muito curta no registro

## Sugestão de Correção

Adicionar validação no arquivo `src/controllers/authController.js`, método `register`, após a validação de e-mail:

```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validar formato de email (se já implementado)
    // ... código de validação de email ...

    // ✅ ADICIONAR ESTA VALIDAÇÃO
    // Validar comprimento da senha
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    // ... resto do código
```

## Critérios de Segurança Adicionais (Recomendação)

Para melhorar ainda mais a segurança, considere implementar:
```javascript
// Validação mais robusta de senha
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({
    success: false,
    message: 'Senha deve ter pelo menos 6 caracteres, incluindo letra e número'
  });
}
```

## Validação da Correção

Após implementar a correção, executar:
```bash
npm run test:integration -- --testNamePattern="TC04"
```

**Resultado Esperado:** ✅ Teste deve passar com status 400