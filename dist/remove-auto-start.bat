@echo off
echo ========================================
echo   Remove Auto-Start for Handover Server
echo ========================================
echo.
echo This will remove the automatic startup configuration.
echo The server will no longer start automatically when your computer boots.
echo.
echo Press any key to continue...
pause >nul
echo.

REM Check if task exists
schtasks /Query /TN "HandoverServer" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Auto-start is not configured.
    echo        Nothing to remove.
    echo.
    pause
    exit /b 0
)

echo [INFO] Found auto-start configuration.
echo.
set /p confirm="Are you sure you want to remove auto-start? (Y/N): "

if /i not "%confirm%"=="Y" (
    echo.
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Removing auto-start configuration...
echo.

schtasks /Delete /TN "HandoverServer" /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   [SUCCESS] Auto-start removed!
    echo ========================================
    echo.
    echo The server will no longer start automatically.
    echo You can still start it manually by running HandoverServer.exe
    echo.
    echo To re-enable auto-start, run: setup-auto-start.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   [ERROR] Failed to remove scheduled task
    echo ========================================
    echo.
    echo This usually means you need administrator privileges.
    echo.
    echo Please try:
    echo   1. Right-click on this file
    echo   2. Select "Run as administrator"
    echo   3. Click "Yes" when prompted
    echo   4. Run this script again
    echo.
)

pause




