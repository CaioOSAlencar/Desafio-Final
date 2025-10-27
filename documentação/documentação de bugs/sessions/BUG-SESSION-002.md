# BUG-SESSION-002: Roteamento Inconsistente de URLs de API

## Status
🔴 **CRÍTICO** - Bug de Infraestrutura

## Descrição
O sistema utiliza prefixos de URL inconsistentes entre diferentes módulos. Enquanto algumas rotas usam `/api/v1/`, outras podem usar `/api/` ou não ter prefixo algum, causando confusão na integração e dificultando a manutenção.

## Evidência dos Testes
- **Teste Falhou**: Todos os testes de sessões retornaram 404 quando testados com `/api/sessions`
- **Comportamento Observado**: Sistema não reconhece rotas sem o prefixo `/api/v1/`

## Comportamento Inconsistente
```javascript
// Rotas de autenticação funcionam com:
GET /api/v1/auth/login
GET /api/v1/auth/me

// Rotas de filmes funcionam com:
GET /api/v1/movies

// Rotas de sessões testadas com:
GET /api/sessions ❌ (404 - Not Found)

// Possível rota correta seria:
GET /api/v1/sessions ✅ (necessário verificar)
```

## Análise Técnica
O sistema parece ter um padrão de versionamento de API implementado, mas pode não estar sendo aplicado consistentemente em todos os módulos.

## Impacto no Sistema
- **Severidade**: CRÍTICA para integração
- **Problemas Causados**:
  - APIs inconsistentes dificultam integração frontend
  - Documentação confusa
  - Testes de integração falham
  - Experiência de desenvolvimento prejudicada

## Solução Recomendada
1. **Padronizar todas as rotas** para usar o prefixo `/api/v1/`
2. **Verificar configuração** em `src/routes/index.js`
3. **Atualizar documentação** da API para refletir URLs corretas
4. **Corrigir testes** para usar URLs padronizadas

## Validação Necessária
```bash
# Testar se as rotas funcionam com prefixo v1:
GET /api/v1/sessions
GET /api/v1/sessions/:id
POST /api/v1/sessions
```

## Prioridade
**ALTA** - Interfere na funcionalidade de todos os módulos

## Arquivos a Verificar
- `src/routes/index.js` - Configuração de prefixos
- `src/routes/sessionRoutes.js` - Registro das rotas
- Documentação da API (Swagger/OpenAPI)