# Docker Troubleshooting Guide - Shift Handover Log

Quick reference guide for common Docker issues and solutions.

---

## 🚨 Common Problems

### Docker Not Starting

**Symptoms:**
- "Docker daemon is not running"
- "Cannot connect to Docker daemon"
- Whale icon not appearing

**Solutions:**

1. **Verify Docker Desktop is Running**
   - Check system tray for Docker whale icon
   - Icon should be green/stable (not flashing)
   - If missing, start Docker Desktop from Start Menu

2. **Wait for Full Startup**
   - Docker can take 1-2 minutes to fully start
   - Wait until whale icon stops animating
   - Check Docker Desktop window for "Docker Desktop is running"

3. **Restart Docker Desktop**
   - Right-click whale icon → "Quit Docker Desktop"
   - Wait 10 seconds
   - Start Docker Desktop again
   - Wait for full startup

4. **Check System Requirements**
   - Windows 10/11 64-bit
   - WSL 2 enabled (if using WSL 2 backend)
   - Virtualization enabled in BIOS

---

## 🔌 Port Conflicts

### Port Already in Use

**Symptoms:**
- "Port already in use"
- Containers fail to start
- Error binding to port

**Solutions:**

1. **Check Which Process is Using the Port**

   **Windows:**
   ```bash
   netstat -ano | findstr ":3000"
   netstat -ano | findstr ":5000"
   ```

2. **Stop Conflicting Services**
   - Close other applications using ports 3000 or 5000
   - Stop other Docker containers
   - Restart computer if needed

3. **Change Ports in docker-compose.yml**
   ```yaml
   services:
     frontend:
       ports:
         - "3001:80"  # Change host port to 3001
     backend:
       ports:
         - "5001:5000"  # Change host port to 5001
   ```

---

## 🏗️ Build Failures

### Build Failed

**Symptoms:**
- "Build failed"
- "Failed to resolve image"
- Container build errors

**Solutions:**

1. **Check Docker DNS Settings**
   - Open Docker Desktop → Settings → Docker Engine
   - Add DNS: `["8.8.8.8", "8.8.4.4"]`
   - Click "Apply & Restart"

2. **Clear Docker Cache**
   ```bash
   docker system prune -a
   ```

3. **Rebuild Without Cache**
   ```bash
   docker-compose build --no-cache
   ```

4. **Check Internet Connection**
   - Verify internet is working
   - Try accessing https://hub.docker.com

5. **Use Standard Image Tags**
   - Change `node:18-alpine3.20` to `node:18-alpine`
   - Change `nginx:alpine3.20` to `nginx:alpine`

---

## 🏥 Health Check Failures

### Container Health Check Failed

**Symptoms:**
- Containers restart repeatedly
- Health check timeouts
- "Health check failed" errors

**Solutions:**

1. **Wait Longer**
   - Health checks can take up to 40 seconds
   - Give containers time to fully start

2. **Check Backend Logs**
   ```bash
   docker-compose logs backend
   ```

3. **Verify Backend is Responding**
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Check Container Status**
   ```bash
   docker-compose ps
   ```

---

## 🧹 Cleanup Commands

### Remove Stopped Containers

```bash
docker-compose down
docker-compose down --remove-orphans
```

### Complete Cleanup (⚠️ Removes Data)

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

**Warning:** `-v` removes volumes - backup `./data` first!

### Remove Specific Images

```bash
docker image prune -a
```

---

## 📊 Useful Commands

### View Container Status

```bash
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 50 lines
docker-compose logs --tail 50
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Access Container Shell

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh
```

---

## 🔍 Debugging Steps

### Complete Debugging Process

1. **Check Docker Status**
   ```bash
   docker info
   ```

2. **Check Container Status**
   ```bash
   docker-compose ps
   ```

3. **View Logs**
   ```bash
   docker-compose logs
   ```

4. **Test Backend**
   ```bash
   curl http://localhost:5000/api/health
   ```

5. **Test Frontend**
   - Open browser: http://localhost:3000
   - Check browser console (F12)

6. **Check Resources**
   ```bash
   docker stats
   ```

---

## 🐛 Common Errors

### "Cannot connect to Docker daemon"

- Docker Desktop not running
- Solution: Start Docker Desktop and wait

### "Port already in use"

- Another service using the port
- Solution: Stop conflicting service or change port

### "Build failed"

- Network issues or Dockerfile problems
- Solution: Check logs, verify internet, rebuild

### "Out of memory"

- Docker needs more resources
- Solution: Increase Docker Desktop memory in Settings

### "Volume mount failed"

- Permissions issue or path doesn't exist
- Solution: Check folder permissions, create directories

---

## 💡 Prevention Tips

1. **Always wait for Docker to fully start** before running commands
2. **Check ports** before starting containers
3. **Backup data** before major operations
4. **Keep Docker Desktop updated**
5. **Monitor resource usage** with `docker stats`

---

## 📚 Additional Resources

- **[Docker Guide](DOCKER.md)** - Complete Docker documentation
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - General troubleshooting
- **[Windows Installation Guide](INSTALL_GUIDE_WINDOWS.md)** - Step-by-step setup

---

**Version:** Alpha v0.25.12-Alpha.7  
**Last Updated:** 2025
