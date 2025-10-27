# BUG-THEATERS-004: Tratamento Inadequado de Erros de Casting ObjectId

## Status
🟡 **MÉDIO** - Bug de Tratamento de Erros

## Descrição
Quando um ID inválido (não-ObjectId) é fornecido para buscar um theater específico, o sistema gera um erro interno detalhado que é logado no console, mas retorna um erro 500 (Internal Server Error) ao invés de um erro 400 (Bad Request) mais apropriado.

## Evidência dos Testes
```javascript
// Erro detalhado no console:
CastError: Cast to ObjectId failed for value "invalid-id" (type string) at path "_id" for model "Theater"

// Resposta HTTP:
Status: 500 Internal Server Error (deveria ser 400 Bad Request)

// Stack trace completo exposto no log do servidor
```

## Comportamento Esperado
- IDs inválidos devem retornar **400 Bad Request**
- Mensagem de erro clara e amigável para o cliente
- Stack trace não deve ser exposto no log para erros de validação
- Diferenciação entre erro de validação e erro interno real

## Comportamento Atual
- IDs inválidos geram **500 Internal Server Error**
- Stack trace completo é logado no console
- Informações técnicas internas são expostas
- Cliente recebe erro genérico de servidor

## Análise Técnica
```javascript
// Problema no theaterController.js:
exports.getTheaterById = async (req, res, next) => {
  try {
    // BUG: Mongoose lança CastError para IDs inválidos
    const theater = await Theater.findById(req.params.id).populate('sessions');
    // ↑ Esta linha falha com CastError para "invalid-id"
    
    if (theater) {
      res.json({ success: true, data: theater });
    } else {
      res.status(404).json({ success: false, message: 'Theater not found' });
    }
  } catch (error) {
    // BUG: CastError é tratado como erro interno
    next(error); // ← Passa para middleware de erro global
  }
};
```

## Tipos de Erro a Diferenciar
1. **ID malformado**: `"invalid-id"` → 400 Bad Request
2. **ID válido inexistente**: `"507f1f77bcf86cd799439011"` → 404 Not Found
3. **Erro de banco real**: Conexão perdida → 500 Internal Server Error
4. **Erro de autorização**: Token inválido → 401/403

## Impacto no Sistema
- **Logs Poluídos**: Stack traces desnecessários nos logs
- **Debugging Dificultado**: Erros reais misturados com validação
- **API Inconsistente**: Códigos HTTP incorretos
- **Security**: Exposição desnecessária de informações técnicas
- **Client Experience**: Mensagens de erro não úteis

## Solução Recomendada

### 1. Middleware de Validação de ObjectId
```javascript
// src/middleware/validateObjectId.js
const mongoose = require('mongoose');

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
        error: 'INVALID_OBJECT_ID'
      });
    }
    
    next();
  };
};

module.exports = { validateObjectId };
```

### 2. Controller Atualizado
```javascript
// theaterController.js
const { validateObjectId } = require('../middleware/validateObjectId');

exports.getTheaterById = async (req, res, next) => {
  try {
    const theater = await Theater.findById(req.params.id).populate('sessions');
    
    if (theater) {
      res.json({
        success: true,
        data: theater
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Theater not found'
      });
    }
  } catch (error) {
    // Agora só erros reais chegam aqui
    next(error);
  }
};
```

### 3. Aplicar Middleware nas Rotas
```javascript
// theaterRoutes.js
const { validateObjectId } = require('../middleware/validateObjectId');

// Aplicar validação em rotas que usam :id
router.get('/:id', validateObjectId(), getTheaterById);
router.put('/:id', protect, authorize('admin'), validateObjectId(), updateTheater);
router.delete('/:id', protect, authorize('admin'), validateObjectId(), deleteTheater);
```

### 4. Tratamento Específico no Error Handler
```javascript
// src/middleware/error.js
exports.errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Tratar CastError especificamente
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format';
    // NÃO logar stack trace para erros de validação
  } else {
    // Logar apenas erros reais do servidor
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

## Validação da Correção
1. **Teste ID inválido**: `GET /theaters/invalid-id` → 400 Bad Request
2. **Teste ID válido inexistente**: `GET /theaters/507f1f77bcf86cd799439011` → 404 Not Found
3. **Teste ID válido existente**: `GET /theaters/validObjectId` → 200 OK
4. **Verificar logs**: Stack traces só para erros reais do servidor
5. **Testar todos endpoints**: Aplicar em GET, PUT, DELETE

## Prioridade
**MÉDIA** - Melhora debugging e experiência da API

## Arquivos para Correção
- `src/middleware/validateObjectId.js` (criar)
- `src/controllers/theaterController.js` (atualizar)
- `src/routes/theaterRoutes.js` (aplicar middleware)
- `src/middleware/error.js` (melhorar tratamento)