# Shift Handover Log - Installation Guide

Welcome! This guide will help you install and run the Shift Handover Log application on Windows. No technical knowledge required!

## What's in This Folder?

This folder contains everything you need to run the application:
- **HandoverServer.exe** - Server with graphical interface (recommended for most users)
- **HandoverServerCLI.exe** - Server for command-line/terminal (for advanced users)
- All necessary files and folders (server code, web interface, etc.)

**You don't need to install anything else!** Everything is included.

## Quick Start

### Step 1: Start the Server

**Option A: Using the Graphical Interface (Recommended)**

1. Double-click **`HandoverServer.exe`**
2. A window will open
3. The default port is **8500** (you can change it if needed)
4. Click **"Start Server"**
5. Wait a few seconds for the server to start
6. Click **"Open in Browser"** or open your browser manually

**Option B: Using Command Line**

1. Double-click **`HandoverServerCLI.exe`**
2. A black window (terminal) will open
3. You'll see a prompt asking for a port number
4. Press Enter to use the default port (8500), or type a different port
5. The server will start automatically
6. Open your browser and go to: **http://localhost:8500**

### Step 2: Access the Application

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **http://localhost:8500**
3. You should see the Shift Handover Log application!

### Step 3: First Login

- **Username:** `admin`
- **Password:** `pass123`

⚠️ **IMPORTANT:** Change the password immediately after first login!

## Accessing from Other Computers on Your Network

To allow other computers on the same network to access the application:

### Step 1: Find Your Computer's IP Address

**Easy Method:**
1. Double-click **`find-my-ip.bat`**
2. Look for the IP address (usually starts with 192.168. or 10.)
3. Write it down (for example: 192.168.1.100)

**Manual Method:**
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Look for "IPv4 Address" under your network adapter
5. Write down the IP address

### Step 2: Open the Firewall Port

1. Double-click **`open-firewall-port.bat`**
2. Windows may ask for permission - click **"Yes"**
3. Wait for the message "Firewall rule created!"
4. The port is now open!

### Step 3: Access from Another Computer

1. Make sure both computers are on the same Wi-Fi/Ethernet network
2. On the other computer, open a web browser
3. Type: **http://[YOUR_IP]:8500**
   - Replace `[YOUR_IP]` with the IP address you found in Step 1
   - Example: If your IP is 192.168.1.100, type: **http://192.168.1.100:8500**
4. Press Enter
5. You should see the application!

## Automatic Startup (Start Server When Computer Boots)

You can configure the server to start automatically when your computer starts:

### Setup Automatic Startup

1. Double-click **`setup-auto-start.bat`**
2. Windows may ask for permission - click **"Yes"**
3. Follow the prompts:
   - Choose GUI (1) or CLI (2) version
   - Enter port number (or press Enter for default 8500)
   - Choose if you want a delay after startup (recommended: Yes, 30 seconds)
4. The server will now start automatically when your computer boots!

### Remove Automatic Startup

1. Double-click **`remove-auto-start.bat`**
2. Windows may ask for permission - click **"Yes"**
3. Confirm that you want to remove auto-start
4. Done! The server will no longer start automatically.

## Daily Use

### Starting the Server

- **GUI Version:** Double-click `HandoverServer.exe`, then click "Start Server"
- **CLI Version:** Double-click `HandoverServerCLI.exe`

### Stopping the Server

- **GUI Version:** Click "Stop Server" in the window, then close the window
- **CLI Version:** Press `Ctrl+C` in the terminal window, or close the window

### Checking if Server is Running

1. Open your browser
2. Go to: **http://localhost:8500**
3. If you see the application, the server is running!

## Troubleshooting

### Problem: "Port already in use"

**Solution:**
- Another program is using port 8500
- Change the port in the server window (try 8501, 8502, etc.)
- Or close the program that's using port 8500

### Problem: Can't access from another computer

**Check these:**
1. ✅ Is the server running on the main computer?
2. ✅ Did you run `open-firewall-port.bat`?
3. ✅ Are both computers on the same network (same Wi-Fi)?
4. ✅ Did you use the correct IP address?
5. ✅ Try accessing from the main computer first: `http://localhost:8500`

**Test the connection:**
- On the other computer, open Command Prompt
- Type: `ping [YOUR_IP]` (replace with your IP)
- If you get replies, the computers can see each other

### Problem: Server won't start

**Check:**
- Make sure all files and folders are in the same place
- Don't move or delete any folders (nodejs, server, client, data)
- Try running as Administrator (right-click → Run as administrator)

### Problem: Auto-start doesn't work

**Check:**
- Did you run `setup-auto-start.bat` as Administrator?
- Check Task Scheduler:
  1. Press `Windows Key + R`
  2. Type `taskschd.msc` and press Enter
  3. Look for "HandoverServer" in the list
  4. If it's there, right-click and select "Run" to test

### Problem: "Cannot find module" error

**Solution:**
- The `node_modules` folder might be missing
- Contact your system administrator or the person who set up this folder
- They may need to run the installation process again

## Important Notes

### Folder Structure

**DO NOT DELETE OR MOVE:**
- `nodejs/` folder
- `server/` folder
- `client/` folder
- `data/` folder
- `node_modules/` folder (if present)

**You can move the entire `dist` folder** to another location, but keep all files together!

### Data Backup

Your data is stored in the `data/` folder. To backup:
1. Copy the entire `data/` folder
2. Save it somewhere safe (USB drive, cloud storage, etc.)

To restore:
1. Stop the server
2. Replace the `data/` folder with your backup
3. Start the server again

### Security

- ⚠️ Change the default password immediately!
- ⚠️ Only open the firewall port if you trust your network
- ⚠️ Don't expose this server to the internet without proper security

## Getting Help

If you encounter problems:

1. Check this guide's Troubleshooting section
2. Make sure Windows is updated
3. Try restarting your computer
4. Contact your IT support or system administrator

## What Each File Does

- **HandoverServer.exe** - Main server with graphical interface
- **HandoverServerCLI.exe** - Server for command-line (no window)
- **open-firewall-port.bat** - Opens the firewall so other computers can access
- **find-my-ip.bat** - Shows your computer's IP address
- **setup-auto-start.bat** - Configures automatic startup
- **remove-auto-start.bat** - Removes automatic startup
- **README.md** - This file!

## Summary

1. **Start server:** Double-click `HandoverServer.exe` → Click "Start Server"
2. **Access locally:** Open browser → Go to `http://localhost:8500`
3. **Access from network:** Run `open-firewall-port.bat` → Use IP address from `find-my-ip.bat`
4. **Auto-start:** Run `setup-auto-start.bat` (optional)

That's it! Enjoy using Shift Handover Log! 🎉

---

**Version:** Alpha 7  
**Last Updated:** 2025

