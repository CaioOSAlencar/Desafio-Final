# Plano de Teste - API de Reservas do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de reservas do Cinema App, que implementa o sistema completo de reserva de assentos para sessões de cinema. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo validações de disponibilidade de assentos, cálculo de preços, controle de status de reservas e integração com sessões e usuários. O sistema permite que usuários façam reservas de assentos e administradores gerenciem todas as reservas.

## Objetivo
Garantir que a API de reservas funcione conforme os critérios de aceitação, validando:

- Implementação completa do sistema de reservas (Criar, Listar, Visualizar, Atualizar Status, Cancelar).
- Validação de disponibilidade de assentos antes da reserva.
- Cálculo correto de preços (full/half) baseado no tipo de assento selecionado.
- Atualização automática do status dos assentos na sessão.
- Controle de acesso adequado (usuários podem ver suas reservas, admins veem todas).
- Prevenção de reservas duplicadas e conflitos de assentos.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de reservas (`/api/reservations/*`).
- Validação dos campos USER, SESSION, SEATS, TOTAL_PRICE, STATUS, PAYMENT_STATUS, PAYMENT_METHOD.
- Testes dos verbos HTTP: GET (listar), POST (criar), PUT (atualizar status), DELETE (cancelar).
- Validações de regras de negócio, como disponibilidade de assentos e cálculo de preços.
- Testes de controle de acesso por usuário/admin.
- Integração com sessões (atualização de status dos assentos).
- Cenários de pagamento e status de reserva.
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de processamento real de pagamento.
- Testes de segurança avançados, a menos que especificado.
- Testes de notificações ou emails.

## Análise
A API de reservas gerencia todo o processo de reserva de assentos no cinema, com as seguintes características:

**Endpoints principais:**
- `GET /api/reservations` (listar todas as reservas - admin only)
- `GET /api/reservations/me` (reservas do usuário logado)
- `GET /api/reservations/:id` (detalhes de reserva específica)
- `POST /api/reservations` (criar nova reserva)
- `PUT /api/reservations/:id` (atualizar status - admin only)
- `DELETE /api/reservations/:id` (cancelar reserva - admin only)

**Campos principais:**
- USER (ObjectId, referência ao usuário, obrigatório)
- SESSION (ObjectId, referência à sessão, obrigatório)
- SEATS (array de objetos com row, number, type, obrigatório)
- TOTAL_PRICE (number, calculado automaticamente)
- STATUS (enum: pending/confirmed/cancelled, padrão: pending)
- PAYMENT_STATUS (enum: pending/completed/failed, padrão: pending)
- PAYMENT_METHOD (enum: credit_card/debit_card/pix/bank_transfer)

**Riscos identificados:**
- Reservas simultâneas do mesmo assento podem causar conflitos.
- Falhas no cálculo de preços podem resultar em valores incorretos.
- Problemas na atualização de status dos assentos podem deixar inconsistências.
- Falhas no controle de acesso podem expor reservas de outros usuários.
- Operações em reservas inexistentes podem causar comportamentos indefinidos.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como conflitos de assentos e cálculos
- **Teste Exploratório:** Identificação de cenários de concorrência e edge cases
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Integração:** Validação da integração entre reservas, sessões e usuários
- **Teste de Autorização:** Validação de controle de acesso por usuário

## Mapa Mental da Aplicação
O mapa mental da API de reservas inclui:

**Nó principal:** API de Reservas

**Endpoints:**
- GET /api/reservations (admin)
- GET /api/reservations/me (user)
- GET /api/reservations/:id (user/admin)
- POST /api/reservations (user)
- PUT /api/reservations/:id (admin)
- DELETE /api/reservations/:id (admin)

**Campos:**
- USER (validação de existência)
- SESSION (validação de existência e horário)
- SEATS (validação de disponibilidade e formato)
- TOTAL_PRICE (cálculo automático)
- STATUS (controle de estado)
- PAYMENT_STATUS (controle de pagamento)

**Integrações:**
- Sessões (verificação de assentos disponíveis)
- Usuários (autorização e propriedade)
- Cálculo de preços (full/half price)

**Fluxos:**
- Seleção e reserva de assentos
- Verificação de disponibilidade
- Cálculo automático de preços
- Atualização de status da sessão
- Cancelamento e liberação de assentos

**Riscos:**
- Conflitos de reserva simultânea
- Inconsistências de estado
- Problemas de autorização
- Erros de cálculo de preços

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Criar reserva com assentos disponíveis | Usuário logado, sessão com assentos livres | Enviar POST /api/reservations com assentos válidos | Reserva criada, status 201, assentos marcados como ocupados | {session: "session_id", seats: [{row: "A", number: 1, type: "full"}], paymentMethod: "credit_card"} |
| TC02 | Criar reserva com assento já ocupado | Usuário logado, assento já reservado | Enviar POST /api/reservations com assento ocupado | Erro 400, mensagem indicando assento indisponível | {session: "session_id", seats: [{row: "A", number: 1, type: "full"}]} |
| TC03 | Criar reserva sem autenticação | Usuário não logado | Enviar POST /api/reservations | Erro 401, não autorizado | Dados válidos de reserva |
| TC04 | Criar reserva para sessão inexistente | Usuário logado | Enviar POST /api/reservations com session_id inválido | Erro 404, mensagem "Session not found" | {session: "invalid_id"} |
| TC05 | Calcular preço corretamente (full + half) | Usuário logado, sessão disponível | Criar reserva com 1 full (R$20) + 1 half (R$10) | Total_price = R$30, reserva criada | {seats: [{row: "A", number: 1, type: "full"}, {row: "A", number: 2, type: "half"}]} |
| TC06 | Listar reservas do usuário logado | Usuário com reservas existentes | Enviar GET /api/reservations/me | Lista de reservas do usuário, status 200 | N/A |
| TC07 | Listar todas as reservas (admin) | Admin logado, reservas no sistema | Enviar GET /api/reservations | Lista de todas as reservas, status 200 | N/A |
| TC08 | Listar todas as reservas (usuário comum) | User logado (não admin) | Enviar GET /api/reservations | Erro 403, acesso negado | N/A |
| TC09 | Buscar reserva própria por ID | Usuário logado, reserva própria | Enviar GET /api/reservations/{own_reservation_id} | Detalhes da reserva, status 200 | ID de reserva própria |
| TC10 | Buscar reserva de outro usuário | User logado, reserva de terceiro | Enviar GET /api/reservations/{other_user_reservation} | Erro 403, acesso negado | ID de reserva de outro usuário |
| TC11 | Buscar reserva inexistente | Usuário logado | Enviar GET /api/reservations/{invalid_id} | Erro 404, mensagem "Reservation not found" | ID inexistente |
| TC12 | Atualizar status de reserva (admin) | Admin logado, reserva existente | Enviar PUT /api/reservations/{id} com status="cancelled" | Status atualizado, assentos liberados | {status: "cancelled"} |
| TC13 | Atualizar status como usuário comum | User logado | Enviar PUT /api/reservations/{id} | Erro 403, acesso negado | {status: "confirmed"} |
| TC14 | Cancelar reserva (admin) | Admin logado, reserva confirmada | Enviar DELETE /api/reservations/{id} | Reserva removida, assentos liberados, status 200 | ID válido |
| TC15 | Cancelar reserva como usuário comum | User logado | Enviar DELETE /api/reservations/{id} | Erro 403, acesso negado | ID válido |
| TC16 | Criar reserva com array de assentos vazio | Usuário logado | Enviar POST /api/reservations com seats=[] | Erro 400, validação de assentos obrigatórios | {seats: []} |
| TC17 | Criar reserva com tipo de assento inválido | Usuário logado | Enviar POST /api/reservations com type inválido | Erro 400, validação do tipo de assento | {seats: [{row: "A", number: 1, type: "invalid"}]} |
| TC18 | Verificar liberação de assentos ao cancelar | Admin logado, reserva ativa | Cancelar reserva e verificar status dos assentos na sessão | Assentos voltam ao status "available" | Verificação de integração |
| TC19 | Criar reserva com método PIX | Usuário logado, sessão disponível | Enviar POST /api/reservations com paymentMethod="pix" | Reserva criada com método PIX, status 201 | {paymentMethod: "pix"} |
| TC20 | Criar reserva com método transferência | Usuário logado, sessão disponível | Enviar POST /api/reservations com paymentMethod="bank_transfer" | Reserva criada com método transferência, status 201 | {paymentMethod: "bank_transfer"} |
| TC21 | Criar reserva com método débito | Usuário logado, sessão disponível | Enviar POST /api/reservations com paymentMethod="debit_card" | Reserva criada com método débito, status 201 | {paymentMethod: "debit_card"} |
| TC22 | Criar reserva com método inválido | Usuário logado, sessão disponível | Enviar POST /api/reservations com método inválido | Erro 400, validação do método de pagamento | {paymentMethod: "invalid_method"} |
| TC23 | Verificar cálculo com 3 assentos mistos | Usuário logado, sessão disponível | Criar reserva com 2 full + 1 half (R$50) | Total_price = R$50, reserva criada | {seats: [{type: "full"}, {type: "full"}, {type: "half"}]} |
| TC24 | Atualizar status para cancelada e liberar assentos | Admin logado, reserva confirmada | Atualizar status para "cancelled" | Status atualizado, assentos liberados na sessão | {status: "cancelled"} |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Criação de reserva é funcionalidade principal |
| TC02 | Alta | Prevenção de conflitos de assentos é crítica |
| TC05 | Alta | Cálculo correto de preços é essencial |
| TC06 | Alta | Usuários devem ver suas próprias reservas |
| TC07 | Alta | Admins devem gerenciar todas as reservas |
| TC03 | Alta | Controle de acesso é crítico |
| TC12 | Alta | Gestão de status é importante para admins |
| TC18 | Alta | Integridade de dados na integração |
| TC19 | Média | Método PIX é comum no Brasil |
| TC20 | Média | Método transferência é importante |
| TC21 | Média | Método débito é comum |
| TC22 | Baixa | Validação específica de método |
| TC23 | Baixa | Cálculo específico com múltiplos assentos |
| TC24 | Alta | Gestão de status e liberação de assentos |
| TC08 | Média | Controle de acesso para listagem |
| TC09 | Média | Acesso a reservas próprias |
| TC10 | Média | Proteção de dados de terceiros |
| TC14 | Média | Funcionalidade de cancelamento |
| TC04 | Baixa | Validação de referências |
| TC11 | Baixa | Tratamento de erros |
| TC13 | Baixa | Controle de acesso para updates |
| TC15 | Baixa | Controle de acesso para exclusão |
| TC16 | Baixa | Validação específica de array vazio |
| TC17 | Baixa | Validação específica de tipo |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Conflitos de reserva simultânea | Alta | Alto | Alto | Testes de concorrência e validação de disponibilidade (TC02) |
| Erro no cálculo de preços | Baixa | Alto | Médio | Testes rigorosos de cálculo (TC05) |
| Inconsistência na liberação de assentos | Média | Alto | Alto | Testes de integração (TC12, TC18) |
| Acesso não autorizado a reservas | Baixa | Alto | Médio | Testes de controle de acesso (TC08, TC10, TC13, TC15) |
| Reservas com dados inválidos | Baixa | Médio | Baixo | Testes de validação (TC16, TC17) |
| Problemas de referência a sessões | Baixa | Médio | Baixo | Testes de validação de referências (TC04) |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de reservas serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada operação
- **Cobertura de Integração:** Validação da integração com sessões e usuários
- **Cobertura de Autorização:** Testes com diferentes roles para todas as operações
- **Cobertura de Cálculos:** Validação de todos os cenários de preços

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Criar reserva com assentos disponíveis | Fluxo principal e repetitivo | Postman/Newman |
| TC02 | Criar reserva com assento já ocupado | Validação crítica e repetitiva | Postman/Newman |
| TC05 | Calcular preço corretamente | Cálculo crítico para negócio | Postman/Newman |
| TC06 | Listar reservas do usuário logado | Funcionalidade básica repetitiva | Postman/Newman |
| TC07 | Listar todas as reservas (admin) | Funcionalidade administrativa repetitiva | Postman/Newman |
| TC12 | Atualizar status de reserva (admin) | Operação administrativa crítica | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de 100% dos endpoints de reservas
- Tempo de resposta < 2 segundos para criação de reservas
- Zero conflitos de assentos em testes de concorrência
- Cálculos de preço devem ser 100% precisos
- Controle de acesso deve bloquear operações não autorizadas

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/reservations
- **Banco de Dados:** MongoDB (com dados de teste consistentes)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Autenticação:** Tokens JWT para usuários admin e comum
- **Dados de Teste:** Sessões com assentos disponíveis, usuários válidos

## Dados de Teste Específicos

### Usuários de Teste:
- **Admin:** admin@example.com / password123
- **User 1:** user@example.com / password123
- **User 2:** user2@example.com / password123

### Sessão Modelo para Testes:
```json
{
  "_id": "session_test_id",
  "movie": "movie_id",
  "theater": "theater_id",
  "datetime": "2024-12-25T20:00:00.000Z",
  "fullPrice": 20,
  "halfPrice": 10,
  "seats": [
    {"row": "A", "number": 1, "status": "available"},
    {"row": "A", "number": 2, "status": "available"},
    {"row": "A", "number": 3, "status": "occupied"}
  ]
}
```

### Reserva Modelo para Testes:
```json
{
  "session": "session_test_id",
  "seats": [
    {"row": "A", "number": 1, "type": "full"},
    {"row": "A", "number": 2, "type": "half"}
  ],
  "paymentMethod": "credit_card"
}
```

### Cenários de Cálculo de Preços:
- **1 assento full:** R$ 20,00
- **1 assento half:** R$ 10,00
- **1 full + 1 half:** R$ 30,00
- **2 full:** R$ 40,00
- **3 half:** R$ 30,00

## Observações Especiais
- Testes de concorrência devem ser executados com múltiplas requisições simultâneas
- Verificar sempre o status dos assentos na sessão após operações de reserva/cancelamento
- Validar que o total_price é calculado automaticamente e não pode ser manipulado
- Confirmar que payment_status é definido como "completed" automaticamente (simulação)
- Testar diferentes métodos de pagamento disponíveis