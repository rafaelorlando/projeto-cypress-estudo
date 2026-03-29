# projeto-cypress-estudo

Projeto de automação de testes end-to-end utilizando **Cypress**, com pipeline de CI/CD completa via **Jenkins + Docker** e geração de relatórios interativos com **Allure Report**.

O projeto automatiza testes na aplicação de demonstração **OrangeHRM** — um sistema de gerenciamento de RH open source — cobrindo fluxos de autenticação com cenários de sucesso e falha.

**Aplicação alvo:** https://opensource-demo.orangehrmlive.com/web/index.php/auth/login

---

## Sumário

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Execução Local](#instalação-e-execução-local)
- [Execução via Docker](#execução-via-docker)
- [Pipeline Jenkins](#pipeline-jenkins)
- [Allure Report](#allure-report)
- [Cenários de Teste](#cenários-de-teste)
- [Comandos Customizados](#comandos-customizados)
- [Configuração do Cypress](#configuração-do-cypress)
- [Decisões de Arquitetura](#decisões-de-arquitetura)
- [Troubleshooting](#troubleshooting)

---

## Tecnologias

| Ferramenta | Versão | Finalidade |
|---|---|---|
| [Cypress](https://www.cypress.io/) | 15.11.0 | Framework de testes E2E |
| [@shelex/cypress-allure-plugin](https://github.com/Shelex/cypress-allure-plugin) | 2.40.2 | Geração de resultados para Allure |
| [Docker](https://www.docker.com/) | 29+ | Containerização dos testes |
| [Docker Compose](https://docs.docker.com/compose/) | v2+ | Orquestração do container Cypress |
| [Jenkins](https://www.jenkins.io/) | 2.541+ | Servidor de CI/CD |
| [Allure Report](https://allurereport.org/) | 2.38+ | Relatórios interativos de testes |
| Node.js | 24+ | Runtime JavaScript |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18 ou superior — [download](https://nodejs.org/)
- **Git** — [download](https://git-scm.com/)
- **Docker Desktop** (para execução em container e/ou Jenkins) — [download](https://www.docker.com/products/docker-desktop/)

Verifique as instalações:

```bash
node --version
npm --version
git --version
docker --version
docker compose version
```

---

## Estrutura do Projeto

```
projeto-cypress-estudo/
│
├── cypress/
│   ├── e2e/
│   │   └── login.cy.js              # Cenários de teste de login
│   ├── fixtures/
│   │   └── example.json             # Dados mockados de exemplo
│   ├── screenshots/                 # Screenshots geradas em falhas (gerado automaticamente)
│   ├── videos/                      # Vídeos das execuções (gerado automaticamente)
│   └── support/
│       ├── commands.js              # Comandos customizados genéricos
│       ├── login.js                 # Comando customizado cy.login()
│       └── e2e.js                   # Ponto de entrada dos support files
│
├── allure-results/                  # Resultados brutos do Allure (gerado automaticamente)
│
├── cypress.config.js                # Configuração central do Cypress + Allure
├── Dockerfile.cypress               # Imagem Docker para rodar os testes
├── docker-compose.yml               # Orquestração do serviço Cypress
├── Jenkinsfile                      # Pipeline declarativa do Jenkins
├── package.json                     # Dependências do projeto
├── .dockerignore                    # Arquivos ignorados pelo Docker build
└── .gitignore                       # Arquivos ignorados pelo Git
```

---

## Instalação e Execução Local

### 1. Clonar o repositório

```bash
git clone https://github.com/rafaelorlando/projeto-cypress-estudo.git
cd projeto-cypress-estudo
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Executar os testes

**Modo interativo — abre o Cypress Test Runner com interface gráfica:**
```bash
npx cypress open
```

**Modo headless — executa todos os testes no terminal:**
```bash
npx cypress run
```

**Executar um arquivo específico:**
```bash
npx cypress run --spec "cypress/e2e/login.cy.js"
```

**Executar com geração de Allure Report:**
```bash
npx cypress run --env allure=true
```

---

## Execução via Docker

Os testes podem ser executados em um ambiente completamente isolado usando Docker, sem necessidade de instalar Node.js ou Cypress localmente.

### Build da imagem

```bash
docker compose build
```

### Executar os testes

```bash
docker compose run --rm cypress
```

### Executar com Allure Report

```bash
docker compose run --rm cypress npx cypress run --env allure=true
```

### O que acontece por baixo dos panos

1. O Docker usa a imagem base `cypress/included:15.11.0` — que já vem com Chrome, Electron e o binário do Cypress pré-instalados, evitando downloads demorados
2. O `npm install` instala apenas as dependências do projeto (o plugin Allure)
3. O código do projeto é copiado para `/app` dentro do container
4. O `shm_size: '1gb'` no `docker-compose.yml` aumenta a memória compartilhada — necessário para evitar crashes do Chrome em ambiente containerizado

### Arquivo `Dockerfile.cypress`

```dockerfile
FROM cypress/included:15.11.0

WORKDIR /app

COPY package.json ./
RUN npm install --prefer-offline

COPY . .

CMD ["npx", "cypress", "run"]
```

### Arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
  cypress:
    build:
      context: .
      dockerfile: Dockerfile.cypress
    environment:
      - CYPRESS_BASE_URL=https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
    volumes:
      - ./cypress/videos:/app/cypress/videos
      - ./cypress/screenshots:/app/cypress/screenshots
      - ./allure-results:/app/allure-results
    shm_size: '1gb'
```

---

## Pipeline Jenkins

A pipeline automatiza o ciclo completo: checkout do código → build da imagem Docker → execução dos testes → geração do Allure Report.

### Pré-requisitos no Jenkins

#### 1. Subir o Jenkins via Docker

```bash
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

O parâmetro `-v /var/run/docker.sock:/var/run/docker.sock` permite que o Jenkins execute comandos Docker do host sem precisar de Docker-in-Docker.

#### 2. Instalar Docker CLI e Docker Compose dentro do Jenkins

Como o container Jenkins não vem com Docker CLI, é necessário instalar:

```bash
# Instalar o Docker CLI
docker exec -u root jenkins bash -c "apt-get update && apt-get install -y docker.io"

# Instalar o plugin Docker Compose v2
docker exec -u root jenkins bash -c "mkdir -p /usr/local/lib/docker/cli-plugins && curl -fsSL https://github.com/docker/compose/releases/download/v2.24.7/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose && chmod +x /usr/local/lib/docker/cli-plugins/docker-compose"

# Dar permissão ao socket Docker
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

> **Atenção:** esses comandos precisam ser reexecutados se o container Jenkins for recriado.

#### 3. Instalar plugins no Jenkins

Acesse `http://localhost:8080` → `Manage Jenkins` → `Plugins` → `Available plugins` e instale:

- **Allure Jenkins Plugin**

#### 4. Configurar o Allure Commandline

`Manage Jenkins` → `Tools` → `Allure Commandline` → `Add Allure Commandline`:

| Campo | Valor |
|---|---|
| Name | `allure` |
| Install automatically | marcado |
| Version | última disponível |

### Criar o job no Jenkins

1. Na tela inicial clique em **New Item**
2. Dê o nome `projeto-cypress-estudo` e selecione **Pipeline**
3. Em **Pipeline definition** selecione `Pipeline script from SCM`
4. Preencha:

| Campo | Valor |
|---|---|
| SCM | `Git` |
| Repository URL | `https://github.com/rafaelorlando/projeto-cypress-estudo.git` |
| Branch | `*/main` |
| Script Path | `Jenkinsfile` |

5. Clique em **Save** → **Build Now**

### Stages da Pipeline

```
Checkout → Build Image → Run Tests → Post Actions
```

| Stage | O que faz |
|---|---|
| `Checkout` | Baixa o código do repositório GitHub |
| `Build Image` | Builda a imagem Docker do Cypress com `--no-cache` |
| `Run Tests` | Executa os testes Cypress dentro do container com Allure habilitado |
| `Post (always)` | Extrai resultados via `docker cp`, arquiva vídeos/screenshots e publica o Allure Report |

### Por que `docker cp` ao invés de volumes?

O Jenkins roda dentro de um container Docker e acessa o daemon Docker do host via socket (`/var/run/docker.sock`). Quando o `docker compose` tenta montar um volume com caminho relativo (`./allure-results`), o Docker interpreta esse caminho no contexto do **host macOS** — não dentro do container Jenkins. Por isso, os arquivos nunca chegam ao workspace do Jenkins.

A solução é usar `docker cp` para copiar os resultados diretamente do container para o workspace após a execução:

```groovy
docker cp ${CONTAINER_NAME}:/app/allure-results ./allure-results || true
docker cp ${CONTAINER_NAME}:/app/cypress/videos ./cypress/videos || true
docker cp ${CONTAINER_NAME}:/app/cypress/screenshots ./cypress/screenshots || true
```

### Arquivo `Jenkinsfile`

```groovy
pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        CYPRESS_BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
        CONTAINER_NAME   = "cypress-ci-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Run Tests') {
            steps {
                sh """
                    docker compose run --name ${CONTAINER_NAME} \\
                        -e CYPRESS_BASE_URL=${CYPRESS_BASE_URL} \\
                        cypress npx cypress run --env allure=true || true

                    docker cp ${CONTAINER_NAME}:/app/allure-results ./allure-results || true
                    docker cp ${CONTAINER_NAME}:/app/cypress/videos ./cypress/videos || true
                    docker cp ${CONTAINER_NAME}:/app/cypress/screenshots ./cypress/screenshots || true
                    docker rm ${CONTAINER_NAME} || true
                """
            }
        }
    }

    post {
        always {
            sh 'docker compose down --remove-orphans || true'
            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4', allowEmptyArchive: true
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png', allowEmptyArchive: true
            allure([
                includeProperties: false,
                jdk: '',
                results: [[path: 'allure-results']]
            ])
        }
        success {
            echo 'Testes concluídos com sucesso!'
        }
        failure {
            echo 'Falha nos testes. Verifique o Allure Report.'
        }
    }
}
```

---

## Allure Report

O Allure Report é um framework de relatórios interativos que exibe resultados de testes com gráficos, histórico de execuções, screenshots e vídeos.

### Como funciona a integração

1. O plugin `@shelex/cypress-allure-plugin` é registrado no `cypress.config.js` via `setupNodeEvents`
2. O plugin é importado no `cypress/support/e2e.js`
3. Durante a execução com `--env allure=true`, o plugin gera arquivos JSON em `allure-results/`
4. O Jenkins Plugin coleta esses arquivos e gera o relatório HTML interativo

### Visualizar o relatório no Jenkins

Após o build, clique em **Allure Report** na página do job para ver:

- Visão geral com percentual de aprovação
- Detalhamento por cenário (passed, failed, broken)
- Histórico de tendência entre builds
- Screenshots anexadas automaticamente nos testes com falha
- Timeline de execução

### Gerar e visualizar o relatório localmente

Se quiser visualizar o relatório fora do Jenkins, instale o Allure CLI:

```bash
# macOS
brew install allure

# Após rodar os testes com --env allure=true
allure serve allure-results
```

---

## Cenários de Teste

### `cypress/e2e/login.cy.js`

| # | Cenário | Credenciais | Resultado Esperado |
|---|---|---|---|
| 1 | Login com credenciais válidas | `Admin` / `admin123` | Redireciona para `/dashboard` |
| 2 | Login com senha inválida | `Admin` / `senhaErrada` | Exibe `Invalid credentials` |
| 3 | Login com usuário inválido | `usuarioInexistente` / `admin123` | Exibe `Invalid credentials` |
| 4 | Login com campos vazios | `""` / `""` | Exibe mensagem `Required` |

> O cenário 4 está marcado como falha intencional na suite atual — o comando `cy.type()` do Cypress não aceita string vazia. A correção requer ajustar o comando `cy.login()` para não chamar `.type()` quando os campos estiverem vazios.

---

## Comandos Customizados

Os comandos customizados ficam em `cypress/support/` e são importados automaticamente pelo `e2e.js` antes de cada arquivo de teste.

### `cy.login(username, password)`

Definido em `cypress/support/login.js`. Encapsula o fluxo completo de autenticação.

```js
Cypress.Commands.add('login', (username, password) => {
    cy.visit('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    cy.get('[name="username"]').type(username);
    cy.get('[name="password"]').type(password);
    cy.get('[type="submit"]').click();
});
```

**Uso nos testes:**
```js
cy.login('Admin', 'admin123');
```

### Adicionando novos comandos

Siga o padrão: crie um arquivo por área funcional em `cypress/support/` e importe no `e2e.js`.

Exemplo para uma área de "Dashboard":

```js
// cypress/support/dashboard.js
Cypress.Commands.add('navegarParaRelatorios', () => {
    cy.get('[data-testid="nav-reports"]').click();
});
```

```js
// cypress/support/e2e.js
import './commands'
import './login'
import './dashboard'         // adicionar aqui
import '@shelex/cypress-allure-plugin'
```

---

## Configuração do Cypress

Arquivo `cypress.config.js`:

```js
const { defineConfig } = require('cypress')
const allureWriter = require('@shelex/cypress-allure-plugin/writer')

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://opensource-demo.orangehrmlive.com/...',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,   // CI: tenta até 3 vezes antes de marcar como falha
      openMode: 0   // local: sem retry
    },
    setupNodeEvents(on, config) {
      allureWriter(on, config)
      return config
    },
  },
})
```

### Principais configurações

| Propriedade | Valor | Motivo |
|---|---|---|
| `video` | `true` | Grava todas as execuções para diagnóstico |
| `screenshotOnRunFailure` | `true` | Captura screenshot automática em falhas |
| `defaultCommandTimeout` | `10000ms` | Aguarda até 10s para elementos aparecerem (rede lenta) |
| `retries.runMode` | `2` | Reduz falsos negativos causados por flakiness em CI |
| `retries.openMode` | `0` | Execução local sem retry para feedback rápido |

### Variáveis de ambiente

A `baseUrl` pode ser sobrescrita via variável de ambiente:

```bash
# Execução local apontando para outro ambiente
CYPRESS_BASE_URL=https://staging.exemplo.com npx cypress run
```

> **Não use** `CYPRESS_*` para dados sensíveis — o `allowCypressEnv` está desabilitado. Para senhas e tokens, use `cypress.env.json` (não versionado) ou a flag `--env` na linha de comando.

---

## Decisões de Arquitetura

### Por que `cypress/included` como imagem base?

A imagem `cypress/included` já contém o binário do Cypress, Chrome e Electron pré-instalados. Isso elimina o passo `cypress install` durante o build (que pode demorar vários minutos e falhar em ambientes com restrição de rede).

### Por que `shm_size: '1gb'` no Docker Compose?

O Chrome usa memória compartilhada (`/dev/shm`) extensivamente para renderização. O limite padrão em containers é 64MB, o que causa crashes silenciosos do browser durante os testes. 1GB resolve esse problema.

### Por que separar comandos em arquivos por feature?

Em vez de colocar todos os comandos em `commands.js`, cada área funcional tem seu próprio arquivo (`login.js`, etc.). Isso facilita:
- Localização rápida de um comando
- Revisões de código focadas
- Crescimento organizado do projeto

### Por que `disableConcurrentBuilds()` no Jenkinsfile?

Builds concorrentes do mesmo job podem tentar usar o mesmo container name (`cypress-ci-{BUILD_NUMBER}` evita isso, mas dois builds com o mesmo número em racing condition poderiam causar conflitos de rede Docker). É uma proteção adicional.

---

## Troubleshooting

### `docker: not found` no Jenkins

O container Jenkins não tem o Docker CLI instalado. Execute:

```bash
docker exec -u root jenkins bash -c "apt-get update && apt-get install -y docker.io"
docker exec -u root jenkins chmod 666 /var/run/docker.sock
```

### `docker compose: command not found` ou `unknown flag`

O `docker.io` instalado via apt é antigo e não tem o plugin Compose v2. Instale manualmente:

```bash
docker exec -u root jenkins bash -c \
  "mkdir -p /usr/local/lib/docker/cli-plugins && \
   curl -fsSL https://github.com/docker/compose/releases/download/v2.24.7/docker-compose-linux-x86_64 \
   -o /usr/local/lib/docker/cli-plugins/docker-compose && \
   chmod +x /usr/local/lib/docker/cli-plugins/docker-compose"
```

### `allure-results does not exist` no Allure Report

Causado pelo problema de resolução de paths em Docker-in-Docker via socket. A pipeline usa `docker cp` para contornar isso — certifique-se de estar usando a versão atualizada do `Jenkinsfile`.

### `failed to read .env: key cannot contain a space`

O Docker Compose lê o arquivo `.env` automaticamente e ele continha formato inválido. Solução: remover o `.env` do repositório e adicioná-lo ao `.gitignore`.

### Chrome crasha silenciosamente no container

Certifique-se que o `shm_size: '1gb'` está presente no `docker-compose.yml`. Sem isso, o Chrome falha por falta de memória compartilhada.

### `cy.type()` não aceita string vazia

O cenário `login com campos vazios` falha porque `cy.type('')` lança erro. Para testar campos vazios sem digitar nada, o comando `cy.login()` precisa ser ajustado para pular o `.type()` quando o valor for vazio:

```js
Cypress.Commands.add('login', (username, password) => {
    cy.visit('...');
    if (username) cy.get('[name="username"]').type(username);
    if (password) cy.get('[name="password"]').type(password);
    cy.get('[type="submit"]').click();
});
```

### Remote origin já existe ao configurar o GitHub

```bash
# Trocar a URL do remote
git remote set-url origin https://rafaelorlando@github.com/SEU_USUARIO/projeto-cypress-estudo.git
```

### Permissão negada ao fazer push (conta errada)

O macOS pode estar usando credenciais de outra conta salvas no Keychain. Use um Personal Access Token explicitamente na URL ou configure o Git credential helper.

---

## Fluxo Completo da Pipeline

```
Developer pushes code
        │
        ▼
   GitHub (main)
        │
        ▼
 Jenkins detecta mudança
        │
        ▼
  Stage: Checkout
  └── git clone / pull do repositório
        │
        ▼
  Stage: Build Image
  └── docker compose build --no-cache
      └── FROM cypress/included:15.11.0
          └── npm install (@shelex/cypress-allure-plugin)
              └── COPY projeto
        │
        ▼
  Stage: Run Tests
  └── docker compose run cypress npx cypress run --env allure=true
      └── Cypress executa login.cy.js (4 cenários)
          ├── Gera allure-results/ com JSONs
          ├── Grava cypress/videos/*.mp4
          └── Screenshots em falhas
  └── docker cp → copia resultados para workspace Jenkins
        │
        ▼
  Post Actions (sempre executado)
  ├── docker compose down
  ├── archiveArtifacts (vídeos + screenshots)
  └── allure generate → publica relatório interativo
        │
        ▼
  Allure Report disponível em:
  http://localhost:8080/job/projeto-cypress-estudo/{BUILD}/allure/
```
