import React, { useState } from 'react';

function LogList({ logs, loading, onEdit, onArchive, onDelete, showArchived, onPrint }) {
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

  const handlePrint = () => {
    if (onPrint) {
      onPrint(logs);
    } else {
      // Default print function
      const printWindow = window.open('', '_blank');
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Shift Handover Logs</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .worker-badge { background-color: #dbeafe; padding: 2px 6px; border-radius: 12px; font-size: 10px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>Shift Handover Logs</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Short Description</th>
                <th>Note</th>
                <th>Worker</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td>${formatDateTime(log.log_date)}</td>
                  <td>${log.short_description}</td>
                  <td>${log.note.replace(/<[^>]*>/g, '')}</td>
                  <td><span class="worker-badge">${log.worker_name}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-2 border-b dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '12%' }}>
                Date
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '15%' }}>
                Short Description
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '45%' }}>
                Note
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '8%' }}>
                Worker
              </th>
              <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '20%' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="logs-table-body">
            {logs.map((log) => {
              const colorClass = getColorClass(log.color || '');
              const rowClass = log.is_archived 
                ? `bg-gray-100 dark:bg-gray-700 ${colorClass}` 
                : `hover:bg-gray-50 dark:hover:bg-gray-700 ${colorClass}`;
              
              return (
              <tr
                key={log.id}
                className={`${rowClass.trim() || 'bg-white dark:bg-gray-800'} print-row`}
              >
                <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatDateTime(log.log_date)}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                  {log.short_description}
                </td>
                <td className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <div className="max-w-full">
                    {truncateNote(log.note, log.id)}
                  </div>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <span className="px-1.5 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {log.worker_name}
                  </span>
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium no-print">
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
                      onClick={() => onDelete(log.id)}
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
    </div>
  );
}

export default LogList;

