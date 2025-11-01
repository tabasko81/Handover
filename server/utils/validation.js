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
    } else if (data.note.length > 1000) {
      errors.note = 'Note must be 1000 characters or less';
    }

    if (!data.worker_name || data.worker_name.trim() === '') {
      errors.worker_name = 'Worker name is required';
    } else if (data.worker_name.trim().length !== 3) {
      errors.worker_name = 'Worker name must be exactly 3 characters';
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
      } else if (data.note.length > 1000) {
        errors.note = 'Note must be 1000 characters or less';
      }
    }

    if (data.worker_name !== undefined) {
      if (data.worker_name.trim() === '') {
        errors.worker_name = 'Worker name cannot be empty';
      } else if (data.worker_name.trim().length !== 3) {
        errors.worker_name = 'Worker name must be exactly 3 characters';
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
    note = note.replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
    note = note.replace(/javascript:/gi, ''); // Remove javascript: protocol
    
    // Only allow basic formatting tags
    note = note.replace(/<(?!\/?(b|i|u|ul|ol|li|p|br|strong|em)\b)[^>]+>/gi, '');
    
    sanitized.note = note.substring(0, 1000);
  }

  if (data.worker_name) {
    // Convert to uppercase and ensure exactly 3 characters
    sanitized.worker_name = data.worker_name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .substring(0, 3);
    
    // Pad if less than 3 characters (though validation should catch this)
    if (sanitized.worker_name.length < 3) {
      sanitized.worker_name = sanitized.worker_name.padEnd(3, 'X');
    }
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

