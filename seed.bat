@echo off
echo Seeding database with sample data...
call npm run seed
if %errorlevel% neq 0 (
    echo Error seeding database
    pause
    exit /b %errorlevel%
)
echo Sample data seeded successfully!
pause

