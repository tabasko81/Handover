@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Shift Handover Log - Build & Deploy
echo ========================================
echo.
echo This script will:
echo   1. Stop existing containers
echo   2. Build Docker images
echo   3. Deploy and start containers
echo   4. Verify deployment
echo.
echo ========================================
echo.

REM Check if Docker is installed
echo [1/6] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
docker --version
echo [OK] Docker is installed
echo.

REM Check if Docker is running
echo [2/6] Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo.
    echo Please:
    echo 1. Start Docker Desktop
    echo 2. Wait for it to fully start (whale icon in system tray should be stable)
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)
echo [OK] Docker daemon is running
echo.

REM Stop existing containers
echo [3/6] Stopping existing containers (if any)...
docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% equ 0 (
    echo Containers are running, stopping them...
    docker-compose down
    if %errorlevel% neq 0 (
        echo [WARNING] Failed to stop some containers, continuing anyway...
    ) else (
        echo [OK] Containers stopped
    )
) else (
    echo [INFO] No running containers found
)
echo.

REM Clean up old images (optional, but helps with fresh build)
echo [4/6] Preparing for build...
echo Cleaning up old build cache...
docker builder prune -f >nul 2>&1
echo [OK] Ready to build
echo.

REM Build images
echo [5/6] Building Docker images...
echo This may take several minutes on first build...
echo.
docker-compose build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Check the error messages above for details.
    echo Common issues:
    echo   - Network connectivity problems
    echo   - Insufficient disk space
    echo   - Docker Desktop not fully started
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Images built successfully!
echo.

REM Start containers
echo [6/6] Deploying and starting containers...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers!
    echo.
    echo Check the error messages above.
    echo Try running: docker-compose logs
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Containers deployed and started!
echo.

REM Wait for services to be ready
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check container status
echo.
echo ========================================
echo   Deployment Status
echo ========================================
echo.
docker-compose ps
echo.

REM Health check
echo Checking service health...
timeout /t 2 /nobreak >nul

docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] All containers are running!
    echo.
    
    REM Try to check backend health (curl may not be available on Windows)
    echo Checking backend health endpoint...
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { Write-Host '[OK] Backend is responding' } } catch { Write-Host '[WARNING] Backend health check failed (may need more time)' }" 2>nul || echo [INFO] Health check skipped (PowerShell may not be available)
) else (
    echo [WARNING] Some containers may not be running properly
    echo Check logs with: docker-logs.bat
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Application Access:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:5000/api
echo   Health:    http://localhost:5000/api/health
echo.
echo Useful Commands:
echo   View logs:     docker-logs.bat
echo   Stop:          docker-stop.bat
echo   Restart:       docker-restart.bat
echo   Status:        docker-status.bat
echo.
echo ========================================
echo.
echo Deployment completed successfully!
echo.
pause

