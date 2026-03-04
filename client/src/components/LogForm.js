import React, { useState, useEffect } from 'react';
import TiptapRichTextEditor from './TiptapRichTextEditor';
import { cleanEmptyLinesOnSave } from '../utils/editorUtils';

const COLOR_OPTIONS = [
  { value: '', label: 'None', colorClass: '' },
  { value: 'green', label: 'Normal', colorClass: 'log-color-green' },
  { value: 'yellow', label: 'Warning', colorClass: 'log-color-yellow' },
  { value: 'light-blue', label: 'Information', colorClass: 'log-color-light-blue' },
  { value: 'light-green', label: 'Success', colorClass: 'log-color-light-green' },
  { value: 'red', label: 'Important', colorClass: 'log-color-red' }
];

function LogForm({ log, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    log_date: '',
    short_description: '',
    note: '',
    worker_name: '',
    color: '',
    reminder_date: ''
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (log) {
      // Format date for datetime-local input (fix timezone issue)
      const date = new Date(log.log_date);
      // Get local date/time without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
      // Format reminder_date if it exists
      let reminderDateFormatted = '';
      if (log.reminder_date) {
        const reminderDate = new Date(log.reminder_date);
        const reminderYear = reminderDate.getFullYear();
        const reminderMonth = String(reminderDate.getMonth() + 1).padStart(2, '0');
        const reminderDay = String(reminderDate.getDate()).padStart(2, '0');
        const reminderHours = String(reminderDate.getHours()).padStart(2, '0');
        const reminderMinutes = String(reminderDate.getMinutes()).padStart(2, '0');
        reminderDateFormatted = `${reminderYear}-${reminderMonth}-${reminderDay}T${reminderHours}:${reminderMinutes}`;
        setReminderEnabled(true);
      }
      setFormData({
        log_date: formattedDate,
        short_description: log.short_description || '',
        note: log.note || '',
        worker_name: log.worker_name || '',
        color: log.color || '',
        reminder_date: reminderDateFormatted
      });
    } else {
      // New log - set current date/time
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 16);
      setFormData({
        log_date: formattedDate,
        short_description: '',
        note: '',
        worker_name: '',
        color: '',
        reminder_date: ''
      });
      setReminderEnabled(false);
    }
  }, [log]);

  const validate = () => {
    const newErrors = {};

    if (!formData.log_date.trim()) {
      newErrors.log_date = 'Date is required';
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required';
    } else if (formData.short_description.length > 50) {
      newErrors.short_description = 'Must be 50 characters or less';
    }

    // Extract text content from HTML for validation
    const noteText = formData.note ? (new DOMParser().parseFromString(formData.note, 'text/html').body.textContent || '').trim() : '';
    if (!noteText) {
      newErrors.note = 'Note is required';
    } else if (noteText.length > 1000) {
      newErrors.note = 'Must be 1000 characters or less';
    }

    if (!formData.worker_name.trim()) {
      newErrors.worker_name = 'Worker name is required';
    } else if (formData.worker_name.trim().length < 1 || formData.worker_name.trim().length > 3) {
      newErrors.worker_name = 'Must be 1 to 3 characters';
    } else     if (!/^[A-Z]{1,3}$/.test(formData.worker_name.trim())) {
      newErrors.worker_name = 'Must contain only letters (A-Z)';
    }

    // Validate reminder_date if set
    if (reminderEnabled && formData.reminder_date) {
      const reminderDate = new Date(formData.reminder_date);
      const now = new Date();
      if (reminderDate <= now) {
        newErrors.reminder_date = 'Reminder date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      // Convert datetime-local format to ISO string
      const dateTime = new Date(formData.log_date).toISOString();
      const reminderDateTime = reminderEnabled && formData.reminder_date 
        ? new Date(formData.reminder_date).toISOString() 
        : null;
      
      // Clean empty lines from note before saving (allow up to 3 empty lines between text)
      const cleanedNote = cleanEmptyLinesOnSave(formData.note || '');
      
      await onSubmit({
        ...formData,
        note: cleanedNote,
        log_date: dateTime,
        worker_name: formData.worker_name.toUpperCase().trim(),
        reminder_date: reminderDateTime
      });
      // Always close form after submit (both create and update)
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Failed to save log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content lg">
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="greeting" style={{ margin: 0, fontSize: '1.5rem' }}>
              {log ? 'Edit Log Entry' : 'Create New Log Entry'}
            </h2>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ fontSize: '1.5rem', padding: '0.25rem' }}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--danger)' }}>{submitError}</p>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Date & Time *</label>
              <input
                type="datetime-local"
                value={formData.log_date}
                onChange={(e) => handleChange('log_date', e.target.value)}
                className={`form-input ${errors.log_date ? 'form-input-error' : ''}`}
              />
              {errors.log_date && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--danger)' }}>{errors.log_date}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Short Description * (max 50 characters)</label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                maxLength={50}
                className={`form-input ${errors.short_description ? 'form-input-error' : ''}`}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                {errors.short_description && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{errors.short_description}</p>
                )}
                <span className="card-subtitle" style={{ marginLeft: 'auto' }}>
                  {formData.short_description.length}/50
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Note * (max 1000 characters)</label>
              <div style={errors.note ? { border: '2px solid var(--danger)', borderRadius: '8px' } : {}}>
                <TiptapRichTextEditor
                  value={formData.note || ''}
                  onChange={(html) => handleChange('note', html)}
                  maxLength={1000}
                  placeholder="Enter your note... Use @user or @all to mention someone."
                />
              </div>
              {errors.note && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--danger)' }}>{errors.note}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Worker Name * (3-letter code)</label>
              <input
                type="text"
                value={formData.worker_name}
                onChange={(e) => handleChange('worker_name', e.target.value.toUpperCase())}
                maxLength={3}
                className={`form-input ${errors.worker_name ? 'form-input-error' : ''}`}
                style={{ textTransform: 'uppercase' }}
                placeholder="ABC"
              />
              {errors.worker_name && (
                <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--danger)' }}>{errors.worker_name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Row Color (Optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('color', option.value)}
                    className={`btn btn-secondary ${option.colorClass} ${formData.color === option.value ? 'color-selected' : ''}`}
                    style={{
                      borderWidth: formData.color === option.value ? '2px' : '1px',
                      borderColor: formData.color === option.value ? 'var(--accent)' : undefined
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="reminderEnabled"
                  checked={reminderEnabled}
                  onChange={(e) => {
                    setReminderEnabled(e.target.checked);
                    if (!e.target.checked) {
                      handleChange('reminder_date', '');
                    }
                  }}
                  title="The log will be archived until the reminder date, then automatically activated"
                />
                <label
                  htmlFor="reminderEnabled"
                  className="form-label"
                  style={{ margin: 0, cursor: 'pointer' }}
                  title="The log will be archived until the reminder date, then automatically activated"
                >
                  Set Future Reminder and Archive
                </label>
              </div>
              {reminderEnabled && (
                <div className="form-group">
                  <label className="form-label">Reminder Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => handleChange('reminder_date', e.target.value)}
                    className={`form-input ${errors.reminder_date ? 'form-input-error' : ''}`}
                  />
                  {errors.reminder_date && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--danger)' }}>{errors.reminder_date}</p>
                  )}
                  <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                    This log will be archived until the reminder date, then automatically activated.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-header"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : log ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LogForm;

