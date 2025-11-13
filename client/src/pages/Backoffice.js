import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConfig, updateConfig } from '../services/configApi';
import { login, changePassword, verifyToken, logout } from '../services/authApi';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import RichTextEditor from '../components/RichTextEditor';
import UserManagement from '../components/UserManagement';

function Backoffice() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState({
    page_name: 'Shift Handover Log',
    permanent_info: '',
    login_expiry_enabled: true,
    login_expiry_hours: 24
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (config.page_name) {
      localStorage.setItem('page_name', config.page_name);
    }
  }, [config.page_name]);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    const isValid = await verifyToken();
    if (isValid) {
      setIsAuthenticated(true);
    } else {
      localStorage.removeItem('admin_token');
    }
    setLoading(false);
  };

  const handleLogin = async (username, password) => {
    await login(username, password);
    setIsAuthenticated(true);
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await changePassword(currentPassword, newPassword);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await fetchConfig();
      setConfig({
        page_name: data.page_name || 'Shift Handover Log',
        permanent_info: data.permanent_info || '',
        login_expiry_enabled: data.login_expiry_enabled !== undefined ? data.login_expiry_enabled : true,
        login_expiry_hours: data.login_expiry_hours || 24
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      if (error.message.includes('Authentication')) {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_token');
      } else {
        setMessage({ type: 'error', text: 'Failed to load configuration' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateConfig(config);
      localStorage.setItem('page_name', config.page_name);
      window.dispatchEvent(new CustomEvent('pageNameUpdated'));
      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      if (error.message.includes('Authentication')) {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_token');
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginForm
        onLogin={handleLogin}
        firstLogin={false}
        onPasswordChange={handlePasswordChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Backoffice Configuration</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-4 rounded ${
                message.type === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700' 
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Name
                </label>
                <input
                  type="text"
                  value={config.page_name}
                  onChange={(e) => handleChange('page_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter page name"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This name will be displayed in the header
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permanent Information
                </label>
                <RichTextEditor
                  value={config.permanent_info || ''}
                  onChange={(html) => handleChange('permanent_info', html)}
                  maxLength={5000}
                  placeholder="Enter permanent information that will be visible in the info panel... Use @user or @all to mention someone."
                />
                <p className="mt-1 text-sm text-gray-500">
                  This information will be displayed in the permanent info slide (accessible via the (i) button on the left). Use the formatting buttons to format the text.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Settings</h3>
                
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.login_expiry_enabled}
                      onChange={(e) => handleChange('login_expiry_enabled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Enable Login Expiry
                      </span>
                      <p className="text-sm text-gray-500">
                        When enabled, users must re-login after the set time period
                      </p>
                    </div>
                  </label>
                </div>

                {config.login_expiry_enabled && (
                  <div className="pl-8 border-l-2 border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login Expiry (Hours)
                    </label>
                    <input
                      type="number"
                      value={config.login_expiry_hours}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 168) {
                          handleChange('login_expiry_hours', value);
                        }
                      }}
                      min="1"
                      max="168"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      How long the login session lasts. Range: 1 hour to 168 hours (1 week). Default: 24 hours.
                    </p>
                  </div>
                )}

                {!config.login_expiry_enabled && (
                  <div className="pl-8 border-l-2 border-gray-200">
                    <p className="text-sm text-gray-500 italic">
                      Login sessions will not expire. Users will remain logged in until they manually log out.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <UserManagement />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Backoffice;
