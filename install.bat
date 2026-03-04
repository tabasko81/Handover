@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PORTABLE_NODE=%SCRIPT_DIR%dist\nodejs"

where npm >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%PORTABLE_NODE%\node.exe" (
        if exist "%PORTABLE_NODE%\node_modules\npm\bin\npm-cli.js" (
            set "PATH=%PORTABLE_NODE%;%PATH%"
            echo Using portable Node.js from dist\nodejs
        ) else (
            echo ERROR: dist\nodejs is incomplete - missing node_modules\npm
            echo Run: .\setup-portable-nodejs.ps1 to download complete Node.js
            echo Or install Node.js from nodejs.org
            exit /b 1
        )
    ) else (
        echo ERROR: npm not found. Install Node.js from nodejs.org or run .\setup-portable-nodejs.ps1
        exit /b 1
    )
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing root dependencies
    exit /b %errorlevel%
)

echo Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Error installing client dependencies
    exit /b %errorlevel%
)
echo.
echo Installing react-router-dom...
call npm install react-router-dom
if %errorlevel% neq 0 (
    echo Warning: Failed to install react-router-dom
    echo You may need to install it manually: cd client && npm install react-router-dom
)
cd ..

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Run: .\setup-db.bat
echo 2. Run: .\start.bat

