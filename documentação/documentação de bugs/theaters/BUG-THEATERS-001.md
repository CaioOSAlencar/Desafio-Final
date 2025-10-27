# BUG-THEATERS-001: Filtros de Busca Não Implementados

## Status
🟡 **MÉDIO** - Bug de Funcionalidade

## Descrição
O sistema de filtros por tipo de theater não está funcionando corretamente. Quando uma busca por tipo específico é realizada (`?type=IMAX`), o sistema retorna todos os theaters ao invés de filtrar apenas os do tipo solicitado.

## Evidência dos Testes
```javascript
// Teste executado:
GET /api/v1/theaters?type=IMAX

// Resultado esperado:
// Apenas theaters do tipo "IMAX"

// Resultado obtido:
// Todos os theaters, incluindo "standard", "3D", "VIP"
// Error: expect(received).toBe(expected)
// Expected: "IMAX"
// Received: "standard"
```

## Comportamento Esperado
- Filtro `?type=IMAX` deve retornar apenas theaters do tipo IMAX
- Filtro `?type=VIP` deve retornar apenas theaters VIP
- Filtros inválidos devem ser ignorados ou retornar lista vazia
- Múltiplos filtros devem funcionar em conjunto

## Comportamento Atual
- Sistema ignora completamente o parâmetro `type`
- Retorna todos os theaters independentemente do filtro
- Nenhum erro é gerado (comportamento silencioso)

## Análise Técnica
```javascript
// Problema provável no controller theaterController.js:
exports.getTheaters = async (req, res, next) => {
  try {
    // BUG: Não está utilizando req.query.type
    const theaters = await Theater.find(); // ← Busca todos sem filtro
    
    // Deveria ser algo como:
    // const filter = {};
    // if (req.query.type) filter.type = req.query.type;
    // const theaters = await Theater.find(filter);
```

## Cenários Afetados
- Busca por tipo de theater específico
- Filtros combinados (tipo + ordenação)
- Interface frontend que depende de filtros
- APIs de terceiros que consomem este endpoint

## Impacto no Sistema
- **User Experience**: Usuários não conseguem filtrar theaters
- **Performance**: Retorna dados desnecessários sempre
- **Frontend Integration**: Necessita filtrar no lado cliente
- **API Usability**: Funcionalidade documentada não funciona

## Solução Recomendada
```javascript
// Correção no theaterController.js
exports.getTheaters = async (req, res, next) => {
  try {
    const filter = {};
    const { type, sort, limit = 10, page = 1 } = req.query;
    
    // Aplicar filtro de tipo
    if (type && ['standard', '3D', 'IMAX', 'VIP'].includes(type)) {
      filter.type = type;
    }
    
    let query = Theater.find(filter);
    
    // Aplicar ordenação se fornecida
    if (sort) {
      query = query.sort(sort);
    }
    
    // Aplicar paginação
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(parseInt(limit));
    
    const theaters = await query;
    
    res.json({
      success: true,
      count: theaters.length,
      data: theaters
    });
  } catch (error) {
    next(error);
  }
};
```

## Validação da Correção
1. Testar filtro por cada tipo: `?type=IMAX`, `?type=VIP`, etc.
2. Verificar comportamento com tipos inválidos
3. Confirmar que busca sem filtro ainda retorna todos
4. Testar combinação com outros parâmetros

## Prioridade
**MÉDIA** - Funcionalidade útil mas não crítica para operação básica

## Arquivos Relacionados
- `src/controllers/theaterController.js` - Implementação do filtro
- `src/routes/theaterRoutes.js` - Documentação da API
- Documentação Swagger - Atualizar exemplos de uso