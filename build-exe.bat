@echo off
echo ========================================
echo Criar Executavel do Servidor Python
echo ========================================
echo.

REM Verificar se Python esta instalado
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.8 ou superior de:
    echo   https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

REM Verificar se PyInstaller esta instalado
python -c "import PyInstaller" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo PyInstaller nao encontrado. A instalar...
    echo.
    python -m pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERRO: Falha ao instalar PyInstaller!
        echo.
        echo Por favor, instale manualmente:
        echo   python -m pip install pyinstaller
        echo.
        pause
        exit /b 1
    )
    echo.
    echo PyInstaller instalado com sucesso!
    echo.
) else (
    echo PyInstaller ja esta instalado.
    echo.
)

echo Criando executavel...
echo.

REM Criar executavel com PyInstaller
REM --onefile: cria um unico ficheiro executavel
REM --windowed: nao mostra janela de console (GUI only)
REM --name: nome do executavel
REM --icon: opcional, pode adicionar um ficheiro .ico se tiver
REM --add-data: adicionar dados se necessario
REM --hidden-import: importar modulos ocultos se necessario

python -m PyInstaller --onefile --windowed --name "HandoverServer" --clean server.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERRO ao criar executavel!
    echo ========================================
    echo.
    echo Verifique os erros acima e tente novamente.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Copiando ficheiros necessarios...
echo ========================================
echo.

REM Criar pasta data se nao existir
if not exist "dist\data" (
    mkdir "dist\data"
    echo Pasta 'data' criada.
)

REM Copiar pasta nodejs
if exist "nodejs" (
    echo Copiando pasta 'nodejs'...
    xcopy /E /I /Y "nodejs" "dist\nodejs" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Pasta 'nodejs' copiada.
    ) else (
        echo   [AVISO] Erro ao copiar pasta 'nodejs'
    )
) else (
    echo [AVISO] Pasta 'nodejs' nao encontrada!
    echo          O executavel precisa de Node.js portatil nesta pasta.
)

REM Copiar pasta server
if exist "server" (
    echo Copiando pasta 'server'...
    xcopy /E /I /Y "server" "dist\server" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Pasta 'server' copiada.
    ) else (
        echo   [AVISO] Erro ao copiar pasta 'server'
    )
) else (
    echo [ERRO] Pasta 'server' nao encontrada!
    echo        Esta pasta e essencial para o funcionamento.
)

REM Copiar pasta client/build
if exist "client\build" (
    echo Copiando pasta 'client\build'...
    if not exist "dist\client" mkdir "dist\client"
    xcopy /E /I /Y "client\build" "dist\client\build" >nul
    if %ERRORLEVEL% EQU 0 (
        echo   [OK] Pasta 'client\build' copiada.
    ) else (
        echo   [AVISO] Erro ao copiar pasta 'client\build'
    )
) else (
    echo [ERRO] Pasta 'client\build' nao encontrada!
    echo        O frontend precisa estar compilado.
    echo        Execute 'rebuild-frontend.bat' primeiro.
)

REM Copiar ficheiro de config exemplo se existir
if exist "data\config.json.example" (
    if not exist "dist\data\config.json" (
        copy "data\config.json.example" "dist\data\config.json.example" >nul
        echo   [OK] Ficheiro de config exemplo copiado.
    )
)

echo.
echo ========================================
echo Executavel criado com sucesso!
echo ========================================
echo.
echo O executavel e ficheiros estao em: dist\
echo.
echo Estrutura criada:
echo   dist\
echo   +-- HandoverServer.exe
echo   +-- nodejs\
echo   +-- server\
echo   +-- client\build\
echo   +-- data\
echo.
echo Pode distribuir toda a pasta 'dist\' como um pacote completo!
echo.

pause

