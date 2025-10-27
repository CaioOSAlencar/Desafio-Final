# BUG-MOVIE-001: Paginação Não Implementada Corretamente

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-001
- **Módulo**: Filmes (Movies)
- **Endpoint**: `GET /api/v1/movies`
- **Prioridade**: Media
- **Status**: Ativo
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema não implementa paginação adequada na listagem de filmes. Quando parâmetros de paginação são enviados (`page` e `limit`), o sistema não retorna um objeto `pagination` na resposta nem aplica a paginação corretamente.

## 🔍 Comportamento Observado
1. **Request**: `GET /api/v1/movies?page=2&limit=2`
2. **Resposta Atual**:
   ```json
   {
     "success": true,
     "count": 5,
     "data": [
       // Array com filmes, mas não limitado por página
     ]
     // ❌ Falta objeto "pagination"
   }
   ```

## ✅ Comportamento Esperado
```json
{
  "success": true,
  "count": 5,
  "data": [
    // Array com apenas 2 filmes (limit=2)
  ],
  "pagination": {
    "page": 2,
    "limit": 2,
    "totalPages": 3,
    "totalItems": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## 📍 Localização do Problema
- **Arquivo**: `src/controllers/movieController.js`
- **Método**: `getMovies`
- **Linha Aproximada**: Função de listagem de filmes

## 🧪 Teste que Detectou
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Teste**: `TC02 - Deve aplicar paginação corretamente`
- **Linha**: 71-93

## 🔧 Solução Sugerida
1. Implementar lógica de paginação no controller:
   ```javascript
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;
   const skip = (page - 1) * limit;
   
   const movies = await Movie.find().skip(skip).limit(limit);
   const total = await Movie.countDocuments();
   
   res.json({
     success: true,
     count: movies.length,
     data: movies,
     pagination: {
       page,
       limit,
       totalPages: Math.ceil(total / limit),
       totalItems: total,
       hasNext: page * limit < total,
       hasPrev: page > 1
     }
   });
   ```

## 📊 Impacto
- **Usuários**: Não conseguem navegar adequadamente por listas grandes de filmes
- **Performance**: Potencial sobrecarga ao carregar todos os filmes de uma vez
- **UX**: Interface não consegue implementar paginação adequada

## 🏷️ Tags
`paginação` `listagem` `performance` `controller` `query-params`