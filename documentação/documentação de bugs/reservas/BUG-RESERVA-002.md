# BUG-RESERVA-002: Controle de Acesso Inconsistente por Roles

**Severidade:** ALTO  
**Status:** Confirmado  
**Módulo:** Reservas  
**Endpoint Afetado:** GET /api/v1/reservations  

## Descrição do Problema

O sistema implementa controle de acesso por roles de forma inconsistente. Usuários com role "user" recebem erro 403 Forbidden ao tentar acessar `GET /api/v1/reservations`, mas não está claramente documentado quais endpoints são restritos a quais roles.

## Comportamento Esperado

Deveria existir documentação clara e implementação consistente de:
- Usuários comuns podem acessar apenas suas próprias reservas via `/me`
- Administradores podem acessar todas as reservas via rota geral
- Mensagens de erro claras indicando permissões necessárias

## Comportamento Atual

```javascript
// Resposta atual para usuário comum
{
  "success": false,
  "message": "User role user is not authorized to access this route"
}
```

## Evidências Técnicas

```javascript
// Teste que confirma o comportamento
test('Usuário comum tenta acessar todas as reservas', async () => {
  const response = await request(app)
    .get('/api/v1/reservations')
    .set('Authorization', `Bearer ${userToken}`);
  
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  // Status: 403, Message: "User role user is not authorized..."
});
```

## Impacto

- **Usabilidade:** Usuários não sabem quais endpoints podem acessar
- **Documentação:** Falta especificação clara de permissões
- **Desenvolvimento:** Dificuldade para implementar frontend adequadamente
- **Severidade:** ALTO - afeta experiência do usuário

## Análise da Causa Raiz

O middleware de autorização funciona corretamente, mas:
1. Falta documentação das permissões por endpoint
2. Não existe endpoint alternativo claramente documentado para usuários comuns
3. Mensagens de erro poderiam ser mais informativas

## Solução Recomendada

1. **Documentação:** Criar especificação clara de permissões por endpoint
2. **Mensagens:** Melhorar mensagens de erro com sugestões de endpoints alternativos
3. **Testes:** Implementar testes sistemáticos de autorização

## Especificação Recomendada de Permissões

```yaml
# Reservas - Controle de Acesso
GET /api/v1/reservations:
  roles: [admin]
  description: "Listar todas as reservas (apenas administradores)"

GET /api/v1/reservations/me:
  roles: [user, admin]
  description: "Listar reservas do usuário autenticado"

POST /api/v1/reservations:
  roles: [user, admin]
  description: "Criar nova reserva"

PUT /api/v1/reservations/:id:
  roles: [admin]
  description: "Atualizar reserva (apenas administradores)"

DELETE /api/v1/reservations/:id:
  roles: [admin]
  description: "Excluir reserva (apenas administradores)"
```

## Mensagem de Erro Melhorada Sugerida

```javascript
{
  "success": false,
  "message": "Acesso negado. Usuários comuns podem acessar apenas suas próprias reservas.",
  "hint": "Tente usar GET /api/v1/reservations/me para ver suas reservas.",
  "requiredRole": "admin",
  "currentRole": "user"
}
```

---
**Data de Identificação:** 2024-12-08  
**Identificado por:** Testes de Integração Automatizados  
**Prioridade:** P1 (Resolver em 1-2 sprints)