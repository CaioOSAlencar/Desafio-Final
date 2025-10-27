# BUG-RESERVA-001: Inconsistência na URL Base da API

**Severidade:** CRÍTICO  
**Status:** Confirmado  
**Módulo:** Reservas  
**Endpoint Afetado:** POST /reservations  

## Descrição do Problema

O sistema apresenta inconsistência grave na definição das URLs base da API de reservas. Durante os testes de integração, identificou-se que algumas rotas respondem a `/api/v1/reservations` enquanto outras tentam acessar `/reservations` diretamente, resultando em erro 404 Not Found.

## Comportamento Esperado

Todas as rotas da API de reservas devem seguir o padrão `/api/v1/reservations` estabelecido pela arquitetura da aplicação, conforme documentado na rota principal da API.

## Comportamento Atual

- **GET /api/v1/reservations:** Retorna 403 (funciona, mas rejeita usuários comuns)
- **POST /reservations:** Retorna 404 Not Found (URL incorreta)
- **POST /api/v1/reservations:** Status não confirmado durante os testes

## Evidências Técnicas

```javascript
// Erro retornado nos logs
Error: Not Found - /reservations
    at Object.<anonymous>.exports.notFound (src/middleware/error.js:22:17)
```

```javascript
// Teste que falha
const response = await request(app)
  .post('/reservations')  // URL incorreta
  .set('Authorization', `Bearer ${token}`)
  .send(data)
  .expect(201);
// Resultado: 404 Not Found
```

## Impacto

- **Funcionalidade:** Sistema de reservas inacessível via frontend
- **Usuabilidade:** Impossibilidade de criar novas reservas
- **Integração:** APIs não seguem padrão estabelecido
- **Severidade:** CRÍTICO - funcionalidade principal quebrada

## Análise da Causa Raiz

O arquivo de rotas `src/routes/index.js` configura corretamente `router.use('/reservations', reservationRoutes)`, mas provavelmente existe inconsistência na configuração do prefixo `/api/v1` em algumas partes da aplicação.

## Solução Recomendada

1. **Imediata:** Verificar e corrigir configuração do prefixo da API
2. **Preventiva:** Implementar testes automatizados de URL consistency
3. **Documentação:** Atualizar documentação da API com URLs corretas

## Testes para Validação

```javascript
// Teste que deve passar após correção
test('Deve acessar reservas via URL padrão da API', async () => {
  const response = await request(app)
    .get('/api/v1/reservations')
    .set('Authorization', `Bearer ${adminToken}`);
  
  expect(response.status).toBe(200);
});
```

## Arquivo de Configuração Relacionado

- `src/routes/index.js` - Configuração das rotas
- `src/index.js` - Configuração do prefixo da API
- Middleware de roteamento geral

---
**Data de Identificação:** 2024-12-08  
**Identificado por:** Testes de Integração Automatizados  
**Prioridade:** P0 (Resolver Imediatamente)