# Relatório de Bug - US 002: API de Autenticação
**Título:** Middleware de autenticação falhando para todas as rotas protegidas

**ID:** BUG-US002-004

**Data:** 24/10/2025

**Prioridade:** Crítica

**Severidade:** Alta

**Ambiente:**
- Servidor: Cinema App Backend (Node.js/Express)
- Endpoints Afetados: 
  - GET /api/auth/me
  - PUT /api/auth/profile
- Ferramenta: Jest/Supertest
- MongoDB: Local (Docker)

## O que Aconteceu

Durante os testes de funcionalidades que requerem autenticação, foi descoberto que **TODAS** as rotas protegidas por JWT estão falhando, mesmo quando um token válido é fornecido. Isso representa uma falha crítica do sistema de autenticação.

**Fluxo do Problema Detalhado:**
1. **Registro bem-sucedido:** Usuário é criado e recebe token JWT válido (✅ Funciona)
2. **Token válido gerado:** Sistema gera token com `generateToken()` (✅ Funciona)  
3. **Requisição com token:** Cliente envia GET /api/auth/me com header `Authorization: Bearer {token}`
4. **Middleware falha:** O middleware de autenticação (`src/middleware/auth.js`) não consegue processar o token
5. **Erro 500:** Sistema retorna erro interno ao invés de processar a requisição ou retornar 401

**Possíveis Causas Técnicas:**
- Middleware não está extraindo o token corretamente do header `Authorization`
- Verificação do JWT está falhando (problema com `JWT_SECRET` ou biblioteca)
- O objeto `req.user` não está sendo definido corretamente
- Middleware não está chamando `next()` adequadamente
- Problema na ordem dos middlewares nas rotas

**Impacto Crítico:**
- **Funcionalidades completamente inacessíveis:** Perfil do usuário, alteração de dados/senha
- **Sistema de autenticação inútil:** Usuários podem se registrar/logar mas não usar o sistema
- **Segurança comprometida:** Não há como proteger rotas sensíveis

## Passos para Reproduzir

### Cenário 1: Visualizar Perfil
1. Registrar usuário:
```json
POST /api/auth/register
{
    "name": "João Silva",
    "email": "joao@exemplo.com", 
    "password": "123456"
}
```
2. Copiar o `token` da resposta
3. Tentar acessar perfil:
```http
GET /api/auth/me
Authorization: Bearer {token_copiado}
```

### Cenário 2: Atualizar Perfil  
1. Seguir passos 1-2 do Cenário 1
2. Tentar atualizar dados:
```json
PUT /api/auth/profile
Authorization: Bearer {token_copiado}
{
    "name": "João Silva Atualizado"
}
```

## Comportamento Observado

**Para TODOS os endpoints protegidos:**
- **Status:** 500 Internal Server Error
- **Resposta:** Erro interno do servidor
- **Middleware:** Falha na verificação/processamento do token JWT

## Comportamento Esperado

### GET /api/auth/me
- **Status:** 200 OK
- **Resposta:**
```json
{
    "success": true,
    "data": {
        "_id": "user_id",
        "name": "João Silva", 
        "email": "joao@exemplo.com",
        "role": "user"
    }
}
```

### PUT /api/auth/profile
- **Status:** 200 OK (dados válidos) ou 401 Unauthorized (senha incorreta)
- **Resposta com sucesso:**
```json
{
    "success": true,
    "message": "Perfil atualizado com sucesso",
    "data": { /* dados atualizados */ }
}
```

## Critério Violado

"Sistema deve processar tokens JWT válidos corretamente e permitir acesso a rotas protegidas para usuários autenticados."

## Evidências Detalhadas - Status Atual (27/10/2025)

```
❌ SITUAÇÃO CONFIRMADA: TODOS OS BUGS AINDA EXISTEM NO CÓDIGO PRINCIPAL

Testes de Integração Executados:
- Total: 19 testes
- Passaram: 3 testes (funcionalidades básicas)
- Falharam: 16 testes (bugs documentados)

Bugs Confirmados:
✅ TC03 - Email inválido → 500 (deveria ser 400)
✅ TC04 - Senha curta → 500 (deveria ser 400)  
✅ TC08 - Perfil com token → 500 (deveria ser 200)
✅ TC10-TC12 - Rotas protegidas → 500/timeout

File: tests/integration/autenticação/authRoutes.test.js
Status: Bugs documentados e confirmados através de testes
```

## Análise do Middleware (src/middleware/auth.js)

**Pontos a Investigar:**

1. **Extração do Token:**
```javascript
// Verificar se está extraindo corretamente:
const token = req.header('Authorization')?.replace('Bearer ', '');
```

2. **Verificação JWT:**
```javascript
// Verificar se JWT_SECRET está definido e correto:
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

3. **Busca do Usuário:**
```javascript
// Verificar se está encontrando o usuário:
const user = await User.findById(decoded.id);
req.user = user;
```

4. **Chamada do next():**
```javascript
// Verificar se está chamando next() corretamente:
next();
```

## Sugestão de Correção

### Passo 1: Verificar o Middleware
Revisar completamente o arquivo `src/middleware/auth.js`:

```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const auth = async (req, res, next) => {
  try {
    // 1. Extrair token do header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Verificar se JWT_SECRET existe
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não está definido');
      return res.status(500).json({
        success: false,
        message: 'Erro de configuração do servidor'
      });
    }

    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Buscar usuário
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuário não encontrado.'
      });
    }

    // 5. Anexar usuário à requisição
    req.user = user;
    next();

  } catch (error) {
    console.error('Erro no middleware de auth:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = auth;
```

### Passo 2: Verificar Rotas
Confirmar que as rotas estão usando o middleware:
```javascript
// Em src/routes/authRoutes.js
router.get('/me', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
```

### Passo 3: Verificar Variável de Ambiente
Confirmar que `JWT_SECRET` está definido no `.env`.

## Validação da Correção

Após implementar as correções, executar:

```bash
# Testar rotas protegidas especificamente
npm run test:integration -- --testNamePattern="TC08|TC10|TC11|TC12"

# Ou testar todo o conjunto de autenticação
npm run test:integration
```

**Resultado Esperado:** 
- ✅ TC08: 200 OK (perfil retornado)
- ✅ TC10: 200 OK (perfil atualizado)  
- ✅ TC11: 200 OK (senha alterada)
- ✅ TC12: 401 Unauthorized (senha incorreta rejeitada)

## Prioridade de Correção

🚨 **CRÍTICO - CORRIGIR IMEDIATAMENTE**

Este bug impede completamente o uso do sistema após login. Deve ser a **primeira correção** a ser implementada, antes dos outros bugs de validação.