// Seleciona elementos pelo atributo data-test
Cypress.Commands.add('getByData', (selector) => {
  return cy.get(`[data-test='${selector}']`);
});
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom commands for Cinema App

/**
 * Login command - Logs in a user and stores auth token
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} useAPI - Whether to use API directly or UI
 */
Cypress.Commands.add('login', (email, password, useAPI = false) => {
  if (useAPI) {
    // Login via API (faster for setup)
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_BASE_URL')}/auth/login`,
      body: {
        email,
        password
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.token).to.exist
      
      // Store token in localStorage
      window.localStorage.setItem('token', response.body.data.token)
      window.localStorage.setItem('user', JSON.stringify(response.body.data))
    })
  } else {
    // Login via UI
    cy.visit('/login')
    cy.get('[data-cy=email-input]').type(email)
    cy.get('[data-cy=password-input]').type(password)
    cy.get('[data-cy=login-button]').click()
    
    // Wait for successful login
    cy.url().should('not.include', '/login')
    cy.window().its('localStorage.token').should('exist')
  }
})

/**
 * Login as admin user
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'), true)
})

/**
 * Login as regular user
 */
Cypress.Commands.add('loginAsUser', () => {
  cy.login(Cypress.env('USER_EMAIL'), Cypress.env('USER_PASSWORD'), true)
})

/**
 * Logout command
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token')
    win.localStorage.removeItem('user')
  })
  cy.visit('/')
})

/**
 * Register a new user
 * @param {object} userData - User data
 */
Cypress.Commands.add('register', (userData) => {
  const user = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    ...userData
  }
  
  cy.visit('/register')
  cy.get('[data-cy=name-input]').type(user.name)
  cy.get('[data-cy=email-input]').type(user.email)
  cy.get('[data-cy=password-input]').type(user.password)
  cy.get('[data-cy=register-button]').click()
})

/**
 * Create test data via API
 */
Cypress.Commands.add('createTestMovie', (movieData = {}) => {
  const defaultMovie = {
    title: 'Test Movie',
    genre: 'Action',
    duration: 120,
    ticketPrice: 25.50,
    synopsis: 'A test movie for E2E testing'
  }
  
  const movie = { ...defaultMovie, ...movieData }
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/movies`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: movie
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

Cypress.Commands.add('createTestTheater', (theaterData = {}) => {
  const defaultTheater = {
    name: 'Test Theater',
    capacity: 100
  }
  
  const theater = { ...defaultTheater, ...theaterData }
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/theaters`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: theater
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

Cypress.Commands.add('createTestSession', (sessionData = {}) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(20, 0, 0, 0)
  
  const defaultSession = {
    showTime: tomorrow.toISOString()
  }
  
  const session = { ...defaultSession, ...sessionData }
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_BASE_URL')}/sessions`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: session
  }).then((response) => {
    expect(response.status).to.eq(201)
    return response.body.data
  })
})

/**
 * Clean up test data
 */
Cypress.Commands.add('cleanDatabase', () => {
  cy.task('clearDatabase')
})

/**
 * Seed test data
 */
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase')
})

/**
 * Navigate to a specific page and wait for it to load
 */
Cypress.Commands.add('navigateToPage', (path) => {
  cy.visit(path)
  cy.get('[data-cy=loading]').should('not.exist')
  cy.get('body').should('be.visible')
})

/**
 * Check if user is authenticated
 */
Cypress.Commands.add('shouldBeAuthenticated', () => {
  cy.window().its('localStorage.token').should('exist')
  cy.get('[data-cy=user-menu]').should('be.visible')
})

/**
 * Check if user is not authenticated
 */
Cypress.Commands.add('shouldNotBeAuthenticated', () => {
  cy.window().its('localStorage.token').should('not.exist')
  cy.get('[data-cy=login-button]').should('be.visible')
})

/**
 * Wait for API call to complete
 */
Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204])
  })
})

/**
 * Take a screenshot with custom name
 */
Cypress.Commands.add('takeScreenshot', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  cy.screenshot(`${name}-${timestamp}`)
})

/**
 * Check responsive design
 */
Cypress.Commands.add('checkResponsive', () => {
  // Mobile
  cy.viewport(375, 667)
  cy.wait(500)
  cy.takeScreenshot('mobile')
  
  // Tablet
  cy.viewport(768, 1024)
  cy.wait(500)
  cy.takeScreenshot('tablet')
  
  // Desktop
  cy.viewport(1280, 720)
  cy.wait(500)
  cy.takeScreenshot('desktop')
})