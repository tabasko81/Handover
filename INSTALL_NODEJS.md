# Node.js Installation Guide for Windows

## Method 1: Direct Installation (Recommended)

### Step 1: Download
1. Open your browser and go to: **https://nodejs.org/**
2. You will be automatically redirected to the recommended LTS (Long-Term Support) version
3. Click the big green "LTS" button to download
4. The file will be something like `node-v20.x.x-x64.msi` (or similar)

### Step 2: Installation
1. Run the downloaded `.msi` file
2. Click "Next" through the various steps
3. **Important:** Make sure the "Add to PATH" option is selected (usually selected by default)
4. Accept the terms and conditions
5. Click "Install"
6. Wait for installation to complete
7. Click "Finish"

### Step 3: Verify Installation
1. Open a **new** Command Prompt or PowerShell (important: close and reopen if already open)
2. Run the following commands:

```bash
node -v
npm -v
```

If both show version numbers, installation was successful!

## Method 2: Using nvm-windows (For multiple versions)

If you need to manage multiple Node.js versions:

1. Go to: **https://github.com/coreybutler/nvm-windows/releases**
2. Download `nvm-setup.exe`
3. Run and install
4. After installation, open a new Command Prompt and run:

```bash
nvm install lts
nvm use lts
```

## After Installation

After installing Node.js, return to the project directory and run:

```bash
npm run install-all
npm run setup-db
npm run dev
```

Or use the batch scripts:

```batch
install.bat
setup-db.bat
start.bat
```

## Common Problems

### "npm is not recognized as a command"
- Make sure you closed and reopened the terminal after installation
- Check if Node.js was added to PATH: Open "Environment Variables" in Windows and verify that `C:\Program Files\nodejs\` is in PATH
- Restart your computer if necessary

### Version too old
- Uninstall the old version
- Install the latest LTS version from the official website

## Useful Links

- Official site: https://nodejs.org/
- Direct LTS download: https://nodejs.org/en/download/
- Documentation: https://nodejs.org/en/docs/
