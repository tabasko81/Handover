# What is the Backend For?

## Understanding Frontend vs Backend

Your application has **two parts** working together:

### 🎨 **Frontend (Client)** - What You See
- **Location:** `client/` folder
- **Technology:** React.js
- **What it does:**
  - Displays the user interface (forms, buttons, tables)
  - Shows the data to users
  - Handles user interactions (clicks, typing, etc.)
  - Runs in the **browser**

### ⚙️ **Backend (Server)** - Behind the Scenes
- **Location:** `server/` folder  
- **Technology:** Node.js + Express.js
- **What it does:**
  - **Stores data** in the database (SQLite)
  - **Processes requests** from the frontend
  - **Validates** data before saving
  - **Provides API** endpoints for the frontend to use
  - Runs on your **computer/server** (not in browser)

## Why Do We Need Both?

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

## What the Backend Does in This Project

### 1. **Stores Log Entries**
```
Frontend: User clicks "Save"
    ↓
Backend: Saves to database
    ↓
Frontend: Shows "Saved successfully!"
```

### 2. **Retrieves Log Entries**
```
Frontend: User opens page
    ↓
Backend: Gets logs from database
    ↓
Frontend: Displays logs in table
```

### 3. **Validates Data**
```
Frontend: User types invalid data
    ↓
Backend: Checks if data is correct
    ↓
Backend: Returns error if invalid
    ↓
Frontend: Shows error message
```

### 4. **Searches and Filters**
```
Frontend: User searches "room 305"
    ↓
Backend: Searches database
    ↓
Backend: Returns matching results
    ↓
Frontend: Shows filtered results
```

## The Flow: How They Work Together

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

### Example: Creating a Log Entry

1. **User fills form** (Frontend - React)
2. **User clicks "Save"** (Frontend)
3. **Frontend sends POST request** to `http://localhost:5000/api/logs`
4. **Backend receives request** (Express server)
5. **Backend validates data** (validation.js)
6. **Backend saves to database** (SQLite)
7. **Backend sends response** back to frontend
8. **Frontend shows success message** to user

## Why Can't We Just Use Frontend?

❌ **Frontend can't:**
- Store data permanently (browser closes = data lost)
- Access databases directly
- Keep data safe from users tampering with it
- Handle complex business logic

✅ **Backend provides:**
- Permanent storage (database)
- Security (validation, sanitization)
- Data integrity (ensures data is correct)
- Separation of concerns (frontend just displays, backend handles logic)

## In Simple Terms

- **Frontend** = The pretty face you see
- **Backend** = The brain that does the work and remembers everything

Both are **essential** and work together to create a complete application!

## Current Issue: "Cannot GET /"

This happens because:
- You accessed `http://localhost:5000/` (root)
- The backend only has routes like `/api/logs` and `/api/health`
- There was no route for `/` (the root)

**I just added a route for `/`** so now when you visit `http://localhost:5000/`, you'll see API information instead of an error!

## Testing the Backend

Now you can test:

1. **Root:** `http://localhost:5000/`
2. **Health check:** `http://localhost:5000/api/health`
3. **Get logs:** `http://localhost:5000/api/logs`
4. **Search:** `http://localhost:5000/api/logs/search?query=room`

