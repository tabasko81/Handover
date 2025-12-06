# Backend Architecture - Shift Handover Log

Understanding the backend architecture and how it works with the frontend.

---

## 🏗️ Architecture Overview

Your application has **two parts** working together:

### 🎨 Frontend (Client) - What You See

- **Location:** `client/` folder
- **Technology:** React.js
- **What it does:**
  - Displays the user interface (forms, buttons, tables)
  - Shows the data to users
  - Handles user interactions (clicks, typing, etc.)
  - Runs in the **browser**

### ⚙️ Backend (Server) - Behind the Scenes

- **Location:** `server/` folder  
- **Technology:** Node.js + Express.js
- **What it does:**
  - **Stores data** in the database (SQLite)
  - **Processes requests** from the frontend
  - **Validates** data before saving
  - **Provides API** endpoints for the frontend to use
  - Runs on your **computer/server** (not in browser)

---

## 🍽️ Why Do We Need Both?

Think of it like a restaurant:

- **Frontend = Waiter** 🧑‍🍳
  - Takes your order (what you type)
  - Brings you the food (shows you the data)
  - Looks nice and friendly (user interface)

- **Backend = Kitchen** 👨‍🍳
  - Prepares the food (processes data)
  - Stores ingredients (database)
  - Makes sure food is safe (validation)
  - You never see it, but it's essential!

---

## 🔄 What the Backend Does

### 1. Stores Log Entries

```
Frontend: User clicks "Save"
    ↓
Backend: Saves to database
    ↓
Frontend: Shows "Saved successfully!"
```

### 2. Retrieves Log Entries

```
Frontend: User opens page
    ↓
Backend: Gets logs from database
    ↓
Frontend: Displays logs in table
```

### 3. Validates Data

```
Frontend: User types invalid data
    ↓
Backend: Checks if data is correct
    ↓
Backend: Returns error if invalid
    ↓
Frontend: Shows error message
```

### 4. Searches and Filters

```
Frontend: User searches "room 305"
    ↓
Backend: Searches database
    ↓
Backend: Returns matching results
    ↓
Frontend: Shows filtered results
```

### 5. Handles Authentication

```
Frontend: User logs in
    ↓
Backend: Validates credentials
    ↓
Backend: Generates JWT token
    ↓
Frontend: Stores token for future requests
```

---

## 🔀 The Flow: How They Work Together

```
┌─────────────┐         HTTP Request         ┌─────────────┐
│   Browser   │  ───────────────────────────> │   Backend   │
│  (Frontend) │                                │   (Server)  │
└─────────────┘                                └─────────────┘
       │                                                │
       │                                                │
       │         HTTP Response                         │
       │ <───────────────────────────────────────────── │
       │                                                │
       │                                                ▼
       │                                         ┌─────────────┐
       │                                         │  Database   │
       │                                         │  (SQLite)   │
       │                                         └─────────────┘
       │
```

---

## 📝 Example: Creating a Log Entry

1. **User fills form** (Frontend - React)
2. **User clicks "Save"** (Frontend)
3. **Frontend sends POST request** to `http://localhost:8500/api/logs`
4. **Backend receives request** (Express server)
5. **Backend validates data** (validation middleware)
6. **Backend saves to database** (SQLite)
7. **Backend sends response** back to frontend
8. **Frontend shows success message** to user

---

## ❓ Why Can't We Just Use Frontend?

❌ **Frontend can't:**

- Store data permanently (browser closes = data lost)
- Access databases directly
- Keep data safe from users tampering with it
- Handle complex business logic
- Perform server-side validation

✅ **Backend provides:**

- Permanent storage (database)
- Security (validation, sanitization)
- Data integrity (ensures data is correct)
- Separation of concerns (frontend displays, backend handles logic)
- Authentication and authorization
- API endpoints for data access

---

## 🗂️ Backend Structure

```
server/
├── routes/          # API endpoints
│   ├── logs.js      # Log CRUD operations
│   ├── auth.js      # Authentication
│   ├── config.js    # Configuration
│   └── users.js     # User management
├── database/        # Database setup
│   ├── db.js        # Database connection
│   └── seedUsers.js # Default users
├── middleware/      # Request middleware
│   └── auth.js      # Authentication middleware
├── utils/           # Utilities
│   └── configLoader.js # Config management
└── index.js         # Main server file
```

---

## 🔌 API Endpoints

### Logs

- `GET /api/logs` - Get all logs (with filters)
- `POST /api/logs` - Create new log
- `PUT /api/logs/:id` - Update log
- `PATCH /api/logs/:id/archive` - Archive/unarchive log
- `DELETE /api/logs/:id` - Delete log

### Authentication

- `POST /api/auth/login` - Admin login
- `POST /api/auth/user/login` - User login
- `GET /api/auth/verify` - Verify admin token
- `GET /api/auth/user/verify` - Verify user token
- `POST /api/auth/change-password` - Change password

### Configuration

- `GET /api/config` - Get configuration (admin)
- `PUT /api/config` - Update configuration (admin)
- `GET /api/config/public` - Get public configuration

### Users

- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)
- `POST /api/users/:id/move` - Reorder users (admin)
- `POST /api/users/:id/send-password` - Send password email (admin)

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for password security
- **Brute Force Protection** - Rate limiting for login attempts
- **Input Validation** - Server-side validation of all inputs
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Controlled cross-origin requests

---

## 💾 Database

- **Type:** SQLite
- **Location:** `data/shift_logs.db`
- **Tables:**
  - `logs` - Log entries
  - `users` - User accounts
  - Automatic initialization on first run

---

## 🧪 Testing the Backend

You can test the backend directly:

1. **Root:** `http://localhost:8500/`
2. **Health check:** `http://localhost:8500/api/health`
3. **Get logs:** `http://localhost:8500/api/logs`
4. **Search:** `http://localhost:8500/api/logs?search=room`

---

## 📚 In Simple Terms

- **Frontend** = The pretty face you see
- **Backend** = The brain that does the work and remembers everything

Both are **essential** and work together to create a complete application!

---

**Version:** Beta v0.25.12-Beta.1  
**Last Updated:** 2025
