# Shift Handover Log Web Application

Web application for shift handover logging in hotel operations. Allows staff to document and communicate important information between shifts in a structured and accessible format.

## Features

- ✅ Create, edit, archive and delete log entries
- ✅ Search and filters (by date, worker, keywords)
- ✅ Responsive interface (desktop, tablet, mobile)
- ✅ Paginated log viewing
- ✅ Archived logs management
- ✅ Client and server-side data validation
- ✅ No authentication required (open access)

## Technology Stack

### Backend
- Node.js with Express.js
- SQLite (can be easily migrated to MySQL/PostgreSQL)
- RESTful API

### Frontend
- React.js
- Tailwind CSS
- Axios for API calls

## Prerequisites

- Node.js 14+ and npm
- Git (optional)

## Installation

1. **Clone or download the repository**

```bash
cd Handover
```

2. **Install dependencies**

```bash
npm run install-all
```

This command installs dependencies for both backend and frontend.

3. **Configure environment variables**

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
```

4. **Initialize the database**

```bash
npm run setup-db
```

The SQLite database will be created automatically in `data/shift_logs.db`.

## Running

### Development Mode

To run both server and client simultaneously:

```bash
npm run dev
```

Or run separately:

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

Backend will be available at `http://localhost:5000`
Frontend will be available at `http://localhost:3000`

### Production Mode

1. **Build the frontend:**
```bash
npm run build
```

2. **Run the server:**
```bash
NODE_ENV=production npm run server
```

## Project Structure

```
Handover/
├── server/
│   ├── index.js              # Main Express server
│   ├── database/
│   │   ├── db.js             # Database configuration
│   │   └── setup.js          # Initialization script
│   ├── routes/
│   │   └── logs.js           # API routes
│   └── utils/
│       └── validation.js     # Validation and sanitization
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   ├── App.js            # Main component
│   │   └── index.js          # Entry point
│   └── package.json
├── data/                     # SQLite database (generated)
└── package.json
```

## API Endpoints

### GET /api/logs
Get all log entries (with pagination and filters)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Entries per page (default: 20)
- `archived` (optional): true/false to show archived entries
- `search`: Search term
- `worker_name`: Filter by worker code
- `start_date`: Start date
- `end_date`: End date

### GET /api/logs/:id
Get a specific log entry

### POST /api/logs
Create a new log entry

**Body:**
```json
{
  "log_date": "2025-11-01T14:30:00",
  "short_description": "Room issue",
  "note": "Guest in room 305 reported broken AC. Maintenance notified.",
  "worker_name": "ABC"
}
```

### PUT /api/logs/:id
Update a log entry

### PATCH /api/logs/:id/archive
Archive or restore a log entry

**Body:**
```json
{
  "is_archived": true
}
```

### DELETE /api/logs/:id
Delete a log entry (soft delete)

### GET /api/logs/search
Search logs by term

**Query Parameters:**
- `query`: Search term (required)
- `worker_name`: Filter by worker code
- `start_date`: Start date
- `end_date`: End date

## Database Structure

### Table: shift_logs

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| log_date | DATETIME | Event date and time |
| short_description | VARCHAR(50) | Short description (2 words) |
| note | TEXT | Detailed description (max 1000 chars) |
| worker_name | VARCHAR(3) | 3-letter worker code |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last update |
| is_archived | BOOLEAN | Archive status |
| is_deleted | BOOLEAN | Soft delete flag |

## Features

### Create Log Entry
- Fill in date/time (auto-filled with current date)
- Short description (max 50 characters)
- Detailed note (max 1000 characters)
- Worker code (3 letters)

### Search and Filter
- Real-time search across all descriptions and notes
- Filter by date range
- Filter by worker code
- Toggle to show/hide archived entries

### Edit Log Entry
- Click "Edit" on any entry
- Modify any field
- Save changes

### Archive Log Entry
- Click "Archive" to archive
- Click "Restore" to restore
- Archived logs appear in gray

### Delete Log Entry
- Click "Delete"
- Confirmation required
- Soft delete (does not permanently remove)

## Validation

### Client (Frontend)
- Real-time field validation
- Character counters
- Visible error messages

### Server (Backend)
- Complete validation of all inputs
- Sanitization to prevent XSS
- Character limit verification
- Automatic uppercase conversion for worker code

## Security

- Input sanitization to prevent XSS
- Soft delete to preserve data
- Client and server validation
- CORS configured
- Rate limiting recommended for production

## Current Limitations

- No user authentication
- No edit history
- No PDF/Excel export
- No notifications

## Future Improvements

- User authentication
- Change history
- Log export
- Email notifications
- Attachments (photos, documents)
- Dashboard with statistics
- Multi-language support

## Troubleshooting

### Error starting server
- Check if port 5000 is available
- Verify Node.js is installed (version 14+)
- Run `npm install` again

### Error creating database
- Check write permissions in `data/` folder
- Ensure the `data/` directory exists

### Frontend not connecting to backend
- Check if server is running on port 5000
- Check the `.env` file and proxy configuration in `client/package.json`

## Support

For questions or issues, consult the complete technical documentation or contact the development team.

## License

ISC

## Author

Developed according to the provided technical specifications.
