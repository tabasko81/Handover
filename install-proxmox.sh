#!/bin/bash

###############################################################################
# Shift Handover Log - Automatic Installation on Proxmox LXC
# 
# This script automatically creates an LXC container on Proxmox and installs
# the Shift Handover Log application with Docker.
#
# Usage: Paste this command in the Proxmox shell:
# curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
#
# Alternative (using specific commit SHA):
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
        print_error "This script must be run on the Proxmox host!"
        print_error "Commands 'pct' or 'pvesm' not found."
        exit 1
    fi
    print_success "Proxmox environment detected"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root"
        exit 1
    fi
}

find_local_storage() {
    print_info "Searching for suitable container storage..." >&2
    
    local storage=""
    
    # Get list of storages (skip header)
    local storages=$(pvesm status | awk 'NR>1 {print $1}')
    
    # Check each storage for rootdir support using pvesm config
    for storage_name in $storages; do
        # Skip USB/external storages
        if [[ "$storage_name" == *"usb"* ]] || [[ "$storage_name" == *"external"* ]]; then
            print_info "Ignoring USB/external storage: $storage_name" >&2
            continue
        fi
        
        # Get storage content configuration
        local storage_config=$(pvesm config "$storage_name" 2>/dev/null)
        local storage_content=$(echo "$storage_config" | grep "^content:" | cut -d' ' -f2- | tr -d ' ')
        
        print_info "Checking storage: $storage_name (content: ${storage_content:-none})" >&2
        
        # Check if storage has rootdir in content
        if [[ "$storage_content" == *"rootdir"* ]]; then
            storage="$storage_name"
            print_success "Storage '$storage' found with container support" >&2
            printf "%s\n" "$storage"
            return 0
        fi
    done
    
    # If no storage found, try to configure 'local-lvm' first (most common)
    if pvesm status | grep -q "^local-lvm "; then
        print_info "Storage 'local-lvm' exists but without container support" >&2
        print_info "Attempting to configure 'local-lvm' to support containers..." >&2
        
        # Get current content
        local storage_config=$(pvesm config local-lvm 2>/dev/null)
        local current_content=$(echo "$storage_config" | grep "^content:" | cut -d' ' -f2- | tr -d ' ')
        
        if [ -n "$current_content" ]; then
            # Add rootdir if not present
            if [[ "$current_content" != *"rootdir"* ]]; then
                local new_content="${current_content},rootdir"
                print_info "Configuring 'local-lvm' with content: $new_content" >&2
                if pvesm set local-lvm --content "$new_content" 2>/dev/null; then
                    print_success "Storage 'local-lvm' configured to support containers" >&2
                    storage="local-lvm"
                    printf "%s\n" "$storage"
                    return 0
                else
                    print_warning "Failed to configure 'local-lvm', trying with minimal content..." >&2
                    # Try with minimal content
                    if pvesm set local-lvm --content rootdir,images 2>/dev/null; then
                        print_success "Storage 'local-lvm' configured with minimal content" >&2
                        storage="local-lvm"
                        printf "%s\n" "$storage"
                        return 0
                    fi
                fi
            else
                # Already has rootdir
                storage="local-lvm"
                print_success "Storage 'local-lvm' already supports containers" >&2
                printf "%s\n" "$storage"
                return 0
            fi
        else
            # No content configured, set default with rootdir
            print_info "Storage 'local-lvm' has no configured content, configuring..." >&2
            if pvesm set local-lvm --content rootdir,images 2>/dev/null; then
                print_success "Storage 'local-lvm' configured to support containers" >&2
                storage="local-lvm"
                printf "%s\n" "$storage"
                return 0
            fi
        fi
    fi
    
    # Try to configure 'local' storage
    if pvesm status | grep -q "^local "; then
        print_info "Attempting to configure 'local' storage to support containers..." >&2
        
        # Get current content
        local storage_config=$(pvesm config local 2>/dev/null)
        local current_content=$(echo "$storage_config" | grep "^content:" | cut -d' ' -f2- | tr -d ' ')
        
        if [ -n "$current_content" ]; then
            # Add rootdir if not present
            if [[ "$current_content" != *"rootdir"* ]]; then
                local new_content="${current_content},rootdir"
                print_info "Configuring 'local' with content: $new_content" >&2
                if pvesm set local --content "$new_content" 2>/dev/null; then
                    print_success "Storage 'local' configured to support containers" >&2
                    storage="local"
                    printf "%s\n" "$storage"
                    return 0
                else
                    print_warning "Failed to configure 'local', trying with default content..." >&2
                    # Try with standard content
                    if pvesm set local --content backup,iso,vztmpl,rootdir 2>/dev/null; then
                        print_success "Storage 'local' configured with default content" >&2
                        storage="local"
                        printf "%s\n" "$storage"
                        return 0
                    fi
                fi
            else
                # Already has rootdir
                storage="local"
                print_success "Storage 'local' already supports containers" >&2
                printf "%s\n" "$storage"
                return 0
            fi
        else
            # No content configured, set default with rootdir
            print_info "Storage 'local' has no configured content, configuring..." >&2
            if pvesm set local --content backup,iso,vztmpl,rootdir 2>/dev/null; then
                print_success "Storage 'local' configured to support containers" >&2
                storage="local"
                printf "%s\n" "$storage"
                return 0
            fi
        fi
    fi
    
    # If we still don't have a storage, show error with instructions
    print_error "" >&2
    print_error "==========================================" >&2
    print_error "No suitable storage for containers found!" >&2
    print_error "==========================================" >&2
    print_error "" >&2
    print_error "Available storages:" >&2
    pvesm status >&2
    print_error "" >&2
    print_error "SOLUTIONS:" >&2
    print_error "" >&2
    print_info "Option 1: Configure 'local-lvm' storage to support containers:" >&2
    print_info "   pvesm set local-lvm --content rootdir,images" >&2
    print_info "" >&2
    print_info "Option 2: Configure 'local' storage to support containers:" >&2
    print_info "   pvesm set local --content backup,iso,vztmpl,rootdir" >&2
    print_error "" >&2
    exit 1
}

find_available_id() {
    print_info "Searching for next available container ID..." >&2
    
    local start_id=100
    local id=$start_id
    
    while [ $id -lt 1000 ]; do
        if ! pct status $id &> /dev/null; then
            print_success "Available ID found: $id" >&2
            # Output only the numeric ID, no extra spaces or characters
            printf "%d\n" "$id"
            return 0
        fi
        id=$((id + 1))
    done
    
    print_error "Could not find an available ID (100-999)" >&2
    exit 1
}

find_debian_template() {
    print_info "Searching for Debian template..." >&2
    
    # Check local templates first
    local local_templates=$(pveam list local 2>/dev/null | grep -i debian | head -1 | awk '{print $1}')
    
    if [ -n "$local_templates" ]; then
        print_success "Local template found: $local_templates" >&2
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
    print_info "Local template not found, searching available templates..." >&2
    pveam update &> /dev/null || true
    
    # Try to find latest Debian template
    local available_template=$(pveam available 2>/dev/null | grep -i "debian.*standard" | tail -1 | awk '{print $1}')
    
    if [ -z "$available_template" ]; then
        print_error "Debian template not found!" >&2
        print_info "Available templates:" >&2
        pveam available 2>/dev/null | head -20 >&2
        exit 1
    fi
    
    print_info "Downloading template: $available_template" >&2
    pveam download local "$available_template" >&2 || {
        print_error "Failed to download template" >&2
        exit 1
    }
    
    print_success "Template downloaded: $available_template" >&2
    # Output only the template path, no extra spaces or characters
    printf "local:vztmpl/%s\n" "$available_template"
    return 0
}

create_container() {
    local container_id=$1
    local storage=$2
    local template=$3
    
    print_info "Creating LXC container (ID: $container_id)..."
    
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
        print_error "Failed to create container"
        exit 1
    }
    
    print_success "Container created and started"
    
    # Configure privileged container settings (unconfined)
    # This resolves permission issues with Docker overlay/sysctls
    print_info "Applying security settings for Docker..."
    local config_file="/etc/pve/lxc/${container_id}.conf"
    if [ -f "$config_file" ]; then
        echo "lxc.apparmor.profile: unconfined" >> "$config_file"
        echo "lxc.cgroup.devices.allow: a" >> "$config_file"
        echo "lxc.cap.drop:" >> "$config_file"
        
        print_info "Restarting container to apply changes..."
        pct stop $container_id
        pct start $container_id
    fi
    
    # Wait for container to be ready
    print_info "Waiting for container to be ready..."
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
    
    print_info "Getting container IP..." >&2
    
    while [ $attempt -lt $max_attempts ]; do
        # Try to get IP from container
        local ip=$(pct exec $container_id -- hostname -I 2>/dev/null | awk '{print $1}')
        
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "Container IP: $ip" >&2
            # Output only the IP, no extra spaces or characters
            printf "%s\n" "$ip"
            return 0
        fi
        
        # Alternative: get from config
        ip=$(pct config $container_id 2>/dev/null | grep "ip=" | cut -d'=' -f2 | cut -d'/' -f1)
        if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_success "Container IP: $ip" >&2
            # Output only the IP, no extra spaces or characters
            printf "%s\n" "$ip"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "Could not get IP automatically" >&2
    printf "\n"
    return 1
}

install_inside_container() {
    local container_id=$1
    local container_ip=$2
    
    print_info "Installing application inside container..."
    
    # Update system and install git
    print_info "Updating system and installing Git..."
    pct exec $container_id -- bash -c "
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -qq
        apt-get install -y -qq git curl wget
    " || {
        print_error "Failed to install dependencies"
        exit 1
    }
    
    # Clone repository
    print_info "Cloning repository..."
    pct exec $container_id -- bash -c "
        if [ -d '$APP_DIR' ]; then
            rm -rf '$APP_DIR'
        fi
        git clone '$GIT_REPO' '$APP_DIR' || {
            echo 'Failed to clone repository'
            exit 1
        }
    " || {
        print_error "Failed to clone repository"
        exit 1
    }
    
    # Run installation script in non-interactive mode
    print_info "Running Docker installation script..."
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
            echo 'Docker installation failed'
            exit 1
        }
    " || {
        print_error "Installation failed inside container"
        print_info "Checking container logs..."
        pct exec $container_id -- bash -c "cd '$APP_DIR' && docker compose logs --tail=50" 2>/dev/null || true
        exit 1
    }
    
    print_success "Installation inside container completed"
}

show_final_info() {
    local container_id=$1
    local container_ip=$2
    
    echo
    print_success "=========================================="
    print_success "Installation completed successfully!"
    print_success "=========================================="
    echo
    print_success "=========================================="
    print_success "🌐 ACCESS WEB APPLICATION:"
    print_success "=========================================="
    echo
    print_success "Main URL:"
    echo "  👉 http://$container_ip:$FRONTEND_PORT"
    echo
    print_info "Other URLs:"
    echo "  Backend API: http://$container_ip:$BACKEND_PORT/api"
    echo "  Health Check: http://$container_ip:$BACKEND_PORT/api/health"
    echo
    print_success "=========================================="
    print_success "🔐 Access Credentials:"
    print_success "=========================================="
    echo
    echo "  Username: admin"
    echo "  Password: pass123"
    echo
    print_warning "⚠️  CHANGE PASSWORD IMMEDIATELY after first login!"
    echo
    print_info "=========================================="
    print_info "Container Information:"
    print_info "=========================================="
    echo "  ID: $container_id"
    echo "  Hostname: $CONTAINER_HOSTNAME"
    echo "  IP: $container_ip"
    echo
    print_info "Useful Commands:"
    echo "  Enter container: pct enter $container_id"
    echo "  View logs: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose logs -f'"
    echo "  Stop application: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose down'"
    echo "  Start application: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose up -d'"
    echo "  Status: pct exec $container_id -- bash -c 'cd $APP_DIR && docker compose ps'"
    echo
    print_info "Application directory in container: $APP_DIR"
    echo
}

# Main installation process
main() {
    echo
    print_info "=========================================="
    print_info "Shift Handover Log - Proxmox Installation"
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
        print_error "Invalid storage value captured: '$storage'"
        exit 1
    fi
    
    if [ -z "$container_id" ] || [[ ! "$container_id" =~ ^[0-9]+$ ]] || [ "$container_id" -lt 100 ] || [ "$container_id" -ge 1000 ]; then
        print_error "Invalid container_id value captured: '$container_id'"
        print_error "Expected: number between 100-999"
        exit 1
    fi
    
    if [ -z "$template" ] || [[ ! "$template" =~ ^local:vztmpl/ ]]; then
        print_error "Invalid template value captured: '$template'"
        print_error "Expected: format 'local:vztmpl/...'"
        exit 1
    fi
    
    # Debug output
    print_info "Captured and validated values:" >&2
    print_info "  Storage: '$storage'" >&2
    print_info "  Container ID: '$container_id'" >&2
    print_info "  Template: '$template'" >&2
    
    # Show summary
    echo
    print_info "Installation Summary:"
    echo "  Storage: $storage"
    echo "  Container ID: $container_id"
    echo "  Template: $template"
    echo "  Hostname: $CONTAINER_HOSTNAME"
    echo "  RAM: ${CONTAINER_MEMORY}MB"
    echo "  CPU: $CONTAINER_CORES cores"
    echo "  Disk: ${CONTAINER_DISK}GB"
    echo "  Backend Port: $BACKEND_PORT"
    echo "  Frontend Port: $FRONTEND_PORT"
    echo
    
    # Ask for confirmation (unless --yes flag)
    if [[ "$1" != "--yes" ]]; then
        read -p "Continue with installation? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            print_error "Installation cancelled"
            exit 1
        fi
    fi
    
    # Validate storage supports containers before creating
    print_info "Validating storage before creating container..." >&2
    local storage_content=$(pvesm status | grep "^$storage" | awk '{print $3}')
    if [[ "$storage" == "local" ]] && [[ "$storage_content" != *"rootdir"* ]]; then
        print_error "Storage '$storage' does not support containers!" >&2
        print_error "Please configure a storage that supports containers (e.g. local-lvm)" >&2
        exit 1
    fi
    
    # Create container
    create_container $container_id "$storage" "$template"
    
    # Get container IP
    local container_ip=$(get_container_ip $container_id)
    
    if [ -z "$container_ip" ]; then
        print_warning "IP not automatically detected"
        print_info "You can find the IP with: pct exec $container_id -- hostname -I"
        container_ip="<CONTAINER_IP>"
    fi
    
    # Install application inside container
    install_inside_container $container_id "$container_ip"
    
    # Show final information
    show_final_info $container_id "$container_ip"
}

# Run main function
main "$@"

