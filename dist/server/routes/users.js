const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDb } = require('../database/db');
const authenticateToken = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Email configuration (can be set via environment variables)
const getEmailTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };

  // Only create transporter if credentials are provided
  if (emailConfig.auth.user && emailConfig.auth.pass) {
    return nodemailer.createTransport(emailConfig);
  }
  return null;
};

// Helper function to send password email
async function sendPasswordEmail(email, username, password) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error('Email configuration not set. Please configure SMTP settings in environment variables.');
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Shift Handover Log - Your Login Credentials',
    html: `
      <h2>Shift Handover Log - Login Credentials</h2>
      <p>Hello,</p>
      <p>Your account has been created/updated in the Shift Handover Log system.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please keep these credentials secure and change your password after first login.</p>
      <p>Best regards,<br>Shift Handover Log System</p>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verify user is admin
    const db = getDb();
    const username = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Get all users
      db.all('SELECT id, username, email, is_admin, display_order, created_at, updated_at FROM users ORDER BY display_order, username', (err, users) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users',
            details: { error: err.message }
          });
        }
        
        res.json({
          status: 'success',
          data: users
        });
      });
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      details: { error: error.message }
    });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, is_admin, send_email } = req.body;
    
    // Verify user is admin
    const db = getDb();
    const currentUsername = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [currentUsername], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
      }
      
      if (password.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 6 characters'
        });
      }
      
      // Check if username already exists
      db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existingUser) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Database error',
            details: { error: err.message }
          });
        }
        
        if (existingUser) {
          return res.status(400).json({
            status: 'error',
            message: 'Username already exists'
          });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Get max display_order
        db.get('SELECT MAX(display_order) as max_order FROM users', async (err, maxRow) => {
          if (err) {
            return res.status(500).json({
              status: 'error',
              message: 'Database error',
              details: { error: err.message }
            });
          }
          
          const nextOrder = (maxRow?.max_order || 0) + 1;
          
          // Insert user
          db.run(
            'INSERT INTO users (username, email, password_hash, is_admin, display_order) VALUES (?, ?, ?, ?, ?)',
            [username, email || null, passwordHash, is_admin ? 1 : 0, nextOrder],
          async function(err) {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: 'Failed to create user',
                details: { error: err.message }
              });
            }
            
            // Send email if requested and email is provided
            if (send_email && email) {
              try {
                await sendPasswordEmail(email, username, password);
              } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the request if email fails
              }
            }
            
            res.json({
              status: 'success',
              message: 'User created successfully',
              data: {
                id: this.lastID,
                username,
                email: email || null,
                is_admin: is_admin ? 1 : 0,
                display_order: nextOrder
              }
            });
          }
        );
        });
      });
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      details: { error: error.message }
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, is_admin, send_email } = req.body;
    
    // Verify user is admin
    const db = getDb();
    const currentUsername = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [currentUsername], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Get existing user
      db.get('SELECT * FROM users WHERE id = ?', [id], async (err, existingUser) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Database error',
            details: { error: err.message }
          });
        }
        
        if (!existingUser) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }
        
        // Prevent changing admin username
        if (existingUser.username === 'admin' && username && username !== 'admin') {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot change admin username'
          });
        }
        
        // Check if username is being changed and if it already exists
        if (username && username !== existingUser.username) {
          db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id], async (err, conflictUser) => {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: 'Database error',
                details: { error: err.message }
              });
            }
            
            if (conflictUser) {
              return res.status(400).json({
                status: 'error',
                message: 'Username already exists'
              });
            }
            
            updateUser();
          });
        } else {
          updateUser();
        }
        
        async function updateUser() {
          const updates = [];
          const values = [];
          
          if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
          }
          
          if (email !== undefined) {
            updates.push('email = ?');
            values.push(email || null);
          }
          
          if (is_admin !== undefined) {
            updates.push('is_admin = ?');
            values.push(is_admin ? 1 : 0);
          }
          
          let newPassword = null;
          if (password) {
            if (password.length < 6) {
              return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters'
              });
            }
            newPassword = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            values.push(newPassword);
          }
          
          updates.push('updated_at = CURRENT_TIMESTAMP');
          values.push(id);
          
          const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
          
          db.run(sql, values, async function(err) {
            if (err) {
              return res.status(500).json({
                status: 'error',
                message: 'Failed to update user',
                details: { error: err.message }
              });
            }
            
            // Send email if requested and email is provided
            if (send_email && (email || existingUser.email)) {
              const emailToSend = email || existingUser.email;
              const passwordToSend = password || 'Your password has been updated. Please contact administrator if you need the new password.';
              try {
                await sendPasswordEmail(emailToSend, username || existingUser.username, passwordToSend);
              } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the request if email fails
              }
            }
            
            // Get updated user
            db.get('SELECT id, username, email, is_admin, display_order, created_at, updated_at FROM users WHERE id = ?', [id], (err, updatedUser) => {
              if (err) {
                return res.status(500).json({
                  status: 'error',
                  message: 'User updated but failed to fetch updated data',
                  details: { error: err.message }
                });
              }
              
              res.json({
                status: 'success',
                message: 'User updated successfully',
                data: updatedUser
              });
            });
          });
        }
      });
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      details: { error: error.message }
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user is admin
    const db = getDb();
    const currentUsername = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [currentUsername], (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Check if user exists
      db.get('SELECT id, username FROM users WHERE id = ?', [id], (err, existingUser) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Database error',
            details: { error: err.message }
          });
        }
        
        if (!existingUser) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }
        
        // Prevent deleting yourself
        if (existingUser.username === currentUsername) {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot delete your own account'
          });
        }
        
        // Prevent deleting admin user
        if (existingUser.username === 'admin') {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot delete admin user'
          });
        }
        
        // Delete user
        db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({
              status: 'error',
              message: 'Failed to delete user',
              details: { error: err.message }
            });
          }
          
          res.json({
            status: 'success',
            message: 'User deleted successfully'
          });
        });
      });
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user',
      details: { error: error.message }
    });
  }
});

// Send password email (admin only)
router.post('/:id/send-password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify user is admin
    const db = getDb();
    const currentUsername = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [currentUsername], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Get user
      db.get('SELECT username, email FROM users WHERE id = ?', [id], async (err, targetUser) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Database error',
            details: { error: err.message }
          });
        }
        
        if (!targetUser) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }
        
        if (!targetUser.email) {
          return res.status(400).json({
            status: 'error',
            message: 'User does not have an email address'
          });
        }
        
        // Generate temporary password or use provided one
        const { password } = req.body;
        if (!password) {
          return res.status(400).json({
            status: 'error',
            message: 'Password is required to send email'
          });
        }
        
        try {
          await sendPasswordEmail(targetUser.email, targetUser.username, password);
          res.json({
            status: 'success',
            message: 'Password email sent successfully'
          });
        } catch (emailError) {
          res.status(500).json({
            status: 'error',
            message: 'Failed to send email',
            details: { error: emailError.message }
          });
        }
      });
    });
  } catch (error) {
    console.error('Send password email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send password email',
      details: { error: error.message }
    });
  }
});

// Move user up or down (admin only)
router.post('/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({
        status: 'error',
        message: 'Direction must be "up" or "down"'
      });
    }
    
    // Verify user is admin
    const db = getDb();
    const currentUsername = req.user.username;
    
    db.get('SELECT is_admin FROM users WHERE username = ?', [currentUsername], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user || !user.is_admin) {
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Get current user
      db.get('SELECT id, display_order FROM users WHERE id = ?', [id], async (err, currentUser) => {
        if (err) {
          return res.status(500).json({
            status: 'error',
            message: 'Database error',
            details: { error: err.message }
          });
        }
        
        if (!currentUser) {
          return res.status(404).json({
            status: 'error',
            message: 'User not found'
          });
        }
        
        const currentOrder = currentUser.display_order || 0;
        const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
        
        // Get user at target position
        db.get('SELECT id, display_order FROM users WHERE display_order = ?', [targetOrder], async (err, targetUser) => {
          if (err) {
            return res.status(500).json({
              status: 'error',
              message: 'Database error',
              details: { error: err.message }
            });
          }
          
          if (!targetUser) {
            // No user at target position, can't move
            return res.status(400).json({
              status: 'error',
              message: `Cannot move user ${direction === 'up' ? 'up' : 'down'}: no user at target position`
            });
          }
          
          // Swap orders
          db.serialize(() => {
            // Set current user to temporary order
            db.run('UPDATE users SET display_order = ? WHERE id = ?', [-1, id], (err) => {
              if (err) {
                return res.status(500).json({
                  status: 'error',
                  message: 'Failed to move user',
                  details: { error: err.message }
                });
              }
              
              // Set target user to current order
              db.run('UPDATE users SET display_order = ? WHERE id = ?', [currentOrder, targetUser.id], (err) => {
                if (err) {
                  return res.status(500).json({
                    status: 'error',
                    message: 'Failed to move user',
                    details: { error: err.message }
                  });
                }
                
                // Set current user to target order
                db.run('UPDATE users SET display_order = ? WHERE id = ?', [targetOrder, id], (err) => {
                  if (err) {
                    return res.status(500).json({
                      status: 'error',
                      message: 'Failed to move user',
                      details: { error: err.message }
                    });
                  }
                  
                  // Get all users with updated order
                  db.all('SELECT id, username, email, is_admin, display_order, created_at, updated_at FROM users ORDER BY display_order, username', (err, users) => {
                    if (err) {
                      return res.status(500).json({
                        status: 'error',
                        message: 'User moved but failed to fetch updated list',
                        details: { error: err.message }
                      });
                    }
                    
                    res.json({
                      status: 'success',
                      message: 'User moved successfully',
                      data: users
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Move user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to move user',
      details: { error: error.message }
    });
  }
});

module.exports = router;

