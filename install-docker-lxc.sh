#!/bin/bash

###############################################################################
# Shift Handover Log - Docker Installation Script for LXC/Proxmox
# 
# This script installs and configures the Shift Handover Log application
# in an LXC container on Proxmox using Docker and Docker Compose
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
        print_error "Please run as root or with sudo"
        exit 1
    fi
}

check_lxc() {
    if [ ! -f /.dockerenv ] && [ -f /proc/1/environ ] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        print_info "LXC environment detected"
        return 0
    elif [ -d /sys/class/dmi/id ] && [ -f /sys/class/dmi/id/product_name ]; then
        print_info "Environment detected (might not be LXC)"
    fi
    return 0
}

install_docker() {
    print_info "Checking Docker installation..."
    
    if command -v docker &> /dev/null; then
        print_success "Docker is already installed"
        docker --version
        return 0
    fi
    
    print_info "Installing Docker..."
    
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
        print_info "User $SUDO_USER added to docker group"
    fi
    
    print_success "Docker installed successfully"
    docker --version
}

install_docker_compose() {
    print_info "Checking Docker Compose..."
    
    if docker compose version &> /dev/null; then
        print_success "Docker Compose is already installed"
        docker compose version
        return 0
    fi
    
    # Docker Compose V2 already comes with docker-compose-plugin
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose (v1) found"
        docker-compose --version
        return 0
    fi
    
    print_error "Docker Compose not found. Installing..."
    apt-get install -y -qq docker-compose-plugin
    print_success "Docker Compose installed"
}

setup_app_directory() {
    print_info "Configuring application directory..."
    
    # Check if directory exists and has the required files (from git clone)
    if [ -d "$APP_DIR" ] && [ -d "$APP_DIR/server" ] && [ -d "$APP_DIR/client" ]; then
        print_info "Directory $APP_DIR already exists with application files (git clone)"
        print_info "Using existing directory..."
        return 0
    fi
    
    if [ -d "$APP_DIR" ]; then
        print_warning "Directory $APP_DIR already exists but without application files"
        if [ "$NON_INTERACTIVE" != "1" ]; then
            read -p "Do you want to continue and overwrite? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Installation cancelled"
                exit 1
            fi
        else
            print_info "Non-interactive mode: backing up and overwriting..."
        fi
        print_info "Backing up existing directory..."
        mv "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    mkdir -p "$APP_DIR"
    print_success "Directory created: $APP_DIR"
}

copy_files() {
    print_info "Checking application files..."
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # If script is running from git clone, files are already in place
    # Check if we're already in the target directory (git clone scenario)
    if [ "$SCRIPT_DIR" == "$APP_DIR" ]; then
        # Files are already in place from git clone
        if [ -d "$APP_DIR/server" ] && [ -d "$APP_DIR/client" ]; then
            print_success "Files are already in the correct location (git clone)"
        else
            print_error "Application files not found in $APP_DIR"
            exit 1
        fi
    elif [ -d "$SCRIPT_DIR/server" ] && [ -d "$SCRIPT_DIR/client" ]; then
        # Copy essential files from script directory
        print_info "Copying application files..."
        cp -r "$SCRIPT_DIR"/server "$APP_DIR/"
        cp -r "$SCRIPT_DIR"/client "$APP_DIR/"
        cp "$SCRIPT_DIR"/package.json "$APP_DIR/"
        cp "$SCRIPT_DIR"/package-lock.json "$APP_DIR/" 2>/dev/null || true
        cp "$SCRIPT_DIR"/Dockerfile.backend "$APP_DIR/"
        cp "$SCRIPT_DIR"/Dockerfile.frontend "$APP_DIR/"
        cp "$SCRIPT_DIR"/nginx.conf "$APP_DIR/"
        print_success "Files copied"
    else
        print_error "Application files not found in $SCRIPT_DIR"
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
    print_info "Creating docker-compose.yml..."
    
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

    print_success "docker-compose.yml created"
}

create_env_file() {
    print_info "Creating .env file..."
    
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
        print_success ".env file created"
    else
        print_info ".env file already exists, keeping existing configuration"
    fi
}

create_dockerignore() {
    print_info "Creating .dockerignore..."
    
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

    print_success ".dockerignore created"
}

build_and_start() {
    print_info "Building Docker images..."
    
    cd "$APP_DIR"
    
    # Build images
    docker compose build --no-cache
    
    print_info "Starting containers..."
    docker compose up -d
    
    print_success "Containers started"
}

wait_for_services() {
    print_info "Waiting for services to be ready..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T backend wget --quiet --tries=1 --spider http://localhost:5000/api/health 2>/dev/null; then
            print_success "Backend is responding"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo
    print_warning "Backend might not be fully ready yet"
    return 1
}

show_status() {
    print_info "Container status:"
    docker compose -f "$APP_DIR/docker-compose.yml" ps
    
    echo
    print_info "Recent backend logs:"
    docker compose -f "$APP_DIR/docker-compose.yml" logs --tail=10 backend
    
    echo
    print_info "Recent frontend logs:"
    docker compose -f "$APP_DIR/docker-compose.yml" logs --tail=10 frontend
}

show_info() {
    echo
    print_success "=========================================="
    print_success "Installation completed successfully!"
    print_success "=========================================="
    echo
    print_info "Application available at:"
    echo "  Frontend: http://${DOMAIN}:${FRONTEND_PORT}"
    echo "  Backend API: http://${DOMAIN}:${BACKEND_PORT}/api"
    echo "  Health Check: http://${DOMAIN}:${BACKEND_PORT}/api/health"
    echo
    print_info "Default Admin Credentials:"
    echo "  Username: admin"
    echo "  Password: pass123"
    echo "  ⚠️  CHANGE PASSWORD IMMEDIATELY!"
    echo
    print_info "Useful Commands:"
    echo "  View logs: docker compose -f $APP_DIR/docker-compose.yml logs -f"
    echo "  Stop: docker compose -f $APP_DIR/docker-compose.yml down"
    echo "  Start: docker compose -f $APP_DIR/docker-compose.yml up -d"
    echo "  Restart: docker compose -f $APP_DIR/docker-compose.yml restart"
    echo "  Status: docker compose -f $APP_DIR/docker-compose.yml ps"
    echo
    print_info "Application Directory: $APP_DIR"
    echo "  Data: $APP_DIR/data"
    echo "  Logs: $APP_DIR/logs"
    echo
}

# Main installation process
main() {
    echo
    print_info "=========================================="
    print_info "Shift Handover Log - Docker Installation"
    print_info "=========================================="
    echo
    
    check_root
    check_lxc
    
    # Configuration (use environment variables if in non-interactive mode)
    if [ "$NON_INTERACTIVE" != "1" ]; then
    # Prompt for configuration
    echo
    read -p "Backend Port [${BACKEND_PORT}]: " input_backend
    BACKEND_PORT=${input_backend:-${BACKEND_PORT}}
    
    read -p "Frontend Port [${FRONTEND_PORT}]: " input_frontend
    FRONTEND_PORT=${input_frontend:-${FRONTEND_PORT}}
    
    read -p "Domain/IP [${DOMAIN}]: " input_domain
    DOMAIN=${input_domain:-${DOMAIN}}
    
    echo
    print_info "Configuration:"
    echo "  Backend Port: $BACKEND_PORT"
    echo "  Frontend Port: $FRONTEND_PORT"
    echo "  Domain: $DOMAIN"
    echo
    
    read -p "Continue with installation? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_error "Installation cancelled"
        exit 1
        fi
    else
        # Non-interactive mode: use environment variables
        print_info "Non-interactive mode enabled"
        print_info "Configuration:"
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

