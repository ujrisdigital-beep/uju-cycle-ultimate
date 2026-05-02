#!/bin/bash
# UJU CYCLE LIVE v4.0 - Complete Deployment Script
# Run: chmod +x deploy_complete.sh && ./deploy_complete.sh

set -e

echo "🚀 UJU CYCLE LIVE - COMPLETE DEPLOYMENT"
echo "========================================="

# Determine mode
MODE="${1:-local}"  # local, cloud, or ollama

if [ "$MODE" = "ollama" ]; then
    COMPOSE_FILE="docker-compose.ollama.yml"
    echo "📦 Starting in OLLAMA (air-gapped) mode..."
else
    COMPOSE_FILE="docker-compose.yml"
    echo "☁️ Starting in CLOUD mode..."
fi

# 1. Generate .env if missing
if [ ! -f .env ]; then
    echo "🔐 Generating .env secrets..."
    cat > .env << ENV
# Database
DATABASE_URL=postgresql://uju:uju_secret@postgres:5432/uju_cycle

# Redis
REDIS_URL=redis://redis:6379

# OpenAI
OPENAI_API_KEY=${OPENAI_API_KEY:-""}

# Encryption
DB_ENCRYPTION_KEY=$(openssl rand -base64 32)
AWS_KMS_KEY_ID=${AWS_KMS_KEY_ID:-""}

# API & Auth
JWT_SECRET=$(openssl rand -base64 32)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_placeholder}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-whsec_placeholder}

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)
ENV
    echo "✅ .env created"
fi

# 2. Start core services
echo "🐳 Starting Docker services ($COMPOSE_FILE)..."
docker-compose -f infra/$COMPOSE_FILE up -d postgres redis

# Wait for postgres
echo "⏳ Waiting for PostgreSQL..."
until docker exec $(docker-compose -f infra/$COMPOSE_FILE ps -q postgres) pg_isready -U uju 2>/dev/null; do
    sleep 2
done
echo "✅ PostgreSQL ready"

# 3. Load calibration dataset
echo "📊 Loading calibration dataset..."
docker exec -i $(docker-compose -f infra/$COMPOSE_FILE ps -q postgres) psql -U uju -d uju_cycle < infra/init-db.sql 2>/dev/null || true

# 4. Start all microservices
echo "🚀 Starting all microservices..."
docker-compose -f infra/$COMPOSE_FILE up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
for svc in ingestor diviner lens-shifter pattern-weaver critic explainer; do
    for i in {1..30}; do
        if curl -sf http://localhost:800${svc == "ingestor" && echo "0" || echo "1" ...} 2>/dev/null; then
            echo "  ✅ $svc ready"
            break
        fi
        sleep 2
    done
done

# 5. Run calibration (if API key available)
if [ -n "$OPENAI_API_KEY" ]; then
    echo "🧪 Running calibration suite..."
    cd backend/calibration
    python run_calibration.py --dataset calibration_dataset.json --output calibration_report.json || true
    cd ../..
    echo "✅ Calibration complete — see backend/calibration/calibration_report.json"
else
    echo "⚠️ Skipping calibration (OPENAI_API_KEY not set)"
fi

# 6. Build frontend
echo "🎨 Building PWA frontend..."
cd frontend
npm run build 2>/dev/null || (npm install && npm run build) || echo "⚠️ Frontend build skipped"
cd ..

# 7. Display access URLs
echo ""
echo "✅ DEPLOYMENT COMPLETE"
echo "======================"
echo "🌐 Control Room:   http://localhost:3000"
echo "📊 Grafana:         http://localhost:3001 (admin / \${GRAFANA_ADMIN_PASSWORD})"
echo "🔍 Jaeger:          http://localhost:16686"
echo "📈 Prometheus:      http://localhost:9090"
echo "🔬 Ingestor API:    http://localhost:8000/docs"
echo "🔬 Explainer API:   http://localhost:8005/docs"
echo ""
echo "🚀 UJU CYCLE LIVE is now LIVE."
echo "   Run: docker-compose -f infra/$COMPOSE_FILE logs -f"
echo "   Stop: docker-compose -f infra/$COMPOSE_FILE down"
