import React, { useState } from 'react';
import ExpandedLogView from './ExpandedLogView';
import { parseMarkdown } from '../utils/markdownParser';

function LogList({ logs, loading, onEdit, onArchive, onDelete, showArchived, onPrint, flashId }) {
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedLog, setExpandedLog] = useState(null);

  const toggleNote = (id) => {
    setExpandedNotes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  const formatNote = (note) => {
    if (!note) return '';
    return parseMarkdown(note);
  };

  const truncateNote = (note, id) => {
    if (!note) return <div></div>;
    
    // Show double the characters (600) before "read more"
    const maxLength = 600;
    
    if (note.length <= maxLength) {
      // Format note with newlines and @mentions
      const html = formatNote(note);
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
    
    const isExpanded = expandedNotes[id];
    if (isExpanded) {
      // Show full note
      const html = formatNote(note);
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: html }} />
          <button
            onClick={() => toggleNote(id)}
            className="text-blue-600 hover:text-blue-800 ml-1 font-semibold"
          >
            Read less
          </button>
        </>
      );
    }
    
    // Truncate text (simple truncation)
    let truncated = note.substring(0, maxLength);
    // Try to truncate at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      truncated = truncated.substring(0, lastSpace);
    }
    
    // Format truncated note
    const html = formatNote(truncated + '...');
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <button
          onClick={() => toggleNote(id)}
          className="ml-1 px-2 py-1 bg-blue-500 text-white font-bold rounded hover:bg-blue-600 underline shadow-sm transition-all"
        >
          Read more
        </button>
      </>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <p className="text-gray-600 text-lg">
          {showArchived ? 'No archived logs found.' : 'No logs found. Create your first log entry!'}
        </p>
      </div>
    );
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint(logs);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b">
        <h2 className="text-sm font-semibold text-gray-700">
          Logs {logs.length > 0 && `(${logs.length})`}
        </h2>
        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow no-print"
        >
          Print Visible Logs
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider" style={{ width: '12%' }}>
                Date
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                Short Description
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider" style={{ width: '45%' }}>
                Note
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider" style={{ width: '8%' }}>
                Worker
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 uppercase tracking-wider" style={{ width: '20%' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" id="logs-table-body">
            {logs.map((log) => {
              const colorClass = getColorClass(log.color || '');
              const isFlashing = flashId === log.id;
              const hasFutureReminder = log.reminder_date && new Date(log.reminder_date) > new Date();
              const rowClass = log.is_archived || hasFutureReminder
                ? `bg-gray-100 ${colorClass}` 
                : `hover:bg-gray-50 ${colorClass}`;
              
              return (
              <tr
                key={log.id}
                className={`${rowClass.trim() || 'bg-white'} print-row transition-colors duration-200 ${
                  isFlashing ? 'bg-green-300 animate-pulse' : ''
                }`}
              >
                <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(log.log_date)}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center space-x-1">
                    <span>{log.short_description}</span>
                    {log.reminder_date && new Date(log.reminder_date) > new Date() && (
                      <span
                        className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-300 ml-2"
                        title={`Future Reminder: Will activate on ${new Date(log.reminder_date).toLocaleString('en-GB')}`}
                      >
                        ⏰ {new Date(log.reminder_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                    <button
                      onClick={() => setExpandedLog(log)}
                      className="text-blue-600 hover:text-blue-800 ml-1 flex-shrink-0"
                      title="View expanded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-sm text-gray-700">
                  <div className="max-w-full">
                    {truncateNote(log.note, log.id)}
                  </div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {log.worker_name}
                  </span>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium no-print">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEdit(log)}
                      className="text-xs px-2 py-1 rounded text-white"
                      style={{ backgroundColor: 'var(--header-color)' }}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onArchive(log.id, !log.is_archived)}
                      className={log.is_archived 
                        ? "text-green-600 hover:text-green-900"
                        : "text-yellow-600 hover:text-yellow-900"
                      }
                      title={log.is_archived ? "Restore" : "Archive"}
                    >
                      {log.is_archived ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      onClick={() => onDelete(log)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Log View Modal */}
      {expandedLog && (
        <ExpandedLogView
          log={expandedLog}
          logs={logs}
          onClose={() => setExpandedLog(null)}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          onNavigate={(newLog) => setExpandedLog(newLog)}
        />
      )}
    </div>
  );
}

export default LogList;

