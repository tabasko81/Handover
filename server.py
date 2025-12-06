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
import re
from pathlib import Path
from tkinter import Tk, Label, Entry, Button, Text, Scrollbar, Frame, messagebox, Toplevel, Radiobutton, IntVar
from tkinter.scrolledtext import ScrolledText

# Debug flag - set to True to enable verbose logging
DEBUG = True

# Configuration
CONFIG_FILE = "server_config.json"
DEFAULT_CONFIG_FILE = "server_default_config.json"
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
        
        # Server configuration state
        self.auto_start_enabled = False
        self.auto_start_mode = 'gui'  # 'gui' or 'cli'
        self.auto_start_delay = 0
        self.firewall_port = None
        self.local_ip = None
        
        # UI elements for server config
        self.auto_start_status_label = None
        self.auto_start_button = None
        self.firewall_status_label = None
        self.firewall_button = None
        self.ip_label = None
        self.refresh_ip_button = None
        
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
        # Try to load from server_config.json first
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.port = config.get('port', DEFAULT_PORT)
                    self.auto_start_enabled = config.get('auto_start_enabled', False)
                    self.auto_start_mode = config.get('auto_start_mode', 'gui')
                    self.auto_start_delay = config.get('auto_start_delay', 0)
                    self.firewall_port = config.get('firewall_port', None)
            except Exception as e:
                self.log(f"Error loading configuration: {e}")
                self.port = DEFAULT_PORT
        # Try to load from server_default_config.json
        elif os.path.exists(DEFAULT_CONFIG_FILE):
            try:
                with open(DEFAULT_CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.port = config.get('default_port', DEFAULT_PORT)
            except Exception as e:
                self.log(f"Error loading default configuration: {e}")
                self.port = DEFAULT_PORT
        else:
            self.port = DEFAULT_PORT
        
        # Check actual status
        self.auto_start_enabled = self.check_auto_start_status()
        self.firewall_port = self.get_firewall_port()
        self.local_ip = self.get_local_ip()
    
    def save_config(self):
        """Saves configuration"""
        try:
            config = {
                'port': self.port,
                'auto_start_enabled': self.auto_start_enabled,
                'auto_start_mode': self.auto_start_mode,
                'auto_start_delay': self.auto_start_delay,
                'firewall_port': self.firewall_port
            }
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
    
    def check_auto_start_status(self):
        """Checks if auto-start is configured"""
        try:
            result = subprocess.run(
                ['schtasks', '/Query', '/TN', 'HandoverServer'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception as e:
            if DEBUG:
                self.log(f"Error checking auto-start status: {e}")
            return False
    
    def get_firewall_port(self):
        """Gets the port from firewall rule if it exists"""
        try:
            # Check if firewall rule exists
            result = subprocess.run(
                ['powershell', '-Command', 
                 'Get-NetFirewallRule -DisplayName "Handover Server" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty DisplayName'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0 and result.stdout.strip():
                # Try to get the port from the rule
                port_result = subprocess.run(
                    ['powershell', '-Command',
                     'Get-NetFirewallRule -DisplayName "Handover Server" | Get-NetFirewallPortFilter | Select-Object -ExpandProperty LocalPort'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if port_result.returncode == 0:
                    port_str = port_result.stdout.strip()
                    try:
                        return int(port_str)
                    except ValueError:
                        pass
            return None
        except Exception as e:
            if DEBUG:
                self.log(f"Error checking firewall: {e}")
            return None
    
    def check_firewall_status(self):
        """Checks if firewall rule exists"""
        return self.get_firewall_port() is not None
    
    def get_local_ip(self):
        """Gets the local IP address"""
        try:
            # Method 1: Try using socket
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            try:
                # Connect to a remote address (doesn't actually send data)
                s.connect(('8.8.8.8', 80))
                ip = s.getsockname()[0]
                s.close()
                if ip and ip != '127.0.0.1':
                    return ip
            except Exception:
                try:
                    s.close()
                except:
                    pass
            
            # Method 2: Use ipconfig
            result = subprocess.run(
                ['ipconfig'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                # Find IPv4 addresses
                lines = result.stdout.split('\n')
                ips_found = []
                for line in lines:
                    if 'IPv4' in line or 'IPv4 Address' in line:
                        # Extract IP address
                        match = re.search(r'(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})', line)
                        if match:
                            ip = match.group(1)
                            if ip != '127.0.0.1' and not ip.startswith('169.254'):
                                ips_found.append(ip)
                
                # Return first valid IP found
                if ips_found:
                    return ips_found[0]
            
            return None
        except Exception as e:
            if DEBUG:
                self.log(f"Error getting local IP: {e}")
            return None
    
    def setup_auto_start(self, gui_mode=True, delay=0):
        """Sets up auto-start using Windows Task Scheduler"""
        try:
            # Determine executable path
            if gui_mode:
                exe_name = "HandoverServer.exe"
            else:
                exe_name = "HandoverServerCLI.exe"
            
            exe_path = BASE_DIR / exe_name
            if not exe_path.exists():
                return False, f"{exe_name} not found in {BASE_DIR}"
            
            # Build task command
            if gui_mode:
                task_command = f'"{exe_path}"'
            else:
                task_command = f'"{exe_path}" {self.port}'
            
            # Build schtasks command
            cmd = ['schtasks', '/Create', '/TN', 'HandoverServer', '/TR', task_command,
                   '/SC', 'ONSTART', '/RL', 'HIGHEST', '/F']
            
            if delay > 0:
                delay_str = f'0000:{delay:02d}'
                cmd.extend(['/DELAY', delay_str])
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                self.auto_start_enabled = True
                self.auto_start_mode = 'gui' if gui_mode else 'cli'
                self.auto_start_delay = delay
                self.save_config()
                return True, "Auto-start configured successfully"
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                if 'access is denied' in error_msg.lower() or 'privileges' in error_msg.lower():
                    return False, "Administrator privileges required. Please run as administrator."
                return False, f"Failed to create scheduled task: {error_msg}"
        except subprocess.TimeoutExpired:
            return False, "Operation timed out"
        except Exception as e:
            return False, f"Error setting up auto-start: {str(e)}"
    
    def remove_auto_start(self):
        """Removes auto-start configuration"""
        try:
            result = subprocess.run(
                ['schtasks', '/Delete', '/TN', 'HandoverServer', '/F'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                self.auto_start_enabled = False
                self.save_config()
                return True, "Auto-start removed successfully"
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                if 'access is denied' in error_msg.lower():
                    return False, "Administrator privileges required. Please run as administrator."
                return False, f"Failed to remove scheduled task: {error_msg}"
        except subprocess.TimeoutExpired:
            return False, "Operation timed out"
        except Exception as e:
            return False, f"Error removing auto-start: {str(e)}"
    
    def open_firewall_port(self, port):
        """Opens firewall port using PowerShell"""
        try:
            # Check if rule already exists
            check_cmd = ['powershell', '-Command',
                        'Get-NetFirewallRule -DisplayName "Handover Server" -ErrorAction SilentlyContinue']
            check_result = subprocess.run(check_cmd, capture_output=True, text=True, timeout=5)
            
            if check_result.returncode == 0 and check_result.stdout.strip():
                # Remove existing rule first
                remove_cmd = ['powershell', '-Command',
                             'Remove-NetFirewallRule -DisplayName "Handover Server" -ErrorAction SilentlyContinue']
                subprocess.run(remove_cmd, timeout=5)
            
            # Create new firewall rule
            # Note: This requires admin privileges, so we'll use Start-Process with RunAs
            ps_script = f'''
            $rule = Get-NetFirewallRule -DisplayName "Handover Server" -ErrorAction SilentlyContinue
            if ($rule) {{
                Remove-NetFirewallRule -DisplayName "Handover Server" -ErrorAction SilentlyContinue
            }}
            New-NetFirewallRule -DisplayName "Handover Server" -Direction Inbound -LocalPort {port} -Protocol TCP -Action Allow -Description "Allow inbound connections for Shift Handover Log server on port {port}"
            '''
            
            # Try to create rule directly first
            cmd = ['powershell', '-Command', ps_script]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                self.firewall_port = port
                self.save_config()
                return True, f"Firewall port {port} opened successfully"
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                if 'access is denied' in error_msg.lower() or 'administrator' in error_msg.lower():
                    # Try with elevation
                    return self._open_firewall_with_elevation(port)
                return False, f"Failed to open firewall port: {error_msg}"
        except subprocess.TimeoutExpired:
            return False, "Operation timed out"
        except Exception as e:
            return False, f"Error opening firewall port: {str(e)}"
    
    def _open_firewall_with_elevation(self, port):
        """Opens firewall port with elevation (requires user interaction)"""
        try:
            ps_script = f'''
            Start-Process powershell -ArgumentList '-NoProfile -Command New-NetFirewallRule -DisplayName "Handover Server" -Direction Inbound -LocalPort {port} -Protocol TCP -Action Allow -Description "Allow inbound connections for Shift Handover Log server on port {port}"' -Verb RunAs
            '''
            result = subprocess.run(
                ['powershell', '-Command', ps_script],
                timeout=15
            )
            # We can't easily check if it succeeded with RunAs, so we'll check after
            if self.check_firewall_status():
                self.firewall_port = port
                self.save_config()
                return True, f"Firewall port {port} opened successfully (elevated)"
            else:
                return False, "Please run as administrator to open firewall port"
        except Exception as e:
            return False, f"Error opening firewall port with elevation: {str(e)}"
    
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
        
        # Update server config UI
        self.update_server_config_ui()
    
    def update_server_config_ui(self):
        """Updates the server configuration UI elements"""
        if not self.root:
            return
        
        # Update auto-start status
        if self.auto_start_status_label:
            if self.auto_start_enabled:
                self.auto_start_status_label.config(
                    text="Status: Configured",
                    fg="green"
                )
            else:
                self.auto_start_status_label.config(
                    text="Status: Not configured",
                    fg="gray"
                )
        
        # Update auto-start button
        if self.auto_start_button:
            if self.auto_start_enabled:
                self.auto_start_button.config(text="Remove Auto-Start")
            else:
                self.auto_start_button.config(text="Setup Auto-Start")
        
        # Update firewall status
        if self.firewall_status_label:
            if self.firewall_port:
                self.firewall_status_label.config(
                    text=f"Status: Port {self.firewall_port} is open",
                    fg="green"
                )
            else:
                self.firewall_status_label.config(
                    text="Status: Port not open",
                    fg="gray"
                )
        
        # Update firewall button
        if self.firewall_button:
            if self.firewall_port:
                self.firewall_button.config(text="Refresh Firewall Status", state='normal')
            else:
                self.firewall_button.config(text="Open Firewall Port", state='normal')
        
        # Update IP label
        if self.ip_label:
            if self.local_ip:
                self.ip_label.config(text=f"Local IP: {self.local_ip}")
            else:
                self.ip_label.config(text="Local IP: Not available")
    
    def refresh_status(self):
        """Refreshes all status information"""
        self.auto_start_enabled = self.check_auto_start_status()
        self.firewall_port = self.get_firewall_port()
        self.local_ip = self.get_local_ip()
        self.update_server_config_ui()
        self.log("Status refreshed")
    
    def handle_auto_start(self):
        """Handles auto-start setup/removal"""
        if self.auto_start_enabled:
            # Remove auto-start
            if messagebox.askyesno("Remove Auto-Start", 
                                   "Are you sure you want to remove auto-start configuration?"):
                success, message = self.remove_auto_start()
                if success:
                    messagebox.showinfo("Success", message)
                    self.log(f"Auto-start removed: {message}")
                else:
                    messagebox.showerror("Error", message)
                    self.log(f"Failed to remove auto-start: {message}")
                self.refresh_status()
        else:
            # Setup auto-start - show dialog
            self.show_auto_start_dialog()
    
    def show_auto_start_dialog(self):
        """Shows dialog to configure auto-start"""
        dialog = Toplevel(self.root)
        dialog.title("Configure Auto-Start")
        dialog.geometry("400x250")
        dialog.resizable(False, False)
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Center dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")
        
        mode_var = IntVar(value=0)  # 0 = GUI, 1 = CLI
        delay_var = IntVar(value=0)
        
        # Mode selection
        mode_frame = Frame(dialog, padx=20, pady=10)
        mode_frame.pack(fill='x')
        
        Label(mode_frame, text="Server Type:", font=("Arial", 10, "bold")).pack(anchor='w')
        
        Radiobutton(mode_frame, text="GUI Version (HandoverServer.exe)", 
                   variable=mode_var, value=0, font=("Arial", 9)).pack(anchor='w', padx=(20, 0))
        Label(mode_frame, text="  Shows a graphical window", 
             font=("Arial", 8), fg="gray").pack(anchor='w', padx=(40, 0))
        
        Radiobutton(mode_frame, text="CLI Version (HandoverServerCLI.exe)", 
                   variable=mode_var, value=1, font=("Arial", 9)).pack(anchor='w', padx=(20, 0), pady=(5, 0))
        Label(mode_frame, text="  Terminal/command-line only", 
             font=("Arial", 8), fg="gray").pack(anchor='w', padx=(40, 0))
        
        # Delay option
        delay_frame = Frame(dialog, padx=20, pady=10)
        delay_frame.pack(fill='x')
        
        Label(delay_frame, text="Startup Delay (seconds):", font=("Arial", 10, "bold")).pack(anchor='w')
        delay_entry = Entry(delay_frame, width=10, font=("Arial", 10))
        delay_entry.insert(0, "0")
        delay_entry.pack(anchor='w', padx=(20, 0), pady=(5, 0))
        Label(delay_frame, text="  Optional: Add delay after system startup (0 = no delay)", 
             font=("Arial", 8), fg="gray").pack(anchor='w', padx=(20, 0))
        
        def save_auto_start():
            try:
                delay = int(delay_entry.get()) if delay_entry.get().strip() else 0
                if delay < 0:
                    raise ValueError("Delay must be >= 0")
            except ValueError:
                messagebox.showerror("Error", "Please enter a valid delay (0 or positive number)")
                return
            
            gui_mode = (mode_var.get() == 0)
            success, message = self.setup_auto_start(gui_mode, delay)
            
            if success:
                messagebox.showinfo("Success", message)
                self.log(f"Auto-start configured: {message}")
                dialog.destroy()
            else:
                messagebox.showerror("Error", message)
                self.log(f"Failed to setup auto-start: {message}")
            
            self.refresh_status()
        
        # Buttons
        button_frame = Frame(dialog, padx=20, pady=10)
        button_frame.pack(fill='x')
        
        Button(button_frame, text="Cancel", command=dialog.destroy,
              padx=15, pady=5).pack(side='right', padx=(5, 0))
        Button(button_frame, text="Save", command=save_auto_start,
              bg="#4CAF50", fg="white", padx=15, pady=5).pack(side='right')
    
    def handle_firewall(self):
        """Handles firewall port opening"""
        if self.firewall_port:
            # Just refresh status
            self.refresh_status()
            messagebox.showinfo("Info", f"Firewall port {self.firewall_port} is already open.")
        else:
            # Get port from entry
            try:
                port = int(self.port_entry.get())
                if port < 1 or port > 65535:
                    raise ValueError("Invalid port")
            except ValueError:
                messagebox.showerror("Error", "Please enter a valid port (1-65535)")
                return
            
            if messagebox.askyesno("Open Firewall Port", 
                                  f"This will open port {port} in Windows Firewall.\n\n"
                                  "You may be prompted for administrator privileges.\n\n"
                                  "Continue?"):
                success, message = self.open_firewall_port(port)
                if success:
                    messagebox.showinfo("Success", message)
                    self.log(f"Firewall configured: {message}")
                else:
                    messagebox.showerror("Error", message)
                    self.log(f"Failed to open firewall: {message}")
                self.refresh_status()
    
    def handle_refresh_ip(self):
        """Refreshes local IP address"""
        self.local_ip = self.get_local_ip()
        self.update_server_config_ui()
        if self.local_ip:
            self.log(f"Local IP: {self.local_ip}")
            messagebox.showinfo("Local IP", 
                              f"Your computer's IP address:\n\n{self.local_ip}\n\n"
                              f"Other computers can access the server at:\n"
                              f"http://{self.local_ip}:{self.port}")
        else:
            self.log("Could not determine local IP address")
            messagebox.showwarning("Warning", "Could not determine local IP address.")
    
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
        
        # Server Configuration Section
        config_section_frame = Frame(main_frame, relief='groove', borderwidth=2, padx=10, pady=10)
        config_section_frame.pack(fill='x', pady=(10, 10))
        
        section_title = Label(config_section_frame, text="Server Configuration", 
                             font=("Arial", 12, "bold"))
        section_title.pack(anchor='w', pady=(0, 10))
        
        # Auto-Start Configuration
        auto_start_frame = Frame(config_section_frame)
        auto_start_frame.pack(fill='x', pady=(0, 10))
        
        auto_start_label = Label(auto_start_frame, text="Auto-Start:", font=("Arial", 10, "bold"))
        auto_start_label.pack(side='left', padx=(0, 10))
        
        self.auto_start_status_label = Label(auto_start_frame, text="Status: Checking...", 
                                            font=("Arial", 9), fg="gray")
        self.auto_start_status_label.pack(side='left', padx=(0, 10))
        
        self.auto_start_button = Button(auto_start_frame, text="Setup Auto-Start",
                                        command=self.handle_auto_start,
                                        font=("Arial", 9),
                                        padx=10, pady=5)
        self.auto_start_button.pack(side='left')
        
        # Firewall Configuration
        firewall_frame = Frame(config_section_frame)
        firewall_frame.pack(fill='x', pady=(0, 10))
        
        firewall_label = Label(firewall_frame, text="Firewall:", font=("Arial", 10, "bold"))
        firewall_label.pack(side='left', padx=(0, 10))
        
        self.firewall_status_label = Label(firewall_frame, text="Status: Checking...", 
                                          font=("Arial", 9), fg="gray")
        self.firewall_status_label.pack(side='left', padx=(0, 10))
        
        self.firewall_button = Button(firewall_frame, text="Open Firewall Port",
                                     command=self.handle_firewall,
                                     font=("Arial", 9),
                                     padx=10, pady=5)
        self.firewall_button.pack(side='left')
        
        # IP Address
        ip_frame = Frame(config_section_frame)
        ip_frame.pack(fill='x', pady=(0, 5))
        
        self.ip_label = Label(ip_frame, text="Local IP: Checking...", 
                            font=("Arial", 9))
        self.ip_label.pack(side='left', padx=(0, 10))
        
        self.refresh_ip_button = Button(ip_frame, text="Refresh IP",
                                       command=self.handle_refresh_ip,
                                       font=("Arial", 9),
                                       padx=10, pady=5)
        self.refresh_ip_button.pack(side='left')
        
        refresh_all_button = Button(ip_frame, text="Refresh All Status",
                                    command=self.refresh_status,
                                    font=("Arial", 9),
                                    padx=10, pady=5, bg="#FF9800", fg="white")
        refresh_all_button.pack(side='right')
        
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
        
        # Refresh server configuration status
        self.refresh_status()
        
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
