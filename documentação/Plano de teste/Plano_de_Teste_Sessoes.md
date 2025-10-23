# Plano de Teste - API de Sessões do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de sessões do Cinema App, que implementa o CRUD completo para gerenciamento de sessões de cinema. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo criação de sessões com geração automática de assentos, controle de acesso por roles (admin para operações de escrita), funcionalidades de busca com filtros e integração com filmes e teatros.

## Objetivo
Garantir que a API de sessões funcione conforme os critérios de aceitação, validando:

- Implementação completa do CRUD (Criar, Ler, Atualizar, Deletar).
- Geração automática de assentos baseada na capacidade do teatro.
- Conformidade com as regras de validação de campos obrigatórios.
- Controle de acesso adequado (admin para criar/atualizar/deletar).
- Funcionalidades de busca por ID, filtros por filme, teatro e data.
- Funcionalidade de reset de assentos para administradores.
- Prevenção de ações inválidas, como operações em sessões inexistentes.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de sessões (`/api/sessions/*`).
- Validação dos campos MOVIE, THEATER, DATETIME, FULL_PRICE, HALF_PRICE, SEATS.
- Testes dos verbos HTTP: POST (criar), GET (listar/buscar), PUT (atualizar), DELETE (deletar).
- Validações de regras de negócio e campos obrigatórios.
- Testes de controle de acesso por roles (admin vs user).
- Funcionalidades de paginação e filtros (filme, teatro, data).
- Geração automática de assentos baseada no teatro.
- Funcionalidade de reset de assentos.
- Integração com modelos Movie e Theater.
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de segurança avançados, a menos que especificado.
- Testes de notificações sobre mudanças de sessão.

## Análise
A API de sessões gerencia as sessões de cinema com horários, preços e assentos, com as seguintes características:

**Endpoints principais:**
- `GET /api/sessions` (listar sessões com filtros e paginação)
- `GET /api/sessions/:id` (buscar sessão por ID)
- `POST /api/sessions` (criar sessão - admin only)
- `PUT /api/sessions/:id` (atualizar sessão - admin only)
- `DELETE /api/sessions/:id` (deletar sessão - admin only)
- `PUT /api/sessions/:id/reset-seats` (resetar assentos - admin only)

**Campos obrigatórios:**
- MOVIE (ObjectId, referência ao filme, obrigatório)
- THEATER (ObjectId, referência ao teatro, obrigatório)
- DATETIME (Date, data/hora da sessão, obrigatório)
- FULL_PRICE (Number, preço inteiro, obrigatório, ≥ 0)
- HALF_PRICE (Number, meia entrada, obrigatório, ≥ 0)
- SEATS (Array, gerado automaticamente baseado no teatro)

**Riscos identificados:**
- Falhas na validação de referências podem permitir sessões com filmes/teatros inexistentes.
- Problemas na geração de assentos podem resultar em capacidades incorretas.
- Falhas no controle de acesso podem permitir que usuários não-admin modifiquem sessões.
- Problemas de filtros podem retornar dados incorretos ou impactar performance.
- Operações em sessões inexistentes podem causar comportamentos indefinidos.
- Reset de assentos pode afetar reservas ativas.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como controle de acesso e integridade de dados
- **Teste Exploratório:** Identificação de cenários alternativos não cobertos pela documentação
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Integração:** Validação da integração com Movie e Theater
- **Teste de Autorização:** Validação de controle de acesso por roles

## Mapa Mental da Aplicação
O mapa mental da API de sessões inclui:

**Nó principal:** API de Sessões

**Endpoints:**
- GET /api/sessions (público)
- GET /api/sessions/:id (público)
- POST /api/sessions (admin)
- PUT /api/sessions/:id (admin)
- DELETE /api/sessions/:id (admin)
- PUT /api/sessions/:id/reset-seats (admin)

**Campos:**
- MOVIE (validação de existência)
- THEATER (validação de existência)
- DATETIME (validação de formato de data)
- FULL_PRICE (validação numérica, ≥ 0)
- HALF_PRICE (validação numérica, ≥ 0)
- SEATS (geração automática)

**Funcionalidades:**
- Paginação (page, limit)
- Filtro por filme (movie)
- Filtro por teatro (theater)
- Filtro por data (date)
- Geração automática de assentos
- Reset de assentos
- Ordenação por datetime

**Integrações:**
- Movie (populate de dados do filme)
- Theater (populate de dados do teatro, capacidade)

**Fluxos:**
- Listagem de sessões com filtros
- Busca de sessão específica
- Criação de sessão com geração de assentos
- Atualização de sessão existente
- Remoção de sessão
- Reset de status dos assentos

**Riscos:**
- Controle de acesso inadequado
- Validações de referências insuficientes
- Problemas na geração de assentos
- Inconsistências em filtros de data
- Impacto em reservas ao resetar assentos

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Listar sessões sem filtros | Sessões cadastradas no banco | Enviar GET /api/sessions | Lista de sessões retornada, status 200 | N/A |
| TC02 | Listar sessões com paginação | Mais de 10 sessões no banco | Enviar GET /api/sessions?page=2&limit=5 | 5 sessões da página 2, paginação correta | N/A |
| TC03 | Filtrar sessões por filme | Sessões de diferentes filmes | Enviar GET /api/sessions?movie={movie_id} | Apenas sessões do filme específico | movie_id válido |
| TC04 | Filtrar sessões por teatro | Sessões em diferentes teatros | Enviar GET /api/sessions?theater={theater_id} | Apenas sessões do teatro específico | theater_id válido |
| TC05 | Filtrar sessões por data | Sessões em diferentes datas | Enviar GET /api/sessions?date=2024-12-25 | Sessões apenas da data especificada | 2024-12-25 |
| TC06 | Buscar sessão por ID válido | Sessão específica existe | Enviar GET /api/sessions/{valid_id} | Sessão específica retornada com populate, status 200 | ID existente |
| TC07 | Buscar sessão por ID inexistente | Banco com outras sessões | Enviar GET /api/sessions/{invalid_id} | Erro 404, mensagem "Session not found" | ID inexistente |
| TC08 | Criar sessão com dados válidos (admin) | Admin autenticado, filme e teatro existem | Enviar POST /api/sessions com dados válidos | Sessão criada com assentos gerados, status 201 | {movie: "movie_id", theater: "theater_id", datetime: "2024-12-25T20:00:00Z", fullPrice: 25, halfPrice: 12.5} |
| TC09 | Criar sessão sem autenticação | Usuário não logado | Enviar POST /api/sessions com dados válidos | Erro 401, não autorizado | Dados válidos de sessão |
| TC10 | Criar sessão como usuário comum | User autenticado (não admin) | Enviar POST /api/sessions com dados válidos | Erro 403, acesso negado | Dados válidos de sessão |
| TC11 | Criar sessão com filme inexistente | Admin autenticado | Enviar POST /api/sessions com movie_id inválido | Erro 404, mensagem "Movie not found" | {movie: "invalid_id"} |
| TC12 | Criar sessão com teatro inexistente | Admin autenticado | Enviar POST /api/sessions com theater_id inválido | Erro 404, mensagem "Theater not found" | {theater: "invalid_id"} |
| TC13 | Criar sessão com dados inválidos | Admin autenticado | Enviar POST /api/sessions sem campos obrigatórios | Erro 400, mensagens de validação | {movie: "", theater: ""} |
| TC14 | Verificar geração automática de assentos | Admin, teatro com capacidade 120 | Criar sessão para teatro específico | Sessão criada com 120 assentos em formato A1, A2, B1, etc. | Teatro com capacity: 120 |
| TC15 | Atualizar sessão existente (admin) | Admin autenticado, sessão existe | Enviar PUT /api/sessions/{id} com novos dados | Sessão atualizada, status 200 | {fullPrice: 30, halfPrice: 15} |
| TC16 | Atualizar sessão inexistente (admin) | Admin autenticado | Enviar PUT /api/sessions/{invalid_id} | Erro 404, mensagem "Session not found" | ID inexistente |
| TC17 | Atualizar sessão como usuário comum | User autenticado | Enviar PUT /api/sessions/{id} | Erro 403, acesso negado | ID válido |
| TC18 | Tentar atualizar assentos diretamente | Admin autenticado | Enviar PUT /api/sessions/{id} com campo seats | Assentos ignorados, outros campos atualizados | {seats: [...], fullPrice: 30} |
| TC19 | Deletar sessão existente (admin) | Admin autenticado, sessão existe | Enviar DELETE /api/sessions/{id} | Sessão removida, status 200 | ID existente |
| TC20 | Deletar sessão inexistente (admin) | Admin autenticado | Enviar DELETE /api/sessions/{invalid_id} | Erro 404, mensagem "Session not found" | ID inexistente |
| TC21 | Deletar sessão como usuário comum | User autenticado | Enviar DELETE /api/sessions/{id} | Erro 403, acesso negado | ID válido |
| TC22 | Resetar assentos de sessão (admin) | Admin autenticado, sessão com assentos ocupados | Enviar PUT /api/sessions/{id}/reset-seats | Todos assentos resetados para "available", status 200 | ID de sessão com assentos ocupados |
| TC23 | Resetar assentos de sessão inexistente | Admin autenticado | Enviar PUT /api/sessions/{invalid_id}/reset-seats | Erro 404, mensagem "Session not found" | ID inexistente |
| TC24 | Resetar assentos como usuário comum | User autenticado | Enviar PUT /api/sessions/{id}/reset-seats | Erro 403, acesso negado | ID válido |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Listagem é funcionalidade principal para usuários |
| TC06 | Alta | Busca por ID é crítica para visualização de detalhes |
| TC08 | Alta | Criação de sessões é funcionalidade admin essencial |
| TC09 | Alta | Controle de acesso é crítico para segurança |
| TC10 | Alta | Controle de roles é essencial |
| TC14 | Alta | Geração de assentos é funcionalidade crítica |
| TC15 | Alta | Atualização é funcionalidade admin importante |
| TC19 | Alta | Remoção é funcionalidade admin importante |
| TC22 | Alta | Reset de assentos é funcionalidade específica importante |
| TC11 | Média | Validação de referências é importante |
| TC12 | Média | Validação de referências é importante |
| TC07 | Média | Tratamento de erros é importante |
| TC13 | Média | Validações de dados são importantes |
| TC17 | Média | Controle de acesso para atualização |
| TC21 | Média | Controle de acesso para remoção |
| TC24 | Média | Controle de acesso para reset |
| TC02 | Baixa | Paginação é funcionalidade auxiliar |
| TC03 | Baixa | Filtros são funcionalidades auxiliares |
| TC04 | Baixa | Filtros são funcionalidades auxiliares |
| TC05 | Baixa | Filtros são funcionalidades auxiliares |
| TC16 | Baixa | Cenário de erro específico |
| TC18 | Baixa | Validação específica de proteção de assentos |
| TC20 | Baixa | Cenário de erro específico |
| TC23 | Baixa | Cenário de erro específico |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Controle de acesso inadequado | Média | Alto | Alto | Testes rigorosos de autorização (TC09, TC10, TC17, TC21, TC24) |
| Falha na geração de assentos | Baixa | Alto | Médio | Testes específicos de geração (TC14) |
| Validação de referências inadequada | Média | Médio | Médio | Testes de filme/teatro inexistentes (TC11, TC12) |
| Problemas de performance na listagem | Média | Médio | Médio | Testes de paginação e filtros (TC02, TC03, TC04, TC05) |
| Reset de assentos afetando reservas | Baixa | Alto | Médio | Testes de reset (TC22) |
| Falha na validação de dados | Baixa | Médio | Baixo | Testes de campos obrigatórios (TC13) |
| Operações em sessões inexistentes | Baixa | Baixo | Baixo | Testes de cenários de erro (TC16, TC20, TC23) |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de sessões serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada operação CRUD
- **Cobertura de Autorização:** Testes com diferentes roles para operações protegidas
- **Cobertura de Validação:** Todos os campos obrigatórios e regras de negócio
- **Cobertura de Integração:** Validação da integração com Movie e Theater

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Listar sessões sem filtros | Teste base e repetitivo | Postman/Newman |
| TC06 | Buscar sessão por ID válido | Teste repetitivo e crítico | Postman/Newman |
| TC08 | Criar sessão com dados válidos (admin) | Operação CRUD fundamental | Postman/Newman |
| TC09 | Criar sessão sem autenticação | Validação de segurança repetitiva | Postman/Newman |
| TC10 | Criar sessão como usuário comum | Validação de roles repetitiva | Postman/Newman |
| TC14 | Verificar geração automática de assentos | Funcionalidade crítica específica | Postman/Newman |
| TC15 | Atualizar sessão existente (admin) | Operação CRUD fundamental | Postman/Newman |
| TC22 | Resetar assentos de sessão (admin) | Funcionalidade específica importante | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de 100% dos endpoints de sessões
- Tempo de resposta < 3 segundos para listagem com filtros
- Geração de assentos deve corresponder exatamente à capacidade do teatro
- Controle de acesso deve bloquear operações não autorizadas
- Validações devem impedir criação de sessões com referências inválidas

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/sessions
- **Banco de Dados:** MongoDB (com dados de teste consistentes)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Autenticação:** Tokens JWT para usuários admin e comum
- **Dados de Teste:** Filmes e teatros válidos para criação de sessões

## Dados de Teste Específicos

### Usuários de Teste:
- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

### Sessão Modelo para Testes:
```json
{
  "movie": "675f1a2b3c4d5e6f7a8b9c0d",
  "theater": "675f1a2b3c4d5e6f7a8b9c0e", 
  "datetime": "2024-12-25T20:00:00.000Z",
  "fullPrice": 25,
  "halfPrice": 12.5
}
```

### Teatro de Teste (capacidade 120):
```json
{
  "_id": "675f1a2b3c4d5e6f7a8b9c0e",
  "name": "Theater Test",
  "capacity": 120,
  "type": "standard"
}
```

### Filme de Teste:
```json
{
  "_id": "675f1a2b3c4d5e6f7a8b9c0d",
  "title": "Test Movie",
  "duration": 120,
  "poster": "test-poster.jpg"
}
```

### Dados Inválidos para Testes:
```json
{
  "movie": "",
  "theater": "",
  "datetime": "data-inválida",
  "fullPrice": -10,
  "halfPrice": -5
}
```

### Filtros de Teste:
- **Por filme:** `/api/sessions?movie=675f1a2b3c4d5e6f7a8b9c0d`
- **Por teatro:** `/api/sessions?theater=675f1a2b3c4d5e6f7a8b9c0e`
- **Por data:** `/api/sessions?date=2024-12-25`
- **Combinado:** `/api/sessions?movie=675f1a2b3c4d5e6f7a8b9c0d&date=2024-12-25`

## Observações Especiais
- Verificar sempre que a geração de assentos corresponde à capacidade do teatro
- Testar a funcionalidade de reset de assentos com cuidado, pois pode afetar reservas
- Validar que filtros de data funcionam corretamente com diferentes fusos horários
- Confirmar que populate de movie e theater retorna os dados corretos
- Testar a proteção contra atualização direta do campo seats