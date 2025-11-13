@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Shift Handover Log - Docker Start
echo ========================================
echo.

REM Check if Docker is installed
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

REM Check if Docker is running
echo Checking Docker daemon...
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

echo [OK] Docker is running
echo.

REM Check if containers are already running
docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Containers are already running!
    echo.
    echo Current status:
    docker-compose ps
    echo.
    set /p restart="Do you want to restart? (y/n): "
    if /i "!restart!"=="y" (
        echo Stopping existing containers...
        docker-compose down
        echo.
    ) else (
        echo Keeping existing containers running.
        echo.
        goto :show_info
    )
)

echo Building and starting containers...
echo This may take a few minutes on first run...
echo.
docker-compose up -d --build

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
echo [OK] Containers started successfully!
echo.

:show_info
echo Waiting for services to be ready...
timeout /t 3 /nobreak >nul

REM Check container status
docker-compose ps

echo.
echo ========================================
echo   Application Access
echo ========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:5000/api
echo Health:    http://localhost:5000/api/health
echo.
echo ========================================
echo   Useful Commands
echo ========================================
echo.
echo View logs:     docker-logs.bat
echo Stop:          docker-stop.bat
echo Restart:       docker-restart.bat
echo Status:        docker-status.bat
echo.
echo ========================================
echo.
pause

