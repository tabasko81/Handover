const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { validateLogEntry, sanitizeInput } = require('../utils/validation');

// Get all logs (with pagination and filters)
router.get('/', (req, res) => {
  const {
    page = 1,
    limit = 20,
    archived = false,
    search,
    worker_name,
    start_date,
    end_date
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const isArchived = archived === 'true' ? 1 : 0;
  
  // If showing archived, include logs with future reminders
  // If showing active, exclude logs with future reminders
  let query;
  const params = [];
  
  if (isArchived === 1) {
    // Show archived logs OR logs with future reminders
    query = `
      SELECT * FROM shift_logs 
      WHERE is_deleted = 0 AND (
        is_archived = 1 OR 
        (reminder_date IS NOT NULL AND reminder_date > datetime('now'))
      )
    `;
  } else {
    // Show only active logs (not archived and no future reminders)
    query = `
    SELECT * FROM shift_logs 
      WHERE is_deleted = 0 AND is_archived = 0 
      AND (reminder_date IS NULL OR reminder_date <= datetime('now'))
  `;
  }

  // Apply filters
  if (worker_name) {
    query += ` AND worker_name = ?`;
    params.push(worker_name.toUpperCase().trim());
  }

  if (start_date) {
    query += ` AND log_date >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND log_date <= ?`;
    params.push(end_date);
  }

  if (search) {
    query += ` AND (
      short_description LIKE ? OR 
      note LIKE ? OR 
      worker_name LIKE ?
    )`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY log_date DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  // Count total entries
  let countQuery;
  const countParams = [];
  
  if (isArchived === 1) {
    // Count archived logs OR logs with future reminders
    countQuery = `
      SELECT COUNT(*) as total FROM shift_logs 
      WHERE is_deleted = 0 AND (
        is_archived = 1 OR 
        (reminder_date IS NOT NULL AND reminder_date > datetime('now'))
      )
    `;
  } else {
    // Count only active logs (not archived and no future reminders)
    countQuery = `
    SELECT COUNT(*) as total FROM shift_logs 
      WHERE is_deleted = 0 AND is_archived = 0 
      AND (reminder_date IS NULL OR reminder_date <= datetime('now'))
  `;
  }

  if (worker_name) {
    countQuery += ` AND worker_name = ?`;
    countParams.push(worker_name.toUpperCase().trim());
  }

  if (start_date) {
    countQuery += ` AND log_date >= ?`;
    countParams.push(start_date);
  }

  if (end_date) {
    countQuery += ` AND log_date <= ?`;
    countParams.push(end_date);
  }

  if (search) {
    countQuery += ` AND (
      short_description LIKE ? OR 
      note LIKE ? OR 
      worker_name LIKE ?
    )`;
    const searchTerm = `%${search}%`;
    countParams.push(searchTerm, searchTerm, searchTerm);
  }

  const database = db.getDb();

  database.all(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('Database count error:', err);
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to count logs',
        details: { error: err.message }
      });
    }

    const total = countResult[0].total;

  database.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch logs',
        details: { error: err.message }
      });
    }

      res.json({
        status: 'success',
        data: rows.map(row => ({
          ...row,
          is_archived: Boolean(row.is_archived),
          is_deleted: Boolean(row.is_deleted),
          reminder_date: row.reminder_date || null
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_entries: total
        }
      });
    });
  });
});

// Get single log entry
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const database = db.getDb();

  database.get('SELECT * FROM shift_logs WHERE id = ? AND is_deleted = 0', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to fetch log',
        details: {}
      });
    }

    if (!row) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Log entry not found',
        details: {}
      });
    }

    res.json({
      status: 'success',
      data: {
        ...row,
        is_archived: Boolean(row.is_archived),
        is_deleted: Boolean(row.is_deleted),
        reminder_date: row.reminder_date || null
      }
    });
  });
});

// Create log entry
router.post('/', (req, res) => {
  const validation = validateLogEntry(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: validation.message,
      details: validation.errors
    });
  }

  const { log_date, short_description, note, worker_name, color, reminder_date } = sanitizeInput(req.body);
  const database = db.getDb();
  
  // If reminder_date is set, automatically archive the log
  const shouldArchive = reminder_date && new Date(reminder_date) > new Date();

    database.run(
    `INSERT INTO shift_logs (log_date, short_description, note, worker_name, color, reminder_date, is_archived) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [log_date, short_description, note, worker_name, color || null, reminder_date || null, shouldArchive ? 1 : 0],
    function(err) {
      if (err) {
        console.error('Database insert error:', err);
        return res.status(500).json({
          status: 'error',
          code: 'DATABASE_ERROR',
          message: 'Failed to create log entry',
          details: { error: err.message }
        });
      }

      database.get('SELECT * FROM shift_logs WHERE id = ?', [this.lastID], (err, row) => {
        if (err || !row) {
          return res.status(500).json({
            status: 'error',
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve created log entry',
            details: {}
          });
        }

        const logEntry = {
          ...row,
          is_archived: Boolean(row.is_archived),
          is_deleted: Boolean(row.is_deleted),
          reminder_date: row.reminder_date || null
        };

        res.status(201).json({
          status: 'success',
          data: logEntry
        });
      });
    }
  );
});

// Update log entry
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const validation = validateLogEntry(req.body, true);
  
  if (!validation.isValid) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: validation.message,
      details: validation.errors
    });
  }

  const { log_date, short_description, note, worker_name, color, reminder_date } = sanitizeInput(req.body);
  const database = db.getDb();
  
  // If reminder_date is set, automatically archive the log
  // If reminder_date is explicitly null/empty, clear it
  const hasReminder = reminder_date !== undefined && reminder_date !== null && reminder_date !== '';
  const shouldArchive = hasReminder && new Date(reminder_date) > new Date();
  const finalReminderDate = hasReminder ? reminder_date : null;

  // First check if entry exists
  database.get('SELECT * FROM shift_logs WHERE id = ? AND is_deleted = 0', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to check log entry',
        details: {}
      });
    }

    if (!row) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Log entry not found',
        details: {}
      });
    }

    // Determine archive status: if reminder is set, archive; otherwise keep current state unless explicitly changed
    const archiveStatus = shouldArchive ? 1 : (row.is_archived ? 1 : 0);

    database.run(
      `UPDATE shift_logs 
       SET log_date = ?, short_description = ?, note = ?, worker_name = ?, color = ?, reminder_date = ?, is_archived = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [log_date, short_description, note, worker_name, color || null, finalReminderDate, archiveStatus, id],
      function(err) {
        if (err) {
          return res.status(500).json({
            status: 'error',
            code: 'DATABASE_ERROR',
            message: 'Failed to update log entry',
            details: {}
          });
        }

        database.get('SELECT * FROM shift_logs WHERE id = ?', [id], (err, updatedRow) => {
          if (err || !updatedRow) {
            return res.status(500).json({
              status: 'error',
              code: 'DATABASE_ERROR',
              message: 'Failed to retrieve updated log entry',
              details: {}
            });
          }

          res.json({
            status: 'success',
            data: {
              ...updatedRow,
              is_archived: Boolean(updatedRow.is_archived),
              is_deleted: Boolean(updatedRow.is_deleted),
              reminder_date: updatedRow.reminder_date || null
            }
          });
        });
      }
    );
  });
});

// Archive log entry
router.patch('/:id/archive', (req, res) => {
  const { id } = req.params;
  const { is_archived } = req.body;
  const database = db.getDb();

  database.run(
    'UPDATE shift_logs SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [is_archived ? 1 : 0, id],
    function(err) {
      if (err) {
        return res.status(500).json({
          status: 'error',
          code: 'DATABASE_ERROR',
          message: 'Failed to archive log entry',
          details: {}
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Log entry not found',
          details: {}
        });
      }

      database.get('SELECT * FROM shift_logs WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
          return res.status(500).json({
            status: 'error',
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve updated log entry',
            details: {}
          });
        }

        res.json({
          status: 'success',
          data: {
            ...row,
            is_archived: Boolean(row.is_archived),
            is_deleted: Boolean(row.is_deleted),
            reminder_date: row.reminder_date || null
          }
        });
      });
    }
  );
});

// Set reminder date for a log
router.patch('/:id/reminder', (req, res) => {
  const { id } = req.params;
  const { reminder_date } = req.body;
  const database = db.getDb();

  // Validate reminder_date is in the future if provided
  if (reminder_date && new Date(reminder_date) <= new Date()) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Reminder date must be in the future',
      details: {}
    });
  }

  // First check if entry exists
  database.get('SELECT * FROM shift_logs WHERE id = ? AND is_deleted = 0', [id], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to check log entry',
        details: {}
      });
    }

    if (!row) {
      return res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Log entry not found',
        details: {}
      });
    }

    // If reminder_date is set, automatically archive the log
    const shouldArchive = reminder_date && new Date(reminder_date) > new Date();

    database.run(
      `UPDATE shift_logs 
       SET reminder_date = ?, is_archived = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reminder_date || null, shouldArchive ? 1 : row.is_archived, id],
      function(err) {
        if (err) {
          return res.status(500).json({
            status: 'error',
            code: 'DATABASE_ERROR',
            message: 'Failed to set reminder',
            details: {}
          });
        }

        database.get('SELECT * FROM shift_logs WHERE id = ?', [id], (err, updatedRow) => {
          if (err || !updatedRow) {
            return res.status(500).json({
              status: 'error',
              code: 'DATABASE_ERROR',
              message: 'Failed to retrieve updated log entry',
              details: {}
            });
          }

          res.json({
            status: 'success',
            data: {
              ...updatedRow,
              is_archived: Boolean(updatedRow.is_archived),
              is_deleted: Boolean(updatedRow.is_deleted),
              reminder_date: updatedRow.reminder_date || null
            }
          });
        });
      }
    );
  });
});

// Clear reminder date for a log
router.patch('/:id/reminder/clear', (req, res) => {
  const { id } = req.params;
  const database = db.getDb();

  database.run(
    'UPDATE shift_logs SET reminder_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({
          status: 'error',
          code: 'DATABASE_ERROR',
          message: 'Failed to clear reminder',
          details: {}
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Log entry not found',
          details: {}
        });
      }

      database.get('SELECT * FROM shift_logs WHERE id = ?', [id], (err, row) => {
        if (err || !row) {
          return res.status(500).json({
            status: 'error',
            code: 'DATABASE_ERROR',
            message: 'Failed to retrieve updated log entry',
            details: {}
          });
        }

        res.json({
          status: 'success',
          data: {
            ...row,
            is_archived: Boolean(row.is_archived),
            is_deleted: Boolean(row.is_deleted),
            reminder_date: null
          }
        });
      });
    }
  );
});

// Delete log entry
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const database = db.getDb();

  // Soft delete (set is_deleted flag)
  database.run(
    'UPDATE shift_logs SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        return res.status(500).json({
          status: 'error',
          code: 'DATABASE_ERROR',
          message: 'Failed to delete log entry',
          details: {}
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'Log entry not found',
          details: {}
        });
      }

      res.status(204).send();
    }
  );
});

// Search logs
router.get('/search', (req, res) => {
  const { query, worker_name, start_date, end_date } = req.query;
  
  if (!query) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Search query is required',
      details: {}
    });
  }

  let searchQuery = `
    SELECT * FROM shift_logs 
    WHERE is_deleted = 0 AND (
      short_description LIKE ? OR 
      note LIKE ? OR 
      worker_name LIKE ?
    )
  `;
  const searchTerm = `%${query}%`;
  const params = [searchTerm, searchTerm, searchTerm];

  if (worker_name) {
    searchQuery += ` AND worker_name = ?`;
    params.push(worker_name.toUpperCase().trim());
  }

  if (start_date) {
    searchQuery += ` AND log_date >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    searchQuery += ` AND log_date <= ?`;
    params.push(end_date);
  }

  searchQuery += ` ORDER BY log_date DESC`;

  const database = db.getDb();

  database.all(searchQuery, params, (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        code: 'DATABASE_ERROR',
        message: 'Failed to search logs',
        details: {}
      });
    }

    res.json({
      status: 'success',
      data: rows.map(row => ({
        ...row,
        is_archived: Boolean(row.is_archived),
        is_deleted: Boolean(row.is_deleted)
      }))
    });
  });
});

module.exports = router;

