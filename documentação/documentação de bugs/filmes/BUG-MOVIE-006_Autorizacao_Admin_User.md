# BUG-MOVIE-006: Autorização Inadequada Entre Admin e User

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-006
- **Módulo**: Filmes (Movies) - Middleware de Autorização
- **Endpoints**: 
  - `POST /api/v1/movies`
  - `PUT /api/v1/movies/:id`
  - `DELETE /api/v1/movies/:id`
- **Prioridade**: Media
- **Status**: Relacionado ao BUG-MOVIE-005
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema não diferencia adequadamente entre usuários comuns e administradores. Usuários comuns deveriam receber erro 403 (Forbidden) ao tentar acessar recursos restritos a admins, mas estão recebendo 401 (Unauthorized).

## 🔍 Comportamento Observado
1. **Request**: `POST /api/v1/movies` com token válido de usuário comum
2. **Resposta Atual**:
   ```json
   {
     "success": false,
     "message": "Not authorized to access this route"
   }
   ```
   - **Status Code**: 401 ❌

## ✅ Comportamento Esperado
Para usuários comuns com tokens válidos tentando acessar recursos de admin:
```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```
- **Status Code**: 403 ✅

## 📍 Localização do Problema
- **Arquivo**: `src/middleware/auth.js`
- **Método**: Middleware de autorização (provavelmente `adminOnly` ou similar)
- **Causa Raiz**: Relacionado ao BUG-MOVIE-005 - o middleware de autenticação falha antes de chegar à verificação de papel/role

## 🧪 Testes que Detectaram
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Testes Afetados**:
  - `TC12 - Deve rejeitar criação por usuário comum` (linha 275-290)
  - `TC17 - Deve rejeitar atualização por usuário comum` (linha 388-402)
  - `TC21 - Deve rejeitar deleção por usuário comum` (linha 474-489)

## 🔧 Solução Sugerida
Após corrigir o BUG-MOVIE-005, implementar middleware de autorização adequado:

1. **Middleware para verificar papel de admin**:
   ```javascript
   // src/middleware/auth.js
   const adminOnly = (req, res, next) => {
     if (req.user && req.user.role === 'admin') {
       next();
     } else {
       return res.status(403).json({
         success: false,
         message: 'Access denied. Admin privileges required.'
       });
     }
   };
   ```

2. **Aplicar o middleware nas rotas**:
   ```javascript
   // src/routes/movieRoutes.js
   router.post('/', protect, adminOnly, createMovie);
   router.put('/:id', protect, adminOnly, updateMovie);
   router.delete('/:id', protect, adminOnly, deleteMovie);
   ```

3. **Garantir que o modelo User tenha o campo role**:
   ```javascript
   // src/models/User.js
   const userSchema = new mongoose.Schema({
     // ... outros campos
     role: {
       type: String,
       enum: ['user', 'admin'],
       default: 'user'
     }
   });
   ```

## 📊 Impacto
- **Segurança**: Respostas de erro inadequadas podem confundir sobre problemas de autenticação vs autorização
- **UX**: Mensagens de erro imprecisas para usuários
- **API**: Não segue convenções REST adequadas para códigos de status

## 🏷️ Tags
`autorização` `roles` `admin` `403-forbidden` `middleware` `segurança`

## 🔗 Dependências
- **Depende de**: BUG-MOVIE-005 (deve ser corrigido primeiro)
- **Bloqueado por**: Problema fundamental de autenticação