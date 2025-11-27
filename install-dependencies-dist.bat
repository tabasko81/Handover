@echo off
echo ========================================
echo Install Dependencies in dist folder
echo ========================================
echo.

if not exist "dist" (
    echo ERROR: dist folder does not exist!
    echo.
    echo This script installs dependencies in dist folder for the .exe version.
    echo If you're running the server normally (not as .exe), dependencies
    echo should already be installed in the root folder.
    echo.
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json not found in root folder!
    echo.
    pause
    exit /b 1
)

echo Copying package.json to dist...
copy "package.json" "dist\package.json" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy package.json
    pause
    exit /b 1
)

echo.
echo Installing dependencies in dist folder...
echo This may take a few minutes...
echo.

cd dist

if exist "..\nodejs\npm.cmd" (
    echo Using portable Node.js...
    call ..\nodejs\npm.cmd install
) else (
    echo Using system Node.js...
    call npm install
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Dependencies installed successfully!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR installing dependencies!
    echo ========================================
    echo.
)

cd ..

pause

