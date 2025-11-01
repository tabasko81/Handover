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
          
          resolve();
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

