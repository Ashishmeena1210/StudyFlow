# StudyFlow Production Deployment Helper Script (PowerShell)

Write-Host "🚀 Starting StudyFlow Production Build & Deployment Process..." -ForegroundColor Cyan

# 1. Verify Backend Build
Write-Host "`n📦 [1/4] Verifying Backend TypeScript Build..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 2. Verify Frontend Build
Write-Host "`n📦 [2/4] Verifying Frontend React Build..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# 3. Deploy Database Migrations
Write-Host "`n🗄️ [3/4] Applying PostgreSQL Prisma Migrations..." -ForegroundColor Yellow
Set-Location backend
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma migration failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`n✅ StudyFlow is built and deployment-ready!" -ForegroundColor Green
Write-Host "📌 To run containerized production deployment with Docker Compose:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml up --build -d" -ForegroundColor White
