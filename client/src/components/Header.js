import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const [pageName, setPageName] = useState('Shift Handover Log');
  const [headerColor, setHeaderColor] = useState('#2563eb'); // Default blue
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Load page name and color from localStorage or API
    const savedPageName = localStorage.getItem('page_name');
    if (savedPageName) {
      setPageName(savedPageName);
    }
    const savedColor = localStorage.getItem('header_color');
    if (savedColor) {
      setHeaderColor(savedColor);
    }

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, []);

    // Listen for config changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'page_name' || !e.key) {
        const savedPageName = localStorage.getItem('page_name');
        if (savedPageName) setPageName(savedPageName);
      }
      if (e.key === 'header_color' || !e.key) {
        const savedColor = localStorage.getItem('header_color');
        if (savedColor) setHeaderColor(savedColor);
      }
    };

    const handleCustomUpdate = () => {
      const savedPageName = localStorage.getItem('page_name');
      if (savedPageName) setPageName(savedPageName);
      
      const savedColor = localStorage.getItem('header_color');
      if (savedColor) setHeaderColor(savedColor);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pageNameUpdated', handleCustomUpdate);
    window.addEventListener('headerColorUpdated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageNameUpdated', handleCustomUpdate);
      window.removeEventListener('headerColorUpdated', handleCustomUpdate);
    };
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Helper to determine if text should be white or black based on background color
  const getTextColor = (hexColor) => {
    // Remove hash if present
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Calculate luminance
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'text-gray-900' : 'text-white';
  };

  const textColorClass = getTextColor(headerColor);

  return (
    <header 
      className={`shadow-lg transition-colors duration-200 ${textColorClass}`}
      style={{ backgroundColor: headerColor }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">
              {pageName}
            </h1>
            {location.pathname !== '/backoffice' && (
              <Link
                to="/backoffice"
                className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
                title="Admin Settings (Login Required)"
              >
                ⚙️ Admin
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm md:text-base font-mono">
              {formattedDateTime}
            </div>
            {location.pathname === '/backoffice' && (
              <Link
                to="/"
                className="text-sm underline hover:no-underline opacity-80 hover:opacity-100"
              >
                ← Back to Logs
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

