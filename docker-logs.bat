@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Shift Handover Log - Docker Logs
echo ========================================
echo.
echo Press Ctrl+C to exit
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running!
    echo.
    pause
    exit /b 1
)

REM Check if containers exist
docker-compose ps 2>nul | findstr /C:"handover" /C:"Up" /C:"running" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] No running containers found.
    echo.
    echo Available options:
    echo   1. Start the application with docker-start.bat
    echo   2. View all containers (including stopped): docker ps -a
    echo.
    set /p continue="Continue to view logs anyway? (y/n): "
    if /i not "!continue!"=="y" (
        exit /b 0
    )
)

echo Showing logs for all containers...
echo You can filter by service: docker-compose logs -f backend
echo Or: docker-compose logs -f frontend
echo.
docker-compose logs -f


