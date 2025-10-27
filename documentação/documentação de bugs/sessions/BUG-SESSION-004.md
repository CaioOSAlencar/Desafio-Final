# BUG-SESSION-004: Sistema de Autenticação com Tokens Simulados

## Status
🟡 **MÉDIO** - Bug de Testes/Autenticação

## Descrição
Os testes estão utilizando tokens JWT simulados que são rejeitados pelo sistema de autenticação real, causando inconsistência entre o comportamento esperado nos testes e o comportamento real da aplicação.

## Evidência dos Testes
```javascript
// Tokens simulados utilizados nos testes:
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWM4ZjAwZTAyYTQwMDAxMjM0NTY3OSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMDAzODUwMH0.fake_signature_admin';

// Resultado dos testes:
✅ Alguns testes passaram (token simulado aceito)
❌ Outros testes falharam (token simulado rejeitado)
```

## Comportamento Inconsistente
- **Testes que passaram**: Sistema aceitou tokens simulados em alguns casos
- **Testes que falharam**: Sistema rejeitou tokens simulados com 401 Unauthorized
- **Padrão**: Comportamento imprevisível do middleware de autenticação

## Análise Técnica
```javascript
// Problema duplo:
// 1. Middleware de auth pode ter bypass em certas condições
// 2. Testes não estão usando autenticação real do sistema

// Testes deveriam:
// - Criar usuário real
// - Fazer login e obter token válido
// - Usar token real nos testes
```

## Cenários Afetados
- Criação de sessões (admin only)
- Atualização de sessões (admin only) 
- Deleção de sessões (admin only)
- Reset de assentos (admin only)
- Todas as operações que requerem autenticação

## Impacto no Sistema
- **Testes não confiáveis**: Resultados inconsistentes
- **Falsa segurança**: Pode mascarar problemas de autorização reais
- **Debugging dificultado**: Comportamento imprevisível
- **CI/CD prejudicado**: Testes podem falhar ou passar incorretamente

## Soluções Recomendadas

### 1. Correção Imediata - Testes
```javascript
// Substituir tokens simulados por autenticação real
const loginAsAdmin = async () => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'admin@teste.com',
      password: 'senhaAdmin123'
    });
  return response.body.token;
};
```

### 2. Correção de Médio Prazo - Middleware
- Revisar middleware de autenticação para comportamento consistente
- Implementar testes unitários para o middleware de auth
- Validar que bypass só ocorre em ambiente de desenvolvimento

## Validação Necessária
1. **Testar autenticação** em diferentes endpoints
2. **Verificar consistência** do middleware de auth
3. **Confirmar segurança** em ambiente de produção

## Prioridade
**MÉDIA-ALTA** - Afeta segurança e confiabilidade dos testes

## Arquivos Relacionados
- `src/middleware/auth.js`
- `tests/integration/helpers/authHelpers.js`
- `tests/integration/sessions/sessionRoutes.test.js`