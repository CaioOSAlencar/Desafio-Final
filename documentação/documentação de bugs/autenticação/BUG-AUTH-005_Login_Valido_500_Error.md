# BUG-AUTH-005: Login com Credenciais Válidas Retorna 500 ao invés de 200

## Descrição do Bug
Quando um usuário tenta fazer login com credenciais válidas (email e senha corretos), o sistema retorna status HTTP 500 (Internal Server Error) ao invés de 200 (OK) com token de autenticação.

## Comportamento Esperado
- Status: **200 OK**
- Response body: 
```json
{
  "success": true,
  "token": "jwt-token-válido",
  "data": { 
    "user": { 
      "id": "user-id", 
      "name": "Nome do Usuário", 
      "email": "email@exemplo.com" 
    } 
  }
}
```

## Comportamento Atual
- Status: **500 Internal Server Error**
- Response body: erro interno do servidor

## Localização do Problema
- **Arquivo**: `src/controllers/authController.js`
- **Função**: `login`
- **Linha**: Aproximadamente 50-89

## Causa Raiz Identificada
**O método `correctPassword` não existe no modelo User!**

O authController.js está tentando chamar `user.correctPassword()`, mas o modelo User apenas tem o método `matchPassword()`. Esta incompatibilidade causa erro 500.

**Código Problemático:**
```javascript
// authController.js linha ~60
if (!user || !(await user.correctPassword(password, user.password))) {
```

**Método Real no User.js:**
```javascript
// User.js tem apenas este método:
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

## Reprodução
```javascript
// Teste que falha
const response = await request(app)
  .post('/api/auth/login')
  .send({
    email: "admin@cinema.com", // Email válido
    password: "password123"    // Senha válida
  })
  .expect(200); // Espera 200, mas recebe 500
```

## Análise Necessária
Para resolver este bug, é necessário investigar:

1. **Modelo User**: Verificar se `correctPassword` está funcionando
2. **generateToken**: Verificar se a geração de JWT está correta
3. **Resposta do Controller**: Verificar estrutura da resposta
4. **Logs de Erro**: Analisar logs específicos do erro 500

## Código Atual (Para Revisão)
```javascript
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## Impacto
- **Severidade**: **Alta** - Impede login de usuários válidos
- **Usuário**: Não consegue acessar o sistema mesmo com credenciais corretas
- **Sistema**: Funcionalidade básica de autenticação comprometida
- **Negócio**: Usuários não conseguem usar a aplicação

## Investigação Sugerida
1. Verificar implementação de `User.correctPassword()`
2. Verificar função `generateToken()`
3. Adicionar logs detalhados no catch para identificar erro específico
4. Testar cada componente individualmente

## Solução Definitiva
Corrigir o nome do método no authController.js:

```javascript
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password');
    
    // CORREÇÃO: Usar matchPassword ao invés de correctPassword
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
```

**Alteração específica:**
- **De:** `!(await user.correctPassword(password, user.password))`
- **Para:** `!(await user.matchPassword(password))`

Note que `matchPassword` recebe apenas a senha, não precisa do hash como segundo parâmetro.

## Testes Relacionados
- `tests/integration/authRoutes.test.js` - TC03
- Status do teste: **FALHANDO**

## Data de Identificação
26 de outubro de 2025

## Impacto Adicional
Este bug também afeta outros bugs relacionados:
- **BUG-AUTH-003**: Parte do erro 500 pode ser devido a este método incorreto
- **BUG-AUTH-004**: Parte do erro 500 pode ser devido a este método incorreto  

## Prioridade
**Crítica** - Impede funcionamento básico de autenticação. Deve ser corrigido primeiro antes de investigar outros bugs de autenticação.