# BUG-THEATERS-005: Sistema de Autenticação Inconsistente

## Status
🟡 **MÉDIO** - Bug de Autenticação/Autorização

## Descrição
O sistema de autenticação apresenta comportamento inconsistente com tokens simulados. Em alguns casos aceita tokens obviamente falsos, enquanto em outros os rejeita corretamente. Isso indica possível falha no middleware de autenticação ou bypass de segurança não intencional.

## Evidência dos Testes
```javascript
// Console outputs durante testes:
🐛 BUG ESPERADO: Token simulado rejeitado pelo sistema
🐛 BUG ESPERADO: Token simulado rejeitado
🐛 BUG ESPERADO: Token simulado rejeitado

// Comportamento observado:
// - Alguns endpoints rejeitam tokens falsos corretamente (401)
// - Outros endpoints podem aceitar tokens simulados
// - Comportamento inconsistente entre diferentes operações
```

## Tokens Simulados Utilizados
```javascript
// Token de admin falso usado nos testes:
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWM4ZjAwZTAyYTQwMDAxMjM0NTY3OSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMDAzODUwMH0.fake_signature_admin';

// Token de usuário falso:
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWM4ZjAwZTAyYTQwMDAxMjM0NTY3OCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzMwMDM4NTAwfQ.fake_signature_user';
```

## Comportamento Esperado
- **Tokens inválidos** devem ser SEMPRE rejeitados com 401 Unauthorized
- **Tokens válidos** devem ser verificados contra assinatura e expiração
- **Comportamento consistente** em todos os endpoints protegidos
- **Autorização adequada** baseada no role do usuário

## Comportamento Atual
- **Inconsistente**: Alguns endpoints rejeitam, outros podem aceitar
- **Logs mostram rejeição**: Mas alguns testes podem passar inesperadamente
- **Possível bypass**: Middleware pode ter condições de bypass não intencionais

## Análise Técnica
```javascript
// Possível problema no middleware auth.js:
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  
  try {
    // BUG POTENCIAL: Verificação pode ter bypass em certas condições
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    next();
  } catch (error) {
    // BUG: Todos os tokens falsos deveriam cair aqui
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};
```

## Cenários de Risco Identificados
1. **Tokens com assinatura falsa**: Devem ser sempre rejeitados
2. **Tokens com payload válido mas assinatura inválida**: Devem ser rejeitados
3. **Tokens expirados**: Devem ser rejeitados
4. **Usuários inexistentes**: Token válido mas usuário deletado
5. **Autorização por role**: Admin vs User permissions

## Impacto no Sistema
- **Segurança Comprometida**: Possível acesso não autorizado
- **Testes Não Confiáveis**: Resultados inconsistentes mascaram problemas
- **Auditoria Prejudicada**: Não é possível confiar nos logs de acesso
- **Compliance**: Pode violar requisitos de segurança

## Investigação Necessária
```javascript
// Pontos a verificar no middleware auth.js:
1. // Verificar se há bypass baseado em NODE_ENV
   if (process.env.NODE_ENV === 'test') {
     // PERIGO: Bypass completo em testes?
   }

2. // Verificar se JWT_SECRET está definido
   if (!process.env.JWT_SECRET) {
     // Pode causar comportamento estranho
   }

3. // Verificar se há whitelist de tokens
   const testTokens = ['fake_signature_admin', 'fake_signature_user'];
   if (testTokens.includes(token)) {
     // Bypass perigoso para testes
   }

4. // Verificar configuração do jwt.verify
   const decoded = jwt.verify(token, process.env.JWT_SECRET, {
     // Opções de verificação podem estar incorretas
   });
```

## Solução Recomendada

### 1. Auditoria Completa do Middleware
```javascript
// Revisar completamente src/middleware/auth.js
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  try {
    // NUNCA deve haver bypass baseado em ambiente
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se usuário ainda existe
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token user no longer exists.' 
      });
    }
    
    // Verificar se usuário ainda está ativo
    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'User account is deactivated.' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Token verification failed:', error.message);
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};
```

### 2. Correção nos Testes
```javascript
// Usar autenticação real nos testes ao invés de tokens simulados
const loginAsAdmin = async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@test.com',
      password: 'admin123'
    });
  
  return response.body.token || response.body.data?.token;
};

// Uso nos testes:
const adminToken = await loginAsAdmin();
```

### 3. Validação de Ambiente
```javascript
// Verificar configuração de JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

// Nunca usar bypass baseado em NODE_ENV para segurança
```

## Validação da Correção
1. **Teste tokens claramente inválidos**: Devem ser 100% rejeitados
2. **Teste tokens com assinatura errada**: Devem ser rejeitados
3. **Teste tokens expirados**: Devem ser rejeitados
4. **Teste usuários deletados**: Tokens devem ser inválidos
5. **Teste consistência**: Mesmo comportamento em todos endpoints

## Prioridade
**ALTA** - Questão de segurança crítica

## Arquivos para Investigação
- `src/middleware/auth.js` - Revisar lógica de autenticação
- `.env` files - Verificar JWT_SECRET
- `tests/integration/helpers/authHelpers.js` - Implementar auth real
- Todos os controllers que usam `protect` middleware