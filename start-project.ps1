# ============================================
# AttendAI - Start All Services
# ============================================

$ROOT = "C:\Users\dsing\OneDrive\Desktop\Attendance project"

Write-Host ""
Write-Host "============================================"
Write-Host "       AttendAI Attendance System"
Write-Host "============================================"
Write-Host ""

# Backend
Write-Host "[1/4] Starting Backend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$ROOT\backend'; node server.js"
)

# AI Service
Write-Host "[2/4] Starting AI Face Service..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$ROOT\ai-service'; .\venv\Scripts\python.exe .\app.py"
)

# Frontend
Write-Host "[3/4] Starting Frontend..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$ROOT\frontend2_final'; npm run dev"
)

# Ngrok
Write-Host "[4/4] Starting Ngrok Tunnel..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "ngrok http 5173"
)

Write-Host ""
Write-Host "All services are starting..." -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 5

Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Frontend : http://localhost:5173"
Write-Host "Backend  : http://localhost:5000"
Write-Host "AI       : http://127.0.0.1:5001"
Write-Host "Ngrok    : http://127.0.0.1:4040"
Write-Host ""
Write-Host "AttendAI started." -ForegroundColor Green