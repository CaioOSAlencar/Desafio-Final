# BUG-AUTH-009: Alterar Senha com Senha Atual Correta Retorna 500 ao invés de 200

## Descrição do Bug
Quando um usuário autenticado tenta alterar sua senha fornecendo a senha atual correta e uma nova senha válida, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 200 (OK).

## Comportamento Esperado
- Status: **200 OK**
- Response body:
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "_id": "user-id",
    "name": "Nome do Usuário",
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
- **Função**: `updateProfile` (seção de alteração de senha)
- **Linha**: Aproximadamente 132-150

## Reprodução
```javascript
// Teste que falha
const userData = mockUsers.validUser;
const user = await User.create(userData);
const token = generateTestToken(user._id);

const passwordData = {
  currentPassword: userData.password,
  newPassword: 'novaSenha123'
};

const response = await request(app)
  .put('/api/auth/profile')
  .set('Authorization', `Bearer ${token}`)
  .send(passwordData)
  .expect(200); // Espera 200, mas recebe 500
```

## Código Problemático
```javascript
// Dentro de updateProfile()
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
  user.password = req.body.newPassword; // Possível problema aqui
}

// Save updated user
const updatedUser = await user.save(); // Erro pode ocorrer aqui
```

## Causa Raiz Provável
1. **Problema no user.matchPassword()**: Método pode não estar funcionando corretamente
2. **Erro na atribuição da senha**: `user.password = req.body.newPassword` pode não estar funcionando
3. **Problema no save()**: Hash da senha durante o save pode estar falhando
4. **req.user não definido**: Mesmo problema dos outros bugs de perfil

## Análise Específica
Este bug é crítico pois envolve alteração de senha, um aspecto de segurança importante. O erro pode estar em:

1. **Busca da senha atual**: O usuário é encontrado mas não tem a senha selecionada
2. **Comparação de senha**: `matchPassword` não consegue comparar adequadamente  
3. **Hash da nova senha**: O pre-save hook pode não estar funcionando
4. **Save do documento**: Erro durante a persistência

## Impacto
- **Severidade**: **Crítica**
- **Usuário**: Não consegue alterar senha da conta
- **Sistema**: Funcionalidade de segurança comprometida
- **Segurança**: Usuários não podem atualizar credenciais

## Investigação Necessária
1. Verificar se `user.password` está selecionado na busca
2. Testar `user.matchPassword()` isoladamente
3. Verificar se o pre-save hook está funcionando
4. Analisar logs específicos do erro

## Solução Temporária (Debug)
```javascript
exports.updateProfile = async (req, res, next) => {
  try {
    // Buscar usuário com senha incluída para comparação
    const user = await User.findById(req.user._id).select('+password');
    console.log('User found:', !!user);
    console.log('User has password field:', !!user.password);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update name if provided
    if (req.body.name) {
      user.name = req.body.name;
    }

    // Handle password change
    if (req.body.currentPassword && req.body.newPassword) {
      console.log('Attempting password change');
      
      // Check if current password matches
      const isMatch = await user.matchPassword(req.body.currentPassword);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta'
        });
      }
      
      // Set new password
      user.password = req.body.newPassword;
      console.log('New password set');
    }

    // Save updated user
    console.log('Saving user...');
    const updatedUser = await user.save();
    console.log('User saved successfully');

    const token = generateToken(updatedUser._id);

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
    console.error('updateProfile (password change) error:', error);
    next(error);
  }
};
```

## Possível Correção
O problema pode ser que o usuário não está sendo buscado com o campo `password`:

```javascript
// Correto: incluir password para comparação
const user = await User.findById(req.user._id).select('+password');
```

## Dependências
- **BUG-AUTH-007** e **BUG-AUTH-008**: Problema similar de req.user
- Modelo User e método matchPassword
- Pre-save hook para hash de senha
- Middleware de autenticação

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC11
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Crítica** - Funcionalidade de segurança comprometida