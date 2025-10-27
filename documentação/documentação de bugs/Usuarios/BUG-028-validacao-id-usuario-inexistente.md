# Bug #28 - Validação de ID de Usuário Inexistente

## Descrição Técnica
O sistema não está implementando validação adequada para IDs de usuários inválidos ou malformados, retornando 404 ao invés de 400 Bad Request.

## Comportamento Observado
- IDs inválidos (como "id-invalido") retornam 404 Not Found
- IDs malformados não são rejeitados adequadamente
- Sistema não diferencia entre ID não encontrado vs ID malformado

## Comportamento Esperado
- IDs malformados devem retornar 400 (Bad Request)
- IDs válidos mas não encontrados devem retornar 404 (Not Found)
- Validação deve ocorrer antes da consulta ao banco de dados

## Análise Técnica
### Evidências dos Testes
```
Test: "Deve retornar erro 400 para ID inválido"
Input: "/users/id-invalido"
Expected: 400 Bad Request  
Received: 404 Not Found
```

### Possíveis Causas
1. **Middleware de validação ausente**: Não há validação de formato de ObjectId do MongoDB
2. **Tratamento de erro genérico**: Sistema trata todos os erros como 404
3. **Roteamento inadequado**: Express pode estar capturando IDs inválidos incorretamente

### Padrão MongoDB ObjectId
```javascript
// ID válido: 507f1f77bcf86cd799439011 (24 caracteres hexadecimais)
// ID inválido: "id-invalido", "123", "abc"
```

## Impacto no Sistema
- **UX**: Usuários recebem mensagens de erro imprecisas
- **Debug**: Dificulta identificação de problemas de integração
- **API**: Comportamento inconsistente com padrões RESTful

## Rotas Afetadas
- GET /users/:id
- PUT /users/:id  
- DELETE /users/:id

## Exemplo de Implementação Correta
```javascript
// Middleware de validação de ObjectId
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuário inválido'
    });
  }
  next();
};
```

## Verificações Necessárias
1. Verificar se existe middleware de validação de ObjectId
2. Testar diferentes formatos de IDs inválidos
3. Confirmar comportamento em outras rotas com parâmetros :id
4. Revisar tratamento de erros nos controllers

## Classificação
- **Severidade**: Média
- **Prioridade**: Média
- **Categoria**: Validação/UX
- **Módulo Afetado**: Usuários (e potencialmente outros)
- **Status**: Identificado via testes automatizados

## Solução Sugerida
1. Implementar middleware de validação de ObjectId
2. Aplicar middleware em todas as rotas com parâmetros :id
3. Padronizar mensagens de erro para IDs inválidos
4. Documentar comportamento na API