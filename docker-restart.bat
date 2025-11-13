@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Shift Handover Log - Docker Restart
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker daemon is running
echo.

REM Check for existing containers
echo Checking for existing containers...
docker-compose ps 2>nul | findstr /C:"handover" >nul 2>&1
if %errorlevel% equ 0 (
    echo Found existing containers, stopping them...
    docker-compose down
    if %errorlevel% neq 0 (
        echo [WARNING] Failed to stop some containers, trying force stop...
        docker-compose down --remove-orphans
    )
) else (
    echo No existing containers found
)
echo.

REM Check if ports are in use
echo Checking if ports are available...
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 3000 is already in use!
    echo This may prevent the frontend from starting.
    echo.
)
netstat -ano | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Port 5000 is already in use!
    echo This may prevent the backend from starting.
    echo.
)

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting containers...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to restart containers!
    echo.
    echo Troubleshooting:
    echo   1. Check if ports 3000 and 5000 are free
    echo   2. Check Docker Desktop is fully started
    echo   3. Try running: docker-compose down
    echo   4. Check logs with: docker-logs.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Containers started!
echo.
echo Waiting for services to be ready...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   Application Status
echo ========================================
echo.
docker-compose ps
echo.

REM Check if containers are actually running
docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Containers are running!
    echo.
    echo Application is available at:
    echo   Frontend: http://localhost:3000
    echo   Backend:  http://localhost:5000/api
    echo   Health:   http://localhost:5000/api/health
) else (
    echo [WARNING] Containers may not be running properly
    echo Check logs with: docker-logs.bat
)
echo.
pause

