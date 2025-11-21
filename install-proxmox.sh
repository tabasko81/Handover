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
    print_info "A procurar storage local disponível para containers..." >&2
    
    # List all storages
    local storages=$(pvesm status | awk 'NR>1 {print $1}')
    local local_storage=""
    local preferred_storage=""
    
    for storage in $storages; do
        # Get storage type and content
        local storage_type=$(pvesm status | grep "^$storage" | awk '{print $2}')
        local storage_content=$(pvesm status | grep "^$storage" | awk '{print $3}')
        
        print_info "A verificar storage: $storage (tipo: $storage_type, conteúdo: $storage_content)" >&2
        
        # Skip USB and external storages
        if [[ "$storage_type" == *"usb"* ]] || [[ "$storage_type" == *"external"* ]]; then
            print_info "  → Ignorado (USB/external)" >&2
            continue
        fi
        
        # ALWAYS exclude 'local' storage unless it explicitly has 'rootdir'
        # Storage 'local' (type dir) usually only supports vztmpl/iso, not containers
        if [[ "$storage" == "local" ]]; then
            if [[ "$storage_content" != *"rootdir"* ]]; then
                print_info "  → Storage 'local' ignorado (não suporta containers - falta 'rootdir')" >&2
                continue
            else
                print_info "  → Storage 'local' aceite (tem 'rootdir' no conteúdo)" >&2
            fi
        fi
        
        # Check if storage supports containers
        local supports_containers=false
        
        # For storages of type 'dir', MUST have 'rootdir' explicitly
        if [[ "$storage_type" == "dir" ]]; then
            if [[ "$storage_content" == *"rootdir"* ]]; then
                supports_containers=true
                print_info "  → Suporta containers (tipo 'dir' com 'rootdir')" >&2
            else
                print_info "  → Não suporta containers (tipo 'dir' sem 'rootdir')" >&2
                continue
            fi
        # For LVM, ZFS, and BTRFS types, they typically support containers
        elif [[ "$storage_type" == "lvm" ]] || [[ "$storage_type" == "zfspool" ]] || [[ "$storage_type" == "btrfs" ]]; then
            supports_containers=true
            print_info "  → Suporta containers (tipo '$storage_type')" >&2
        # For other types, check for rootdir in content
        elif [[ "$storage_content" == *"rootdir"* ]]; then
            supports_containers=true
            print_info "  → Suporta containers (tem 'rootdir' no conteúdo)" >&2
        else
            print_info "  → Não suporta containers" >&2
            continue
        fi
        
        # If storage supports containers, consider it
        if [ "$supports_containers" = true ]; then
            # Prefer local-lvm first
            if [[ "$storage" == "local-lvm" ]]; then
                preferred_storage="$storage"
                print_info "  → Storage preferido encontrado: $storage" >&2
                break
            fi
            
            # If no preferred storage found yet, use first valid one
            if [ -z "$local_storage" ]; then
                local_storage="$storage"
                print_info "  → Storage candidato: $storage" >&2
            fi
        fi
    done
    
    # Use preferred storage if found, otherwise use first valid one
    if [ -n "$preferred_storage" ]; then
        local_storage="$preferred_storage"
    fi
    
    if [ -z "$local_storage" ]; then
        print_error "" >&2
        print_error "==========================================" >&2
        print_error "Nenhum storage adequado para containers encontrado!" >&2
        print_error "==========================================" >&2
        print_error "" >&2
        print_error "Storages disponíveis no sistema:" >&2
        pvesm status >&2
        print_error "" >&2
        print_error "SOLUÇÃO: Criar um storage 'local-lvm' que suporta containers" >&2
        print_error "" >&2
        print_error "Para criar o storage 'local-lvm', execute os seguintes comandos:" >&2
        print_error "" >&2
        print_info "1. Verificar espaço disponível no volume group:" >&2
        print_info "   vgs" >&2
        print_info "" >&2
        print_info "2. Criar storage local-lvm (substitua 'VG_NAME' pelo nome do seu volume group):" >&2
        print_info "   pvesm add lvm local-lvm --vgname VG_NAME --content rootdir,images" >&2
        print_info "" >&2
        print_info "3. Ou usar o volume group padrão (geralmente 'pve'):" >&2
        print_info "   pvesm add lvm local-lvm --vgname pve --content rootdir,images" >&2
        print_info "" >&2
        print_info "4. Verificar que foi criado:" >&2
        print_info "   pvesm status" >&2
        print_info "" >&2
        print_info "Depois execute este script novamente." >&2
        print_error "" >&2
        exit 1
    fi
    
    print_success "Storage adequado encontrado: $local_storage" >&2
    # Output only the value, no extra spaces or characters
    printf "%s\n" "$local_storage"
    return 0
}

find_available_id() {
    print_info "A procurar próximo ID de container disponível..." >&2
    
    local start_id=100
    local id=$start_id
    
    while [ $id -lt 1000 ]; do
        if ! pct status $id &> /dev/null; then
            print_success "ID disponível encontrado: $id" >&2
            # Output only the numeric ID, no extra spaces or characters
            printf "%d\n" "$id"
            return 0
        fi
        id=$((id + 1))
    done
    
    print_error "Não foi possível encontrar um ID disponível (100-999)" >&2
    exit 1
}

find_debian_template() {
    print_info "A procurar template Debian..." >&2
    
    # Check local templates first
    local local_templates=$(pveam list local 2>/dev/null | grep -i debian | head -1 | awk '{print $1}')
    
    if [ -n "$local_templates" ]; then
        print_success "Template local encontrado: $local_templates" >&2
        # Format: local:vztmpl/template-name
        local template_path=""
        if [[ "$local_templates" == *"vztmpl"* ]]; then
            template_path="$local_templates"
        else
            template_path="local:vztmpl/$local_templates"
        fi
        # Output only the template path, no extra spaces or characters
        printf "%s\n" "$template_path"
        return 0
    fi
    
    # If no local template, try to find available one
    print_info "Template local não encontrado, a procurar templates disponíveis..." >&2
    pveam update &> /dev/null || true
    
    # Try to find latest Debian template
    local available_template=$(pveam available 2>/dev/null | grep -i "debian.*standard" | tail -1 | awk '{print $1}')
    
    if [ -z "$available_template" ]; then
        print_error "Template Debian não encontrado!" >&2
        print_info "Templates disponíveis:" >&2
        pveam available 2>/dev/null | head -20 >&2
        exit 1
    fi
    
    print_info "A baixar template: $available_template" >&2
    pveam download local "$available_template" >&2 || {
        print_error "Falha ao baixar template" >&2
        exit 1
    }
    
    print_success "Template baixado: $available_template" >&2
    # Output only the template path, no extra spaces or characters
    printf "local:vztmpl/%s\n" "$available_template"
    return 0
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
    
    print_info "A obter IP do container..." >&2
    
    while [ $attempt -lt $max_attempts ]; do
        # Try to get IP from container
        local ip=$(pct exec $container_id -- hostname -I 2>/dev/null | awk '{print $1}')
        
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "IP do container: $ip" >&2
            # Output only the IP, no extra spaces or characters
            printf "%s\n" "$ip"
            return 0
        fi
        
        # Alternative: get from config
        ip=$(pct config $container_id 2>/dev/null | grep "ip=" | cut -d'=' -f2 | cut -d'/' -f1)
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "IP do container: $ip" >&2
            # Output only the IP, no extra spaces or characters
            printf "%s\n" "$ip"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Não foi possível obter IP automaticamente" >&2
    printf "\n"
    return 1
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
    
    # Debug: Show raw captured values (trimmed)
    storage=$(echo "$storage" | tr -d '[:space:]')
    container_id=$(echo "$container_id" | tr -d '[:space:]')
    template=$(echo "$template" | tr -d '[:space:]')
    
    # Validate captured values
    if [ -z "$storage" ] || [[ ! "$storage" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        print_error "Valor de storage inválido capturado: '$storage'"
        exit 1
    fi
    
    if [ -z "$container_id" ] || [[ ! "$container_id" =~ ^[0-9]+$ ]] || [ "$container_id" -lt 100 ] || [ "$container_id" -ge 1000 ]; then
        print_error "Valor de container_id inválido capturado: '$container_id'"
        print_error "Esperado: número entre 100-999"
        exit 1
    fi
    
    if [ -z "$template" ] || [[ ! "$template" =~ ^local:vztmpl/ ]]; then
        print_error "Valor de template inválido capturado: '$template'"
        print_error "Esperado: formato 'local:vztmpl/...'"
        exit 1
    fi
    
    # Debug output
    print_info "Valores capturados e validados:" >&2
    print_info "  Storage: '$storage'" >&2
    print_info "  Container ID: '$container_id'" >&2
    print_info "  Template: '$template'" >&2
    
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
    
    # Validate storage supports containers before creating
    print_info "A validar storage antes de criar container..." >&2
    local storage_content=$(pvesm status | grep "^$storage" | awk '{print $3}')
    if [[ "$storage" == "local" ]] && [[ "$storage_content" != *"rootdir"* ]]; then
        print_error "Storage '$storage' não suporta containers!" >&2
        print_error "Por favor configure um storage que suporte containers (ex: local-lvm)" >&2
        exit 1
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

