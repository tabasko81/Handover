#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Command-line server launcher for Shift Handover Log
Simple terminal-only version without GUI
"""

import os
import sys
import json
import subprocess
import signal
import socket
import threading
import time
from pathlib import Path

# Configuration
CONFIG_FILE = "server_config.json"
DEFAULT_CONFIG_FILE = "server_default_config.json"
DEFAULT_PORT = 8500

# Detect if running from dist folder (executable)
BASE_DIR = Path.cwd()
current_path = BASE_DIR

# Check if we're running from inside dist folder (executable scenario)
if (current_path / "server" / "index.js").exists():
    if (current_path / "HandoverServer.exe").exists() or current_path.name == "dist":
        BASE_DIR = current_path
        NODEJS_DIR = BASE_DIR / "nodejs"
        SERVER_DIR = BASE_DIR / "server"
        CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
        DATA_DIR = BASE_DIR / "data"
    else:
        BASE_DIR = current_path
        NODEJS_DIR = BASE_DIR / "nodejs"
        SERVER_DIR = BASE_DIR / "server"
        CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
        DATA_DIR = BASE_DIR / "data"
elif (current_path / "dist" / "server" / "index.js").exists():
    BASE_DIR = current_path / "dist"
    NODEJS_DIR = BASE_DIR / "nodejs"
    SERVER_DIR = BASE_DIR / "server"
    CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
    DATA_DIR = BASE_DIR / "data"
else:
    BASE_DIR = current_path
    NODEJS_DIR = BASE_DIR / "nodejs"
    SERVER_DIR = BASE_DIR / "server"
    CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
    DATA_DIR = BASE_DIR / "data"

NODEJS_EXE = NODEJS_DIR / "node.exe"

def check_port_available(port):
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def load_default_port():
    """Load default port from configuration file"""
    port = DEFAULT_PORT
    # First check default config file
    if os.path.exists(DEFAULT_CONFIG_FILE):
        try:
            with open(DEFAULT_CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                port = config.get('default_port', DEFAULT_PORT)
        except Exception:
            pass
    # Then check saved config (last used port)
    elif os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                port = config.get('port', DEFAULT_PORT)
        except Exception:
            pass
    return port

def load_config():
    """Load saved configuration (last used port)"""
    port = load_default_port()
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                port = config.get('port', port)
        except Exception:
            pass
    return port

def save_default_port(port):
    """Save default port to configuration file"""
    try:
        config = {'default_port': port}
        with open(DEFAULT_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
    except Exception:
        pass

def save_config(port):
    """Save configuration"""
    try:
        config = {'port': port}
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
    except Exception:
        pass

def check_nodejs():
    """Check if Node.js is available"""
    if not NODEJS_EXE.exists():
        print(f"ERROR: Node.js not found at {NODEJS_EXE}")
        print("\nPlease extract portable Node.js to the 'nodejs/' folder")
        print("See README_SERVER.md for instructions.")
        return False
    return True

def check_directories():
    """Check if necessary directories exist"""
    errors = []
    if not SERVER_DIR.exists():
        errors.append(f"Folder 'server' not found")
    if not CLIENT_BUILD_DIR.exists():
        errors.append(f"Folder 'client/build' not found (frontend not compiled)")
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created folder 'data'")
    return errors

def main():
    """Main function"""
    print("=" * 50)
    print("Shift Handover Log - Command Line Server")
    print("=" * 50)
    print()
    
    # Check Node.js
    if not check_nodejs():
        sys.exit(1)
    print(f"✓ Node.js found: {NODEJS_EXE}")
    
    # Check directories
    errors = check_directories()
    if errors:
        print("\nERROR: Problems found:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    print("✓ All necessary folders found")
    print()
    
    # Get port
    default_port = load_default_port()
    last_used_port = load_config()
    
    if len(sys.argv) > 1:
        # Port provided as command-line argument
        try:
            port = int(sys.argv[1])
            if port < 1 or port > 65535:
                raise ValueError("Invalid port")
        except ValueError:
            print(f"ERROR: Invalid port '{sys.argv[1]}'. Must be between 1 and 65535.")
            sys.exit(1)
    else:
        # Prompt for port with timeout
        print(f"Enter port number (default: {default_port}, last used: {last_used_port})")
        print(f"You have {PORT_INPUT_TIMEOUT} seconds to enter a port, or default will be used...")
        print(f"Port [{default_port}]: ", end='', flush=True)
        
        user_input = ""
        input_received = threading.Event()
        
        def get_input():
            nonlocal user_input
            try:
                user_input = sys.stdin.readline().strip()
            except:
                pass
            finally:
                input_received.set()
        
        input_thread = threading.Thread(target=get_input, daemon=True)
        input_thread.start()
        
        # Wait for input or timeout
        input_received.wait(timeout=PORT_INPUT_TIMEOUT)
        
        if user_input:
            try:
                port = int(user_input)
                if port < 1 or port > 65535:
                    raise ValueError("Invalid port")
                print(f"Using port: {port}")
            except ValueError:
                print(f"ERROR: Invalid port '{user_input}'. Using default {default_port}.")
                port = default_port
        else:
            port = default_port
            print(f"\nNo input received. Using default port: {port}")
    
    # Check if port is available
    if not check_port_available(port):
        print(f"ERROR: Port {port} is already in use.")
        print("Please choose another port or stop the application using it.")
        sys.exit(1)
    
    save_config(port)
    
    # Configure environment
    env = os.environ.copy()
    env['NODE_ENV'] = 'production'
    env['PORT'] = str(port)
    env['FRONTEND_URL'] = f'http://localhost:{port}'
    
    # Server path
    server_path = SERVER_DIR / "index.js"
    if not server_path.exists():
        print(f"ERROR: Server file not found: {server_path}")
        sys.exit(1)
    
    print()
    print("=" * 50)
    print(f"Starting server on port {port}...")
    print("=" * 50)
    print()
    print(f"Server will be available at: http://localhost:{port}")
    print(f"API endpoint: http://localhost:{port}/api")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    print()
    
    # Start Node.js process
    try:
        node_path = str(NODEJS_EXE)
        server_script = str(server_path)
        working_dir = str(BASE_DIR)
        
        process = subprocess.Popen(
            [node_path, server_script],
            cwd=working_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Handle Ctrl+C
        def signal_handler(sig, frame):
            print("\n\nStopping server...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            print("Server stopped.")
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Read and print output
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[Server] {line.rstrip()}")
            process.stdout.close()
            process.wait()
        except KeyboardInterrupt:
            signal_handler(None, None)
        
    except Exception as e:
        print(f"ERROR: Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

