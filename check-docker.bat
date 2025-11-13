@echo off
echo Checking Docker installation...
echo.

docker --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker is not installed or not in PATH!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo.
echo Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker daemon is not running!
    echo.
    echo Please:
    echo 1. Start Docker Desktop
    echo 2. Wait for it to fully start (whale icon in system tray should be stable)
    echo 3. Try again
    pause
    exit /b 1
)

echo.
echo Docker is running successfully!
echo.
docker ps
echo.
pause


