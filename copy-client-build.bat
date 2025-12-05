@echo off
echo ========================================
echo Copy client/build to dist/client/build
echo ========================================
echo.

REM Ensure we're in project root
cd /d %~dp0

REM Check if client/build exists
if not exist "client\build" (
    echo [ERROR] client\build not found!
    echo        Please compile the frontend first:
    echo        cd client
    echo        npm run build
    pause
    exit /b 1
)

echo [OK] client\build found!
echo.

REM Ensure dist directory exists
if not exist "dist" (
    mkdir "dist"
    echo Created dist directory.
)

REM Remove old build if exists
if exist "dist\client\build" (
    echo Removing old build folder...
    rmdir /S /Q "dist\client\build" >nul 2>&1
)

REM Create destination directory structure
if not exist "dist\client" (
    mkdir "dist\client"
    echo Created dist\client directory.
)
if not exist "dist\client\build" (
    mkdir "dist\client\build"
    echo Created dist\client\build directory.
)

REM Copy files
echo Copying files from client\build to dist\client\build...
xcopy /E /I /Y /H "client\build\*" "dist\client\build\"

if %ERRORLEVEL% EQU 0 (
    REM Verify index.html was copied
    if exist "dist\client\build\index.html" (
        echo.
        echo [OK] client\build copied successfully to dist\client\build!
        echo.
    ) else (
        echo.
        echo [ERROR] Files copied but index.html not found!
        pause
        exit /b 1
    )
) else (
    echo.
    echo [ERROR] Failed to copy files! (Error code: %ERRORLEVEL%)
    pause
    exit /b 1
)

echo.
echo Done!
pause

