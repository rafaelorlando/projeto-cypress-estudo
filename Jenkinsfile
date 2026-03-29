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
                    docker compose run --name ${CONTAINER_NAME} \
                        -e CYPRESS_BASE_URL=${CYPRESS_BASE_URL} \
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
