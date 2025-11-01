@echo off
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
cd ..

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Run: setup-db.bat
echo 2. Run: start.bat

