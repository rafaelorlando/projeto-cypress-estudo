# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run Cypress tests interactively (with browser UI):
```
npx cypress open
```

Run all tests headlessly:
```
npx cypress run
```

Run a single test file:
```
npx cypress run --spec "cypress/e2e/login.cy.js"
```

## Architecture

This is a Cypress e2e test study project targeting the [OrangeHRM demo app](https://opensource-demo.orangehrmlive.com/web/index.php/auth/login).

**Key conventions:**
- Custom Cypress commands are split into files under `cypress/support/` and imported in `cypress/support/e2e.js` (which loads automatically before tests).
- `cypress/support/login.js` defines the `cy.login(username, password)` command — new feature-specific commands should follow this pattern (one file per feature area, imported in `e2e.js`).
- `cypress/support/commands.js` is reserved for general-purpose custom commands.
- Tests live in `cypress/e2e/` with the `.cy.js` suffix.

**Config notes (`cypress.config.js`):**
- `allowCypressEnv: false` — do not use `CYPRESS_*` environment variables to pass sensitive data; use `cypress.env.json` (gitignored) or `--env` CLI flags instead.
- No `baseUrl` is set; the `cy.login` command visits the full URL directly.
