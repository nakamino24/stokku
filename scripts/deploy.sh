#!/usr/bin/env bash
set -euo pipefail

# Stokku Deployment Script
# Usage: bash scripts/deploy.sh [environment]
#   environment: production | staging (default: production)
#
# Prerequisites:
#   1. Docker & Docker Compose installed
#   2. Access to a container registry (GHCR, Docker Hub, etc.)
#   3. PostgreSQL instance accessible from the target server
#   4. Environment variables configured (see .env.example)

ENVIRONMENT="${1:-production}"
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "staging" ]; then
  COMPOSE_FILE="docker-compose.staging.yml"
fi

echo "🚀 Deploying Stokku ($ENVIRONMENT)..."

# 1. Build packages
echo "📦 Building packages..."
pnpm install --frozen-lockfile
pnpm build

# 2. Build Docker images
echo "🐳 Building Docker images..."
docker compose -f "$COMPOSE_FILE" build

# 3. Run database migrations
echo "🗄️  Running database migrations..."
docker compose -f "$COMPOSE_FILE" run --rm api sh -c " \
  pnpm --filter @stokku/database exec prisma migrate deploy \
"

# 4. Start services
echo "▶️  Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# 5. Health check
echo "⏳ Waiting for API to be healthy..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
    break
  fi
  sleep 2
done

echo "✨ Deployment complete!"
echo "   API: http://localhost:4000"
echo "   Web: http://localhost:3000"
