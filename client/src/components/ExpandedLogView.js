import React, { useEffect, useState } from 'react';
import { parseMarkdown } from '../utils/markdownParser';

function ExpandedLogView({ log, logs, onClose, onEdit, onArchive, onNavigate }) {
  const [currentLog, setCurrentLog] = useState(log);

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

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNote = (note) => {
    if (!note) return '';
    return parseMarkdown(note);
  };

  const getColorClass = (color) => {
    const colorMap = {
      'green': 'bg-green-100',
      'yellow': 'bg-yellow-100',
      'light-blue': 'bg-blue-100',
      'light-green': 'bg-green-50',
      'red': 'bg-red-100',
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
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
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
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white hover:bg-gray-100 text-gray-700 rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
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

      {/* Main Content */}
      <div
        className={`rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${getColorClass(currentLog.color || '') || 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">Log Details</h2>
              {logs.length > 1 && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentIndex + 1} of {logs.length}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              title="Close (Esc)"
            >
              ×
            </button>
          </div>

          {/* Date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Date & Time
            </label>
            <p className="text-xl text-gray-900">{formatDateTime(currentLog.log_date)}</p>
          </div>

          {/* Short Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Short Description
            </label>
            <p className="text-xl font-semibold text-gray-900">{currentLog.short_description}</p>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Note
            </label>
            <div
              className="text-lg text-gray-900 whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: formatNote(currentLog.note) }}
            />
          </div>

          {/* Worker */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Worker
            </label>
            <span className="px-3 py-1.5 inline-flex text-base font-semibold rounded-full bg-blue-100 text-blue-800">
              {currentLog.worker_name}
            </span>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                onEdit(currentLog);
                onClose();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-lg"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onArchive(currentLog.id, !currentLog.is_archived);
                onClose();
              }}
              className={`px-6 py-3 rounded-md font-medium text-lg ${
                currentLog.is_archived
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {currentLog.is_archived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium text-lg ml-auto"
            >
              Close
            </button>
          </div>

          {/* Progress Dots */}
          {logs.length > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6 border-t border-gray-200 mt-6">
              {logs.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-blue-600 w-8'
                      : 'bg-gray-300'
                  }`}
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
