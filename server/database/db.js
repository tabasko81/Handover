const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/shift_logs.db');
const DB_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

function initialize() {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    database.serialize(() => {
      database.run(`
        CREATE TABLE IF NOT EXISTS shift_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          short_description VARCHAR(50) NOT NULL,
          note TEXT NOT NULL,
          worker_name VARCHAR(3) NOT NULL,
          color VARCHAR(20) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_archived BOOLEAN DEFAULT 0,
          is_deleted BOOLEAN DEFAULT 0
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          console.log('Database table initialized');
          
          // Add color column if it doesn't exist (for existing databases)
          database.run(`
            ALTER TABLE shift_logs ADD COLUMN color VARCHAR(20) DEFAULT NULL
          `, (alterErr) => {
            // Ignore error if column already exists
            if (alterErr && !alterErr.message.includes('duplicate column')) {
              console.log('Note: color column may already exist');
            }
          });
          
          // Create indexes
          database.run('CREATE INDEX IF NOT EXISTS idx_log_date ON shift_logs(log_date)', (err) => {
            if (err) console.error('Error creating date index:', err);
          });
          
          database.run('CREATE INDEX IF NOT EXISTS idx_worker_name ON shift_logs(worker_name)', (err) => {
            if (err) console.error('Error creating worker index:', err);
          });
          
          database.run('CREATE INDEX IF NOT EXISTS idx_archived ON shift_logs(is_archived)', (err) => {
            if (err) console.error('Error creating archive index:', err);
          });
          
          // Create users table
          database.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username VARCHAR(50) NOT NULL UNIQUE,
              email VARCHAR(255) DEFAULT NULL,
              password_hash VARCHAR(255) NOT NULL,
              is_admin BOOLEAN DEFAULT 0,
              display_order INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating users table:', err.message);
              reject(err);
            } else {
              console.log('Users table initialized');
              
              // Add display_order column if it doesn't exist (for existing databases)
              database.run(`
                ALTER TABLE users ADD COLUMN display_order INTEGER DEFAULT 0
              `, (alterErr) => {
                // Ignore error if column already exists
                if (alterErr && !alterErr.message.includes('duplicate column')) {
                  console.log('Note: display_order column may already exist');
                }
                
                // Initialize display_order for existing users
                database.run(`
                  UPDATE users SET display_order = id WHERE display_order = 0 OR display_order IS NULL
                `, (updateErr) => {
                  if (updateErr) console.error('Error initializing display_order:', updateErr);
                });
              });
              
              // Create indexes for users
              database.run('CREATE INDEX IF NOT EXISTS idx_username ON users(username)', (err) => {
                if (err) console.error('Error creating username index:', err);
              });
              
              database.run('CREATE INDEX IF NOT EXISTS idx_is_admin ON users(is_admin)', (err) => {
                if (err) console.error('Error creating admin index:', err);
              });
              
              database.run('CREATE INDEX IF NOT EXISTS idx_display_order ON users(display_order)', (err) => {
                if (err) console.error('Error creating display_order index:', err);
              });
              
              resolve();
            }
          });
        }
      });
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDb,
  initialize,
  close
};

