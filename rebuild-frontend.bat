@echo off
echo ========================================
echo Rebuild Frontend with Relative URL
echo ========================================
echo.
echo This script rebuilds the frontend to use relative URLs (/api)
echo instead of absolute URLs (http://localhost:5000/api).
echo.
echo This allows the server to work on any port.
echo.

cd client

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found!
    echo.
    echo Please make sure that:
    echo 1. Node.js is installed OR
    echo 2. Portable Node.js is in the nodejs/ folder
    echo.
    pause
    exit /b 1
)

REM Set REACT_APP_API_URL as relative URL to work on any port
set REACT_APP_API_URL=/api

echo Configuration:
echo   REACT_APP_API_URL=%REACT_APP_API_URL%
echo.

REM Install dependencies if necessary
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
)

REM Compile the frontend
echo Compiling frontend (this may take a few minutes)...
echo.
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Frontend compiled successfully!
    echo ========================================
    echo.
    echo The API now uses relative URLs (/api) and will work on any port.
    echo.
    echo Next steps:
    echo 1. Stop the Python server (if running)
    echo 2. Start the Python server again
    echo 3. The application should work without network errors
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR compiling frontend!
    echo ========================================
    echo.
    echo Check the errors above and try again.
    echo.
    pause
    exit /b 1
)

cd ..
pause
