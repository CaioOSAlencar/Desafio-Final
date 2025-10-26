# BUG-AUTH-010: Rejeitar Alteração com Senha Atual Incorreta Retorna 500 ao invés de 401

## Descrição do Bug
Quando um usuário autenticado tenta alterar sua senha fornecendo uma senha atual incorreta, o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 401 (Unauthorized).

## Comportamento Esperado
- Status: **401 Unauthorized**
- Response body:
```json
{
  "success": false,
  "message": "Senha atual incorreta"
}
```

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `updateProfile` (seção de validação de senha atual)
- **Linha**: Aproximadamente 138-145

## Reprodução
```javascript
// Teste que falha
const userData = mockUsers.validUser;
const user = await User.create(userData);
const token = generateTestToken(user._id);

const passwordData = {
  currentPassword: 'senha-errada', // Senha atual incorreta
  newPassword: 'novaSenha123'
};

const response = await request(app)
  .put('/api/auth/profile')
  .set('Authorization', `Bearer ${token}`)
  .send(passwordData)
  .expect(401); // Espera 401, mas recebe 500
```

## Código Problemático
```javascript
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
```

## Causa Raiz
O erro 500 indica que o código nem chega à validação de senha. Possíveis causas:

1. **req.user._id undefined**: Problema no middleware de autenticação
2. **User.findById() falha**: Usuário não encontrado causa erro antes da validação
3. **user.matchPassword() não existe**: Método não definido ou erro na chamada
4. **Erro antes da validação**: Problema na busca do usuário

## Relação com Outros Bugs
Este bug está diretamente relacionado com:
- **BUG-AUTH-007**: Problema de req.user no getProfile
- **BUG-AUTH-008**: Problema de req.user no updateProfile
- **BUG-AUTH-009**: Mesmo código, mas com senha correta

## Impacto
- **Severidade**: **Alta**
- **Usuário**: Não recebe feedback adequado sobre senha incorreta
- **Sistema**: Validação de segurança não funciona
- **UX**: Experiência confusa ao tentar alterar senha

## Causa Raiz Identificada
O problema provavelmente é o mesmo dos outros bugs de perfil: o middleware de autenticação não está definindo `req.user` corretamente, causando erro 500 antes mesmo de chegar à validação da senha.

## Investigação Prioritária
1. **Middleware de autenticação**: Verificar se está funcionando
2. **req.user**: Verificar se está sendo definido
3. **Seleção de password**: Verificar se usuário inclui campo password

## Solução Sugerida
Primeiro resolver os problemas de autenticação (BUG-AUTH-007), depois este bug será automaticamente resolvido, pois o código de validação de senha está correto.

## Solução Temporária
Adicionar verificações de segurança:

```javascript
exports.updateProfile = async (req, res, next) => {
  try {
    console.log('req.user exists:', !!req.user);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Buscar usuário COM campo password para validação
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ... resto do código permanece igual ...
  } catch (error) {
    console.error('updateProfile error:', error);
    next(error);
  }
};
```

## Ordem de Resolução
1. **Primeiro**: Resolver BUG-AUTH-007 (middleware de auth)
2. **Segundo**: Resolver BUG-AUTH-008 (updateProfile básico) 
3. **Terceiro**: Testar este bug - deve funcionar automaticamente

## Dependências
- **BUG-AUTH-007**: Problema base de autenticação
- **BUG-AUTH-008**: UpdateProfile básico
- Middleware de autenticação (`auth.js`)
- Modelo User com método matchPassword

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC12
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Prioridade
**Alta** - Depende da resolução dos bugs de autenticação anteriores