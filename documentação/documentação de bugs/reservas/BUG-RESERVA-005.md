# BUG-RESERVA-005: Ausência de Endpoint para Usuários Consultarem Próprias Reservas

**Severidade:** MÉDIO  
**Status:** Presumido  
**Módulo:** Reservas  
**Endpoint Afetado:** GET /api/v1/reservations/me  

## Descrição do Problema

Durante os testes, identificou-se que usuários comuns não podem acessar `GET /api/v1/reservations` (retorna 403), mas não foi possível validar se existe o endpoint alternativo `GET /api/v1/reservations/me` para que usuários consultem suas próprias reservas.

## Comportamento Esperado

Deveria existir um endpoint `GET /api/v1/reservations/me` que permite usuários autenticados consultarem apenas suas próprias reservas, implementando:
- Filtro automático por usuário logado
- Suporte a paginação
- Retorno no formato padrão da API

## Comportamento Presumido

É possível que:
- O endpoint `/me` não esteja implementado
- Esteja implementado mas com bugs de autorização
- Não retorne dados no formato correto
- Não implemente paginação adequadamente

## Evidências dos Testes

```javascript
// Teste que não pôde ser executado completamente
test('Deve listar reservas do usuário autenticado', async () => {
  const response = await request(app)
    .get('/api/v1/reservations/me')
    .set('Authorization', `Bearer ${validUserToken}`)
    .expect(200);
  
  // Comportamento esperado mas não validado
  expect(response.body.success).toBe(true);
  expect(response.body.count).toBeGreaterThan(0);
  expect(Array.isArray(response.body.data)).toBe(true);
});
```

## Impacto

- **Usabilidade:** Usuários não conseguem ver suas reservas
- **Funcionalidade:** Sistema incompleto para usuários finais
- **Experiência:** Frustração por não conseguir acessar dados próprios
- **Arquitetura:** Inconsistência com padrões REST
- **Severidade:** MÉDIO - funcionalidade importante para usuários

## Implementação Recomendada

### Controller Method
```javascript
// reservationController.js
exports.getMyReservations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('session', 'datetime movie theater')
      .populate('session.movie', 'title')
      .populate('session.theater', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
      
    const count = await Reservation.countDocuments({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: reservations.length,
      total: count,
      data: reservations,
      pagination: {
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
```

### Route Configuration
```javascript
// reservationRoutes.js
const { protect } = require('../middleware/auth');
const { getMyReservations } = require('../controllers/reservationController');

router.get('/me', protect, getMyReservations);
```

## Funcionalidades Esperadas

1. **Filtro Automático:** Mostrar apenas reservas do usuário logado
2. **Paginação:** Suporte a page/limit query parameters
3. **População:** Incluir dados da session, movie e theater
4. **Ordenação:** Por data de criação (mais recentes primeiro)
5. **Formato Padrão:** Seguir estrutura de resposta da API

## Testes de Validação

```javascript
test('Deve retornar apenas reservas do usuário logado', async () => {
  // Criar reservas para dois usuários diferentes
  const user1 = await createTestUser();
  const user2 = await createTestUser();
  
  await createTestReservation(null, user1._id);
  await createTestReservation(null, user2._id);
  
  const token1 = generateValidToken(user1._id, 'user');
  
  const response = await request(app)
    .get('/api/v1/reservations/me')
    .set('Authorization', `Bearer ${token1}`)
    .expect(200);
  
  expect(response.body.data).toHaveLength(1);
  expect(response.body.data[0].user).toBe(user1._id.toString());
});

test('Should support pagination', async () => {
  const user = await createTestUser();
  const token = generateValidToken(user._id, 'user');
  
  // Criar 5 reservas
  for (let i = 0; i < 5; i++) {
    await createTestReservation(null, user._id);
  }
  
  const response = await request(app)
    .get('/api/v1/reservations/me')
    .query({ page: 1, limit: 3 })
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
  
  expect(response.body.data).toHaveLength(3);
  expect(response.body.pagination.pages).toBe(2);
});
```

---
**Data de Identificação:** 2024-12-08  
**Identificado por:** Análise de Necessidades de UX em Testes  
**Prioridade:** P2 (Implementar para completar funcionalidade)