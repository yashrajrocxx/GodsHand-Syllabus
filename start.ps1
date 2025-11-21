# Quick Start Script for God's Hand
# This script helps you launch the application quickly

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GOD'S HAND - Human Evolution Manual" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
$pythonExists = Get-Command python -ErrorAction SilentlyContinue

# Check if Node.js is available
$nodeExists = Get-Command node -ErrorAction SilentlyContinue

# Check if PHP is available
$phpExists = Get-Command php -ErrorAction SilentlyContinue

Write-Host "📋 Available Options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Open directly in browser (Basic mode)" -ForegroundColor White
if ($pythonExists) {
    Write-Host "[2] Start with Python server (Recommended)" -ForegroundColor Green
} else {
    Write-Host "[2] Python server (Not installed)" -ForegroundColor DarkGray
}
if ($nodeExists) {
    Write-Host "[3] Start with Node.js server" -ForegroundColor Green
} else {
    Write-Host "[3] Node.js server (Not installed)" -ForegroundColor DarkGray
}
if ($phpExists) {
    Write-Host "[4] Start with PHP server" -ForegroundColor Green
} else {
    Write-Host "[4] PHP server (Not installed)" -ForegroundColor DarkGray
}
Write-Host "[5] View file structure" -ForegroundColor White
Write-Host "[6] Read documentation" -ForegroundColor White
Write-Host "[0] Exit" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Select option"

switch ($choice) {
    "1" {
        Write-Host "🚀 Opening in default browser..." -ForegroundColor Green
        Start-Process "index.html"
        Write-Host "✅ Opened! (Limited functionality without server)" -ForegroundColor Yellow
    }
    "2" {
        if ($pythonExists) {
            Write-Host "🚀 Starting Python server on http://localhost:8000" -ForegroundColor Green
            Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
            Write-Host ""
            Start-Process "http://localhost:8000"
            python -m http.server 8000
        } else {
            Write-Host "❌ Python not found. Please install Python first." -ForegroundColor Red
        }
    }
    "3" {
        if ($nodeExists) {
            Write-Host "🚀 Starting Node.js server on http://localhost:8080" -ForegroundColor Green
            Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
            Write-Host ""
            Start-Process "http://localhost:8080"
            npx http-server -p 8080
        } else {
            Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
        }
    }
    "4" {
        if ($phpExists) {
            Write-Host "🚀 Starting PHP server on http://localhost:8000" -ForegroundColor Green
            Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
            Write-Host ""
            Start-Process "http://localhost:8000"
            php -S localhost:8000
        } else {
            Write-Host "❌ PHP not found. Please install PHP first." -ForegroundColor Red
        }
    }
    "5" {
        Write-Host ""
        Write-Host "📂 Project Structure:" -ForegroundColor Cyan
        tree /F /A
    }
    "6" {
        Write-Host "📖 Opening documentation..." -ForegroundColor Green
        if (Test-Path "README.md") { Start-Process "README.md" }
        if (Test-Path "SETUP.md") { Start-Process "SETUP.md" }
    }
    "0" {
        Write-Host "👋 Goodbye!" -ForegroundColor Cyan
        exit
    }
    default {
        Write-Host "❌ Invalid option. Please try again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
