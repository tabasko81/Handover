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
  daily_logs_enabled: false
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

// Update configuration
router.put('/', (req, res) => {
  try {
    const { page_name, daily_logs_enabled } = req.body;
    
    const config = {
      page_name: page_name || DEFAULT_CONFIG.page_name,
      daily_logs_enabled: daily_logs_enabled !== undefined ? Boolean(daily_logs_enabled) : DEFAULT_CONFIG.daily_logs_enabled
    };

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

