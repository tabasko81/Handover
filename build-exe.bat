@echo off
echo ========================================
echo Criar Executavel do Servidor Python
echo ========================================
echo.

REM Verificar se PyInstaller esta instalado
python -c "import PyInstaller" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PyInstaller nao encontrado. A instalar...
    echo.
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERRO: Falha ao instalar PyInstaller!
        echo.
        echo Por favor, instale manualmente:
        echo   pip install pyinstaller
        echo.
        pause
        exit /b 1
    )
    echo.
    echo PyInstaller instalado com sucesso!
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

pyinstaller --onefile --windowed --name "HandoverServer" --clean server.py

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

