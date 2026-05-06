#!/usr/bin/env bash
# One-shot Linux desktop installer (Mint/Ubuntu/Debian) for Shift Handover Log.
# It installs dependencies, clones/updates from GitHub, builds the project,
# initializes DB, and creates a Desktop launcher for GUI start.

set -euo pipefail

die() {
  echo "Error: $*" >&2
  exit 1
}

log() {
  echo
  echo "==> $*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo first"
  SUDO="sudo"
fi

HANDOVER_GIT_URL="${HANDOVER_GIT_URL:-https://github.com/tabasko81/Handover.git}"
HANDOVER_BRANCH="${HANDOVER_BRANCH:-main}"
HANDOVER_INSTALL_DIR="${HANDOVER_INSTALL_DIR:-$HOME/Handover}"
HANDOVER_PORT="${HANDOVER_PORT:-8500}"
HANDOVER_NODE_MAJOR="${HANDOVER_NODE_MAJOR:-20}"

# Optional skips:
# - HANDOVER_SKIP_UPGRADE=1  (skip apt full-upgrade)
# - HANDOVER_SKIP_NODE=1     (skip NodeSource install; expect node>=18 already present)
# - HANDOVER_SKIP_FIREWALL=1 (skip UFW allow)

TARGET_USER="${SUDO_USER:-$USER}"
TARGET_HOME="$(eval echo "~${TARGET_USER}")"

[[ -n "$TARGET_HOME" && -d "$TARGET_HOME" ]] || die "Could not resolve target user home for '${TARGET_USER}'"

export DEBIAN_FRONTEND=noninteractive

log "System package update"
$SUDO apt-get update -y

if [[ "${HANDOVER_SKIP_UPGRADE:-0}" != "1" ]]; then
  log "System package upgrade"
  $SUDO apt-get upgrade -y
fi

log "Installing required packages"
$SUDO apt-get install -y \
  git curl ca-certificates gnupg openssl \
  build-essential python3 python3-tk python3-venv

install_node_nodesource() {
  local major="$1"
  local setup_url="https://deb.nodesource.com/setup_${major}.x"
  log "Installing Node.js ${major}.x from NodeSource"
  curl -fsSL "$setup_url" | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
}

if [[ "${HANDOVER_SKIP_NODE:-0}" != "1" ]]; then
  install_node_nodesource "$HANDOVER_NODE_MAJOR"
fi

require_cmd git
require_cmd node
require_cmd npm
require_cmd python3
require_cmd openssl

NODE_VER="$(node -p "process.versions.node.split('.')[0]")"
[[ "${NODE_VER:-0}" -ge 18 ]] || die "Node.js 18+ required (found $(node -v))"

REPO_DIR="$HANDOVER_INSTALL_DIR"
REPO_PARENT="$(dirname "$REPO_DIR")"

log "Preparing install directory: $REPO_DIR"
$SUDO mkdir -p "$REPO_PARENT"

if [[ -d "$REPO_DIR/.git" ]]; then
  log "Updating existing repository"
  $SUDO git -C "$REPO_DIR" fetch origin "$HANDOVER_BRANCH"
  $SUDO git -C "$REPO_DIR" checkout "$HANDOVER_BRANCH"
  $SUDO git -C "$REPO_DIR" pull --ff-only origin "$HANDOVER_BRANCH"
elif [[ -e "$REPO_DIR" ]]; then
  die "Install path exists but is not a git repository: $REPO_DIR"
else
  log "Cloning repository from GitHub"
  $SUDO git clone --branch "$HANDOVER_BRANCH" "$HANDOVER_GIT_URL" "$REPO_DIR"
fi

if [[ "$TARGET_USER" != "root" ]]; then
  $SUDO chown -R "$TARGET_USER:$TARGET_USER" "$REPO_DIR"
fi

run_project_commands() {
  cd "$REPO_DIR"

  log "Installing npm dependencies"
  npm install
  (cd client && npm install)

  ENV_FILE="$REPO_DIR/.env"
  touch "$ENV_FILE"

  set_kv() {
    local key="$1"
    local val="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
      echo "${key}=${val}" >> "$ENV_FILE"
    fi
  }

  if ! grep -qE '^JWT_SECRET=.+$' "$ENV_FILE" 2>/dev/null; then
    JWT_NEW="$(openssl rand -hex 32)"
    if grep -q '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null; then
      sed -i '/^JWT_SECRET=/d' "$ENV_FILE"
    fi
    echo "JWT_SECRET=${JWT_NEW}" >> "$ENV_FILE"
  fi

  set_kv NODE_ENV production
  set_kv PORT "$HANDOVER_PORT"

  log "Building frontend (REACT_APP_API_URL=/api)"
  export REACT_APP_API_URL=/api
  npm run build

  log "Initializing database"
  npm run setup-db

  START_GUI_SCRIPT="$REPO_DIR/start-gui-linux.sh"
  cat > "$START_GUI_SCRIPT" <<EOF
#!/usr/bin/env bash
set -euo pipefail
cd "$REPO_DIR"
exec python3 server.py
EOF
  chmod +x "$START_GUI_SCRIPT"

  DESKTOP_DIR="$TARGET_HOME/Desktop"
  mkdir -p "$DESKTOP_DIR"
  DESKTOP_FILE="$DESKTOP_DIR/Handover GUI.desktop"
  cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Handover GUI
Comment=Start Shift Handover Log GUI
Exec=$START_GUI_SCRIPT
Path=$REPO_DIR
Icon=utilities-terminal
Terminal=false
Categories=Utility;Office;
StartupNotify=true
EOF
  chmod +x "$DESKTOP_FILE"

  # Mark launcher as trusted when possible (Mint/Nemo)
  if command -v gio >/dev/null 2>&1; then
    gio set "$DESKTOP_FILE" "metadata::trusted" yes >/dev/null 2>&1 || true
  fi
}

export REPO_DIR HANDOVER_PORT TARGET_HOME
if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  sudo -E -u "$SUDO_USER" -H bash -lc "$(declare -f log run_project_commands); run_project_commands"
else
  run_project_commands
fi

if [[ "${HANDOVER_SKIP_FIREWALL:-0}" != "1" ]] && command -v ufw >/dev/null 2>&1; then
  log "Configuring firewall (UFW) for port $HANDOVER_PORT"
  $SUDO ufw allow "${HANDOVER_PORT}/tcp" >/dev/null 2>&1 || true
fi

echo
echo "Installation complete."
echo "  Directory: $REPO_DIR"
echo "  Branch:    $HANDOVER_BRANCH"
echo "  URL:       http://localhost:${HANDOVER_PORT}"
echo "  GUI start: $REPO_DIR/start-gui-linux.sh"
echo "  Desktop:   $TARGET_HOME/Desktop/Handover GUI.desktop"
echo
