#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Servidor Python Standalone para Shift Handover Log
Permite executar a aplicação sem instalações no Windows
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

# Configurações
CONFIG_FILE = "server_config.json"
DEFAULT_PORT = 8500
NODEJS_DIR = Path("nodejs")
NODEJS_EXE = NODEJS_DIR / "node.exe"
SERVER_DIR = Path("server")
CLIENT_BUILD_DIR = Path("client") / "build"
DATA_DIR = Path("data")

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
        """Adiciona mensagem à área de logs"""
        if self.log_text:
            self.log_text.insert("end", f"{message}\n")
            self.log_text.see("end")
            self.root.update_idletasks()
        print(message)
    
    def check_nodejs(self):
        """Verifica se Node.js portátil está disponível"""
        if not NODEJS_EXE.exists():
            return False, f"Node.js não encontrado em {NODEJS_EXE}\n\nPor favor, extraia Node.js portátil para a pasta 'nodejs/'\nVeja README_SERVER.md para instruções."
        return True, None
    
    def check_port_available(self, port):
        """Verifica se a porta está disponível"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return True
        except OSError:
            return False
    
    def check_directories(self):
        """Verifica se as pastas necessárias existem"""
        errors = []
        if not SERVER_DIR.exists():
            errors.append(f"Pasta 'server' não encontrada")
        if not CLIENT_BUILD_DIR.exists():
            errors.append(f"Pasta 'client/build' não encontrada (frontend não compilado)")
        if not DATA_DIR.exists():
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            self.log(f"Pasta 'data' criada")
        return errors
    
    def load_config(self):
        """Carrega configuração guardada"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.port = config.get('port', DEFAULT_PORT)
            except Exception as e:
                self.log(f"Erro ao carregar configuração: {e}")
                self.port = DEFAULT_PORT
        else:
            self.port = DEFAULT_PORT
    
    def save_config(self):
        """Guarda configuração"""
        try:
            config = {'port': self.port}
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            self.log(f"Erro ao guardar configuração: {e}")
    
    def start_server(self):
        """Inicia o servidor Node.js"""
        if self.is_running:
            messagebox.showwarning("Aviso", "O servidor já está em execução!")
            return
        
        # Validar Node.js
        node_ok, error_msg = self.check_nodejs()
        if not node_ok:
            messagebox.showerror("Erro", error_msg)
            return
        
        # Validar pastas
        errors = self.check_directories()
        if errors:
            messagebox.showerror("Erro", "Problemas encontrados:\n\n" + "\n".join(errors))
            return
        
        # Obter porta do campo de entrada
        try:
            port = int(self.port_entry.get())
            if port < 1 or port > 65535:
                raise ValueError("Porta inválida")
        except ValueError:
            messagebox.showerror("Erro", "Por favor, insira uma porta válida (1-65535)")
            return
        
        # Verificar se porta está disponível
        if not self.check_port_available(port):
            messagebox.showerror("Erro", f"A porta {port} já está em uso. Por favor, escolha outra porta.")
            return
        
        self.port = port
        self.save_config()
        
        # Configurar variáveis de ambiente
        env = os.environ.copy()
        env['NODE_ENV'] = 'production'
        env['PORT'] = str(self.port)
        env['FRONTEND_URL'] = f'http://localhost:{self.port}'
        # Nota: REACT_APP_API_URL é definida no build, mas como servimos tudo na mesma porta,
        # os pedidos relativos /api funcionarão corretamente
        
        # Caminho para o servidor
        server_path = SERVER_DIR / "index.js"
        if not server_path.exists():
            messagebox.showerror("Erro", f"Ficheiro do servidor não encontrado: {server_path}")
            return
        
        # Iniciar processo Node.js
        try:
            self.log(f"Iniciando servidor na porta {self.port}...")
            self.log(f"Node.js: {NODEJS_EXE}")
            self.log(f"Servidor: {server_path}")
            
            # Usar Node.js portátil
            node_path = str(NODEJS_EXE)
            server_script = str(server_path)
            
            self.process = subprocess.Popen(
                [node_path, server_script],
                cwd=str(Path.cwd()),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
            
            self.is_running = True
            self.update_ui_state()
            
            # Thread para ler output do processo
            def read_output():
                try:
                    for line in iter(self.process.stdout.readline, ''):
                        if line:
                            self.log(f"[Servidor] {line.strip()}")
                    self.process.stdout.close()
                    self.process.wait()
                    self.is_running = False
                    self.update_ui_state()
                    self.log("Servidor parado.")
                except Exception as e:
                    self.log(f"Erro ao ler output: {e}")
                    self.is_running = False
                    self.update_ui_state()
            
            thread = threading.Thread(target=read_output, daemon=True)
            thread.start()
            
            # Aguardar um pouco e verificar se o processo ainda está a correr
            threading.Timer(2.0, self.check_server_started).start()
            
            self.log(f"Servidor iniciado! Acesse: http://localhost:{self.port}")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao iniciar servidor:\n{str(e)}")
            self.is_running = False
            self.update_ui_state()
    
    def check_server_started(self):
        """Verifica se o servidor iniciou corretamente"""
        if self.process and self.process.poll() is not None:
            # Processo terminou
            self.is_running = False
            self.update_ui_state()
            messagebox.showerror("Erro", "O servidor terminou inesperadamente. Verifique os logs.")
        elif self.is_running:
            # Servidor está a correr, abrir browser após alguns segundos
            threading.Timer(3.0, self.open_browser).start()
    
    def open_browser(self):
        """Abre o browser no endereço do servidor"""
        if self.is_running:
            url = f"http://localhost:{self.port}"
            try:
                webbrowser.open(url)
                self.log(f"Browser aberto: {url}")
            except Exception as e:
                self.log(f"Erro ao abrir browser: {e}")
    
    def stop_server(self):
        """Para o servidor Node.js"""
        if not self.is_running or not self.process:
            messagebox.showinfo("Info", "O servidor não está em execução.")
            return
        
        try:
            self.log("A parar servidor...")
            self.process.terminate()
            
            # Aguardar até 5 segundos para terminar graciosamente
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Forçar terminação
                self.log("Forçando terminação do servidor...")
                self.process.kill()
                self.process.wait()
            
            self.is_running = False
            self.update_ui_state()
            self.log("Servidor parado com sucesso.")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao parar servidor:\n{str(e)}")
            self.is_running = False
            self.update_ui_state()
    
    def update_ui_state(self):
        """Atualiza o estado da interface"""
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
        """Chamado quando a janela é fechada"""
        if self.is_running:
            if messagebox.askokcancel("Sair", "O servidor está em execução. Deseja parar e sair?"):
                self.stop_server()
                self.root.after(1000, self.root.destroy)
        else:
            self.root.destroy()
    
    def create_gui(self):
        """Cria a interface gráfica"""
        self.root = Tk()
        self.root.title("Shift Handover Log - Servidor")
        self.root.geometry("700x600")
        self.root.resizable(True, True)
        
        # Carregar configuração
        self.load_config()
        
        # Frame principal
        main_frame = Frame(self.root, padx=20, pady=20)
        main_frame.pack(fill='both', expand=True)
        
        # Título
        title_label = Label(main_frame, text="Shift Handover Log - Servidor", 
                           font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Frame de configuração
        config_frame = Frame(main_frame)
        config_frame.pack(fill='x', pady=(0, 10))
        
        port_label = Label(config_frame, text="Porta:", font=("Arial", 10))
        port_label.pack(side='left', padx=(0, 10))
        
        self.port_entry = Entry(config_frame, width=10, font=("Arial", 10))
        self.port_entry.insert(0, str(self.port))
        self.port_entry.pack(side='left', padx=(0, 10))
        
        # Botões de controlo
        button_frame = Frame(main_frame)
        button_frame.pack(fill='x', pady=(0, 10))
        
        self.start_button = Button(button_frame, text="Iniciar Servidor", 
                                   command=self.start_server,
                                   bg="#4CAF50", fg="white", 
                                   font=("Arial", 10, "bold"),
                                   padx=20, pady=10)
        self.start_button.pack(side='left', padx=(0, 10))
        
        self.stop_button = Button(button_frame, text="Parar Servidor", 
                                 command=self.stop_server,
                                 bg="#f44336", fg="white",
                                 font=("Arial", 10, "bold"),
                                 padx=20, pady=10,
                                 state='disabled')
        self.stop_button.pack(side='left', padx=(0, 10))
        
        open_browser_button = Button(button_frame, text="Abrir no Browser", 
                                     command=self.open_browser,
                                     bg="#2196F3", fg="white",
                                     font=("Arial", 10),
                                     padx=15, pady=10)
        open_browser_button.pack(side='left')
        
        # Área de logs
        log_label = Label(main_frame, text="Logs:", font=("Arial", 10, "bold"))
        log_label.pack(anchor='w', pady=(10, 5))
        
        self.log_text = ScrolledText(main_frame, height=20, width=80,
                                     font=("Consolas", 9),
                                     wrap='word')
        self.log_text.pack(fill='both', expand=True)
        
        # Status inicial
        self.log("Servidor pronto. Configure a porta e clique em 'Iniciar Servidor'.")
        
        # Verificar Node.js
        node_ok, error_msg = self.check_nodejs()
        if not node_ok:
            self.log(f"⚠️ {error_msg}")
        else:
            self.log(f"✓ Node.js encontrado: {NODEJS_EXE}")
        
        # Verificar pastas
        errors = self.check_directories()
        if errors:
            for error in errors:
                self.log(f"⚠️ {error}")
        else:
            self.log("✓ Todas as pastas necessárias encontradas")
        
        # Atualizar estado da UI
        self.update_ui_state()
        
        # Handler para fechar janela
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
        
        # Iniciar loop da interface
        self.root.mainloop()

def main():
    """Função principal"""
    manager = ServerManager()
    manager.create_gui()

if __name__ == "__main__":
    main()

