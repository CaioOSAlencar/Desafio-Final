# Relatório de Melhoria - MELHORIA-004

## **Informações Básicas**
- **ID da Melhoria:** MELHORIA-004
- **Título:** Padronizar sistema de autenticação e autorização
- **User Story Relacionada:** US002 - Sistema de Autenticação / US003 - Autorização Admin
- **Data de Identificação:** 27/10/2025
- **Identificado por:** Testes de Integração Automatizados - Jest/Supertest
- **Prioridade:** Alta
- **Categoria:** Segurança / Infraestrutura

---

## **Descrição da Melhoria**

### **Situação Atual:**
Análise dos testes revelou **inconsistências críticas no sistema de autenticação**:
- **Tokens inválidos sendo aceitos** em alguns contextos
- **Códigos de status inconsistentes** (404 ao invés de 401/403)
- **Middleware de autenticação falhando** em múltiplos módulos
- **Autorização admin funcionando apenas no módulo Teatros** (97% sucesso)

### **Melhoria Proposta:**
Implementar sistema de autenticação padronizado e consistente:
1. **Middleware único** para toda a aplicação
2. **Validação rigorosa de JWT** com verificação de assinatura
3. **Códigos de status HTTP corretos** (401/403 ao invés de 404)
4. **Sistema de refresh token** para persistência de sessão
5. **Logging de tentativas de acesso** para auditoria

---

## **Evidências dos Testes de Integração**

### **Problemas de Autenticação Identificados:**
```javascript
// ❌ PROBLEMA: Token inválido aceito
Test: "Deve rejeitar token inválido"
Input: Authorization: "Bearer token-invalido"
Expected: 401 Unauthorized
Received: 404 Not Found

// ❌ PROBLEMA: Autorização admin inconsistente
Module: Filmes - Admin operations fail (~25% success)
Module: Usuários - Admin operations fail (0% success) 
Module: Teatros - Admin operations work (97% success) ✓

// ❌ PROBLEMA: Sessões não persistem
Test: "Token deve persistir após login"
Issue: Tokens parecem expirar prematuramente
```

### **Comportamentos Inconsistentes por Módulo:**
```javascript
// ✅ TEATROS (Referência - Funciona corretamente):
POST /api/v1/theaters (admin) → 201 Created ✓
PUT /api/v1/theaters/:id (admin) → 200 OK ✓
DELETE /api/v1/theaters/:id (admin) → 200 OK ✓

// ❌ FILMES (Parcialmente funcional):
POST /api/v1/movies (admin) → 401/403 (deveria ser 201)
PUT /api/v1/movies/:id (admin) → 401/403 (deveria ser 200)

// ❌ USUÁRIOS (Não funcional):
GET /users (admin) → 404 (deveria verificar auth primeiro)
```

---

## **Impacto nos Negócios**

### **Riscos de Segurança Atuais:**
1. **Acesso Não Autorizado:** Tokens inválidos sendo aceitos
2. **Escalação de Privilégio:** Inconsistência na verificação de admin
3. **Experiência Ruim:** Usuários recebem erros confusos (404 vs 401)
4. **Impossibilidade de Auditoria:** Sem logs de tentativas de acesso

### **Benefícios da Melhoria:**
1. **Segurança Robusta:** Validação consistente em todos os módulos
2. **Experiência Melhor:** Mensagens de erro apropriadas
3. **Auditoria Completa:** Logs de todas as tentativas de acesso
4. **Manutenibilidade:** Sistema centralizado e padronizado

---

## **Implementação Técnica Sugerida**

### **1. Middleware de Autenticação Padronizado:**
```javascript
// src/middleware/auth.js (revisado)
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido'
      });
    }

    const token = authHeader.substring(7);
    
    // Validação rigorosa do JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Log da tentativa de acesso inválida
      console.warn('🚨 Tentativa de acesso com token inválido:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        error: jwtError.message
      });
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Verificar se usuário ainda existe
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Log de acesso bem-sucedido
    console.log('✅ Acesso autorizado:', {
      userId: user._id,
      userRole: user.role,
      path: req.path,
      method: req.method
    });

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      // Log de tentativa não autorizada
      console.warn('🚨 Tentativa de acesso não autorizada:', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: `Acesso negado. Necessário: ${roles.join(' ou ')}`
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
```

### **2. Sistema de Refresh Token:**
```javascript
// src/controllers/authController.js (adicionar)
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Token curto
  );

  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Token longo
  );

  return { accessToken, refreshToken };
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    const tokens = generateTokens(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        ...tokens
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido ou expirado'
    });
  }
};
```

### **3. Aplicação Consistente em Todas as Rotas:**
```javascript
// Exemplo para userRoutes.js (corrigido)
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

// Todas as rotas de usuário são admin-only
router.use(authenticate); // Primeiro: verificar se está logado
router.use(authorize('admin')); // Depois: verificar se é admin

router.route('/')
  .get(getUsers); // GET /users

router.route('/:id')
  .get(getUserById)    // GET /users/:id
  .put(updateUser)     // PUT /users/:id
  .delete(deleteUser); // DELETE /users/:id

module.exports = router;
```

---

## **Cenários de Teste para Validação**

### **Testes de Autenticação Robusta:**
```javascript
describe('Authentication System', () => {
  test('Token inválido deve retornar 401', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer token-invalido')
      .expect(401);
    
    expect(response.body.message).toContain('Token inválido');
  });

  test('Usuário comum não pode acessar rotas admin', async () => {
    const userToken = await createUserAndGetToken('user');
    
    const response = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    
    expect(response.body.message).toContain('Acesso negado');
  });

  test('Admin pode acessar todas as rotas admin', async () => {
    const adminToken = await createUserAndGetToken('admin');
    
    // Testar em todos os módulos
    const adminRoutes = [
      '/users',
      '/movies', 
      '/theaters',
      '/sessions'
    ];

    for (const route of adminRoutes) {
      const response = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    }
  });
});
```

### **Testes de Refresh Token:**
```javascript
describe('Token Refresh System', () => {
  test('Refresh token deve gerar novos tokens', async () => {
    const { refreshToken } = await loginUser();
    
    const response = await request(app)
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
  });
});
```

---

## **Plano de Implementação**

### **Fase 1 - Correção Imediata (2 dias):**
- [ ] Revisar e corrigir middleware de autenticação
- [ ] Aplicar middleware consistentemente em todas as rotas
- [ ] Corrigir códigos de status HTTP (401/403 ao invés de 404)

### **Fase 2 - Sistema de Refresh (1 dia):**
- [ ] Implementar refresh tokens
- [ ] Adicionar endpoint `/auth/refresh`
- [ ] Configurar tokens com tempos apropriados

### **Fase 3 - Logging e Auditoria (1 dia):**
- [ ] Implementar logs de tentativas de acesso
- [ ] Adicionar alertas para tentativas maliciosas
- [ ] Criar dashboard de auditoria

### **Fase 4 - Validação (1 dia):**
- [ ] Executar testes em todos os módulos
- [ ] Verificar consistência de comportamento
- [ ] Validar taxa de sucesso de autorização

---

## **Estimativa de Esforço**
- **Correção do middleware:** 8 horas
- **Implementação de refresh tokens:** 6 horas
- **Sistema de logging:** 4 horas
- **Testes e validação:** 6 horas
- **Total:** 24 horas (3 dias úteis)

---

## **Critérios de Aceitação**
- [ ] Tokens inválidos sempre retornam 401 (nunca 404)
- [ ] Usuários comuns sempre recebem 403 em rotas admin
- [ ] Admins conseguem acessar rotas admin em todos os módulos
- [ ] Refresh tokens funcionam corretamente
- [ ] Logs de auditoria capturam tentativas de acesso
- [ ] Taxa de sucesso de autorização > 90% em todos os módulos
- [ ] Comportamento consistente entre Teatros, Filmes, Usuários, etc.

---

## **Métricas de Sucesso**
- **Antes:** Autorização funciona apenas em Teatros (97%)
- **Meta:** Autorização funciona em todos os módulos (90%+)
- **KPI:** Redução de erros 404 em tentativas de auth
- **Segurança:** 100% dos tokens inválidos rejeitados

---

**Status:** Alta Prioridade - Risco de Segurança  
**Próximos Passos:** Audit completo do sistema de autenticação  
**Responsável:** Equipe de Desenvolvimento + Segurança