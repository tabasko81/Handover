# Troubleshooting Guide - Shift Handover Log

Comprehensive troubleshooting guide for common issues and solutions.

---

## 🔍 Backend Access Issues

### Backend Not Accessible

#### 1. Check if the server is running

```bash
# Check if Node.js server is running
npm run server
```

You should see:
```
Server running on port 5000
API available at http://localhost:5000/api
```

#### 2. Test the backend directly

Open your browser or use curl:
```
http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2025-01-XX..."
}
```

#### 3. Check if port 5000 is available

**Windows:**
```bash
netstat -ano | findstr :5000
```

**If port is in use:**

- Change PORT in `.env` file:
```
PORT=5001
```

- Update `client/package.json` proxy:
```json
"proxy": "http://localhost:5001"
```

#### 4. Database initialization issues

Make sure the database is initialized:
```bash
npm run setup-db
```

Check if `data/shift_logs.db` exists.

#### 5. CORS issues

If you see CORS errors in the browser console, the server should allow all origins in development. Check `server/index.js`:

```javascript
app.use(cors({
  origin: '*', // Allow all origins in development
  credentials: true
}));
```

#### 6. Frontend proxy configuration

In development, React uses a proxy. Check `client/package.json`:
```json
"proxy": "http://localhost:5000"
```

**Important:** After changing proxy, restart the React dev server.

#### 7. Environment variables

Create a `.env` file in the root directory:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
```

#### 8. Check console for errors

- **Backend:** Look for errors in the terminal where `npm run server` is running
- **Frontend:** Check browser console (F12) for errors

#### 9. Verify database connection

The server should print:
```
Connected to SQLite database
Database table initialized
```

If you see errors, check:

- Permissions on `data/` directory
- SQLite3 package is installed: `npm list sqlite3`

#### 10. Network/firewall issues

- Check Windows Firewall isn't blocking Node.js
- Try accessing `http://127.0.0.1:5000/api/health` instead of `localhost`

---

## 🐳 Docker Issues

### Docker not starting

**Symptoms:**
- "Docker daemon is not running"
- "Cannot connect to Docker daemon"

**Solutions:**

1. Ensure Docker Desktop is running
2. Wait for Docker to fully start (whale icon stable)
3. Restart Docker Desktop if needed
4. Check Docker Desktop logs

### Port conflicts

**Symptoms:**
- "Port already in use"
- Containers fail to start

**Solutions:**

1. Check which process is using the port:
```bash
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"
```

2. Stop conflicting services
3. Change ports in `docker-compose.yml` if needed

### Build failures

**Symptoms:**
- "Build failed"
- "Failed to resolve image"

**Solutions:**

1. Check Docker DNS settings (see [HOWTO_NETWORK_ACCESS.md](HOWTO_NETWORK_ACCESS.md))
2. Clear Docker cache:
```bash
docker system prune -a
```

3. Rebuild without cache:
```bash
docker-compose build --no-cache
```

### Container health check failures

**Symptoms:**
- Containers restart repeatedly
- Health check timeouts

**Solutions:**

1. Wait longer (health checks can take up to 40 seconds)
2. Check backend logs: `docker-compose logs backend`
3. Verify backend is responding: `curl http://localhost:5000/api/health`

---

## 🌐 Frontend Issues

### Frontend not loading

**Symptoms:**
- Blank page
- "Cannot GET /"
- Connection refused

**Solutions:**

1. Verify backend is running
2. Check browser console (F12) for errors
3. Verify proxy configuration in `client/package.json`
4. Try refreshing the page (Ctrl+F5 for hard refresh)
5. Clear browser cache

### Search not working

**Symptoms:**
- Search returns no results
- Search doesn't respond

**Solutions:**

1. Check browser console for JavaScript errors
2. Verify backend is accessible
3. Try clearing search and searching again
4. Check network tab in browser DevTools

### Styles not loading

**Symptoms:**
- Page looks broken
- No colors or formatting

**Solutions:**

1. Hard refresh (Ctrl+F5)
2. Clear browser cache
3. Check browser console for CSS errors
4. Verify all assets are loading

---

## 🔐 Authentication Issues

### Can't login

**Symptoms:**
- "Login failed"
- "Invalid credentials"

**Solutions:**

1. Verify username and password (case-sensitive)
2. Check if you're blocked (too many failed attempts - wait 2 minutes)
3. Verify login expiry settings in Admin
4. Ask administrator to reset password
5. Check backend logs for authentication errors

### Session expired unexpectedly

**Symptoms:**
- Logged out suddenly
- "Token expired" errors

**Solutions:**

1. Check login expiry settings in Admin
2. If expiry is enabled, sessions expire after set hours
3. Login again with your credentials
4. Consider disabling login expiry if not needed

### Too many failed attempts

**Symptoms:**
- "Too many failed login attempts"
- Blocked from logging in

**Solutions:**

1. Wait 2 minutes (block duration)
2. Countdown timer shows remaining seconds
3. Try again after block expires
4. Verify credentials before attempting

---

## 💾 Database Issues

### Database errors

**Symptoms:**
- "Failed to initialize database"
- "Database locked"
- Data not saving

**Solutions:**

1. Check file permissions on `data/` directory
2. Ensure database file isn't locked by another process
3. Verify SQLite3 is installed: `npm list sqlite3`
4. Try recreating database: `npm run setup-db`
5. Check disk space

### Data not persisting

**Symptoms:**
- Data disappears after restart
- Changes not saved

**Solutions:**

1. Verify `data/` directory is mounted correctly (Docker)
2. Check file permissions
3. Verify database file exists: `data/shift_logs.db`
4. Check backend logs for save errors

---

## 🔧 Step-by-Step Debugging

### Complete Debugging Process

1. **Start backend only:**
   ```bash
   npm run server
   ```

2. **Test in browser:**
   Open: `http://localhost:5000/api/health`

3. **Test with curl (if available):**
   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Check logs:**
   Look for any error messages in the terminal

5. **Verify routes:**
   Try: `http://localhost:5000/api/logs`

6. **Check frontend:**
   Open browser console (F12) and check for errors

7. **Verify network:**
   Check Network tab in browser DevTools

---

## 📋 Common Error Messages

### "Cannot GET /"

- Server is running but route doesn't exist
- Check route paths in `server/routes/`
- Verify API endpoints are correct

### "ECONNREFUSED"

- Server is not running
- Port is blocked
- Wrong port number
- Firewall blocking connection

### "CORS policy"

- CORS not configured correctly
- Check CORS settings in `server/index.js`
- Verify frontend URL is allowed

### "Failed to initialize database"

- Database file permissions issue
- SQLite3 not installed properly
- Run `npm run setup-db` again
- Check `data/` directory exists and is writable

### "Token expired"

- Login session expired (if expiry enabled)
- Login again with credentials
- Check login expiry settings in Admin

### "Invalid token"

- Token is corrupted or invalid
- Clear browser localStorage
- Login again

---

## 🆘 Getting Help

If issues persist:

1. **Check all console/terminal output**
   - Backend terminal
   - Frontend terminal (if running separately)
   - Browser console (F12)

2. **Verify versions:**
   - Node.js version: `node -v` (should be 14+)
   - npm version: `npm -v`
   - Docker version: `docker --version`

3. **Try clean reinstall:**
   ```bash
   # Remove node_modules
   rm -rf node_modules
   rm -rf client/node_modules
   
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall
   npm install
   cd client && npm install
   ```

4. **Check system resources:**
   - Available disk space
   - Available RAM
   - CPU usage

5. **Review documentation:**
   - [User Manual](USER_MANUAL.md)
   - [Docker Guide](DOCKER.md)
   - [Network Access Guide](HOWTO_NETWORK_ACCESS.md)

---

## 📞 Additional Resources

- **GitHub Issues:** Check for similar issues on the project repository
- **Browser Console:** Always check F12 for detailed error messages
- **Docker Logs:** `docker-compose logs` for container-specific issues
- **System Logs:** Check Windows Event Viewer for system-level errors

---

**Version:** Alpha v0.25.11-alpha.6  
**Last Updated:** 2025
