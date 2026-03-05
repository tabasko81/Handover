import React, { useEffect, useState } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { formatDateTime } from '../utils/dateFormat';
import { clearReminder } from '../services/api';

function ExpandedLogView({ log, logs, onClose, onEdit, onArchive, onNavigate, onDelete }) {
  const [currentLog, setCurrentLog] = useState(log);
  const [clearReminderError, setClearReminderError] = useState(null);

  useEffect(() => {
    setCurrentLog(log);
  }, [log]);

  const getCurrentIndex = () => {
    return logs.findIndex(l => l.id === currentLog.id);
  };

  const handleNext = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex < logs.length - 1) {
      const newLog = logs[currentIndex + 1];
      setCurrentLog(newLog);
      if (onNavigate) {
        onNavigate(newLog);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      const newLog = logs[currentIndex - 1];
      setCurrentLog(newLog);
      if (onNavigate) {
        onNavigate(newLog);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent navigation if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === '<') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight' || e.key === '>') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLog.id, logs, onClose, onNavigate]);

  if (!currentLog) return null;

  const currentIndex = getCurrentIndex();
  const hasNext = currentIndex < logs.length - 1;
  const hasPrevious = currentIndex > 0;

  const formatNote = (note) => {
    if (!note) return '';
    return parseMarkdown(note);
  };

  const getColorClass = (color) => {
    const colorMap = {
      'green': 'log-color-green',
      'yellow': 'log-color-yellow',
      'light-blue': 'log-color-light-blue',
      'light-green': 'log-color-light-green',
      'red': 'log-color-red',
      '': ''
    };
    return colorMap[color] || '';
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      {/* Previous Button (Left Side) */}
      {hasPrevious && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          title="Previous (Left Arrow)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next Button (Right Side) */}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          title="Next (Right Arrow)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Main Content - solid bg-primary base, colored tint as overlay to avoid transparency */}
      <div
        className="rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-primary)', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {getColorClass(currentLog.color || '') && (
          <div
            className={getColorClass(currentLog.color || '')}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' }}
            aria-hidden
          />
        )}
        <div className="p-8" style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div className="flex justify-end mb-6">
            <button
              onClick={onClose}
              className="text-3xl leading-none hover:opacity-80 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}
              title="Close (Esc)"
            >
              ×
            </button>
          </div>

          {/* Title and Date */}
          <h2 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Log Details</h2>
          <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>{formatDateTime(currentLog.log_date)}</p>

          {/* Short Description */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Short Description
            </label>
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{currentLog.short_description}</p>
          </div>

          {/* Note */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Note
            </label>
            <div
              className="text-lg whitespace-pre-wrap break-words"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{ __html: formatNote(currentLog.note) }}
            />
          </div>

          {/* Note by Worker - right aligned, worker highlighted like main view */}
          <div className="mb-6 text-right">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Note by <span className="badge badge-blue">{currentLog.worker_name}</span>
            </span>
          </div>

          {/* Future Reminder */}
          {currentLog.reminder_date && new Date(currentLog.reminder_date) > new Date() && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">⏰</span>
                <label className="block text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                  Future Reminder
                </label>
              </div>
              <p className="text-base mb-3" style={{ color: 'var(--text-primary)' }}>
                This log will automatically become active on{' '}
                <strong>{formatDateTime(currentLog.reminder_date)}</strong>
              </p>
              <button
                onClick={async () => {
                  if (window.confirm('Remove the future reminder? The log will remain archived.')) {
                    setClearReminderError(null);
                    try {
                      await clearReminder(currentLog.id);
                      onClose();
                      window.location.reload(); // Reload to reflect changes
                    } catch (error) {
                      setClearReminderError('Failed to clear reminder: ' + error.message);
                    }
                  }
                }}
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ backgroundColor: 'var(--warning)', color: 'white' }}
                title="Remove the future reminder - the log will remain archived and won't automatically activate"
              >
                Remove Reminder
              </button>
              {clearReminderError && (
                <p className="mt-2 text-sm" style={{ color: 'var(--danger)' }}>{clearReminderError}</p>
              )}
            </div>
          )}

          {/* Actions - text links, right aligned */}
          <div className="flex justify-end gap-2 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => {
                onEdit(currentLog);
                onClose();
              }}
              className="bg-transparent border-none p-0 font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title="Edit this log entry"
            >
              Edit
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <button
              onClick={() => {
                onArchive(currentLog.id, !currentLog.is_archived);
                onClose();
              }}
              className="bg-transparent border-none p-0 font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title={currentLog.is_archived ? "Restore this log" : "Archive this log"}
            >
              {currentLog.is_archived ? 'Restore' : 'Archive'}
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this log?')) {
                  onDelete(currentLog);
                  onClose();
                }
              }}
              className="bg-transparent border-none p-0 font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--danger)' }}
              title="Delete this log entry permanently"
            >
              Delete
            </button>
            <span style={{ color: 'var(--text-secondary)' }}>|</span>
            <button
              onClick={onClose}
              className="bg-transparent border-none p-0 font-medium hover:underline cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title="Close (Press Esc)"
            >
              Close
            </button>
          </div>

          {/* Progress Dots */}
          {logs.length > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6 mt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
              {logs.map((_, index) => (
                <div
                  key={index}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: index === currentIndex ? '2rem' : undefined,
                    backgroundColor: index === currentIndex ? 'var(--accent)' : 'var(--border-color)'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpandedLogView;
