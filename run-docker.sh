#!/bin/bash

###############################################################################
# Shift Handover Log - Quick Docker Run Script
# 
# Script simples para executar a aplicação com Docker (Docker já instalado)
###############################################################################

# Don't exit on error for Docker checks - we handle them manually
set +e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configuration
BACKEND_PORT="${BACKEND_PORT:-5000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
DOMAIN="${DOMAIN:-localhost}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker não está instalado!"
    print_info "Para instalar Docker, execute:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sh get-docker.sh"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    print_warning "Docker não está a correr. A tentar iniciar..."
    
    # Try to start Docker service
    if systemctl is-active --quiet docker 2>/dev/null; then
        print_info "Serviço Docker está ativo mas não responde"
    elif systemctl start docker 2>/dev/null; then
        print_info "A aguardar Docker iniciar..."
        sleep 3
    else
        print_error "Não foi possível iniciar o Docker automaticamente."
        echo
        print_info "Tente iniciar manualmente:"
        echo "  systemctl start docker"
        echo "  ou"
        echo "  service docker start"
        echo
        print_info "Se estiver num container LXC, pode precisar de:"
        echo "  - Verificar se o Docker está instalado corretamente"
        echo "  - Verificar permissões do utilizador (adicionar ao grupo docker)"
        echo "  - Executar como root: sudo ./run-docker.sh"
        exit 1
    fi
    
    # Check again
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker ainda não está a responder."
        print_info "Verifique o estado do Docker:"
        echo "  systemctl status docker"
        echo "  docker info"
        exit 1
    fi
fi

print_success "Docker está a correr"

# Re-enable exit on error for the rest of the script
set -e

# Check for Docker Compose (v2 or v1)
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    print_info "A usar docker-compose (v1)"
else
    print_error "Docker Compose não encontrado!"
    print_info "Instale Docker Compose ou use Docker com plugin compose"
    exit 1
fi

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    print_info "docker-compose.yml não encontrado. A criar..."
    
    # Check if required files exist
    if [ ! -f "Dockerfile.backend" ] || [ ! -f "Dockerfile.frontend" ]; then
        print_error "Ficheiros Dockerfile não encontrados!"
        print_error "Certifique-se de que está no diretório correto do projeto."
        exit 1
    fi
    
    # Create docker-compose.yml
    cat > docker-compose.yml <<EOF
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
      - JWT_SECRET=\${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key")}
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
fi

# Create data and logs directories if they don't exist
mkdir -p data logs
chmod 755 data logs 2>/dev/null || true

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_info "A criar ficheiro .env..."
    cat > .env <<EOF
NODE_ENV=production
PORT=5000
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")
FRONTEND_URL=http://${DOMAIN}:${FRONTEND_PORT}
REACT_APP_API_URL=http://${DOMAIN}:${BACKEND_PORT}/api
DOMAIN=${DOMAIN}
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
EOF
    print_success "Ficheiro .env criado"
fi

# Stop existing containers if running
print_info "A parar containers existentes (se houver)..."
$COMPOSE_CMD down 2>/dev/null || true

# Build and start
print_info "A construir imagens Docker..."
$COMPOSE_CMD build

print_info "A iniciar containers..."
$COMPOSE_CMD up -d

# Wait a bit for services to start
print_info "A aguardar serviços iniciarem..."
sleep 5

# Check status
print_info "Estado dos containers:"
$COMPOSE_CMD ps

echo
print_success "=========================================="
print_success "Aplicação iniciada com sucesso!"
print_success "=========================================="
echo
print_info "Aplicação disponível em:"
echo "  Frontend: http://${DOMAIN}:${FRONTEND_PORT}"
echo "  Backend API: http://${DOMAIN}:${BACKEND_PORT}/api"
echo "  Health Check: http://${DOMAIN}:${BACKEND_PORT}/api/health"
echo
print_info "Credenciais padrão:"
echo "  Username: admin"
echo "  Password: pass123"
echo "  ⚠️  ALTERE A PASSWORD IMEDIATAMENTE!"
echo
print_info "Comandos úteis:"
echo "  Ver logs: $COMPOSE_CMD logs -f"
echo "  Parar: $COMPOSE_CMD down"
echo "  Reiniciar: $COMPOSE_CMD restart"
echo "  Estado: $COMPOSE_CMD ps"
echo

