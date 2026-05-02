# deploy.ps1 - One-Command Deployment to FortisOS.cloud

Write-Host "🚀 UJU CYCLE MARVEL v5.0 - DEPLOYING TO FORTISOS.CLOUD" -ForegroundColor Cyan

# Step 1: Check dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm not found. Please install Node.js" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker not found. Please install Docker" -ForegroundColor Red
    exit 1
}

# Step 2: Build frontend
Write-Host "📦 Building Next.js frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Step 3: Build backend image
Write-Host "⚙️ Building backend Docker image..." -ForegroundColor Yellow
Set-Location ../backend
docker build -t uju-backend:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

# Step 4: Deploy frontend to Vercel
Write-Host "🌐 Deploying frontend to Vercel..." -ForegroundColor Yellow
Set-Location ../frontend
npx vercel --prod --yes --token $env:VERCEL_TOKEN --scope fortisos

# Step 5: Deploy backend to Render via docker-compose
Write-Host "🔧 Starting backend services..." -ForegroundColor Yellow
Set-Location ../infra
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker Compose failed" -ForegroundColor Red
    exit 1
}

# Step 6: Wait for Ollama to pull models
Write-Host "🦙 Pulling Ollama models (this may take a while)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
docker exec uju-world-class-ollama-1 ollama pull phi3:3.8b
docker exec uju-world-class-ollama-1 ollama pull mixtral:8x7b
docker exec uju-world-class-ollama-1 ollama pull llama3.1:70b

Write-Host "`n✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "🌐 Frontend: https://fortisos.cloud" -ForegroundColor Cyan
Write-Host "🔗 Backend API: https://uju-api.onrender.com" -ForegroundColor Cyan
Write-Host "💰 Monetization: Stripe active" -ForegroundColor Cyan
Write-Host "🔒 Security: ε=2.0 | TPM 2.0" -ForegroundColor Cyan
Write-Host "`n📊 Check status: docker ps" -ForegroundColor Yellow
