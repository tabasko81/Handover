import React, { useEffect } from 'react';

function ThemeToggle() {
  useEffect(() => {
    initTheme();
  }, []);

  const initTheme = () => {
    const savedTheme = localStorage.getItem('daynight-theme');
    if (savedTheme === 'carbon') {
      document.documentElement.classList.add('carbon');
      document.body.classList.add('carbon');
    } else {
      document.documentElement.classList.remove('carbon');
      document.body.classList.remove('carbon');
    }
    updateThemeButtons(savedTheme === 'carbon' ? 'carbon' : 'snow');
  };

  const setTheme = (theme) => {
    if (theme === 'carbon') {
      document.documentElement.classList.add('carbon');
      document.body.classList.add('carbon');
      localStorage.setItem('daynight-theme', 'carbon');
    } else {
      document.documentElement.classList.remove('carbon');
      document.body.classList.remove('carbon');
      localStorage.setItem('daynight-theme', 'snow');
    }
    updateThemeButtons(theme);
  };

  const updateThemeButtons = (theme) => {
    const snowBtns = document.querySelectorAll('.theme-btn-snow');
    const carbonBtns = document.querySelectorAll('.theme-btn-carbon');
    snowBtns.forEach((btn) => {
      btn.classList.toggle('active', theme === 'snow');
    });
    carbonBtns.forEach((btn) => {
      btn.classList.toggle('active', theme === 'carbon');
    });
  };

  return (
    <div className="theme-toggle">
      <button
        type="button"
        className="theme-btn theme-btn-snow active"
        onClick={() => setTheme('snow')}
        title="Light mode"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>
      <button
        type="button"
        className="theme-btn theme-btn-carbon"
        onClick={() => setTheme('carbon')}
        title="Dark mode"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  );
}

export default ThemeToggle;
