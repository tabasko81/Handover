#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python Standalone Server for Shift Handover Log
Allows running the application without installations on Windows
"""

import os
import sys
import json
import subprocess
import threading
import socket
import webbrowser
from pathlib import Path
from tkinter import Tk, Label, Entry, Button, Text, Scrollbar, Frame, messagebox
from tkinter.scrolledtext import ScrolledText

# Debug flag - set to True to enable verbose logging
DEBUG = True

# Configuration
CONFIG_FILE = "server_config.json"
DEFAULT_PORT = 8500

# Detect if running from dist folder (executable)
# When the .exe is executed, Path.cwd() returns the directory where the .exe is located
BASE_DIR = Path.cwd()
current_path = BASE_DIR

# Check if we're running from inside dist folder (executable scenario)
# Look for server/index.js and HandoverServer.exe in current directory
if (current_path / "server" / "index.js").exists():
    # We're in a folder that has server/index.js
    # Check if HandoverServer.exe exists (executable) or if we're in dist
    if (current_path / "HandoverServer.exe").exists() or current_path.name == "dist":
        # Running from inside dist folder (executable was run from dist/)
        BASE_DIR = current_path
        NODEJS_DIR = BASE_DIR / "nodejs"
        SERVER_DIR = BASE_DIR / "server"
        CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
        DATA_DIR = BASE_DIR / "data"
    else:
        # Running from project root
        BASE_DIR = current_path
        NODEJS_DIR = BASE_DIR / "nodejs"
        SERVER_DIR = BASE_DIR / "server"
        CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
        DATA_DIR = BASE_DIR / "data"
elif (current_path / "dist" / "server" / "index.js").exists():
    # Running from project root, but dist exists
    BASE_DIR = current_path / "dist"
    NODEJS_DIR = BASE_DIR / "nodejs"
    SERVER_DIR = BASE_DIR / "server"
    CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
    DATA_DIR = BASE_DIR / "data"
else:
    # Running from project root
    BASE_DIR = current_path
    NODEJS_DIR = BASE_DIR / "nodejs"
    SERVER_DIR = BASE_DIR / "server"
    CLIENT_BUILD_DIR = BASE_DIR / "client" / "build"
    DATA_DIR = BASE_DIR / "data"

NODEJS_EXE = NODEJS_DIR / "node.exe"

class ServerManager:
    def __init__(self):
        self.process = None
        self.port = DEFAULT_PORT
        self.is_running = False
        self.root = None
        self.log_text = None
        self.port_entry = None
        self.start_button = None
        self.stop_button = None
        
    def log(self, message):
        """Adds message to the logs area"""
        if self.log_text:
            self.log_text.insert("end", f"{message}\n")
            self.log_text.see("end")
            self.root.update_idletasks()
        print(message)
    
    def check_nodejs(self):
        """Checks if portable Node.js is available"""
        if not NODEJS_EXE.exists():
            return False, f"Node.js not found at {NODEJS_EXE}\n\nPlease extract portable Node.js to the 'nodejs/' folder\nSee README_SERVER.md for instructions."
        return True, None
    
    def check_port_available(self, port):
        """Checks if the port is available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return True
        except OSError:
            return False
    
    def check_directories(self):
        """Checks if necessary folders exist"""
        errors = []
        if not SERVER_DIR.exists():
            errors.append(f"Folder 'server' not found")
        if not CLIENT_BUILD_DIR.exists():
            errors.append(f"Folder 'client/build' not found (frontend not compiled)")
        if not DATA_DIR.exists():
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            self.log(f"Folder 'data' created")
        return errors
    
    def load_config(self):
        """Loads saved configuration"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.port = config.get('port', DEFAULT_PORT)
            except Exception as e:
                self.log(f"Error loading configuration: {e}")
                self.port = DEFAULT_PORT
        else:
            self.port = DEFAULT_PORT
    
    def save_config(self):
        """Saves configuration"""
        try:
            config = {'port': self.port}
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            self.log(f"Error saving configuration: {e}")
    
    def start_server(self):
        """Starts the Node.js server"""
        if self.is_running:
            messagebox.showwarning("Warning", "The server is already running!")
            return
        
        # Validate Node.js
        node_ok, error_msg = self.check_nodejs()
        if not node_ok:
            messagebox.showerror("Error", error_msg)
            return
        
        # Validate folders
        errors = self.check_directories()
        if errors:
            messagebox.showerror("Error", "Problems found:\n\n" + "\n".join(errors))
            return
        
        # Get port from input field
        try:
            port = int(self.port_entry.get())
            if port < 1 or port > 65535:
                raise ValueError("Invalid port")
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid port (1-65535)")
            return
        
        # Check if port is available
        if not self.check_port_available(port):
            messagebox.showerror("Error", f"Port {port} is already in use. Please choose another port.")
            return
        
        self.port = port
        self.save_config()
        
        # Configure environment variables
        env = os.environ.copy()
        env['NODE_ENV'] = 'production'
        env['PORT'] = str(self.port)
        env['FRONTEND_URL'] = f'http://localhost:{self.port}'
        # Note: REACT_APP_API_URL is defined at build time, but since we serve everything on the same port,
        # relative requests /api will work correctly
        
        # Server path
        server_path = SERVER_DIR / "index.js"
        if not server_path.exists():
            messagebox.showerror("Error", f"Server file not found: {server_path}")
            return
        
        # Start Node.js process
        try:
            self.log(f"Starting server on port {self.port}...")
            self.log(f"=== DEBUG INFO ===")
            self.log(f"BASE_DIR: {BASE_DIR}")
            self.log(f"BASE_DIR exists: {BASE_DIR.exists()}")
            self.log(f"Node.js path: {NODEJS_EXE}")
            self.log(f"Node.js exists: {NODEJS_EXE.exists()}")
            self.log(f"Server path: {server_path}")
            self.log(f"Server exists: {server_path.exists()}")
            
            # Check for node_modules in different locations
            node_modules_root = BASE_DIR / "node_modules"
            node_modules_server = SERVER_DIR / "node_modules"
            self.log(f"node_modules in BASE_DIR ({node_modules_root}): {node_modules_root.exists()}")
            self.log(f"node_modules in SERVER_DIR ({node_modules_server}): {node_modules_server.exists()}")
            
            # List what's in BASE_DIR
            if BASE_DIR.exists():
                self.log(f"Contents of BASE_DIR:")
                try:
                    for item in sorted(BASE_DIR.iterdir()):
                        if item.is_dir():
                            self.log(f"  [DIR]  {item.name}")
                        else:
                            self.log(f"  [FILE] {item.name}")
                except Exception as e:
                    self.log(f"  Error listing directory: {e}")
            
            # Use portable Node.js
            node_path = str(NODEJS_EXE)
            server_script = str(server_path)
            
            # Set working directory to BASE_DIR so Node.js can find node_modules
            # Node.js looks for node_modules relative to the current working directory
            working_dir = str(BASE_DIR)
            
            self.log(f"Working directory: {working_dir}")
            self.log(f"Current working directory: {os.getcwd()}")
            self.log(f"Node modules expected at: {Path(working_dir) / 'node_modules'}")
            self.log(f"Node modules exists: {(Path(working_dir) / 'node_modules').exists()}")
            
            # Check if express exists
            express_path = Path(working_dir) / "node_modules" / "express"
            self.log(f"Express module path: {express_path}")
            self.log(f"Express module exists: {express_path.exists()}")
            
            self.log(f"==================")
            
            self.process = subprocess.Popen(
                [node_path, server_script],
                cwd=working_dir,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            self.is_running = True
            self.update_ui_state()
            
            # Thread to read process output
            def read_output():
                try:
                    for line in iter(self.process.stdout.readline, ''):
                        if line:
                            self.log(f"[Server] {line.strip()}")
                    self.process.stdout.close()
                    self.process.wait()
                    self.is_running = False
                    self.update_ui_state()
                    self.log("Server stopped.")
                except Exception as e:
                    self.log(f"Error reading output: {e}")
                    self.is_running = False
                    self.update_ui_state()
            
            thread = threading.Thread(target=read_output, daemon=True)
            thread.start()
            
            # Wait a bit and check if the process is still running
            threading.Timer(2.0, self.check_server_started).start()
            
            self.log(f"Server started! Access: http://localhost:{self.port}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error starting server:\n{str(e)}")
            self.is_running = False
            self.update_ui_state()
    
    def check_server_started(self):
        """Checks if the server started correctly"""
        if self.process and self.process.poll() is not None:
            # Process terminated
            self.is_running = False
            self.update_ui_state()
            messagebox.showerror("Error", "The server terminated unexpectedly. Check the logs.")
        elif self.is_running:
            # Server is running, open browser after a few seconds
            threading.Timer(3.0, self.open_browser).start()
    
    def open_browser(self):
        """Opens the browser at the server address"""
        if self.is_running:
            url = f"http://localhost:{self.port}"
            try:
                webbrowser.open(url)
                self.log(f"Browser opened: {url}")
            except Exception as e:
                self.log(f"Error opening browser: {e}")
    
    def stop_server(self):
        """Stops the Node.js server"""
        if not self.is_running or not self.process:
            messagebox.showinfo("Info", "The server is not running.")
            return
        
        try:
            self.log("Stopping server...")
            self.process.terminate()
            
            # Wait up to 5 seconds for graceful termination
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force termination
                self.log("Forcing server termination...")
                self.process.kill()
                self.process.wait()
            
            self.is_running = False
            self.update_ui_state()
            self.log("Server stopped successfully.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error stopping server:\n{str(e)}")
            self.is_running = False
            self.update_ui_state()
    
    def update_ui_state(self):
        """Updates the interface state"""
        if self.start_button and self.stop_button:
            if self.is_running:
                self.start_button.config(state='disabled')
                self.stop_button.config(state='normal')
                self.port_entry.config(state='disabled')
            else:
                self.start_button.config(state='normal')
                self.stop_button.config(state='disabled')
                self.port_entry.config(state='normal')
    
    def on_closing(self):
        """Called when the window is closed"""
        if self.is_running:
            if messagebox.askokcancel("Exit", "The server is running. Do you want to stop and exit?"):
                self.stop_server()
                self.root.after(1000, self.root.destroy)
        else:
            self.root.destroy()
    
    def create_gui(self):
        """Creates the graphical interface"""
        self.root = Tk()
        self.root.title("Shift Handover Log - Server")
        self.root.geometry("700x600")
        self.root.resizable(True, True)
        
        # Load configuration
        self.load_config()
        
        # Main frame
        main_frame = Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill='both', expand=True)
        
        # Title
        title_label = Label(main_frame, text="Shift Handover Log - Server", 
                           font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Configuration frame
        config_frame = Frame(main_frame)
        config_frame.pack(fill='x', pady=(0, 10))
        
        port_label = Label(config_frame, text="Port:", font=("Arial", 10))
        port_label.pack(side='left', padx=(0, 10))
        
        self.port_entry = Entry(config_frame, width=10, font=("Arial", 10))
        self.port_entry.insert(0, str(self.port))
        self.port_entry.pack(side='left', padx=(0, 10))
        
        # Control buttons
        button_frame = Frame(main_frame)
        button_frame.pack(fill='x', pady=(0, 10))
        
        self.start_button = Button(button_frame, text="Start Server", 
                                   command=self.start_server,
                                   bg="#4CAF50", fg="white", 
                                   font=("Arial", 10, "bold"),
                                   padx=20, pady=10)
        self.start_button.pack(side='left', padx=(0, 10))
        
        self.stop_button = Button(button_frame, text="Stop Server", 
                                 command=self.stop_server,
                                 bg="#f44336", fg="white",
                                 font=("Arial", 10, "bold"),
                                 padx=20, pady=10,
                                 state='disabled')
        self.stop_button.pack(side='left', padx=(0, 10))
        
        open_browser_button = Button(button_frame, text="Open in Browser", 
                                     command=self.open_browser,
                                     bg="#2196F3", fg="white",
                                     font=("Arial", 10),
                                     padx=15, pady=10)
        open_browser_button.pack(side='left')
        
        # Logs area
        log_label = Label(main_frame, text="Logs:", font=("Arial", 10, "bold"))
        log_label.pack(anchor='w', pady=(10, 5))
        
        self.log_text = ScrolledText(main_frame, height=20, width=80,
                                     font=("Consolas", 9),
                                     wrap='word')
        self.log_text.pack(fill='both', expand=True)
        
        # Initial status
        self.log("Server ready. Configure the port and click 'Start Server'.")
        
        # Check Node.js
        node_ok, error_msg = self.check_nodejs()
        if not node_ok:
            self.log(f"⚠️ {error_msg}")
        else:
            self.log(f"✓ Node.js found: {NODEJS_EXE}")
        
        # Check folders
        errors = self.check_directories()
        if errors:
            for error in errors:
                self.log(f"⚠️ {error}")
        else:
            self.log("✓ All necessary folders found")
        
        # Update UI state
        self.update_ui_state()
        
        # Handler for window close
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Start interface loop
        self.root.mainloop()

def main():
    """Main function"""
    manager = ServerManager()
    manager.create_gui()

if __name__ == "__main__":
    main()
