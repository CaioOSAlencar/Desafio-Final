# Relatório de Melhoria - MELHORIA-005

## **Informações Básicas**
- **ID da Melhoria:** MELHORIA-005
- **Título:** Implementar sistema completo de validação de dados
- **User Story Relacionada:** US004 - Cadastro de Usuários / US009 - Validação de Dados
- **Data de Identificação:** 27/10/2025
- **Identificado por:** Testes de Integração Automatizados - Jest/Supertest
- **Prioridade:** Alta
- **Categoria:** Qualidade de Dados / Segurança

---

## **Descrição da Melhoria**

### **Situação Atual:**
Análise dos testes revelou **validações inconsistentes e faltantes**:
- **Emails inválidos aceitos** (formato incorreto, duplicados)
- **Senhas fracas permitidas** (menos de 8 caracteres, sem complexidade)
- **Dados obrigatórios não validados** (campos vazios aceitos)
- **Validações diferentes por módulo** (filmes aceita título vazio, usuários não)
- **Falta de sanitização** de dados de entrada

### **Melhoria Proposta:**
Implementar sistema de validação robusto e padronizado:
1. **Middleware de validação centralizado** usando Joi ou Yup
2. **Validação em camadas** (frontend + backend + banco)
3. **Sanitização automática** de dados de entrada
4. **Mensagens de erro consistentes** e traduzidas
5. **Validações de negócio específicas** por domínio

---

## **Evidências dos Testes de Integração**

### **Problemas de Validação Identificados:**

#### **1. Validação de Email Inconsistente:**
```javascript
// ❌ PROBLEMA: Emails inválidos aceitos
Test: "Deve rejeitar email inválido"
Input: { email: "email-sem-arroba", password: "senha123" }
Expected: 400 Bad Request
Received: 201 Created (usuário criado!) ❌

Test: "Deve rejeitar email duplicado"
Input: Mesmo email de usuário existente
Expected: 409 Conflict
Received: 201 Created (duplicado criado!) ❌
```

#### **2. Validação de Senha Fraca:**
```javascript
// ❌ PROBLEMA: Senhas fracas permitidas
Test: "Deve rejeitar senha muito curta"
Input: { email: "test@test.com", password: "123" }
Expected: 400 Bad Request
Received: 201 Created ❌

// ❌ Senhas aceitas que deveriam ser rejeitadas:
"1" → ✅ Aceita (deveria ser ❌)
"aa" → ✅ Aceita (deveria ser ❌)  
"senha" → ✅ Aceita (deveria ser ❌)
"12345678" → ✅ Aceita (deveria requerer complexidade)
```

#### **3. Campos Obrigatórios Não Validados:**
```javascript
// ❌ PROBLEMA: Dados obrigatórios vazios aceitos
// Usuários:
Input: { name: "", email: "test@test.com", password: "senha123" }
Result: 201 Created com name vazio ❌

// Filmes:
Input: { title: "", genre: "Action" }
Result: 201 Created com título vazio ❌

// Sessões:
Input: { movieId: "", theaterId: "validId", showTime: "2025-01-01" }
Result: 201 Created com movieId vazio ❌
```

#### **4. Validações Específicas Faltantes:**
```javascript
// ❌ PROBLEMA: Validações de negócio ausentes
// Preços negativos aceitos:
Input: { title: "Filme", ticketPrice: -50 }
Result: 201 Created ❌

// Datas no passado aceitas para sessões:
Input: { showTime: "2020-01-01T10:00:00Z" }
Result: 201 Created ❌

// Capacidade de teatro impossível:
Input: { name: "Teatro", capacity: -100 }
Result: 201 Created ❌
```

### **Inconsistências Entre Módulos:**
```javascript
// ✅ TEATROS: Validações funcionando bem
name: required, minLength: 2
capacity: required, minimum: 1

// ❌ USUÁRIOS: Validações básicas faltando
email: sem verificação de formato
password: sem verificação de força

// ❌ FILMES: Validações parciais
title: aceita string vazia
ticketPrice: aceita valores negativos

// ❌ SESSÕES: Validações críticas ausentes
showTime: aceita datas no passado
movieId/theaterId: não verifica se existem
```

---

## **Impacto nos Negócios**

### **Riscos Atuais:**
1. **Dados Corrompidos:** Registros inválidos no banco de dados
2. **Experiência Ruim:** Usuários criados com dados inválidos
3. **Problemas de Segurança:** Senhas fracas, emails duplicados
4. **Inconsistência:** Comportamentos diferentes por módulo
5. **Dificuldade de Debug:** Dados inválidos causam erros inesperados

### **Benefícios da Melhoria:**
1. **Integridade de Dados:** Garantia de dados válidos em todas as tabelas
2. **Segurança Aumentada:** Senhas fortes obrigatórias
3. **Experiência Consistente:** Validações uniformes em toda aplicação
4. **Facilidade de Manutenção:** Sistema centralizado de validação
5. **Redução de Bugs:** Menos erros causados por dados inválidos

---

## **Implementação Técnica Sugerida**

### **1. Sistema de Validação Centralizado:**
```javascript
// src/middleware/validation.js
const Joi = require('joi');

// Esquemas de validação por entidade
const schemas = {
  user: {
    create: Joi.object({
      name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
          'string.empty': 'Nome é obrigatório',
          'string.min': 'Nome deve ter pelo menos 2 caracteres',
          'string.max': 'Nome deve ter no máximo 100 caracteres'
        }),
      
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .required()
        .messages({
          'string.email': 'Email deve ter formato válido',
          'string.empty': 'Email é obrigatório'
        }),
      
      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': 'Senha deve ter pelo menos 8 caracteres',
          'string.pattern.base': 'Senha deve conter: maiúscula, minúscula, número e símbolo',
          'string.empty': 'Senha é obrigatória'
        }),
      
      role: Joi.string()
        .valid('user', 'admin')
        .default('user')
    }),
    
    update: Joi.object({
      name: Joi.string().trim().min(2).max(100),
      email: Joi.string().email({ tlds: { allow: false } }).lowercase(),
      // Senha não é obrigatória em updates
      password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    })
  },

  movie: {
    create: Joi.object({
      title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
          'string.empty': 'Título é obrigatório',
          'string.min': 'Título não pode estar vazio'
        }),
      
      genre: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required(),
      
      duration: Joi.number()
        .integer()
        .min(1)
        .max(600)
        .required()
        .messages({
          'number.min': 'Duração deve ser pelo menos 1 minuto',
          'number.max': 'Duração deve ser no máximo 600 minutos'
        }),
      
      ticketPrice: Joi.number()
        .precision(2)
        .min(0.01)
        .max(1000)
        .required()
        .messages({
          'number.min': 'Preço deve ser maior que zero',
          'number.max': 'Preço deve ser no máximo R$ 1000'
        }),
      
      synopsis: Joi.string()
        .trim()
        .max(1000)
        .optional()
    })
  },

  session: {
    create: Joi.object({
      movieId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          'string.pattern.base': 'ID do filme inválido'
        }),
      
      theaterId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
          'string.pattern.base': 'ID do teatro inválido'
        }),
      
      showTime: Joi.date()
        .iso()
        .min('now')
        .required()
        .messages({
          'date.min': 'Data da sessão deve ser no futuro'
        })
    })
  },

  theater: {
    create: Joi.object({
      name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required(),
      
      capacity: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .required()
        .messages({
          'number.min': 'Capacidade deve ser pelo menos 1',
          'number.max': 'Capacidade deve ser no máximo 1000'
        })
    })
  }
};

// Middleware de validação
const validate = (entity, operation = 'create') => {
  return (req, res, next) => {
    const schema = schemas[entity]?.[operation];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Esquema de validação não encontrado'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true, // Remove campos não definidos
      convert: true // Converte tipos automaticamente
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors
      });
    }

    // Substitui req.body pelos dados validados e sanitizados
    req.body = value;
    next();
  };
};

module.exports = { validate, schemas };
```

### **2. Validações Customizadas de Negócio:**
```javascript
// src/middleware/businessValidation.js
const { User, Movie, Theater } = require('../models');

const businessValidations = {
  // Verificar se email já existe
  checkUniqueEmail: async (req, res, next) => {
    try {
      const { email } = req.body;
      const { id } = req.params;

      if (email) {
        const existingUser = await User.findOne({ 
          email,
          ...(id && { _id: { $ne: id } }) // Excluir o próprio usuário em updates
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email já está em uso',
            errors: [{ field: 'email', message: 'Este email já está cadastrado' }]
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar email'
      });
    }
  },

  // Verificar se filme e teatro existem para sessões
  checkSessionReferences: async (req, res, next) => {
    try {
      const { movieId, theaterId } = req.body;

      if (movieId) {
        const movie = await Movie.findById(movieId);
        if (!movie) {
          return res.status(400).json({
            success: false,
            message: 'Filme não encontrado',
            errors: [{ field: 'movieId', message: 'Filme especificado não existe' }]
          });
        }
      }

      if (theaterId) {
        const theater = await Theater.findById(theaterId);
        if (!theater) {
          return res.status(400).json({
            success: false,
            message: 'Teatro não encontrado',
            errors: [{ field: 'theaterId', message: 'Teatro especificado não existe' }]
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar referências'
      });
    }
  },

  // Verificar conflitos de horário de sessão
  checkSessionConflicts: async (req, res, next) => {
    try {
      const { theaterId, showTime, movieId } = req.body;
      const { id } = req.params;

      if (theaterId && showTime && movieId) {
        // Buscar duração do filme
        const movie = await Movie.findById(movieId);
        if (!movie) return next(); // Será capturado por checkSessionReferences

        const sessionStart = new Date(showTime);
        const sessionEnd = new Date(sessionStart.getTime() + (movie.duration * 60000)); // duration em minutos

        // Buscar sessões conflitantes no mesmo teatro
        const conflictingSessions = await Session.find({
          theaterId,
          ...(id && { _id: { $ne: id } }), // Excluir a própria sessão em updates
          $or: [
            // Nova sessão começa durante uma existente
            { showTime: { $lte: sessionStart }, endTime: { $gt: sessionStart } },
            // Nova sessão termina durante uma existente
            { showTime: { $lt: sessionEnd }, endTime: { $gte: sessionEnd } },
            // Nova sessão engloba uma existente
            { showTime: { $gte: sessionStart }, endTime: { $lte: sessionEnd } }
          ]
        });

        if (conflictingSessions.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Conflito de horário detectado',
            errors: [{
              field: 'showTime',
              message: 'Já existe uma sessão neste teatro no horário especificado'
            }]
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar conflitos de sessão'
      });
    }
  }
};

module.exports = businessValidations;
```

### **3. Aplicação nas Rotas:**
```javascript
// src/routes/userRoutes.js (corrigido)
const express = require('express');
const { validate } = require('../middleware/validation');
const { checkUniqueEmail } = require('../middleware/businessValidation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Aplicar validações em ordem correta
router.post('/',
  validate('user', 'create'),    // 1. Validação de formato
  checkUniqueEmail,              // 2. Validação de negócio
  authenticate,                  // 3. Autenticação
  authorize('admin'),            // 4. Autorização
  createUser                     // 5. Controller
);

router.put('/:id',
  validate('user', 'update'),
  checkUniqueEmail,
  authenticate,
  authorize('admin'),
  updateUser
);

module.exports = router;
```

---

## **Cenários de Teste para Validação**

### **Testes de Validação de Email:**
```javascript
describe('Email Validation', () => {
  const invalidEmails = [
    'email-sem-arroba',
    'email@',
    '@domain.com',
    'email..double.dot@domain.com',
    'email@domain',
    ''
  ];

  test.each(invalidEmails)('Deve rejeitar email inválido: %s', async (email) => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email,
        password: 'MinhaSenh@123'
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'email',
        message: expect.stringContaining('Email')
      })
    );
  });

  test('Deve rejeitar email duplicado', async () => {
    // Criar primeiro usuário
    await createUser({
      name: 'First User',
      email: 'test@example.com',
      password: 'MinhaSenh@123'
    });

    // Tentar criar segundo usuário com mesmo email
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Second User',
        email: 'test@example.com',
        password: 'OutraSenh@456'
      })
      .expect(409);

    expect(response.body.message).toContain('já está em uso');
  });
});
```

### **Testes de Validação de Senha:**
```javascript
describe('Password Validation', () => {
  const weakPasswords = [
    '123',           // Muito curta
    'senha',         // Sem maiúscula, número, símbolo
    'SENHA',         // Sem minúscula, número, símbolo
    '12345678',      // Sem letras, símbolo
    'MinhaSenh',     // Sem número, símbolo
    'minhasen@1'     // Sem maiúscula
  ];

  test.each(weakPasswords)('Deve rejeitar senha fraca: %s', async (password) => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'password',
        message: expect.stringContaining('Senha')
      })
    );
  });

  test('Deve aceitar senha forte', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'MinhaSenh@123'
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

### **Testes de Validações de Negócio:**
```javascript
describe('Business Validations', () => {
  test('Deve rejeitar preço negativo para filme', async () => {
    const response = await request(app)
      .post('/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Filme Teste',
        genre: 'Action',
        duration: 120,
        ticketPrice: -10.50
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'ticketPrice',
        message: expect.stringContaining('maior que zero')
      })
    );
  });

  test('Deve rejeitar data no passado para sessão', async () => {
    const response = await request(app)
      .post('/sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        movieId: validMovieId,
        theaterId: validTheaterId,
        showTime: '2020-01-01T10:00:00Z'
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        field: 'showTime',
        message: expect.stringContaining('futuro')
      })
    );
  });
});
```

---

## **Plano de Implementação**

### **Fase 1 - Sistema Base (3 dias):**
- [ ] Instalar e configurar Joi
- [ ] Criar middleware de validação centralizado
- [ ] Implementar esquemas para todos os modelos
- [ ] Aplicar validação básica em todas as rotas

### **Fase 2 - Validações de Negócio (2 dias):**
- [ ] Implementar verificação de emails duplicados
- [ ] Adicionar validação de referências (movieId, theaterId)
- [ ] Criar validação de conflitos de sessão
- [ ] Implementar validações específicas por domínio

### **Fase 3 - Mensagens e UX (1 dia):**
- [ ] Padronizar mensagens de erro
- [ ] Implementar internacionalização básica
- [ ] Melhorar formato de resposta de erros
- [ ] Documentar todas as validações

### **Fase 4 - Testes e Validação (2 dias):**
- [ ] Criar testes para todas as validações
- [ ] Executar suite completa de testes
- [ ] Corrigir falhas identificadas
- [ ] Validar taxa de sucesso das validações

---

## **Estimativa de Esforço**
- **Sistema base de validação:** 24 horas
- **Validações de negócio:** 16 horas
- **Mensagens e UX:** 8 horas
- **Testes e validação:** 16 horas
- **Total:** 64 horas (8 dias úteis)

---

## **Critérios de Aceitação**
- [ ] Todos os emails inválidos são rejeitados com 400
- [ ] Senhas fracas são rejeitadas com mensagem específica
- [ ] Campos obrigatórios vazios são rejeitados
- [ ] Emails duplicados são rejeitados com 409
- [ ] Preços negativos são rejeitados
- [ ] Datas no passado para sessões são rejeitadas
- [ ] Referências inválidas (movieId, theaterId) são rejeitadas
- [ ] Conflitos de horário de sessão são detectados
- [ ] Todas as validações têm mensagens claras e úteis
- [ ] Comportamento consistente em todos os módulos

---

## **Métricas de Sucesso**
- **Antes:** Emails inválidos aceitos (0% validação)
- **Meta:** 100% dos dados inválidos rejeitados
- **KPI:** Taxa de validação bem-sucedida > 95%
- **Qualidade:** Redução de 90% em dados corrompidos no banco

---

**Status:** Alta Prioridade - Qualidade de Dados Crítica  
**Próximos Passos:** Implementar validações básicas primeiro  
**Responsável:** Equipe de Desenvolvimento + QA