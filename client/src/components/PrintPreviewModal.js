import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseMarkdown } from '../utils/markdownParser';
import { formatDateCompact } from '../utils/dateFormat';

const FIT_STORAGE_KEY = 'print_preview_fit';

function sanitizeNoteForPrint(note) {
  if (!note) return '';
  return parseMarkdown(note);
}

function buildPrintTitle(pageName) {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const dateFormatted = `${day}.${month}.${year}_${hours}${minutes}`;
  const currentPageName = pageName || localStorage.getItem('page_name') || 'Shift Handover Log';
  return `${currentPageName} ${dateFormatted}`;
}

function PrintPreviewModal({ open, onClose, logs, pageName }) {
  const [fitToWindow, setFitToWindow] = useState(() => {
    const v = localStorage.getItem(FIT_STORAGE_KEY);
    if (v === null) return true;
    return v === '1';
  });

  useEffect(() => {
    localStorage.setItem(FIT_STORAGE_KEY, fitToWindow ? '1' : '0');
  }, [fitToWindow]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const printTitle = buildPrintTitle(pageName);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modal = (
    <div id="print-preview-mount">
      <div className="print-preview-backdrop" role="dialog" aria-modal="true" aria-labelledby="print-preview-title" onClick={handleBackdropClick}>
        <div className="print-preview-panel" onClick={(e) => e.stopPropagation()}>
          <div className="print-preview-toolbar no-print">
            <h2 id="print-preview-title" className="print-preview-toolbar-title">
              Print preview
            </h2>
            <div className="print-preview-toolbar-actions">
              <label className="print-preview-fit-toggle">
                <input
                  type="checkbox"
                  checked={fitToWindow}
                  onChange={(e) => setFitToWindow(e.target.checked)}
                />
                <span>Fit to window</span>
              </label>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                Print
              </button>
            </div>
          </div>
          <div className={`print-preview-scroll ${fitToWindow ? 'print-preview-fit' : 'print-preview-actual'}`}>
            <div id="print-preview-root" className="print-sheet">
              <h1 className="print-sheet-title">{printTitle}</h1>
              <div className="print-sheet-info">
                Date: {new Date().toLocaleDateString('de-DE')}
                <br />
                Generated: {new Date().toLocaleString('de-DE')}
                <br />
                Total Entries: {logs.length}
              </div>
              <table className="print-sheet-table">
                <thead>
                  <tr>
                    <th className="col-date">Date</th>
                    <th className="col-desc">Short Description</th>
                    <th className="col-note">Note</th>
                    <th className="col-worker">Worker</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const noteHtml = sanitizeNoteForPrint(log.note);
                    const shortDesc = log.original_log_date
                      ? `${log.short_description} (${formatDateCompact(log.original_log_date)})`
                      : log.short_description;
                    return (
                      <tr key={log.id}>
                        <td className="col-date">{formatDateCompact(log.log_date)}</td>
                        <td className="col-desc">{shortDesc}</td>
                        <td
                          className="col-note note-cell"
                          dangerouslySetInnerHTML={{ __html: noteHtml }}
                        />
                        <td className="col-worker">
                          <span className="worker-badge">{log.worker_name}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default PrintPreviewModal;
