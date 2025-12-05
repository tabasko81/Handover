@echo off
echo ========================================
echo Create CLI Server Executable
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

echo Creating CLI executable...
echo.

REM Create executable with PyInstaller
REM --onefile: creates a single executable file
REM --console: shows console window (for CLI)
REM --name: executable name
REM --clean: clean cache before building

python -m PyInstaller --onefile --console --name "HandoverServerCLI" --clean server-cli.py

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
    pause
    exit /b 1
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
    pause
    exit /b 1
)

REM Copy default config file
if exist "server_default_config.json" (
    echo Copying 'server_default_config.json'...
    copy "server_default_config.json" "dist\server_default_config.json" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] server_default_config.json copied.
    ) else (
        echo   [WARNING] Error copying server_default_config.json
    )
) else (
    echo [WARNING] server_default_config.json not found!
    echo          Creating default config file...
    echo {> "dist\server_default_config.json"
    echo   "default_port": 8500>> "dist\server_default_config.json"
    echo }>> "dist\server_default_config.json"
    echo   [OK] Default config file created.
)

REM Install Node.js dependencies
echo.
echo ========================================
echo Installing Node.js dependencies...
echo ========================================
echo.

cd dist

REM First, try to copy node_modules from root if it exists (much faster)
if exist "..\node_modules" (
    echo Copying existing node_modules from root folder...
    echo This is faster than downloading packages again.
    echo.
    xcopy /E /I /Y /Q "..\node_modules" "node_modules" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] node_modules copied from root folder.
        echo.
        echo Verifying installation...
        if exist "node_modules\express" (
            echo   [OK] Express module found.
            echo   [OK] Dependencies ready!
            cd ..
            goto :deps_ok
        ) else (
            echo   [WARNING] Express not found, will reinstall...
            rmdir /S /Q "node_modules" >nul 2>&1
        )
    ) else (
        echo   [INFO] Could not copy node_modules, will install fresh...
    )
    echo.
)

REM Check if node_modules already exists in dist
if exist "node_modules\express" (
    echo node_modules already exists with express module.
    echo   [OK] Dependencies ready!
    cd ..
    goto :deps_ok
)

REM Install dependencies using npm
echo Installing dependencies from package.json...
echo This may take a few minutes depending on internet speed...
echo.

REM Check if we have portable Node.js
if exist "..\nodejs\npm.cmd" (
    echo Using portable Node.js from parent folder...
    call ..\nodejs\npm.cmd install --production --no-optional --loglevel=error
) else if exist "nodejs\npm.cmd" (
    echo Using portable Node.js from dist...
    call nodejs\npm.cmd install --production --no-optional --loglevel=error
) else (
    echo Using system Node.js...
    call npm install --production --no-optional --loglevel=error
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo [ERROR] Failed to install dependencies!
    echo ========================================
    echo.
    echo The server will NOT work without node_modules.
    echo.
    echo Please check:
    echo   1. Node.js is available (portable in nodejs/ or system install)
    echo   2. Internet connection for downloading packages
    echo   3. package.json exists in dist folder
    echo   4. Antivirus is not blocking npm
    echo.
    echo You can try installing manually:
    echo   cd dist
    echo   npm install --production
    echo.
    cd ..
    pause
    exit /b 1
)

REM Verify installation was successful
echo.
echo Verifying installation...
if not exist "node_modules" (
    echo   [ERROR] node_modules folder was not created!
    cd ..
    pause
    exit /b 1
)

if not exist "node_modules\express" (
    echo   [ERROR] Express module not found after installation!
    echo          Installation may have failed silently.
    cd ..
    pause
    exit /b 1
)

echo   [OK] Express module found.
echo   [OK] Dependencies installed successfully!

:deps_ok
REM Ensure we're back in the project root directory
cd /d %~dp0

REM Build frontend with relative URLs for dist
echo.
echo ========================================
echo Building Frontend for Distribution
echo ========================================
echo.

cd client

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js not found in PATH!
    echo           Trying to use portable Node.js...
    if exist "..\nodejs\node.exe" (
        set PATH=..\nodejs;%PATH%
    ) else if exist "nodejs\node.exe" (
        set PATH=nodejs;%PATH%
    ) else (
        echo [ERROR] Node.js not found!
        echo         Cannot build frontend.
        echo         Please install Node.js or run 'rebuild-frontend.bat' first.
        cd ..
        pause
        exit /b 1
    )
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
        echo [ERROR] Failed to install dependencies!
        cd ..
        pause
        exit /b 1
    )
    echo.
)

REM Compile the frontend
echo Compiling frontend (this may take a few minutes)...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to compile frontend!
    cd ..
    pause
    exit /b 1
)

echo   [OK] Frontend compiled successfully!
cd /d %~dp0

REM Copy client/build folder
echo.
echo Current directory: %CD%
echo Checking for client\build...
if exist "client\build" (
    echo   [OK] client\build found!
    echo.
    echo Copying 'client\build' folder to dist...
    
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
    
    REM Copy using xcopy with verbose output
    echo Copying files from client\build to dist\client\build...
    xcopy /E /I /Y /H "client\build\*" "dist\client\build\"
    if %ERRORLEVEL% EQU 0 (
        REM Verify index.html was copied
        if exist "dist\client\build\index.html" (
            echo   [OK] Folder 'client\build' copied successfully!
        ) else (
            echo   [WARNING] Files copied but index.html not found.
            echo            Trying alternative method...
            rmdir /S /Q "dist\client\build" >nul 2>&1
            xcopy /E /I /Y /H "client\build" "dist\client\"
            if exist "dist\client\build\index.html" (
                echo   [OK] Folder 'client\build' copied (alternative method).
            ) else (
                echo   [ERROR] Failed to copy 'client\build' folder!
                echo          Source: %CD%\client\build
                echo          Destination: %CD%\dist\client\build
                pause
                exit /b 1
            )
        )
    ) else (
        echo   [WARNING] xcopy failed (Error code: %ERRORLEVEL%)
        echo            Trying alternative method...
        if exist "dist\client\build" rmdir /S /Q "dist\client\build" >nul 2>&1
        xcopy /E /I /Y /H "client\build" "dist\client\"
        if %ERRORLEVEL% EQU 0 (
            if exist "dist\client\build\index.html" (
                echo   [OK] Folder 'client\build' copied (alternative method).
            ) else (
                echo   [ERROR] Failed to copy 'client\build' folder!
                echo          Source: %CD%\client\build
                echo          Destination: %CD%\dist\client\build
                pause
                exit /b 1
            )
        ) else (
            echo   [ERROR] Failed to copy 'client\build' folder! (Error code: %ERRORLEVEL%)
            echo          Source: %CD%\client\build
            echo          Destination: %CD%\dist\client\build
            echo.
            echo Please check:
            echo   1. Source folder exists: client\build
            echo   2. Destination folder can be created: dist\client\build
            echo   3. No file locks on source or destination
            pause
            exit /b 1
        )
    )
) else (
    echo [ERROR] Folder 'client\build' not found after compilation!
    echo        Current directory: %CD%
    echo        Expected: %CD%\client\build
    pause
    exit /b 1
)

REM Copy config example file if it exists
if exist "data\config.json.example" (
    if not exist "dist\data\config.json" (
        copy "data\config.json.example" "dist\data\config.json.example" >nul
        echo   [OK] Config example file copied.
    )
)

REM Copy helper scripts
echo.
echo Copying helper scripts...
if exist "dist\open-firewall-port.bat" (
    copy "dist\open-firewall-port.bat" "dist\open-firewall-port.bat.bak" >nul 2>&1
)
if exist "dist\find-my-ip.bat" (
    copy "dist\find-my-ip.bat" "dist\find-my-ip.bat.bak" >nul 2>&1
)
if exist "dist\setup-auto-start.bat" (
    copy "dist\setup-auto-start.bat" "dist\setup-auto-start.bat.bak" >nul 2>&1
)
if exist "dist\remove-auto-start.bat" (
    copy "dist\remove-auto-start.bat" "dist\remove-auto-start.bat.bak" >nul 2>&1
)

REM Note: Helper scripts should be created manually in dist/ folder
REM They are not copied from root because they are distribution-specific
echo   [INFO] Helper scripts should be in dist/ folder:
echo          - open-firewall-port.bat
echo          - find-my-ip.bat
echo          - setup-auto-start.bat
echo          - remove-auto-start.bat
echo          - README.md
echo.
echo   If these files don't exist, copy them from the dist/ folder
echo   or create them using the templates in the project.

echo.
echo ========================================
echo CLI Executable created successfully!
echo ========================================
echo.
echo The executable and files are in: dist\
echo.
echo Structure created:
echo   dist\
echo   +-- HandoverServerCLI.exe
echo   +-- nodejs\
echo   +-- server\
echo   +-- client\build\
echo   +-- data\
echo   +-- node_modules\
echo.
echo Usage:
echo   HandoverServerCLI.exe [port]
echo.
echo Examples:
echo   HandoverServerCLI.exe          (uses default port 8500)
echo   HandoverServerCLI.exe 9000     (uses port 9000)
echo.
echo You can distribute the entire 'dist\' folder as a complete package!
echo.

pause

