@echo off
echo ========================================
echo   Open Firewall Port for Handover Server
echo ========================================
echo.

REM Get port from config or use default
set PORT=8500
set CONFIG_FILE=server_config.json
set DEFAULT_CONFIG_FILE=server_default_config.json

REM Try to read from server_config.json first
if exist "%CONFIG_FILE%" (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"port" "%CONFIG_FILE%" 2^>nul') do (
        set PORT=%%a
        set PORT=!PORT: =!
        set PORT=!PORT:"=!
    )
)

REM If not found, try server_default_config.json
if "%PORT%"=="8500" if exist "%DEFAULT_CONFIG_FILE%" (
    for /f "tokens=2 delims=:," %%a in ('findstr /C:"default_port" "%DEFAULT_CONFIG_FILE%" 2^>nul') do (
        set PORT=%%a
        set PORT=!PORT: =!
        set PORT=!PORT:"=!
    )
)

echo Detected port: %PORT%
echo.
echo This will open port %PORT% in Windows Firewall.
echo You may be prompted for administrator privileges.
echo.

REM Check if rule already exists
powershell -Command "Get-NetFirewallRule -DisplayName 'Handover Server' -ErrorAction SilentlyContinue" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Firewall rule already exists.
    echo        Removing old rule first...
    powershell -Command "Remove-NetFirewallRule -DisplayName 'Handover Server' -ErrorAction SilentlyContinue" >nul 2>&1
    echo.
)

echo Creating firewall rule...
echo.

REM Create firewall rule using PowerShell (requires admin)
powershell -Command "Start-Process powershell -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName \"Handover Server\" -Direction Inbound -LocalPort %PORT% -Protocol TCP -Action Allow -Description \"Allow inbound connections for Shift Handover Log server on port %PORT%\"' -Verb RunAs"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   [SUCCESS] Firewall rule created!
    echo ========================================
    echo.
    echo Port %PORT% is now open in Windows Firewall.
    echo Other computers on your network can now access the server.
    echo.
) else (
    echo.
    echo ========================================
    echo   [ERROR] Failed to create firewall rule
    echo ========================================
    echo.
    echo Please try running this script as Administrator:
    echo   1. Right-click on this file
    echo   2. Select "Run as administrator"
    echo   3. Click "Yes" when prompted
    echo.
)

pause




