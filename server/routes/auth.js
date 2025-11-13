const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/db');
const { getConfig } = require('../utils/configLoader');

const JWT_SECRET = process.env.JWT_SECRET || 'shift-handover-secret-key-change-in-production';

// Brute force protection: track failed login attempts
const loginAttempts = new Map(); // Key: identifier (IP+username), Value: { count: number, blockedUntil: timestamp }
const MAX_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

// Get client identifier (IP + username for better tracking)
function getClientIdentifier(req, username = '') {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  return `${ip}:${username || 'anonymous'}`;
}

// Check brute force protection
function checkBruteForce(req, identifier) {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (attempt) {
    // Check if still blocked
    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      const remainingSeconds = Math.ceil((attempt.blockedUntil - now) / 1000);
      return {
        blocked: true,
        message: `Too many failed login attempts. Please wait ${remainingSeconds} seconds before trying again.`
      };
    }

    // Reset if block expired
    if (attempt.blockedUntil && now >= attempt.blockedUntil) {
      loginAttempts.delete(identifier);
    }
  }

  return { blocked: false };
}

// Record failed login attempt
function recordFailedAttempt(identifier) {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);

  if (attempt) {
    attempt.count += 1;
    
    // Block after MAX_ATTEMPTS failed attempts
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blockedUntil = now + BLOCK_DURATION_MS;
    }
  } else {
    loginAttempts.set(identifier, {
      count: 1,
      blockedUntil: null
    });
  }
}

// Clear successful login
function clearAttempts(identifier) {
  loginAttempts.delete(identifier);
}

// Admin Login (for backoffice)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Check brute force protection
    const identifier = getClientIdentifier(req, username);
    const bruteForceCheck = checkBruteForce(req, identifier);
    if (bruteForceCheck.blocked) {
      return res.status(429).json({
        status: 'error',
        message: bruteForceCheck.message
      });
    }

    const db = getDb();
    
    // Check user in database
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Login failed',
          details: { error: err.message }
        });
      }
      
      if (!user) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      
      // Check if user is admin
      if (!user.is_admin) {
        recordFailedAttempt(identifier);
        return res.status(403).json({
          status: 'error',
          message: 'Admin access required'
        });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      
      // Successful login - clear attempts
      clearAttempts(identifier);
      
      // Get expiry settings from config
      const config = getConfig();
      const expiryEnabled = config.login_expiry_enabled !== false; // Default to true
      const expiryHours = config.login_expiry_hours || 24;
      
      // Generate token with or without expiry
      const tokenOptions = expiryEnabled 
        ? { expiresIn: `${expiryHours}h` }
        : {}; // No expiry if disabled
      
      const token = jwt.sign(
        { 
          username: user.username, 
          is_admin: true,
          type: 'admin'
        },
        JWT_SECRET,
        tokenOptions
      );
      
      res.json({
        status: 'success',
        data: {
          token,
          username: user.username
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      details: { error: error.message }
    });
  }
});

// User Login (for main page)
router.post('/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Check brute force protection
    const identifier = getClientIdentifier(req, username);
    const bruteForceCheck = checkBruteForce(req, identifier);
    if (bruteForceCheck.blocked) {
      return res.status(429).json({
        status: 'error',
        message: bruteForceCheck.message
      });
    }

    const db = getDb();
    
    // Check user in database
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Login failed',
          details: { error: err.message }
        });
      }
      
      if (!user) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        recordFailedAttempt(identifier);
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }
      
      // Successful login - clear attempts
      clearAttempts(identifier);
      
      // Get expiry settings from config
      const config = getConfig();
      const expiryEnabled = config.login_expiry_enabled !== false; // Default to true
      const expiryHours = config.login_expiry_hours || 24;
      
      // Generate token with or without expiry
      const tokenOptions = expiryEnabled 
        ? { expiresIn: `${expiryHours}h` }
        : {}; // No expiry if disabled
      
      const token = jwt.sign(
        { 
          username: user.username, 
          type: 'user',
          is_admin: user.is_admin ? true : false
        },
        JWT_SECRET,
        tokenOptions
      );
      
      res.json({
        status: 'success',
        data: {
          token,
          username: user.username
        }
      });
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      details: { error: error.message }
    });
  }
});

// Verify admin token
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Get config to check if expiry is enabled
    const config = getConfig();
    const expiryEnabled = config.login_expiry_enabled !== false; // Default to true

    try {
      // If expiry is disabled, ignore expiration (handles old tokens with expiry)
      const verifyOptions = expiryEnabled ? {} : { ignoreExpiration: true };
      const decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
      
      res.json({
        status: 'success',
        data: { username: decoded.username }
      });
    } catch (err) {
      // If expiry is disabled and we got an error, try with ignoreExpiration (handles old tokens)
      if (!expiryEnabled) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
          return res.json({
            status: 'success',
            data: { username: decoded.username }
          });
        } catch (innerErr) {
          // Token is truly invalid
        }
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Token verification failed',
      details: { error: error.message }
    });
  }
});

// Verify user token
router.get('/user/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Get config to check if expiry is enabled
    const config = getConfig();
    const expiryEnabled = config.login_expiry_enabled !== false; // Default to true

    try {
      // If expiry is disabled, ignore expiration (handles old tokens with expiry)
      const verifyOptions = expiryEnabled ? {} : { ignoreExpiration: true };
      const decoded = jwt.verify(token, JWT_SECRET, verifyOptions);
      
      if (decoded.type !== 'user') {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid token type'
        });
      }
      
      res.json({
        status: 'success',
        data: { username: decoded.username }
      });
    } catch (err) {
      // If expiry is disabled and we got an error, try with ignoreExpiration (handles old tokens)
      if (!expiryEnabled) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
          if (decoded.type === 'user') {
            return res.json({
              status: 'success',
              data: { username: decoded.username }
            });
          }
        } catch (innerErr) {
          // Token is truly invalid
        }
      }
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Token verification failed',
      details: { error: error.message }
    });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 6 characters'
      });
    }

    const db = getDb();
    
    // Get user from database
    db.get('SELECT * FROM users WHERE username = ?', [decoded.username], async (err, user) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database error',
          details: { error: err.message }
        });
      }
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }
      
      // Update password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPasswordHash, user.id],
        (err) => {
          if (err) {
            return res.status(500).json({
              status: 'error',
              message: 'Failed to update password',
              details: { error: err.message }
            });
          }
          
          res.json({
            status: 'success',
            message: 'Password changed successfully'
          });
        }
      );
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
      details: { error: error.message }
    });
  }
});

module.exports = router;
