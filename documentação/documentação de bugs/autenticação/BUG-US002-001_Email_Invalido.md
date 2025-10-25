# Relatório de Bug - US 002: API de Autenticação
**Título:** Validação de e-mail inválido retornando erro interno ao invés de Bad Request

**ID:** BUG-US002-001

**Data:** 24/10/2025

**Prioridade:** Alta

**Severidade:** Média

**Ambiente:**
- Servidor: Cinema App Backend (Node.js/Express)
- Endpoint: POST /api/auth/register
- Ferramenta: Jest/Supertest
- MongoDB: Local (Docker)

## O que Aconteceu

Durante a execução dos testes automatizados de validação de entrada no sistema de autenticação, foi identificado que quando um usuário tenta se registrar com um e-mail em formato inválido, o sistema não está validando adequadamente os dados de entrada.

**Fluxo do Problema:**
1. O teste enviou uma requisição POST para `/api/auth/register` com e-mail no formato "email-invalido" (sem @ e domínio)
2. O sistema tentou processar a requisição sem validar o formato do e-mail primeiro
3. O modelo Mongoose detectou o e-mail inválido e lançou uma exceção
4. A exceção não foi tratada adequadamente no controller
5. O sistema retornou erro 500 (Internal Server Error) ao invés de 400 (Bad Request)

**Impacto Técnico:**
- O erro 500 indica falha interna do servidor, quando deveria ser erro de validação (400)
- Logs do servidor ficam poluídos com erros desnecessários
- Experiência do usuário prejudicada com mensagem genérica de erro

## Passos para Reproduzir

1. Enviar POST /api/auth/register com payload:
```json
{
    "name": "João Silva",
    "email": "email-invalido",
    "password": "123456"
}
```
2. Executar a requisição

## Comportamento Observado

- **Status:** 500 Internal Server Error
- **Resposta:** Erro interno do servidor (sem mensagem específica para o usuário)

## Comportamento Esperado

- **Status:** 400 Bad Request
- **Resposta:**
```json
{
    "success": false,
    "message": "E-mail inválido"
}
```

## Critério Violado

"Sistema deve validar formato de e-mail antes de processar e retornar erro 400 para dados inválidos."

## Evidências

```
Test: TC03 - Deve rejeitar registro com email inválido
File: tests/integration/authRoutes.test.js:99
Expected: 400 "Bad Request"
Received: 500 "Internal Server Error"

Test Result: ❌ FAILED
```

**Cenário de Teste:** TC03 - Validar e-mail inválido no registro

## Sugestão de Correção

Adicionar validação no arquivo `src/controllers/authController.js`, método `register`, **antes** da linha que chama `User.findOne()`:

```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ✅ ADICIONAR ESTA VALIDAÇÃO
    // Validar formato de email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'E-mail inválido'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    // ... resto do código
```

## Validação da Correção

Após implementar a correção, executar:
```bash
npm run test:integration -- --testNamePattern="TC03"
```

**Resultado Esperado:** ✅ Teste deve passar com status 400