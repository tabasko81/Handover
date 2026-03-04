import React, { useState, useEffect } from 'react';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import Filters from './components/Filters';
import Header from './components/Header';
import InfoSlide from './components/InfoSlide';
import UserLoginForm from './components/UserLoginForm';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Footer from './components/Footer';
import { fetchLogs, createLog, updateLog, archiveLog, deleteLog } from './services/api';
import { formatDateTime } from './utils/dateFormat';
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
  const [lastLogCheck, setLastLogCheck] = useState(null);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const [showNewLogsNotification, setShowNewLogsNotification] = useState(false);

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
      // Poll every 2 minutes to check for expired reminders and new logs
      const reminderPollingInterval = setInterval(() => {
        loadLogs();
      }, 2 * 60 * 1000);
      
      // Check for updates more frequently (every 30 seconds) but silently
      const updateCheckInterval = setInterval(checkForUpdates, 30 * 1000);
      
      return () => {
        clearInterval(reminderPollingInterval);
        clearInterval(updateCheckInterval);
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
  const checkForUpdates = async () => {
    if (isAuthenticated && !loading) {
      try {
        const response = await fetchLogs({
          ...filters,
          page: currentPage,
          limit: 20
        });
        
        // Check for new logs if we have previous logs
        if (lastLogCheck && logs.length > 0) {
          const newLogs = response.data.filter(newLog => {
            // Check if it's a completely new log (not in our current list)
            const isNew = !logs.some(existingLog => existingLog.id === newLog.id);
            
            // Also check if this log is newer than our last check
            if (!isNew) {
              const newLogDate = new Date(newLog.log_date);
              const lastCheckDate = new Date(lastLogCheck);
              return newLogDate > lastCheckDate;
            }
            
            return isNew;
          });
          
          if (newLogs.length > 0) {
            setNewLogsCount(newLogs.length);
            setShowNewLogsNotification(true);
            
            // Auto-hide notification after 10 seconds
            setTimeout(() => {
              setShowNewLogsNotification(false);
            }, 10000);
          }
        }
        
        // Update last check time
        setLastLogCheck(new Date().toISOString());
      } catch (err) {
        // Silently fail for update checks
        console.error('Failed to check for updates:', err);
      }
    }
  };

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
      setLastLogCheck(new Date().toISOString());
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
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { margin-bottom: 10px; }
          .info { margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .worker-badge { background-color: #dbeafe; padding: 2px 6px; border-radius: 12px; font-size: 10px; display: inline-block; }
          @page { margin: 1cm; }
          @media print {
            body { padding: 0; }
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
              <th style="width: 15%;">Date</th>
              <th style="width: 18%;">Short Description</th>
              <th style="width: 52%;">Note</th>
              <th style="width: 15%;">Worker</th>
            </tr>
          </thead>
          <tbody>
            ${logsToPrint.map(log => {
              const noteText = log.note.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
              return `
                <tr>
                  <td>${formatDateTime(log.log_date)}</td>
                  <td>${log.short_description}</td>
                  <td>${noteText}</td>
                  <td><span class="worker-badge">${log.worker_name}</span></td>
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

        {showNewLogsNotification && newLogsCount > 0 && (
          <div className="alert alert-info flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-lg mr-2">🔔</span>
              <span>
                {newLogsCount} new log{newLogsCount > 1 ? 's' : ''} available.
                <button
                  onClick={() => {
                    setShowNewLogsNotification(false);
                    setNewLogsCount(0);
                    loadLogs();
                  }}
                  className="ml-2 font-semibold underline hover:no-underline"
                  style={{ color: 'var(--accent)' }}
                >
                  Refresh to view
                </button>
              </span>
            </div>
            <button
              onClick={() => {
                setShowNewLogsNotification(false);
                setNewLogsCount(0);
              }}
              className="text-xl leading-none"
              style={{ color: 'var(--text-secondary)' }}
              title="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
          onToggleArchived={() => handleFilterChange({ ...filters, archived: !filters.archived })}
        />
          </div>
        </div>

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
          onArchive={handleArchiveLog}
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

