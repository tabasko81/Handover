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
    // Allow basic HTML formatting but sanitize dangerous tags
    let note = data.note.trim();
    
    // Remove script tags and dangerous attributes
    note = note.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    note = note.replace(/on\w+\s*=/gi, ''); // Remove event handlers
    note = note.replace(/javascript:/gi, ''); // Remove javascript: protocol
    
    // Allow basic formatting tags (b, i, u, ul, ol, li, p, br, strong, em, div, span)
    // Remove any other tags but keep their content
    note = note.replace(/<(?!\/?(b|i|u|ul|ol|li|p|br|strong|em|div|span)\b)[^>]*>/gi, '');
    
    // Limit to 1000 characters (counting text content, not HTML tags)
    const textLength = note.replace(/<[^>]*>/g, '').length;
    if (textLength > 1000) {
      // Truncate intelligently
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
    
    sanitized.note = note;
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

