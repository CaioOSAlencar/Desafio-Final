# Plano de Teste - API de Teatros do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de teatros do Cinema App, que implementa o CRUD completo para gerenciamento de salas de cinema. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo validações de dados obrigatórios, controle de acesso por roles (admin para operações de escrita), unicidade de nomes de teatros e diferentes tipos de salas (standard, 3D, IMAX, VIP).

## Objetivo
Garantir que a API de teatros funcione conforme os critérios de aceitação, validando:

- Implementação completa do CRUD (Criar, Ler, Atualizar, Deletar).
- Conformidade com as regras de validação de campos obrigatórios.
- Validação de unicidade do nome do teatro.
- Controle de acesso adequado (admin para criar/atualizar/deletar).
- Suporte aos diferentes tipos de teatro (standard, 3D, IMAX, VIP).
- Validação de capacidade mínima (≥ 1).
- Prevenção de ações inválidas, como operações em teatros inexistentes.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de teatros (`/api/theaters/*`).
- Validação dos campos NAME, CAPACITY, TYPE.
- Testes dos verbos HTTP: POST (criar), GET (listar/buscar), PUT (atualizar), DELETE (deletar).
- Validações de regras de negócio, como unicidade de nome e capacidade mínima.
- Testes de controle de acesso por roles (admin vs user).
- Validação dos tipos de teatro permitidos.
- Virtual populate de sessões relacionadas.
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de segurança avançados, a menos que especificado.
- Testes de layout físico das salas.

## Análise
A API de teatros gerencia as salas de cinema do sistema, com as seguintes características:

**Endpoints principais:**
- `GET /api/theaters` (listar todos os teatros)
- `GET /api/theaters/:id` (buscar teatro por ID com sessões)
- `POST /api/theaters` (criar teatro - admin only)
- `PUT /api/theaters/:id` (atualizar teatro - admin only)
- `DELETE /api/theaters/:id` (deletar teatro - admin only)

**Campos obrigatórios:**
- NAME (string, obrigatório, único, trim)
- CAPACITY (number, obrigatório, ≥ 1)
- TYPE (enum: 'standard'/'3D'/'IMAX'/'VIP', padrão: 'standard')

**Riscos identificados:**
- Falhas na validação de unicidade podem permitir teatros com nomes duplicados.
- Problemas na validação de capacidade podem permitir valores inválidos.
- Falhas no controle de acesso podem permitir que usuários não-admin modifiquem teatros.
- Exclusão de teatros com sessões ativas pode causar inconsistências.
- Operações em teatros inexistentes podem causar comportamentos indefinidos.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como controle de acesso e validações
- **Teste Exploratório:** Identificação de cenários alternativos não cobertos pela documentação
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Validação de Dados:** Verificação de regras de unicidade, capacidade e tipos
- **Teste de Autorização:** Validação de controle de acesso por roles

## Mapa Mental da Aplicação
O mapa mental da API de teatros inclui:

**Nó principal:** API de Teatros

**Endpoints:**
- GET /api/theaters (público)
- GET /api/theaters/:id (público)
- POST /api/theaters (admin)
- PUT /api/theaters/:id (admin)
- DELETE /api/theaters/:id (admin)

**Campos:**
- NAME (validação de presença e unicidade)
- CAPACITY (validação numérica ≥ 1)
- TYPE (validação de enum)

**Funcionalidades:**
- Listagem simples (sem paginação)
- Busca por ID com populate de sessões
- CRUD completo para admins

**Integrações:**
- Session (virtual populate)

**Fluxos:**
- Listagem de teatros disponíveis
- Busca de teatro específico com sessões
- Criação de teatro por admin
- Atualização de teatro existente
- Remoção de teatro

**Riscos:**
- Controle de acesso inadequado
- Validações de unicidade insuficientes
- Problemas com capacidade inválida
- Inconsistências ao deletar teatros

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Listar todos os teatros | Teatros cadastrados no banco | Enviar GET /api/theaters | Lista de teatros retornada, status 200 | N/A |
| TC02 | Listar teatros com banco vazio | Banco de dados sem teatros | Enviar GET /api/theaters | Lista vazia retornada, count=0, status 200 | N/A |
| TC03 | Buscar teatro por ID válido | Teatro específico existe | Enviar GET /api/theaters/{valid_id} | Teatro específico retornado com sessões, status 200 | ID existente |
| TC04 | Buscar teatro por ID inexistente | Banco com outros teatros | Enviar GET /api/theaters/{invalid_id} | Erro 404, mensagem "Theater not found" | ID inexistente |
| TC05 | Criar teatro com dados válidos (admin) | Admin autenticado | Enviar POST /api/theaters com dados válidos | Teatro criado, status 201 | {name: "Theater A", capacity: 150, type: "IMAX"} |
| TC06 | Criar teatro sem autenticação | Usuário não logado | Enviar POST /api/theaters com dados válidos | Erro 401, não autorizado | Dados válidos de teatro |
| TC07 | Criar teatro como usuário comum | User autenticado (não admin) | Enviar POST /api/theaters com dados válidos | Erro 403, acesso negado | Dados válidos de teatro |
| TC08 | Criar teatro com nome duplicado | Admin autenticado, teatro com mesmo nome existe | Enviar POST /api/theaters com nome existente | Erro 400, mensagem de unicidade | {name: "Theater Existente"} |
| TC09 | Criar teatro com dados inválidos | Admin autenticado | Enviar POST /api/theaters sem campos obrigatórios | Erro 400, mensagens de validação | {name: "", capacity: ""} |
| TC10 | Criar teatro com capacidade zero | Admin autenticado | Enviar POST /api/theaters com capacity=0 | Erro 400, mensagem "Capacity must be at least 1" | {capacity: 0} |
| TC11 | Criar teatro com capacidade negativa | Admin autenticado | Enviar POST /api/theaters com capacity negativa | Erro 400, mensagem "Capacity must be at least 1" | {capacity: -5} |
| TC12 | Criar teatro com tipo inválido | Admin autenticado | Enviar POST /api/theaters com type inválido | Erro 400, mensagem de enum | {type: "invalid_type"} |
| TC13 | Criar teatro tipo standard (padrão) | Admin autenticado | Enviar POST /api/theaters sem especificar type | Teatro criado com type="standard", status 201 | {name: "Theater B", capacity: 100} |
| TC14 | Criar theater com todos os tipos válidos | Admin autenticado | Criar teatros para cada tipo (standard, 3D, IMAX, VIP) | Todos os teatros criados com tipos corretos | 4 teatros diferentes |
| TC15 | Atualizar teatro existente (admin) | Admin autenticado, teatro existe | Enviar PUT /api/theaters/{id} com novos dados | Teatro atualizado, status 200 | {name: "Theater Updated", capacity: 200} |
| TC16 | Atualizar teatro para nome duplicado | Admin autenticado, outro teatro com nome existe | Enviar PUT /api/theaters/{id} com nome existente | Erro 400, mensagem de unicidade | {name: "Nome Existente"} |
| TC17 | Atualizar teatro inexistente (admin) | Admin autenticado | Enviar PUT /api/theaters/{invalid_id} | Erro 404, mensagem "Theater not found" | ID inexistente |
| TC18 | Atualizar teatro como usuário comum | User autenticado | Enviar PUT /api/theaters/{id} | Erro 403, acesso negado | ID válido |
| TC19 | Deletar teatro existente (admin) | Admin autenticado, teatro existe | Enviar DELETE /api/theaters/{id} | Teatro removido, status 200 | ID existente |
| TC20 | Deletar teatro inexistente (admin) | Admin autenticado | Enviar DELETE /api/theaters/{invalid_id} | Erro 404, mensagem "Theater not found" | ID inexistente |
| TC21 | Deletar teatro como usuário comum | User autenticado | Enviar DELETE /api/theaters/{id} | Erro 403, acesso negado | ID válido |
| TC22 | Verificar trim em nome do teatro | Admin autenticado | Criar teatro com espaços no nome | Nome salvo sem espaços extras | {name: "  Theater Test  "} |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Listagem é funcionalidade principal para usuários |
| TC03 | Alta | Busca por ID é crítica para visualização de detalhes |
| TC05 | Alta | Criação de teatros é funcionalidade admin essencial |
| TC06 | Alta | Controle de acesso é crítico para segurança |
| TC07 | Alta | Controle de roles é essencial |
| TC08 | Alta | Validação de unicidade é crítica para integridade |
| TC15 | Alta | Atualização é funcionalidade admin importante |
| TC19 | Alta | Remoção é funcionalidade admin importante |
| TC09 | Média | Validações de dados são importantes |
| TC10 | Média | Validação de capacidade é importante |
| TC16 | Média | Validação de unicidade em atualização |
| TC04 | Média | Tratamento de erros é importante |
| TC18 | Média | Controle de acesso para atualização |
| TC21 | Média | Controle de acesso para remoção |
| TC11 | Baixa | Validação específica de capacidade negativa |
| TC12 | Baixa | Validação específica de tipo |
| TC13 | Baixa | Verificação de valor padrão |
| TC14 | Baixa | Validação de todos os tipos |
| TC17 | Baixa | Cenário de erro específico |
| TC20 | Baixa | Cenário de erro específico |
| TC02 | Baixa | Cenário de banco vazio |
| TC22 | Baixa | Validação específica de trim |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Controle de acesso inadequado | Média | Alto | Alto | Testes rigorosos de autorização (TC06, TC07, TC18, TC21) |
| Falha na validação de unicidade | Baixa | Alto | Médio | Testes de nomes duplicados (TC08, TC16) |
| Falha na validação de capacidade | Baixa | Médio | Baixo | Testes de capacidade inválida (TC10, TC11) |
| Problemas com tipos de teatro | Baixa | Baixo | Baixo | Testes de tipos válidos/inválidos (TC12, TC14) |
| Operações em teatros inexistentes | Baixa | Baixo | Baixo | Testes de cenários de erro (TC17, TC20) |
| Inconsistências ao deletar teatros | Baixa | Alto | Médio | Verificação manual de impacto em sessões |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de teatros serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada operação CRUD
- **Cobertura de Autorização:** Testes com diferentes roles para operações protegidas
- **Cobertura de Validação:** Todos os campos obrigatórios e regras de negócio
- **Cobertura de Tipos:** Todos os tipos de teatro permitidos

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Listar todos os teatros | Teste base e repetitivo | Postman/Newman |
| TC03 | Buscar teatro por ID válido | Teste repetitivo e crítico | Postman/Newman |
| TC05 | Criar teatro com dados válidos (admin) | Operação CRUD fundamental | Postman/Newman |
| TC06 | Criar teatro sem autenticação | Validação de segurança repetitiva | Postman/Newman |
| TC07 | Criar teatro como usuário comum | Validação de roles repetitiva | Postman/Newman |
| TC08 | Criar teatro com nome duplicado | Validação crítica e repetitiva | Postman/Newman |
| TC15 | Atualizar teatro existente (admin) | Operação CRUD fundamental | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de 100% dos endpoints de teatros
- Tempo de resposta < 2 segundos para operações CRUD
- Validação de unicidade deve impedir nomes duplicados
- Controle de acesso deve bloquear operações não autorizadas
- Validações devem impedir criação de teatros com dados inválidos

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/theaters
- **Banco de Dados:** MongoDB (com dados de teste consistentes)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Autenticação:** Tokens JWT para usuários admin e comum
- **Dados de Teste:** Teatros variados para diferentes cenários

## Dados de Teste Específicos

### Usuários de Teste:
- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

### Teatro Modelo para Testes:
```json
{
  "name": "Theater Premium",
  "capacity": 150,
  "type": "IMAX"
}
```

### Teatros para Teste de Tipos:
```json
[
  {"name": "Standard Theater", "capacity": 100, "type": "standard"},
  {"name": "3D Theater", "capacity": 120, "type": "3D"},
  {"name": "IMAX Theater", "capacity": 200, "type": "IMAX"},
  {"name": "VIP Theater", "capacity": 50, "type": "VIP"}
]
```

### Dados Inválidos para Testes:
```json
[
  {"name": "", "capacity": 100, "type": "standard"},
  {"name": "Test Theater", "capacity": 0, "type": "standard"},
  {"name": "Test Theater", "capacity": -5, "type": "standard"},
  {"name": "Test Theater", "capacity": 100, "type": "invalid_type"}
]
```

### Cenários de Unicidade:
- **Teatro 1:** `{name: "Unique Theater", capacity: 100}`
- **Teatro Duplicado:** `{name: "Unique Theater", capacity: 150}` (deve falhar)

## Observações Especiais
- Verificar sempre que o campo `name` está sendo tratado com trim
- Testar todos os tipos de teatro disponíveis (standard, 3D, IMAX, VIP)
- Validar que a capacidade mínima é sempre 1
- Confirmar que o tipo padrão é "standard" quando não especificado
- Verificar o populate correto de sessões na busca por ID
- Considerar o impacto da exclusão de teatros em sessões existentes