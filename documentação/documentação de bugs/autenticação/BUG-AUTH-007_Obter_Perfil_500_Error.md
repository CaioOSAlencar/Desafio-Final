# BUG-AUTH-007: Obter Perfil com Token Válido Retorna 500 ao invés de 200

## Descrição do Bug
Quando um usuário autenticado tenta acessar seu perfil através da rota `/api/auth/me` com token JWT válido, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 200 (OK).

## Comportamento Esperado
- Status: **200 OK**
- Response body:
```json
{
  "success": true,
  "data": {
    "_id": "user-id",
    "name": "Nome do Usuário",
    "email": "user@exemplo.com",
    "role": "user"
  }
}
```

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `getProfile`
- **Linha**: Aproximadamente 93-116

## Causa Raiz
O problema pode estar relacionado ao middleware de autenticação ou à estrutura do objeto `req.user` não estar sendo definida corretamente.

## Reprodução
```javascript
// Teste que falha
const userData = mockUsers.validUser;
const user = await User.create(userData);
const token = generateTestToken(user._id);

const response = await request(app)
  .get('/api/auth/me')
  .set('Authorization', `Bearer ${token}`)
  .expect(200); // Espera 200, mas recebe 500
```

## Código Atual (Para Análise)
```javascript
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    next(error);
  }
};
```

## Possíveis Causas
1. **req.user não definido**: Middleware de autenticação não está definindo `req.user`
2. **req.user._id undefined**: Estrutura do objeto user está incorreta
3. **Erro na consulta MongoDB**: Problemas na busca do usuário
4. **Middleware não executado**: Rota não está protegida pelo middleware de auth

## Investigação Necessária
Para resolver este bug, verificar:
1. **Middleware de autenticação** (`src/middleware/auth.js`)
2. **Definição das rotas** (se middleware está sendo aplicado)
3. **Estrutura do token JWT** (se contém ID correto)
4. **Logs específicos** do erro 500

## Impacto
- **Severidade**: **Alta**
- **Usuário**: Não consegue acessar informações do próprio perfil
- **Sistema**: Funcionalidade básica de perfil comprometida
- **UX**: Usuários logados não conseguem ver dados da conta

## Solução Temporária (Debug)
Adicionar logs para identificar a causa:

```javascript
exports.getProfile = async (req, res, next) => {
  try {
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user?._id);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const user = await User.findById(req.user._id);
    console.log('User found:', !!user);

    if (user) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('getProfile error:', error);
    next(error);
  }
};
```

## Dependências
- Middleware de autenticação (`auth.js`)
- Modelo User
- Geração de token JWT
- Rotas protegidas

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC08
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Alta** - Funcionalidade básica de perfil comprometida