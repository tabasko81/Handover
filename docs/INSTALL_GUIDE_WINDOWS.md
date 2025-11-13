# Installation Guide for Windows - Non-Technical Users

This guide will help you install and run the Shift Handover Log application on Windows using Docker. No technical knowledge required!

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025

---

## 📋 What You Need Before Starting

Before you begin, you need to install **Docker Desktop** on your Windows computer. This is a free program that lets you run the application easily.

### System Requirements
- Windows 10 or Windows 11 (64-bit)
- At least 4 GB of RAM (8 GB recommended)
- Internet connection

## Step 1: Install Docker Desktop

### Download Docker Desktop
1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **https://www.docker.com/products/docker-desktop/**
3. Click the big **"Download for Windows"** button
4. The file will be called something like `Docker Desktop Installer.exe`
5. Save it to your Downloads folder (or wherever you prefer)

### Install Docker Desktop
1. Find the downloaded file in your Downloads folder
2. Double-click on `Docker Desktop Installer.exe`
3. If Windows asks for permission, click **"Yes"**
4. Follow the installation wizard:
   - Check the box "Use WSL 2 instead of Hyper-V" (if shown)
   - Click **"OK"** or **"Install"**
   - Wait for the installation to complete (this may take a few minutes)
5. When installation finishes, click **"Close"** or **"Restart"** (if it asks you to restart)

### Start Docker Desktop
1. After installation, look for the Docker icon in your Start Menu
2. Click on **"Docker Desktop"** to launch it
3. You'll see a whale icon in your system tray (bottom right corner of your screen)
4. **Wait for Docker to fully start** - this may take 1-2 minutes
   - The whale icon should stop animating/flashing when ready
   - You may see "Docker Desktop is starting..." in a notification
5. When the whale icon is stable (not moving), Docker is ready!

### Verify Docker is Running
1. Right-click on the Docker whale icon in your system tray
2. Click **"Open Docker Desktop"**
3. You should see the Docker Desktop window with no error messages
4. If you see any errors, see the "Troubleshooting" section below

## Step 2: Download the Application

You have two options to get the application files:

### Option A: Download as ZIP (Easier for Beginners)
1. Open your web browser
2. Go to the GitHub page: **https://github.com/tabasko81/Handover**
3. Click the green **"Code"** button (top right)
4. Click **"Download ZIP"**
5. Wait for the download to finish
6. Go to your Downloads folder
7. Right-click on the `Handover-main.zip` file
8. Click **"Extract All..."**
9. Choose where to extract (e.g., `C:\Users\YourName\Documents\Handover`)
10. Click **"Extract"**

### Option B: Using Git (If You Have It Installed)
1. Open Command Prompt or PowerShell
2. Navigate to where you want the files (e.g., `cd Documents`)
3. Type: `git clone https://github.com/tabasko81/Handover.git`
4. Press Enter
5. Wait for the download to complete

## Step 3: Run the Application

### Quick Start (Recommended)
1. Open File Explorer
2. Navigate to the `Handover` folder you extracted/downloaded
3. Find the file named **`docker-start.bat`**
4. Double-click on **`docker-start.bat`**
5. A black window (Command Prompt) will open
6. You'll see messages like:
   - "Starting Shift Handover Log with Docker..."
   - "Docker is running. Building and starting containers..."
   - Wait while it builds (this takes 2-5 minutes the first time)
7. When you see "Application is starting...", it's ready!
8. The window will pause - you can close it or leave it open

### What Happens Behind the Scenes
- Docker downloads and prepares the application (first time only)
- It starts two services: the web interface and the database
- This process takes a few minutes the first time

## Step 4: Access the Application

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Type in the address bar: **http://localhost:3000**
3. Press Enter
4. You should see the Shift Handover Log application!

**That's it! The application is now running!**

## Step 5: Stop the Application

When you're done using the application:

### Easy Way
1. Right-click on the Docker whale icon in your system tray
2. Click **"Quit Docker Desktop"**
3. This will stop everything

### Proper Way (Keeps Docker Running)
1. Open File Explorer
2. Go to the `Handover` folder
3. Find and double-click **`docker-stop.bat`**
4. This stops just the application, not Docker itself

## 🔧 Troubleshooting

### Problem: "Docker daemon is not running"
**Solution:**
1. Make sure Docker Desktop is actually running
2. Look for the whale icon in your system tray
3. If you don't see it, start Docker Desktop from the Start Menu
4. Wait for it to fully start (whale icon stops moving)
5. Try running `docker-start.bat` again

### Problem: "The system cannot find the file specified"
**Solution:**
1. Docker Desktop might not be installed
2. Go back to Step 1 and make sure Docker Desktop is installed and running
3. Restart your computer if needed

### Problem: Application won't load in browser
**Solution:**
1. Wait a bit longer (first start can take 3-5 minutes)
2. Make sure you're using the correct address: **http://localhost:3000** (not https)
3. Check if Docker Desktop is still running (whale icon visible)
4. Try refreshing the browser page (F5)
5. Close and reopen your browser

### Problem: Port already in use
**Solution:**
1. Another program might be using port 3000 or 5000
2. Close any other applications that might be using these ports
3. Restart your computer
4. Try again

### Problem: "Out of memory" or very slow
**Solution:**
1. Close other programs to free up memory
2. Restart your computer
3. Make sure Docker Desktop has enough resources:
   - Open Docker Desktop
   - Go to Settings (gear icon)
   - Go to Resources
   - Increase memory to at least 4 GB
   - Click "Apply & Restart"

### Problem: Can't find docker-start.bat
**Solution:**
1. Make sure you extracted all files from the ZIP
2. Navigate to the `Handover` folder (not `Handover-main` if you downloaded ZIP)
3. The `.bat` file should be in the main folder

### Check If Everything Is Working
1. Open Docker Desktop
2. Click on "Containers" in the left menu
3. You should see two containers running:
   - `handover-backend` (green/running)
   - `handover-frontend` (green/running)
4. If you see red or stopped containers, there's a problem
5. Click on a container and check the "Logs" tab for error messages

## 📝 Notes for Daily Use

### Starting the Application

**For First Time Setup (Full Build):**
- Double-click **`docker-build-deploy.bat`** for a complete fresh build and deployment
- This takes longer but ensures everything is built from scratch

**For Regular Use:**
- Simply double-click **`docker-start.bat`** whenever you want to use the application
- Wait for the message "Application is starting..."
- Open your browser to **http://localhost:3000**

### Viewing Logs (If Something Goes Wrong)
1. Double-click **`docker-logs.bat`** in the Handover folder
2. You'll see messages about what's happening
3. Press Ctrl+C to close the log window

### Updating the Application
1. Stop the application (run `docker-stop.bat`)
2. Delete the old Handover folder
3. Download the latest version from GitHub (Step 2)
4. Extract and run again (Step 3)

### Backup Your Data
Your data is stored in the `data` folder inside the Handover directory.
- To backup: Copy the entire `data` folder somewhere safe
- To restore: Replace the `data` folder with your backup

## ❓ Common Questions

**Q: Do I need to install Node.js or other programs?**  
A: No! Docker handles everything. You only need Docker Desktop.

**Q: Can I close the Command Prompt window after starting?**  
A: Yes, but keep Docker Desktop running (the whale icon should stay in your system tray).

**Q: Does this work offline?**  
A: The first time needs internet to download everything. After that, you can use it offline (but Docker Desktop still needs to be running).

**Q: Will this slow down my computer?**  
A: Docker uses some resources, but it shouldn't noticeably slow down a modern computer. If you're not using the application, stop it with `docker-stop.bat`.

**Q: Can multiple people use it?**  
A: Only if they're on the same computer. For multiple users, you need a more advanced setup (not covered in this guide).

**Q: How do I know if it's working?**  
A: Open **http://localhost:3000** in your browser. If you see the application interface, it's working!

## 📞 Need More Help?

If you encounter problems not covered here:
1. Check the **docs/TROUBLESHOOTING.md** file in the Handover folder
2. Make sure Docker Desktop is fully updated
3. Try restarting your computer
4. Make sure Windows is updated

## 🎉 You're Done!

Congratulations! You now have the Shift Handover Log application running on your Windows computer. Just remember:
- Keep Docker Desktop running (whale icon in system tray)
- Use `docker-start.bat` to start the application
- Use `http://localhost:3000` in your browser to access it
- Use `docker-stop.bat` to stop the application when done

Happy logging! 📝

---

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025

