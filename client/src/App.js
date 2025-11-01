import React, { useState, useEffect } from 'react';
import LogForm from './components/LogForm';
import LogList from './components/LogList';
import Filters from './components/Filters';
import Header from './components/Header';
import { fetchLogs, createLog, updateLog, archiveLog, deleteLog } from './services/api';

function App() {
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

  useEffect(() => {
    loadLogs();
  }, [filters, currentPage]);

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
      setEditingLog(null);
      loadLogs();
    } catch (err) {
      throw err;
    }
  };

  const handleArchiveLog = async (id, isArchived) => {
    try {
      await archiveLog(id, isArchived);
      loadLogs();
    } catch (err) {
      setError(err.message || 'Failed to archive log');
    }
  };

  const handleDeleteLog = async (id) => {
    if (window.confirm('Are you sure you want to delete this log entry? This action cannot be undone.')) {
      try {
        await deleteLog(id);
        loadLogs();
      } catch (err) {
        setError(err.message || 'Failed to delete log');
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
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
          onDelete={handleDeleteLog}
          showArchived={filters.archived}
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
    </div>
  );
}

export default App;

