# Stokku Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [-Environment production|staging]
#   Default: production
#
# Prerequisites:
#   1. Docker & Docker Compose installed
#   2. Access to a container registry (GHCR, Docker Hub, etc.)
#   3. PostgreSQL instance accessible from the target server
#   4. Environment variables configured (see .env.example)

param(
  [string]$Environment = "production"
)

$composeFile = "docker-compose.yml"
if ($Environment -eq "staging") {
  $composeFile = "docker-compose.staging.yml"
}

Write-Host "🚀 Deploying Stokku ($Environment)..."

# 1. Build packages
Write-Host "📦 Building packages..."
pnpm install --frozen-lockfile; if ($?) { pnpm build }

# 2. Build Docker images
Write-Host "🐳 Building Docker images..."
docker compose -f $composeFile build

# 3. Run database migrations
Write-Host "🗄️  Running database migrations..."
docker compose -f $composeFile run --rm api sh -c "pnpm --filter @stokku/database exec prisma migrate deploy"

# 4. Start services
Write-Host "▶️  Starting services..."
docker compose -f $composeFile up -d

# 5. Health check
Write-Host "⏳ Waiting for API to be healthy..."
for ($i = 0; $i -lt 30; $i++) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ API is healthy"
    break
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Host "✨ Deployment complete!"
Write-Host "   API: http://localhost:4000"
Write-Host "   Web: http://localhost:3000"
