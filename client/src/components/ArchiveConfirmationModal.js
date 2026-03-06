import React from 'react';

function ArchiveConfirmationModal({ isOpen, onConfirm, onCancel, logInfo }) {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ flexShrink: 0, width: '48px', height: '48px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                style={{ width: '24px', height: '24px', color: 'var(--warning)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Archive Log Entry</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>Hide from main list</p>
            </div>
          </div>

          {logInfo && (
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                <strong>Date:</strong> {new Date(logInfo.log_date).toLocaleString('de-DE')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                <strong>Description:</strong> {logInfo.short_description}
              </p>
            </div>
          )}

          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Archive this log? It will be hidden from the main list. You can view it anytime by enabling <strong>Show Archived</strong> in the search section.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn"
              style={{ background: 'var(--warning)', color: 'white' }}
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArchiveConfirmationModal;
