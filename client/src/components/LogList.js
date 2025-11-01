import React, { useState } from 'react';

function LogList({ logs, loading, onEdit, onArchive, onDelete, showArchived }) {
  const [expandedNotes, setExpandedNotes] = useState({});

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

  const truncateNote = (note, id) => {
    // Strip HTML tags for length calculation
    const textContent = note.replace(/<[^>]*>/g, '');
    const maxLength = 100;
    
    if (textContent.length <= maxLength) {
      return <div dangerouslySetInnerHTML={{ __html: note }} />;
    }
    
    const isExpanded = expandedNotes[id];
    if (isExpanded) {
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: note }} />
          <button
            onClick={() => toggleNote(id)}
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            Read less
          </button>
        </>
      );
    }
    
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: textContent.substring(0, maxLength) + '...' }} />
        <button
          onClick={() => toggleNote(id)}
          className="text-blue-600 hover:text-blue-800 ml-1"
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Note
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Worker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => {
              const colorClass = getColorClass(log.color || '');
              const rowClass = log.is_archived 
                ? `bg-gray-100 ${colorClass}` 
                : `hover:bg-gray-50 ${colorClass}`;
              
              return (
              <tr
                key={log.id}
                className={rowClass.trim() || 'bg-white'}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(log.log_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.short_description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="max-w-md">
                    {truncateNote(log.note, log.id)}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {log.worker_name}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(log)}
                      className="text-blue-600 hover:text-blue-900"
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
                      onClick={() => onDelete(log.id)}
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
    </div>
  );
}

export default LogList;

