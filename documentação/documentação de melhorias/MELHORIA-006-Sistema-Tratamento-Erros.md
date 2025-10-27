# Relatório de Melhoria - MELHORIA-006

## **Informações Básicas**
- **ID da Melhoria:** MELHORIA-006
- **Título:** Implementar sistema de tratamento de erros padronizado
- **User Story Relacionada:** US010 - Tratamento de Erros / US011 - Logs de Sistema
- **Data de Identificação:** 27/10/2025
- **Identificado por:** Testes de Integração Automatizados - Jest/Supertest
- **Prioridade:** Média-Alta
- **Categoria:** Infraestrutura / Debugging / UX

---

## **Descrição da Melhoria**

### **Situação Atual:**
Análise dos testes revelou **tratamento de erros inconsistente e inadequado**:
- **Códigos de status HTTP incorretos** (404 para erros de validação)
- **Mensagens de erro não padronizadas** (algumas em inglês, outras em português)
- **Falta de logs estruturados** para debugging
- **Erros internos expostos** ao usuário final
- **Ausência de stack traces** para desenvolvimento

### **Melhoria Proposta:**
Implementar sistema de tratamento de erros robusto e padronizado:
1. **Middleware global de tratamento de erros**
2. **Classes customizadas de erro** para diferentes cenários
3. **Logs estruturados** com níveis apropriados
4. **Mensagens de erro consistentes** e user-friendly
5. **Sistema de notificação** para erros críticos

---

## **Evidências dos Testes de Integração**

### **Problemas de Tratamento de Erros Identificados:**

#### **1. Códigos de Status HTTP Incorretos:**
```javascript
// ❌ PROBLEMA: Códigos de status inconsistentes
Test: "Usuário não encontrado"
Expected: 404 Not Found
Received: 500 Internal Server Error

Test: "Dados inválidos"
Expected: 400 Bad Request  
Received: 404 Not Found

Test: "Não autorizado"
Expected: 401 Unauthorized
Received: 404 Not Found
```

#### **2. Mensagens de Erro Não Padronizadas:**
```javascript
// ❌ PROBLEMA: Inconsistência nas mensagens
Módulo Usuários: "User not found" (inglês)
Módulo Filmes: "Filme não encontrado" (português)
Módulo Teatros: "Theater does not exist" (inglês)

// Formatos diferentes:
Response 1: { message: "Error occurred" }
Response 2: { error: "Algo deu errado" }
Response 3: { success: false, msg: "Failed" }
```

#### **3. Erros Internos Expostos:**
```javascript
// ❌ PROBLEMA: Stack traces expostos em produção
{
  "error": "MongoError: E11000 duplicate key error collection: cinema.users index: email_1",
  "stack": "Error: at /src/controllers/userController.js:45:12..."
}

// Informações sensíveis vazadas:
{
  "message": "connection timeout to mongodb://admin:senha123@localhost:27017/cinema"
}
```

#### **4. Ausência de Logs Estruturados:**
```javascript
// ❌ PROBLEMA: Logs inadequados para debugging
console.log("Error:", error); // Não estruturado
// Sem timestamp, contexto, níveis de severidade
// Sem correlação entre requests
// Sem informações de usuário/sessão
```

#### **5. Falta de Tratamento Específico:**
```javascript
// ❌ PROBLEMA: Todos os erros tratados genericamente
try {
  await User.create(userData);
} catch (error) {
  res.status(500).json({ message: "Erro interno" }); // Muito genérico
}

// Cenários não diferenciados:
// - Validação falhou
// - Banco de dados indisponível  
// - Recurso não encontrado
// - Acesso negado
```

### **Impacto por Módulo:**
```javascript
// Análise de erro handling por módulo:

// ❌ USUÁRIOS (0% success): Erros mal tratados
- Todos retornam 500 ou 404
- Sem diferenciação entre tipos de erro
- Mensagens confusas para o usuário

// ❌ FILMES (~25% success): Inconsistente
- Algumas operações tratam erros corretamente
- Outras falham silenciosamente
- Mix de português/inglês

// ❌ RESERVAS (~15% success): Problemas críticos
- Erros de negócio (assento ocupado) mal tratados
- Sem rollback em falhas
- Usuário não informado sobre causa

// ✅ TEATROS (97% success): Melhor tratamento
- Erros mais consistentes
- Status codes mais apropriados
- Pode servir como referência
```

---

## **Impacto nos Negócios**

### **Problemas Atuais:**
1. **Experiência Ruim do Usuário:** Mensagens de erro confusas
2. **Dificuldade de Debug:** Logs inadequados para investigação
3. **Segurança Comprometida:** Informações internas expostas
4. **Manutenção Difícil:** Sem padrão para tratamento de erros
5. **Monitoramento Impossível:** Sem métricas de erro estruturadas

### **Benefícios da Melhoria:**
1. **UX Melhorada:** Mensagens claras e acionáveis para o usuário
2. **Debug Eficiente:** Logs estruturados facilitam investigação
3. **Segurança Aprimorada:** Informações sensíveis protegidas
4. **Manutenibilidade:** Sistema padronizado e previsível
5. **Monitoramento:** Métricas e alertas automáticos

---

## **Implementação Técnica Sugerida**

### **1. Classes Customizadas de Erro:**
```javascript
// src/errors/AppErrors.js
class AppError extends Error {
  constructor(message, statusCode, code = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Acesso não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Erro no banco de dados', originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError
};
```

### **2. Middleware Global de Tratamento de Erros:**
```javascript
// src/middleware/errorHandler.js
const { AppError } = require('../errors/AppErrors');
const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log do erro com contexto
  logger.error('Error occurred:', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: process.env.NODE_ENV === 'development' ? req.body : undefined
    },
    timestamp: new Date().toISOString()
  });

  // Tratar erros específicos do MongoDB
  if (err.name === 'CastError') {
    const message = 'ID inválido fornecido';
    err = new AppError(message, 400, 'INVALID_ID');
  }

  if (err.code === 11000) {
    // Erro de duplicata no MongoDB
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} já está em uso`;
    err = new ConflictError(message);
  }

  if (err.name === 'ValidationError') {
    // Erro de validação do Mongoose
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    err = new ValidationError('Dados inválidos', errors);
  }

  if (err.name === 'JsonWebTokenError') {
    err = new UnauthorizedError('Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    err = new UnauthorizedError('Token expirado');
  }

  // Resposta padronizada
  const response = {
    success: false,
    message: err.message,
    code: err.code,
    timestamp: err.timestamp || new Date().toISOString()
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Adicionar erros de validação se existirem
  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  // Status code padrão para erros não operacionais
  const statusCode = err.statusCode || 500;

  // Para erros 500, não expor detalhes em produção
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    response.message = 'Erro interno do servidor';
    delete response.code;
  }

  res.status(statusCode).json(response);
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
```

### **3. Sistema de Logging Estruturado:**
```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'cinema-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Arquivos de log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Função helper para log de requisições
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
  });
  
  next();
};

module.exports = { logger, logRequest };
```

### **4. Aplicação nos Controllers:**
```javascript
// src/controllers/userController.js (exemplo corrigido)
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} = require('../errors/AppErrors');
const { User } = require('../models');

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Verificar se email já existe
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email já está em uso');
  }

  const user = await User.create({
    name,
    email,
    password
  });

  res.status(201).json({
    success: true,
    message: 'Usuário criado com sucesso',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password');
  
  if (!user) {
    throw new NotFoundError('Usuário');
  }

  res.json({
    success: true,
    data: { user }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    throw new NotFoundError('Usuário');
  }

  // Verificar conflito de email se está sendo atualizado
  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ 
      email: updates.email,
      _id: { $ne: id }
    });
    
    if (emailExists) {
      throw new ConflictError('Email já está em uso');
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'Usuário atualizado com sucesso',
    data: { user: updatedUser }
  });
});

module.exports = {
  createUser,
  getUserById,
  updateUser
};
```

### **5. Configuração no App Principal:**
```javascript
// src/index.js (adicionar)
const { errorHandler } = require('./middleware/errorHandler');
const { logRequest } = require('./utils/logger');

// Middleware de logging
app.use(logRequest);

// Rotas...
app.use('/api/v1', routes);

// Middleware de tratamento de erros (DEVE ser o último)
app.use(errorHandler);

// Handler para rotas não encontradas
app.all('*', (req, res, next) => {
  const err = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);
  next(err);
});
```

---

## **Cenários de Teste para Validação**

### **Testes de Códigos de Status Corretos:**
```javascript
describe('Error Status Codes', () => {
  test('Deve retornar 404 para usuário não encontrado', async () => {
    const response = await request(app)
      .get('/users/nonexistent-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Usuário não encontrado',
      code: 'NOT_FOUND'
    });
  });

  test('Deve retornar 409 para email duplicado', async () => {
    await createUser({ email: 'test@example.com' });

    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'MinhaSenh@123'
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Email já está em uso',
      code: 'CONFLICT'
    });
  });

  test('Deve retornar 401 para token inválido', async () => {
    const response = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      message: 'Token inválido',
      code: 'UNAUTHORIZED'
    });
  });
});
```

### **Testes de Padronização de Mensagens:**
```javascript
describe('Error Message Consistency', () => {
  test('Todas as mensagens devem estar em português', async () => {
    const errorResponses = await Promise.all([
      request(app).get('/users/invalid-id').expect(404),
      request(app).get('/movies/invalid-id').expect(404),
      request(app).get('/theaters/invalid-id').expect(404)
    ]);

    errorResponses.forEach(response => {
      expect(response.body.message).not.toMatch(/[A-Za-z]+ not found/);
      expect(response.body.message).toMatch(/não encontrado/);
    });
  });

  test('Formato de resposta deve ser consistente', async () => {
    const response = await request(app)
      .get('/users/invalid-id')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('timestamp');
  });
});
```

### **Testes de Segurança (Não Exposição de Dados Internos):**
```javascript
describe('Error Security', () => {
  test('Não deve expor stack traces em produção', async () => {
    // Simular erro interno
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .post('/users')
      .send({ invalid: 'data' })
      .expect(500);

    expect(response.body).not.toHaveProperty('stack');
    expect(response.body.message).toBe('Erro interno do servidor');

    process.env.NODE_ENV = originalEnv;
  });

  test('Não deve expor informações de conexão do banco', async () => {
    // Testar erro de conexão
    const response = await request(app)
      .get('/users')
      .expect(500);

    expect(response.body.message).not.toContain('mongodb://');
    expect(response.body.message).not.toContain('password');
    expect(response.body.message).not.toContain('connection');
  });
});
```

---

## **Plano de Implementação**

### **Fase 1 - Classes de Erro e Middleware (2 dias):**
- [ ] Criar classes customizadas de erro
- [ ] Implementar middleware global de tratamento
- [ ] Configurar sistema de logging com Winston
- [ ] Integrar middleware na aplicação

### **Fase 2 - Aplicação nos Controllers (3 dias):**
- [ ] Refatorar todos os controllers para usar novas classes
- [ ] Aplicar asyncHandler em todas as rotas
- [ ] Padronizar mensagens de erro
- [ ] Implementar tratamento específico por tipo de erro

### **Fase 3 - Logging Estruturado (1 dia):**
- [ ] Configurar rotação de logs
- [ ] Implementar correlação de requests
- [ ] Adicionar métricas de erro
- [ ] Configurar alertas para erros críticos

### **Fase 4 - Testes e Validação (2 dias):**
- [ ] Criar testes para cada tipo de erro
- [ ] Validar códigos de status corretos
- [ ] Testar segurança (não exposição de dados)
- [ ] Verificar consistência entre módulos

---

## **Estimativa de Esforço**
- **Classes de erro e middleware:** 16 horas
- **Refatoração de controllers:** 24 horas
- **Sistema de logging:** 8 horas
- **Testes e validação:** 16 horas
- **Total:** 64 horas (8 dias úteis)

---

## **Critérios de Aceitação**
- [ ] Códigos de status HTTP corretos em todos os cenários
- [ ] Mensagens de erro padronizadas e em português
- [ ] Stack traces não expostos em produção
- [ ] Informações sensíveis protegidas
- [ ] Logs estruturados com contexto completo
- [ ] Tratamento específico para cada tipo de erro
- [ ] Formato de resposta consistente em todos os módulos
- [ ] Middleware de error handling aplicado globalmente

---

## **Métricas de Sucesso**
- **Antes:** Códigos de status inconsistentes (60% incorretos)
- **Meta:** 100% dos códigos de status corretos
- **KPI:** Redução de 90% em erros mal tratados
- **Segurança:** 0% de informações internas expostas
- **Debug:** Tempo de investigação reduzido em 70%

---

**Status:** Média-Alta Prioridade - Melhoria de UX e Debug  
**Próximos Passos:** Implementar classes de erro e middleware global  
**Responsável:** Equipe de Desenvolvimento + DevOps