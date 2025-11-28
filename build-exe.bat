@echo off
echo ========================================
echo Create Python Server Executable
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python not found!
    echo.
    echo Please install Python 3.8 or higher from:
    echo   https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Check if PyInstaller is installed
python -c "import PyInstaller" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PyInstaller not found. Installing...
    echo.
    python -m pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERROR: Failed to install PyInstaller!
        echo.
        echo Please install manually:
        echo   python -m pip install pyinstaller
        echo.
        pause
        exit /b 1
    )
    echo.
    echo PyInstaller installed successfully!
    echo.
) else (
    echo PyInstaller is already installed.
    echo.
)

echo Creating executable...
echo.

REM Create executable with PyInstaller
REM --onefile: creates a single executable file
REM --windowed: doesn't show console window (GUI only)
REM --name: executable name
REM --icon: optional, can add a .ico file if available
REM --add-data: add data if necessary
REM --hidden-import: import hidden modules if necessary

python -m PyInstaller --onefile --windowed --name "HandoverServer" --clean server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR creating executable!
    echo ========================================
    echo.
    echo Check the errors above and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Copying required files...
echo ========================================
echo.

REM Create data folder if it doesn't exist
if not exist "dist\data" (
    mkdir "dist\data"
    echo Folder 'data' created.
)

REM Copy nodejs folder
if exist "nodejs" (
    echo Copying 'nodejs' folder...
    xcopy /E /I /Y "nodejs" "dist\nodejs" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Folder 'nodejs' copied.
    ) else (
        echo   [WARNING] Error copying 'nodejs' folder
    )
) else (
    echo [WARNING] Folder 'nodejs' not found!
    echo          The executable needs portable Node.js in this folder.
)

REM Copy server folder
if exist "server" (
    echo Copying 'server' folder...
    xcopy /E /I /Y "server" "dist\server" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Folder 'server' copied.
    ) else (
        echo   [WARNING] Error copying 'server' folder
    )
) else (
    echo [ERROR] Folder 'server' not found!
    echo        This folder is essential for operation.
)

REM Copy package.json for dependencies
if exist "package.json" (
    echo Copying 'package.json'...
    copy "package.json" "dist\package.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] package.json copied.
    ) else (
        echo   [WARNING] Error copying package.json
    )
) else (
    echo [ERROR] package.json not found!
    echo        This file is essential for installing dependencies.
)

REM Install Node.js dependencies
echo.
echo Installing Node.js dependencies...
echo This may take a few minutes...
echo.

cd dist

REM Check if we have portable Node.js
if exist "..\nodejs\npm.cmd" (
    echo Using portable Node.js...
    call ..\nodejs\npm.cmd install --production
) else if exist "nodejs\npm.cmd" (
    echo Using portable Node.js from dist...
    call nodejs\npm.cmd install --production
) else (
    echo Using system Node.js...
    call npm install --production
)

if %ERRORLEVEL% EQU 0 (
    echo   [OK] Dependencies installed successfully.
) else (
    echo   [WARNING] Error installing dependencies.
    echo            The server may not work without node_modules.
)

cd ..

REM Copy client/build folder
if exist "client\build" (
    echo Copying 'client\build' folder...
    if not exist "dist\client" mkdir "dist\client"
    xcopy /E /I /Y "client\build" "dist\client\build" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Folder 'client\build' copied.
    ) else (
        echo   [WARNING] Error copying 'client\build' folder
    )
) else (
    echo [ERROR] Folder 'client\build' not found!
    echo        The frontend needs to be compiled.
    echo        Run 'rebuild-frontend.bat' first.
)

REM Copy config example file if it exists
if exist "data\config.json.example" (
    if not exist "dist\data\config.json" (
        copy "data\config.json.example" "dist\data\config.json.example" >nul
        echo   [OK] Config example file copied.
    )
)

echo.
echo ========================================
echo Executable created successfully!
echo ========================================
echo.
echo The executable and files are in: dist\
echo.
echo Structure created:
echo   dist\
echo   +-- HandoverServer.exe
echo   +-- nodejs\
echo   +-- server\
echo   +-- client\build\
echo   +-- data\
echo.
echo You can distribute the entire 'dist\' folder as a complete package!
echo.

pause
