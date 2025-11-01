@echo off
echo Git Configuration Setup
echo.
echo Please enter your Git information:
echo.
set /p GIT_NAME="Your Name: "
set /p GIT_EMAIL="Your Email: "

git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo Git configured successfully!
echo Name: %GIT_NAME%
echo Email: %GIT_EMAIL%
echo.
echo You can now run: git commit -m "Initial commit"
echo.
pause

