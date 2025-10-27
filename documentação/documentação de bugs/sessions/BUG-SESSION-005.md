# BUG-SESSION-005: Falta de Tratamento de Erros Específicos

## Status
🟡 **MÉDIO** - Bug de User Experience

## Descrição
O sistema não está diferenciando adequadamente entre diferentes tipos de erros de validação. Todos os erros retornam 404, quando deveriam retornar códigos HTTP mais específicos baseados no tipo de problema.

## Evidência dos Testes
```javascript
// Cenários que deveriam retornar códigos diferentes:

// 1. Dados obrigatórios ausentes - deveria ser 400
expect([400, 401]).toContain(res.status); // Recebeu 404

// 2. Validação de dados inválidos - deveria ser 400  
expect([400, 401]).toContain(res.status); // Recebeu 404

// 3. Sem autenticação - deveria ser 401
.expect(401); // Recebeu 404

// 4. Sem autorização - deveria ser 403
.expect(401); // Recebeu 404
```

## Códigos HTTP Esperados vs Recebidos

| Cenário | Esperado | Recebido | Impacto |
|---------|----------|----------|---------|
| Campo obrigatório ausente | 400 Bad Request | 404 Not Found | UX confusa |
| Dados inválidos | 400 Bad Request | 404 Not Found | Debug dificultado |
| Sem token | 401 Unauthorized | 404 Not Found | Segurança mascarada |
| Token inválido | 401 Unauthorized | 404 Not Found | Auth não clara |
| Sem permissão | 403 Forbidden | 404 Not Found | Autorização confusa |

## Análise Técnica
```javascript
// Problema provável:
// 1. Middleware de erro genérico convertendo tudo para 404
// 2. Falta de validação específica nos controllers
// 3. Rotas não implementadas (principal causa)

// Fluxo correto deveria ser:
// Request → Auth Middleware → Validation → Controller → Response
//                ↓ 401         ↓ 400        ↓ 404/200
```

## Impacto na Experiência do Usuário
- **Frontend**: Não consegue diferenciar tipos de erro
- **Debugging**: Difícil identificar causa raiz dos problemas
- **API Documentation**: Códigos de status documentados incorretamente
- **Integração**: Clientes da API recebem informações imprecisas

## Cenários de Validação Afetados
1. **Sessão sem filme** - deveria retornar 400 com mensagem clara
2. **Sessão sem teatro** - deveria retornar 400 com campo específico
3. **Data inválida** - deveria retornar 400 com formato esperado
4. **Preços negativos** - deveria retornar 400 com validação de range
5. **Assentos vazios** - deveria retornar 400 com requisito mínimo

## Solução Recomendada

### 1. Implementar Validação Específica
```javascript
// Exemplo para controller de sessões
const createSession = async (req, res) => {
  try {
    // Validação de campos obrigatórios
    if (!req.body.movie) {
      return res.status(400).json({
        success: false,
        message: 'Campo movie é obrigatório'
      });
    }
    
    // Validação de dados
    if (req.body.fullPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Preço deve ser positivo'
      });
    }
    
    // Lógica do controller...
  } catch (error) {
    // Tratamento específico de erros
  }
};
```

### 2. Middleware de Validação
```javascript
const validateSessionData = (req, res, next) => {
  const errors = [];
  
  if (!req.body.movie) errors.push('Movie é obrigatório');
  if (!req.body.theater) errors.push('Theater é obrigatório');
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
  }
  
  next();
};
```

## Prioridade
**MÉDIA** - Afeta UX e facilidade de desenvolvimento

## Arquivos para Correção
- `src/controllers/sessionController.js`
- `src/middleware/validation.js` (criar se não existir)
- `src/routes/sessionRoutes.js`
- `src/middleware/error.js` (revisar tratamento global)