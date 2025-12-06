import React, { useState, useEffect } from 'react';
import RichTextEditor, { cleanEmptyLinesOnSave } from './RichTextEditor';

const COLOR_OPTIONS = [
  { value: '', label: 'None', className: 'bg-white' },
  { value: 'green', label: 'Normal', className: 'bg-green-100' },
  { value: 'yellow', label: 'Warning', className: 'bg-yellow-100' },
  { value: 'light-blue', label: 'Information', className: 'bg-blue-100' },
  { value: 'light-green', label: 'Success', className: 'bg-green-50' },
  { value: 'red', label: 'Important', className: 'bg-red-100' }
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
  const [setReminder, setSetReminder] = useState(false);
  const [errors, setErrors] = useState({});
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
        setSetReminder(true);
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
      setSetReminder(false);
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
    if (setReminder && formData.reminder_date) {
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

    setSubmitting(true);
    try {
      // Convert datetime-local format to ISO string
      const dateTime = new Date(formData.log_date).toISOString();
      const reminderDateTime = setReminder && formData.reminder_date 
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
      alert(error.message || 'Failed to save log');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {log ? 'Edit Log Entry' : 'Create New Log Entry'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.log_date}
                onChange={(e) => handleChange('log_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.log_date
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.log_date && (
                <p className="mt-1 text-sm text-red-600">{errors.log_date}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description * (max 50 characters)
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                maxLength={50}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.short_description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.short_description && (
                  <p className="text-sm text-red-600">{errors.short_description}</p>
                )}
                <span className="text-sm text-gray-500 ml-auto">
                  {formData.short_description.length}/50
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note * (max 1000 characters)
              </label>
              <div className={errors.note ? 'border-2 border-red-500 rounded-md' : ''}>
                <RichTextEditor
                  value={formData.note || ''}
                  onChange={(html) => handleChange('note', html)}
                  maxLength={1000}
                  placeholder="Enter your note... Use @user or @all to mention someone."
                />
              </div>
              {errors.note && (
                <p className="mt-1 text-sm text-red-600">{errors.note}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Worker Name * (3-letter code)
              </label>
              <input
                type="text"
                value={formData.worker_name}
                onChange={(e) => handleChange('worker_name', e.target.value.toUpperCase())}
                maxLength={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 uppercase ${
                  errors.worker_name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="ABC"
              />
              {errors.worker_name && (
                <p className="mt-1 text-sm text-red-600">{errors.worker_name}</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Row Color (Optional)
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('color', option.value)}
                    className={`px-3 py-2 border-2 rounded-md text-sm font-medium transition-all ${
                      formData.color === option.value
                        ? 'border-blue-600 ring-2 ring-blue-300'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${option.className}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="setReminder"
                  checked={setReminder}
                  onChange={(e) => {
                    setSetReminder(e.target.checked);
                    if (!e.target.checked) {
                      handleChange('reminder_date', '');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  title="The log will be archived until the reminder date, then automatically activated"
                />
                <label 
                  htmlFor="setReminder" 
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                  title="The log will be archived until the reminder date, then automatically activated"
                >
                  Set Future Reminder and Archive
                </label>
              </div>
              {setReminder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reminder Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => handleChange('reminder_date', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.reminder_date
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.reminder_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.reminder_date}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    This log will be archived until the reminder date, then automatically activated.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--header-color)' }}
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

