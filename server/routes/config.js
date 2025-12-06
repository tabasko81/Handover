const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const CONFIG_FILE = path.join(__dirname, '../../data/config.json');
const CONFIG_DIR = path.dirname(CONFIG_FILE);
const UPLOADS_DIR = path.join(__dirname, '../../data/uploads/logos');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default configuration
const DEFAULT_CONFIG = {
  page_name: 'Shift Handover Log',
  permanent_info: '',
  login_expiry_enabled: true,
  login_expiry_hours: 24,
  header_color: '#2563eb', // Default blue-600
  header_logo_type: 'none', // 'none' | 'image' | 'emoji'
  header_logo_image: '', // URL or path to image
  header_logo_emoji: '' // Emoji text
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, svg, webp)'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  },
  fileFilter: fileFilter
});

// Upload logo endpoint
router.post('/upload-logo', authenticateToken, upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Get old logo path to delete it later
    const config = getConfig();
    const oldLogoPath = config.header_logo_image;
    
    // Save new logo path (relative to uploads directory)
    const logoPath = `/uploads/logos/${req.file.filename}`;
    
    // Update config with new logo
    config.header_logo_type = 'image';
    config.header_logo_image = logoPath;
    config.header_logo_emoji = '';
    saveConfig(config);
    
    // Delete old logo file if it exists and is in uploads directory
    if (oldLogoPath && oldLogoPath.startsWith('/uploads/logos/')) {
      const oldFilePath = path.join(__dirname, '../../data', oldLogoPath);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }
    
    res.json({
      status: 'success',
      data: {
        logo_path: logoPath,
        logo_url: logoPath
      }
    });
  } catch (error) {
    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload logo',
      details: { error: error.message }
    });
  }
});

// Delete logo endpoint
router.delete('/logo', authenticateToken, (req, res) => {
  try {
    const config = getConfig();
    const logoPath = config.header_logo_image;
    
    // Delete logo file if it exists and is in uploads directory
    if (logoPath && logoPath.startsWith('/uploads/logos/')) {
      const filePath = path.join(__dirname, '../../data', logoPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Clear logo config
    config.header_logo_type = 'none';
    config.header_logo_image = '';
    config.header_logo_emoji = '';
    saveConfig(config);
    
    res.json({
      status: 'success',
      message: 'Logo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete logo',
      details: { error: error.message }
    });
  }
});

// Get public config (no auth required)
router.get('/public', (req, res) => {
  try {
    const config = getConfig();
    res.json({
      page_name: config.page_name || DEFAULT_CONFIG.page_name,
      permanent_info: config.permanent_info || DEFAULT_CONFIG.permanent_info,
      header_color: config.header_color || DEFAULT_CONFIG.header_color,
      header_logo_type: config.header_logo_type || DEFAULT_CONFIG.header_logo_type,
      header_logo_image: config.header_logo_image || DEFAULT_CONFIG.header_logo_image,
      header_logo_emoji: config.header_logo_emoji || DEFAULT_CONFIG.header_logo_emoji
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
    const { page_name, permanent_info, login_expiry_enabled, login_expiry_hours, header_color, header_logo_type, header_logo_image, header_logo_emoji } = req.body;
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
    
    // Handle logo configuration
    if (header_logo_type !== undefined) {
      const validTypes = ['none', 'image', 'emoji'];
      if (validTypes.includes(header_logo_type)) {
        config.header_logo_type = header_logo_type;
        // Clear other logo fields when type changes
        if (header_logo_type === 'none') {
          config.header_logo_image = '';
          config.header_logo_emoji = '';
        } else if (header_logo_type === 'image') {
          config.header_logo_emoji = '';
        } else if (header_logo_type === 'emoji') {
          config.header_logo_image = '';
        }
      }
    }
    if (header_logo_image !== undefined && config.header_logo_type === 'image') {
      config.header_logo_image = header_logo_image || '';
    }
    if (header_logo_emoji !== undefined && config.header_logo_type === 'emoji') {
      config.header_logo_emoji = header_logo_emoji || '';
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

