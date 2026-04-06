#!/bin/bash

# Configuration
# Default target directory
APP_DIR="/root/godash" 
ENV_FILE=".env.local"

echo "🚀 Iniciando Deploy do DentalGO BI..."

# Change to the application directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR" || exit 1
else
    echo "⚠️  Aviso: Diretório $APP_DIR não encontrado, tentando diretório atual..."
    APP_DIR=$(pwd)
fi

# Pull latest changes from git
echo "📥 Puxando código do GitHub..."
git pull origin main

# Check for .env.local existence (critical for runtime/build)
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Erro: $ENV_FILE não encontrado!"
    echo "Certifique-se de criar o arquivo .env.local com as credenciais do banco de dados."
    exit 1
fi

# Determine the docker compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
else
    DOCKER_CMD="docker compose"
fi

# Build and Restart containers
echo "🏗️  Reconstruindo container Docker usando $DOCKER_CMD..."
$DOCKER_CMD down
$DOCKER_CMD up -d --build

# Verify status
echo "✅ Deploy Finalizado!"
docker ps | grep dentalgo-bi
