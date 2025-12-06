const jwt = require('jsonwebtoken');
const { getConfig } = require('../utils/configLoader');

const JWT_SECRET = process.env.JWT_SECRET || 'shift-handover-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required'
    });
  }

  // Get config to check if expiry is enabled
  const config = getConfig();
  const expiryEnabled = config.login_expiry_enabled !== false; // Default to true

  // If expiry is disabled, ignore expiration (handles old tokens with expiry)
  const verifyOptions = expiryEnabled ? {} : { ignoreExpiration: true };

  jwt.verify(token, JWT_SECRET, verifyOptions, (err, decoded) => {
    if (err) {
      // If expiry is disabled and we got an error, try with ignoreExpiration (handles old tokens)
      if (!expiryEnabled) {
        jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }, (innerErr, innerDecoded) => {
          if (innerErr) {
            return res.status(403).json({
              status: 'error',
              message: 'Invalid token'
            });
          }
          req.user = innerDecoded;
          next();
        });
      } else {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            status: 'error',
            message: 'Token expired'
          });
        }
        return res.status(403).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
    } else {
      req.user = decoded;
      next();
    }
  });
}

module.exports = authenticateToken;
