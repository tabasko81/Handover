import React, { useState, useEffect } from 'react';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import Filters from './components/Filters';
import Header from './components/Header';
import InfoSlide from './components/InfoSlide';
import UserLoginForm from './components/UserLoginForm';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import ArchiveConfirmationModal from './components/ArchiveConfirmationModal';
import Footer from './components/Footer';
import { fetchLogs, createLog, updateLog, archiveLog, deleteLog } from './services/api';
import { formatDateCompact } from './utils/dateFormat';
import { parseMarkdown } from './utils/markdownParser';
import { fetchPublicConfig } from './services/configApi';
import { userLogin, verifyUserToken } from './services/authApi';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    worker_name: '',
    start_date: '',
    end_date: '',
    archived: false
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_entries: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [flashId, setFlashId] = useState(null);
  const [pageName, setPageName] = useState('Shift Handover Log');
  // headerColor is used to update CSS variable, but not directly in JSX
  // eslint-disable-next-line no-unused-vars
  const [headerColor, setHeaderColor] = useState('#2563eb'); // eslint-disable-line no-unused-vars
  useEffect(() => {
    checkLoginStatus();
    loadGlobalConfig();
    
    // Listen for theme updates from Backoffice
    const handleConfigUpdate = () => {
      loadGlobalConfig();
    };
    window.addEventListener('pageNameUpdated', handleConfigUpdate);
    window.addEventListener('headerColorUpdated', handleConfigUpdate);
    return () => {
      window.removeEventListener('pageNameUpdated', handleConfigUpdate);
      window.removeEventListener('headerColorUpdated', handleConfigUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update CSS variable when header color changes
  useEffect(() => {
    const savedColor = localStorage.getItem('header_color') || '#2563eb';
    setHeaderColor(savedColor);
    document.documentElement.style.setProperty('--header-color', savedColor);
  }, []);

  // Listen for header color changes
  useEffect(() => {
    const handleColorUpdate = () => {
      const savedColor = localStorage.getItem('header_color') || '#2563eb';
      setHeaderColor(savedColor);
      document.documentElement.style.setProperty('--header-color', savedColor);
    };
    window.addEventListener('headerColorUpdated', handleColorUpdate);
    return () => window.removeEventListener('headerColorUpdated', handleColorUpdate);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadLogs();
      // Poll every 2 minutes to check for expired reminders
      const reminderPollingInterval = setInterval(() => {
        loadLogs();
      }, 2 * 60 * 1000);

      return () => {
        clearInterval(reminderPollingInterval);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, isAuthenticated]);

  const checkLoginStatus = async () => {
    setCheckingAuth(true);
    try {
      const token = localStorage.getItem('user_token');
      if (token) {
        const isValid = await verifyUserToken();
        setIsAuthenticated(isValid);
        if (!isValid) {
          localStorage.removeItem('user_token');
        }
      } else {
        // No token, user needs to login
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to check login status:', error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadGlobalConfig = async () => {
    try {
      const config = await fetchPublicConfig();
      if (config) {
        if (config.page_name) {
          setPageName(config.page_name);
          localStorage.setItem('page_name', config.page_name);
        }
        if (config.header_color) {
          const currentColor = localStorage.getItem('header_color');
          // Only update if color actually changed to avoid unnecessary events
          if (currentColor !== config.header_color) {
            localStorage.setItem('header_color', config.header_color);
            setHeaderColor(config.header_color);
            document.documentElement.style.setProperty('--header-color', config.header_color);
            window.dispatchEvent(new CustomEvent('headerColorUpdated'));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load global config:', error);
    }
  };

  // Check for log updates periodically
  const loadLogs = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetchLogs({
        ...filters,
        page: currentPage,
        limit: 20
      });
      
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleCreateLog = async (logData) => {
    try {
      await createLog(logData);
      setShowForm(false);
      loadLogs();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateLog = async (id, logData) => {
    try {
      await updateLog(id, logData);
      setShowForm(false);
      setEditingLog(null);
      loadLogs();
      // Trigger flash animation on updated item for 3 seconds
      setFlashId(id);
    } catch (err) {
      throw err;
    }
  };

  // Cleanup flash animation on unmount
  useEffect(() => {
    if (flashId) {
      const timer = setTimeout(() => setFlashId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashId]);

  const handleArchiveLog = async (id, isArchived) => {
    try {
      await archiveLog(id, isArchived);
      loadLogs();
    } catch (err) {
      setError(err.message || 'Failed to archive log');
    }
  };

  const [archiveModal, setArchiveModal] = useState({ isOpen: false, logId: null, logInfo: null });
  const [archiveSuccessMessage, setArchiveSuccessMessage] = useState(false);
  const [blinkArchivedCheckbox, setBlinkArchivedCheckbox] = useState(false);

  const handleArchiveClick = (log) => {
    if (log.is_archived) {
      handleArchiveLog(log.id, false);
    } else {
      setArchiveModal({ isOpen: true, logId: log.id, logInfo: log });
    }
  };

  const handleArchiveConfirm = async () => {
    if (archiveModal.logId) {
      try {
        await archiveLog(archiveModal.logId, true);
        loadLogs();
        setArchiveModal({ isOpen: false, logId: null, logInfo: null });
        setArchiveSuccessMessage(true);
        setBlinkArchivedCheckbox(true);
      } catch (err) {
        setError(err.message || 'Failed to archive log');
        setArchiveModal({ isOpen: false, logId: null, logInfo: null });
      }
    }
  };

  const handleArchiveCancel = () => {
    setArchiveModal({ isOpen: false, logId: null, logInfo: null });
  };

  useEffect(() => {
    if (archiveSuccessMessage || blinkArchivedCheckbox) {
      const timer = setTimeout(() => {
        setArchiveSuccessMessage(false);
        setBlinkArchivedCheckbox(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [archiveSuccessMessage, blinkArchivedCheckbox]);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, logId: null, logInfo: null });

  const handleDeleteClick = (log) => {
    setDeleteModal({ isOpen: true, logId: log.id, logInfo: log });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.logId) {
      try {
        await deleteLog(deleteModal.logId);
        loadLogs();
        setDeleteModal({ isOpen: false, logId: null, logInfo: null });
      } catch (err) {
        setError(err.message || 'Failed to delete log');
        setDeleteModal({ isOpen: false, logId: null, logInfo: null });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, logId: null, logInfo: null });
  };

  const handleEditClick = (log) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLog(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sanitizeNoteForPrint = (note) => {
    if (!note) return '';
    return parseMarkdown(note);
  };

  const handlePrint = (logsToPrint) => {
    const printWindow = window.open('', '_blank');

    // Format date and time as dd.mm.yyyy_hhmm (German format)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const dateFormatted = `${day}.${month}.${year}_${hours}${minutes}`;

    // Get page name from state or localStorage
    const currentPageName = pageName || localStorage.getItem('page_name') || 'Shift Handover Log';
    const printTitle = `${currentPageName} ${dateFormatted}`;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${printTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; color: #000; }
          h1 { margin-bottom: 10px; color: #000; }
          .info { margin-bottom: 20px; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; text-align: left; color: #000; }
          th { background-color: #f2f2f2; font-weight: bold; padding: 4px 4px; font-size: 10px; }
          td { padding: 4px 4px; font-size: 11px; }
          .col-date, .col-worker { padding: 3px 4px; font-size: 10px; white-space: nowrap; }
          .col-desc { padding: 3px 4px; font-size: 10px; }
          .col-note { padding: 4px 6px; }
          th.col-date, th.col-desc, th.col-worker { width: 1%; }
          th.col-note { width: auto; }
          .worker-badge { background-color: #e5e7eb; color: #000; padding: 1px 4px; border-radius: 4px; font-size: 9px; display: inline-block; }
          .note-cell { color: #000; vertical-align: top; white-space: pre-wrap; }
          .note-cell * { color: #000 !important; }
          .note-cell p, .note-cell div { margin: 0.5em 0; }
          .note-cell p:first-child, .note-cell div:first-child { margin-top: 0; }
          .note-cell p:last-child, .note-cell div:last-child { margin-bottom: 0; }
          .note-cell ul, .note-cell ol { margin: 0.5em 0; padding-left: 1.5em; }
          .note-cell li { margin: 0.25em 0; }
          .note-cell pre, .note-cell code { background: #f5f5f5 !important; color: #000 !important; padding: 2px 4px; margin: 0.25em 0; }
          .note-cell pre { padding: 6px; white-space: pre-wrap; }
          .note-cell a { color: #000 !important; text-decoration: underline; }
          @page { margin: 1cm; }
          @media print {
            body { padding: 0; }
            .note-cell, .note-cell * { color: #000 !important; }
            .note-cell pre, .note-cell code { background: #f5f5f5 !important; color: #000 !important; }
            .worker-badge { background-color: #e5e7eb !important; color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <h1>${printTitle}</h1>
        <div class="info">
          Date: ${new Date().toLocaleDateString('de-DE')}<br>
          Generated: ${new Date().toLocaleString('de-DE')}<br>
          Total Entries: ${logsToPrint.length}
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-date">Date</th>
              <th class="col-desc">Short Description</th>
              <th class="col-note">Note</th>
              <th class="col-worker">Worker</th>
            </tr>
          </thead>
          <tbody>
            ${logsToPrint.map(log => {
              const noteHtml = sanitizeNoteForPrint(log.note);
              const shortDesc = log.original_log_date
                ? `${log.short_description} (${formatDateCompact(log.original_log_date)})`
                : log.short_description;
              return `
                <tr>
                  <td class="col-date">${formatDateCompact(log.log_date)}</td>
                  <td class="col-desc">${shortDesc}</td>
                  <td class="col-note note-cell">${noteHtml}</td>
                  <td class="col-worker"><span class="worker-badge">${log.worker_name}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleUserLogin = async (username, password) => {
    try {
      await userLogin(username, password);
      setIsAuthenticated(true);
      setLoginError('');
    } catch (error) {
      setLoginError(error.message || 'Login failed');
      throw error;
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="login-page">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if login is enabled and user is not authenticated
  if (!isAuthenticated) {
    return (
      <UserLoginForm
        onLogin={handleUserLogin}
        error={loginError}
      />
    );
  }

  return (
    <div className="app-container">
      <InfoSlide />
      <Header />
      
      <main className="main-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Filters
              filters={filters}
              onFilterChange={handleFilterChange}
              onToggleArchived={() => handleFilterChange({ ...filters, archived: !filters.archived })}
              blinkArchivedCheckbox={blinkArchivedCheckbox}
            />
          </div>
        </div>

        {archiveSuccessMessage && (
          <div
            className="card"
            style={{
              marginBottom: '0.75rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--accent-light)',
              border: '1px solid var(--accent)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem'
            }}
          >
            Log archived. Enable <strong>Show Archived</strong> in the search section to view it again.
          </div>
        )}

        {showForm && (
          <LogForm
            log={editingLog}
            onSubmit={editingLog ? (data) => handleUpdateLog(editingLog.id, data) : handleCreateLog}
            onClose={handleFormClose}
          />
        )}

        <LogList
          logs={logs}
          loading={loading}
          onEdit={handleEditClick}
          onArchive={handleArchiveClick}
          onDelete={handleDeleteClick}
          showArchived={filters.archived}
          onPrint={handlePrint}
          onCreateLog={() => setShowForm(true)}
          flashId={flashId}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          logInfo={deleteModal.logInfo}
        />

        <ArchiveConfirmationModal
          isOpen={archiveModal.isOpen}
          onConfirm={handleArchiveConfirm}
          onCancel={handleArchiveCancel}
          logInfo={archiveModal.logInfo}
        />

        {pagination.total_pages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem 1rem', color: 'var(--text-secondary)' }}>
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;

