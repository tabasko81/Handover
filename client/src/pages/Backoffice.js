import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConfig, updateConfig, uploadLogo, deleteLogo } from '../services/configApi';
import { login, changePassword, verifyToken, logout } from '../services/authApi';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import RichTextEditor from '../components/RichTextEditor';
import UserManagement from '../components/UserManagement';

function Backoffice() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('look-and-feel'); // 'look-and-feel', 'permanent-info', 'login-settings', 'user-management'
  const [config, setConfig] = useState({
    page_name: 'Shift Handover Log',
    permanent_info: '',
    login_expiry_enabled: true,
    login_expiry_hours: 24,
    header_color: '#2563eb',
    header_logo_type: 'none',
    header_logo_image: '',
    header_logo_emoji: ''
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
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
        login_expiry_hours: data.login_expiry_hours || 24,
        header_color: data.header_color || '#2563eb',
        header_logo_type: data.header_logo_type || 'none',
        header_logo_image: data.header_logo_image || '',
        header_logo_emoji: data.header_logo_emoji || ''
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
      if (config.header_color) {
        localStorage.setItem('header_color', config.header_color);
      }
      if (config.header_logo_type) {
        localStorage.setItem('header_logo_type', config.header_logo_type);
      }
      if (config.header_logo_image) {
        localStorage.setItem('header_logo_image', config.header_logo_image);
      }
      if (config.header_logo_emoji) {
        localStorage.setItem('header_logo_emoji', config.header_logo_emoji);
      }
      window.dispatchEvent(new CustomEvent('pageNameUpdated'));
      window.dispatchEvent(new CustomEvent('headerColorUpdated'));
      window.dispatchEvent(new CustomEvent('headerLogoUpdated'));
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

  const tabs = [
    { id: 'look-and-feel', label: 'Page Look and Feel' },
    { id: 'permanent-info', label: 'Permanent Information Editor' },
    { id: 'login-settings', label: 'Login Settings' },
    { id: 'user-management', label: 'User Management' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'look-and-feel':
        return (
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

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={config.header_color}
                    onChange={(e) => handleChange('header_color', e.target.value)}
                    className="w-12 h-12 p-1 rounded border border-gray-300 cursor-pointer"
                    title="Choose header color"
                  />
                  <input
                    type="text"
                    value={config.header_color}
                    onChange={(e) => handleChange('header_color', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="#2563eb"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('header_color', '#2563eb')}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Reset to Default
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a custom color for the top header bar. This color will also be applied to buttons throughout the application.
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Header Logo / Emoji
                </label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="logo_type"
                        value="none"
                        checked={config.header_logo_type === 'none'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">None</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="logo_type"
                        value="image"
                        checked={config.header_logo_type === 'image'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Image</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="logo_type"
                        value="emoji"
                        checked={config.header_logo_type === 'emoji'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Emoji</span>
                    </label>
                  </div>

                  {config.header_logo_type === 'image' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Logo
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                setMessage({ type: 'error', text: 'File size must be less than 2MB' });
                                return;
                              }
                              setUploadingLogo(true);
                              try {
                                const result = await uploadLogo(file);
                                handleChange('header_logo_image', result.data.logo_path);
                                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                                setTimeout(() => setMessage(null), 3000);
                              } catch (error) {
                                setMessage({ type: 'error', text: error.message });
                              } finally {
                                setUploadingLogo(false);
                              }
                            }
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          disabled={uploadingLogo}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Supported formats: JPG, PNG, GIF, SVG, WebP. Max size: 2MB
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Or enter image URL
                        </label>
                        <input
                          type="text"
                          value={config.header_logo_image}
                          onChange={(e) => handleChange('header_logo_image', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      {config.header_logo_image && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <div className="flex items-center space-x-3">
                            <img
                              src={config.header_logo_image.startsWith('http') || config.header_logo_image.startsWith('/') 
                                ? config.header_logo_image 
                                : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8500'}${config.header_logo_image}`}
                              alt="Logo preview"
                              className="h-12 w-auto border border-gray-300 rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm('Remove logo?')) {
                                  try {
                                    await deleteLogo();
                                    handleChange('header_logo_type', 'none');
                                    handleChange('header_logo_image', '');
                                    setMessage({ type: 'success', text: 'Logo removed successfully!' });
                                    setTimeout(() => setMessage(null), 3000);
                                  } catch (error) {
                                    setMessage({ type: 'error', text: error.message });
                                  }
                                }
                              }}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
                            >
                              Remove Logo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {config.header_logo_type === 'emoji' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Emoji
                        </label>
                        <input
                          type="text"
                          value={config.header_logo_emoji}
                          onChange={(e) => handleChange('header_logo_emoji', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl"
                          placeholder="🏨"
                          maxLength={10}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Enter an emoji or text to display next to the page title
                        </p>
                      </div>
                      {config.header_logo_emoji && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{config.header_logo_emoji}</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('header_logo_emoji', '');
                                handleChange('header_logo_type', 'none');
                              }}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 underline"
                            >
                              Remove Emoji
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--header-color)' }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        );

      case 'permanent-info':
        return (
          <div className="space-y-6">
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

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--header-color)' }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        );

      case 'login-settings':
        return (
          <div className="space-y-6">
            <div>
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

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--header-color)' }}
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        );

      case 'user-management':
        return (
          <div>
            <UserManagement />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow">
            {/* Header with Logout */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold">Backoffice Configuration</h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>

            {/* Horizontal Menu Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-1 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mx-6 mt-4 p-4 rounded ${
                message.type === 'success' 
                  ? 'bg-green-100 border border-green-400 text-green-700' 
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Backoffice;
