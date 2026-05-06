# Linux installation (Git clone)

Use this path on Debian/Ubuntu servers or containers (including **Proxmox LXC**). The Windows `dist` executables are not used here; you run the Node.js stack from source.

## Requirements

- Debian or Ubuntu (recent LTS recommended)
- Root or `sudo`
- Outbound HTTPS (git, npm, NodeSource)

## Quick install (automated script)

From any directory: either use this repo’s [`scripts/install-from-github.sh`](../scripts/install-from-github.sh), or download the raw file from GitHub (replace `OWNER`, repo name, and branch):

```bash
curl -fsSL -o /tmp/install-from-github.sh \
  'https://raw.githubusercontent.com/OWNER/Handover/main/scripts/install-from-github.sh'
```

Then:

1. Set your Git remote (HTTPS or SSH):

   ```bash
   export HANDOVER_GIT_URL='https://github.com/YOUR_USER/Handover.git'
   ```

2. Optional variables:

   | Variable | Default | Description |
   |----------|---------|-------------|
   | `HANDOVER_BRANCH` | `main` | Git branch |
   | `HANDOVER_INSTALL_DIR` | `/opt/handover` | Install path |
   | `HANDOVER_PORT` | `8500` | HTTP port |
   | `HANDOVER_NODE_MAJOR` | `20` | Node LTS series via NodeSource |
   | `HANDOVER_SKIP_APT` | — | Set to `1` if packages already installed |
   | `HANDOVER_SKIP_NODE` | — | Set to `1` if Node 18+ already installed |

3. Run the script (bundled in the repo as [`scripts/install-from-github.sh`](../scripts/install-from-github.sh)):

   ```bash
   sudo bash scripts/install-from-github.sh
   ```

   If you copied only the script into an empty VM, ensure it is executable (`chmod +x`) or invoke it with `bash` as above.

The script installs build tools (for `sqlite3` / `bcrypt`), Node.js LTS via NodeSource, clones or updates the repo, writes a `.env` with `NODE_ENV=production`, generates `JWT_SECRET` if missing, builds the React app with `REACT_APP_API_URL=/api` (so browsers on other machines use the same host/port), runs `setup-db`, and prints the start command.

## Linux Mint desktop one-shot installer (GUI + desktop shortcut)

For Linux Mint desktop usage, use [`scripts/install-linux-desktop.sh`](../scripts/install-linux-desktop.sh). It performs:

- `apt update` and (optionally) full `apt upgrade`
- dependency installation (`node`, `npm`, `python3`, `python3-tk`, build tools)
- clone/update of the repository
- npm install + frontend build + DB setup
- creation of a desktop launcher (`Handover GUI.desktop`) on `~/Desktop`

Run directly from GitHub (recommended when setting up a fresh machine):

```bash
curl -fsSL -o /tmp/install-linux-desktop.sh \
  'https://raw.githubusercontent.com/tabasko81/Handover/main/scripts/install-linux-desktop.sh'

chmod +x /tmp/install-linux-desktop.sh
/tmp/install-linux-desktop.sh
```

Or run from an already cloned repository:

```bash
cd Handover
bash scripts/install-linux-desktop.sh
```

Optional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `HANDOVER_GIT_URL` | `https://github.com/tabasko81/Handover.git` | Repository URL |
| `HANDOVER_BRANCH` | `main` | Git branch |
| `HANDOVER_INSTALL_DIR` | `$HOME/Handover` | Install path |
| `HANDOVER_PORT` | `8500` | HTTP port |
| `HANDOVER_NODE_MAJOR` | `20` | Node LTS series via NodeSource |
| `HANDOVER_SKIP_UPGRADE` | — | Set to `1` to skip full system upgrade |
| `HANDOVER_SKIP_NODE` | — | Set to `1` if Node 18+ already installed |
| `HANDOVER_SKIP_FIREWALL` | — | Set to `1` to skip UFW rule creation |

Example with custom repository/branch:

```bash
export HANDOVER_GIT_URL='https://github.com/YOUR_USER/Handover.git'
export HANDOVER_BRANCH='feature/linux-github-install'
export HANDOVER_INSTALL_DIR="$HOME/Handover"
bash scripts/install-linux-desktop.sh
```

## Start the server

```bash
cd /opt/handover   # or your HANDOVER_INSTALL_DIR
npm run start:prod
```

The app listens on `0.0.0.0` and port `PORT` from `.env` (default `8500`).

## Firewall

Allow the HTTP port on the guest (example with UFW):

```bash
sudo ufw allow "${HANDOVER_PORT:-8500}/tcp"
sudo ufw reload
```

On Proxmox, ensure the CT network allows access from your LAN; open the port on any upstream firewall if needed.

## systemd (optional)

Example unit `/etc/systemd/system/handover.service`:

```ini
[Unit]
Description=Shift Handover Log
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/handover
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start:prod
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Adjust `User` and `WorkingDirectory` to match your install. Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now handover.service
```

## Security

- Change default admin credentials after first login (see main README).
- Protect `.env`; it contains `JWT_SECRET`.
- For HTTPS, put **nginx** or **Caddy** in front and set `FRONTEND_URL` / proxy headers as needed (the server sets `trust proxy`).

## Troubleshooting

- **`JWT_SECRET must be set in production`:** Ensure `.env` in the project root contains a non-empty `JWT_SECRET` (the install script creates one).
- **Blank page from another PC:** Rebuild the client with `REACT_APP_API_URL=/api` (the script does this); do not bake `localhost` into the production build if users access by IP or hostname.
