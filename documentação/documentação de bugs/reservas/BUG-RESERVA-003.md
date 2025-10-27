# BUG-RESERVA-003: Restrição de Índice Único Causa Falhas em Testes

**Severidade:** MÉDIO  
**Status:** Confirmado  
**Módulo:** Reservas (Database Layer)  
**Entidade Afetada:** Theater Collection  

## Descrição do Problema

Durante a execução de testes de integração, ocorrem falhas devido a violação de restrição de índice único na collection `theaters`. O erro `E11000 duplicate key error` impede a criação de dados de apoio necessários para testes de reservas.

## Comportamento Esperado

Os testes deveriam poder criar e limpar dados de apoio (theaters, movies, sessions) sem conflitos de chave única, permitindo execução independente e paralela dos testes.

## Comportamento Atual

```javascript
MongoServerError: E11000 duplicate key error collection: cinema-test.theaters 
index: name_1 dup key: { name: "Sala Teste 1761591056424" }
```

## Evidências Técnicas

```javascript
// Código que gera o erro
const mockTheater = {
  name: `Sala Teste ${Date.now()}`,  // Tentativa de nome único
  capacity: 100,
  rows: 10,
  seatsPerRow: 10,
  features: ['digital_projection', 'surround_sound']
};

// Erro ocorre mesmo com timestamp único
const theater = await Theater.create(mockTheater);
```

## Impacto

- **Testes:** Impossibilidade de executar testes de integração completos
- **CI/CD:** Pipeline de testes falha intermitentemente
- **Desenvolvimento:** Dificuldade para validar funcionalidades de reservas
- **Severidade:** MÉDIO - afeta processo de desenvolvimento

## Análise da Causa Raiz

1. **Limpeza inadequada:** `beforeEach` pode não estar limpando completamente os dados
2. **Timing issues:** `Date.now()` pode gerar valores idênticos em execuções rápidas
3. **Configuração de índice:** Theater model tem restrição `unique: true` no campo `name`
4. **Isolamento de testes:** Testes podem estar interferindo uns com os outros

## Solução Recomendada

### Solução Imediata
```javascript
// Usar UUID para garantir unicidade absoluta
const { v4: uuidv4 } = require('uuid');

const mockTheater = {
  name: `Sala Teste ${uuidv4()}`,
  capacity: 100,
  // ... resto da configuração
};
```

### Solução Estrutural
```javascript
// Melhorar limpeza de dados nos testes
beforeEach(async () => {
  // Aguardar conclusão da limpeza
  await Promise.all([
    Theater.deleteMany({}),
    Movie.deleteMany({}),
    Session.deleteMany({}),
    Reservation.deleteMany({}),
    User.deleteMany({})
  ]);
  
  // Aguardar um tick para garantir que operações assíncronas terminem
  await new Promise(resolve => setImmediate(resolve));
});
```

### Solução de Configuração
```javascript
// Considerar remover restrição única em ambiente de teste
if (process.env.NODE_ENV === 'test') {
  // Usar configuração mais flexível para testes
  theaterSchema.index({ name: 1 }, { unique: false });
}
```

## Testes para Validação

```javascript
test('Deve permitir criação de múltiplos theaters em sequência', async () => {
  const theater1 = await Theater.create({
    name: `Sala Teste ${uuidv4()}`,
    capacity: 100
  });
  
  const theater2 = await Theater.create({
    name: `Sala Teste ${uuidv4()}`,
    capacity: 150
  });
  
  expect(theater1._id).toBeDefined();
  expect(theater2._id).toBeDefined();
  expect(theater1.name).not.toBe(theater2.name);
});
```

## Arquivos Relacionados

- `src/models/Theater.js` - Definição do schema e índices
- `tests/integration/helpers/reservationHelpers.js` - Geração de dados mock
- `tests/integration/setup/testSetup.js` - Configuração de limpeza de dados

---
**Data de Identificação:** 2024-12-08  
**Identificado por:** Testes de Integração Automatizados  
**Prioridade:** P2 (Resolver para melhorar DX)