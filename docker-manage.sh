#!/bin/bash

###############################################################################
# Shift Handover Log - Docker Management Script
# 
# Script auxiliar para gerir os containers Docker
###############################################################################

APP_DIR="/opt/shift-handover-log"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"

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

check_compose_file() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Ficheiro docker-compose.yml não encontrado em $APP_DIR"
        exit 1
    fi
}

case "$1" in
    start)
        check_compose_file
        print_info "A iniciar containers..."
        docker compose -f "$COMPOSE_FILE" up -d
        print_success "Containers iniciados"
        ;;
    stop)
        check_compose_file
        print_info "A parar containers..."
        docker compose -f "$COMPOSE_FILE" down
        print_success "Containers parados"
        ;;
    restart)
        check_compose_file
        print_info "A reiniciar containers..."
        docker compose -f "$COMPOSE_FILE" restart
        print_success "Containers reiniciados"
        ;;
    status)
        check_compose_file
        print_info "Estado dos containers:"
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    logs)
        check_compose_file
        SERVICE="${2:-}"
        if [ -z "$SERVICE" ]; then
            print_info "Logs de todos os serviços:"
            docker compose -f "$COMPOSE_FILE" logs -f
        else
            print_info "Logs do serviço $SERVICE:"
            docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
        fi
        ;;
    rebuild)
        check_compose_file
        print_info "A reconstruir imagens..."
        docker compose -f "$COMPOSE_FILE" build --no-cache
        print_info "A reiniciar containers..."
        docker compose -f "$COMPOSE_FILE" up -d
        print_success "Reconstrução concluída"
        ;;
    shell-backend)
        check_compose_file
        print_info "A abrir shell do backend..."
        docker compose -f "$COMPOSE_FILE" exec backend sh
        ;;
    shell-frontend)
        check_compose_file
        print_info "A abrir shell do frontend..."
        docker compose -f "$COMPOSE_FILE" exec frontend sh
        ;;
    backup)
        check_compose_file
        BACKUP_DIR="${2:-$APP_DIR/backups}"
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        
        mkdir -p "$BACKUP_DIR"
        print_info "A criar backup em $BACKUP_FILE..."
        
        tar -czf "$BACKUP_FILE" -C "$APP_DIR" data logs .env 2>/dev/null || true
        
        if [ -f "$BACKUP_FILE" ]; then
            print_success "Backup criado: $BACKUP_FILE"
        else
            print_error "Falha ao criar backup"
        fi
        ;;
    update)
        check_compose_file
        print_info "A atualizar aplicação..."
        
        # Stop containers
        docker compose -f "$COMPOSE_FILE" down
        
        # Backup
        ./docker-manage.sh backup
        
        # Pull latest code (if using git)
        if [ -d "$APP_DIR/.git" ]; then
            cd "$APP_DIR"
            git pull
        else
            print_warning "Diretório não é um repositório git. Atualize manualmente os ficheiros."
        fi
        
        # Rebuild and start
        docker compose -f "$COMPOSE_FILE" build --no-cache
        docker compose -f "$COMPOSE_FILE" up -d
        
        print_success "Atualização concluída"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs|rebuild|shell-backend|shell-frontend|backup|update}"
        echo
        echo "Comandos:"
        echo "  start          - Iniciar containers"
        echo "  stop           - Parar containers"
        echo "  restart        - Reiniciar containers"
        echo "  status         - Mostrar estado dos containers"
        echo "  logs [service] - Mostrar logs (backend/frontend ou todos)"
        echo "  rebuild        - Reconstruir imagens e reiniciar"
        echo "  shell-backend  - Abrir shell no container backend"
        echo "  shell-frontend - Abrir shell no container frontend"
        echo "  backup [dir]   - Criar backup dos dados"
        echo "  update         - Atualizar aplicação"
        exit 1
        ;;
esac

