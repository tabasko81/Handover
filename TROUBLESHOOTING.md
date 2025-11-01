# Troubleshooting Guide - Backend Access Issues

## Common Issues and Solutions

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

## Step-by-Step Debugging

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

## Common Error Messages

### "Cannot GET /"
- Server is running but route doesn't exist
- Check route paths in `server/routes/logs.js`

### "ECONNREFUSED"
- Server is not running
- Port is blocked
- Wrong port number

### "CORS policy"
- CORS not configured correctly
- Check CORS settings in `server/index.js`

### "Failed to initialize database"
- Database file permissions issue
- SQLite3 not installed properly
- Run `npm run setup-db` again

## Getting Help

If issues persist:
1. Check all console/terminal output
2. Verify Node.js version: `node -v` (should be 14+)
3. Verify npm version: `npm -v`
4. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules
   npm install
   ```

