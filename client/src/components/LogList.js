import React, { useState } from 'react';
import ExpandedLogView from './ExpandedLogView';
import { parseMarkdown } from '../utils/markdownParser';
import { formatDateCompact } from '../utils/dateFormat';

function LogList({ logs, loading, onEdit, onArchive, onDelete, showArchived, onPrint, onCreateLog, flashId }) {
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedLog, setExpandedLog] = useState(null);

  const toggleNote = (id) => {
    setExpandedNotes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const formatNote = (note) => {
    if (!note) return '';
    return parseMarkdown(note);
  };

  const truncateNote = (note, id) => {
    if (!note) return <div></div>;
    
    // ~5 lines at ~100 chars/line before "read more"
    const maxLength = 500;
    
    if (note.length <= maxLength) {
      const html = formatNote(note);
      return <div className="log-note-content" dangerouslySetInnerHTML={{ __html: html }} />;
    }
    
    const isExpanded = expandedNotes[id];
    if (isExpanded) {
      const html = formatNote(note);
      return (
        <>
          <div className="log-note-content" dangerouslySetInnerHTML={{ __html: html }} />
          <button
            onClick={() => toggleNote(id)}
            className="ml-1 font-medium hover:underline"
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Read less
          </button>
        </>
      );
    }
    
    let truncated = note.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      truncated = truncated.substring(0, lastSpace);
    }
    
    const html = formatNote(truncated + '...');
    return (
      <>
        <div
          className="log-note-content"
          style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button
          onClick={() => toggleNote(id)}
          className="ml-1 font-medium hover:underline"
          style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
        >
          Read more
        </button>
      </>
    );
  };

  if (loading) {
    return (
      <div className="card text-center" style={{ padding: '2rem' }}>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ marginBottom: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Logs</h2>
          {onCreateLog && (
            <button
              onClick={onCreateLog}
              className="btn-add-log"
              title="Create new log entry"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            {showArchived ? 'No archived logs found.' : 'No logs found. Create your first log entry!'}
          </p>
        </div>
      </div>
    );
  }

  const handlePrint = (e) => {
    e.preventDefault();
    if (onPrint) {
      onPrint(logs);
    }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="card-header" style={{ marginBottom: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          Logs {logs.length > 0 && `(${logs.length})`}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="no-print">
          <button
            type="button"
            onClick={handlePrint}
            style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9375rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            onMouseOver={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseOut={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            Print Visible Logs
          </button>
          {onCreateLog && (
            <button
              onClick={onCreateLog}
              className="btn-add-log"
              title="Create new log entry"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="table-container">
        <table className="dn-table" style={{ fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              <th style={{ width: '7%' }}>Date</th>
              <th style={{ width: '12%' }}>Short Description</th>
              <th style={{ width: '55%' }}>Note</th>
              <th style={{ width: '8%' }}>Worker</th>
              <th style={{ width: '18%' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="logs-table-body">
            {logs.map((log) => {
              const colorClass = getColorClass(log.color || '');
              const isFlashing = flashId === log.id;
              const hasFutureReminder = log.reminder_date && new Date(log.reminder_date) > new Date();
              const rowClass = [
                colorClass,
                (log.is_archived || hasFutureReminder) && 'log-row-muted',
                isFlashing && 'log-row-flash'
              ].filter(Boolean).join(' ');
              
              return (
              <tr
                key={log.id}
                className={`print-row ${rowClass}`}
              >
                <td style={{ whiteSpace: 'nowrap' }}>
                  {formatDateCompact(log.log_date)}
                </td>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {(log.reminder_date && new Date(log.reminder_date) > new Date()) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span
                          className="badge badge-orange"
                          title={`Future Reminder: Will activate on ${new Date(log.reminder_date).toLocaleString('de-DE')}`}
                        >
                          ⏰ {new Date(log.reminder_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <button
                          onClick={() => setExpandedLog(log)}
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem', flexShrink: 0 }}
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
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
                        {log.short_description}
                        {log.original_log_date && (
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                            {' '}({formatDateCompact(log.original_log_date)})
                          </span>
                        )}
                      </span>
                      {!(log.reminder_date && new Date(log.reminder_date) > new Date()) && (
                        <button
                          onClick={() => setExpandedLog(log)}
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem', flexShrink: 0 }}
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
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="max-w-full">
                    {truncateNote(log.note, log.id)}
                  </div>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <span className="badge badge-blue">
                    {log.worker_name}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }} className="no-print">
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => onEdit(log)}
                      className="btn btn-ghost"
                      style={{ color: 'var(--accent)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      title="Edit this log entry - modify date, description, note, worker, color, or reminder"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onArchive(log)}
                      className="btn btn-ghost"
                      style={{
                        color: log.is_archived ? 'var(--success)' : 'var(--warning)',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem'
                      }}
                      title={log.is_archived ? "Restore this log - make it visible in the main list again" : "Archive this log - hide it from the main list (can be viewed by enabling 'Show Archived')"}
                    >
                      {log.is_archived ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      onClick={() => onDelete(log)}
                      className="btn btn-ghost"
                      style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      title="Delete this log entry permanently - this action cannot be undone"
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

