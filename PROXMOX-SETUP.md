# Automatic Installation on Proxmox LXC

Simple guide to install the Shift Handover Log application in an LXC container on Proxmox fully automatically.

## 🚀 Quick Installation

### Step 1: Access Proxmox Shell

1. Open the Proxmox web interface
2. Click on **"Shell"** in the top right corner (or access via SSH)
3. Ensure you are on the **Proxmox host** (not inside a container)

### Step 2: Run Installation Script

Paste this command into the Proxmox shell:

```bash
curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
```

**Alternatives if the above URL doesn't work:**

**Option 1: Use specific commit SHA (more reliable)**
```bash
curl -sSL https://raw.githubusercontent.com/tabasko81/Handover/bb930b099366bd7b07a671a4494b1ee1b65618ae/install-proxmox.sh | bash
```

**Option 2: Use wget**
```bash
wget -qO- https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh | bash
```

**Option 3: Manual download and execution**
```bash
# Download the file
wget https://raw.githubusercontent.com/tabasko81/Handover/main/install-proxmox.sh

# Make executable
chmod +x install-proxmox.sh

# Execute
bash install-proxmox.sh
```

### Step 3: Wait for Installation

The script will automatically:

1. ✅ Detect available local storage (excludes USB)
2. ✅ Find the next available container ID
3. ✅ Create an LXC container with Debian
4. ✅ Install Docker inside the container
5. ✅ Clone the Git repository
6. ✅ Install and start the application
7. ✅ Display access information

**Estimated time:** 5-10 minutes (depending on download speed)

### Step 4: Access the Application

After installation, the script will show:

- **Container IP** (e.g., `192.168.1.100`)
- **Frontend URL:** `http://<IP>:3000`
- **Backend URL:** `http://<IP>:5000/api`

**Default Credentials:**
- Username: `admin`
- Password: `pass123`

⚠️ **IMPORTANT:** Change the password immediately after the first login!

---

## 📋 Prerequisites

- Proxmox VE installed and configured
- Root access to the Proxmox host
- At least 2GB of available RAM
- At least 8GB of available local disk space (not USB)
- Network connectivity (for downloading templates and Git)

---

## ⚙️ Default Settings

The script uses the following default settings:

- **Template:** Debian (latest available)
- **Hostname:** `handover-log`
- **RAM:** 2048 MB
- **CPU:** 2 cores
- **Disk:** 8 GB
- **Network:** DHCP (bridge vmbr0)
- **Backend Port:** 5000
- **Frontend Port:** 3000

These settings can be changed by editing the `install-proxmox.sh` script before executing.

---

## 🔧 Container Management

### Enter the Container

```bash
pct enter <CONTAINER_ID>
```

### View Application Logs

```bash
pct exec <CONTAINER_ID> -- bash -c 'cd /opt/shift-handover-log && docker compose logs -f'
```

### Stop Application

```bash
pct exec <CONTAINER_ID> -- bash -c 'cd /opt/shift-handover-log && docker compose down'
```

### Start Application

```bash
pct exec <CONTAINER_ID> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

### View Status

```bash
pct exec <CONTAINER_ID> -- bash -c 'cd /opt/shift-handover-log && docker compose ps'
```

### Restart Container

```bash
pct restart <CONTAINER_ID>
```

### Stop Container

```bash
pct stop <CONTAINER_ID>
```

### Start Container

```bash
pct start <CONTAINER_ID>
```

---

## 🐛 Troubleshooting

### Error: "Local storage not found"

**Solution:**
- Verify you have local storage configured in Proxmox
- The script automatically excludes USB storage
- Configure a local storage (local-lvm or local) in Proxmox

### Error: "Debian template not found"

**Solution:**
- The script tries to automatically download the template
- Check network connectivity
- You can download manually: `pveam update && pveam download local debian-XX-standard`

### Container fails to start

**Solution:**
```bash
# View container logs
pct status <ID> --verbose

# Check configuration
pct config <ID>
```

### Application not responding

**Solution:**
```bash
# Enter container
pct enter <ID>

# Check if Docker is running
systemctl status docker

# View application logs
cd /opt/shift-handover-log
docker compose logs
```

### IP not detected

**Solution:**
```bash
# Find IP manually
pct exec <ID> -- hostname -I

# Or check network configuration
pct config <ID> | grep ip
```

---

## 📊 Resource Monitoring

### Check Container Resource Usage

```bash
pct enter <ID>
htop
# or
free -h
df -h
```

### Check Docker Containers Resource Usage

```bash
pct exec <ID> -- docker stats
```

---

## 🔄 Update Application

To update the application to the latest version:

```bash
# Enter container
pct enter <ID>

# Go to application directory
cd /opt/shift-handover-log

# Backup
docker compose down
cp -r data data.backup.$(date +%Y%m%d)

# Update code
git pull

# Rebuild and restart
docker compose build --no-cache
docker compose up -d
```

---

## 💾 Backup

### Create Manual Backup

```bash
# Stop application
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose down'

# Backup data directory
pct exec <ID> -- tar -czf /tmp/backup-$(date +%Y%m%d).tar.gz -C /opt/shift-handover-log data

# Copy backup to host
pct pull <ID> /tmp/backup-*.tar.gz /root/backups/

# Restart application
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

### Restore Backup

```bash
# Stop application
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose down'

# Copy backup to container
pct push <ID> /root/backups/backup-YYYYMMDD.tar.gz /tmp/

# Extract backup
pct exec <ID> -- tar -xzf /tmp/backup-YYYYMMDD.tar.gz -C /opt/shift-handover-log

# Restart application
pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose up -d'
```

---

## 📝 Important Notes

1. **Local Storage:** The script always installs on local disk, never on USB
2. **Automatic ID:** The script automatically finds the next available ID (100, 101, 102...)
3. **Automatic IP:** The IP is assigned via DHCP and automatically detected
4. **Non-Interactive Mode:** The script runs everything automatically without asking for confirmations (except initial confirmation)
5. **Templates:** The script automatically downloads the Debian template if not available

---

## 🔒 Security

- ⚠️ Change default password immediately after installation
- ⚠️ Configure firewall if necessary
- ⚠️ Consider using HTTPS in production (reverse proxy)
- ⚠️ Perform regular data backups

---

## 📞 Support

For issues or questions:

1. Check logs: `pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose logs'`
2. Consult documentation in `docs/`
3. Check status: `pct exec <ID> -- bash -c 'cd /opt/shift-handover-log && docker compose ps'`

---

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025