# BUG-AUTH-008: Atualizar Perfil com Dados Válidos Retorna 500 ao invés de 200

## Descrição do Bug
Quando um usuário autenticado tenta atualizar seu perfil através da rota `PUT /api/auth/profile` com dados válidos, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 200 (OK).

## Comportamento Esperado
- Status: **200 OK**
- Response body:
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "_id": "user-id",
    "name": "Novo Nome",
    "email": "user@exemplo.com",
    "role": "user",
    "token": "novo-jwt-token"
  }
}
```

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `updateProfile`
- **Linha**: Aproximadamente 118-172

## Reprodução
```javascript
// Teste que falha
const userData = mockUsers.validUser;
const user = await User.create(userData);
const token = generateTestToken(user._id);

const updateData = { name: 'João Silva Novo' };

const response = await request(app)
  .put('/api/auth/profile')
  .set('Authorization', `Bearer ${token}`)
  .send(updateData)
  .expect(200); // Espera 200, mas recebe 500
```

## Causa Raiz Provável
Similar ao **BUG-AUTH-007**, o problema provavelmente está relacionado a:
1. **req.user não definido**: Middleware de autenticação falha
2. **Erro na atualização**: Problemas ao salvar dados atualizados
3. **generateToken**: Erro na geração do novo token

## Código Atual (Para Análise)
```javascript
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (req.body.name) {
      user.name = req.body.name;
    }

    // Handle password change if both old and new password are provided
    if (req.body.currentPassword && req.body.newPassword) {
      // Check if current password matches
      const isMatch = await user.matchPassword(req.body.currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
      
      // Set new password
      user.password = req.body.newPassword;
    }

    // Save updated user
    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## Impacto
- **Severidade**: **Alta**
- **Usuário**: Não consegue atualizar informações do perfil
- **Sistema**: Funcionalidade de edição de perfil comprometida
- **UX**: Usuários não conseguem modificar dados da conta

## Investigação Necessária
1. Verificar se `req.user` está sendo definido corretamente
2. Testar `user.save()` individualmente
3. Verificar `generateToken()` funciona corretamente
4. Analisar logs específicos do erro 500

## Solução Temporária (Debug)
```javascript
exports.updateProfile = async (req, res, next) => {
  try {
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const user = await User.findById(req.user._id);
    console.log('User found:', !!user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (req.body.name) {
      user.name = req.body.name;
      console.log('Name updated to:', req.body.name);
    }

    // Save updated user
    const updatedUser = await user.save();
    console.log('User saved successfully');

    const token = generateToken(updatedUser._id);
    console.log('Token generated:', !!token);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: token
      }
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    next(error);
  }
};
```

## Dependências
- **BUG-AUTH-007**: Provavelmente mesmo problema de middleware
- Middleware de autenticação (`auth.js`)
- Modelo User
- Função generateToken

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC10
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Alta** - Funcionalidade crítica de perfil comprometida