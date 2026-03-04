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

echo Setting up database...
call npm run setup-db
if %errorlevel% neq 0 (
    echo Error setting up database
    pause
    exit /b %errorlevel%
)
echo Database setup complete!
pause

