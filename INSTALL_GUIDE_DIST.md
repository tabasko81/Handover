# Complete Installation Guide - Dist Folder Distribution

This is a comprehensive guide for installing and running the Shift Handover Log application from the `dist` folder. This guide is intended for both end users and system administrators.

**Target Audience:** Non-technical users and IT administrators  
**Distribution Format:** Pre-compiled Windows executable with all dependencies included

---

## Table of Contents

1. [Introduction](#introduction)
2. [What's Included](#whats-included)
3. [System Requirements](#system-requirements)
4. [First Time Setup](#first-time-setup)
5. [Running the Server](#running-the-server)
6. [Network Access Configuration](#network-access-configuration)
7. [Automatic Startup Configuration](#automatic-startup-configuration)
8. [Daily Operations](#daily-operations)
9. [Troubleshooting](#troubleshooting)
10. [Advanced Configuration](#advanced-configuration)

---

## Introduction

The `dist` folder contains a complete, ready-to-run distribution of the Shift Handover Log application. It includes:

- Pre-compiled executables (no Python or Node.js installation required)
- All server code and dependencies
- Compiled web interface
- Portable Node.js runtime
- Helper scripts for common tasks

**No additional software installation is required!** Everything needed to run the application is included in this folder.

---

## What's Included

### Executables

- **`HandoverServer.exe`** - Graphical user interface version
  - Best for: Desktop users, daily operations
  - Features: Visual interface, start/stop buttons, log display, browser integration
  
- **`HandoverServerCLI.exe`** - Command-line interface version
  - Best for: Servers, automated deployments, background operation
  - Features: Terminal output, scriptable, no GUI dependencies

### Helper Scripts

- **`open-firewall-port.bat`** - Opens Windows Firewall port automatically
- **`find-my-ip.bat`** - Displays the computer's IP address
- **`setup-auto-start.bat`** - Configures automatic startup on boot
- **`remove-auto-start.bat`** - Removes automatic startup configuration

### Required Folders

- **`nodejs/`** - Portable Node.js runtime (required)
- **`server/`** - Backend server code (required)
- **`client/build/`** - Compiled web interface (required)
- **`data/`** - Application data and database (created automatically)
- **`node_modules/`** - Node.js dependencies (required)

### Configuration Files

- **`server_config.json`** - Server configuration (created automatically)
- **`server_default_config.json`** - Default port configuration
- **`package.json`** - Node.js package information

---

## System Requirements

### Minimum Requirements

- **Operating System:** Windows 10 (64-bit) or Windows 11
- **RAM:** 2 GB (4 GB recommended)
- **Disk Space:** 500 MB free space
- **Network:** For network access, all devices must be on the same local network

### No Additional Software Required

- ❌ No Python installation needed
- ❌ No Node.js installation needed
- ❌ No database installation needed
- ✅ Everything is included!

---

## First Time Setup

### Step 1: Verify Folder Contents

Make sure all files and folders are present:

```
dist/
├── HandoverServer.exe
├── HandoverServerCLI.exe
├── open-firewall-port.bat
├── find-my-ip.bat
├── setup-auto-start.bat
├── remove-auto-start.bat
├── README.md
├── nodejs/
│   ├── node.exe
│   └── npm.cmd
├── server/
├── client/
│   └── build/
├── data/ (created automatically)
└── node_modules/
```

**Important:** Do not delete or move any of these folders. They must all be in the same location.

### Step 2: First Run

1. **Double-click `HandoverServer.exe`**
2. A window will open showing:
   - Port configuration (default: 8500)
   - Start Server button
   - Stop Server button
   - Logs area
3. **Click "Start Server"**
4. Wait 5-10 seconds for the server to initialize
5. **Click "Open in Browser"** or manually open: `http://localhost:8500`

### Step 3: Initial Login

1. You'll see the login screen
2. **Default credentials:**
   - Username: `admin`
   - Password: `pass123`
3. **⚠️ IMPORTANT:** Change the password immediately after first login!

---

## Running the Server

### Method 1: Graphical Interface (Recommended for Most Users)

1. Double-click **`HandoverServer.exe`**
2. Configure port if needed (default: 8500)
3. Click **"Start Server"**
4. Wait for "Server started!" message
5. Access at: `http://localhost:8500`

**To Stop:**
- Click "Stop Server" button
- Close the window

### Method 2: Command Line Interface

1. Double-click **`HandoverServerCLI.exe`**
2. You'll see a prompt: `Enter port number [8500] (10 seconds timeout):`
3. Press Enter to use default, or type a port number
4. Server starts automatically
5. Access at: `http://localhost:8500`

**To Stop:**
- Press `Ctrl+C` in the terminal
- Or close the terminal window

### Port Configuration

The server uses port **8500** by default. You can change it:

- **GUI:** Enter a different port in the port field before starting
- **CLI:** Type the port number when prompted, or use: `HandoverServerCLI.exe 9000`

**Port Range:** 1-65535 (common choices: 8000, 8500, 9000, 3000)

---

## Network Access Configuration

To allow other computers on your network to access the application:

### Prerequisites

- All devices must be on the **same Wi-Fi or Ethernet network**
- The server must be running on the host computer
- Windows Firewall must allow connections on the port

### Step 1: Find Your IP Address

**Easy Method:**
1. Double-click **`find-my-ip.bat`**
2. Look for "IPv4 Address" (usually starts with 192.168. or 10.)
3. Write it down (example: `192.168.1.100`)

**Manual Method:**
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Find "IPv4 Address" under your active network adapter

### Step 2: Open Firewall Port

**Automatic Method (Recommended):**
1. Double-click **`open-firewall-port.bat`**
2. Windows will ask for administrator permission - click **"Yes"**
3. Wait for "Firewall rule created!" message
4. Done!

**Manual Method:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port number (e.g., 8500) → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Handover Server" → Finish

**PowerShell Method (Administrator):**
```powershell
New-NetFirewallRule -DisplayName "Handover Server" -Direction Inbound -LocalPort 8500 -Protocol TCP -Action Allow
```

### Step 3: Access from Another Computer

1. Make sure the server is running on the host computer
2. On another computer (same network), open a web browser
3. Type: **`http://[YOUR_IP]:8500`**
   - Replace `[YOUR_IP]` with the IP address from Step 1
   - Example: `http://192.168.1.100:8500`
4. Press Enter
5. You should see the application!

### Verifying Network Access

**Test from host computer:**
```cmd
curl http://localhost:8500/api/health
```

**Test from another computer:**
```cmd
ping [YOUR_IP]
```

**Check if port is open:**
```powershell
Test-NetConnection -ComputerName [YOUR_IP] -Port 8500
```

---

## Automatic Startup Configuration

Configure the server to start automatically when the computer boots.

### Setup Automatic Startup

1. **Double-click `setup-auto-start.bat`**
2. Windows will ask for administrator permission - click **"Yes"**
3. **Choose server type:**
   - Press `1` for GUI version (HandoverServer.exe)
   - Press `2` for CLI version (HandoverServerCLI.exe)
4. **Enter port number** (or press Enter for default 8500)
5. **Add delay?** (Recommended: Yes, 30 seconds)
   - This gives the network time to initialize before starting the server
6. Confirm the configuration
7. Wait for "Auto-start configured!" message

**What happens:**
- A Windows Task Scheduler task is created
- The task runs when the computer starts (before user login)
- The server starts automatically in the background

### Remove Automatic Startup

1. **Double-click `remove-auto-start.bat`**
2. Windows will ask for administrator permission - click **"Yes"**
3. Confirm removal
4. Done! The server will no longer start automatically.

### Verifying Auto-Start

1. Press `Windows Key + R`
2. Type `taskschd.msc` and press Enter
3. Look for "HandoverServer" in the task list
4. Right-click → "Run" to test manually

### Troubleshooting Auto-Start

**Server doesn't start on boot:**
- Check Task Scheduler for errors
- Verify the task exists and is enabled
- Check if the executable path is correct
- Try running the task manually from Task Scheduler

**Server starts but can't be accessed:**
- Network may not be ready - increase the delay (60 seconds)
- Firewall may be blocking - run `open-firewall-port.bat` again
- Check server logs for errors

---

## Daily Operations

### Starting the Server

**GUI Method:**
1. Double-click `HandoverServer.exe`
2. Click "Start Server"
3. Wait for confirmation

**CLI Method:**
1. Double-click `HandoverServerCLI.exe`
2. Server starts automatically

**If auto-start is configured:** Server starts automatically on boot - no action needed!

### Stopping the Server

**GUI Method:**
1. Click "Stop Server" button
2. Close the window

**CLI Method:**
1. Press `Ctrl+C` in the terminal
2. Or close the terminal window

### Checking Server Status

1. Open browser
2. Go to: `http://localhost:8500`
3. If you see the application, the server is running!

**Health Check:**
- Visit: `http://localhost:8500/api/health`
- Should return: `{"status":"ok","message":"Server is running",...}`

### Backup

**Backup Data:**
1. Stop the server
2. Copy the entire `data/` folder
3. Save to safe location (USB, cloud, etc.)

**Restore Data:**
1. Stop the server
2. Replace `data/` folder with backup
3. Start the server

---

## Troubleshooting

### Server Won't Start

**Symptoms:**
- Error message appears
- Server window closes immediately
- "Port already in use" error

**Solutions:**
1. **Port in use:**
   - Change to a different port (8501, 9000, etc.)
   - Or find and close the program using port 8500:
     ```cmd
     netstat -ano | findstr :8500
     taskkill /PID [PID] /F
     ```

2. **Missing files:**
   - Verify all folders are present (nodejs, server, client, data)
   - Don't move or delete any files
   - Re-extract the distribution if needed

3. **Permissions:**
   - Try running as Administrator (right-click → Run as administrator)
   - Check if antivirus is blocking the executable

### Can't Access from Network

**Checklist:**
- ✅ Server is running on host computer
- ✅ Firewall port is open (run `open-firewall-port.bat`)
- ✅ Both computers on same network
- ✅ Correct IP address used
- ✅ Port number matches (default: 8500)

**Test Connectivity:**
```cmd
# From another computer
ping [HOST_IP]
telnet [HOST_IP] 8500
```

**Common Issues:**
- **Wrong IP address:** Run `find-my-ip.bat` again (IP may change)
- **Firewall blocking:** Run `open-firewall-port.bat` as Administrator
- **Different networks:** Ensure both devices on same Wi-Fi/Ethernet
- **Router blocking:** Some routers block local network traffic (check router settings)

### Auto-Start Not Working

**Check:**
1. Task exists in Task Scheduler
2. Task is enabled (not disabled)
3. Executable path is correct
4. User has permissions to run the task

**Fix:**
1. Open Task Scheduler
2. Find "HandoverServer" task
3. Right-click → Properties
4. Check "General" tab - ensure "Run whether user is logged on or not" is selected
5. Check "Triggers" - should have "At startup" trigger
6. Try running the task manually (Right-click → Run)

### "Cannot find module" Error

**Cause:**
- `node_modules` folder missing or incomplete
- Dependencies not installed

**Solution:**
- Contact system administrator
- May need to re-run installation process
- Ensure `package.json` and `node_modules` are present

### Performance Issues

**Slow startup:**
- Normal on first run (5-10 seconds)
- Subsequent starts should be faster (2-5 seconds)

**High memory usage:**
- Normal: 100-300 MB RAM
- If excessive, check for memory leaks or restart server

**Network slow:**
- Check network speed
- Ensure devices on same network segment
- Check for network congestion

---

## Advanced Configuration

### Changing Default Port

Edit `server_default_config.json`:
```json
{
  "default_port": 9000
}
```

### Running as Windows Service

For production deployments, consider using NSSM (Non-Sucking Service Manager):

1. Download NSSM from: https://nssm.cc/download
2. Install NSSM
3. Create service:
   ```cmd
   nssm install HandoverServer "C:\path\to\dist\HandoverServerCLI.exe" "8500"
   ```
4. Start service:
   ```cmd
   nssm start HandoverServer
   ```

### Custom Configuration

Edit `server_config.json` (created automatically):
```json
{
  "port": 8500
}
```

### Logging

**GUI Version:**
- Logs displayed in the GUI window
- Can be copied from the log area

**CLI Version:**
- Logs displayed in terminal
- Can be redirected to file:
  ```cmd
  HandoverServerCLI.exe 8500 > server.log 2>&1
  ```

### Security Considerations

**For Production Use:**
- ✅ Change default password immediately
- ✅ Use strong passwords
- ✅ Only open firewall on trusted networks
- ✅ Consider HTTPS for external access
- ✅ Regular backups
- ✅ Keep application updated

**Network Security:**
- Don't expose to public internet without proper security
- Use VPN for remote access
- Consider reverse proxy (Nginx, Apache) with SSL
- Implement IP whitelisting if possible

---

## Support and Resources

### Documentation Files

- `README.md` - Quick start guide (in dist folder)
- `INSTALL_GUIDE_DIST.md` - This comprehensive guide
- `README_SERVER.md` - Server documentation
- `README_CLI.md` - CLI launcher documentation

### Getting Help

1. Check this guide's Troubleshooting section
2. Review error messages carefully
3. Check Windows Event Viewer for system errors
4. Verify all requirements are met
5. Contact IT support or system administrator

---

## Summary

### Quick Reference

**First Time Setup:**
1. Verify all files present
2. Run `HandoverServer.exe`
3. Click "Start Server"
4. Login with admin/pass123
5. Change password!

**Daily Use:**
- Start: Run `HandoverServer.exe` → Click "Start Server"
- Stop: Click "Stop Server"
- Access: `http://localhost:8500`

**Network Access:**
1. Run `find-my-ip.bat` → Note IP address
2. Run `open-firewall-port.bat` → Open firewall
3. Access from other computer: `http://[IP]:8500`

**Auto-Start:**
- Setup: Run `setup-auto-start.bat`
- Remove: Run `remove-auto-start.bat`

---

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025

