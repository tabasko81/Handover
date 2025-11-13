@echo off
echo ========================================
echo   Shift Handover Log - Docker Status
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo.
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo Please start Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo Docker Status:
docker --version
echo.
echo Docker Compose Status:
docker-compose --version
echo.

echo ========================================
echo   Container Status
echo ========================================
echo.
docker-compose ps
echo.

echo ========================================
echo   Container Health
echo ========================================
echo.
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ========================================
echo   Application URLs
echo ========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000/api
echo Health:    http://localhost:5000/api/health
echo.

REM Check if containers are running
docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Application is running!
) else (
    echo [WARNING] Application is not running.
    echo Run docker-start.bat to start it.
)
echo.
pause

