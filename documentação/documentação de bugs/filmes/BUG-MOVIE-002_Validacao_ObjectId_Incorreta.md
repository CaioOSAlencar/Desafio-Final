# BUG-MOVIE-002: Validação de ObjectId Incorreta

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-002
- **Módulo**: Filmes (Movies)
- **Endpoint**: `GET /api/v1/movies/:id`
- **Prioridade**: Baixa
- **Status**: Ativo
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema retorna erro 404 (Not Found) para IDs de filme com formato inválido, quando deveria retornar erro 400 (Bad Request) indicando que o formato do ID é inválido.

## 🔍 Comportamento Observado
1. **Request**: `GET /api/v1/movies/invalid-id`
2. **Resposta Atual**:
   ```json
   {
     "success": false,
     "message": "Movie not found"
   }
   ```
   - **Status Code**: 404 ❌

## ✅ Comportamento Esperado
```json
{
  "success": false,
  "message": "Invalid movie ID format"
}
```
- **Status Code**: 400 ✅

## 📍 Localização do Problema
- **Arquivo**: `src/controllers/movieController.js`
- **Método**: `getMovie`
- **Linha Aproximada**: Função de busca por ID

## 🧪 Teste que Detectou
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Teste**: `TC08 - Deve rejeitar ID inválido`
- **Linha**: 188-205

## 🔧 Solução Sugerida
Adicionar validação de formato do ObjectId antes da busca:

```javascript
const mongoose = require('mongoose');

const getMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar formato do ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format'
      });
    }
    
    const movie = await Movie.findById(id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    next(error);
  }
};
```

## 📊 Impacto
- **Usuários**: Recebem mensagens de erro imprecisas
- **API**: Não segue convenções REST adequadas
- **Debug**: Mais difícil identificar se o problema é formato inválido vs filme inexistente

## 🏷️ Tags
`validação` `objectid` `error-handling` `rest-api` `status-codes`