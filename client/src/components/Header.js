import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();
  const [pageName, setPageName] = useState('Shift Handover Log');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Load page name from localStorage or API
    const savedPageName = localStorage.getItem('page_name');
    if (savedPageName) {
      setPageName(savedPageName);
    }

    // Cleanup interval on unmount
    return () => clearInterval(timer);
  }, []);

    // Listen for page name changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'page_name' || !e.key) {
        const savedPageName = localStorage.getItem('page_name');
        if (savedPageName) {
          setPageName(savedPageName);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom events
    window.addEventListener('pageNameUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageNameUpdated', handleStorageChange);
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

  return (
    <header className="bg-blue-600 text-white shadow-lg">
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
                title="Backoffice Settings"
              >
                ⚙️ Settings
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

