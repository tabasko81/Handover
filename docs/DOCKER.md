# Docker Guide - Shift Handover Log

Complete guide to running Shift Handover Log using Docker.

---

## 📋 Prerequisites

- Docker Desktop or Docker Engine 20.10+
- Docker Compose 2.0+
- At least 4 GB of RAM (8 GB recommended)

---

## 🚀 Quick Start

### Windows

Run `docker-start.bat` - This is the easiest method for Windows users.

### Manual Docker Command

```bash
docker-compose up -d --build
```

---

## 🏗️ Architecture

The project includes the following Docker components:

- **`Dockerfile.backend`** - Node.js server image
- **`Dockerfile.frontend`** - Multi-stage React build + Nginx
- **`docker-compose.yml`** - Production configuration
- **`nginx.conf`** - Nginx configuration for frontend

---

## 🔧 How It Works

### Backend Container

- Runs Node.js server on port 5000
- Automatically initializes SQLite database on first run
- Stores data in `./data` volume
- Health check endpoint: `/api/health`
- Logs stored in `./logs` volume

### Frontend Container

- Built React app served by Nginx
- Proxy configuration routes `/api` requests to backend
- Accessible on port 3000
- Optimized production build

---

## 💾 Volumes

Persistent data stored in host directories:

- **`./data`** - Database and config files
- **`./logs`** - Application log files

**Important:** These directories persist data between container restarts.

---

## 🔌 Ports

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api

To change ports, edit `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port to 3001
  - "5001:5000"  # Change host port to 5001
```

---

## 📝 Common Commands

### Windows Batch Scripts (Easiest)

```batch
# Start containers (regular use)
docker-start.bat

# Stop containers
docker-stop.bat

# Restart containers
docker-restart.bat

# View logs
docker-logs.bat

# View status
docker-status.bat
```

### Command Line

```bash
# Start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend

# Stop containers
docker-compose down

# Rebuild without cache
docker-compose build --no-cache

# View running containers
docker-compose ps

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh
```

---

## 🔍 Troubleshooting

### Docker not running (Windows)

**Error:** `unable to get image... The system cannot find the file specified`

**Solution:**

1. Open Docker Desktop
2. Wait until whale icon is stable
3. Run `check-docker.bat` or `docker info` to verify
4. Try `docker-start.bat` again

### Port already in use

**Windows - check ports:**
```bash
netstat -an | findstr "3000"
netstat -an | findstr "5000"
```

**Check which process is using the port:**
```bash
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"
```

**Solution:** Change ports in `docker-compose.yml` if needed

### Database not initializing

```bash
# Check backend logs
docker-compose logs backend

# Manually initialize (if needed)
docker-compose exec backend node /app/server/database/setup.js
```

### Frontend can't connect to backend

**Check:**

1. Backend is running: `docker-compose ps`
2. Backend logs: `docker-compose logs backend`
3. Verify API URL in browser console
4. Backend should be accessible at http://localhost:5000/api/health

### Rebuild everything

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Warning:** `-v` removes volumes - backup `./data` first!

---

## ⚙️ Environment Variables

Configure in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=5000
  - FRONTEND_URL=http://localhost:3000
  - JWT_SECRET=your-secret-key-here
```

For frontend API URL, modify build args:

```yaml
build:
  args:
    - REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚢 Production Deployment

### Security Checklist

1. ✅ Update `FRONTEND_URL` and `REACT_APP_API_URL` to your domain
2. ✅ Set strong `JWT_SECRET` environment variable
3. ✅ Use secrets for sensitive data (don't put in docker-compose.yml)
4. ✅ Enable firewall rules
5. ✅ Consider using HTTPS (reverse proxy like Traefik or Nginx)
6. ✅ Set up regular backups of `./data` directory
7. ✅ Configure proper CORS settings for production

### Using Reverse Proxy (Nginx/Traefik)

For production, use a reverse proxy with SSL:

```yaml
# Example with Traefik labels
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.handover.rule=Host(`handover.example.com`)"
  - "traefik.http.routers.handover.tls.certresolver=letsencrypt"
```

---

## 💾 Backups

### Backup Database

```bash
# From container
docker-compose exec backend cp /app/data/shift_logs.db /app/data/backup_$(date +%Y%m%d).db

# From host (Windows)
copy data\shift_logs.db backups\shift_logs_%date:~-4,4%%date:~-7,2%%date:~-10,2%.db
```

### Restore Database

```bash
# Stop containers
docker-compose down

# Replace database file
cp backups/shift_logs_YYYYMMDD.db data/shift_logs.db

# Start containers
docker-compose up -d
```

---

## 🔄 Updates

### Updating the Application

1. Stop containers: `docker-compose down`
2. Pull latest code: `git pull` (if using Git)
3. Rebuild: `docker-compose build --no-cache`
4. Start: `docker-compose up -d`

**Note:** Your data in `./data` will be preserved.

---

## 📊 Monitoring

### Check Container Status

```bash
docker-compose ps
```

### View Resource Usage

```bash
docker stats
```

### Health Checks

Backend health endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## 🐛 Debugging

### View All Logs

```bash
docker-compose logs -f
```

### View Specific Service Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Export Logs to File

```bash
docker-compose logs > docker-logs.txt
```

---

## 📚 Additional Resources

- **[Windows Installation Guide](INSTALL_GUIDE_WINDOWS.md)** - Step-by-step for non-technical users
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Network Access Guide](HOWTO_NETWORK_ACCESS.md)** - Configure network access

---

**Version:** Alpha v0.25.12-Alpha.7
