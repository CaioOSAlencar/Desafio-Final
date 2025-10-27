# BUG-MOVIE-005: Tokens JWT Válidos Rejeitados com 401

## 📋 Informações Gerais
- **ID do Bug**: BUG-MOVIE-005
- **Módulo**: Filmes (Movies) - Middleware de Autenticação
- **Endpoints**: 
  - `POST /api/v1/movies`
  - `PUT /api/v1/movies/:id`
  - `DELETE /api/v1/movies/:id`
- **Prioridade**: Crítica
- **Status**: Ativo
- **Data de Descoberta**: 27/10/2025

## 🐛 Descrição do Problema
O sistema rejeita tokens JWT válidos de usuários autenticados (incluindo administradores) com erro 401 Unauthorized, impedindo operações CRUD em filmes que requerem autenticação.

## 🔍 Comportamento Observado
1. **Request**: `POST /api/v1/movies` com token válido de admin
2. **Resposta Atual**:
   ```json
   {
     "success": false,
     "message": "Not authorized to access this route"
   }
   ```
   - **Status Code**: 401 ❌

3. **Contexto**: 
   - Usuário foi registrado com sucesso
   - Login foi realizado com sucesso
   - Token JWT foi gerado corretamente
   - Token é enviado no header `Authorization: Bearer <token>`

## ✅ Comportamento Esperado
Para usuários admin com tokens válidos:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Filme Criado",
    // ... outros campos
  }
}
```
- **Status Code**: 201 ✅

## 📍 Localização do Problema
- **Arquivo Principal**: `src/middleware/auth.js`
- **Método**: `protect`
- **Possíveis Causas**:
  1. Middleware de autenticação não está validando tokens corretamente
  2. Problema na verificação da assinatura JWT
  3. Configuração incorreta da SECRET_KEY
  4. Headers não sendo lidos corretamente

## 🧪 Testes que Detectaram
- **Arquivo**: `tests/integration/filmes/movieRoutes.test.js`
- **Testes Afetados**:
  - `TC10 - Deve criar filme com dados válidos (admin)` (linha 232-253)
  - `TC12 - Deve rejeitar criação por usuário comum` (linha 275-290)
  - `TC13 - Deve rejeitar criação com dados inválidos` (linha 292-309)
  - `TC14 - Deve rejeitar filme sem campos obrigatórios` (linha 311-331)
  - `TC15 - Deve atualizar filme com dados válidos (admin)` (linha 349-368)
  - `TC17 - Deve rejeitar atualização por usuário comum` (linha 388-402)
  - `TC18 - Deve retornar 404 para filme inexistente` (linha 404-423)
  - `TC19 - Deve deletar filme existente (admin)` (linha 442-458)
  - `TC21 - Deve rejeitar deleção por usuário comum` (linha 474-489)
  - `TC22 - Deve retornar 404 para filme inexistente` (linha 491-510)
  - `TC24 - Deve incluir timestamps corretos` (linha 543-559)

## 🔧 Solução Sugerida
Investigar e corrigir o middleware de autenticação:

1. **Verificar o middleware `protect`**:
   ```javascript
   // src/middleware/auth.js
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');
   
   const protect = async (req, res, next) => {
     try {
       let token;
       
       // Verificar header Authorization
       if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
         token = req.headers.authorization.split(' ')[1];
       }
       
       if (!token) {
         return res.status(401).json({
           success: false,
           message: 'Not authorized to access this route'
         });
       }
       
       // Verificar token
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       
       // Buscar usuário
       const user = await User.findById(decoded.id);
       
       if (!user) {
         return res.status(401).json({
           success: false,
           message: 'Not authorized to access this route'
         });
       }
       
       req.user = user;
       next();
     } catch (error) {
       console.error('Auth middleware error:', error);
       return res.status(401).json({
         success: false,
         message: 'Not authorized to access this route'
       });
     }
   };
   ```

2. **Verificar se JWT_SECRET está configurado**:
   ```bash
   # .env
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. **Verificar se o middleware está sendo aplicado corretamente nas rotas**

## 📊 Impacto
- **Crítico**: Nenhuma operação autenticada de filmes funciona
- **Usuários**: Administradores não conseguem gerenciar filmes
- **Sistema**: API de filmes essencialmente não funcional para operações CRUD
- **Testes**: 11 de 24 testes de integração falhando devido a este problema

## 🏷️ Tags
`autenticação` `jwt` `middleware` `crítico` `401-unauthorized` `admin-access`