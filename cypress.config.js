// cypress.config.js
const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,    // no CI (cypress run) — reduz flakiness
      openMode: 0    // local (cypress open) — sem retry
    },
    setupNodeEvents(on, config) {
      return config
    },
  },
})