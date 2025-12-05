# Quick Start Guide - Shift Handover Log

Get up and running with Shift Handover Log in minutes.

---

## 🚀 Quick Installation

### ⚡ Standalone Installation (Recommended)

**Windows:**
1. Download the `dist` folder
2. Double-click `HandoverServer.exe`
3. Click "Start Server"
4. Open http://localhost:8500

👉 **See detailed guide:** [INSTALL_GUIDE_DIST.md](../INSTALL_GUIDE_DIST.md)

### Local Installation

**Windows:**
```batch
install.bat
setup-db.bat
start.bat
```

**Manual NPM:**
1. **Install dependencies:**
```bash
npm run install-all
```

2. **Setup database:**
```bash
npm run setup-db
```

3. **Add sample data (optional):**
```bash
npm run seed
```

4. **Start application:**
```bash
npm run dev
```

---

## 🌐 Access

- **Application:** http://localhost:8500
- **Backend API:** http://localhost:8500/api

---

## 🎯 First Steps

1. Open your browser at `http://localhost:8500`
2. Login with default credentials:
   - **Username:** `admin` or `FO`
   - **Password:** `pass123`
3. Click **"Create New Log"** to create your first entry
4. Fill in the form:
   - Date will be auto-filled
   - Short description (max 50 characters)
   - Detailed note (max 1000 characters) with rich text formatting
   - Worker code (3 letters, e.g.: "ABC")
5. Click **"Create Log"**

---

## ✨ Main Features

- ✅ **Create Log:** "Create New Log" button
- ✅ **Edit:** Click "Edit" on any entry
- ✅ **Archive:** Click "Archive" (appears in gray when archived)
- ✅ **Delete:** Click "Delete" (confirmation required)
- ✅ **Search:** Use the search bar at the top
- ✅ **Filter:** Use filters by date, worker, etc.
- ✅ **Info Slide:** Click (i) button on the left
- ✅ **Expanded View:** Click 🔍 icon next to any log

---

## 📁 File Structure

```
Handover/
├── server/          # Backend Node.js/Express
├── client/          # Frontend React
├── data/            # SQLite database (created automatically)
├── logs/            # Application logs
└── docs/            # Documentation
```

---

## 🔧 Common Problems

### Port already in use

If port 8500 is occupied, change it in the `server_config.json` file:
```json
{
  "port": 8501
}
```

### Error installing dependencies

- Make sure you have Node.js 14+ installed
- Try `npm cache clean --force` and then `npm install`
- On Windows, run as Administrator if needed

### Application doesn't load

- Check if server is running (port 8500)
- Check terminal logs for errors
- Verify Node.js is installed (for local installation)
- Try refreshing the browser (F5)
- Check Windows Firewall settings

---

## 📚 Next Steps

- Read the **[User Manual](USER_MANUAL.md)** for complete feature documentation
- Check **[Standalone Installation Guide](../INSTALL_GUIDE_DIST.md)** for distribution setup
- Review **[Troubleshooting Guide](TROUBLESHOOTING.md)** if you encounter issues

---

## 💡 Tips

- **First time?** Use Standalone executable - it's the easiest way to get started
- **Need help?** Check the browser console (F12) for error messages
- **Backup data?** Copy the `data/` folder regularly
- **Multiple users?** Configure user management in Admin settings

---

**Version:** Beta v0.25.12-Beta.1
