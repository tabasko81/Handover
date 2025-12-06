@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   Setup Auto-Start for Handover Server
echo ========================================
echo.
echo This will configure the server to start automatically
echo when your computer boots up.
echo.
echo Press any key to continue...
pause >nul
echo.

REM Get current directory (where this script is located)
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

REM Check if executables exist
set GUI_EXE=%SCRIPT_DIR%\HandoverServer.exe
set CLI_EXE=%SCRIPT_DIR%\HandoverServerCLI.exe

if not exist "%GUI_EXE%" if not exist "%CLI_EXE%" (
    echo [ERROR] Could not find HandoverServer.exe or HandoverServerCLI.exe
    echo        Make sure you're running this script from the dist folder.
    echo.
    pause
    exit /b 1
)

REM Check if task already exists
schtasks /Query /TN "HandoverServer" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Auto-start is already configured!
    echo.
    set /p remove="Do you want to remove the existing configuration? (Y/N): "
    if /i "!remove!"=="Y" (
        echo.
        echo Removing existing configuration...
        schtasks /Delete /TN "HandoverServer" /F >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo [OK] Existing configuration removed.
            echo.
        ) else (
            echo [ERROR] Failed to remove existing configuration.
            echo        You may need to run this script as Administrator.
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Keeping existing configuration. Exiting.
        echo.
        pause
        exit /b 0
    )
)

REM Choose executable type
echo ========================================
echo   Choose Server Type:
echo ========================================
echo.
echo 1. GUI Version (HandoverServer.exe)
echo    - Shows a graphical window
echo    - Easier to use and monitor
echo    - Recommended for most users
echo.
echo 2. CLI Version (HandoverServerCLI.exe)
echo    - Terminal/command-line only
echo    - No window, runs in background
echo    - Better for servers
echo.
set /p choice="Enter your choice (1 or 2): "

if "!choice!"=="1" (
    set "EXE_PATH=%GUI_EXE%"
    set "EXE_NAME=HandoverServer"
    set "TASK_NAME=HandoverServer"
    if not exist "%GUI_EXE%" (
        echo [ERROR] HandoverServer.exe not found!
        pause
        exit /b 1
    )
) else if "!choice!"=="2" (
    set "EXE_PATH=%CLI_EXE%"
    set "EXE_NAME=HandoverServerCLI"
    set "TASK_NAME=HandoverServer"
    if not exist "%CLI_EXE%" (
        echo [ERROR] HandoverServerCLI.exe not found!
        pause
        exit /b 1
    )
) else (
    echo [ERROR] Invalid choice. Exiting.
    pause
    exit /b 1
)

echo.
echo Selected: %EXE_NAME%
echo.

REM Get port from config or ask user
set PORT=8500
set CONFIG_FILE=%SCRIPT_DIR%\server_config.json
set DEFAULT_CONFIG_FILE=%SCRIPT_DIR%\server_default_config.json

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
set /p port_input="Enter port number [%PORT%]: "
if not "!port_input!"=="" (
    set PORT=!port_input!
)

REM Ask about delay
echo.
set /p delay_choice="Add delay after startup? (Y/N) [N]: "
if /i "!delay_choice!"=="Y" (
    set /p delay_seconds="Enter delay in seconds [30]: "
    if "!delay_seconds!"=="" set delay_seconds=30
    set DELAY_OPTION=/DELAY 0000:!delay_seconds!
) else (
    set DELAY_OPTION=
)

echo.
echo ========================================
echo   Configuration Summary:
echo ========================================
echo.
echo Executable: %EXE_NAME%
echo Port: %PORT%
if not "!DELAY_OPTION!"=="" (
    echo Delay: !delay_seconds! seconds
) else (
    echo Delay: None
)
echo.
echo The server will start automatically when your computer boots up.
echo.

set /p confirm="Continue with setup? (Y/N): "
if /i not "!confirm!"=="Y" (
    echo.
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo Creating scheduled task...
echo.

REM Build the command
if "!EXE_NAME!"=="HandoverServerCLI" (
    set "TASK_COMMAND=\"%EXE_PATH%\" %PORT%"
) else (
    set "TASK_COMMAND=\"%EXE_PATH%\""
)

REM Create the scheduled task
REM /SC ONSTART = Run at system startup
REM /RL HIGHEST = Run with highest privileges
REM /F = Force (overwrite if exists)
REM /TR = Task to run (the executable)

schtasks /Create /TN "%TASK_NAME%" /TR "%TASK_COMMAND%" /SC ONSTART /RL HIGHEST %DELAY_OPTION% /F

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   [SUCCESS] Auto-start configured!
    echo ========================================
    echo.
    echo The server will now start automatically when your computer boots up.
    echo.
    echo To test:
    echo   1. Restart your computer
    echo   2. Wait for the server to start (check after login)
    echo   3. Open http://localhost:%PORT% in your browser
    echo.
    echo To disable auto-start, run: remove-auto-start.bat
    echo.
) else (
    echo.
    echo ========================================
    echo   [ERROR] Failed to create scheduled task
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




