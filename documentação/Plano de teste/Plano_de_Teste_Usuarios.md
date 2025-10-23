# Plano de Teste - API de Usuários do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de usuários do Cinema App, que implementa funcionalidades administrativas para gerenciamento de usuários do sistema. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo controle de acesso restrito a administradores, validações de dados, atualização de roles e proteção de informações sensíveis como senhas.

## Objetivo
Garantir que a API de usuários funcione conforme os critérios de aceitação, validando:

- Implementação das operações administrativas (Listar, Buscar, Atualizar, Deletar).
- Controle de acesso restrito exclusivamente a administradores.
- Conformidade com as regras de validação de dados e unicidade de email.
- Proteção adequada de informações sensíveis (exclusão de senhas nas respostas).
- Capacidade de atualização de roles de usuários.
- Prevenção de ações inválidas, como operações em usuários inexistentes.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de usuários (`/api/users/*`).
- Validação dos campos NAME, EMAIL, ROLE, PASSWORD (quando aplicável).
- Testes dos verbos HTTP: GET (listar/buscar), PUT (atualizar), DELETE (deletar).
- Validações de regras de negócio, como unicidade de email e roles válidos.
- Testes de controle de acesso exclusivo para administradores.
- Verificação de proteção de senhas nas respostas.
- Atualização de roles de usuários (user ↔ admin).
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de criação de usuários (coberto pela API de autenticação).
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de segurança avançados, a menos que especificado.
- Testes de notificações por email.

## Análise
A API de usuários oferece funcionalidades administrativas para gerenciar usuários do sistema, com as seguintes características:

**Endpoints principais:**
- `GET /api/users` (listar todos os usuários - admin only)
- `GET /api/users/:id` (buscar usuário por ID - admin only)
- `PUT /api/users/:id` (atualizar usuário - admin only)
- `DELETE /api/users/:id` (deletar usuário - admin only)

**Campos gerenciáveis:**
- NAME (string, obrigatório no modelo)
- EMAIL (string, formato válido, único)
- ROLE (enum: 'user'/'admin')
- PASSWORD (string, opcional na atualização, criptografado)

**Riscos identificados:**
- Acesso não autorizado pode expor dados sensíveis de usuários.
- Falhas na validação de unicidade podem permitir emails duplicados.
- Problemas na atualização de senhas podem comprometer segurança.
- Exposição de senhas nas respostas pode criar vulnerabilidades.
- Operações em usuários inexistentes podem causar comportamentos indefinidos.
- Alteração inadequada de roles pode comprometer segurança do sistema.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como controle de acesso e segurança
- **Teste Exploratório:** Identificação de cenários alternativos não cobertos pela documentação
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Segurança Básica:** Validação de proteção de senhas e controle de acesso
- **Teste de Autorização:** Validação de acesso exclusivo para administradores

## Mapa Mental da Aplicação
O mapa mental da API de usuários inclui:

**Nó principal:** API de Usuários (Admin Only)

**Endpoints:**
- GET /api/users (admin only)
- GET /api/users/:id (admin only)
- PUT /api/users/:id (admin only)
- DELETE /api/users/:id (admin only)

**Campos:**
- NAME (validação de presença)
- EMAIL (validação de formato e unicidade)
- ROLE (validação de enum user/admin)
- PASSWORD (criptografia, opcional em updates)

**Funcionalidades:**
- Listagem completa de usuários
- Busca por ID específico
- Atualização de dados e roles
- Remoção de usuários
- Proteção de senhas nas respostas

**Segurança:**
- Acesso restrito a admins
- Exclusão de senhas nas respostas
- Validação de roles

**Fluxos:**
- Listagem de usuários do sistema
- Busca de usuário específico
- Atualização de dados/roles por admin
- Remoção de usuário por admin

**Riscos:**
- Controle de acesso inadequado
- Exposição de dados sensíveis
- Validações de unicidade insuficientes
- Problemas na atualização de roles

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Listar todos os usuários (admin) | Admin autenticado, usuários no banco | Enviar GET /api/users | Lista de usuários sem senhas, status 200 | N/A |
| TC02 | Listar usuários sem autenticação | Usuário não logado | Enviar GET /api/users | Erro 401, não autorizado | N/A |
| TC03 | Listar usuários como user comum | User autenticado (não admin) | Enviar GET /api/users | Erro 403, acesso negado | N/A |
| TC04 | Verificar exclusão de senhas na listagem | Admin autenticado | Enviar GET /api/users | Resposta não contém campo password | N/A |
| TC05 | Buscar usuário por ID válido (admin) | Admin autenticado, usuário específico existe | Enviar GET /api/users/{valid_id} | Usuário específico retornado sem senha, status 200 | ID existente |
| TC06 | Buscar usuário por ID inexistente (admin) | Admin autenticado | Enviar GET /api/users/{invalid_id} | Erro 404, mensagem "User not found" | ID inexistente |
| TC07 | Buscar usuário como user comum | User autenticado | Enviar GET /api/users/{id} | Erro 403, acesso negado | ID válido |
| TC08 | Atualizar dados básicos do usuário (admin) | Admin autenticado, usuário existe | Enviar PUT /api/users/{id} com novos dados | Usuário atualizado sem senha na resposta, status 200 | {name: "Nome Atualizado", email: "novo@email.com"} |
| TC09 | Atualizar role de user para admin | Admin autenticado, usuário com role "user" | Enviar PUT /api/users/{id} com role="admin" | Role atualizado para admin, status 200 | {role: "admin"} |
| TC10 | Atualizar role de admin para user | Admin autenticado, usuário com role "admin" | Enviar PUT /api/users/{id} com role="user" | Role atualizado para user, status 200 | {role: "user"} |
| TC11 | Atualizar senha do usuário | Admin autenticado, usuário existe | Enviar PUT /api/users/{id} com nova senha | Senha atualizada e criptografada, resposta sem senha | {password: "newpassword123"} |
| TC12 | Atualizar usuário para email duplicado | Admin autenticado, outro usuário com email existe | Enviar PUT /api/users/{id} com email existente | Erro 400, mensagem de unicidade | {email: "email@existente.com"} |
| TC13 | Atualizar usuário inexistente (admin) | Admin autenticado | Enviar PUT /api/users/{invalid_id} | Erro 404, mensagem "User not found" | ID inexistente |
| TC14 | Atualizar usuário como user comum | User autenticado | Enviar PUT /api/users/{id} | Erro 403, acesso negado | ID válido |
| TC15 | Atualizar com role inválido | Admin autenticado | Enviar PUT /api/users/{id} com role inválido | Erro 400, validação de enum | {role: "invalid_role"} |
| TC16 | Deletar usuário existente (admin) | Admin autenticado, usuário existe | Enviar DELETE /api/users/{id} | Usuário removido, status 200 | ID existente |
| TC17 | Deletar usuário inexistente (admin) | Admin autenticado | Enviar DELETE /api/users/{invalid_id} | Erro 404, mensagem "User not found" | ID inexistente |
| TC18 | Deletar usuário como user comum | User autenticado | Enviar DELETE /api/users/{id} | Erro 403, acesso negado | ID válido |
| TC19 | Atualizar apenas campos específicos | Admin autenticado, usuário existe | Enviar PUT /api/users/{id} apenas com name | Apenas name atualizado, outros campos inalterados | {name: "Novo Nome"} |
| TC20 | Verificar criptografia da senha atualizada | Admin autenticado, usuário existe | Atualizar senha e verificar no banco | Senha armazenada como hash bcrypt | {password: "senha123"} |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Listagem é funcionalidade principal para admins |
| TC02 | Alta | Controle de acesso é crítico para segurança |
| TC03 | Alta | Controle de roles é essencial |
| TC04 | Alta | Proteção de senhas é crítica para segurança |
| TC05 | Alta | Busca por ID é funcionalidade importante |
| TC08 | Alta | Atualização é funcionalidade admin essencial |
| TC09 | Alta | Mudança de roles é funcionalidade crítica |
| TC16 | Alta | Remoção é funcionalidade admin importante |
| TC07 | Média | Controle de acesso para busca |
| TC11 | Média | Atualização de senha é importante |
| TC12 | Média | Validação de unicidade é importante |
| TC14 | Média | Controle de acesso para atualização |
| TC18 | Média | Controle de acesso para remoção |
| TC06 | Baixa | Tratamento de erros |
| TC10 | Baixa | Cenário específico de downgrade |
| TC13 | Baixa | Cenário de erro específico |
| TC15 | Baixa | Validação específica de role |
| TC17 | Baixa | Cenário de erro específico |
| TC19 | Baixa | Funcionalidade específica de update parcial |
| TC20 | Baixa | Verificação técnica de criptografia |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Acesso não autorizado a dados de usuários | Média | Alto | Alto | Testes rigorosos de autorização (TC02, TC03, TC07, TC14, TC18) |
| Exposição de senhas | Baixa | Alto | Médio | Testes de proteção de senhas (TC04, TC20) |
| Falha na validação de unicidade | Baixa | Médio | Baixo | Testes de email duplicado (TC12) |
| Alteração inadequada de roles | Baixa | Alto | Médio | Testes de mudança de roles (TC09, TC10, TC15) |
| Operações em usuários inexistentes | Baixa | Baixo | Baixo | Testes de cenários de erro (TC13, TC17) |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de usuários serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada operação
- **Cobertura de Autorização:** Testes rigorosos de acesso exclusivo para admins
- **Cobertura de Segurança:** Validação de proteção de senhas e dados sensíveis
- **Cobertura de Validação:** Todos os campos e regras de negócio

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Listar todos os usuários (admin) | Teste base e repetitivo | Postman/Newman |
| TC02 | Listar usuários sem autenticação | Validação de segurança crítica | Postman/Newman |
| TC03 | Listar usuários como user comum | Validação de roles crítica | Postman/Newman |
| TC04 | Verificar exclusão de senhas na listagem | Validação de segurança crítica | Postman/Newman |
| TC05 | Buscar usuário por ID válido (admin) | Teste repetitivo e importante | Postman/Newman |
| TC08 | Atualizar dados básicos do usuário | Operação fundamental | Postman/Newman |
| TC16 | Deletar usuário existente (admin) | Operação fundamental | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de 100% dos endpoints de usuários
- Tempo de resposta < 2 segundos para operações CRUD
- Zero exposição de senhas nas respostas da API
- Controle de acesso deve bloquear 100% dos usuários não-admin
- Validações devem impedir atualizações com dados inválidos

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/users
- **Banco de Dados:** MongoDB (com usuários de teste pré-cadastrados)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Autenticação:** Tokens JWT para usuários admin e comum
- **Dados de Teste:** Usuários com diferentes roles para cenários diversos

## Dados de Teste Específicos

### Usuários de Teste:
- **Admin:** admin@example.com / password123
- **User 1:** user@example.com / password123
- **User 2:** user2@example.com / password123

### Usuário Modelo para Atualização:
```json
{
  "name": "Usuário Atualizado",
  "email": "updated@example.com",
  "role": "admin"
}
```

### Dados para Teste de Roles:
```json
[
  {"role": "user"},
  {"role": "admin"},
  {"role": "invalid_role"}
]
```

### Dados para Teste de Senhas:
```json
{
  "password": "newpassword123"
}
```

### Cenários de Unicidade:
- **Email existente:** user@example.com
- **Email novo:** novoemail@example.com

## Observações Especiais
- Verificar sempre que senhas não aparecem nas respostas da API
- Confirmar que senhas são criptografadas com bcrypt no banco
- Testar mudanças de role em ambas as direções (user→admin, admin→user)
- Validar que updates parciais funcionam corretamente
- Verificar que apenas campos fornecidos são atualizados
- Confirmar que validações de unicidade funcionam em atualizações
- Monitorar o impacto da exclusão de usuários em dados relacionados (reservas)