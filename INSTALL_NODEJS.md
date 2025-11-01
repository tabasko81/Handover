# Guia de Instalação do Node.js no Windows

## Método 1: Instalação direta (Recomendado)

### Passo 1: Download
1. Abra o seu navegador e aceda a: **https://nodejs.org/**
2. Será automaticamente redirecionado para a versão LTS (Long-Term Support) recomendada
3. Clique no botão verde grande "LTS" para fazer o download
4. O ficheiro será algo como `node-v20.x.x-x64.msi` (ou similar)

### Passo 2: Instalação
1. Execute o ficheiro `.msi` descarregado
2. Clique em "Next" nas várias etapas
3. **Importante:** Certifique-se de que a opção "Add to PATH" está selecionada (geralmente vem selecionada por padrão)
4. Aceite os termos e condições
5. Clique em "Install"
6. Aguarde a instalação completar
7. Clique em "Finish"

### Passo 3: Verificar Instalação
1. Abra um **novo** Command Prompt ou PowerShell (importante: feche e reabra se já estava aberto)
2. Execute os seguintes comandos:

```bash
node -v
npm -v
```

Se ambos mostrarem números de versão, a instalação foi bem-sucedida!

## Método 2: Usando o nvm-windows (Para múltiplas versões)

Se precisa de gerir múltiplas versões do Node.js:

1. Aceda a: **https://github.com/coreybutler/nvm-windows/releases**
2. Descarregue `nvm-setup.exe`
3. Execute e instale
4. Depois de instalado, abra um novo Command Prompt e execute:

```bash
nvm install lts
nvm use lts
```

## Após a Instalação

Depois de instalar o Node.js, volte ao diretório do projeto e execute:

```bash
npm run install-all
npm run setup-db
npm run dev
```

Ou use os scripts batch:

```batch
install.bat
setup-db.bat
start.bat
```

## Problemas Comuns

### "npm não é reconhecido como comando"
- Certifique-se de que fechou e reabriu o terminal após a instalação
- Verifique se o Node.js foi adicionado ao PATH: Abra "Variáveis de Ambiente" no Windows e verifique se `C:\Program Files\nodejs\` está no PATH
- Reinicie o computador se necessário

### Versão muito antiga
- Desinstale a versão antiga
- Instale a versão LTS mais recente do site oficial

## Links Úteis

- Site oficial: https://nodejs.org/
- Download direto LTS: https://nodejs.org/en/download/
- Documentação: https://nodejs.org/en/docs/

