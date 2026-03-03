import React from 'react';

function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, logInfo }) {
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
            <div style={{ flexShrink: 0, width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg
                style={{ width: '24px', height: '24px', color: 'var(--danger)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div style={{ marginLeft: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Delete Log Entry</h3>
              <p className="card-subtitle" style={{ margin: 0 }}>This action cannot be undone</p>
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
            Are you sure you want to delete this log entry? This action cannot be undone.
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
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;

