pipeline {
    agent any

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        CYPRESS_BASE_URL = 'https://opensource-demo.orangehrmlive.com/web/index.php/auth/login'
        COMPOSE_PROJECT_NAME = "cypress-${env.BUILD_NUMBER}"
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
                sh '''
                    docker compose run --rm \
                        -e CYPRESS_BASE_URL=$CYPRESS_BASE_URL \
                        cypress
                '''
            }
        }
    }

    post {
        always {
            sh 'docker compose down --volumes --remove-orphans || true'

            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4', allowEmptyArchive: true
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png', allowEmptyArchive: true
        }
        success {
            echo 'Testes concluídos com sucesso!'
        }
        failure {
            echo 'Falha nos testes. Verifique os artefatos (videos/screenshots).'
        }
    }
}
