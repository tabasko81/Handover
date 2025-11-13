# Quick Start Guide - Shift Handover Log

Get up and running with Shift Handover Log in minutes.

---

## 🚀 Quick Installation

### Using Docker (Recommended)

**Windows:**
```batch
docker-start.bat
```

**Manual Docker:**
```bash
docker-compose up -d --build
```

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

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 🎯 First Steps

1. Open your browser at `http://localhost:3000`
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

If port 5000 is occupied, change it in the `.env` file:
```
PORT=5001
```

Update `client/package.json` proxy:
```json
"proxy": "http://localhost:5001"
```

### Error installing dependencies

- Make sure you have Node.js 14+ installed
- Try `npm cache clean --force` and then `npm install`
- On Windows, run as Administrator if needed

### Frontend doesn't load

- Check if backend server is running (port 5000)
- Check terminal logs for errors
- Verify Docker is running (if using Docker)
- Try refreshing the browser (F5)

### Docker not starting

- Ensure Docker Desktop is running
- Wait for Docker to fully start (whale icon stable)
- Check Docker Desktop logs
- Restart Docker Desktop if needed

---

## 📚 Next Steps

- Read the **[User Manual](USER_MANUAL.md)** for complete feature documentation
- Check **[Docker Guide](DOCKER.md)** for Docker-specific instructions
- Review **[Troubleshooting Guide](TROUBLESHOOTING.md)** if you encounter issues

---

## 💡 Tips

- **First time?** Use Docker - it's the easiest way to get started
- **Need help?** Check the browser console (F12) for error messages
- **Backup data?** Copy the `data/` folder regularly
- **Multiple users?** Configure user management in Admin settings

---

**Version:** Alpha v0.25.11-alpha.6
