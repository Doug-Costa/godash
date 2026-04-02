#!/bin/bash

# Configuration
APP_DIR="/root/godash" # Adjust to your actual folder on VPS
ENV_FILE=".env.local"

echo "🚀 Iniciando Deploy do DentalGO BI (Fidelity Update)..."

# Go to directory
cd $APP_DIR || { echo "❌ Erro: Diretório $APP_DIR não encontrado!"; exit 1; }

# Pull latest changes
echo "📥 Puxando código do GitHub..."
git pull origin main

# Check for .env.local
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Aviso: $ENV_FILE não encontrado. Certifique-se de criá-lo com as chaves do DO."
fi

# Build and Restart
echo "🏗️  Reconstruindo container Docker..."
docker-compose down
docker-compose up -d --build

# Verify
echo "✅ Deploy Finalizado!"
docker ps | grep dentalgo-bi
