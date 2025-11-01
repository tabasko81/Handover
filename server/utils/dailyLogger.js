const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');
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

const LOGS_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function getTodayLogFile() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `logs_${today}.txt`);
}

function formatLogEntry(log) {
  const date = new Date(log.log_date).toLocaleString('en-GB');
  const note = log.note.replace(/<[^>]*>/g, ''); // Remove HTML tags
  
  return `[${date}] ${log.short_description}
Worker: ${log.worker_name}
Note: ${note}
${log.is_archived ? '(ARCHIVED)' : ''}
${'='.repeat(60)}`;
}

async function appendToDailyLog(log) {
  try {
    const config = getConfig();
    
    if (!config.daily_logs_enabled) {
      return; // Feature is disabled
    }

    const logFile = getTodayLogFile();
    const logEntry = formatLogEntry(log) + '\n\n';
    
    fs.appendFileSync(logFile, logEntry, 'utf8');
  } catch (error) {
    console.error('Error writing to daily log:', error);
    // Don't throw - logging is optional
  }
}

module.exports = {
  appendToDailyLog
};

