import React, { useState } from 'react';
import ExpandedLogView from './ExpandedLogView';
import { parseMarkdown } from '../utils/markdownParser';

function LogList({ logs, loading, onEdit, onArchive, onDelete, showArchived, onPrint, flashId, compactMode }) {
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
      'green': 'bg-green-100 dark:bg-green-900 dark:bg-opacity-40',
      'yellow': 'bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-40',
      'light-blue': 'bg-blue-100 dark:bg-blue-900 dark:bg-opacity-40',
      'light-green': 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20',
      'red': 'bg-red-100 dark:bg-red-900 dark:bg-opacity-40',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
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
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`} style={{ width: '12%' }}>
                Date
              </th>
              <th className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`} style={{ width: '15%' }}>
                Short Description
              </th>
              <th className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`} style={{ width: '45%' }}>
                Note
              </th>
              <th className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`} style={{ width: '8%' }}>
                Worker
              </th>
              <th className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider`} style={{ width: '20%' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="logs-table-body">
            {logs.map((log) => {
              const colorClass = getColorClass(log.color || '');
              const isFlashing = flashId === log.id;
              const rowClass = log.is_archived 
                ? `bg-gray-100 dark:bg-gray-900 ${colorClass}` 
                : `hover:bg-gray-50 dark:hover:bg-gray-700 ${colorClass}`;
              
              return (
              <tr
                key={log.id}
                className={`${rowClass.trim() || 'bg-white dark:bg-gray-800'} print-row transition-colors duration-200 ${
                  isFlashing ? 'bg-green-300 dark:bg-green-700 animate-pulse' : ''
                }`}
              >
                <td className={`px-2 ${compactMode ? 'py-1' : 'py-2'} whitespace-nowrap text-sm text-gray-900 dark:text-gray-200`}>
                  {formatDateTime(log.log_date)}
                </td>
                <td className={`px-2 ${compactMode ? 'py-1' : 'py-2'} whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200`}>
                  <div className="flex items-center space-x-1">
                    <span>{log.short_description}</span>
                    <button
                      onClick={() => setExpandedLog(log)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1 flex-shrink-0"
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
                <td className={`px-2 ${compactMode ? 'py-1' : 'py-2'} text-sm text-gray-700 dark:text-gray-300`}>
                  <div className="max-w-full">
                    {truncateNote(log.note, log.id)}
                  </div>
                </td>
                <td className={`px-2 ${compactMode ? 'py-1' : 'py-2'} whitespace-nowrap text-sm text-gray-900 dark:text-gray-200`}>
                  <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {log.worker_name}
                  </span>
                </td>
                <td className={`px-2 ${compactMode ? 'py-1' : 'py-2'} whitespace-nowrap text-sm font-medium no-print`}>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onEdit(log)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-xs"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onArchive(log.id, !log.is_archived)}
                      className={log.is_archived 
                        ? "text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        : "text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                      }
                      title={log.is_archived ? "Restore" : "Archive"}
                    >
                      {log.is_archived ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      onClick={() => onDelete(log)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
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
          onNavigate={(newLog) => setExpandedLog(newLog)}
        />
      )}
    </div>
  );
}

export default LogList;

