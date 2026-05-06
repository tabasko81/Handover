# Python Standalone Server - Shift Handover Log

This Python server allows you to run the Shift Handover Log application with a desktop GUI on Windows and Linux (including Linux Mint 22). On Linux, it can use your system Node.js from PATH. On Windows, it can use portable Node.js from `nodejs/`.

## Requirements

- **Python 3.8 or higher** (with tkinter included)
- **Node.js 18+**:
  - Linux: installed in PATH (`node --version`)
  - Windows: portable Node.js in `nodejs/` or global Node.js in PATH

## Quick Installation

### 1. Verify Python

Make sure you have Python installed:

```bash
python --version
```

If you don't have Python, download it from: https://www.python.org/downloads/

### 2. Node.js Setup

#### Linux (Mint 22 / Ubuntu based)

```bash
sudo apt update
sudo apt install -y nodejs npm python3-tk
```

Then validate:

```bash
node --version
python3 -m tkinter
```

#### Windows - Portable Node.js (Recommended)

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
- ✅ `nodejs/node.exe` (Windows portable mode) or `node` available in PATH (Linux/global mode)

## Usage

### Running the Server

1. Run the Python script:

```bash
python server.py
# Linux (recommended)
python3 server.py
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
- ✅ Works with portable Node.js or system Node.js
- ✅ Linux auto-start support via `systemd --user`

## Troubleshooting

### Error: "Node.js not found"

- Verify that `node --version` works (Linux/global install)
- Or verify that `nodejs/node.exe` exists (portable Windows mode)
- Make sure Node.js is installed and accessible in PATH

### Error: "Port already in use"

- Choose another port
- Close other applications that might be using the port
- Check if there's another server instance running

### Error: "Folder 'client/build' not found"

- The frontend needs to be compiled
- Run: `cd client && npm run build`
- Make sure the `client/build/` folder exists

### Linux Mint: tkinter error

- If GUI does not start and mentions tkinter, install it:
  - `sudo apt install -y python3-tk`

### Error: "Network Error" when configuring admin

- The frontend was compiled with an absolute API URL (e.g., `http://localhost:8500/api`)
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
