@echo off
echo ========================================
echo Recompilando Frontend com URL Relativa
echo ========================================
echo.
echo Este script recompila o frontend para usar URLs relativas (/api)
echo em vez de URLs absolutas (http://localhost:5000/api).
echo.
echo Isso permite que o servidor funcione em qualquer porta.
echo.

cd client

REM Verificar se Node.js está disponível
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, certifique-se de que:
    echo 1. Node.js esta instalado OU
    echo 2. Node.js portatil esta na pasta nodejs/
    echo.
    pause
    exit /b 1
)

REM Definir REACT_APP_API_URL como URL relativa para funcionar em qualquer porta
set REACT_APP_API_URL=/api

echo Configuracao:
echo   REACT_APP_API_URL=%REACT_APP_API_URL%
echo.

REM Instalar dependências se necessário
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo.
)

REM Compilar o frontend
echo Compilando frontend (isto pode demorar alguns minutos)...
echo.
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Frontend compilado com sucesso!
    echo ========================================
    echo.
    echo A API agora usa URLs relativas (/api) e funcionara em qualquer porta.
    echo.
    echo Proximos passos:
    echo 1. Pare o servidor Python (se estiver a correr)
    echo 2. Inicie novamente o servidor Python
    echo 3. A aplicacao deve funcionar sem erros de rede
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO ao compilar frontend!
    echo ========================================
    echo.
    echo Verifique os erros acima e tente novamente.
    echo.
    pause
    exit /b 1
)

cd ..
pause

