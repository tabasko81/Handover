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
import { fetchPublicConfig } from './services/configApi';
import { userLogin, verifyUserToken, userLogout } from './services/authApi';

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
  const [headerColor, setHeaderColor] = useState('#2563eb');

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
      const reminderPollingInterval = setInterval(loadLogs, 2 * 60 * 1000);
      return () => clearInterval(reminderPollingInterval);
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

  const loadLogs = async () => {
    setLoading(true);
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
      setLoading(false);
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
    
    // Format date and time as yyyy.mm.dd_hhmm
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    const dateFormatted = `${year}.${month}.${day}_${hours}${minutes}`;
    
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
          Date: ${new Date().toLocaleDateString('en-GB')}<br>
          Generated: ${new Date().toLocaleString('en-GB')}<br>
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

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
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
    <div className="min-h-screen bg-gray-50">
      <InfoSlide />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="text-white font-bold py-2 px-4 rounded shadow hover:opacity-90"
            style={{ backgroundColor: 'var(--header-color)' }}
            title="Create a new log entry with date, description, note, worker name, and optional color coding"
          >
            Create New Log
          </button>
        </div>

        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          onToggleArchived={() => handleFilterChange({ ...filters, archived: !filters.archived })}
        />

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
          flashId={flashId}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          logInfo={deleteModal.logInfo}
        />

        {pagination.total_pages > 1 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.total_pages}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400"
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

