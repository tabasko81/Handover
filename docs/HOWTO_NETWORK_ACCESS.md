# Network Access Guide - Shift Handover Log

Complete guide to accessing the Shift Handover Log application from other devices on the same network.

---

## 📋 Prerequisites

1. All devices must be on the **same Wi-Fi/Ethernet network**
2. Know the **local IP address** of the machine where the server is running
3. Firewall configured to allow connections on port 8500

---

## 🔍 Local Server Access

### Step 1: Find Your Local IP

**Windows:**
```bash
ipconfig
```

Look for "IPv4 Address" in your network adapter section (Wi-Fi or Ethernet).  
Example: `192.168.1.100`

### Step 2: Start Server with Network Access

The server needs to listen on all network interfaces (`0.0.0.0`) to accept connections from other devices.

**For Standalone Installation:**
- The server already listens on `0.0.0.0` by default
- No configuration needed

**For Local Development:**
Edit `server/index.js` to ensure it listens on all interfaces:
```javascript
const PORT = process.env.PORT || 8500;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 3: Configure Firewall

**Windows:**

1. Open "Windows Defender Firewall"
2. Click "Advanced settings"
3. Select "Inbound Rules" → "New Rule"
4. Choose "Port" → TCP → Specific ports: `8500`
5. Allow the connection
6. Repeat for "Outbound Rules" if necessary

**Quick alternative (PowerShell as Administrator):**
```powershell
New-NetFirewallRule -DisplayName "Shift Handover" -Direction Inbound -LocalPort 8500 -Protocol TCP -Action Allow
```

### Step 4: Access from Another Device

In the browser on the other device, navigate to:
```
http://YOUR_LOCAL_IP:8500
```

Example: `http://192.168.1.100:8500`

---

## ✅ Verification and Troubleshooting

### 1. Verify Server Is Accessible

On the server device, test locally:
```bash
# Health check
curl http://localhost:8500/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "..."
}
```

### 2. Test from Another Device

On the other device, open a browser and navigate to:
```
http://SERVER_IP:8500
```

If it doesn't work:

**Check:**
- ✅ Both devices are on the same network
- ✅ Firewall allows connections on port 8500
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
Test-NetConnection -ComputerName 192.168.1.100 -Port 8500
```

### 4. Check Logs

Check the terminal or GUI window where the server is running for any error messages.

### 5. Common Problems

**Error: "Cannot connect to server"**

- Verify server is listening on `0.0.0.0` and not just `localhost`
- Check firewall settings
- Verify you're on the same network
- Check if server is actually running

**Error: "Network Error" or "Failed to fetch"**

- Verify server is accessible at `http://SERVER_IP:8500/api/health`
- Check firewall allows port 8500
- Verify CORS on backend (should allow all origins in development)

**Server loads but can't access API:**

- Verify backend is accessible at `http://SERVER_IP:8500/api/health`
- Check browser console (F12) for specific error messages
- Verify network connectivity

---

## 📝 Complete Example: Local Network Configuration

### Scenario: Server on IP `192.168.1.100`

**1. Server Configuration:**
- Server listens on `0.0.0.0:8500` (default)
- Firewall allows port 8500

**2. Access:**
- Desktop/Tablet: `http://192.168.1.100:8500`
- Smartphone: `http://192.168.1.100:8500`

**3. Firewall:**
```bash
# Windows (PowerShell as Admin)
New-NetFirewallRule -DisplayName "Shift Handover" -Direction Inbound -LocalPort 8500 -Protocol TCP -Action Allow
```

---

## 🔒 Security Considerations

⚠️ **Important:** This guide assumes access on a trusted local network. For external access (Internet), consider:

1. **HTTPS/SSL:** Configure SSL certificate
2. **Authentication:** Enable login in backoffice (already enabled by default)
3. **Firewall:** Restrict access to only necessary IPs
4. **VPN:** Use VPN for secure remote access
5. **Reverse Proxy:** Use Nginx or Apache with SSL
6. **Strong Passwords:** Change default passwords immediately
7. **Regular Updates:** Keep application and dependencies updated

---

## 📋 Quick Summary

### Standalone Installation:

1. Find local IP: `ipconfig` (Windows) or use `find-my-ip.bat`
2. Open firewall: Run `open-firewall-port.bat` (as Administrator)
3. Start server: Run `HandoverServer.exe` → Click "Start Server"
4. Access: `http://YOUR_IP:8500` from other devices

### Local Development:

1. Find local IP: `ipconfig` (Windows)
2. Ensure server listens on `0.0.0.0:8500`
3. Configure firewall: Allow port 8500
4. Start server: `npm run server` or `start.bat`
5. Access: `http://YOUR_IP:8500` from other devices

---

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025
