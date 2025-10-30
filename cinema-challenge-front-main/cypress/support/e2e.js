// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using CommonJS syntax
require('./commands')

// Import code coverage support (comentado por enquanto)
// require('@cypress/code-coverage/support')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on unhandled promise rejections and other uncaught exceptions
  console.log('Uncaught exception:', err.message)
  return false
})

// Before each test
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage()
  cy.clearCookies()
  
  // Set default viewport
  cy.viewport(1280, 720)
})

// Global hooks
before(() => {
  cy.log('🎬 Starting Cinema App E2E Tests')
})

after(() => {
  cy.log('🎭 Cinema App E2E Tests Completed')
})