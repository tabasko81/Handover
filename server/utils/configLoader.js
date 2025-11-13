const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');

const DEFAULT_CONFIG = {
  page_name: 'Shift Handover Log',
  permanent_info: '',
  login_expiry_enabled: true,
  login_expiry_hours: 24
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

module.exports = {
  getConfig,
  saveConfig
};

