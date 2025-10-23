# Plano de Teste - API de Autenticação do Cinema App

## Apresentação
Este plano de teste é destinado à validação da API de autenticação do Cinema App, que implementa funcionalidades de registro, login e gerenciamento de perfil de usuários. A API será testada para garantir que atenda aos requisitos funcionais e não funcionais descritos, incluindo autenticação JWT, validações de email/senha e controle de acesso por roles. O sistema de cinema permite o cadastro de usuários comuns e administradores, com diferentes níveis de permissão.

## Objetivo
Garantir que a API de autenticação funcione conforme os critérios de aceitação, validando:

- Implementação completa do sistema de autenticação (Registro, Login, Perfil).
- Conformidade com as regras de validação de email e senha.
- Geração e validação correta de tokens JWT.
- Controle de acesso baseado em roles (user/admin).
- Prevenção de ações inválidas, como cadastrar usuários com emails duplicados.
- Cobertura de testes abrangendo cenários positivos e negativos, com evidências documentadas.
- Automação de testes para cenários repetitivos.

## Escopo

### Incluso:
- Testes da API REST para endpoints de autenticação (`/api/auth/*`).
- Validação dos campos NOME, EMAIL, PASSWORD e ROLE.
- Testes dos verbos HTTP: POST (register/login), GET (profile), PUT (update profile).
- Validações de regras de negócio, como emails únicos, formato de email válido, e tamanho mínimo de senha (6 caracteres).
- Testes de autenticação via JWT tokens.
- Verificação de controle de acesso por roles.
- Geração de evidências de teste (logs, capturas de tela, relatórios).

### Excluído:
- Testes de performance ou carga.
- Testes de interface gráfica (não aplicável à API).
- Testes de segurança avançados (ex.: injeção SQL), a menos que especificado.

## Análise
A API de autenticação gerencia o registro e login de usuários no sistema de cinema, com as seguintes características:

**Endpoints principais:**
- `POST /api/auth/register` (criar usuário)
- `POST /api/auth/login` (autenticar usuário)
- `GET /api/auth/me` (obter perfil do usuário)
- `PUT /api/auth/profile` (atualizar perfil)

**Campos obrigatórios:** 
- NOME (string, obrigatório)
- EMAIL (string, formato válido, único)
- PASSWORD (string, mínimo 6 caracteres, armazenado como hash)
- ROLE (enum: 'user'/'admin', padrão: 'user')

**Riscos identificados:**
- Emails duplicados podem comprometer a integridade do banco.
- Falhas na validação de formato de email ou senha podem permitir cadastros inválidos.
- Tokens JWT mal configurados podem comprometer a segurança.
- Falhas no controle de acesso por roles podem permitir acesso não autorizado.
- Senhas não criptografadas podem expor dados sensíveis.

## Técnicas Aplicadas
- **Teste de Caixa Preta:** Validação dos endpoints com base na documentação da API
- **Teste Baseado em Risco:** Priorização de cenários críticos, como duplicidade de emails e segurança de autenticação
- **Teste Exploratório:** Identificação de cenários alternativos não cobertos pela documentação
- **Teste de API Automatizado:** Uso de ferramentas como Postman para testes repetitivos
- **Teste de Validação de Dados:** Verificação de regras de formato (email, senha) e criptografia
- **Teste de Segurança Básica:** Validação de tokens JWT e controle de acesso

## Mapa Mental da Aplicação
O mapa mental da API de autenticação inclui:

**Nó principal:** API de Autenticação

**Endpoints:**
- POST /api/auth/register
- POST /api/auth/login  
- GET /api/auth/me
- PUT /api/auth/profile

**Campos:**
- NOME (validação de presença)
- EMAIL (validação de formato e unicidade)
- PASSWORD (mínimo 6 caracteres, hash bcrypt)
- ROLE (user/admin, padrão user)

**Fluxos:**
- Registro de usuário válido
- Tentativa de registro com email duplicado
- Login com credenciais válidas/inválidas
- Acesso a perfil com token válido/inválido
- Atualização de perfil com/sem alteração de senha

**Riscos:**
- Duplicidade de emails
- Falhas em validações de formato
- Vulnerabilidades de autenticação
- Controle de acesso inadequado

## Cenários de Teste Planejados

| ID | Descrição do Cenário | Pré-condições | Passos | Resultado Esperado | Dados de Teste |
|----|---------------------|---------------|--------|-------------------|----------------|
| TC01 | Registrar usuário com dados válidos | Banco de dados limpo | Enviar POST /api/auth/register com dados válidos | Usuário criado, status 201, token JWT retornado | {name: "João Silva", email: "joao@exemplo.com", password: "123456"} |
| TC02 | Registrar usuário com email duplicado | Usuário com mesmo email já existe | Enviar POST /api/auth/register com email duplicado | Erro 400, mensagem "User already exists" | {name: "Maria", email: "joao@exemplo.com", password: "123456"} |
| TC03 | Registrar usuário com email inválido | Banco de dados limpo | Enviar POST /api/auth/register com email inválido | Erro 400, mensagem indicando formato inválido | {name: "Ana", email: "email-invalido", password: "123456"} |
| TC04 | Registrar usuário com senha muito curta | Banco de dados limpo | Enviar POST /api/auth/register com senha < 6 caracteres | Erro 400, mensagem indicando senha inválida | {name: "Pedro", email: "pedro@exemplo.com", password: "123"} |
| TC05 | Login com credenciais válidas | Usuário registrado existe | Enviar POST /api/auth/login com email/senha corretos | Login bem-sucedido, status 200, token JWT retornado | {email: "joao@exemplo.com", password: "123456"} |
| TC06 | Login com senha incorreta | Usuário registrado existe | Enviar POST /api/auth/login com senha incorreta | Erro 401, mensagem "Invalid email or password" | {email: "joao@exemplo.com", password: "senha-errada"} |
| TC07 | Login com email inexistente | Banco com outros usuários | Enviar POST /api/auth/login com email não cadastrado | Erro 401, mensagem "Invalid email or password" | {email: "inexistente@exemplo.com", password: "123456"} |
| TC08 | Obter perfil com token válido | Usuário logado com token válido | Enviar GET /api/auth/me com Authorization header | Perfil retornado, status 200 | Authorization: Bearer {valid_token} |
| TC09 | Obter perfil com token inválido | Token expirado ou inválido | Enviar GET /api/auth/me com token inválido | Erro 401, mensagem de não autorizado | Authorization: Bearer {invalid_token} |
| TC10 | Atualizar perfil com dados válidos | Usuário logado com token válido | Enviar PUT /api/auth/profile com novos dados | Perfil atualizado, status 200 | {name: "João Silva Novo"} |
| TC11 | Alterar senha com senha atual correta | Usuário logado | Enviar PUT /api/auth/profile com senhas | Senha alterada, status 200, novo token | {currentPassword: "123456", newPassword: "novasenha123"} |
| TC12 | Alterar senha com senha atual incorreta | Usuário logado | Enviar PUT /api/auth/profile com senha atual errada | Erro 401, mensagem "Senha atual incorreta" | {currentPassword: "errada", newPassword: "novasenha123"} |
| TC13 | Verificar redirecionamento após login | Usuário não logado | Fazer login com credenciais válidas | Login bem-sucedido com redirecionamento para página inicial | {email: "joao@exemplo.com", password: "123456"} |
| TC14 | Verificar redirecionamento após registro | Usuário não cadastrado | Registrar com dados válidos | Registro bem-sucedido com redirecionamento para login/autenticação | {name: "Novo User", email: "novo@exemplo.com", password: "123456"} |
| TC15 | Verificar persistência de token JWT | Usuário logado | Fechar e reabrir aplicação | Token persiste e usuário permanece logado | Verificar localStorage |

## Priorização da Execução dos Cenários de Teste

| ID | Prioridade | Justificativa |
|----|------------|---------------|
| TC01 | Alta | Registro de usuário é a funcionalidade base do sistema |
| TC05 | Alta | Login é funcionalidade crítica para acesso ao sistema |
| TC02 | Alta | Evitar duplicidade de emails é crítico para integridade |
| TC08 | Alta | Acesso ao perfil é essencial para autenticação |
| TC06 | Alta | Validação de credenciais é crítica para segurança |
| TC09 | Alta | Validação de tokens é essencial para segurança |
| TC03 | Média | Validação de formato de email é importante |
| TC04 | Média | Validação de senha é importante para segurança |
| TC07 | Média | Cenário de erro comum em login |
| TC10 | Média | Atualização de perfil é funcionalidade secundária |
| TC11 | Baixa | Alteração de senha é funcionalidade específica |
| TC12 | Baixa | Validação de senha atual é cenário de erro específico |
| TC13 | Média | Redirecionamento é importante para UX |
| TC14 | Média | Redirecionamento é importante para UX |
| TC15 | Baixa | Persistência de token é funcionalidade técnica |

## Matriz de Risco

| Risco | Probabilidade | Impacto | Nível de Risco | Mitigação |
|-------|---------------|---------|----------------|-----------|
| Duplicidade de emails | Média | Alto | Alto | Testes rigorosos de registro (TC02) |
| Falha na autenticação JWT | Baixa | Alto | Médio | Testes de token válido/inválido (TC08, TC09) |
| Falha na validação de email | Baixa | Médio | Médio | Testes de formato de email (TC03) |
| Falha na validação de senha | Baixa | Médio | Médio | Testes de tamanho de senha (TC04) |
| Vazamento de senhas | Baixa | Alto | Médio | Verificar criptografia BCrypt nas respostas |
| Controle de acesso inadequado | Média | Alto | Alto | Testes com diferentes roles (implícito nos testes) |

## Cobertura de Testes
- **Cobertura de Requisitos:** Todos os endpoints de autenticação serão testados
- **Cobertura de Cenários:** Cenários positivos e negativos para cada funcionalidade
- **Cobertura de Segurança:** Validações de token, criptografia de senha e controle de acesso

## Testes Candidatos a Automação

| ID | Descrição | Justificativa para Automação | Ferramenta Sugerida |
|----|-----------|------------------------------|-------------------|
| TC01 | Registrar usuário com dados válidos | Teste base para outros cenários | Postman/Newman |
| TC02 | Registrar usuário com email duplicado | Validação crítica e repetitiva | Postman/Newman |
| TC05 | Login com credenciais válidas | Teste repetitivo e crítico | Postman/Newman |
| TC06 | Login com senha incorreta | Validação de segurança repetitiva | Postman/Newman |
| TC08 | Obter perfil com token válido | Teste de autenticação repetitivo | Postman/Newman |
| TC09 | Obter perfil com token inválido | Validação de segurança repetitiva | Postman/Newman |

## Critérios de Aceitação
- Todos os cenários de alta prioridade devem passar
- Taxa de sucesso >= 95% nos testes automatizados
- Cobertura de pelo menos 90% dos endpoints de autenticação
- Tempo de resposta < 2 segundos para operações de autenticação
- Validações de segurança devem bloquear acessos não autorizados

## Ambiente de Teste
- **Base URL:** http://localhost:3000/api/auth
- **Banco de Dados:** MongoDB (limpo antes de cada teste)
- **Ferramentas:** Postman, Newman, MongoDB Compass
- **Dados de Teste:** Usuários pré-cadastrados para cenários específicos