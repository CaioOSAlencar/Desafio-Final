# Relatório de Bug - US 002: API de Autenticação
**Título:** Validação de campos obrigatórios retornando erro interno ao invés de Bad Request

**ID:** BUG-US002-003

**Data:** 24/10/2025

**Prioridade:** Alta

**Severidade:** Média

**Ambiente:**
- Servidor: Cinema App Backend (Node.js/Express)
- Endpoint: POST /api/auth/register
- Ferramenta: Jest/Supertest
- MongoDB: Local (Docker)

## O que Aconteceu

Durante os testes de validação de entrada, foi identificado que quando um usuário tenta se registrar sem fornecer os campos obrigatórios (nome, email, senha), o sistema não está fazendo a validação prévia adequada.

**Fluxo do Problema:**
1. O teste enviou uma requisição POST para `/api/auth/register` com payload completamente vazio `{}`
2. O controller tentou extrair `name`, `email` e `password` do `req.body`, resultando em valores `undefined`
3. O sistema prosseguiu com a lógica sem verificar se os campos estavam presentes
4. Quando tentou processar no Mongoose, múltiplas validações de campo obrigatório falharam simultaneamente
5. O Mongoose lançou exceções de validação que não foram tratadas adequadamente
6. O sistema retornou erro 500 (Internal Server Error) ao invés de 400 (Bad Request) com mensagem clara

**Impacto na Experiência do Usuário:**
- Usuários não recebem feedback claro sobre quais campos são obrigatórios
- Erro 500 sugere problema do servidor, não erro do usuário
- Dificulta a integração com clientes frontend que esperam códigos de status apropriados

## Passos para Reproduzir

1. Enviar POST /api/auth/register com payload vazio:
```json
{}
```
2. Executar a requisição

## Comportamento Observado

- **Status:** 500 Internal Server Error
- **Resposta:** Erro interno do servidor
- **Logs:** Múltiplas exceções de validação do Mongoose não tratadas

## Comportamento Esperado

- **Status:** 400 Bad Request
- **Resposta:**
```json
{
    "success": false,
    "message": "Nome, email e senha são obrigatórios"
}
```

## Critério Violado

"Sistema deve validar presença de todos os campos obrigatórios antes de processar e retornar feedback claro ao usuário."

## Evidências

```
Test: Deve rejeitar registro sem campos obrigatórios
File: tests/integration/authRoutes.test.js:128
Expected: 400 "Bad Request"
Received: 500 "Internal Server Error"

Test Input: {} (payload vazio)
Test Result: ❌ FAILED
```

**Cenário de Teste:** Validar campos obrigatórios no registro

## Sugestão de Correção

Adicionar validação no arquivo `src/controllers/authController.js`, método `register`, **no início** do try block:

```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ✅ ADICIONAR ESTA VALIDAÇÃO PRIMEIRO
    // Validar campos obrigatórios
    if (!name || !email || !password) {
      const missingFields = [];
      if (!name) missingFields.push('nome');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('senha');
      
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(', ')} ${missingFields.length > 1 ? 'são' : 'é'} obrigatório${missingFields.length > 1 ? 's' : ''}`
      });
    }

    // Validação mais simples alternativa:
    // if (!name || !email || !password) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Nome, email e senha são obrigatórios'
    //   });
    // }

    // ... validações de formato (email, senha) ...
    // ... resto do código ...
```

## Validação Adicional Recomendada

Para melhorar a experiência, também validar campos vazios (strings em branco):

```javascript
// Validar se campos não estão vazios (além de não serem undefined)
if (!name?.trim() || !email?.trim() || !password?.trim()) {
  return res.status(400).json({
    success: false,
    message: 'Nome, email e senha não podem estar vazios'
  });
}
```

## Casos de Teste Relacionados

Este bug também pode afetar cenários onde:
- Apenas alguns campos são fornecidos
- Campos são enviados com valores `null` ou string vazia
- Campos são enviados com apenas espaços em branco

## Validação da Correção

Após implementar a correção, executar:
```bash
npm run test:integration -- --testNamePattern="campos obrigatórios"
```

**Resultado Esperado:** ✅ Teste deve passar com status 400 e mensagem clara