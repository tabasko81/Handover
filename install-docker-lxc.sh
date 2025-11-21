#!/bin/bash

###############################################################################
# Shift Handover Log - Docker Installation Script for LXC/Proxmox
# 
# Este script instala e configura a aplicação Shift Handover Log
# num container LXC no Proxmox usando Docker e Docker Compose
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="shift-handover-log"
APP_DIR="/opt/${APP_NAME}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
DOMAIN="${DOMAIN:-localhost}"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Por favor execute como root ou com sudo"
        exit 1
    fi
}

check_lxc() {
    if [ ! -f /.dockerenv ] && [ -f /proc/1/environ ] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        print_info "Detectado ambiente LXC"
        return 0
    elif [ -d /sys/class/dmi/id ] && [ -f /sys/class/dmi/id/product_name ]; then
        print_info "Ambiente detectado (pode não ser LXC)"
    fi
    return 0
}

install_docker() {
    print_info "A verificar instalação do Docker..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker já está instalado"
        docker --version
        return 0
    fi
    
    print_info "A instalar Docker..."
    
    # Update package index
    apt-get update -qq
    
    # Install prerequisites
    apt-get install -y -qq \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add current user to docker group (if not root)
    if [ "$SUDO_USER" ]; then
        usermod -aG docker "$SUDO_USER"
        print_info "Utilizador $SUDO_USER adicionado ao grupo docker"
    fi
    
    print_success "Docker instalado com sucesso"
    docker --version
}

install_docker_compose() {
    print_info "A verificar Docker Compose..."
    
    if docker compose version &> /dev/null; then
        print_success "Docker Compose já está instalado"
        docker compose version
        return 0
    fi
    
    # Docker Compose V2 já vem com docker-compose-plugin
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose (v1) encontrado"
        docker-compose --version
        return 0
    fi
    
    print_error "Docker Compose não encontrado. A instalar..."
    apt-get install -y -qq docker-compose-plugin
    print_success "Docker Compose instalado"
}

setup_app_directory() {
    print_info "A configurar diretório da aplicação..."
    
    # Check if directory exists and has the required files (from git clone)
    if [ -d "$APP_DIR" ] && [ -d "$APP_DIR/server" ] && [ -d "$APP_DIR/client" ]; then
        print_info "Diretório $APP_DIR já existe com ficheiros da aplicação (git clone)"
        print_info "A usar diretório existente..."
        return 0
    fi
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Diretório $APP_DIR já existe mas sem ficheiros da aplicação"
        if [ "$NON_INTERACTIVE" != "1" ]; then
            read -p "Deseja continuar e sobrescrever? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Instalação cancelada"
                exit 1
            fi
        else
            print_info "Modo não-interativo: a fazer backup e sobrescrever..."
        fi
        print_info "A fazer backup do diretório existente..."
        mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    mkdir -p "$APP_DIR"
    print_success "Diretório criado: $APP_DIR"
}

copy_files() {
    print_info "A verificar ficheiros da aplicação..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # If script is running from git clone, files are already in place
    # Check if we're already in the target directory (git clone scenario)
    if [ "$SCRIPT_DIR" == "$APP_DIR" ]; then
        # Files are already in place from git clone
        if [ -d "$APP_DIR/server" ] && [ -d "$APP_DIR/client" ]; then
            print_success "Ficheiros já estão no local correto (git clone)"
        else
            print_error "Ficheiros da aplicação não encontrados em $APP_DIR"
            exit 1
        fi
    elif [ -d "$SCRIPT_DIR/server" ] && [ -d "$SCRIPT_DIR/client" ]; then
        # Copy essential files from script directory
        print_info "A copiar ficheiros da aplicação..."
        cp -r "$SCRIPT_DIR"/server "$APP_DIR/"
        cp -r "$SCRIPT_DIR"/client "$APP_DIR/"
        cp "$SCRIPT_DIR"/package.json "$APP_DIR/"
        cp "$SCRIPT_DIR"/package-lock.json "$APP_DIR/" 2>/dev/null || true
        cp "$SCRIPT_DIR"/Dockerfile.backend "$APP_DIR/"
        cp "$SCRIPT_DIR"/Dockerfile.frontend "$APP_DIR/"
        cp "$SCRIPT_DIR"/nginx.conf "$APP_DIR/"
        print_success "Ficheiros copiados"
    else
        print_error "Ficheiros da aplicação não encontrados em $SCRIPT_DIR"
        exit 1
    fi
    
    # Create data and logs directories
    mkdir -p "$APP_DIR/data" "$APP_DIR/logs"
    
    # Change owner to 1000:1000 (node user in container) to allow writing
    chown -R 1000:1000 "$APP_DIR/data" "$APP_DIR/logs"
    chmod 755 "$APP_DIR/data" "$APP_DIR/logs"
    
    # Copy data files if they exist
    if [ -d "$SCRIPT_DIR/data" ] && [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
        cp -r "$SCRIPT_DIR/data"/* "$APP_DIR/data/" 2>/dev/null || true
    fi
}

create_docker_compose() {
    print_info "A criar docker-compose.yml..."
    
    cat > "$APP_DIR/docker-compose.yml" <<EOF
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: handover-backend
    ports:
      - "${BACKEND_PORT}:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - FRONTEND_URL=http://${DOMAIN}:${FRONTEND_PORT}
      - JWT_SECRET=\${JWT_SECRET:-$(openssl rand -hex 32)}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - handover-network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - REACT_APP_API_URL=http://${DOMAIN}:${BACKEND_PORT}/api
    container_name: handover-frontend
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    environment:
      - REACT_APP_API_URL=http://${DOMAIN}:${BACKEND_PORT}/api
    networks:
      - handover-network

networks:
  handover-network:
    driver: bridge
EOF

    print_success "docker-compose.yml criado"
}

create_env_file() {
    print_info "A criar ficheiro .env..."
    
    if [ ! -f "$APP_DIR/.env" ]; then
        cat > "$APP_DIR/.env" <<EOF
# Shift Handover Log - Environment Variables
NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -hex 32)
FRONTEND_URL=http://${DOMAIN}:${FRONTEND_PORT}
REACT_APP_API_URL=http://${DOMAIN}:${BACKEND_PORT}/api
DOMAIN=${DOMAIN}
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
EOF
        print_success "Ficheiro .env criado"
    else
        print_info "Ficheiro .env já existe, a manter configuração existente"
    fi
}

create_dockerignore() {
    print_info "A criar .dockerignore..."
    
    cat > "$APP_DIR/.dockerignore" <<EOF
node_modules
npm-debug.log
.git
.gitignore
.env
.env.local
.env.*.local
data/*.db
data/*.db-journal
logs/*
*.md
docs/
screenshots/
*.bat
*.sh
docker-compose*.yml
.DS_Store
EOF

    print_success ".dockerignore criado"
}

build_and_start() {
    print_info "A construir imagens Docker..."
    
    cd "$APP_DIR"
    
    # Build images
    docker compose build --no-cache
    
    print_info "A iniciar containers..."
    docker compose up -d
    
    print_success "Containers iniciados"
}

wait_for_services() {
    print_info "A aguardar serviços ficarem prontos..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T backend wget --quiet --tries=1 --spider http://localhost:5000/api/health 2>/dev/null; then
            print_success "Backend está a responder"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo
    print_warning "Backend pode não estar totalmente pronto"
    return 1
}

show_status() {
    print_info "Estado dos containers:"
    docker compose -f "$APP_DIR/docker-compose.yml" ps
    
    echo
    print_info "Logs recentes do backend:"
    docker compose -f "$APP_DIR/docker-compose.yml" logs --tail=10 backend
    
    echo
    print_info "Logs recentes do frontend:"
    docker compose -f "$APP_DIR/docker-compose.yml" logs --tail=10 frontend
}

show_info() {
    echo
    print_success "=========================================="
    print_success "Instalação concluída com sucesso!"
    print_success "=========================================="
    echo
    print_info "Aplicação disponível em:"
    echo "  Frontend: http://${DOMAIN}:${FRONTEND_PORT}"
    echo "  Backend API: http://${DOMAIN}:${BACKEND_PORT}/api"
    echo "  Health Check: http://${DOMAIN}:${BACKEND_PORT}/api/health"
    echo
    print_info "Credenciais padrão do administrador:"
    echo "  Username: admin"
    echo "  Password: pass123"
    echo "  ⚠️  ALTERE A PASSWORD IMEDIATAMENTE!"
    echo
    print_info "Comandos úteis:"
    echo "  Ver logs: docker compose -f $APP_DIR/docker-compose.yml logs -f"
    echo "  Parar: docker compose -f $APP_DIR/docker-compose.yml down"
    echo "  Iniciar: docker compose -f $APP_DIR/docker-compose.yml up -d"
    echo "  Reiniciar: docker compose -f $APP_DIR/docker-compose.yml restart"
    echo "  Estado: docker compose -f $APP_DIR/docker-compose.yml ps"
    echo
    print_info "Diretório da aplicação: $APP_DIR"
    echo "  Dados: $APP_DIR/data"
    echo "  Logs: $APP_DIR/logs"
    echo
}

# Main installation process
main() {
    echo
    print_info "=========================================="
    print_info "Shift Handover Log - Instalação Docker"
    print_info "=========================================="
    echo
    
    check_root
    check_lxc
    
    # Configuration (use environment variables if in non-interactive mode)
    if [ "$NON_INTERACTIVE" != "1" ]; then
    # Prompt for configuration
    echo
    read -p "Porta do backend [${BACKEND_PORT}]: " input_backend
    BACKEND_PORT=${input_backend:-${BACKEND_PORT}}
    
    read -p "Porta do frontend [${FRONTEND_PORT}]: " input_frontend
    FRONTEND_PORT=${input_frontend:-${FRONTEND_PORT}}
    
    read -p "Domínio/IP [${DOMAIN}]: " input_domain
    DOMAIN=${input_domain:-${DOMAIN}}
    
    echo
    print_info "Configuração:"
    echo "  Backend Port: $BACKEND_PORT"
    echo "  Frontend Port: $FRONTEND_PORT"
    echo "  Domain: $DOMAIN"
    echo
    
    read -p "Continuar com a instalação? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_error "Instalação cancelada"
        exit 1
        fi
    else
        # Non-interactive mode: use environment variables
        print_info "Modo não-interativo ativado"
        print_info "Configuração:"
        echo "  Backend Port: $BACKEND_PORT"
        echo "  Frontend Port: $FRONTEND_PORT"
        echo "  Domain: $DOMAIN"
        echo
    fi
    
    # Installation steps
    install_docker
    install_docker_compose
    setup_app_directory
    copy_files
    create_docker_compose
    create_env_file
    create_dockerignore
    build_and_start
    
    # Wait a bit for services to start
    sleep 5
    wait_for_services
    
    show_status
    show_info
}

# Run main function
main "$@"

