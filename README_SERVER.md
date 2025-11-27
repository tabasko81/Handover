# Python Standalone Server - Shift Handover Log

This Python server allows you to run the Shift Handover Log application on Windows without needing to install Node.js globally. You only need Python installed and a portable Node.js.

## Requirements

- **Python 3.8 or higher** (with tkinter included)
- **Portable Node.js** (see instructions below)

## Quick Installation

### 1. Verify Python

Make sure you have Python installed:

```bash
python --version
```

If you don't have Python, download it from: https://www.python.org/downloads/

### 2. Include Portable Node.js

#### Option A: Manual Download (Recommended)

1. Download Node.js LTS for Windows x64:
   - Visit: https://nodejs.org/
   - Download the LTS (Long Term Support) version
   - Choose Windows Installer (.msi) or Windows Binary (.zip)

2. If you downloaded the .msi:
   - Run the installer
   - Copy `node.exe` from `C:\Program Files\nodejs\` to `nodejs\node.exe`
   - Copy `npm.cmd` from `C:\Program Files\nodejs\` to `nodejs\npm.cmd`

3. If you downloaded the .zip:
   - Extract the file
   - Copy `node.exe` to `nodejs\node.exe`
   - Copy `npm.cmd` to `nodejs\npm.cmd`

#### Option B: Folder Structure

Create the following structure:

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

### 3. Verify Structure

Make sure you have:
- ✅ `server/` - Backend folder
- ✅ `client/build/` - Compiled frontend
- ✅ `data/` - Data folder (will be created automatically if it doesn't exist)
- ✅ `nodejs/node.exe` - Portable Node.js

## Usage

### Running the Server

1. Run the Python script:

```bash
python server.py
```

2. A graphical window will open with:
   - Field to configure the port (default: 8500)
   - "Start Server" button
   - "Stop Server" button
   - "Open in Browser" button
   - Logs area

3. Configure the desired port (or use the default 8500)

4. Click "Start Server"

5. Wait a few seconds for the server to start

6. The browser will open automatically, or click "Open in Browser"

### Accessing the Application

After starting the server, access:

- **Frontend and Backend**: http://localhost:8500 (or the configured port)
- **API**: http://localhost:8500/api
- **Health Check**: http://localhost:8500/api/health

### Default Credentials

- **Username**: `admin`
- **Password**: `pass123`

⚠️ **IMPORTANT**: Change the password immediately after first login!

## Features

- ✅ Simple and intuitive graphical interface
- ✅ Custom port configuration
- ✅ Real-time logs
- ✅ Automatic browser opening
- ✅ Automatic process management
- ✅ Saves last used port
- ✅ Dependency verification
- ✅ No need to install Node.js globally

## Troubleshooting

### Error: "Node.js not found"

- Verify that `nodejs/node.exe` exists
- Make sure you copied the correct file
- Try downloading Node.js again

### Error: "Port already in use"

- Choose another port
- Close other applications that might be using the port
- Check if there's another server instance running

### Error: "Folder 'client/build' not found"

- The frontend needs to be compiled
- Run: `cd client && npm run build`
- Make sure the `client/build/` folder exists

### Error: "Network Error" when configuring admin

- The frontend was compiled with an absolute API URL (e.g., `http://localhost:5000/api`)
- But the server is running on a different port (e.g., 8500)
- **Solution**: Recompile the frontend with relative URL:
  - Run `rebuild-frontend.bat` (Windows)
  - Or manually: `cd client && set REACT_APP_API_URL=/api && npm run build`
- This will make the frontend use relative URLs (`/api`) that work on any port

### Error: "Folder 'server' not found"

- Make sure you're running the script from the project root folder
- Verify that the `server/` folder exists

### Server won't start

- Check the logs in the graphical interface
- Make sure all Node.js dependencies are installed
- Verify that the database is accessible in `data/`

## Create Executable (.exe)

To create a Windows executable using PyInstaller:

### Quick Method (Recommended)

1. Run the script:

```bash
build-exe.bat
```

The script will:
- Install PyInstaller automatically if needed
- Create the executable `HandoverServer.exe`
- Place the executable in `dist/HandoverServer.exe`
- Copy all required files to `dist/` folder

### Manual Method

1. Install PyInstaller:

```bash
pip install pyinstaller
```

2. Create the executable:

```bash
pyinstaller --onefile --windowed --name "HandoverServer" server.py
```

3. The executable will be in `dist/HandoverServer.exe`

### Executable Distribution

The executable needs to be in the same folder as:

```
Handover/
├── HandoverServer.exe (the executable)
├── nodejs/              (portable Node.js)
│   ├── node.exe
│   └── npm.cmd
├── server/               (server code)
├── client/build/         (compiled frontend)
└── data/                 (will be created automatically)
```

**Note**: 
- The executable is standalone (doesn't need Python installed)
- But still needs the `nodejs/`, `server/` and `client/build/` folders
- You can distribute everything together in a ZIP folder
- The `build-exe.bat` script automatically copies all required files to `dist/`

## File Structure

```
Handover/
├── server.py              # Main server script
├── server_config.json     # Saved configuration (created automatically)
├── requirements.txt       # Python dependencies
├── README_SERVER.md       # This file
├── nodejs/                # Portable Node.js (to include manually)
│   ├── node.exe
│   └── npm.cmd
├── server/                # Node.js backend
│   ├── index.js
│   ├── routes/
│   ├── database/
│   └── ...
├── client/                # React frontend
│   └── build/             # Compiled frontend
└── data/                  # Application data
    ├── config.json
    └── shift_logs.db
```

## Support

For more information about the application, see:
- `README.md` - Main documentation
- `docs/` - Additional documentation
