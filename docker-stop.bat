@echo off
echo ========================================
echo   Shift Handover Log - Docker Stop
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo Containers may already be stopped.
    echo.
    pause
    exit /b 1
)

REM Check if containers are running
docker-compose ps 2>nul | findstr /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] No containers are currently running.
    echo.
    pause
    exit /b 0
)

echo Current running containers:
docker-compose ps
echo.
echo Stopping containers...
echo.

docker-compose down

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to stop containers!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Containers stopped successfully!
echo.
echo To start again, run: docker-start.bat
echo.
pause


