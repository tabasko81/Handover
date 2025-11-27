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

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Executavel criado com sucesso!
    echo ========================================
    echo.
    echo O executavel esta em: dist\HandoverServer.exe
    echo.
    echo IMPORTANTE: O executavel ainda precisa de:
    echo   1. Pasta 'nodejs/' com Node.js portatil
    echo   2. Pasta 'server/' com o codigo do servidor
    echo   3. Pasta 'client/build/' com o frontend compilado
    echo   4. Pasta 'data/' (sera criada automaticamente)
    echo.
    echo Coloque o executavel na pasta raiz do projeto junto com estas pastas.
    echo.
) else (
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

pause

