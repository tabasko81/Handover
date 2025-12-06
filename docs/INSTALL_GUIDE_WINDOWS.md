# Installation Guide for Windows - Non-Technical Users

This guide will help you install and run the Shift Handover Log application on Windows using the standalone executable. No technical knowledge required!

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025

---

## 📋 What You Need Before Starting

### System Requirements
- Windows 10 or Windows 11 (64-bit)
- At least 2 GB of RAM (4 GB recommended)
- 500 MB free disk space
- No additional software installation needed!

---

## 🚀 Quick Start (Recommended)

### Step 1: Download the Application

1. Download the `dist` folder (pre-compiled distribution)
2. Extract it to a location like `C:\Users\YourName\Documents\Handover`
3. That's it! No installation needed.

### Step 2: Run the Application

1. Navigate to the `dist` folder
2. Double-click **`HandoverServer.exe`**
3. A window will open
4. Click **"Start Server"**
5. Wait 5-10 seconds for the server to start
6. Click **"Open in Browser"** or manually open: `http://localhost:8500`

### Step 3: First Login

1. You'll see the login screen
2. **Default credentials:**
   - Username: `admin`
   - Password: `pass123`
3. **⚠️ IMPORTANT:** Change the password immediately after first login!

---

## 📖 Detailed Installation Guide

### What's Included

The `dist` folder contains everything you need:
- `HandoverServer.exe` - Main application (GUI version)
- `HandoverServerCLI.exe` - Command-line version (for advanced users)
- `nodejs/` - Portable Node.js (included, no installation needed)
- `server/` - Backend server code
- `client/build/` - Web interface
- Helper scripts for network access and auto-start

### First Time Setup

1. **Extract the `dist` folder** to your desired location
   - Example: `C:\Users\YourName\Documents\Handover`
   - **Important:** Keep all files and folders together!

2. **Run the application:**
   - Double-click `HandoverServer.exe`
   - Click "Start Server"
   - Wait for "Server started!" message

3. **Access the application:**
   - Browser opens automatically, or
   - Manually open: `http://localhost:8500`

4. **Login:**
   - Username: `admin`
   - Password: `pass123`
   - **Change password immediately!**

---

## 🌐 Network Access (Optional)

To allow other computers on your network to access the application:

### Step 1: Find Your IP Address

**Easy Method:**
1. Double-click **`find-my-ip.bat`** in the dist folder
2. Look for "IPv4 Address" (usually starts with 192.168. or 10.)
3. Write it down (example: `192.168.1.100`)

**Manual Method:**
1. Press `Windows Key + R`
2. Type `cmd` and press Enter
3. Type `ipconfig` and press Enter
4. Find "IPv4 Address" under your active network adapter

### Step 2: Open Firewall Port

**Automatic Method (Recommended):**
1. Double-click **`open-firewall-port.bat`** in the dist folder
2. Windows will ask for administrator permission - click **"Yes"**
3. Wait for "Firewall rule created!" message
4. Done!

**Manual Method:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port number: `8500` → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Handover Server" → Finish

### Step 3: Access from Another Computer

1. Make sure the server is running on the host computer
2. On another computer (same network), open a web browser
3. Type: **`http://[YOUR_IP]:8500`**
   - Replace `[YOUR_IP]` with the IP address from Step 1
   - Example: `http://192.168.1.100:8500`
4. Press Enter
5. You should see the application!

---

## 🔄 Automatic Startup (Optional)

Configure the server to start automatically when the computer boots:

### Setup Automatic Startup

1. Double-click **`setup-auto-start.bat`** in the dist folder
2. Windows will ask for administrator permission - click **"Yes"**
3. **Choose server type:**
   - Press `1` for GUI version (HandoverServer.exe)
   - Press `2` for CLI version (HandoverServerCLI.exe)
4. **Enter port number** (or press Enter for default 8500)
5. **Add delay?** (Recommended: Yes, 30 seconds)
6. Confirm the configuration
7. Wait for "Auto-start configured!" message

### Remove Automatic Startup

1. Double-click **`remove-auto-start.bat`** in the dist folder
2. Windows will ask for administrator permission - click **"Yes"**
3. Confirm removal
4. Done!

---

## 🔧 Troubleshooting

### Server Won't Start

**Symptoms:**
- Error message appears
- Server window closes immediately
- "Port already in use" error

**Solutions:**
1. **Port in use:**
   - Change to a different port (8501, 9000, etc.) in the GUI
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
```

**Common Issues:**
- **Wrong IP address:** Run `find-my-ip.bat` again (IP may change)
- **Firewall blocking:** Run `open-firewall-port.bat` as Administrator
- **Different networks:** Ensure both devices on same Wi-Fi/Ethernet

### Application Doesn't Load in Browser

**Solutions:**
1. Wait a bit longer (first start can take 5-10 seconds)
2. Make sure you're using: **http://localhost:8500** (not https)
3. Check if server is running (look at the GUI window)
4. Try refreshing the browser page (F5 or Ctrl+F5)
5. Close and reopen your browser
6. Check the logs in the GUI window for error messages

### "Cannot find module" Error

**Cause:**
- `node_modules` folder missing or incomplete
- Dependencies not installed

**Solution:**
- Contact system administrator
- May need to re-run installation process
- Ensure `package.json` and `node_modules` are present

---

## 📝 Daily Operations

### Starting the Server

1. Double-click `HandoverServer.exe`
2. Click "Start Server"
3. Wait for confirmation
4. Access at: `http://localhost:8500`

**If auto-start is configured:** Server starts automatically on boot - no action needed!

### Stopping the Server

1. Click "Stop Server" button in the GUI
2. Or close the window

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

## ❓ Common Questions

**Q: Do I need to install Node.js or Python?**  
A: No! Everything is included in the dist folder. Just run `HandoverServer.exe`.

**Q: Can I close the window after starting?**  
A: No, keep the window open. Closing it will stop the server. Use "Stop Server" button instead.

**Q: Does this work offline?**  
A: Yes! Once downloaded, everything works offline. No internet needed.

**Q: Will this slow down my computer?**  
A: The application uses minimal resources (100-300 MB RAM). It shouldn't noticeably slow down your computer.

**Q: Can multiple people use it?**  
A: Yes! If you configure network access, multiple people on the same network can access it.

**Q: How do I know if it's working?**  
A: Open **http://localhost:8500** in your browser. If you see the application interface, it's working!

**Q: Can I change the port?**  
A: Yes! Enter a different port number in the GUI before clicking "Start Server".

---

## 📞 Need More Help?

If you encounter problems not covered here:

1. Check the **docs/TROUBLESHOOTING.md** file
2. Review **INSTALL_GUIDE_DIST.md** for detailed information
3. Check the logs in the GUI window for error messages
4. Verify all files and folders are present in the dist folder

---

## 🎉 You're Done!

Congratulations! You now have the Shift Handover Log application running on your Windows computer. Just remember:

- Run `HandoverServer.exe` to start the application
- Use `http://localhost:8500` in your browser to access it
- Click "Stop Server" to stop when done
- Configure network access if you want others to use it

Happy logging! 📝

---

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025
