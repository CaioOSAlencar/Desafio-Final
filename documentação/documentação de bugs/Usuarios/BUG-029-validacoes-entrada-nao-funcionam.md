# Bug #29 - Validações de Entrada Não Funcionam

## Descrição Técnica
O sistema não está implementando validações adequadas para dados de entrada em operações de atualização de usuários, permitindo dados inválidos ou retornando códigos de erro incorretos.

## Comportamento Observado
- Emails inválidos não são rejeitados (retorna 404 ao invés de 400)
- Senhas muito curtas não são validadas adequadamente
- Roles inválidos passam pela validação
- Emails duplicados retornam 404 ao invés de 409 (Conflict)

## Comportamento Esperado
- Email inválido → 400 Bad Request
- Senha curta (< 6 caracteres) → 400 Bad Request  
- Role inválido (não 'user' ou 'admin') → 400 Bad Request
- Email duplicado → 409 Conflict ou 400 Bad Request

## Análise Técnica
### Evidências dos Testes
```
Test: "Deve rejeitar email inválido"
Input: { email: 'email-invalido' }
Expected: 400 Bad Request
Received: 404 Not Found

Test: "Deve rejeitar senha muito curta"  
Input: { password: '123' }
Expected: 400 Bad Request
Received: 404 Not Found

Test: "Deve rejeitar role inválido"
Input: { role: 'moderator' }
Expected: 400 Bad Request  
Received: 404 Not Found

Test: "Deve rejeitar email duplicado"
Expected: 400/409
Received: 404 Not Found
```

### Validações Esperadas (baseado no modelo User.js)
```javascript
// Email regex do modelo
email: {
  type: String,
  required: [true, 'Email é obrigatório'],
  unique: true,
  match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
}

// Senha mínima
password: {
  type: String,
  required: [true, 'Senha é obrigatória'],
  minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
}

// Role enum
role: {
  type: String,
  enum: ['user', 'admin'],
  default: 'user'
}
```

## Possíveis Causas
1. **Rotas inexistentes**: Como as rotas retornam 404, as validações nunca são executadas
2. **Middleware de validação ausente**: Controllers podem não ter validação adequada
3. **Tratamento de erro incorreto**: Erros de validação podem estar sendo capturados incorretamente
4. **Mongoose validation desabilitada**: Validações do schema podem não estar sendo executadas

## Impacto no Sistema
- **Integridade de dados**: Dados inválidos podem ser salvos no banco
- **UX**: Usuários não recebem feedback adequado sobre erros
- **Segurança**: Senhas fracas podem ser aceitas
- **Consistência**: Comportamento inconsistente da API

## Testes de Validação Específicos
### Emails Inválidos Testados
- 'email-sem-arroba.com'
- '@sem-local.com'  
- 'sem-dominio@'
- 'espaços no@email.com'
- 'duplo@@arroba.com'

### Dados Maliciosos Testados
```javascript
const maliciousData = {
  name: { $ne: null }, // NoSQL injection
  email: "admin@test.com'; DROP TABLE users; --" // SQL injection
};
```

## Verificações Necessárias
1. Confirmar se validações do Mongoose estão ativas
2. Testar validações diretamente no modelo User
3. Verificar se controllers implementam validação adicional
4. Revisar middleware de tratamento de erros

## Classificação
- **Severidade**: Alta
- **Prioridade**: Alta  
- **Categoria**: Validação/Segurança
- **Módulo Afetado**: Usuários
- **Status**: Identificado via testes automatizados

## Solução Sugerida
1. Implementar validações robustas nos controllers
2. Ativar validações automáticas do Mongoose
3. Implementar sanitização de dados de entrada
4. Padronizar tratamento e resposta de erros de validação