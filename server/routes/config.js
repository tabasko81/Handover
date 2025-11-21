const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');
const CONFIG_DIR = path.dirname(CONFIG_FILE);

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Default configuration
const DEFAULT_CONFIG = {
  page_name: 'Shift Handover Log',
  permanent_info: '',
  login_expiry_enabled: true,
  login_expiry_hours: 24,
  header_color: '#2563eb' // Default blue-600
};

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading config:', err);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    throw err;
  }
}

// Get configuration
router.get('/', (req, res) => {
  try {
    const config = getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load configuration',
      details: { error: error.message }
    });
  }
});

// Update configuration (requires authentication)
const authenticateToken = require('../middleware/auth');

// Get public config (no auth required)
router.get('/public', (req, res) => {
  try {
    const config = getConfig();
    res.json({
      page_name: config.page_name || DEFAULT_CONFIG.page_name,
      permanent_info: config.permanent_info || DEFAULT_CONFIG.permanent_info,
      header_color: config.header_color || DEFAULT_CONFIG.header_color
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load configuration',
      details: { error: error.message }
    });
  }
});

// Update configuration (requires auth)
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { page_name, permanent_info, login_expiry_enabled, login_expiry_hours, header_color } = req.body;
    const config = getConfig();
    
    if (page_name !== undefined) {
      config.page_name = page_name || DEFAULT_CONFIG.page_name;
    }
    if (permanent_info !== undefined) {
      config.permanent_info = permanent_info || '';
    }
    if (header_color !== undefined) {
      config.header_color = header_color || DEFAULT_CONFIG.header_color;
    }
    if (login_expiry_enabled !== undefined) {
      config.login_expiry_enabled = Boolean(login_expiry_enabled);
    }
    if (login_expiry_hours !== undefined) {
      const hours = parseInt(login_expiry_hours);
      // Validate: min 1 hour, max 168 hours (1 week)
      if (!isNaN(hours) && hours >= 1 && hours <= 168) {
        config.login_expiry_hours = hours;
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Login expiry hours must be between 1 and 168 (1 hour to 1 week)'
        });
      }
    }
    
    // Cleanup old config fields if they exist
    if (config.theme !== undefined) {
      delete config.theme;
    }

    // Cleanup old config fields if they exist
    if (config.login_enabled !== undefined) {
      delete config.login_enabled;
    }
    if (config.login_username !== undefined) {
      delete config.login_username;
    }
    if (config.login_password_hash !== undefined) {
      delete config.login_password_hash;
    }
    if (config.daily_logs_enabled !== undefined) {
      delete config.daily_logs_enabled;
    }
    // Note: login_expiry_enabled is a valid field, don't delete it

    saveConfig(config);
    
    res.json({
      status: 'success',
      data: config
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update configuration',
      details: { error: error.message }
    });
  }
});

module.exports = router;

