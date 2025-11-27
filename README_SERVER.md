# Servidor Python Standalone - Shift Handover Log

Este servidor Python permite executar a aplicação Shift Handover Log no Windows sem necessidade de instalar Node.js globalmente. Basta ter Python instalado e incluir Node.js portátil.

## Requisitos

- **Python 3.8 ou superior** (com tkinter incluído)
- **Node.js portátil** (ver instruções abaixo)

## Instalação Rápida

### 1. Verificar Python

Certifique-se de que tem Python instalado:

```bash
python --version
```

Se não tiver Python, baixe de: https://www.python.org/downloads/

### 2. Incluir Node.js Portátil

#### Opção A: Download Manual (Recomendado)

1. Baixe Node.js LTS para Windows x64:
   - Acesse: https://nodejs.org/
   - Baixe a versão LTS (Long Term Support)
   - Escolha a versão Windows Installer (.msi) ou Windows Binary (.zip)

2. Se baixou o .msi:
   - Execute o instalador
   - Copie `node.exe` de `C:\Program Files\nodejs\` para `nodejs\node.exe`
   - Copie `npm.cmd` de `C:\Program Files\nodejs\` para `nodejs\npm.cmd`

3. Se baixou o .zip:
   - Extraia o ficheiro
   - Copie `node.exe` para `nodejs\node.exe`
   - Copie `npm.cmd` para `nodejs\npm.cmd`

#### Opção B: Estrutura de Pastas

Crie a seguinte estrutura:

```
Handover/
├── nodejs/
│   ├── node.exe
│   └── npm.cmd
├── server.py
├── server/
├── client/build/
└── data/
```

### 3. Verificar Estrutura

Certifique-se de que tem:
- ✅ `server/` - Pasta do backend
- ✅ `client/build/` - Frontend compilado
- ✅ `data/` - Pasta de dados (será criada automaticamente se não existir)
- ✅ `nodejs/node.exe` - Node.js portátil

## Utilização

### Executar o Servidor

1. Execute o script Python:

```bash
python server.py
```

2. Uma janela gráfica abrirá com:
   - Campo para configurar a porta (padrão: 8500)
   - Botão "Iniciar Servidor"
   - Botão "Parar Servidor"
   - Botão "Abrir no Browser"
   - Área de logs

3. Configure a porta desejada (ou use a padrão 8500)

4. Clique em "Iniciar Servidor"

5. Aguarde alguns segundos até o servidor iniciar

6. O browser abrirá automaticamente, ou clique em "Abrir no Browser"

### Acessar a Aplicação

Após iniciar o servidor, acesse:

- **Frontend e Backend**: http://localhost:8500 (ou a porta configurada)
- **API**: http://localhost:8500/api
- **Health Check**: http://localhost:8500/api/health

### Credenciais Padrão

- **Username**: `admin`
- **Password**: `pass123`

⚠️ **IMPORTANTE**: Altere a password imediatamente após o primeiro login!

## Funcionalidades

- ✅ Interface gráfica simples e intuitiva
- ✅ Configuração de porta personalizada
- ✅ Logs em tempo real
- ✅ Abertura automática do browser
- ✅ Gestão automática de processos
- ✅ Guarda última porta usada
- ✅ Verificação de dependências
- ✅ Sem necessidade de instalar Node.js globalmente

## Resolução de Problemas

### Erro: "Node.js não encontrado"

- Verifique se `nodejs/node.exe` existe
- Certifique-se de que copiou o ficheiro correto
- Tente baixar Node.js novamente

### Erro: "Porta já está em uso"

- Escolha outra porta
- Feche outras aplicações que possam estar a usar a porta
- Verifique se há outra instância do servidor a correr

### Erro: "Pasta 'client/build' não encontrada"

- O frontend precisa de estar compilado
- Execute: `cd client && npm run build`
- Certifique-se de que a pasta `client/build/` existe

### Erro: "Network Error" ao configurar admin

- O frontend foi compilado com uma URL absoluta da API (ex: `http://localhost:5000/api`)
- Mas o servidor está a correr numa porta diferente (ex: 8500)
- **Solução**: Recompile o frontend com URL relativa:
  - Execute `rebuild-frontend.bat` (Windows)
  - Ou manualmente: `cd client && set REACT_APP_API_URL=/api && npm run build`
- Isso fará o frontend usar URLs relativas (`/api`) que funcionam em qualquer porta

### Erro: "Pasta 'server' não encontrada"

- Certifique-se de que está a executar o script da pasta raiz do projeto
- Verifique se a pasta `server/` existe

### Servidor não inicia

- Verifique os logs na interface gráfica
- Certifique-se de que todas as dependências Node.js estão instaladas
- Verifique se a base de dados está acessível em `data/`

## Criar Executável (.exe)

Para criar um executável Windows usando PyInstaller:

### Método Rápido (Recomendado)

1. Execute o script:

```bash
build-exe.bat
```

O script irá:
- Instalar PyInstaller automaticamente se necessário
- Criar o executável `HandoverServer.exe`
- Colocar o executável em `dist/HandoverServer.exe`

### Método Manual

1. Instale PyInstaller:

```bash
pip install pyinstaller
```

2. Crie o executável:

```bash
pyinstaller --onefile --windowed --name "HandoverServer" server.py
```

3. O executável estará em `dist/HandoverServer.exe`

### Distribuição do Executável

O executável precisa estar na mesma pasta que:

```
Handover/
├── HandoverServer.exe (o executavel)
├── nodejs/              (Node.js portatil)
│   ├── node.exe
│   └── npm.cmd
├── server/               (codigo do servidor)
├── client/build/         (frontend compilado)
└── data/                 (sera criada automaticamente)
```

**Nota**: 
- O executável é standalone (não precisa de Python instalado)
- Mas ainda precisa das pastas `nodejs/`, `server/` e `client/build/`
- Pode distribuir tudo junto numa pasta ZIP

## Estrutura de Ficheiros

```
Handover/
├── server.py              # Script principal do servidor
├── server_config.json     # Configuração guardada (criado automaticamente)
├── requirements.txt       # Dependências Python
├── README_SERVER.md       # Este ficheiro
├── nodejs/                # Node.js portátil (a incluir manualmente)
│   ├── node.exe
│   └── npm.cmd
├── server/                # Backend Node.js
│   ├── index.js
│   ├── routes/
│   ├── database/
│   └── ...
├── client/                # Frontend React
│   └── build/             # Frontend compilado
└── data/                  # Dados da aplicação
    ├── config.json
    └── shift_logs.db
```

## Suporte

Para mais informações sobre a aplicação, consulte:
- `README.md` - Documentação principal
- `docs/` - Documentação adicional

