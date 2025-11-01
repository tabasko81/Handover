import React, { useState, useEffect } from 'react';

function Header({ darkMode, onToggleDarkMode }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(timer);
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
    <header className={`${darkMode ? 'bg-gray-800' : 'bg-blue-600'} text-white shadow-lg`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-0">
            Shift Handover Log
          </h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm md:text-base font-mono">
              {formattedDateTime}
            </div>
            <button
              onClick={onToggleDarkMode}
              className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md text-sm transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

