# Node.js Installation Guide for Windows

Complete guide to installing Node.js on Windows for local development.

---

## 📥 Method 1: Direct Installation (Recommended)

### Step 1: Download

1. Open your browser and go to: **https://nodejs.org/**
2. You will be automatically redirected to the recommended LTS (Long-Term Support) version
3. Click the big green **"LTS"** button to download
4. The file will be something like `node-v20.x.x-x64.msi` (or similar)

### Step 2: Installation

1. Run the downloaded `.msi` file
2. Click **"Next"** through the installation wizard
3. **Important:** Make sure the **"Add to PATH"** option is selected (usually selected by default)
4. Accept the terms and conditions
5. Click **"Install"**
6. Wait for installation to complete
7. Click **"Finish"**

### Step 3: Verify Installation

1. Open a **new** Command Prompt or PowerShell (important: close and reopen if already open)
2. Run the following commands:

```bash
node -v
npm -v
```

If both show version numbers, installation was successful!

**Expected output:**
```
v20.x.x
10.x.x
```

---

## 🔄 Method 2: Using nvm-windows (For Multiple Versions)

If you need to manage multiple Node.js versions:

1. Go to: **https://github.com/coreybutler/nvm-windows/releases**
2. Download `nvm-setup.exe`
3. Run and install
4. After installation, open a **new** Command Prompt and run:

```bash
nvm install lts
nvm use lts
```

5. Verify installation:
```bash
node -v
npm -v
```

---

## ✅ After Installation

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

---

## 🔧 Common Problems

### "npm is not recognized as a command"

**Solutions:**

1. **Close and reopen terminal** - PATH changes require new terminal session
2. **Check PATH environment variable:**
   - Open "Environment Variables" in Windows
   - Verify that `C:\Program Files\nodejs\` is in PATH
3. **Restart computer** if PATH changes don't take effect
4. **Reinstall Node.js** with "Add to PATH" option checked

### Version too old

**Solutions:**

1. Uninstall the old version from Control Panel
2. Install the latest LTS version from the official website
3. Verify with `node -v` (should be 14+)

### Installation fails

**Solutions:**

1. Run installer as Administrator
2. Disable antivirus temporarily during installation
3. Check Windows updates
4. Try downloading installer again

---

## 📚 Useful Links

- **Official site:** https://nodejs.org/
- **Direct LTS download:** https://nodejs.org/en/download/
- **Documentation:** https://nodejs.org/en/docs/
- **nvm-windows:** https://github.com/coreybutler/nvm-windows

---

## 💡 Tips

- **Always use LTS version** for stability
- **Restart terminal** after installation
- **Verify installation** with `node -v` and `npm -v`
- **Keep Node.js updated** for security patches

---

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025
