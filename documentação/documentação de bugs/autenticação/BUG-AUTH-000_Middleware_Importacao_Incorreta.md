# BUG-AUTH-000: Middleware de Autenticação com Importação Incorreta (Bug Raiz)

## Descrição do Bug
O middleware de autenticação (`src/middleware/auth.js`) está importando o modelo User de forma incorreta, causando erro 500 em todas as rotas protegidas.

## Comportamento Esperado
- Middleware deveria funcionar corretamente
- Rotas protegidas deveriam retornar dados ou erro 401/403 apropriado
- `req.user` deveria ser definido corretamente

## Comportamento Atual
- Todas as rotas protegidas retornam 500 Internal Server Error
- `req.user` não é definido corretamente
- Middleware falha na importação do modelo User

## Localização do Problema
- **Arquivo**: `src/middleware/auth.js`
- **Linha**: 2
- **Código Problemático**: `const { User } = require('../models');`

## Causa Raiz Identificada
**Importação incorreta do modelo User**

**Problema:**
```javascript
// auth.js linha 2 - INCORRETA
const { User } = require('../models');
```

**Estrutura real em models/index.js:**
```javascript
// models/index.js exporta assim:
module.exports = {
  User,      // ← Exportação correta
  Movie,
  Theater,
  Session,
  Reservation
};
```

A importação está tecnicamente correta, mas pode ter problema de timing ou circular dependency.

## Solução Definitiva
Importar diretamente do arquivo User.js:

```javascript
// ANTES (Problemático):
const { User } = require('../models');

// DEPOIS (Correto):
const User = require('../models/User');
```

## Código Corrigido Completo
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ← CORREÇÃO AQUI

/**
 * Protect routes - Verify if the user is authenticated
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// ... resto do código permanece igual
```

## Impacto Massivo
Este bug é a **CAUSA RAIZ** de múltiplos outros bugs:

### Bugs Diretamente Causados:
- ✅ **BUG-AUTH-007**: Obter perfil (500 error)
- ✅ **BUG-AUTH-008**: Atualizar perfil (500 error)  
- ✅ **BUG-AUTH-009**: Alterar senha válida (500 error)
- ✅ **BUG-AUTH-010**: Senha incorreta (500 error)

### Possível Impacto Indireto:
- **BUG-AUTH-003**: Login com email inválido (se req.user usado)
- **BUG-AUTH-004**: Login com senha curta (se req.user usado)

## Severidade
- **Crítica** - Bug raiz que quebra toda autenticação
- Todas as rotas protegidas estão falhando
- Sistema de autenticação completamente comprometido

## Testes Afetados
- `tests/integration/authRoutes.test.js`:
  - TC08: Obter perfil com token válido ❌
  - TC10: Atualizar perfil com dados válidos ❌
  - TC11: Alterar senha com senha atual correta ❌
  - TC12: Rejeitar alteração com senha atual incorreta ❌

## Prioridade de Correção
**IMEDIATA** - Deve ser corrigido PRIMEIRO antes de investigar outros bugs de autenticação.

## Verificação da Correção
Após aplicar a correção:
1. Rodar testes de integração
2. Verificar se bugs dependentes são automaticamente resolvidos
3. Confirmar que `req.user` é definido corretamente

## Data de Identificação
26 de outubro de 2025

## Status
**Identificado** - Solução clara e definida