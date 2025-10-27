# BUG-MOVIE-004: Ordenação de Resultados Não Implementada

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-004
- **Módulo**: Filmes (Movies)
- **Endpoint**: `GET /api/v1/movies`
- **Prioridade**: Baixa
- **Status**: Ativo
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema não implementa ordenação de resultados na listagem de filmes. Quando o parâmetro `sort` é enviado, o sistema ignora e retorna os filmes na ordem padrão do banco de dados.

## 🔍 Comportamento Observado
1. **Request**: `GET /api/v1/movies?sort=title`
2. **Resposta Atual**:
   ```json
   {
     "success": true,
     "data": [
       {
         "title": "Z Filme"  // ❌ Não está ordenado
       },
       {
         "title": "A Filme"
       }
     ]
   }
   ```

## ✅ Comportamento Esperado
```json
{
  "success": true,
  "data": [
    {
      "title": "A Filme"  // ✅ Ordenado alfabeticamente
    },
    {
      "title": "Z Filme"
    }
  ]
}
```

## 📍 Localização do Problema
- **Arquivo**: `src/controllers/movieController.js`
- **Método**: `getMovies`
- **Linha Aproximada**: Função de listagem de filmes

## 🧪 Teste que Detectou
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Teste**: `TC05 - Deve ordenar filmes corretamente`
- **Linha**: 136-155

## 🔧 Solução Sugerida
Implementar lógica de ordenação no controller:

```javascript
const getMovies = async (req, res, next) => {
  try {
    const { sort, page = 1, limit = 10 } = req.query;
    
    // Construir ordenação
    let sortOptions = {};
    
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;
      
      // Validar campos permitidos para ordenação
      const allowedSortFields = ['title', 'releaseDate', 'duration', 'director'];
      
      if (allowedSortFields.includes(sortField)) {
        sortOptions[sortField] = sortOrder;
      } else {
        sortOptions = { title: 1 }; // Default sort
      }
    } else {
      sortOptions = { createdAt: -1 }; // Default: mais recentes primeiro
    }
    
    const skip = (page - 1) * limit;
    
    const movies = await Movie.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
      
    res.json({
      success: true,
      count: movies.length,
      data: movies
    });
  } catch (error) {
    next(error);
  }
};
```

## 📊 Impacto
- **Usuários**: Não conseguem ordenar resultados por critérios específicos
- **UX**: Interface não consegue implementar ordenação
- **Funcionalidade**: Lista sempre na mesma ordem, reduzindo usabilidade

## 🏷️ Tags
`ordenação` `sort` `query-params` `listagem` `usabilidade`