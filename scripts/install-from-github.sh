#!/usr/bin/env bash
# Install Shift Handover Log from Git on Debian/Ubuntu (e.g. Proxmox LXC).
# Usage:
#   export HANDOVER_GIT_URL='https://github.com/OWNER/Handover.git'
#   sudo bash scripts/install-from-github.sh
#
# Optional environment variables:
#   HANDOVER_BRANCH      default: main
#   HANDOVER_INSTALL_DIR default: /opt/handover
#   HANDOVER_PORT        default: 8500
#   HANDOVER_NODE_MAJOR  default: 20  (NodeSource LTS)
#   HANDOVER_SKIP_APT    set to 1 to skip apt install (git, build tools, etc.)
#   HANDOVER_SKIP_NODE   set to 1 if Node.js is already installed (>= 18)

set -euo pipefail

die() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

SUDO=""
if [[ "$(id -u)" -ne 0 ]]; then
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo"
  SUDO="sudo"
fi

HANDOVER_GIT_URL="${HANDOVER_GIT_URL:-}"
[[ -n "$HANDOVER_GIT_URL" ]] || die "Set HANDOVER_GIT_URL to your repository clone URL (HTTPS or SSH)"

HANDOVER_BRANCH="${HANDOVER_BRANCH:-main}"
HANDOVER_INSTALL_DIR="${HANDOVER_INSTALL_DIR:-/opt/handover}"
HANDOVER_PORT="${HANDOVER_PORT:-8500}"
HANDOVER_NODE_MAJOR="${HANDOVER_NODE_MAJOR:-20}"

export DEBIAN_FRONTEND=noninteractive

if [[ "${HANDOVER_SKIP_APT:-0}" != "1" ]]; then
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq git curl ca-certificates openssl build-essential python3
fi

install_node_nodesource() {
  local major="$1"
  local setup_url="https://deb.nodesource.com/setup_${major}.x"
  curl -fsSL "$setup_url" | $SUDO -E bash -
  $SUDO apt-get install -y -qq nodejs
}

if [[ "${HANDOVER_SKIP_NODE:-0}" != "1" ]]; then
  if ! command -v node >/dev/null 2>&1; then
    install_node_nodesource "$HANDOVER_NODE_MAJOR"
  fi
fi

require_cmd node
require_cmd npm
require_cmd git
require_cmd openssl

NODE_VER="$(node -p "process.versions.node.split('.')[0]")"
[[ "${NODE_VER:-0}" -ge 18 ]] || die "Node.js 18+ required (found $(node -v))"

REPO_DIR="$HANDOVER_INSTALL_DIR"
REPO_PARENT="$(dirname "$REPO_DIR")"
$SUDO mkdir -p "$REPO_PARENT"

if [[ -d "$REPO_DIR/.git" ]]; then
  echo "Updating existing clone in $REPO_DIR ..."
  $SUDO git -C "$REPO_DIR" fetch --depth 1 origin "$HANDOVER_BRANCH" || \
    $SUDO git -C "$REPO_DIR" fetch origin "$HANDOVER_BRANCH"
  $SUDO git -C "$REPO_DIR" checkout "$HANDOVER_BRANCH"
  if ! $SUDO git -C "$REPO_DIR" pull --ff-only origin "$HANDOVER_BRANCH"; then
    echo "Warning: git pull --ff-only failed; resolve manually in $REPO_DIR" >&2
  fi
elif [[ -e "$REPO_DIR" ]]; then
  die "Path exists but is not a git repository: $REPO_DIR"
else
  echo "Cloning into $REPO_DIR ..."
  if ! $SUDO git clone --depth 1 --branch "$HANDOVER_BRANCH" "$HANDOVER_GIT_URL" "$REPO_DIR"; then
    echo "Retrying clone without --branch ..."
    $SUDO git clone --depth 1 "$HANDOVER_GIT_URL" "$REPO_DIR"
    $SUDO git -C "$REPO_DIR" checkout "$HANDOVER_BRANCH"
  fi
fi

# Prefer owning the tree as the invoking user when sudo was used
if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  chown -R "$SUDO_USER:$SUDO_USER" "$REPO_DIR"
elif [[ "$(id -u)" -eq 0 ]]; then
  echo "Warning: running as root without SUDO_USER; files under $REPO_DIR stay root-owned." >&2
fi

run_project_commands() {
  cd "$REPO_DIR"

  echo "Installing npm dependencies ..."
  npm run install-all

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
    echo "Generated JWT_SECRET (saved to .env)."
  fi

  set_kv NODE_ENV production
  set_kv PORT "$HANDOVER_PORT"

  echo "Building client (public API URL: /api) ..."
  export REACT_APP_API_URL=/api
  npm run build

  echo "Initializing database ..."
  npm run setup-db
}

export REPO_DIR HANDOVER_PORT
if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  sudo -E -u "$SUDO_USER" -H bash -lc "$(declare -f run_project_commands); run_project_commands"
else
  run_project_commands
fi

echo ""
echo "Installation finished."
echo "  Directory: $REPO_DIR"
echo "  URL:       http://<this-host>:${HANDOVER_PORT}"
echo "  Start:     cd $REPO_DIR && npm run start:prod"
echo "See docs/INSTALL_LINUX.md for systemd and firewall notes."
echo ""
