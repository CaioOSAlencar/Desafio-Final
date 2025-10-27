# BUG-SESSION-003: Validação de ObjectId Retorna 404 em Vez de 400

## Status
🟡 **MÉDIO** - Bug de Validação

## Descrição
Quando IDs inválidos (não-ObjectId) são fornecidos nas rotas de sessões, o sistema retorna erro 404 (Not Found) em vez de 400 (Bad Request), mascarando erros de validação e dificultando o debug.

## Evidência dos Testes
```javascript
// Teste esperava:
.expect(400); // Bad Request para ID inválido

// Sistema retornou:
404 "Not Found" // Para rota /api/sessions/invalid-id
```

## Comportamento Esperado
- IDs no formato inválido devem retornar **400 Bad Request**
- Mensagem clara sobre formato inválido do ID
- IDs não encontrados (mas válidos) devem retornar **404 Not Found**

## Comportamento Atual
- IDs inválidos retornam **404 Not Found**
- Não há diferenciação entre ID mal formatado e ID não encontrado
- Dificulta identificação do tipo de erro

## Análise Técnica
```javascript
// Problema provável no middleware de validação:
// Deveria validar formato do ObjectId antes de buscar no banco

// Cenários a diferenciar:
// 1. "invalid-id" -> 400 (formato inválido)
// 2. "507f1f77bcf86cd799439011" -> 404 (não encontrado, mas formato válido)
```

## Casos de Teste Afetados
- Buscar sessão com ID inválido
- Atualizar sessão com ID mal formatado
- Deletar sessão com ID não-ObjectId
- Reset de assentos com ID inválido

## Impacto no Sistema
- **User Experience**: Mensagens de erro confusas
- **Debugging**: Dificuldade em identificar causa real do erro
- **API Consistency**: Violação das boas práticas de HTTP status codes

## Solução Recomendada
1. **Adicionar middleware** de validação de ObjectId antes dos controllers
2. **Implementar validação** que diferencia:
   - Formato inválido → 400 Bad Request
   - ID não encontrado → 404 Not Found
3. **Padronizar mensagens** de erro para todos os endpoints

## Exemplo de Implementação
```javascript
// Middleware de validação de ObjectId
const { isValidObjectId } = require('mongoose');

const validateObjectId = (paramName) => (req, res, next) => {
  if (!isValidObjectId(req.params[paramName])) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${paramName} format`
    });
  }
  next();
};
```

## Prioridade
**MÉDIA** - Afeta experiência do desenvolvedor e usuário final

## Arquivos Relacionados
- `src/controllers/sessionController.js`
- `src/middleware/` (middleware de validação)
- `src/routes/sessionRoutes.js`