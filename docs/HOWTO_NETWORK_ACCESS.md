# Network Access Guide - Shift Handover Log

Complete guide to accessing the Shift Handover Log application from other devices on the same network.

---

## 📋 Prerequisites

1. All devices must be on the **same Wi-Fi/Ethernet network**
2. Know the **local IP address** of the machine where the server is running
3. Firewall configured to allow connections on necessary ports (3000 and 5000)

---

## 🔍 Method 1: Local Access (Without Docker) - Development

### Step 1: Find Your Local IP

**Windows:**
```bash
ipconfig
```

Look for "IPv4 Address" in your network adapter section (Wi-Fi or Ethernet).  
Example: `192.168.1.100`

### Step 2: Start Server with Network Access

By default, the React development server only accepts connections from `localhost`. To allow network access, you need to start it with `--host 0.0.0.0`.

**Option A: Modify script in package.json**

Edit `client/package.json`:
```json
{
  "scripts": {
    "start": "react-scripts start --host 0.0.0.0"
  }
}
```

**Option B: Use environment variable**

In Windows PowerShell:
```powershell
$env:HOST='0.0.0.0'; cd client; npm start
```

In Windows CMD:
```cmd
set HOST=0.0.0.0 && cd client && npm start
```

### Step 3: Configure Backend to Accept Network Connections

The Express backend also needs to accept connections from other devices.

Edit `server/index.js` (if needed, check the configuration):
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

Or use environment variable:
```bash
# Windows PowerShell
$env:HOST='0.0.0.0'; npm run server
```

### Step 4: Configure Frontend Proxy

If the backend is running on another device or IP, update `client/package.json`:
```json
{
  "proxy": "http://YOUR_LOCAL_IP:5000"
}
```

Example: `"proxy": "http://192.168.1.100:5000"`

### Step 5: Configure Firewall

**Windows:**

1. Open "Windows Defender Firewall"
2. Click "Advanced settings"
3. Select "Inbound Rules" → "New Rule"
4. Choose "Port" → TCP → Specific ports: `3000, 5000`
5. Allow the connection
6. Repeat for "Outbound Rules" if necessary

**Quick alternative (PowerShell as Administrator):**
```powershell
New-NetFirewallRule -DisplayName "Shift Handover Dev" -Direction Inbound -LocalPort 3000,5000 -Protocol TCP -Action Allow
```

### Step 6: Access from Another Device

In the browser on the other device, navigate to:
```
http://YOUR_LOCAL_IP:3000
```

Example: `http://192.168.1.100:3000`

**Note:** If the backend is on another device, make sure the frontend is configured to use the correct backend IP.

---

## 🐳 Method 2: Access with Docker

### Step 1: Find Docker Host IP

**Windows:**
```bash
ipconfig
```

**Docker Desktop (Windows):**
The host IP is usually the same as the local machine IP.

### Step 2: Configure Docker Compose to Accept Network Connections

Edit `docker-compose.yml`:

**For production:**
```yaml
services:
  backend:
    ports:
      - "0.0.0.0:5000:5000"  # Already accepts all interfaces by default
    # ... rest of configuration

  frontend:
    ports:
      - "0.0.0.0:3000:80"     # Container port 80 mapped to host port 3000
    # ... rest of configuration
```

**Note:** `0.0.0.0` is already the default behavior, but you can specify it explicitly.

### Step 3: Configure Environment Variables for API

If mobile devices need to access the backend, the frontend needs to know the host IP.

**Option A: Configure in build (production)**

Edit `docker-compose.yml`:
```yaml
frontend:
  build:
    args:
      - REACT_APP_API_URL=http://YOUR_LOCAL_IP:5000/api
  environment:
    - REACT_APP_API_URL=http://YOUR_LOCAL_IP:5000/api
```

Example: `REACT_APP_API_URL=http://192.168.1.100:5000/api`

**Option B: Use runtime environment variable**

Create a `.env` file in the project root:
```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

Then rebuild:
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Step 4: Configure Firewall (same as Method 1)

Make sure ports are open:
- **3000** (frontend)
- **5000** (backend)

Follow the instructions from Step 5 of Method 1.

### Step 5: Start Containers

```bash
# Production
docker-compose up -d
```

Check if they're running:
```bash
docker-compose ps
```

### Step 6: Access from Another Device

**Production:**
```
http://YOUR_LOCAL_IP:3000
```

**Backend API directly (for testing):**
```
http://YOUR_LOCAL_IP:5000/api/health
```

---

## ✅ Verification and Troubleshooting

### 1. Verify Services Are Accessible

On the server device, test locally:
```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:5000/api/health
```

### 2. Test from Another Device

On the other device, open a browser and navigate to:
```
http://SERVER_IP:3000
```

If it doesn't work:

**Check:**
- ✅ Both devices are on the same network
- ✅ Firewall allows connections on ports 3000 and 5000
- ✅ Server is running and listening on `0.0.0.0` (not just `localhost`)
- ✅ Local IP is correct
- ✅ No router/firewall is blocking connections

### 3. Test Network Connectivity

**Ping from client device to server:**
```bash
# Windows
ping 192.168.1.100
```

**Test specific port (Windows PowerShell):**
```powershell
Test-NetConnection -ComputerName 192.168.1.100 -Port 3000
```

### 4. Check Logs

**Docker:**
```bash
docker-compose logs frontend
docker-compose logs backend
```

**Local (without Docker):**
Check the terminals where services are running.

### 5. Common Problems

**Error: "Cannot connect to server"**

- Verify server is listening on `0.0.0.0` and not just `localhost`
- Check firewall
- Verify you're on the same network

**Error: "Network Error" or "Failed to fetch"**

- Verify `REACT_APP_API_URL` is configured with the correct IP
- In local development, check the proxy in `package.json`
- Verify CORS on backend (should allow all origins or at least the client origin)

**Frontend loads but can't access API:**

- Verify backend is accessible at `http://SERVER_IP:5000/api/health`
- Verify `REACT_APP_API_URL` is correct
- In development, verify proxy is configured

---

## 📝 Complete Example: Local Network Configuration

### Scenario: Server on IP `192.168.1.100`

**1. docker-compose.yml (Production):**
```yaml
services:
  backend:
    ports:
      - "0.0.0.0:5000:5000"
    environment:
      - FRONTEND_URL=http://192.168.1.100:3000

  frontend:
    build:
      args:
        - REACT_APP_API_URL=http://192.168.1.100:5000/api
    ports:
      - "0.0.0.0:3000:80"
    environment:
      - REACT_APP_API_URL=http://192.168.1.100:5000/api
```

**2. Access:**
- Desktop/Tablet: `http://192.168.1.100:3000`
- Smartphone: `http://192.168.1.100:3000`

**3. Firewall:**
```bash
# Windows (PowerShell as Admin)
New-NetFirewallRule -DisplayName "Shift Handover" -Direction Inbound -LocalPort 3000,5000 -Protocol TCP -Action Allow
```

---

## 🔧 Docker DNS Issues Troubleshooting

### Problem: Failed to resolve Docker image metadata

If you encounter errors like:
```
failed to resolve source metadata for docker.io/library/node:18-alpine3.20
failed to copy: httpReadSeeker: failed open: ... no such host
```

**Solutions:**

1. **Check Internet Connection**
   - Verify your internet is working
   - Try accessing https://hub.docker.com in a browser

2. **Check Docker DNS Settings**
   - Open Docker Desktop → Settings → Docker Engine
   - Add DNS configuration:
   ```json
   {
     "dns": ["8.8.8.8", "8.8.4.4"]
   }
   ```
   - Click "Apply & Restart"

3. **Use Alternative Base Images**
   - If specific versions fail, try using more standard tags:
   - Change `node:18-alpine3.20` to `node:18-alpine` or `node:18`
   - Change `nginx:alpine3.20` to `nginx:alpine` or `nginx:latest`

4. **Clear Docker Cache and Retry**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

5. **Use Docker Hub Mirror (if available)**
   - Configure Docker to use a mirror registry in your region

6. **Check Corporate Firewall/Proxy**
   - If behind a corporate firewall, configure Docker proxy settings
   - Docker Desktop → Settings → Resources → Proxies

---

## 🔒 Security Considerations

⚠️ **Important:** This guide assumes access on a trusted local network. For external access (Internet), consider:

1. **HTTPS/SSL:** Configure SSL certificate
2. **Authentication:** Enable login in backoffice (already enabled by default)
3. **Firewall:** Restrict access to only necessary IPs
4. **VPN:** Use VPN for secure remote access
5. **Reverse Proxy:** Use Nginx or Traefik with SSL
6. **Strong Passwords:** Change default passwords immediately
7. **Regular Updates:** Keep application and dependencies updated

---

## 📋 Quick Summary

### Local (Without Docker):

1. Find local IP: `ipconfig` (Windows)
2. Start frontend: `HOST=0.0.0.0 npm start` (in `client` directory)
3. Start backend: `HOST=0.0.0.0 npm run server`
4. Configure firewall: Allow ports 3000 and 5000
5. Access: `http://YOUR_IP:3000` from other devices

### Docker:

1. Find local IP: `ipconfig` (Windows)
2. Configure `REACT_APP_API_URL` in docker-compose with local IP
3. Start: `docker-compose up -d` or `docker-start.bat`
4. Configure firewall: Allow ports 3000 and 5000
5. Access: `http://YOUR_IP:3000` from other devices

---

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025
