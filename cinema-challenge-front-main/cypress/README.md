# 🎭 Cinema Challenge - Testes E2E com Cypress

Este documento descreve a configuração e execução dos testes End-to-End (E2E) do Cinema Challenge Frontend usando Cypress.

---

## **📋 Visão Geral**

### **Cobertura de Testes:**
- **🔐 Autenticação:** Login, logout, registro, proteção de rotas
- **🎬 Funcionalidades:** Navegação, reservas, administração
- **🚨 Tratamento de Erros:** APIs offline, timeouts, validações
- **📱 Responsividade:** Mobile, tablet, desktop
- **♿ Acessibilidade:** Navegação por teclado, contraste

### **Arquitetura:**
```
cypress/
├── e2e/                    # Testes E2E
│   ├── auth.cy.js         # Testes de autenticação
│   ├── movies.cy.js       # Funcionalidades principais
│   └── error-handling.cy.js # Tratamento de erros
├── fixtures/              # Dados de teste
│   ├── users.json        # Usuários de teste
│   ├── movies.json       # Filmes de teste
│   ├── theaters.json     # Teatros de teste
│   └── sessions.json     # Sessões de teste
├── support/              # Configurações e helpers
│   ├── commands.js       # Comandos customizados
│   └── e2e.js           # Configuração global
└── cypress.config.js     # Configuração principal
```

---

## **🚀 Como Executar**

### **Pré-requisitos:**
1. **Frontend rodando:** `npm run dev` (porta 5173)
2. **Backend rodando:** API na porta 3000
3. **Database:** MongoDB com dados de teste

### **Comandos Disponíveis:**

#### **Desenvolvimento (Interface Visual):**
```bash
# Abrir Cypress Test Runner
npm run cypress:open

# Executar teste específico
npm run test:e2e:auth      # Apenas autenticação
npm run test:e2e:movies    # Apenas funcionalidades
npm run test:e2e:errors    # Apenas tratamento de erros
```

#### **CI/CD (Headless):**
```bash
# Executar todos os testes
npm run test:e2e

# Executar com interface visível
npm run test:e2e:headed

# Executar em browser específico
npm run cypress:run:chrome
npm run cypress:run:firefox

# Executar com servidor automático
npm run test:e2e:ci
```

---

## **🔧 Configuração**

### **Variáveis de Ambiente (cypress.config.js):**
```javascript
env: {
  API_BASE_URL: 'http://localhost:3000/api/v1',
  ADMIN_EMAIL: 'admin@cinema.com',
  ADMIN_PASSWORD: 'admin123',
  USER_EMAIL: 'user@test.com',
  USER_PASSWORD: 'user123'
}
```

### **Timeouts e Configurações:**
- **Viewport padrão:** 1280x720
- **Timeout de comandos:** 10 segundos
- **Timeout de requests:** 10 segundos
- **Timeout de carregamento:** 30 segundos

---

## **🧪 Estrutura dos Testes**

### **1. Testes de Autenticação (auth.cy.js):**
```javascript
describe('🔐 Autenticação E2E', () => {
  // ✅ Login com credenciais válidas
  // ❌ Login com credenciais inválidas
  // 📝 Validação de formulários
  // 🔒 Proteção de rotas
  // 🔄 Persistência de sessão
  // 📱 Responsividade
})
```

**Cenários Cobertos:**
- Login/logout de usuário comum
- Login/logout de administrador
- Registro de novos usuários
- Validações de email e senha
- Redirecionamentos após login
- Proteção de rotas por role
- Tratamento de tokens expirados

### **2. Funcionalidades Principais (movies.cy.js):**
```javascript
describe('🎬 Funcionalidades do Cinema E2E', () => {
  // 🎭 Navegação de filmes
  // 🎫 Seleção de sessões
  // 💺 Seleção de assentos
  // 💳 Processo de reserva
  // 📋 Minhas reservas
  // 👨‍💼 Área administrativa
})
```

**Cenários Cobertos:**
- Listagem e filtros de filmes
- Detalhes de filmes e sessões
- Seleção de assentos (disponíveis/ocupados)
- Fluxo completo de reserva
- Gerenciamento de reservas
- CRUD de filmes (admin)
- CRUD de sessões (admin)

### **3. Tratamento de Erros (error-handling.cy.js):**
```javascript
describe('🚨 Tratamento de Erros E2E', () => {
  // 🔌 Erros de API
  // ⏱️ Timeouts e loading
  // 🔍 Validações frontend
  // ♿ Acessibilidade
  // ⚡ Performance
})
```

**Cenários Cobertos:**
- APIs offline/indisponíveis
- Timeouts de requisições
- Erros 404, 500, 401, 403
- Validações de formulário
- Estados de loading
- Assentos já ocupados
- Sessões expiradas

---

## **🛠️ Comandos Customizados**

### **Autenticação:**
```javascript
// Login via API (rápido para setup)
cy.login(email, password, useAPI)

// Login como admin
cy.loginAsAdmin()

// Login como usuário comum
cy.loginAsUser()

// Logout
cy.logout()

// Verificar se está autenticado
cy.shouldBeAuthenticated()
cy.shouldNotBeAuthenticated()
```

### **Criação de Dados de Teste:**
```javascript
// Criar filme de teste
cy.createTestMovie(movieData)

// Criar teatro de teste
cy.createTestTheater(theaterData)

// Criar sessão de teste
cy.createTestSession(sessionData)

// Limpar dados de teste
cy.cleanDatabase()

// Popular dados de teste
cy.seedDatabase()
```

### **Navegação e Utilidades:**
```javascript
// Navegar e aguardar carregamento
cy.navigateToPage('/movies')

// Aguardar chamada de API
cy.waitForAPI('@getMovies')

// Capturar screenshot
cy.takeScreenshot('movie-selection')

// Testar responsividade
cy.checkResponsive()
```

---

## **📊 Fixtures (Dados de Teste)**

### **users.json:**
```json
{
  "admin": {
    "name": "Admin Cinema",
    "email": "admin@cinema.com",
    "password": "admin123",
    "role": "admin"
  },
  "user": {
    "name": "João Silva",
    "email": "joao@test.com",
    "password": "user123",
    "role": "user"
  }
}
```

### **movies.json:**
```json
{
  "actionMovie": {
    "title": "Vingadores: Guerra Infinita",
    "genre": "Ação",
    "duration": 149,
    "ticketPrice": 28.50,
    "synopsis": "Os heróis mais poderosos..."
  }
}
```

---

## **🎯 Seletores de Teste (data-cy)**

### **Padrão de Nomenclatura:**
```javascript
// Inputs e formulários
[data-cy=email-input]
[data-cy=password-input]
[data-cy=login-button]

// Listas e cards
[data-cy=movies-list]
[data-cy=movie-card]
[data-cy=session-item]

// Estados e mensagens
[data-cy=loading-spinner]
[data-cy=error-message]
[data-cy=success-message]

// Navegação e menus
[data-cy=user-menu]
[data-cy=admin-link]
[data-cy=logout-button]
```

### **Convenções:**
- **kebab-case** para nomes
- **Descritivos** e específicos
- **Consistentes** entre componentes
- **Não usar IDs** ou classes CSS

---

## **🔍 Estratégias de Teste**

### **1. Interceptação de APIs:**
```javascript
// Interceptar requisições
cy.intercept('GET', '**/movies*').as('getMovies')
cy.intercept('POST', '**/auth/login').as('login')

// Simular erros
cy.intercept('GET', '**/movies*', {
  statusCode: 500,
  body: { success: false, message: 'Erro interno' }
}).as('moviesError')

// Aguardar requisições
cy.wait('@getMovies')
cy.wait('@login')
```

### **2. Gerenciamento de Estado:**
```javascript
// Limpar estado antes de cada teste
beforeEach(() => {
  cy.clearLocalStorage()
  cy.clearCookies()
})

// Setup específico por contexto
context('Usuário logado', () => {
  beforeEach(() => {
    cy.loginAsUser()
  })
})
```

### **3. Assertivas Robustas:**
```javascript
// Aguardar elementos aparecerem
cy.get('[data-cy=movies-list]').should('be.visible')

// Verificar conteúdo específico
cy.get('[data-cy=movie-title]').should('contain', 'Vingadores')

// Verificar estados
cy.get('[data-cy=login-button]').should('not.be.disabled')

// Verificar URLs
cy.url().should('include', '/movies')
```

---

## **📱 Testes de Responsividade**

### **Viewports Testados:**
- **Mobile:** iPhone 8 (375x667)
- **Tablet:** iPad 2 (768x1024)
- **Desktop:** 1280x720

### **Verificações:**
- Elementos visíveis em todas as resoluções
- Formulários funcionais em mobile
- Navegação touch-friendly
- Performance em dispositivos móveis

---

## **♿ Testes de Acessibilidade**

### **Verificações Implementadas:**
- **Labels:** Todos os inputs têm aria-label
- **Navegação:** Tab funciona corretamente
- **Contraste:** Cores com contraste adequado
- **Semântica:** HTML semântico usado

### **Melhorias Sugeridas:**
- Implementar cypress-axe para auditoria completa
- Testar com leitores de tela
- Verificar WCAG 2.1 compliance

---

## **⚡ Testes de Performance**

### **Métricas Monitoradas:**
- **Tempo de carregamento inicial:** < 3 segundos
- **Tempo de login:** < 2 segundos  
- **Otimização de imagens:** Lazy loading
- **Bundle size:** Análise de performance

### **Comandos de Performance:**
```javascript
// Medir tempo de carregamento
const start = Date.now()
cy.visit('/')
cy.get('[data-cy=movies-list]').should('be.visible').then(() => {
  const loadTime = Date.now() - start
  expect(loadTime).to.be.lessThan(3000)
})
```

---

## **🚨 Troubleshooting**

### **Problemas Comuns:**

#### **1. Testes falhando por timeout:**
```javascript
// Aumentar timeout específico
cy.get('[data-cy=element]', { timeout: 15000 })

// Aguardar condição específica
cy.get('[data-cy=loading]').should('not.exist')
```

#### **2. Elementos não encontrados:**
```javascript
// Aguardar elemento aparecer
cy.get('[data-cy=element]').should('exist')

// Verificar se elemento está visível
cy.get('[data-cy=element]').should('be.visible')
```

#### **3. Problemas de timing:**
```javascript
// Aguardar requisição completar
cy.wait('@apiCall')

// Adicionar wait específico se necessário
cy.wait(1000)
```

### **4. APIs não disponíveis:**
- Verificar se backend está rodando
- Verificar URLs nas configurações
- Usar mocks quando necessário

---

## **📈 Relatórios e CI/CD**

### **Relatórios Gerados:**
- **Screenshots:** Em caso de falha
- **Vídeos:** Gravação completa dos testes
- **Coverage:** Cobertura de código com @cypress/code-coverage

### **Integração com CI/CD:**
```yaml
# GitHub Actions exemplo
- name: Run E2E Tests
  run: |
    npm install
    npm run build
    npm run test:e2e:ci
```

### **Parallelização:**
```bash
# Executar testes em paralelo (Cypress Dashboard)
npx cypress run --record --parallel
```

---

## **🎯 Próximos Passos**

### **Melhorias Planejadas:**
1. **Visual Testing:** Comparação de screenshots
2. **API Testing:** Testes diretos das APIs
3. **Database Testing:** Verificação de dados persistidos
4. **Load Testing:** Testes de carga com Lighthouse
5. **Cross-browser:** Testes em múltiplos navegadores

### **Automação:**
1. **Pre-commit hooks:** Executar testes básicos
2. **PR checks:** Testes completos em PRs
3. **Nightly runs:** Testes extensivos noturnos
4. **Performance monitoring:** Alertas de regressão

---

**📝 Última atualização:** 28/10/2025  
**👨‍💻 Responsável:** Equipe de QA + Frontend  
**🔗 Links úteis:**
- [Cypress Documentation](https://docs.cypress.io)
- [Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Visual Testing Guide](https://docs.cypress.io/guides/tooling/visual-testing)