# BUG-SESSION-001: Rotas de Sessões Não Implementadas

## Status
🔴 **CRÍTICO** - Bug de API Principal

## Descrição
O sistema retorna erro 404 (Not Found) para todas as rotas de sessões (`/api/sessions`), indicando que as rotas não estão implementadas ou não estão sendo registradas corretamente no roteamento principal da aplicação.

## Evidência dos Testes
- **Teste Falhou**: Todos os 29 testes de sessões falharam com erro 404
- **Rotas Afetadas**: 
  - `GET /api/sessions` - Listar sessões
  - `GET /api/sessions/:id` - Buscar sessão por ID
  - `POST /api/sessions` - Criar sessão
  - `PUT /api/sessions/:id` - Atualizar sessão
  - `DELETE /api/sessions/:id` - Deletar sessão
  - `POST /api/sessions/:id/reset-seats` - Reset assentos

## Comportamento Esperado
As rotas de sessões devem estar disponíveis e responder adequadamente conforme definido no arquivo `sessionRoutes.js`.

## Comportamento Atual
- Todas as requisições para `/api/sessions` retornam erro 404
- Console mostra logs de erro: "Error: Not Found - /api/sessions"
- Sistema não reconhece nenhuma rota relacionada a sessões

## Análise Técnica
```javascript
// Arquivo existente: src/routes/sessionRoutes.js
// Problema: Rotas não sendo registradas em src/routes/index.js
```

## Impacto no Sistema
- **Severidade**: CRÍTICA
- **Módulos Afetados**: Gerenciamento de sessões de cinema
- **Funcionalidades Bloqueadas**: 
  - Listagem de sessões disponíveis
  - Criação de novas sessões
  - Gerenciamento de assentos
  - Agendamento de filmes

## Solução Recomendada
1. Verificar se `sessionRoutes.js` está sendo importado em `src/routes/index.js`
2. Confirmar registro das rotas no roteador principal
3. Validar se o prefixo de rota está correto (`/api/sessions` vs `/api/v1/sessions`)

## Prioridade
**ALTA** - Sistema de cinema não funciona sem gerenciamento de sessões

## Arquivos Relacionados
- `src/routes/sessionRoutes.js`
- `src/routes/index.js`
- `src/controllers/sessionController.js`