#!/bin/bash

###############################################################################
# Shift Handover Log - Instalação Automática no Proxmox LXC
# 
# Este script cria automaticamente um container LXC no Proxmox e instala
# a aplicação Shift Handover Log com Docker.
#
# Uso: Cole este comando no shell do Proxmox:
# curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
#
# Alternativa (usando commit SHA específico):
# curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/bb930b099366bd7b07a671a4494b1ee1b65618ae/install-proxmox.sh | bash
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_HOSTNAME="handover-log"
CONTAINER_MEMORY=2048
CONTAINER_CORES=2
CONTAINER_DISK=8
BACKEND_PORT=5000
FRONTEND_PORT=3000
GIT_REPO="https://github.com/tabasko81/Handover.git"
APP_DIR="/opt/shift-handover-log"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

check_proxmox() {
    if ! command -v pct &> /dev/null || ! command -v pvesm &> /dev/null; then
        print_error "Este script deve ser executado no host Proxmox!"
        print_error "Comandos 'pct' ou 'pvesm' não encontrados."
        exit 1
    fi
    print_success "Ambiente Proxmox detectado"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Por favor execute como root"
        exit 1
    fi
}

find_local_storage() {
    print_info "A procurar storage local disponível..."
    
    # List all storages
    local storages=$(pvesm status | awk 'NR>1 {print $1}')
    local local_storage=""
    
    for storage in $storages; do
        # Get storage type
        local storage_type=$(pvesm status | grep "^$storage" | awk '{print $2}')
        local storage_content=$(pvesm status | grep "^$storage" | awk '{print $3}')
        
        # Skip USB and external storages
        if [[ "$storage_type" == *"usb"* ]] || [[ "$storage_type" == *"external"* ]]; then
            continue
        fi
        
        # Check if storage supports container templates
        if [[ "$storage_content" == *"vztmpl"* ]] || [[ "$storage_content" == *"images"* ]]; then
            # Prefer local-lvm, then local
            if [[ "$storage" == "local-lvm" ]] || [[ "$storage" == "local" ]]; then
                local_storage="$storage"
                break
            fi
        fi
        
        # If no preferred storage found yet, use first valid one
        if [ -z "$local_storage" ]; then
            local_storage="$storage"
        fi
    done
    
    if [ -z "$local_storage" ]; then
        print_error "Nenhum storage local encontrado!"
        print_error "Storages disponíveis:"
        pvesm status
        exit 1
    fi
    
    print_success "Storage local encontrado: $local_storage"
    echo "$local_storage"
}

find_available_id() {
    print_info "A procurar próximo ID de container disponível..."
    
    local start_id=100
    local id=$start_id
    
    while [ $id -lt 1000 ]; do
        if ! pct status $id &> /dev/null; then
            print_success "ID disponível encontrado: $id"
            echo "$id"
            return
        fi
        id=$((id + 1))
    done
    
    print_error "Não foi possível encontrar um ID disponível (100-999)"
    exit 1
}

find_debian_template() {
    print_info "A procurar template Debian..."
    
    # Check local templates first
    local local_templates=$(pveam list local 2>/dev/null | grep -i debian | head -1 | awk '{print $1}')
    
    if [ -n "$local_templates" ]; then
        print_success "Template local encontrado: $local_templates"
        # Format: local:vztmpl/template-name
        if [[ "$local_templates" == *"vztmpl"* ]]; then
            echo "$local_templates"
        else
            echo "local:vztmpl/$local_templates"
        fi
        return
    fi
    
    # If no local template, try to find available one
    print_info "Template local não encontrado, a procurar templates disponíveis..."
    pveam update &> /dev/null || true
    
    # Try to find latest Debian template
    local available_template=$(pveam available 2>/dev/null | grep -i "debian.*standard" | tail -1 | awk '{print $1}')
    
    if [ -z "$available_template" ]; then
        print_error "Template Debian não encontrado!"
        print_info "Templates disponíveis:"
        pveam available 2>/dev/null | head -20
        exit 1
    fi
    
    print_info "A baixar template: $available_template"
    pveam download local "$available_template" || {
        print_error "Falha ao baixar template"
        exit 1
    }
    
    print_success "Template baixado: $available_template"
    echo "local:vztmpl/$available_template"
}

create_container() {
    local container_id=$1
    local storage=$2
    local template=$3
    
    print_info "A criar container LXC (ID: $container_id)..."
    
    pct create $container_id "$template" \
        --hostname "$CONTAINER_HOSTNAME" \
        --memory $CONTAINER_MEMORY \
        --cores $CONTAINER_CORES \
        --rootfs "$storage:$CONTAINER_DISK" \
        --net0 name=eth0,bridge=vmbr0,ip=dhcp \
        --unprivileged 0 \
        --features nesting=1 \
        --onboot 1 \
        --start 1 || {
        print_error "Falha ao criar container"
        exit 1
    }
    
    print_success "Container criado e iniciado"
    
    # Wait for container to be ready
    print_info "A aguardar container ficar pronto..."
    sleep 5
    
    # Wait for network to be up
    local max_wait=30
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if pct exec $container_id -- ping -c 1 8.8.8.8 &> /dev/null; then
            break
        fi
        sleep 1
        waited=$((waited + 1))
    done
}

get_container_ip() {
    local container_id=$1
    local max_attempts=10
    local attempt=0
    
    print_info "A obter IP do container..."
    
    while [ $attempt -lt $max_attempts ]; do
        # Try to get IP from container
        local ip=$(pct exec $container_id -- hostname -I 2>/dev/null | awk '{print $1}')
        
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "IP do container: $ip"
            echo "$ip"
            return
        fi
        
        # Alternative: get from config
        ip=$(pct config $container_id 2>/dev/null | grep "ip=" | cut -d'=' -f2 | cut -d'/' -f1)
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "IP do container: $ip"
            echo "$ip"
            return
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Não foi possível obter IP automaticamente"
    echo ""
}

install_inside_container() {
    local container_id=$1
    local container_ip=$2
    
    print_info "A instalar aplicação dentro do container..."
    
    # Update system and install git
    print_info "A atualizar sistema e instalar Git..."
    pct exec $container_id -- bash -c "
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq
        apt-get install -y -qq git curl wget
    " || {
        print_error "Falha ao instalar dependências"
        exit 1
    }
    
    # Clone repository
    print_info "A fazer clone do repositório..."
    pct exec $container_id -- bash -c "
        if [ -d '$APP_DIR' ]; then
            rm -rf '$APP_DIR'
        fi
        git clone '$GIT_REPO' '$APP_DIR' || {
            echo 'Falha ao fazer clone do repositório'
            exit 1
        }
    " || {
        print_error "Falha ao fazer clone do repositório"
        exit 1
    }
    
    # Run installation script in non-interactive mode
    print_info "A executar script de instalação Docker..."
    pct exec $container_id -- bash -c "
        cd '$APP_DIR'
        chmod +x install-docker-lxc.sh
        
        # Set environment variables for non-interactive mode
        export BACKEND_PORT=$BACKEND_PORT
        export FRONTEND_PORT=$FRONTEND_PORT
        export DOMAIN=$container_ip
        export NON_INTERACTIVE=1
        
        # Run installation script
        ./install-docker-lxc.sh || {
            echo 'Falha na instalação Docker'
            exit 1
        }
    " || {
        print_error "Falha na instalação dentro do container"
        print_info "A verificar logs do container..."
        pct exec $container_id -- bash -c "cd '$APP_DIR' && docker compose logs --tail=50" 2>/dev/null || true
        exit 1
    }
    
    print_success "Instalação concluída dentro do container"
}

show_final_info() {
    local container_id=$1
    local container_ip=$2
    
    echo
    print_success "=========================================="
    print_success "Instalação concluída com sucesso!"
    print_success "=========================================="
    echo
    print_info "Informações do Container:"
    echo "  ID: $container_id"
    echo "  Hostname: $CONTAINER_HOSTNAME"
    echo "  IP: $container_ip"
    echo
    print_info "Aplicação disponível em:"
    echo "  Frontend: http://$container_ip:$FRONTEND_PORT"
    echo "  Backend API: http://$container_ip:$BACKEND_PORT/api"
    echo "  Health Check: http://$container_ip:$BACKEND_PORT/api/health"
    echo
    print_info "Credenciais padrão do administrador:"
    echo "  Username: admin"
    echo "  Password: pass123"
    echo "  ⚠️  ALTERE A PASSWORD IMEDIATAMENTE!"
    echo
    print_info "Comandos úteis:"
    echo "  Entrar no container: pct enter $container_id"
    echo "  Ver logs: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose logs -f'"
    echo "  Parar aplicação: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose down'"
    echo "  Iniciar aplicação: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose up -d'"
    echo "  Estado: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose ps'"
    echo
    print_info "Diretório da aplicação no container: $APP_DIR"
    echo
}

# Main installation process
main() {
    echo
    print_info "=========================================="
    print_info "Shift Handover Log - Instalação Proxmox"
    print_info "=========================================="
    echo
    
    check_proxmox
    check_root
    
    # Find resources
    local storage=$(find_local_storage)
    local container_id=$(find_available_id)
    local template=$(find_debian_template)
    
    # Show summary
    echo
    print_info "Resumo da instalação:"
    echo "  Storage: $storage"
    echo "  Container ID: $container_id"
    echo "  Template: $template"
    echo "  Hostname: $CONTAINER_HOSTNAME"
    echo "  RAM: ${CONTAINER_MEMORY}MB"
    echo "  CPU: $CONTAINER_CORES cores"
    echo "  Disco: ${CONTAINER_DISK}GB"
    echo "  Backend Port: $BACKEND_PORT"
    echo "  Frontend Port: $FRONTEND_PORT"
    echo
    
    # Ask for confirmation (unless --yes flag)
    if [[ "$1" != "--yes" ]]; then
        read -p "Continuar com a instalação? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_error "Instalação cancelada"
            exit 1
        fi
    fi
    
    # Create container
    create_container $container_id "$storage" "$template"
    
    # Get container IP
    local container_ip=$(get_container_ip $container_id)
    
    if [ -z "$container_ip" ]; then
        print_warning "IP não detectado automaticamente"
        print_info "Pode descobrir o IP com: pct exec $container_id -- hostname -I"
        container_ip="<IP_DO_CONTAINER>"
    fi
    
    # Install application inside container
    install_inside_container $container_id "$container_ip"
    
    # Show final information
    show_final_info $container_id "$container_ip"
}

# Run main function
main "$@"

