# projeto-cypress-estudo

Projeto de estudos em automação de testes end-to-end utilizando **Cypress**, com foco em boas práticas de organização de comandos customizados e escrita de cenários de teste.

---

## Sobre o Projeto

O projeto automatiza testes na aplicação de demonstração **OrangeHRM**, um sistema de gerenciamento de RH open source. Os testes cobrem o fluxo de autenticação da aplicação, validando cenários de sucesso e de erro.

**Aplicação alvo:** https://opensource-demo.orangehrmlive.com/web/index.php/auth/login

---

## Tecnologias

- [Cypress](https://www.cypress.io/) v15.11.0

---

## Estrutura do Projeto

```
projeto-cypress-estudo/
├── cypress/
│   ├── e2e/
│   │   └── login.cy.js          # Cenários de teste de login
│   ├── fixtures/
│   │   └── example.json         # Exemplo de dados mockados
│   └── support/
│       ├── commands.js          # Comandos customizados genéricos
│       ├── login.js             # Comando customizado cy.login()
│       └── e2e.js               # Ponto de entrada dos support files
├── cypress.config.js            # Configuração do Cypress
└── package.json
```

---

## Instalação

```bash
npm install
```

---

## Como Executar os Testes

**Modo interativo (com interface gráfica):**
```bash
npx cypress open
```

**Modo headless (linha de comando):**
```bash
npx cypress run
```

**Executar um arquivo específico:**
```bash
npx cypress run --spec "cypress/e2e/login.cy.js"
```

---

## Cenários de Teste

### Login (`cypress/e2e/login.cy.js`)

| Cenário | Entrada | Resultado Esperado |
|---|---|---|
| Login com credenciais válidas | `Admin` / `admin123` | Redireciona para `/dashboard` |
| Login com senha inválida | `Admin` / `senhaErrada` | Exibe "Invalid credentials" |
| Login com usuário inválido | `usuarioInexistente` / `admin123` | Exibe "Invalid credentials" |
| Login com campos vazios | `""` / `""` | Exibe mensagem "Required" |

---

## Comandos Customizados

### `cy.login(username, password)`

Definido em `cypress/support/login.js`. Encapsula o fluxo completo de login: visita a página, preenche os campos de usuário e senha e clica no botão de submit.

**Uso:**
```js
cy.login('Admin', 'admin123');
```

---

## Configuração

O arquivo `cypress.config.js` possui as seguintes definições relevantes:

- `allowCypressEnv: false` — variáveis de ambiente prefixadas com `CYPRESS_` são ignoradas. Para passar dados sensíveis, utilize um arquivo `cypress.env.json` (não versionado) ou a flag `--env` na linha de comando.
