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
    // Show at least 3 lines (~300 characters) before "read more"
    const maxLength = 300;
    
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
    
    // Truncate HTML while preserving tags
    let truncatedHtml = note;
    let textLength = 0;
    let inTag = false;
    let result = '';
    
    for (let i = 0; i < note.length; i++) {
      if (note[i] === '<') {
        inTag = true;
        result += note[i];
      } else if (note[i] === '>') {
        inTag = false;
        result += note[i];
      } else if (!inTag) {
        if (textLength < maxLength) {
          result += note[i];
          textLength++;
        } else {
          break;
        }
      } else {
        result += note[i];
      }
    }
    
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: result + '...' }} />
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
              const rowClass = log.is_archived 
                ? `bg-gray-100 ${colorClass}` 
                : `hover:bg-gray-50 ${colorClass}`;
              
              return (
              <tr
                key={log.id}
                className={`${rowClass.trim() || 'bg-white'} print-row`}
              >
                <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                  {formatDateTime(log.log_date)}
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.short_description}
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
                      className="text-blue-600 hover:text-blue-900 text-xs"
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

