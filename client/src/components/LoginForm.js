import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

function LoginForm({ onLogin, firstLogin, onPasswordChange }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await onPasswordChange(currentPassword, newPassword);
      setError('');
      // After successful password change, login with new password
      await onLogin(username, newPassword);
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const loginContent = (title, subtitle, formContent, onSubmit) => (
    <div className="login-page">
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <ThemeToggle />
      </div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span>Handover</span>
            </div>
            <h2 className="login-title">{title}</h2>
            <p className="login-subtitle">{subtitle}</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="login-form">
            {formContent}
          </form>
        </div>
      </div>
    </div>
  );

  if (firstLogin) {
    return loginContent(
      'First Login - Change Password',
      'You must change the default password before accessing settings.',
      <>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            required
            placeholder="admin"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="form-input"
            required
            placeholder="admin"
          />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="form-input"
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            required
            minLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Changing Password...' : 'Change Password & Login'}
        </button>
      </>,
      handlePasswordChange
    );
  }

  return loginContent(
    'Admin Login',
    'Enter your admin credentials to access settings.',
    <>
      <div className="form-group">
        <label className="form-label">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
          required
          placeholder="admin"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </>,
    handleLogin
  );
}

export default LoginForm;

