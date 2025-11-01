# Quick Start - Shift Handover Log

## Quick Installation

1. **Install dependencies:**
```bash
npm run install-all
```

2. **Setup database:**
```bash
npm run setup-db
```

3. **Add sample data (optional):**
```bash
npm run seed
```

4. **Start application:**
```bash
npm run dev
```

## Access

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## First Steps

1. Open your browser at `http://localhost:3000`
2. Click "Create New Log"
3. Fill in the form:
   - Date will be auto-filled
   - Short description (max 50 characters)
   - Detailed note (max 1000 characters)
   - Worker code (3 letters, e.g.: "ABC")
4. Click "Save"

## Main Features

- ✅ **Create Log:** "Create New Log" button
- ✅ **Edit:** Click "Edit" on any entry
- ✅ **Archive:** Click "Archive" (appears in gray)
- ✅ **Delete:** Click "Delete" (confirmation required)
- ✅ **Search:** Use the search bar at the top
- ✅ **Filter:** Use filters by date, worker, etc.

## File Structure

```
Handover/
├── server/          # Backend Node.js/Express
├── client/          # Frontend React
├── data/            # SQLite database (created automatically)
└── README.md        # Complete documentation
```

## Common Problems

### Port already in use
If port 5000 is occupied, change it in the `.env` file:
```
PORT=5001
```

### Error installing dependencies
- Make sure you have Node.js 14+ installed
- Try `npm cache clean --force` and then `npm install`

### Frontend doesn't load
- Check if server is running (port 5000)
- Check terminal logs for errors

## Support

See `README.md` for complete documentation.
