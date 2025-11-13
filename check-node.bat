@echo off
echo Checking Node.js installation...
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    echo After installation, close and reopen this terminal, then run this script again.
    pause
    exit /b 1
) else (
    echo [OK] Node.js is installed
    node -v
)

npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is NOT available
    pause
    exit /b 1
) else (
    echo [OK] npm is installed
    npm -v
)

echo.
echo Node.js installation verified successfully!
echo.
echo You can now run:
echo   install.bat    - to install dependencies
echo   setup-db.bat   - to setup the database
echo   start.bat      - to start the application
echo.
pause

