# Plano de Teste - API de Filmes do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de filmes do Cinema App, que implementa o CRUD completo (Create, Read, Update, Delete) para gerenciamento de filmes no sistema de cinema. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo validações de dados obrigatórios, controle de acesso por roles (admin para operações de escrita) e funcionalidades de busca e paginação.

## Objetivo
Garantir que a API de filmes funcione conforme os critérios de aceitação, validando:

- Implementação completa do CRUD (Criar, Ler, Atualizar, Deletar).
- Conformidade com as regras de validação de campos obrigatórios.
- Controle de acesso adequado (admin para criar/atualizar/deletar).
- Funcionalidades de busca por ID, filtros por gênero e paginação.
- Prevenção de ações inválidas, como operações em filmes inexistentes.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de filmes (`/api/movies/*`).
- Validação dos campos TITLE, SYNOPSIS, DIRECTOR, GENRES, DURATION, CLASSIFICATION, POSTER, RELEASE_DATE.
- Testes dos verbos HTTP: POST (criar), GET (listar/buscar), PUT (atualizar), DELETE (deletar).
- Validações de regras de negócio e campos obrigatórios.
- Testes de controle de acesso por roles (admin vs user).
- Funcionalidades de paginação e filtros.
- Busca por ID (ObjectID e customId).
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de upload de imagens (poster).
- Testes de segurança avançados, a menos que especificado.

## Análise
A API de filmes gerencia o catálogo de filmes do cinema, com as seguintes características:

**Endpoints principais:**
- `GET /api/movies` (listar filmes com paginação e filtros)
- `GET /api/movies/:id` (buscar filme por ID)
- `POST /api/movies` (criar filme - admin only)
- `PUT /api/movies/:id` (atualizar filme - admin only)
- `DELETE /api/movies/:id` (deletar filme - admin only)

**Campos obrigatórios:**
- TITLE (string, obrigatório)
- SYNOPSIS (string, obrigatório)
- DIRECTOR (string, obrigatório)
- GENRES (array de strings, pelo menos um)
- DURATION (number, em minutos, obrigatório)
- CLASSIFICATION (string, obrigatório)
- RELEASE_DATE (date, obrigatório)
- POSTER (string, opcional, padrão: 'no-image.jpg')

**Riscos identificados:**
- Falhas na validação de campos obrigatórios podem permitir dados inconsistentes.
- Problemas de autorização podem permitir que usuários não-admin modifiquem filmes.
- Falhas na busca por ID podem retornar filmes incorretos.
- Problemas de paginação podem impactar performance ou retornar dados incorretos.
- Operações em filmes inexistentes podem causar comportamentos indefinidos.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como controle de acesso e validações
- **Teste Exploratório:** Identificação de cenários alternativos não cobertos pela documentação
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Validação de Dados:** Verificação de regras de campos obrigatórios e formatos
- **Teste de Autorização:** Validação de controle de acesso por roles

## Mapa Mental da Aplicação
O mapa mental da API de filmes inclui:

**Nó principal:** API de Filmes

**Endpoints:**
- GET /api/movies (público)
- GET /api/movies/:id (público)
- POST /api/movies (admin)
- PUT /api/movies/:id (admin)
- DELETE /api/movies/:id (admin)

**Campos:**
- TITLE (validação de presença)
- SYNOPSIS (validação de presença)
- DIRECTOR (validação de presença)
- GENRES (array, pelo menos um item)
- DURATION (number, positivo)
- CLASSIFICATION (string)
- POSTER (string, opcional)
- RELEASE_DATE (date válida)

**Funcionalidades:**
- Paginação (page, limit)
- Filtro por gênero
- Busca por ObjectID ou customId
- Ordenação por data de lançamento

**Fluxos:**
- Listagem de filmes com filtros
- Busca de filme específico
- Criação de filme por admin
- Atualização de filme existente
- Remoção de filme

**Riscos:**
- Controle de acesso inadequado
- Validações de dados insuficientes
- Problemas de performance em listagem
- Inconsistências em busca por ID

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Listar filmes sem autenticação | Filmes cadastrados no banco | Enviar GET /api/movies | Lista de filmes retornada, status 200 | N/A |
| TC02 | Listar filmes com paginação | Mais de 10 filmes no banco | Enviar GET /api/movies?page=2&limit=5 | 5 filmes da página 2, paginação correta | N/A |
| TC03 | Filtrar filmes por gênero | Filmes de diferentes gêneros | Enviar GET /api/movies?genre=Action | Apenas filmes de ação retornados | N/A |
| TC04 | Buscar filme por ID válido | Filme específico existe | Enviar GET /api/movies/{valid_id} | Filme específico retornado, status 200 | ID existente |
| TC05 | Buscar filme por ID inexistente | Banco com outros filmes | Enviar GET /api/movies/{invalid_id} | Erro 404, mensagem "Movie not found" | ID inexistente |
| TC06 | Criar filme com dados válidos (admin) | Admin autenticado | Enviar POST /api/movies com dados válidos | Filme criado, status 201 | {title: "Novo Filme", synopsis: "Sinopse", director: "Diretor", genres: ["Action"], duration: 120, classification: "PG-13", releaseDate: "2024-01-01"} |
| TC07 | Criar filme sem autenticação | Usuário não logado | Enviar POST /api/movies com dados válidos | Erro 401, não autorizado | Dados válidos de filme |
| TC08 | Criar filme como usuário comum | User autenticado (não admin) | Enviar POST /api/movies com dados válidos | Erro 403, acesso negado | Dados válidos de filme |
| TC09 | Criar filme com dados inválidos | Admin autenticado | Enviar POST /api/movies sem campos obrigatórios | Erro 400, mensagens de validação | {title: "", synopsis: ""} |
| TC10 | Atualizar filme existente (admin) | Admin autenticado, filme existe | Enviar PUT /api/movies/{id} com novos dados | Filme atualizado, status 200 | {title: "Título Atualizado"} |
| TC11 | Atualizar filme inexistente (admin) | Admin autenticado | Enviar PUT /api/movies/{invalid_id} | Erro 404, mensagem "Movie not found" | ID inexistente |
| TC12 | Atualizar filme como usuário comum | User autenticado | Enviar PUT /api/movies/{id} | Erro 403, acesso negado | ID válido |
| TC13 | Deletar filme existente (admin) | Admin autenticado, filme existe | Enviar DELETE /api/movies/{id} | Filme removido, status 200 | ID existente |
| TC14 | Deletar filme inexistente (admin) | Admin autenticado | Enviar DELETE /api/movies/{invalid_id} | Erro 404, mensagem "Movie not found" | ID inexistente |
| TC15 | Deletar filme como usuário comum | User autenticado | Enviar DELETE /api/movies/{id} | Erro 403, acesso negado | ID válido |
| TC16 | Criar filme com gêneros vazios | Admin autenticado | Enviar POST /api/movies com genres=[] | Erro 400, validação de gêneros | {genres: []} |
| TC17 | Criar filme com duração inválida | Admin autenticado | Enviar POST /api/movies com duration negativa | Erro 400, validação de duração | {duration: -10} |
| TC18 | Buscar filme por customId | Filme com customId existe | Enviar GET /api/movies/{customId} | Filme retornado via customId | customId específico |
| TC19 | Filtrar filmes por múltiplos gêneros | Filmes com gêneros variados | Enviar GET /api/movies?genre=Action&genre=Adventure | Filmes que contêm Action OU Adventure | Filtro com múltiplos valores |
| TC20 | Verificar ordenação por data de lançamento | Filmes com datas diferentes | Enviar GET /api/movies | Filmes ordenados por releaseDate (mais recente primeiro) | Verificar ordem da resposta |
| TC21 | Buscar filme com populate de sessões | Filme com sessões associadas | Enviar GET /api/movies/{id} | Filme retornado com array de sessões populadas | ID de filme com sessões |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Listagem é funcionalidade principal para usuários |
| TC04 | Alta | Busca por ID é crítica para navegação |
| TC06 | Alta | Criação de filmes é funcionalidade admin essencial |
| TC07 | Alta | Controle de acesso é crítico para segurança |
| TC08 | Alta | Controle de roles é essencial |
| TC10 | Alta | Atualização é funcionalidade admin importante |
| TC13 | Alta | Remoção é funcionalidade admin importante |
| TC05 | Média | Tratamento de erros é importante |
| TC09 | Média | Validações de dados são importantes |
| TC12 | Média | Controle de acesso para atualização |
| TC15 | Média | Controle de acesso para remoção |
| TC02 | Baixa | Paginação é funcionalidade auxiliar |
| TC03 | Baixa | Filtros são funcionalidades auxiliares |
| TC11 | Baixa | Cenário de erro específico |
| TC14 | Baixa | Cenário de erro específico |
| TC16 | Baixa | Validação específica de gêneros |
| TC17 | Baixa | Validação específica de duração |
| TC18 | Baixa | Funcionalidade específica de customId |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Controle de acesso inadequado | Média | Alto | Alto | Testes rigorosos de autorização (TC07, TC08, TC12, TC15) |
| Falha na validação de dados | Baixa | Médio | Médio | Testes de campos obrigatórios (TC09, TC16, TC17) |
| Problemas de performance na listagem | Média | Médio | Médio | Testes de paginação (TC02) |
| Busca por ID incorreta | Baixa | Alto | Médio | Testes de busca válida/inválida (TC04, TC05, TC18) |
| Operações em filmes inexistentes | Baixa | Baixo | Baixo | Testes de cenários de erro (TC11, TC14) |
| Problemas de filtros | Baixa | Baixo | Baixo | Testes de filtro por gênero (TC03) |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de filmes serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada operação CRUD
- **Cobertura de Autorização:** Testes com diferentes roles para operações protegidas
- **Cobertura de Validação:** Todos os campos obrigatórios e regras de negócio

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Listar filmes sem autenticação | Teste base e repetitivo | Postman/Newman |
| TC04 | Buscar filme por ID válido | Teste repetitivo e crítico | Postman/Newman |
| TC06 | Criar filme com dados válidos (admin) | Operação CRUD fundamental | Postman/Newman |
| TC07 | Criar filme sem autenticação | Validação de segurança repetitiva | Postman/Newman |
| TC08 | Criar filme como usuário comum | Validação de roles repetitiva | Postman/Newman |
| TC10 | Atualizar filme existente (admin) | Operação CRUD fundamental | Postman/Newman |
| TC13 | Deletar filme existente (admin) | Operação CRUD fundamental | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de 100% dos endpoints de filmes
- Tempo de resposta < 3 segundos para listagem com paginação
- Controle de acesso deve bloquear operações não autorizadas
- Validações devem impedir criação de filmes com dados inválidos

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/movies
- **Banco de Dados:** MongoDB (com dados de teste pré-carregados)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Autenticação:** Tokens JWT para usuários admin e comum
- **Dados de Teste:** Catálogo de filmes variados para diferentes cenários

## Dados de Teste Específicos

### Usuários de Teste:
- **Admin:** admin@example.com / password123
- **User:** user@example.com / password123

### Filme Modelo para Testes:
```json
{
  "title": "Filme de Teste",
  "synopsis": "Sinopse do filme de teste para validação da API",
  "director": "Diretor Teste",
  "genres": ["Action", "Adventure"],
  "duration": 120,
  "classification": "PG-13",
  "poster": "teste-poster.jpg",
  "releaseDate": "2024-01-15"
}
```

### Dados Inválidos para Testes:
```json
{
  "title": "",
  "synopsis": "",
  "genres": [],
  "duration": -10,
  "releaseDate": "data-inválida"
}
```