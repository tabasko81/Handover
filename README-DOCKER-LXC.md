# Shift Handover Log - Docker Installation on LXC/Proxmox

Complete guide to install the Shift Handover Log application in an LXC container on Proxmox using Docker.

## 📋 Prerequisites

- LXC Container on Proxmox (Debian/Ubuntu recommended)
- Root access to the container
- At least 2GB of available RAM
- At least 5GB of disk space

## 🚀 Quick Installation

### 1. Prepare the LXC Container

In Proxmox, create or configure an LXC container:

```bash
# On Proxmox host, create LXC container
pct create 100 local:vztmpl/debian-11-standard_11.7-1_amd64.tar.zst \
  --hostname handover-log \
  --memory 2048 \
  --cores 2 \
  --storage local-lvm \
  --rootfs local-lvm:8 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp
```

### 2. Access the Container

```bash
# On Proxmox host
pct enter 100

# Or via SSH if configured
ssh root@<container-ip>
```

### 3. Transfer Files

Copy application files to the container:

```bash
# Option 1: Via SCP (from your computer)
scp -r /path/to/Handover root@<container-ip>:/root/

# Option 2: Via Git (if project is on GitHub)
apt-get update
apt-get install -y git
git clone <repository-url> /opt/shift-handover-log
```

### 4. Run Installation Script

```bash
cd /root/Handover  # or /opt/shift-handover-log if used git
chmod +x install-docker-lxc.sh
./install-docker-lxc.sh
```

The script will:
- ✅ Verify and install Docker if needed
- ✅ Install Docker Compose
- ✅ Configure the application
- ✅ Build Docker images
- ✅ Start the containers

## ⚙️ Configuration

### Environment Variables

During installation, the script will ask for:
- **Backend Port**: Port for backend (default: 5000)
- **Frontend Port**: Port for frontend (default: 3000)
- **Domain**: Domain or IP of the server

### Manual Configuration

Edit the `.env` file in `/opt/shift-handover-log/`:

```bash
nano /opt/shift-handover-log/.env
```

Available variables:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-here
FRONTEND_URL=http://your-domain:3000
REACT_APP_API_URL=http://your-domain:5000/api
DOMAIN=your-domain
BACKEND_PORT=5000
FRONTEND_PORT=3000
```

## 🛠️ Application Management

Use the management script `docker-manage.sh` (if available) or standard docker commands:

```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# Restart containers
docker compose restart

# View status
docker compose ps

# View logs
docker compose logs -f
```

## 🌐 Accessing the Application

After installation, the application will be available at:

- **Frontend**: `http://<container-ip>:3000`
- **Backend API**: `http://<container-ip>:5000/api`
- **Health Check**: `http://<container-ip>:5000/api/health`

### Default Credentials

- **Username**: `admin`
- **Password**: `pass123`

⚠️ **IMPORTANT**: Change the password immediately after first login!

## 🔧 Network Configuration in Proxmox

### Port Forwarding

If you need to access from outside the local network, configure port forwarding in Proxmox:

1. On Proxmox host, edit `/etc/pve/lxc/<id>.conf`:

```
lxc.net.0.type = veth
lxc.net.0.link = vmbr0
lxc.net.0.flags = up
lxc.net.0.ipv4.address = 10.0.0.100/24
lxc.net.0.ipv4.gateway = 10.0.0.1
```

2. Configure port forwarding on your router/firewall

### Firewall

If using firewall in Proxmox, allow ports:

```bash
# On Proxmox host
pct set <id> -net0 name=eth0,bridge=vmbr0,firewall=1
```

## 📊 Monitoring

### View Real-time Logs

```bash
docker compose -f /opt/shift-handover-log/docker-compose.yml logs -f
```

### Check Container Status

```bash
docker compose -f /opt/shift-handover-log/docker-compose.yml ps
```

### Check Resource Usage

```bash
docker stats
```

## 🔄 Update

### Update Application

```bash
cd /opt/shift-handover-log
git pull  # If using git
docker compose build --no-cache
docker compose up -d
```

## 💾 Backup and Restore

### Create Backup

You can backup the `data` directory:

```bash
tar -czf backup.tar.gz -C /opt/shift-handover-log data
```

### Restore Backup

```bash
# Stop containers
docker compose down

# Extract backup
tar -xzf backup.tar.gz -C /opt/shift-handover-log/

# Restart containers
docker compose up -d
```

## 🐛 Troubleshooting

### Containers fail to start

```bash
# View detailed logs
docker compose -f /opt/shift-handover-log/docker-compose.yml logs

# Check status
docker compose -f /opt/shift-handover-log/docker-compose.yml ps
```

### Port already in use

Change ports in `docker-compose.yml`:

```yaml
ports:
  - "5001:5000"  # Backend on port 5001
  - "3001:80"    # Frontend on port 3001
```

### Permission issues

```bash
# Fix directory permissions (UID 1000 is node user)
chown -R 1000:1000 /opt/shift-handover-log/data
chown -R 1000:1000 /opt/shift-handover-log/logs
```

## 🔒 Security

### Recommendations

1. **Change default password** immediately
2. **Configure strong JWT_SECRET** in `.env`
3. **Use HTTPS** in production (configure reverse proxy)
4. **Keep system updated**: `apt-get update && apt-get upgrade`
5. **Configure firewall** to limit access
6. **Perform regular backups**

## 📞 Support

For issues or questions:
1. Check logs: `docker compose logs`
2. Consult documentation in `docs/`
3. Check status: `docker compose ps`