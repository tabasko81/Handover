// isomorphic-dompurify exports the sanitize function directly
const DOMPurify = require('isomorphic-dompurify');

// Function to sanitize style attribute manually
function sanitizeStyleAttribute(styleValue) {
  if (!styleValue) return '';
  
  let style = styleValue;
  
  // Remove dangerous CSS expressions
  style = style.replace(/javascript:/gi, '');
  style = style.replace(/expression\s*\(/gi, '');
  style = style.replace(/url\s*\(\s*['"]?\s*javascript:/gi, '');
  
  // Only allow safe CSS properties
  const safeProperties = [
    'color', 'background-color', 'background', 'font-weight', 'font-size',
    'text-decoration', 'text-align', 'margin', 'padding', 'border',
    'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom'
  ];
  
  // Filter out dangerous properties
  const properties = style.split(';').filter(prop => {
    const trimmed = prop.trim();
    if (!trimmed) return false;
    const propName = trimmed.split(':')[0].trim().toLowerCase();
    return safeProperties.some(safe => propName.includes(safe));
  });
  
  return properties.join('; ');
}

// Function to sanitize href attribute
function sanitizeHrefAttribute(hrefValue) {
  if (!hrefValue) return '';
  
  const href = hrefValue.trim();
  // Only allow http/https, relative paths, and anchors
  if (/^https?:\/\//i.test(href) || href.startsWith('#') || href.startsWith('/')) {
    return href;
  }
  // Block dangerous protocols
  return '';
}

// Pre-process HTML to sanitize style and href attributes before DOMPurify
function preSanitizeHTML(html) {
  // Sanitize style attributes
  html = html.replace(/style\s*=\s*["']([^"']*)["']/gi, (match, styleValue) => {
    const sanitized = sanitizeStyleAttribute(styleValue);
    return sanitized ? `style="${sanitized}"` : '';
  });
  
  // Sanitize href attributes
  html = html.replace(/href\s*=\s*["']([^"']*)["']/gi, (match, hrefValue) => {
    const sanitized = sanitizeHrefAttribute(hrefValue);
    return sanitized ? `href="${sanitized}"` : '';
  });
  
  return html;
}

// Configure allowed tags and attributes
const sanitizeConfig = {
  ALLOWED_TAGS: ['b', 'i', 'u', 'ul', 'ol', 'li', 'p', 'br', 'strong', 'em', 'div', 'span', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['style', 'class', 'href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

function validateLogEntry(data, isUpdate = false) {
  const errors = {};

  // For updates, all fields are optional
  if (!isUpdate) {
    if (!data.log_date || data.log_date.trim() === '') {
      errors.log_date = 'Date is required';
    } else if (isNaN(new Date(data.log_date).getTime())) {
      errors.log_date = 'Invalid date format';
    }

    if (!data.short_description || data.short_description.trim() === '') {
      errors.short_description = 'Short description is required';
    } else if (data.short_description.length > 50) {
      errors.short_description = 'Short description must be 50 characters or less';
    }

    if (!data.note || data.note.trim() === '') {
      errors.note = 'Note is required';
    } else {
      // Count text content, not HTML tags
      const textLength = data.note.replace(/<[^>]*>/g, '').trim().length;
      if (textLength === 0) {
        errors.note = 'Note cannot be empty (HTML tags only)';
      } else if (textLength > 1000) {
        errors.note = `Note must be 1000 characters or less (currently ${textLength})`;
      }
    }

    if (!data.worker_name || data.worker_name.trim() === '') {
      errors.worker_name = 'Worker name is required';
    } else if (data.worker_name.trim().length < 1 || data.worker_name.trim().length > 3) {
      errors.worker_name = 'Worker name must be 1 to 3 characters';
    } else if (!/^[A-Z]{1,3}$/.test(data.worker_name.trim().toUpperCase())) {
      errors.worker_name = 'Worker name must contain only letters (A-Z)';
    }
  } else {
    // For updates, validate only provided fields
    if (data.short_description !== undefined) {
      if (data.short_description.trim() === '') {
        errors.short_description = 'Short description cannot be empty';
      } else if (data.short_description.length > 50) {
        errors.short_description = 'Short description must be 50 characters or less';
      }
    }

    if (data.note !== undefined) {
      if (data.note.trim() === '') {
        errors.note = 'Note cannot be empty';
      } else {
        const textLength = data.note.replace(/<[^>]*>/g, '').trim().length;
        if (textLength === 0) {
          errors.note = 'Note cannot be empty (HTML tags only)';
        } else if (textLength > 1000) {
          errors.note = `Note must be 1000 characters or less (currently ${textLength})`;
        }
      }
    }

    if (data.worker_name !== undefined) {
      if (data.worker_name.trim() === '') {
        errors.worker_name = 'Worker name cannot be empty';
      } else if (data.worker_name.trim().length < 1 || data.worker_name.trim().length > 3) {
        errors.worker_name = 'Worker name must be 1 to 3 characters';
      } else if (!/^[A-Z]{1,3}$/.test(data.worker_name.trim().toUpperCase())) {
        errors.worker_name = 'Worker name must contain only letters (A-Z)';
      }
    }

    if (data.log_date !== undefined && isNaN(new Date(data.log_date).getTime())) {
      errors.log_date = 'Invalid date format';
    }
  }

  const isValid = Object.keys(errors).length === 0;
  const message = isValid ? '' : 'Validation failed';

  return { isValid, errors, message };
}

function sanitizeInput(data) {
  const sanitized = {};

  if (data.log_date) {
    sanitized.log_date = data.log_date.trim();
  }

  if (data.short_description) {
    // Remove potentially dangerous characters and trim
    sanitized.short_description = data.short_description
      .trim()
      .replace(/[<>]/g, '')
      .substring(0, 50);
  }

  if (data.note) {
    try {
      // Sanitize HTML using DOMPurify
      let note = data.note.trim();
      
      // First, check text length before sanitization (for validation)
      const textLength = note.replace(/<[^>]*>/g, '').length;
      if (textLength > 1000) {
        // Truncate intelligently before sanitization
        let truncated = '';
        let count = 0;
        let inTag = false;
        
        for (let i = 0; i < note.length && count < 1000; i++) {
          if (note[i] === '<') {
            inTag = true;
            truncated += note[i];
          } else if (note[i] === '>') {
            inTag = false;
            truncated += note[i];
          } else {
            truncated += note[i];
            if (!inTag) count++;
          }
        }
        note = truncated;
      }
      
      // Pre-sanitize style and href attributes
      note = preSanitizeHTML(note);
      
      // Sanitize with DOMPurify
      // isomorphic-dompurify exports the sanitize function directly
      // Wrap in try-catch in case DOMPurify throws an error
      try {
        note = DOMPurify.sanitize(note, sanitizeConfig);
      } catch (purifyError) {
        console.error('DOMPurify sanitization error:', purifyError);
        // If DOMPurify fails, fall back to basic HTML escaping
        note = note
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      
      sanitized.note = note;
    } catch (error) {
      console.error('Error sanitizing note:', error);
      // Fall back to basic HTML escaping if anything fails
      sanitized.note = data.note
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  if (data.worker_name) {
    // Convert to uppercase and ensure 1-3 characters
    sanitized.worker_name = data.worker_name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);
  }

  if (data.color !== undefined) {
    // Validate color value
    const validColors = ['', 'green', 'yellow', 'light-blue', 'light-green', 'red'];
    if (validColors.includes(data.color)) {
      sanitized.color = data.color;
    }
  }

  return sanitized;
}

module.exports = {
  validateLogEntry,
  sanitizeInput
};

