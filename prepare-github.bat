@echo off
echo ========================================
echo Preparing project for GitHub
echo ========================================
echo.

echo Step 1: Checking Git configuration...
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git user not configured
    echo.
    echo Please run: setup-git.bat
    echo OR manually configure with:
    echo   git config --global user.name "tabasko81"
    echo   git config --global user.email "miguelsilva2013@gmail.com"
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Git configured
    git config user.name
    git config user.email
)

echo.
echo Step 2: Adding all files...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] Files added

echo.
echo Step 3: Creating initial commit...
git commit -m "Initial commit: Shift Handover Log Web Application"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create commit
    pause
    exit /b 1
)
echo [OK] Commit created

echo.
echo ========================================
echo Ready for GitHub!
echo ========================================
echo.
echo Next steps:
echo 1. Create a repository on GitHub.com
echo 2. Run the commands shown on GitHub
echo    (or see GITHUB_SETUP.md for details)
echo.
echo Example commands (replace YOUR_USERNAME):
echo   git remote add origin https://github.com/YOUR_USERNAME/shift-handover-log.git
echo   git branch -M main
echo   git push -u origin main
echo.
pause

