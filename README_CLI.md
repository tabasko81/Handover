# Command-Line Server Launcher

Simple terminal-only launcher for the Shift Handover Log server. No GUI required - perfect for headless servers, SSH sessions, or when you prefer command-line tools.

## Quick Start

### Basic Usage

```bash
python server-cli.py
```

The script will:
1. Check for Node.js and required folders
2. Prompt for port number with 10-second timeout (or use default from `server_default_config.json`)
3. Start the server
4. Display server logs in the terminal

### Specify Port

```bash
python server-cli.py 9000
```

Starts the server on port 9000 without prompting.

## Requirements

Same as the GUI version:
- **Python 3.8 or higher**
- **Portable Node.js** in `nodejs/` folder
- **Compiled frontend** in `client/build/`
- **Server code** in `server/` folder

## Features

- ✅ Terminal-only interface (no GUI dependencies)
- ✅ Port configuration via command-line argument or prompt
- ✅ 10-second timeout for port input (uses default if no input)
- ✅ Real-time server logs in terminal
- ✅ Graceful shutdown with Ctrl+C
- ✅ Automatic port availability check
- ✅ Saves last used port to `server_config.json`
- ✅ Default port configurable in `server_default_config.json`
- ✅ Works from project root or `dist/` folder

## Usage Examples

### Start with default port (8500)

```bash
python server-cli.py
```

### Start on specific port

```bash
python server-cli.py 3000
```

### From dist folder (executable distribution)

```bash
cd dist
python ../server-cli.py
# or if Python is in PATH:
python server-cli.py
```

## Output

The launcher displays:

```
==================================================
Shift Handover Log - Command Line Server
==================================================

✓ Node.js found: nodejs\node.exe
✓ All necessary folders found

Enter port number [8500] (10 seconds timeout): 

==================================================
Starting server on port 8500...
==================================================

Server will be available at: http://localhost:8500
API endpoint: http://localhost:8500/api

Press Ctrl+C to stop the server
==================================================

[Server] Server running on port 8500
[Server] API available at http://localhost:8500/api
```

## Stopping the Server

Press **Ctrl+C** to stop the server gracefully. The script will:
1. Send termination signal to Node.js process
2. Wait up to 5 seconds for graceful shutdown
3. Force kill if necessary
4. Display "Server stopped." message

## Configuration

### Port Configuration

The launcher uses two configuration files:

1. **`server_default_config.json`** - Default port (used when timeout expires or no input)
   ```json
   {
     "default_port": 8500
   }
   ```

2. **`server_config.json`** - Last used port (auto-created, shared with GUI version)

**Port Selection Priority:**
1. Command-line argument (e.g., `python server-cli.py 9000`)
2. User input (within 10 seconds)
3. Last used port from `server_config.json`
4. Default port from `server_default_config.json`
5. Hard-coded default (8500)

### Timeout Behavior

When running without arguments, the launcher will:
- Prompt for port number
- Wait up to 10 seconds for input
- If no input is provided, use the default port from `server_default_config.json`
- This allows for automated/scripted usage without manual intervention

## Error Handling

The launcher checks for common issues and displays clear error messages:

- **Node.js not found**: Shows path where Node.js should be
- **Port already in use**: Suggests choosing another port
- **Missing folders**: Lists which folders are missing
- **Invalid port**: Validates port range (1-65535)

## Comparison: CLI vs GUI

| Feature | CLI (`server-cli.py`) | GUI (`server.py`) |
|---------|----------------------|-------------------|
| Interface | Terminal only | Graphical window |
| Port config | Command-line arg or prompt | GUI input field |
| Logs | Terminal output | GUI text area |
| Browser auto-open | No | Yes |
| Best for | Servers, SSH, automation | Desktop use |

## Integration

### Windows Service

You can run the CLI launcher as a Windows service using tools like:
- NSSM (Non-Sucking Service Manager)
- Windows Task Scheduler

### Background Process

On Windows, you can run it in the background:

```cmd
start /B python server-cli.py 8500
```

### Batch File Wrapper

Create a simple batch file to start the server:

```batch
@echo off
cd /d %~dp0
python server-cli.py 8500
pause
```

## Troubleshooting

### Server won't start

- Check that Node.js exists in `nodejs/node.exe`
- Verify `server/index.js` exists
- Ensure `client/build/` folder exists
- Check if port is already in use

### Port already in use

```bash
# Windows: Find process using port
netstat -ano | findstr :8500

# Then kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### No output/logs

- Check that Node.js is working: `nodejs\node.exe --version`
- Verify server code is correct
- Check for errors in the terminal

## Creating Executable

To create a standalone executable from the CLI launcher:

### Quick Method

```bash
build-exe-cli.bat
```

This will:
- Install PyInstaller if needed
- Create `HandoverServerCLI.exe` in `dist/`
- Copy all required files (nodejs, server, client/build, etc.)
- Install Node.js dependencies
- Create a complete distribution package

### Manual Method

```bash
pip install pyinstaller
pyinstaller --onefile --console --name "HandoverServerCLI" server-cli.py
```

### Distribution

The executable needs to be in the same folder as:
- `nodejs/` - Portable Node.js
- `server/` - Server code
- `client/build/` - Compiled frontend
- `node_modules/` - Node.js dependencies
- `data/` - Data folder (created automatically)

The `build-exe-cli.bat` script automatically copies all these files to `dist/`.

### Running the Executable

```bash
# From dist folder
cd dist
HandoverServerCLI.exe

# Or with port
HandoverServerCLI.exe 9000
```

## See Also

- `README_SERVER.md` - Full server documentation
- `server.py` - GUI version of the server
- `build-exe.bat` - Create GUI executable distribution
- `build-exe-cli.bat` - Create CLI executable distribution

