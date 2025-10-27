# BUG-MOVIE-003: Filtros de Busca Não Implementados

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-003
- **Módulo**: Filmes (Movies)
- **Endpoint**: `GET /api/v1/movies`
- **Prioridade**: Media
- **Status**: Ativo
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema não implementa filtros de busca por título e gênero na listagem de filmes. Quando parâmetros de filtro são enviados (`title`, `genre`), o sistema ignora esses parâmetros e retorna todos os filmes.

## 🔍 Comportamento Observado
1. **Request**: `GET /api/v1/movies?title=Especial`
2. **Resposta Atual**:
   ```json
   {
     "success": true,
     "count": 2,
     "data": [
       {
         "title": "Filme Especial"
       },
       {
         "title": "Outro Filme"  // ❌ Não deveria aparecer
       }
     ]
   }
   ```

3. **Request**: `GET /api/v1/movies?genre=Drama`
4. **Resposta Atual**: Retorna todos os filmes, independente do gênero

## ✅ Comportamento Esperado
1. **Para filtro por título**:
   ```json
   {
     "success": true,
     "count": 1,
     "data": [
       {
         "title": "Filme Especial"
       }
     ]
   }
   ```

2. **Para filtro por gênero**:
   ```json
   {
     "success": true,
     "count": 1,
     "data": [
       {
         "title": "Filme Drama",
         "genres": ["Drama"]
       }
     ]
   }
   ```

## 📍 Localização do Problema
- **Arquivo**: `src/controllers/movieController.js`
- **Método**: `getMovies`
- **Linha Aproximada**: Função de listagem de filmes

## 🧪 Testes que Detectaram
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Testes**: 
  - `TC03 - Deve filtrar filmes por título` (linha 94-113)
  - `TC04 - Deve filtrar filmes por gênero` (linha 115-134)

## 🔧 Solução Sugerida
Implementar lógica de filtros no controller:

```javascript
const getMovies = async (req, res, next) => {
  try {
    const { title, genre, page = 1, limit = 10 } = req.query;
    
    // Construir filtros
    const filters = {};
    
    if (title) {
      filters.title = { $regex: title, $options: 'i' }; // Case-insensitive
    }
    
    if (genre) {
      filters.genres = { $in: [genre] }; // Array contains genre
    }
    
    const skip = (page - 1) * limit;
    
    const movies = await Movie.find(filters)
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Movie.countDocuments(filters);
    
    res.json({
      success: true,
      count: movies.length,
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## 📊 Impacto
- **Usuários**: Não conseguem buscar filmes específicos
- **UX**: Interface não consegue implementar busca/filtros
- **Performance**: Sempre retorna todos os filmes, desperdiçando recursos

## 🏷️ Tags
`filtros` `busca` `query-params` `listagem` `performance`