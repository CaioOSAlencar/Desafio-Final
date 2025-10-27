# BUG-RESERVA-004: Falta de Validação de Dados de Entrada

**Severidade:** ALTO  
**Status:** Presumido  
**Módulo:** Reservas  
**Endpoint Afetado:** POST /api/v1/reservations  

## Descrição do Problema

Com base nos testes que falharam antes mesmo de chegar à validação (retornando 404), há indícios de que o sistema pode não estar implementando validação adequada de dados de entrada para criação de reservas. Quando o endpoint for corrigido, é provável que aceite dados inválidos.

## Comportamento Esperado

O sistema deveria validar rigorosamente:
- **Campos obrigatórios:** session, seats, paymentMethod
- **Formato de assentos:** row (string), number (integer), type (enum: full/half)
- **Existência de session:** Verificar se session ID existe no banco
- **Disponibilidade:** Verificar se assentos não estão ocupados
- **Dados de pagamento:** Validar paymentMethod contra enum permitido

## Comportamento Presumido (Após Correção da URL)

Baseado nos padrões identificados em outros módulos, é provável que:
- Aceite arrays vazios de assentos
- Não valide formato de assentos corretamente
- Não verifique existência de session referenciada
- Permita paymentMethod inválidos

## Evidências de Testes Preparados

```javascript
// Testes que deveriam falhar com validação adequada
const invalidData = {
  session: 'invalid_session_id',
  seats: [],  // Array vazio
  paymentMethod: 'invalid_method'
};

const invalidSeatData = {
  session: validSessionId,
  seats: [
    { row: '', number: 'invalid', type: 'invalid_type' }
  ],
  paymentMethod: 'credit_card'
};
```

## Impacto Potencial

- **Integridade de Dados:** Reservas inválidas no banco de dados
- **Experiência do Usuário:** Erros confusos e inconsistentes
- **Lógica de Negócio:** Possibilidade de dupla reserva de assentos
- **Segurança:** Bypass de regras de negócio via API
- **Severidade:** ALTO - pode comprometer integridade do sistema

## Validações Recomendadas

### Validação de Schema (Mongoose)
```javascript
const seatSchema = new mongoose.Schema({
  row: {
    type: String,
    required: [true, 'Row is required'],
    match: [/^[A-Z]$/, 'Row must be a single uppercase letter']
  },
  number: {
    type: Number,
    required: [true, 'Seat number is required'],
    min: [1, 'Seat number must be positive']
  },
  type: {
    type: String,
    required: [true, 'Ticket type is required'],
    enum: {
      values: ['full', 'half'],
      message: 'Type must be either full or half'
    }
  }
});

const reservationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required']
  },
  seats: {
    type: [seatSchema],
    required: [true, 'At least one seat is required'],
    validate: {
      validator: function(seats) {
        return seats && seats.length > 0;
      },
      message: 'At least one seat must be selected'
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['credit_card', 'debit_card', 'pix', 'bank_transfer'],
      message: 'Invalid payment method'
    }
  }
});
```

### Validação de Lógica de Negócio
```javascript
// Verificar se session existe
const session = await Session.findById(sessionId);
if (!session) {
  throw new Error('Session not found');
}

// Verificar disponibilidade de assentos
const existingReservations = await Reservation.find({
  session: sessionId,
  'seats.row': { $in: seats.map(s => s.row) },
  'seats.number': { $in: seats.map(s => s.number) }
});

if (existingReservations.length > 0) {
  throw new Error('One or more seats are already reserved');
}
```

## Testes de Validação Recomendados

```javascript
test('Deve rejeitar reserva sem assentos', async () => {
  const response = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      session: validSessionId,
      seats: [],
      paymentMethod: 'credit_card'
    });
  
  expect(response.status).toBe(400);
  expect(response.body.message).toContain('at least one seat');
});

test('Deve rejeitar dados de assento inválidos', async () => {
  const response = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      session: validSessionId,
      seats: [{ row: '', number: 'invalid', type: 'invalid' }],
      paymentMethod: 'credit_card'
    });
  
  expect(response.status).toBe(400);
});
```

---
**Data de Identificação:** 2024-12-08  
**Identificado por:** Análise de Padrões em Testes de Integração  
**Prioridade:** P1 (Verificar após correção do BUG-RESERVA-001)