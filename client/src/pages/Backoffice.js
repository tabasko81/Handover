import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchConfig, updateConfig, uploadLogo, deleteLogo } from '../services/configApi';
import { login, changePassword, verifyToken, logout } from '../services/authApi';
import LoginForm from '../components/LoginForm';
import Header from '../components/Header';
import TiptapRichTextEditor from '../components/TiptapRichTextEditor';
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
      <div className="login-page">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Page Name</label>
              <input
                type="text"
                value={config.page_name}
                onChange={(e) => handleChange('page_name', e.target.value)}
                className="form-input"
                placeholder="Enter page name"
              />
              <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                This name will be displayed in the header
              </p>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Appearance</h3>
              
              <div className="form-group">
                <label className="form-label">Header Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="color"
                    value={config.header_color}
                    onChange={(e) => handleChange('header_color', e.target.value)}
                    className="form-input"
                    style={{ width: '48px', height: '48px', padding: '4px', cursor: 'pointer' }}
                    title="Choose header color"
                  />
                  <input
                    type="text"
                    value={config.header_color}
                    onChange={(e) => handleChange('header_color', e.target.value)}
                    className="form-input"
                    style={{ width: '120px', textTransform: 'uppercase' }}
                    placeholder="#2563eb"
                    maxLength={7}
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('header_color', '#2563eb')}
                    className="btn btn-ghost"
                  >
                    Reset to Default
                  </button>
                </div>
                <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                  Choose a custom color for the top header bar. This color will also be applied to buttons throughout the application.
                </p>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Header Logo / Emoji</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="logo_type"
                        value="none"
                        checked={config.header_logo_type === 'none'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                      />
                      <span className="card-subtitle" style={{ margin: 0 }}>None</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="logo_type"
                        value="image"
                        checked={config.header_logo_type === 'image'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                      />
                      <span className="card-subtitle" style={{ margin: 0 }}>Image</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="logo_type"
                        value="emoji"
                        checked={config.header_logo_type === 'emoji'}
                        onChange={(e) => handleChange('header_logo_type', e.target.value)}
                      />
                      <span className="card-subtitle" style={{ margin: 0 }}>Emoji</span>
                    </label>
                  </div>

                  {config.header_logo_type === 'image' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Upload Logo</label>
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
                          className="form-input"
                          disabled={uploadingLogo}
                        />
                        <p className="card-subtitle" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                          Supported formats: JPG, PNG, GIF, SVG, WebP. Max size: 2MB
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Or enter image URL</label>
                        <input
                          type="text"
                          value={config.header_logo_image}
                          onChange={(e) => handleChange('header_logo_image', e.target.value)}
                          className="form-input"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                      {config.header_logo_image && (
                        <div className="form-group">
                          <p className="form-label">Preview:</p>
                          <div className="flex items-center space-x-3">
                            <img
                              src={config.header_logo_image.startsWith('http') || config.header_logo_image.startsWith('/') 
                                ? config.header_logo_image 
                                : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8500'}${config.header_logo_image}`}
                              alt="Logo preview"
                              style={{ height: '48px', width: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}
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
                              className="btn btn-ghost"
                              style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                            >
                              Remove Logo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {config.header_logo_type === 'emoji' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label">Emoji</label>
                        <input
                          type="text"
                          value={config.header_logo_emoji}
                          onChange={(e) => handleChange('header_logo_emoji', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '1.5rem' }}
                          placeholder="🏨"
                          maxLength={10}
                        />
                        <div className="card" style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--accent-light)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                          <p className="card-title" style={{ marginBottom: '0.25rem', color: 'var(--accent)' }}>
                            How to add an emoji:
                          </p>
                          <ol className="card-subtitle" style={{ margin: 0, paddingLeft: '1.25rem' }}>
                            <li>Visit <a href="https://emojipedia.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Emojipedia.org</a> to browse emojis</li>
                            <li>Click on any emoji you like</li>
                            <li>Click the "Copy" button below the emoji</li>
                            <li>Paste it into the field above (Ctrl+V or right-click → Paste)</li>
                          </ol>
                        </div>
                        <p className="card-subtitle" style={{ marginTop: '0.5rem' }}>
                          Enter an emoji or text to display next to the page title
                        </p>
                      </div>
                      {config.header_logo_emoji && (
                        <div className="form-group">
                          <p className="form-label">Preview:</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.875rem' }}>{config.header_logo_emoji}</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('header_logo_emoji', '');
                                handleChange('header_logo_type', 'none');
                              }}
                              className="btn btn-ghost"
                              style={{ color: 'var(--danger)', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
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

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-header"
                title="Save all configuration changes - page name, header color, logo settings, and other preferences"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        );

      case 'permanent-info':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Permanent Information</label>
              <TiptapRichTextEditor
                value={config.permanent_info || ''}
                onChange={(html) => handleChange('permanent_info', html)}
                maxLength={5000}
                placeholder="Enter permanent information that will be visible in the info panel... Use @user or @all to mention someone."
              />
              <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                This information will be displayed in the permanent info slide (accessible via the (i) button on the left). Use the formatting buttons to format the text.
              </p>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-header"
                title="Save all configuration changes - page name, header color, logo settings, and other preferences"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        );

      case 'login-settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 className="card-title" style={{ marginBottom: '1rem' }}>Login Settings</h3>
              
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.login_expiry_enabled}
                    onChange={(e) => handleChange('login_expiry_enabled', e.target.checked)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div>
                    <span className="form-label" style={{ marginBottom: '0.25rem' }}>Enable Login Expiry</span>
                    <p className="card-subtitle" style={{ margin: 0 }}>When enabled, users must re-login after the set time period</p>
                  </div>
                </label>
              </div>

              {config.login_expiry_enabled && (
                <div className="form-group" style={{ paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)' }}>
                  <label className="form-label">Login Expiry (Hours)</label>
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
                    className="form-input"
                  />
                  <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                    How long the login session lasts. Range: 1 hour to 168 hours (1 week). Default: 24 hours.
                  </p>
                </div>
              )}

              {!config.login_expiry_enabled && (
                <div style={{ paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-color)' }}>
                  <p className="card-subtitle" style={{ fontStyle: 'italic' }}>
                    Login sessions will not expire. Users will remain logged in until they manually log out.
                  </p>
                </div>
              )}
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-header"
                title="Save all configuration changes - page name, header color, logo settings, and other preferences"
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
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header with Logout */}
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h1 className="greeting" style={{ margin: 0, fontSize: '1.5rem' }}>Backoffice Configuration</h1>
            <button
              onClick={handleLogout}
              className="btn btn-danger"
            >
              Logout
            </button>
          </div>

          {/* Horizontal Menu Tabs */}
          <div className="settings-nav" style={{ marginBottom: 0, padding: '0 1.5rem' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-link ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Message Display */}
          {message && (
            <div className={message.type === 'success' ? 'alert alert-success' : 'alert alert-error'}
              style={{ margin: '1rem 1.5rem' }}
            >
              {message.text}
            </div>
          )}

          {/* Tab Content */}
          <div style={{ padding: '1.5rem' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Backoffice;
