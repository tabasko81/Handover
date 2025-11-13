@echo off
echo Setting up database...
call npm run setup-db
if %errorlevel% neq 0 (
    echo Error setting up database
    pause
    exit /b %errorlevel%
)
echo Database setup complete!
pause

