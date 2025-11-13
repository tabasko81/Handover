@echo off
echo ========================================
echo   Shift Handover Log - Docker Clean
echo ========================================
echo.
echo WARNING: This will remove:
echo   - All stopped containers
echo   - All unused images
echo   - All unused volumes
echo   - Build cache
echo.
echo Your data in ./data and ./logs will be preserved.
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Stopping containers...
docker-compose down
echo.

echo Removing unused containers, images, and volumes...
docker system prune -f
echo.

echo Removing build cache...
docker builder prune -f
echo.

echo [OK] Cleanup completed!
echo.
echo Note: Your data in ./data and ./logs folders is safe.
echo.
pause

