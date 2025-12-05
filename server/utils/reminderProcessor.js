const { getDb } = require('../database/db');

/**
 * Process reminders that have expired
 * Activates logs whose reminder_date has passed
 */
function processReminders() {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Find all logs with reminder_date in the past that are still archived
    // Use SQLite's datetime('now') for timezone consistency
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    db.all(
      `SELECT id, reminder_date FROM shift_logs 
       WHERE reminder_date IS NOT NULL 
       AND datetime(reminder_date) <= datetime('now') 
       AND is_deleted = 0`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error processing reminders:', err);
          return reject(err);
        }
        
        if (rows.length === 0) {
          return resolve({ processed: 0 });
        }
        
        // Activate all logs whose reminders have expired
        const ids = rows.map(row => row.id);
        const placeholders = ids.map(() => '?').join(',');
        
        db.run(
          `UPDATE shift_logs 
           SET reminder_date = NULL, is_archived = 0, updated_at = CURRENT_TIMESTAMP 
           WHERE id IN (${placeholders})`,
          ids,
          function(updateErr) {
            if (updateErr) {
              console.error('Error activating reminders:', updateErr);
              return reject(updateErr);
            }
            
            console.log(`Processed ${this.changes} reminder(s) - activated logs`);
            resolve({ processed: this.changes });
          }
        );
      }
    );
  });
}

/**
 * Start the reminder processor
 * Checks for expired reminders every 5 minutes
 */
function startReminderProcessor() {
  console.log('Reminder processor started - checking every 2 minutes');
  
  // Process immediately on start
  processReminders().catch(err => {
    console.error('Error in initial reminder processing:', err);
  });
  
  // Then process every 2 minutes (more frequent for better responsiveness)
  const interval = setInterval(() => {
    processReminders().catch(err => {
      console.error('Error in scheduled reminder processing:', err);
    });
  }, 2 * 60 * 1000); // 2 minutes
  
  // Return function to stop the processor
  return () => {
    clearInterval(interval);
    console.log('Reminder processor stopped');
  };
}

module.exports = {
  processReminders,
  startReminderProcessor
};

